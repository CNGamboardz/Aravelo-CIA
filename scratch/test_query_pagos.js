const db = require('../Model/db');
async function test() {
  try {
    const res = await db.query(
      `SELECT cp.*, cl.nombre AS cliente_nombre, cl.id_asesor_asignado, t.fraccionamiento 
       FROM sistema.calendario_pagos cp
       JOIN sistema.clientes cl ON cp.id_cliente = cl.id_cliente
       JOIN sistema.contratos c ON cp.id_contrato = c.id_contrato
       JOIN sistema.terrenos t ON c.id_terreno = t.id_terreno
       ORDER BY cp.fecha_esperada ASC`
    );
    console.log('Query successful, rows:', res.rows.length);
  } catch (err) {
    console.error('QUERY ERROR:', err.message);
  } finally {
    db.end();
  }
}
test();
