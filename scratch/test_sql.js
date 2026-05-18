const pool = require('./Model/db');
pool.query(`SELECT c.*, 
            TRIM(CONCAT(cl.nombre, ' ', COALESCE(cl.apellido_paterno, ''), ' ', COALESCE(cl.apellido_materno, ''))) AS cliente_nombre, 
            t.fraccionamiento, t.superficie, t.lote AS lote_num,
            u.nombre AS asesor_nombre,
            (SELECT COALESCE(SUM(monto_pagado), 0) FROM sistema.pagos p WHERE p.id_contrato = c.id_contrato) AS total_pagado
     FROM sistema.contratos c
     JOIN sistema.clientes cl ON c.id_cliente = cl.id_cliente
     JOIN sistema.terrenos t ON c.id_terreno = t.id_terreno
     LEFT JOIN sistema.usuarios u ON c.id_asesor = u.id_usuario
     ORDER BY c.id_contrato DESC`)
  .then(r => { console.log("OK"); process.exit(0); })
  .catch(e => { console.error(e.message); process.exit(1); });
