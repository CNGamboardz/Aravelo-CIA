const pool = require('../Model/db.js');

async function getCols() {
  const q = `
    SELECT table_name, column_name 
    FROM information_schema.columns 
    WHERE table_schema = 'sistema' 
    AND (column_name LIKE 'id_%' OR column_name IN ('id', 'id_asesor_asignado'))
    ORDER BY table_name, column_name;
  `;
  try {
    const res = await pool.query(q);
    console.table(res.rows);
  } catch (e) { console.error(e); }
  pool.end();
}
getCols();
