const dashboardModel = require('../Model/dashboardModel');

const dashboard = async (req, res) => {
  try {
    const ventas = await dashboardModel.getVentasMes();
    const cartera = await dashboardModel.getCarteraVencida();

    res.json({
      ventas,
      cartera
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getDireccionDashboard = async (req, res) => {
  try {
    const data = await dashboardModel.getDireccionDashboard();
    res.json(data);
  } catch (error) {
    console.error('Error al obtener dashboard de direccion:', error);
    res.status(500).json({ error: 'Error al consultar estadisticas ejecutivas: ' + error.message });
  }
};

const getAuditoriaCompleta = async (req, res) => {
  try {
    const data = await dashboardModel.getAuditoriaCompleta();
    res.json(data);
  } catch (error) {
    console.error('Error al obtener auditoria completa:', error);
    res.status(500).json({ error: 'Error al consultar logs de auditoria: ' + error.message });
  }
};

const obtenerConfiguracion = async (req, res) => {
  try {
    const config = await dashboardModel.getConfiguracion();
    res.json(config);
  } catch (error) {
    console.error('Error al obtener configuracion:', error);
    res.status(500).json({ error: 'No se pudo obtener la configuración' });
  }
};

const guardarConfiguracion = async (req, res) => {
  try {
    await dashboardModel.guardarConfiguracion(req.body);
    res.json({ success: true, mensaje: 'Configuración de recargos actualizada correctamente' });
  } catch (error) {
    console.error('Error al guardar configuracion:', error);
    res.status(500).json({ error: 'No se pudo guardar la configuración' });
  }
};

module.exports = { 
  dashboard,
  getDireccionDashboard,
  getAuditoriaCompleta,
  obtenerConfiguracion,
  guardarConfiguracion
};