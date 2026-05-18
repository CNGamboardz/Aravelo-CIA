const clientesModel = require('../Model/clientesModel');
const { encriptarId, desencriptarId, obtenerResponsable } = require('./cryptoHelper');
const dashboardModel = require('../Model/dashboardModel');

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
  try {
    if (req.body.id_asesor) {
      req.body.id_asesor = desencriptarId(req.body.id_asesor);
    }
    if (req.body.id_asesor_asignado) {
      req.body.id_asesor_asignado = desencriptarId(req.body.id_asesor_asignado);
    }
    
    const responsable = await obtenerResponsable(req);
    const nuevo = await clientesModel.crearCliente(req.body);
    
    // Dejar registro en el historial
    await dashboardModel.registrarMovimiento(
      'clientes', 
      'creacion', 
      `Creación de expediente para el cliente ${nuevo.nombre} ${nuevo.apellido_paterno || ''} ${nuevo.apellido_materno || ''}.`, 
      responsable, 
      nuevo.id_cliente
    );

    res.json({
      ...nuevo,
      id_asesor: nuevo && nuevo.id_asesor ? encriptarId(nuevo.id_asesor) : null
    });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Error al guardar cliente' });
  }
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

    // Regla de negocio: No se puede cancelar un cliente sin motivo documentado
    if (req.body.etapa === 'Cancelado') {
      const obs = req.body.observaciones || '';
      if (obs.trim().length < 10) {
        return res.status(400).json({ error: 'Regla de negocio: Para cambiar la etapa del cliente a Cancelado, debe documentar un motivo detallado (mínimo 10 caracteres) en el campo de observaciones.' });
      }
    }

    if (req.body.id_asesor) {
      req.body.id_asesor = desencriptarId(req.body.id_asesor);
    }
    if (req.body.id_asesor_asignado) {
      req.body.id_asesor_asignado = desencriptarId(req.body.id_asesor_asignado);
    }
    const modificado = await clientesModel.actualizarClienteDB(id, req.body);
    
    // Dejar registro en el historial
    const responsable = await obtenerResponsable(req);
    const esCancelacion = req.body.etapa === 'Cancelado';
    await dashboardModel.registrarMovimiento(
      'clientes', 
      esCancelacion ? 'cancelacion' : 'edicion', 
      `Actualización de expediente del cliente ${modificado.nombre} ${modificado.apellido_paterno || ''}. Nueva etapa: ${modificado.etapa}. Motivo/Obs: ${modificado.observaciones || 'N/A'}.`, 
      responsable, 
      id
    );

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
    const queryActual = await db.query('SELECT etapa, nombre, apellido_paterno FROM sistema.clientes WHERE id_cliente = $1', [id]);
    if (queryActual.rows.length > 0 && queryActual.rows[0].etapa === 'Cancelado') {
      return res.status(400).json({ error: 'Acceso denegado: El registro de este cliente está cancelado y bloqueado contra edición o eliminación.' });
    }

    const nombreCliente = queryActual.rows.length > 0 ? `${queryActual.rows[0].nombre} ${queryActual.rows[0].apellido_paterno}` : id;

    await clientesModel.eliminarClienteDB(id);

    // Dejar registro en el historial
    const responsable = await obtenerResponsable(req);
    await dashboardModel.registrarMovimiento(
      'clientes', 
      'eliminacion', 
      `Eliminación definitiva del expediente de cliente: ${nombreCliente}.`, 
      responsable, 
      id
    );

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