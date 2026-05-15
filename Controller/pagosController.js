const pagosModel = require('../Model/pagosModel');
const { encriptarId, desencriptarId } = require('./cryptoHelper');

const listarCalendario = async (req, res) => {
  try {
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
