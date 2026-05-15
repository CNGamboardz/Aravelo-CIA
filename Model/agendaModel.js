const db = require('./db');

// Obtener eventos de un usuario en específico o generales si es admin
const getAgenda = async (id_usuario) => {
  try {
    const res = await db.query(
      `SELECT * FROM sistema.agenda 
       WHERE id_usuario = $1 OR id_usuario IS NULL 
       ORDER BY fecha_inicio ASC`,
      [id_usuario]
    );
    return res.rows;
  } catch (err) {
    console.warn('Advertencia en consulta de agenda, intentando fallback general:', err.message);
    const fallback = await db.query(`SELECT * FROM sistema.agenda ORDER BY id_agenda DESC LIMIT 50`);
    return fallback.rows;
  }
};

// Crear evento en la agenda
const crearEvento = async (evento) => {
  const { id_usuario, titulo, descripcion, fecha_inicio, fecha_fin, tipo, id_cliente } = evento;
  try {
    const res = await db.query(
      `INSERT INTO sistema.agenda (id_usuario, titulo, descripcion, fecha_inicio, fecha_fin, tipo, id_cliente)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [id_usuario, titulo, descripcion, fecha_inicio, fecha_fin || fecha_inicio, tipo || 'cita', id_cliente || null]
    );
    return res.rows[0];
  } catch (err) {
    console.error('Error al insertar en agenda de PostgreSQL:', err);
    throw err;
  }
};

module.exports = {
  getAgenda,
  crearEvento
};
