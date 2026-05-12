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

const actualizarCliente = async (req, res) => {
  try {
    const { id } = req.params;
    const modificado = await clientesModel.actualizarClienteDB(id, req.body);
    res.json(modificado);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Error al actualizar cliente' });
  }
};

const eliminarCliente = async (req, res) => {
  try {
    const { id } = req.params;
    await clientesModel.eliminarClienteDB(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Error al eliminar cliente' });
  }
};

module.exports = {
  obtenerClientes,
  guardarCliente,
  actualizarCliente,
  eliminarCliente
};