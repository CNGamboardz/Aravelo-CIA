const pagosModel = require('../Model/pagosModel');
const { encriptarId, desencriptarId } = require('./cryptoHelper');

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

    const idUsuarioReal = desencriptarId(id_usuario);
    if (idUsuarioReal) {
      const userRes = await require('../Model/db').query('SELECT rol FROM sistema.usuarios WHERE id_usuario = $1', [idUsuarioReal]);
      if (userRes.rows.length > 0) {
        const rol = (userRes.rows[0].rol || '').toLowerCase();
        if (rol === 'asesor' || rol === 'vendedor') {
          return res.status(403).json({ error: 'Acceso denegado: Los asesores no tienen permitido registrar o editar pagos.' });
        }
      }
    }

    const idContratoReal = desencriptarId(id_contrato);
    if (idContratoReal) {
      const contractRes = await require('../Model/db').query('SELECT estatus FROM sistema.contratos WHERE id_contrato = $1', [idContratoReal]);
      if (contractRes.rows.length > 0) {
        const estatus = (contractRes.rows[0].estatus || '').toLowerCase().trim();
        if (estatus === 'liquidado' || estatus === 'cancelado') {
          return res.status(400).json({ error: `Acceso denegado: El contrato está ${estatus} y se encuentra cerrado para recibir nuevos pagos.` });
        }
      }
    }

    if (!monto || parseFloat(monto) <= 0) {
      return res.status(400).json({ error: 'El monto del pago debe ser mayor a cero' });
    }

    const pago = await pagosModel.registrarPago({
      id_cliente: desencriptarId(id_cliente) || null,
      id_contrato: desencriptarId(id_contrato) || null,
      id_terreno: desencriptarId(id_terreno) || null,
      concepto: concepto || 'mensualidad',
      monto: parseFloat(monto),
      metodo_pago: metodo_pago || 'efectivo',
      id_usuario: desencriptarId(id_usuario) || null,
      comprobante: comprobante || '',
      id_calendario: desencriptarId(id_calendario) || null
    });

    res.status(201).json({
      mensaje: 'Pago registrado exitosamente en el sistema',
      pago
    });
  } catch (error) {
    console.error('Error en controlador de pagos:', error);
    res.status(500).json({ error: 'No se pudo aplicar el pago: ' + error.message });
  }
};

module.exports = {
  listarCalendario,
  listarPagos,
  aplicarPago
};
