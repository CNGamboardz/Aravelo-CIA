const pool = require('../Model/db.js');
async function run() {
  try {
    const res = await pool.query("SELECT column_name, is_nullable FROM information_schema.columns WHERE table_schema = 'sistema' AND table_name = 'pagos' AND column_name = 'id_terreno';");
    console.table(res.rows);
  } catch (e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
run();
