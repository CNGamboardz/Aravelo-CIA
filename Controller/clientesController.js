const clientesModel = require('../Model/clientesModel');
const { encriptarId, desencriptarId } = require('./cryptoHelper');

// GET
const obtenerClientes = async (req, res) => {
  const data = await clientesModel.getClientes();
  // Encriptar id_asesor unificado para que el asesor vea tanto a los que agregó como a los que lo asignaron desde el portal
  const ofuscados = data.map(c => {
    return {
      ...c,
      id_asesor: c.id_asesor ? encriptarId(c.id_asesor) : null,
      id_asesor_asignado: c.id_asesor_asignado ? encriptarId(c.id_asesor_asignado) : null
    };
  });
  res.json(ofuscados);
};

// POST
const guardarCliente = async (req, res) => {
  if (req.body.id_asesor) {
    req.body.id_asesor = desencriptarId(req.body.id_asesor);
  }
  if (req.body.id_asesor_asignado) {
    req.body.id_asesor_asignado = desencriptarId(req.body.id_asesor_asignado);
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

    // Bloqueo de seguridad: Si la etapa actual del cliente en la DB es 'Cancelado', denegar cambios
    const db = require('../Model/db');
    const queryActual = await db.query('SELECT etapa FROM sistema.clientes WHERE id_cliente = $1', [id]);
    if (queryActual.rows.length > 0 && queryActual.rows[0].etapa === 'Cancelado') {
      return res.status(400).json({ error: 'Acceso denegado: El registro de este cliente está cancelado y bloqueado contra edición o eliminación.' });
    }

    if (req.body.id_asesor) {
      req.body.id_asesor = desencriptarId(req.body.id_asesor);
    }
    if (req.body.id_asesor_asignado) {
      req.body.id_asesor_asignado = desencriptarId(req.body.id_asesor_asignado);
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

    // Bloqueo de seguridad: Si la etapa actual del cliente en la DB es 'Cancelado', denegar eliminación
    const db = require('../Model/db');
    const queryActual = await db.query('SELECT etapa FROM sistema.clientes WHERE id_cliente = $1', [id]);
    if (queryActual.rows.length > 0 && queryActual.rows[0].etapa === 'Cancelado') {
      return res.status(400).json({ error: 'Acceso denegado: El registro de este cliente está cancelado y bloqueado contra edición o eliminación.' });
    }

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