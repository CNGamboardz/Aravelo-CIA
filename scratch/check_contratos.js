const pool = require('../Model/db.js');
async function run() {
  try {
    const res = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'sistema' AND table_name = 'contratos' ORDER BY ordinal_position;");
    console.log("COLUMNS FOR 'contratos':");
    console.table(res.rows);
  } catch (e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
run();
