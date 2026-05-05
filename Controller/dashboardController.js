const dashboardModel = require('../Model/dashboardModel');

const dashboard = async (req, res) => {
  const ventas = await dashboardModel.getVentasMes();
  const cartera = await dashboardModel.getCarteraVencida();

  res.json({
    ventas,
    cartera
  });
};

module.exports = { dashboard };