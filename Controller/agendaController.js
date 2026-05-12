const agendaModel = require('../Model/agendaModel');

const listarEventos = async (req, res) => {
  try {
    const id_usuario = req.query.id_usuario ? parseInt(req.query.id_usuario) : null;
    const eventos = await agendaModel.getAgenda(id_usuario);
    res.json(eventos);
  } catch (error) {
    console.error('Error en controlador de agenda:', error);
    res.status(500).json({ error: 'Error al consultar la agenda' });
  }
};

const guardarEvento = async (req, res) => {
  try {
    const { id_usuario, titulo, descripcion, fecha_evento } = req.body;

    if (!titulo || !fecha_evento) {
      return res.status(400).json({ error: 'El título y la fecha son obligatorios' });
    }

    const nuevo = await agendaModel.crearEvento({
      id_usuario: id_usuario || null,
      titulo,
      descripcion: descripcion || '',
      fecha_evento
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
