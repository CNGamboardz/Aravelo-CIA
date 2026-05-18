const db = require('./db');

const getVentasMes = async () => {
  const res = await db.query('SELECT * FROM sistema.ventas_mes');
  return res.rows[0];
};

const getCarteraVencida = async () => {
  const res = await db.query('SELECT * FROM sistema.cartera_vencida');
  return res.rows[0];
};

const getDireccionDashboard = async () => {
  // 1. Ventas del mes
  const ventasMes = await db.query(`
    SELECT COALESCE(SUM(precio_total), 0) AS total_monto, COUNT(*) AS count_contratos 
    FROM sistema.contratos 
    WHERE EXTRACT(MONTH FROM fecha_firma) = EXTRACT(MONTH FROM CURRENT_DATE) 
      AND EXTRACT(YEAR FROM fecha_firma) = EXTRACT(YEAR FROM CURRENT_DATE)
  `);

  // 2. Cobranza Real vs Proyectada
  const cobranzaProyectada = await db.query(`
    SELECT COALESCE(SUM(monto_esperado), 0) AS total_proyectado 
    FROM sistema.calendario_pagos 
    WHERE EXTRACT(MONTH FROM fecha_esperada) = EXTRACT(MONTH FROM CURRENT_DATE) 
      AND EXTRACT(YEAR FROM fecha_esperada) = EXTRACT(YEAR FROM CURRENT_DATE)
  `);
  const cobranzaReal = await db.query(`
    SELECT COALESCE(SUM(monto), 0) AS total_real 
    FROM sistema.pagos 
    WHERE EXTRACT(MONTH FROM fecha_pago) = EXTRACT(MONTH FROM CURRENT_DATE) 
      AND EXTRACT(YEAR FROM fecha_pago) = EXTRACT(YEAR FROM CURRENT_DATE)
  `);

  // 3. Cartera Vencida Total
  const carteraVencida = await db.query(`
    SELECT COALESCE(SUM(monto_esperado), 0) AS total_cartera_vencida 
    FROM sistema.calendario_pagos 
    WHERE estatus = 'pendiente' 
      AND fecha_esperada < CURRENT_DATE
  `);

  // 4. Lotes disponibles / vendidos
  const lotesEstado = await db.query(`
    SELECT COALESCE(estado, 'disponible') AS estado, COUNT(*) AS count 
    FROM sistema.terrenos 
    GROUP BY estado
  `);

  // 5. Proyección de ingresos 3 y 6 meses
  const proy3meses = await db.query(`
    SELECT COALESCE(SUM(monto_esperado), 0) AS total_3_meses 
    FROM sistema.calendario_pagos 
    WHERE estatus = 'pendiente' 
      AND fecha_esperada >= CURRENT_DATE 
      AND fecha_esperada <= CURRENT_DATE + INTERVAL '3 months'
  `);
  const proy6meses = await db.query(`
    SELECT COALESCE(SUM(monto_esperado), 0) AS total_6_meses 
    FROM sistema.calendario_pagos 
    WHERE estatus = 'pendiente' 
      AND fecha_esperada >= CURRENT_DATE 
      AND fecha_esperada <= CURRENT_DATE + INTERVAL '6 months'
  `);

  // 6. Desempeño por asesor
  const desempenoAsesores = await db.query(`
    SELECT u.nombre AS asesor_nombre, 
           COUNT(c.id_contrato) AS total_lotes_vendidos, 
           COALESCE(SUM(c.precio_total), 0) AS total_monto_vendido 
    FROM sistema.usuarios u 
    LEFT JOIN sistema.contratos c ON u.id_usuario = c.id_asesor 
    WHERE LOWER(u.rol) IN ('asesor', 'vendedor', 'dirección', 'direccion')
    GROUP BY u.nombre, u.id_usuario 
    ORDER BY total_monto_vendido DESC
  `);

  return {
    ventasMes: ventasMes.rows[0],
    cobranzaProyectada: cobranzaProyectada.rows[0].total_proyectado,
    cobranzaReal: cobranzaReal.rows[0].total_real,
    carteraVencida: carteraVencida.rows[0].total_cartera_vencida,
    lotesEstado: lotesEstado.rows,
    proy3meses: proy3meses.rows[0].total_3_meses,
    proy6meses: proy6meses.rows[0].total_6_meses,
    desempenoAsesores: desempenoAsesores.rows
  };
};

const getAuditoriaCompleta = async () => {
  // Clientes
  const clientes = await db.query(
    'SELECT id_cliente, nombre, apellido_paterno, apellido_materno, curp, rfc, correo, telefono, etapa FROM sistema.clientes ORDER BY id_cliente ASC'
  );

  // Contratos con JOINs seguros, columnas explícitas y cálculo de total pagado
  const contratos = await db.query(`
    SELECT c.id_contrato, c.tipo_plan, c.precio_total, c.enganche, c.plazo, c.monto_mensual, c.estatus, c.fecha_firma,
           COALESCE(TRIM(CONCAT(cl.nombre, ' ', COALESCE(cl.apellido_paterno,''), ' ', COALESCE(cl.apellido_materno,''))), 'Sin Nombre') AS cliente_nombre,
           COALESCE(t.fraccionamiento, 'Sin Fraccionamiento') AS fraccionamiento,
           COALESCE(t.numero_lote::text, '') AS lote_num,
           COALESCE(u.nombre, 'Portal Web') AS asesor_nombre,
           (SELECT COALESCE(SUM(p.monto), 0) FROM sistema.pagos p WHERE p.id_contrato = c.id_contrato) AS total_pagado
    FROM sistema.contratos c
    LEFT JOIN sistema.clientes cl ON c.id_cliente = cl.id_cliente
    LEFT JOIN sistema.terrenos t ON c.id_terreno = t.id_terreno
    LEFT JOIN sistema.usuarios u ON c.id_asesor = u.id_usuario
    ORDER BY c.fecha_firma DESC
    LIMIT 500
  `);

  const contratosMapeados = contratos.rows.map(c => {
    const pagado = parseFloat(c.total_pagado) || 0;
    const enganche = parseFloat(c.enganche) || 0;
    const precio = parseFloat(c.precio_total) || 0;

    if (c.tipo_plan === 'contado' || (pagado + enganche) >= precio) {
      c.estatus = 'Liquidado';
    } else {
      c.estatus = 'Activo';
    }
    return c;
  });

  // Pagos — sin JOIN a terrenos (columna id_terreno puede no existir en todos los registros)
  const pagos = await db.query(`
    SELECT p.id_pago, p.id_cliente, p.id_contrato, p.fecha_pago, p.concepto, p.monto, p.metodo_pago, p.comprobante, p.estatus,
           COALESCE(TRIM(CONCAT(cl.nombre, ' ', COALESCE(cl.apellido_paterno,''), ' ', COALESCE(cl.apellido_materno,''))), 'Sin Nombre') AS cliente_nombre
    FROM sistema.pagos p
    LEFT JOIN sistema.clientes cl ON p.id_cliente = cl.id_cliente
    ORDER BY p.fecha_pago DESC
    LIMIT 500
  `);

  // Terrenos (incluyendo información de quién apartó y compró)
  const terrenos = await db.query(`
    SELECT t.id_terreno, t.fraccionamiento, t.numero_lote, t.manzana, t.estado, t.precio_venta, t.precio_lista, t.id_cliente, t.id_propietario,
           COALESCE(TRIM(CONCAT(cl.nombre, ' ', COALESCE(cl.apellido_paterno,''), ' ', COALESCE(cl.apellido_materno,''))), 'Sin Nombre') AS comprador_nombre,
           COALESCE(TRIM(CONCAT(cp.nombre, ' ', COALESCE(cp.apellido_paterno,''), ' ', COALESCE(cp.apellido_materno,''))), 'Sin Nombre') AS apartado_por_nombre
    FROM sistema.terrenos t
    LEFT JOIN sistema.clientes cl ON t.id_cliente = cl.id_cliente
    LEFT JOIN sistema.clientes cp ON t.id_propietario = cp.id_cliente
    ORDER BY t.id_terreno ASC
  `);

  // Usuarios
  const usuarios = await db.query(
    'SELECT id_usuario, nombre, correo, rol FROM sistema.usuarios ORDER BY id_usuario ASC'
  );

  return {
    clientes: clientes.rows,
    contratos: contratosMapeados,
    pagos: pagos.rows,
    terrenos: terrenos.rows,
    usuarios: usuarios.rows
  };
};

module.exports = {
  getVentasMes,
  getCarteraVencida,
  getDireccionDashboard,
  getAuditoriaCompleta
};