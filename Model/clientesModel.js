const db = require('./db');

// Obtener clientes
const getClientes = async () => {
  const res = await db.query('SELECT * FROM sistema.clientes');
  return res.rows;
};

// Crear cliente
const crearCliente = async (cliente) => {
  const { nombre, telefono, email, id_asesor } = cliente;

  const res = await db.query(
    `INSERT INTO sistema.clientes 
    (nombre, telefono, email, id_asesor)
    VALUES ($1, $2, $3, $4) RETURNING *`,
    [nombre, telefono, email, id_asesor]
  );

  return res.rows[0];
};

const actualizarClienteDB = async (id, cliente) => {
  const { nombre, telefono, email } = cliente;
  const res = await db.query(
    `UPDATE sistema.clientes 
     SET nombre = $1, telefono = $2, email = $3
     WHERE id_cliente = $4 RETURNING *`,
    [nombre, telefono, email, id]
  );
  return res.rows[0];
};

const eliminarClienteDB = async (id) => {
  try {
    await db.query(`DELETE FROM sistema.clientes WHERE id_cliente = $1`, [id]);
    return true;
  } catch (e) {
    // Si rompe llave foránea, pasamos el cliente a etapa 'cerrado' o inactivo
    await db.query(`UPDATE sistema.clientes SET etapa = 'inactivo' WHERE id_cliente = $1`, [id]);
    return true;
  }
};

module.exports = {
  getClientes,
  crearCliente,
  actualizarClienteDB,
  eliminarClienteDB
};