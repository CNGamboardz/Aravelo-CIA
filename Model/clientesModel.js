const db = require('./db');
const bcrypt = require('bcryptjs');

// =========================================================================
// MIGRACIÓN ATÓMICA DE PURGA REDUNDANTE (Permitida explícitamente)
// =========================================================================
db.query(`
  DO $$
  BEGIN
    ALTER TABLE sistema.clientes ADD COLUMN IF NOT EXISTS correo VARCHAR(150);
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='sistema' AND table_name='clientes' AND column_name='email') THEN
      UPDATE sistema.clientes 
      SET correo = email 
      WHERE (correo IS NULL OR correo = '') AND email IS NOT NULL AND email != '';
      
      ALTER TABLE sistema.clientes DROP COLUMN email;
    END IF;
  END $$;
`).then(() => {
  console.log('✅ Base de datos purgada de redundancia: Columna email unificada exclusivamente en correo.');
}).catch(err => {
  console.error('⚠️ Discrepancia al purgar columna email:', err.message);
});

// Obtener clientes ordenados
const getClientes = async () => {
  const res = await db.query('SELECT * FROM sistema.clientes ORDER BY id_cliente DESC');
  return res.rows;
};

// Crear cliente exclusivamente con correo en español
const crearCliente = async (cliente) => {
  const { 
    nombre, apellido_paterno, apellido_materno, fecha_nacimiento, sexo, curp, rfc, 
    telefono, telefono_secundario, correo, email, direccion, colonia, municipio, 
    estado, codigo_postal, ocupacion, empresa, ingresos_mensuales, estado_civil, 
    nacionalidad, identificacion_oficial, numero_identificacion, foto_identificacion, 
    comprobante_domicilio, foto_cliente, estatus, observaciones, id_asesor, password_cliente 
  } = cliente;

  const c_correo = correo || email || '';
  const c_ingresos = ingresos_mensuales ? parseFloat(ingresos_mensuales) : 0;
  const c_nac = fecha_nacimiento || null;

  let passHash = null;
  if (password_cliente) {
    const salt = await bcrypt.genSalt(12);
    passHash = await bcrypt.hash(password_cliente, salt);
  }

  const resId = await db.query('SELECT COALESCE(MAX(id_cliente), 0) + 1 AS next_id FROM sistema.clientes');
  const nextId = resId.rows[0].next_id;

  const res = await db.query(
    `INSERT INTO sistema.clientes 
    (id_cliente, nombre, apellido_paterno, apellido_materno, fecha_nacimiento, sexo, curp, rfc, 
     telefono, telefono_secundario, correo, direccion, colonia, municipio, 
     estado, codigo_postal, ocupacion, empresa, ingresos_mensuales, estado_civil, 
     nacionalidad, identificacion_oficial, numero_identificacion, foto_identificacion, 
     comprobante_domicilio, foto_cliente, estatus, observaciones, id_asesor, password_cliente)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30) 
    RETURNING *`,
    [
      nextId, nombre || '', apellido_paterno || '', apellido_materno || '', c_nac, sexo || '', 
      curp || '', rfc || '', telefono || '', telefono_secundario || '', c_correo, 
      direccion || '', colonia || '', municipio || '', estado || '', 
      codigo_postal || '', ocupacion || '', empresa || '', c_ingresos, estado_civil || '', 
      nacionalidad || '', identificacion_oficial || '', numero_identificacion || '', 
      foto_identificacion || '', comprobante_domicilio || '', foto_cliente || '', 
      estatus || 'activo', observaciones || '', id_asesor || null, passHash
    ]
  );

  return res.rows[0];
};

// Actualizar cliente sin columna email
const actualizarClienteDB = async (id, cliente) => {
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
         correo = $10, direccion = $11, colonia = $12, municipio = $13, 
         estado = $14, codigo_postal = $15, ocupacion = $16, empresa = $17, 
         ingresos_mensuales = $18, estado_civil = $19, nacionalidad = $20, 
         identificacion_oficial = $21, numero_identificacion = $22, foto_identificacion = $23, 
         comprobante_domicilio = $24, foto_cliente = $25, estatus = $26, observaciones = $27
     WHERE id_cliente = $28 RETURNING *`,
    [
      nombre || '', apellido_paterno || '', apellido_materno || '', c_nac, sexo || '', 
      curp || '', rfc || '', telefono || '', telefono_secundario || '', c_correo, 
      direccion || '', colonia || '', municipio || '', estado || '', 
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

module.exports = {
  getClientes,
  crearCliente,
  actualizarClienteDB,
  eliminarClienteDB
};