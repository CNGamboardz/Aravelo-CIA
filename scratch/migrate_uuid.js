const pool = require('../Model/db.js');

const sql = `
  SET search_path TO sistema;
  CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

  -- Borrar Vistas Temporalmente para evitar el error de dependencia
  DROP VIEW IF EXISTS desempeno_asesor CASCADE;
  DROP VIEW IF EXISTS lotes_disponibles CASCADE;
  DROP VIEW IF EXISTS cartera_vencida CASCADE;
  DROP VIEW IF EXISTS ventas_mes CASCADE;

  -- Truncar todas las tablas
  TRUNCATE TABLE agenda, calendario_pagos, clientes, contactos, contratos, documentos, pagos, terrenos, usuarios CASCADE;

  -- ==========================================
  -- MODIFICACIÓN DE LLAVES PRIMARIAS A UUIDv4
  -- ==========================================
  
  -- USUARIOS
  ALTER TABLE usuarios ALTER COLUMN id_usuario DROP DEFAULT;
  ALTER TABLE usuarios ALTER COLUMN id_usuario TYPE UUID USING uuid_generate_v4();
  ALTER TABLE usuarios ALTER COLUMN id_usuario SET DEFAULT uuid_generate_v4();

  -- CLIENTES
  ALTER TABLE clientes ALTER COLUMN id_cliente DROP DEFAULT;
  ALTER TABLE clientes ALTER COLUMN id_cliente TYPE UUID USING uuid_generate_v4();
  ALTER TABLE clientes ALTER COLUMN id_cliente SET DEFAULT uuid_generate_v4();
  
  ALTER TABLE clientes ALTER COLUMN id_asesor TYPE UUID USING NULL;
  ALTER TABLE clientes ALTER COLUMN id_asesor_asignado TYPE UUID USING NULL;

  -- TERRENOS
  ALTER TABLE terrenos ALTER COLUMN id_terreno DROP DEFAULT;
  ALTER TABLE terrenos ALTER COLUMN id_terreno TYPE UUID USING uuid_generate_v4();
  ALTER TABLE terrenos ALTER COLUMN id_terreno SET DEFAULT uuid_generate_v4();
  
  ALTER TABLE terrenos ALTER COLUMN id_cliente TYPE UUID USING NULL;
  ALTER TABLE terrenos ALTER COLUMN id_asesor TYPE UUID USING NULL;
  ALTER TABLE terrenos ALTER COLUMN id_propietario TYPE UUID USING NULL;

  -- CONTRATOS
  ALTER TABLE contratos ALTER COLUMN id_contrato DROP DEFAULT;
  ALTER TABLE contratos ALTER COLUMN id_contrato TYPE UUID USING uuid_generate_v4();
  ALTER TABLE contratos ALTER COLUMN id_contrato SET DEFAULT uuid_generate_v4();
  
  ALTER TABLE contratos ALTER COLUMN id_cliente TYPE UUID USING NULL;
  ALTER TABLE contratos ALTER COLUMN id_terreno TYPE UUID USING NULL;

  -- PAGOS
  ALTER TABLE pagos ALTER COLUMN id_pago DROP DEFAULT;
  ALTER TABLE pagos ALTER COLUMN id_pago TYPE UUID USING uuid_generate_v4();
  ALTER TABLE pagos ALTER COLUMN id_pago SET DEFAULT uuid_generate_v4();
  
  ALTER TABLE pagos ALTER COLUMN id_cliente TYPE UUID USING NULL;
  ALTER TABLE pagos ALTER COLUMN id_contrato TYPE UUID USING NULL;
  ALTER TABLE pagos ALTER COLUMN id_terreno TYPE UUID USING NULL;
  ALTER TABLE pagos ALTER COLUMN id_usuario TYPE UUID USING NULL;

  -- AGENDA
  ALTER TABLE agenda ALTER COLUMN id_agenda DROP DEFAULT;
  ALTER TABLE agenda ALTER COLUMN id_agenda TYPE UUID USING uuid_generate_v4();
  ALTER TABLE agenda ALTER COLUMN id_agenda SET DEFAULT uuid_generate_v4();
  
  ALTER TABLE agenda ALTER COLUMN id_usuario TYPE UUID USING NULL;

  -- CALENDARIO PAGOS
  ALTER TABLE calendario_pagos ALTER COLUMN id_calendario DROP DEFAULT;
  ALTER TABLE calendario_pagos ALTER COLUMN id_calendario TYPE UUID USING uuid_generate_v4();
  ALTER TABLE calendario_pagos ALTER COLUMN id_calendario SET DEFAULT uuid_generate_v4();
  
  ALTER TABLE calendario_pagos ALTER COLUMN id_cliente TYPE UUID USING NULL;
  ALTER TABLE calendario_pagos ALTER COLUMN id_contrato TYPE UUID USING NULL;

  -- CONTACTOS
  ALTER TABLE contactos ALTER COLUMN id_contacto DROP DEFAULT;
  ALTER TABLE contactos ALTER COLUMN id_contacto TYPE UUID USING uuid_generate_v4();
  ALTER TABLE contactos ALTER COLUMN id_contacto SET DEFAULT uuid_generate_v4();
  
  ALTER TABLE contactos ALTER COLUMN id_cliente TYPE UUID USING NULL;

  -- DOCUMENTOS
  ALTER TABLE documentos ALTER COLUMN id_documento DROP DEFAULT;
  ALTER TABLE documentos ALTER COLUMN id_documento TYPE UUID USING uuid_generate_v4();
  ALTER TABLE documentos ALTER COLUMN id_documento SET DEFAULT uuid_generate_v4();
  
  ALTER TABLE documentos ALTER COLUMN id_contrato TYPE UUID USING NULL;


  -- ==========================================
  -- RECREACIÓN DE VISTAS (Las mismas que extrajimos)
  -- ==========================================

  CREATE VIEW ventas_mes AS
  SELECT count(*) AS total_ventas
  FROM contratos
  WHERE (date_trunc('month', fecha_firma::timestamp with time zone) = date_trunc('month', CURRENT_DATE::timestamp with time zone));

  CREATE VIEW cartera_vencida AS
  SELECT sum(monto_esperado) AS total_vencido
  FROM calendario_pagos
  WHERE (estatus::text = 'vencido');

  CREATE VIEW lotes_disponibles AS
  SELECT count(*) AS count
  FROM terrenos
  WHERE (estado::text = 'disponible');

  CREATE VIEW desempeno_asesor AS
  SELECT u.nombre, count(c.id_contrato) AS ventas
  FROM usuarios u
  LEFT JOIN clientes cl ON (cl.id_asesor_asignado = u.id_usuario) -- O el que corresponda
  LEFT JOIN contratos c ON (c.id_cliente = cl.id_cliente)
  GROUP BY u.nombre;

`;

async function run() {
  try {
    console.log("Iniciando migración completa a UUID...");
    await pool.query(sql);
    console.log("¡Migración a UUID completada exitosamente! Las tablas ahora usan UUIDv4.");
  } catch (e) {
    console.error("Error durante la migración:", e);
  } finally {
    pool.end();
  }
}

run();
