const db = require('./db');

// Listar el calendario de cobranza general de los clientes
const getCalendarioCobranza = async () => {
  const res = await db.query(
    `SELECT cp.*, 
            TRIM(CONCAT(cl.nombre, ' ', cl.apellido_paterno, ' ', cl.apellido_materno)) AS cliente_nombre, 
            cl.id_asesor, cl.id_asesor_asignado, t.fraccionamiento 
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
    `SELECT p.*, 
            TRIM(CONCAT(cl.nombre, ' ', cl.apellido_paterno, ' ', cl.apellido_materno)) AS cliente_nombre, 
            cl.id_asesor, cl.id_asesor_asignado,
            cl.rfc, cl.codigo_postal,
            t.porcentaje_iva
     FROM sistema.pagos p
     LEFT JOIN sistema.clientes cl ON p.id_cliente = cl.id_cliente
     LEFT JOIN sistema.contratos c ON p.id_contrato = c.id_contrato
     LEFT JOIN sistema.terrenos t ON p.id_terreno = t.id_terreno
     ORDER BY p.id_pago DESC`
  );
  return res.rows;
};

// Registrar un pago en el sistema
const registrarPago = async (pago) => {
  const { id_cliente, id_contrato, id_terreno, concepto, monto, metodo_pago, id_usuario, comprobante, id_calendario, estatus } = pago;

  const client = await db.connect();
  try {
    await client.query('BEGIN');

    // Si es pendiente y tiene id_calendario, guardamos la referencia en el comprobante
    let compFinal = comprobante || '';
    const pagoEstatus = estatus || 'pagado';
    if (pagoEstatus === 'pendiente' && id_calendario) {
      compFinal = `CAL_REF:${id_calendario}` + (comprobante ? ` | ${comprobante}` : '');
    }

    // 1. Insertar el pago real
    const resPago = await client.query(
      `INSERT INTO sistema.pagos 
       (id_cliente, id_contrato, id_terreno, fecha_pago, concepto, monto, metodo_pago, id_usuario, comprobante, estatus)
       VALUES ($1, $2, $3, CURRENT_DATE, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [id_cliente, id_contrato, id_terreno, concepto || 'mensualidad', monto, metodo_pago || 'efectivo', id_usuario || null, compFinal, pagoEstatus]
    );
    const nuevoPago = resPago.rows[0];

    // 2. Si el pago corresponde a una cuota proyectada y está pagado, la marcamos como pagada
    if (id_calendario && pagoEstatus === 'pagado') {
      await client.query(
        `UPDATE sistema.calendario_pagos 
         SET estatus = 'pagado' 
         WHERE id_calendario = $1`,
        [id_calendario]
      );
    }

    await client.query('COMMIT');

    // Lógica de etapa: Si paga y estaba en Moroso/Cancelado -> Recuperado. Si no -> Cliente activo.
    const resCli = await client.query('SELECT etapa FROM sistema.clientes WHERE id_cliente = $1', [id_cliente]);
    if (resCli.rows.length > 0) {
      const etapaActual = resCli.rows[0].etapa;
      let nuevaEtapa = 'Cliente activo';
      if (etapaActual === 'Moroso' || etapaActual === 'Cancelado') {
        nuevaEtapa = 'Recuperado';
      }
      await client.query('UPDATE sistema.clientes SET etapa = $1 WHERE id_cliente = $2', [nuevaEtapa, id_cliente]);
    }

    return nuevoPago;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al procesar pago en PostgreSQL:', error);
    throw error;
  } finally {
    client.release();
  }
};

const auditarRiesgosDB = async () => {
  // 1. Restaurar a 'Cliente activo' si no tiene ningún pago pendiente atrasado
  await db.query(`
    UPDATE sistema.clientes cl
    SET etapa = 'Cliente activo'
    WHERE id_cliente NOT IN (
      SELECT DISTINCT id_cliente FROM sistema.calendario_pagos 
      WHERE estatus = 'pendiente' 
        AND fecha_esperada < CURRENT_DATE
    )
    AND etapa IN ('Atrasado', 'Moroso', 'En riesgo', 'Recuperado')
  `);

  // 2. Marcar 'Atrasado' si tienen pagos pendientes con más de 1 día de retraso (vencidos)
  await db.query(`
    UPDATE sistema.clientes cl
    SET etapa = 'Atrasado'
    WHERE id_cliente IN (
      SELECT id_cliente FROM sistema.calendario_pagos 
      WHERE estatus = 'pendiente' 
        AND fecha_esperada < CURRENT_DATE
    )
    AND etapa NOT IN ('Moroso', 'Cancelado')
  `);

  // 3. Marcar 'Moroso' si tienen pagos pendientes con más de 30 días de retraso
  await db.query(`
    UPDATE sistema.clientes cl
    SET etapa = 'Moroso'
    WHERE id_cliente IN (
      SELECT id_cliente FROM sistema.calendario_pagos 
      WHERE estatus = 'pendiente' 
        AND fecha_esperada < CURRENT_DATE - INTERVAL '30 days'
    )
    AND etapa != 'Cancelado'
  `);
};

module.exports = {
  getCalendarioCobranza,
  getPagosReales,
  registrarPago,
  auditarRiesgosDB
};
