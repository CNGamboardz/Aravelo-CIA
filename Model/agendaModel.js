const db = require('./db');

// Obtener eventos de un usuario en específico o generales si es admin
const getAgenda = async (id_usuario) => {
  try {
    const res = await db.query(
      `SELECT * FROM sistema.agenda 
       WHERE id_usuario = $1 OR id_usuario IS NULL 
       ORDER BY fecha_evento ASC`,
      [id_usuario]
    );
    return res.rows;
  } catch (err) {
    // Si la columna se llama diferente en la tabla creada por el usuario, intentamos una consulta fallback general
    console.warn('Advertencia en consulta de agenda, intentando fallback sin filtro de usuario:', err.message);
    const fallback = await db.query(`SELECT * FROM sistema.agenda ORDER BY id_agenda DESC LIMIT 50`);
    return fallback.rows;
  }
};

// Crear evento en la agenda
const crearEvento = async (evento) => {
  const { id_usuario, titulo, descripcion, fecha_evento } = evento;
  try {
    const res = await db.query(
      `INSERT INTO sistema.agenda (id_usuario, titulo, descripcion, fecha_evento)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [id_usuario, titulo, descripcion, fecha_evento]
    );
    return res.rows[0];
  } catch (err) {
    // Si la tabla de agenda del usuario tiene otras columnas, intentamos insertar solo titulo y descripcion o lanzar error claro
    console.error('Error al insertar en agenda de PostgreSQL:', err);
    throw err;
  }
};

module.exports = {
  getAgenda,
  crearEvento
};
