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

module.exports = {
  getClientes,
  crearCliente
};