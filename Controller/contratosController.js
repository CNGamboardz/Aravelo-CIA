const contratosModel = require('../Model/contratosModel');
const { encriptarId, desencriptarId } = require('./cryptoHelper');

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

    const contrato = await contratosModel.crearContrato({
      id_cliente: desencriptarId(id_cliente),
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
