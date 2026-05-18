const pagosModel = require('../Model/pagosModel');
const { encriptarId, desencriptarId, obtenerResponsable } = require('./cryptoHelper');
const dashboardModel = require('../Model/dashboardModel');

const listarCalendario = async (req, res) => {
  try {
    // Auditar riesgos antes de listar (Pipeline)
    await pagosModel.auditarRiesgosDB();
    
    const data = await pagosModel.getCalendarioCobranza();
    const ofuscados = data.map(item => ({
      ...item,
      id_asesor: item.id_asesor ? encriptarId(item.id_asesor) : null,
      id_asesor_asignado: item.id_asesor_asignado ? encriptarId(item.id_asesor_asignado) : null
    }));
    res.json(ofuscados);
  } catch (error) {
    console.error('Error al listar calendario de pagos:', error);
    res.status(500).json({ error: 'Error al consultar las proyecciones de cobro' });
  }
};

const listarPagos = async (req, res) => {
  try {
    const data = await pagosModel.getPagosReales();
    const ofuscados = data.map(item => ({
      ...item,
      id_usuario: item.id_usuario ? encriptarId(item.id_usuario) : null,
      id_asesor: item.id_asesor ? encriptarId(item.id_asesor) : null,
      id_asesor_asignado: item.id_asesor_asignado ? encriptarId(item.id_asesor_asignado) : null
    }));
    res.json(ofuscados);
  } catch (error) {
    console.error('Error al listar pagos reales:', error);
    res.status(500).json({ error: 'Error al consultar historial de ingresos' });
  }
};

const aplicarPago = async (req, res) => {
  try {
    const { id_cliente, id_contrato, id_terreno, concepto, monto, metodo_pago, id_usuario, comprobante, id_calendario } = req.body;

    const idUsuarioReal = id_usuario ? desencriptarId(id_usuario) : null;
    if (idUsuarioReal) {
      const userRes = await require('../Model/db').query('SELECT rol FROM sistema.usuarios WHERE id_usuario = $1', [idUsuarioReal]);
      if (userRes.rows.length > 0) {
        const rol = (userRes.rows[0].rol || '').toLowerCase();
        if (rol === 'asesor' || rol === 'vendedor') {
          return res.status(403).json({ error: 'Acceso denegado: Los asesores no tienen permitido registrar o editar pagos.' });
        }
      }
    }

    // Regla de Negocio: No registrar un pago sin tener un contrato
    const idContratoReal = desencriptarId(id_contrato);
    if (!idContratoReal) {
      return res.status(400).json({ error: 'Regla de negocio: No se permite registrar pagos sin un contrato asociado y válido.' });
    }

    const contractRes = await require('../Model/db').query('SELECT estatus FROM sistema.contratos WHERE id_contrato = $1', [idContratoReal]);
    if (contractRes.rows.length > 0) {
      const estatus = (contractRes.rows[0].estatus || '').toLowerCase().trim();
      if (estatus === 'liquidado' || estatus === 'cancelado') {
        return res.status(400).json({ error: `Acceso denegado: El contrato está ${estatus} y se encuentra cerrado para recibir nuevos pagos.` });
      }
    }

    if (!monto || parseFloat(monto) <= 0) {
      return res.status(400).json({ error: 'El monto del pago debe ser mayor a cero' });
    }

    const pago = await pagosModel.registrarPago({
      id_cliente: desencriptarId(id_cliente) || null,
      id_contrato: idContratoReal,
      id_terreno: desencriptarId(id_terreno) || null,
      concepto: concepto || 'mensualidad',
      monto: parseFloat(monto),
      metodo_pago: metodo_pago || 'efectivo',
      id_usuario: idUsuarioReal,
      comprobante: comprobante || '',
      id_calendario: id_calendario ? desencriptarId(id_calendario) : null
    });

    // Registrar en el historial de auditoría
    const responsable = await obtenerResponsable(req);
    await dashboardModel.registrarMovimiento(
      'pagos',
      'creacion',
      `Ingreso registrado: abono de $${parseFloat(monto).toLocaleString('es-MX', {minimumFractionDigits:2})} mediante ${metodo_pago || 'efectivo'} para Contrato ID ${pago.id_contrato} (Concepto: ${concepto || 'mensualidad'}).`,
      responsable,
      pago.id_pago
    );

    res.status(201).json({
      mensaje: 'Pago registrado exitosamente en el sistema',
      pago
    });
  } catch (error) {
    console.error('Error en controlador de pagos:', error);
    res.status(500).json({ error: 'No se pudo aplicar el pago: ' + error.message });
  }
};

const confirmarPago = async (req, res) => {
  try {
    const { id_pago } = req.body;
    const idPagoReal = desencriptarId(id_pago);
    if (!idPagoReal) {
      return res.status(400).json({ error: 'Folio de pago no válido' });
    }

    const client = await require('../Model/db').connect();
    try {
      await client.query('BEGIN');

      // 1. Obtener datos del pago
      const pRes = await client.query('SELECT * FROM sistema.pagos WHERE id_pago = $1', [idPagoReal]);
      if (pRes.rows.length === 0) {
        throw new Error('Pago no encontrado');
      }
      const pago = pRes.rows[0];

      if (pago.estatus === 'pagado') {
        throw new Error('El pago ya se encuentra en estatus Confirmado / Pagado');
      }

      // 2. Cambiar estatus a pagado
      await client.query("UPDATE sistema.pagos SET estatus = 'pagado' WHERE id_pago = $1", [idPagoReal]);

      // 3. Si tiene CAL_REF: en comprobante, actualizar el calendario de pagos
      if (pago.comprobante && pago.comprobante.startsWith('CAL_REF:')) {
        const idCalComp = pago.comprobante.split(' ')[0].split(':')[1];
        await client.query("UPDATE sistema.calendario_pagos SET estatus = 'pagado' WHERE id_calendario = $1", [idCalComp]);
      }

      // 4. Lógica de recuperación de etapa de cliente
      const resCli = await client.query('SELECT etapa FROM sistema.clientes WHERE id_cliente = $1', [pago.id_cliente]);
      if (resCli.rows.length > 0) {
        const etapaActual = resCli.rows[0].etapa;
        let nuevaEtapa = 'Cliente activo';
        if (etapaActual === 'Moroso' || etapaActual === 'Cancelado') {
          nuevaEtapa = 'Recuperado';
        }
        await client.query('UPDATE sistema.clientes SET etapa = $1 WHERE id_cliente = $2', [nuevaEtapa, pago.id_cliente]);
      }

      await client.query('COMMIT');

      // 5. Registrar en auditoría
      const responsable = await obtenerResponsable(req);
      await dashboardModel.registrarMovimiento(
        'pagos',
        'edicion',
        `Confirmación de entrada de dinero: Aprobado abono de $${parseFloat(pago.monto).toLocaleString('es-MX', {minimumFractionDigits:2})} de tipo ${pago.metodo_pago} (ID Pago: ${pago.id_pago}).`,
        responsable,
        pago.id_pago
      );

      res.json({ mensaje: 'Pago confirmado exitosamente y aplicado a balances reales.' });
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error al confirmar pago:', error);
    res.status(500).json({ error: 'No se pudo confirmar el pago: ' + error.message });
  }
};

const rechazarPago = async (req, res) => {
  try {
    const { id_pago } = req.body;
    const idPagoReal = desencriptarId(id_pago);
    if (!idPagoReal) {
      return res.status(400).json({ error: 'Folio de pago no válido' });
    }

    const pRes = await require('../Model/db').query('SELECT * FROM sistema.pagos WHERE id_pago = $1', [idPagoReal]);
    if (pRes.rows.length === 0) {
      return res.status(404).json({ error: 'Pago no encontrado en el sistema' });
    }
    const pago = pRes.rows[0];

    // Eliminar el registro
    await require('../Model/db').query('DELETE FROM sistema.pagos WHERE id_pago = $1', [idPagoReal]);

    // Registrar en auditoría
    const responsable = await obtenerResponsable(req);
    await dashboardModel.registrarMovimiento(
      'pagos',
      'eliminacion',
      `Rechazo de pago pendiente: Eliminado registro de abono pendiente por $${parseFloat(pago.monto).toLocaleString('es-MX', {minimumFractionDigits:2})} mediante ${pago.metodo_pago}.`,
      responsable,
      pago.id_pago
    );

    res.json({ mensaje: 'Pago pendiente rechazado y eliminado del historial de forma segura.' });
  } catch (error) {
    console.error('Error al rechazar pago:', error);
    res.status(500).json({ error: 'No se pudo rechazar el pago: ' + error.message });
  }
};

const purgarFoliosVencidos = async () => {
  try {
    const res = await require('../Model/db').query(
      `DELETE FROM sistema.pagos 
       WHERE metodo_pago IN ('deposito', 'oxxo') 
         AND estatus = 'pendiente' 
         AND CURRENT_DATE - fecha_pago >= 3 
       RETURNING *`
    );
    if (res.rows.length > 0) {
      console.log(`🧹 Auto-limpieza de cobranza: Se eliminaron ${res.rows.length} folios de depósito/Oxxo pendientes vencidos (caducidad de 72 horas excedida).`);
    } else {
      console.log('🧹 Auto-limpieza de cobranza: No se encontraron folios vencidos de 72 horas.');
    }
  } catch (err) {
    console.error('Error al purgar folios vencidos:', err);
  }
};

module.exports = {
  listarCalendario,
  listarPagos,
  aplicarPago,
  confirmarPago,
  rechazarPago,
  purgarFoliosVencidos
};
