const db = require('./db');

// Obtener terrenos disponibles
const getTerrenos = async () => {
  const res = await db.query(
    "SELECT * FROM sistema.terrenos WHERE estado = 'disponible'"
  );
  return res.rows;
};

module.exports = { getTerrenos };