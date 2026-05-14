const pool = require('../Model/db.js');
async function getViews() {
  const q = `
    SELECT table_name, pg_get_viewdef('sistema.' || table_name) AS view_definition 
    FROM information_schema.views 
    WHERE table_schema = 'sistema';
  `;
  try {
    const res = await pool.query(q);
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (e) { console.error(e); }
  pool.end();
}
getViews();
