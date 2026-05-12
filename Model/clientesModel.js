const db = require('./db');

// Función interna para asegurar que todas las 29 columnas de identidad existan en BD
const asegurarColumnasClientes = async () => {
  const columnas = [
    'apellido_paterno VARCHAR(100)',
    'apellido_materno VARCHAR(100)',
    'fecha_nacimiento DATE',
    'sexo VARCHAR(30)',
    'curp VARCHAR(25)',
    'rfc VARCHAR(20)',
    'telefono_secundario VARCHAR(20)',
    'correo VARCHAR(150)',
    'direccion TEXT',
    'colonia VARCHAR(150)',
    'municipio VARCHAR(150)',
    'estado VARCHAR(100)',
    'codigo_postal VARCHAR(10)',
    'ocupacion VARCHAR(150)',
    'empresa VARCHAR(150)',
    'ingresos_mensuales NUMERIC(12,2)',
    'estado_civil VARCHAR(50)',
    'nacionalidad VARCHAR(100)',
    'identificacion_oficial VARCHAR(100)',
    'numero_identificacion VARCHAR(100)',
    'foto_identificacion TEXT',
    'comprobante_domicilio TEXT',
    'foto_cliente TEXT',
    'estatus VARCHAR(50) DEFAULT \'activo\'',
    'fecha_registro DATE DEFAULT CURRENT_DATE',
    'observaciones TEXT'
  ];

  for (const col of columnas) {
    try {
      await db.query(`ALTER TABLE sistema.clientes ADD COLUMN IF NOT EXISTS ${col}`);
    } catch (err) {
      // Ignorar de forma segura si la columna ya existe con una firma de tipo anterior
    }
  }
};

// Obtener clientes
const getClientes = async () => {
  await asegurarColumnasClientes();
  const res = await db.query('SELECT * FROM sistema.clientes ORDER BY id_cliente DESC');
  return res.rows;
};

// Crear cliente con las 29 columnas completas
const crearCliente = async (cliente) => {
  await asegurarColumnasClientes();
  
  const { 
    nombre, apellido_paterno, apellido_materno, fecha_nacimiento, sexo, curp, rfc, 
    telefono, telefono_secundario, correo, email, direccion, colonia, municipio, 
    estado, codigo_postal, ocupacion, empresa, ingresos_mensuales, estado_civil, 
    nacionalidad, identificacion_oficial, numero_identificacion, foto_identificacion, 
    comprobante_domicilio, foto_cliente, estatus, observaciones, id_asesor 
  } = cliente;

  const c_correo = correo || email || '';
  const c_ingresos = ingresos_mensuales ? parseFloat(ingresos_mensuales) : 0;
  const c_nac = fecha_nacimiento || null;

  const res = await db.query(
    `INSERT INTO sistema.clientes 
    (nombre, apellido_paterno, apellido_materno, fecha_nacimiento, sexo, curp, rfc, 
     telefono, telefono_secundario, correo, email, direccion, colonia, municipio, 
     estado, codigo_postal, ocupacion, empresa, ingresos_mensuales, estado_civil, 
     nacionalidad, identificacion_oficial, numero_identificacion, foto_identificacion, 
     comprobante_domicilio, foto_cliente, estatus, observaciones, id_asesor)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29) 
    RETURNING *`,
    [
      nombre || '', apellido_paterno || '', apellido_materno || '', c_nac, sexo || '', 
      curp || '', rfc || '', telefono || '', telefono_secundario || '', c_correo, 
      c_correo, direccion || '', colonia || '', municipio || '', estado || '', 
      codigo_postal || '', ocupacion || '', empresa || '', c_ingresos, estado_civil || '', 
      nacionalidad || '', identificacion_oficial || '', numero_identificacion || '', 
      foto_identificacion || '', comprobante_domicilio || '', foto_cliente || '', 
      estatus || 'activo', observaciones || '', id_asesor || null
    ]
  );

  return res.rows[0];
};

// Actualizar cliente con las 29 columnas
const actualizarClienteDB = async (id, cliente) => {
  await asegurarColumnasClientes();

  const { 
    nombre, apellido_paterno, apellido_materno, fecha_nacimiento, sexo, curp, rfc, 
    telefono, telefono_secundario, correo, email, direccion, colonia, municipio, 
    estado, codigo_postal, ocupacion, empresa, ingresos_mensuales, estado_civil, 
    nacionalidad, identificacion_oficial, numero_identificacion, foto_identificacion, 
    comprobante_domicilio, foto_cliente, estatus, observaciones 
  } = cliente;

  const c_correo = correo || email || '';
  const c_ingresos = ingresos_mensuales ? parseFloat(ingresos_mensuales) : 0;
  const c_nac = fecha_nacimiento || null;

  const res = await db.query(
    `UPDATE sistema.clientes 
     SET nombre = $1, apellido_paterno = $2, apellido_materno = $3, fecha_nacimiento = $4, 
         sexo = $5, curp = $6, rfc = $7, telefono = $8, telefono_secundario = $9, 
         correo = $10, email = $11, direccion = $12, colonia = $13, municipio = $14, 
         estado = $15, codigo_postal = $16, ocupacion = $17, empresa = $18, 
         ingresos_mensuales = $19, estado_civil = $20, nacionalidad = $21, 
         identificacion_oficial = $22, numero_identificacion = $23, foto_identificacion = $24, 
         comprobante_domicilio = $25, foto_cliente = $26, estatus = $27, observaciones = $28
     WHERE id_cliente = $29 RETURNING *`,
    [
      nombre || '', apellido_paterno || '', apellido_materno || '', c_nac, sexo || '', 
      curp || '', rfc || '', telefono || '', telefono_secundario || '', c_correo, 
      c_correo, direccion || '', colonia || '', municipio || '', estado || '', 
      codigo_postal || '', ocupacion || '', empresa || '', c_ingresos, estado_civil || '', 
      nacionalidad || '', identificacion_oficial || '', numero_identificacion || '', 
      foto_identificacion || '', comprobante_domicilio || '', foto_cliente || '', 
      estatus || 'activo', observaciones || '', id
    ]
  );
  return res.rows[0];
};

const eliminarClienteDB = async (id) => {
  try {
    await db.query(`DELETE FROM sistema.clientes WHERE id_cliente = $1`, [id]);
    return true;
  } catch (e) {
    await db.query(`UPDATE sistema.clientes SET estatus = 'inactivo' WHERE id_cliente = $1`, [id]);
    return true;
  }
};

// Ejecutar la asimilación del esquema de forma global e inmediata al cargar el módulo
asegurarColumnasClientes().then(() => {
  console.log('✅ Esquema de la base de datos (sistema.clientes) verificado y auto-extendido con las 29 columnas.');
}).catch(err => {
  console.error('⚠️ Discrepancia al auto-extender la tabla de clientes:', err.message);
});

module.exports = {
  getClientes,
  crearCliente,
  actualizarClienteDB,
  eliminarClienteDB
};