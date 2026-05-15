const db = require('../Model/db');
async function check() {
  try {
    const res = await db.query("SELECT column_name FROM information_schema.columns WHERE table_schema = 'sistema' AND table_name = 'agenda'");
    console.log(res.rows.map(r => r.column_name));
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}
check();
