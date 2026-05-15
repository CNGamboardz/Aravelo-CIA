const db = require('./db');

// Listar el calendario de cobranza general de los clientes
const getCalendarioCobranza = async () => {
  const res = await db.query(
    `SELECT cp.*, cl.nombre AS cliente_nombre, cl.id_asesor, cl.id_asesor_asignado, t.fraccionamiento 
     FROM sistema.calendario_pagos cp
     JOIN sistema.clientes cl ON cp.id_cliente = cl.id_cliente
     JOIN sistema.contratos c ON cp.id_contrato = c.id_contrato
     JOIN sistema.terrenos t ON c.id_terreno = t.id_terreno
     ORDER BY cp.fecha_esperada ASC`
  );
  return res.rows;
};

// Obtener historial de pagos reales
const getPagosReales = async () => {
  const res = await db.query(
    `SELECT p.*, cl.nombre AS cliente_nombre, cl.id_asesor, cl.id_asesor_asignado 
     FROM sistema.pagos p
     LEFT JOIN sistema.clientes cl ON p.id_cliente = cl.id_cliente
     ORDER BY p.id_pago DESC`
  );
  return res.rows;
};

// Registrar un pago en el sistema
const registrarPago = async (pago) => {
  const { id_cliente, id_contrato, id_terreno, concepto, monto, metodo_pago, id_usuario, comprobante, id_calendario } = pago;

  const client = await db.connect();
  try {
    await client.query('BEGIN');

    // 1. Insertar el pago real
    const resPago = await client.query(
      `INSERT INTO sistema.pagos 
       (id_cliente, id_contrato, id_terreno, fecha_pago, concepto, monto, metodo_pago, id_usuario, comprobante, estatus)
       VALUES ($1, $2, $3, CURRENT_DATE, $4, $5, $6, $7, $8, 'pagado') RETURNING *`,
      [id_cliente, id_contrato, id_terreno, concepto || 'mensualidad', monto, metodo_pago || 'efectivo', id_usuario || null, comprobante || '']
    );
    const nuevoPago = resPago.rows[0];

    // 2. Si el pago corresponde a una cuota proyectada, la marcamos como pagada
    if (id_calendario) {
      await client.query(
        `UPDATE sistema.calendario_pagos 
         SET estatus = 'pagado' 
         WHERE id_calendario = $1`,
        [id_calendario]
      );
    }

    await client.query('COMMIT');
    return nuevoPago;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al procesar pago en PostgreSQL:', error);
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  getCalendarioCobranza,
  getPagosReales,
  registrarPago
};
