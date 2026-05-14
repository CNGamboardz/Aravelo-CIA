const pool = require('../Model/db.js');

async function test() {
  try {
    // Probar si el esquema de pagos tira error general
    console.log("Probando select en pagos:");
    const res1 = await pool.query(`SELECT p.id_pago, p.fecha_pago, p.concepto, p.monto, p.metodo_pago, p.estatus,
            t.fraccionamiento, t.numero_lote AS lote
     FROM sistema.pagos p
     LEFT JOIN sistema.terrenos t ON p.id_terreno = t.id_terreno LIMIT 1`);
    console.log("Pagos ok", res1.rows);

    console.log("Probando select en citas:");
    const res2 = await pool.query(`UPDATE sistema.clientes SET cita_fecha='2026-05-15', cita_lote_id=NULL, cita_nota='', cita_estatus='pendiente' WHERE id_cliente = '00000000-0000-0000-0000-000000000000'`);
    console.log("Citas ok");

    console.log("Probando update asesor:");
    const res3 = await pool.query(`UPDATE sistema.clientes SET id_asesor_asignado=NULL, id_asesor=NULL WHERE id_cliente = '00000000-0000-0000-0000-000000000000'`);
    console.log("Asesor ok");

  } catch (e) {
    console.error("ERROR DB:", e);
  } finally {
    pool.end();
  }
}
test();
