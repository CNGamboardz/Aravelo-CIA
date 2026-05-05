const clientesModel = require('../Model/clientesModel');

// GET
const obtenerClientes = async (req, res) => {
  const data = await clientesModel.getClientes();
  res.json(data);
};

// POST
const guardarCliente = async (req, res) => {
  const nuevo = await clientesModel.crearCliente(req.body);
  res.json(nuevo);
};

module.exports = {
  obtenerClientes,
  guardarCliente
};