const db = require('./db');

// Listar contratos con detalles de cliente y terreno
const getContratos = async () => {
  const res = await db.query(
    `SELECT c.*, cl.nombre AS cliente_nombre, t.fraccionamiento, t.superficie 
     FROM sistema.contratos c
     JOIN sistema.clientes cl ON c.id_cliente = cl.id_cliente
     JOIN sistema.terrenos t ON c.id_terreno = t.id_terreno
     ORDER BY c.id_contrato DESC`
  );
  return res.rows;
};

// Crear un contrato formal
const crearContrato = async (datos) => {
  const { id_cliente, id_terreno, tipo_plan, precio_total, enganche, plazo, monto_mensual, documento_ref } = datos;

  const client = await db.connect();
  try {
    await client.query('SET search_path TO sistema, public;');
    await client.query('BEGIN');

    // 1. Insertar contrato principal
    const resContrato = await client.query(
      `INSERT INTO sistema.contratos 
       (id_cliente, id_terreno, id_asesor, fecha_firma, tipo_plan, precio_total, enganche, plazo, monto_mensual, estatus, penalizaciones, documentos_json)
       VALUES ($1, $2, $3, CURRENT_DATE, $4, $5, $6, $7, $8, 'activo', $9, $10) RETURNING *`,
      [
        id_cliente, 
        id_terreno, 
        datos.id_asesor || null, 
        tipo_plan, 
        precio_total, 
        enganche || 0, 
        plazo || 0, 
        monto_mensual || 0,
        datos.penalizaciones || '',
        datos.documentos_json || '{}'
      ]
    );
    const nuevoContrato = resContrato.rows[0];
    const id_contrato = nuevoContrato.id_contrato;

    // 2. Actualizar Terreno asignándole el cliente y cambiándolo a vendido
    await client.query(
      `UPDATE sistema.terrenos 
       SET estado = 'vendido', id_cliente = $1, fecha_venta = CURRENT_DATE
       WHERE id_terreno = $2`,
      [id_cliente, id_terreno]
    );

    // 3. Generar Calendario de Pagos de forma segura (si es financiamiento)
    if (tipo_plan === 'financiamiento' && plazo > 0) {
      try {
        let fechaActual = new Date();
        for (let i = 1; i <= plazo; i++) {
          // Crear un nuevo objeto de fecha para cada mes sin mutar la base
          let fechaProg = new Date(fechaActual.getFullYear(), fechaActual.getMonth() + i, fechaActual.getDate());
          let mesFormateado = fechaProg.toISOString().split('T')[0];

          await client.query(
            `INSERT INTO sistema.calendario_pagos 
             (id_cliente, id_contrato, numero_pago, fecha_esperada, monto_esperado, estatus)
             VALUES ($1, $2, $3, $4, $5, 'pendiente')`,
            [id_cliente, id_contrato, i, mesFormateado, monto_mensual]
          );
        }
      } catch (errCal) {
        console.warn('Aviso: No se pudo generar el calendario de pagos (posible falta de tabla):', errCal.message);
      }
    }

    // 4. Registrar documento anexo de forma segura
    if (documento_ref) {
      try {
        await client.query(
          `INSERT INTO sistema.documentos (id_contrato, tipo_documento, ruta_archivo)
           VALUES ($1, 'Contrato Base', $2)`,
          [id_contrato, documento_ref]
        );
      } catch (errDoc) {
        console.warn('Aviso: No se pudo registrar en documentos (posible falta de tabla):', errDoc.message);
      }
    }

    await client.query('COMMIT');
    return nuevoContrato;

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error detallado en BD al crear contrato:', error);
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  getContratos,
  crearContrato
};
