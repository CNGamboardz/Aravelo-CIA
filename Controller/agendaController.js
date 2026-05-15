const agendaModel = require('../Model/agendaModel');
const { desencriptarId } = require('./cryptoHelper');

const listarEventos = async (req, res) => {
  try {
    let id_usuario = null;
    if (req.query.id_usuario && req.query.id_usuario !== 'undefined' && req.query.id_usuario !== 'null') {
      const dec = desencriptarId(req.query.id_usuario);
      const parsed = (dec || req.query.id_usuario);
      if (parsed) id_usuario = parsed;
    }
    const eventos = await agendaModel.getAgenda(id_usuario);
    res.json(eventos);
  } catch (error) {
    console.error('Error en controlador de agenda:', error);
    res.status(500).json({ error: 'Error al consultar la agenda' });
  }
};

const guardarEvento = async (req, res) => {
  try {
    let { id_usuario, titulo, descripcion, fecha_inicio, fecha_fin, tipo, id_cliente } = req.body;

    if (!titulo || !fecha_inicio) {
      return res.status(400).json({ error: 'El título y la fecha de inicio son obligatorios' });
    }

    let idLimpio = null;
    if (id_usuario && id_usuario !== 'undefined' && id_usuario !== 'null') {
      const dec = desencriptarId(id_usuario);
      const parsed = (dec || id_usuario);
      if (parsed) idLimpio = parsed;
    }

    const nuevo = await agendaModel.crearEvento({
      id_usuario: idLimpio,
      titulo,
      descripcion: descripcion || '',
      fecha_inicio,
      fecha_fin: fecha_fin || null,
      tipo: tipo || 'cita',
      id_cliente: id_cliente ? desencriptarId(id_cliente) : null
    });

    res.status(201).json(nuevo);
  } catch (error) {
    console.error('Error al guardar evento de agenda:', error);
    res.status(500).json({ error: 'No se pudo guardar el recordatorio en la base de datos' });
  }
};

module.exports = {
  listarEventos,
  guardarEvento
};
