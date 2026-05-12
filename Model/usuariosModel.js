const db = require('./db');

// Crear un nuevo usuario en la base de datos
const crearUsuario = async (usuario) => {
  const { nombre, correo, password, rol } = usuario;
  const res = await db.query(
    `INSERT INTO sistema.usuarios (nombre, correo, password, rol) 
     VALUES ($1, $2, $3, $4) 
     RETURNING id_usuario, nombre, correo, rol`,
    [nombre, correo, password, rol]
  );
  return res.rows[0];
};

// Obtener un usuario por su correo electrónico
const getUsuarioByCorreo = async (correo) => {
  const res = await db.query(
    `SELECT * FROM sistema.usuarios WHERE correo = $1`,
    [correo]
  );
  return res.rows[0];
};

module.exports = {
  crearUsuario,
  getUsuarioByCorreo
};
