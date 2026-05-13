const clientesModel = require('../Model/clientesModel');
const { encriptarId, desencriptarId } = require('./cryptoHelper');

// GET
const obtenerClientes = async (req, res) => {
  const data = await clientesModel.getClientes();
  // Encriptar id_asesor para que la vista reciba y compare strings de forma homogénea y privada
  const ofuscados = data.map(c => ({
    ...c,
    id_asesor: c.id_asesor ? encriptarId(c.id_asesor) : null
  }));
  res.json(ofuscados);
};

// POST
const guardarCliente = async (req, res) => {
  if (req.body.id_asesor) {
    req.body.id_asesor = desencriptarId(req.body.id_asesor);
  }
  const nuevo = await clientesModel.crearCliente(req.body);
  res.json({
    ...nuevo,
    id_asesor: nuevo && nuevo.id_asesor ? encriptarId(nuevo.id_asesor) : null
  });
};

const actualizarCliente = async (req, res) => {
  try {
    const { id } = req.params;
    if (req.body.id_asesor) {
      req.body.id_asesor = desencriptarId(req.body.id_asesor);
    }
    const modificado = await clientesModel.actualizarClienteDB(id, req.body);
    res.json({
      ...modificado,
      id_asesor: modificado && modificado.id_asesor ? encriptarId(modificado.id_asesor) : null
    });
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