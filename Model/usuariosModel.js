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

// Motor de asimilación automática para extender la tabla de usuarios con datos de vendedores
const asegurarColumnasUsuarios = async () => {
  const columnas = [
    'telefono VARCHAR(20)',
    'ciudad VARCHAR(100)',
    'estado_dir VARCHAR(100)',
    'colonia VARCHAR(150)',
    'calle VARCHAR(150)',
    'numero_exterior VARCHAR(20)',
    'numero_interior VARCHAR(20)',
    'cp VARCHAR(10)',
    'foto TEXT',
    'arroba VARCHAR(50)',
    'estado BOOLEAN DEFAULT true'
  ];
  for (const col of columnas) {
    try {
      await db.query(`ALTER TABLE sistema.usuarios ADD COLUMN IF NOT EXISTS ${col}`);
    } catch (e) {}
  }
};

// Obtener todos los vendedores / usuarios del sistema
const getVendedores = async () => {
  await asegurarColumnasUsuarios();
  const res = await db.query('SELECT id_usuario, nombre, correo, rol, telefono, ciudad, estado_dir, colonia, calle, numero_exterior, numero_interior, cp, foto, arroba, estado FROM sistema.usuarios ORDER BY id_usuario DESC');
  return res.rows;
};

// Obtener un vendedor específico por ID
const getVendedorById = async (id) => {
  await asegurarColumnasUsuarios();
  const res = await db.query('SELECT id_usuario, nombre, correo, rol, telefono, ciudad, estado_dir, colonia, calle, numero_exterior, numero_interior, cp, foto, arroba, estado FROM sistema.usuarios WHERE id_usuario = $1', [id]);
  return res.rows[0];
};

// Actualizar la información completa del perfil del vendedor
const actualizarVendedorDB = async (id, datos) => {
  await asegurarColumnasUsuarios();
  const { nombre, correo, telefono, ciudad, estado_dir, colonia, calle, numero_exterior, numero_interior, cp, foto, arroba, rol, estado } = datos;
  const res = await db.query(
    `UPDATE sistema.usuarios 
     SET nombre = $1, correo = $2, telefono = $3, ciudad = $4, estado_dir = $5, 
         colonia = $6, calle = $7, numero_exterior = $8, numero_interior = $9, 
         cp = $10, foto = $11, arroba = $12, rol = $13, estado = $14
     WHERE id_usuario = $15 
     RETURNING id_usuario, nombre, correo, rol, telefono, ciudad, estado_dir, colonia, calle, numero_exterior, numero_interior, cp, foto, arroba, estado`,
    [
      nombre || '', correo || '', telefono || '', ciudad || '', estado_dir || '', 
      colonia || '', calle || '', numero_exterior || '', numero_interior || '', 
      cp || '', foto || '', arroba || '', rol || 'vendedor', estado !== undefined ? estado : true, id
    ]
  );
  return res.rows[0];
};

// Forzar asimilación global al iniciar
asegurarColumnasUsuarios().then(() => {
  console.log('✅ Esquema de usuarios (sistema.usuarios) verificado y extendido con las columnas del vendedor.');
}).catch(() => {});

module.exports = {
  crearUsuario,
  getUsuarioByCorreo,
  getVendedores,
  getVendedorById,
  actualizarVendedorDB
};
