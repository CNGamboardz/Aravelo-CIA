const contratosModel = require('../Model/contratosModel');
const { encriptarId, desencriptarId, obtenerResponsable } = require('./cryptoHelper');
const dashboardModel = require('../Model/dashboardModel');

const listarContratos = async (req, res) => {
  try {
    const lista = await contratosModel.getContratos();
    res.json(lista);
  } catch (error) {
    console.error('Error al listar contratos:', error);
    res.status(500).json({ error: 'Error al consultar contratos en la base de datos' });
  }
};

const guardarContrato = async (req, res) => {
  try {
    const { id_cliente, id_terreno, tipo_plan, precio_total, enganche, plazo, monto_mensual, documento_ref } = req.body;

    if (!id_cliente || !id_terreno || !precio_total) {
      return res.status(400).json({ error: 'Faltan datos obligatorios para emitir el contrato' });
    }

    // Regla de Negocio: No se puede vender un lote sin un cliente asignado
    const idClienteReal = desencriptarId(id_cliente);
    if (!idClienteReal) {
      return res.status(400).json({ error: 'Regla de negocio: No se puede formalizar una venta ni firmar un contrato sin un cliente asignado.' });
    }

    const idAsesorReal = req.body.id_asesor ? desencriptarId(req.body.id_asesor) : null;
    if (idAsesorReal) {
      const userRes = await require('../Model/db').query('SELECT rol FROM sistema.usuarios WHERE id_usuario = $1', [idAsesorReal]);
      if (userRes.rows.length > 0) {
        const rol = (userRes.rows[0].rol || '').toLowerCase();
        if (rol === 'asesor' || rol === 'vendedor') {
          return res.status(403).json({ error: 'Acceso denegado: Los asesores no tienen permitido registrar o editar contratos.' });
        }
      }
    }

    const contrato = await contratosModel.crearContrato({
      id_cliente: idClienteReal,
      id_terreno: desencriptarId(id_terreno),
      id_asesor: req.body.id_asesor ? desencriptarId(req.body.id_asesor) : null,
      tipo_plan: tipo_plan || 'contado',
      precio_total: parseFloat(precio_total),
      enganche: enganche ? parseFloat(enganche) : 0,
      plazo: plazo ? parseInt(plazo) : 0,
      monto_mensual: monto_mensual ? parseFloat(monto_mensual) : 0,
      penalizaciones: req.body.penalizaciones || '',
      documentos_json: req.body.documentos_json || {},
      documento_ref: documento_ref || ''
    });

    // Registrar en el historial de auditoría
    const responsable = await obtenerResponsable(req);
    await dashboardModel.registrarMovimiento(
      'contratos',
      'creacion',
      `Contrato formalizado para Lote ID ${contrato.id_terreno} con Cliente ID ${contrato.id_cliente}. Tipo de plan: ${contrato.tipo_plan}, Precio Total: $${contrato.precio_total.toLocaleString('es-MX', {minimumFractionDigits: 2})}.`,
      responsable,
      contrato.id_contrato
    );

    res.status(201).json({
      mensaje: 'Contrato y calendario financiero generados con éxito',
      contrato
    });
  } catch (error) {
    console.error('Error en controlador de contratos:', error);
    res.status(500).json({ error: error.message || 'Error interno en la base de datos al formalizar el contrato' });
  }
};

module.exports = {
  listarContratos,
  guardarContrato
};
