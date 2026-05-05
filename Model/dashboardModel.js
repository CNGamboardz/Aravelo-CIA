const db = require('./db');

const getVentasMes = async () => {
  const res = await db.query('SELECT * FROM sistema.ventas_mes');
  return res.rows[0];
};

const getCarteraVencida = async () => {
  const res = await db.query('SELECT * FROM sistema.cartera_vencida');
  return res.rows[0];
};

module.exports = {
  getVentasMes,
  getCarteraVencida
};