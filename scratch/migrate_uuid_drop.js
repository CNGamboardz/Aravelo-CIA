const pool = require('../Model/db.js');

const sql = `
  SET search_path TO sistema;
  CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

  -- Borrar todo limpiamente
  DROP VIEW IF EXISTS desempeno_asesor CASCADE;
  DROP VIEW IF EXISTS lotes_disponibles CASCADE;
  DROP VIEW IF EXISTS cartera_vencida CASCADE;
  DROP VIEW IF EXISTS ventas_mes CASCADE;

  DROP TABLE IF EXISTS agenda, calendario_pagos, contactos, documentos, pagos, contratos, terrenos, clientes, usuarios CASCADE;

  -- ==========================================
  -- CREACIÓN DE TABLAS DESDE CERO CON UUIDv4
  -- ==========================================

  CREATE TABLE usuarios (
      id_usuario UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      nombre VARCHAR,
      correo VARCHAR,
      password TEXT,
      rol VARCHAR,
      comision NUMERIC,
      estado BOOLEAN,
      fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      telefono VARCHAR,
      ciudad VARCHAR,
      estado_dir VARCHAR,
      colonia VARCHAR,
      calle VARCHAR,
      numero_exterior VARCHAR,
      numero_interior VARCHAR,
      cp VARCHAR,
      foto TEXT,
      arroba VARCHAR,
      ultimo_acceso TIMESTAMP
  );

  CREATE TABLE clientes (
      id_cliente UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      nombre VARCHAR,
      apellido_paterno VARCHAR,
      apellido_materno VARCHAR,
      telefono VARCHAR,
      correo VARCHAR,
      estado_civil VARCHAR,
      ocupacion VARCHAR,
      direccion TEXT,
      estado VARCHAR,
      municipio VARCHAR,
      colonia VARCHAR,
      codigo_postal VARCHAR,
      fecha_registro DATE DEFAULT CURRENT_DATE,
      estatus VARCHAR,
      id_asesor UUID REFERENCES usuarios(id_usuario) ON DELETE SET NULL,
      id_asesor_asignado UUID REFERENCES usuarios(id_usuario) ON DELETE SET NULL,
      fecha_nacimiento DATE,
      sexo VARCHAR,
      nacionalidad VARCHAR,
      curp VARCHAR,
      rfc VARCHAR,
      telefono_secundario VARCHAR,
      calle VARCHAR,
      numero_exterior VARCHAR,
      numero_interior VARCHAR,
      empresa VARCHAR,
      ingresos_mensuales NUMERIC,
      identificacion_oficial VARCHAR,
      numero_identificacion VARCHAR,
      foto_cliente TEXT,
      foto_identificacion TEXT,
      comprobante_domicilio TEXT,
      observaciones TEXT,
      password_cliente TEXT,
      ultimo_acceso TIMESTAMP
  );

  CREATE TABLE terrenos (
      id_terreno UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      fraccionamiento VARCHAR,
      superficie NUMERIC,
      precio_lista NUMERIC,
      precio_venta NUMERIC,
      estado VARCHAR,
      id_cliente UUID REFERENCES clientes(id_cliente) ON DELETE SET NULL,
      id_asesor UUID REFERENCES usuarios(id_usuario) ON DELETE SET NULL,
      fecha_apartado DATE,
      fecha_venta DATE,
      ubicacion TEXT,
      imagen TEXT,
      numero_lote VARCHAR,
      manzana VARCHAR,
      clave_catastral VARCHAR,
      frente NUMERIC,
      fondo NUMERIC,
      lado_izquierdo NUMERIC,
      lado_derecho NUMERIC,
      colindancia_norte VARCHAR,
      colindancia_sur VARCHAR,
      colindancia_este VARCHAR,
      colindancia_oeste VARCHAR,
      direccion TEXT,
      colonia VARCHAR,
      municipio VARCHAR,
      estado_rep VARCHAR,
      codigo_postal VARCHAR,
      latitud NUMERIC,
      longitud NUMERIC,
      tipo_uso VARCHAR,
      anticipo NUMERIC,
      servicio_agua BOOLEAN,
      servicio_luz BOOLEAN,
      servicio_drenaje BOOLEAN,
      servicio_internet BOOLEAN,
      calle_pavimentada BOOLEAN,
      descripcion TEXT,
      galeria_imagenes TEXT,
      plano_lote TEXT,
      documento_escritura TEXT,
      fecha_registro DATE DEFAULT CURRENT_DATE,
      fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      id_propietario UUID REFERENCES clientes(id_cliente) ON DELETE SET NULL,
      observaciones TEXT
  );

  CREATE TABLE contratos (
      id_contrato UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      id_cliente UUID REFERENCES clientes(id_cliente) ON DELETE CASCADE,
      id_terreno UUID REFERENCES terrenos(id_terreno) ON DELETE CASCADE,
      id_asesor UUID REFERENCES usuarios(id_usuario) ON DELETE SET NULL,
      fecha_firma DATE,
      monto_total NUMERIC,
      enganche NUMERIC,
      saldo NUMERIC,
      plazo_meses INTEGER,
      tasa_interes NUMERIC,
      estatus VARCHAR,
      documento_pdf TEXT,
      observaciones TEXT
  );

  CREATE TABLE pagos (
      id_pago UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      id_cliente UUID REFERENCES clientes(id_cliente) ON DELETE CASCADE,
      id_contrato UUID REFERENCES contratos(id_contrato) ON DELETE CASCADE,
      id_terreno UUID REFERENCES terrenos(id_terreno) ON DELETE CASCADE,
      fecha_pago DATE,
      concepto VARCHAR,
      monto NUMERIC,
      metodo_pago VARCHAR,
      id_usuario UUID REFERENCES usuarios(id_usuario) ON DELETE SET NULL,
      comprobante TEXT,
      estatus VARCHAR
  );

  CREATE TABLE agenda (
      id_agenda UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      id_usuario UUID REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
      titulo VARCHAR,
      descripcion TEXT,
      fecha_inicio TIMESTAMP,
      fecha_fin TIMESTAMP,
      estatus VARCHAR,
      tipo VARCHAR,
      id_cliente UUID REFERENCES clientes(id_cliente) ON DELETE SET NULL
  );

  CREATE TABLE calendario_pagos (
      id_calendario UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      id_contrato UUID REFERENCES contratos(id_contrato) ON DELETE CASCADE,
      id_cliente UUID REFERENCES clientes(id_cliente) ON DELETE CASCADE,
      numero_pago INTEGER,
      fecha_esperada DATE,
      monto_esperado NUMERIC,
      estatus VARCHAR
  );

  CREATE TABLE contactos (
      id_contacto UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      id_cliente UUID REFERENCES clientes(id_cliente) ON DELETE CASCADE,
      nombre VARCHAR,
      telefono VARCHAR,
      correo VARCHAR,
      relacion VARCHAR
  );

  CREATE TABLE documentos (
      id_documento UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      id_contrato UUID REFERENCES contratos(id_contrato) ON DELETE CASCADE,
      tipo_documento VARCHAR,
      ruta_archivo TEXT,
      fecha_subida TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  -- ==========================================
  -- RECREACIÓN DE VISTAS 
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
  LEFT JOIN clientes cl ON (cl.id_asesor_asignado = u.id_usuario)
  LEFT JOIN contratos c ON (c.id_cliente = cl.id_cliente)
  GROUP BY u.nombre;
`;

async function run() {
  try {
    console.log("Iniciando purga y recreación de estructura con UUID...");
    await pool.query(sql);
    console.log("¡Recreación completada exitosamente! Todas las tablas usan UUIDv4 de forma nativa e inquebrantable.");
  } catch (e) {
    console.error("Error durante la migración:", e);
  } finally {
    pool.end();
  }
}

run();
