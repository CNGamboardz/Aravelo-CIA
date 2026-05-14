const pool = require('../Model/db.js');

async function run() {
  try {
    await pool.query('ALTER TABLE sistema.clientes ADD COLUMN fuente_lead VARCHAR;');
    console.log("Columna fuente_lead añadida exitosamente.");
  } catch (e) {
    console.error("Error:", e.message);
  } finally {
    pool.end();
  }
}
run();
