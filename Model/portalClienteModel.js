const db = require('./db');
const bcrypt = require('bcryptjs');

// ==========================================
// PORTAL DE CLIENTES - Modelo de Datos
// ==========================================

/**
 * Registrar cliente desde el portal público (auto-registro)
 * Inserta en sistema.clientes con contraseña hasheada
 */
const registrarClientePortal = async (datos) => {
  const { 
    nombre, apellido_paterno, apellido_materno, correo, telefono, password_cliente,
    municipio, estado, rfc, curp, ocupacion, ingresos_mensuales, fuente_lead, sexo, fecha_nacimiento
  } = datos;

  const existe = await db.query(
    `SELECT id_cliente FROM sistema.clientes WHERE correo = $1 LIMIT 1`,
    [correo]
  );
  if (existe.rows.length > 0) {
    throw new Error('Ya existe un cliente registrado con ese correo electrónico.');
  }

  const salt = await bcrypt.genSalt(12);
  const passwordHash = await bcrypt.hash(password_cliente, salt);

  const resId = await db.query('SELECT COALESCE(MAX(id_cliente), 0) + 1 AS next_id FROM sistema.clientes');
  const nextId = resId.rows[0].next_id;

  const c_ingresos = ingresos_mensuales ? parseFloat(ingresos_mensuales) : null;
  const c_nac = fecha_nacimiento || null;

  const res = await db.query(
    `INSERT INTO sistema.clientes 
     (id_cliente, nombre, apellido_paterno, apellido_materno, correo, telefono, password_cliente, 
      municipio, estado, rfc, curp, ocupacion, ingresos_mensuales, fuente_lead, sexo, fecha_nacimiento,
      estatus, fecha_registro)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, 'activo', CURRENT_DATE)
     RETURNING id_cliente, nombre, apellido_paterno, apellido_materno, correo, telefono, estatus, fecha_registro`,
    [
      nextId, nombre || '', apellido_paterno || '', apellido_materno || '', correo, telefono || '', 
      passwordHash, municipio || '', estado || '', rfc || '', curp || '', ocupacion || '', 
      c_ingresos, fuente_lead || 'Portal Web', sexo || '', c_nac
    ]
  );
  return res.rows[0];
};

/**
 * Autenticar cliente del portal
 * Retorna datos básicos del cliente si credenciales son correctas
 */
const loginCliente = async (correo, password) => {
  const res = await db.query(
    `SELECT id_cliente, nombre, apellido_paterno, apellido_materno, correo, telefono, 
            estatus, id_asesor_asignado, foto_cliente
     FROM sistema.clientes 
     WHERE correo = $1 AND password_cliente IS NOT NULL
     LIMIT 1`,
    [correo]
  );

  if (res.rows.length === 0) return null;
  const cliente = res.rows[0];

  // Verificar contraseña
  const resPass = await db.query(
    `SELECT password_cliente FROM sistema.clientes WHERE id_cliente = $1`,
    [cliente.id_cliente]
  );
  const hash = resPass.rows[0]?.password_cliente;
  if (!hash) return null;

  const valido = await bcrypt.compare(password, hash);
  if (!valido) return null;

  return cliente;
};

/**
 * Obtener lotes disponibles para el portal (solo disponibles)
 */
const getLotesDisponibles = async () => {
  const res = await db.query(
    `SELECT id_terreno, fraccionamiento, numero_lote AS lote, manzana, superficie, precio_lista, 
            precio_venta, estado, municipio, imagen AS imagen_principal
     FROM sistema.terrenos
     WHERE LOWER(COALESCE(estado, '')) IN ('disponible', 'libre', 'available')
     ORDER BY id_terreno DESC`
  );
  return res.rows;
};

/**
 * Obtener todos los asesores activos para que el cliente elija
 */
const getAsesoresActivos = async () => {
  const res = await db.query(
    `SELECT id_usuario, nombre, correo, rol, telefono, foto, arroba, ciudad
     FROM sistema.usuarios
     ORDER BY nombre ASC`
  );
  return res.rows;
};

/**
 * Apartar un lote: cambia su estado a 'apartado'
 */
const apartarLote = async (id_lote, id_cliente) => {
  const res = await db.query(
    `UPDATE sistema.terrenos 
     SET estado = 'apartado', id_propietario = $2
     WHERE id_terreno = $1
     RETURNING id_terreno, fraccionamiento, numero_lote AS lote, estado`,
    [id_lote, id_cliente]
  );
  return res.rows[0];
};

/**
 * Asignar asesor al cliente
 */
const asignarAsesor = async (id_cliente, id_asesor) => {
  const res = await db.query(
    `UPDATE sistema.clientes 
     SET id_asesor_asignado = $1, id_asesor = $1 
     WHERE id_cliente = $2
     RETURNING id_cliente, id_asesor_asignado, id_asesor`,
    [id_asesor, id_cliente]
  );
  return res.rows[0];
};

/**
 * Agendar cita desde el portal
 */
const agendarCita = async (id_cliente, fecha, id_lote, nota) => {
  const res = await db.query(
    `UPDATE sistema.clientes 
     SET cita_fecha = $1, cita_lote_id = $2, cita_nota = $3, cita_estatus = 'pendiente'
     WHERE id_cliente = $4
     RETURNING id_cliente, cita_fecha, cita_lote_id, cita_nota, cita_estatus`,
    [fecha, id_lote || null, nota || '', id_cliente]
  );
  return res.rows[0];
};

/**
 * Obtener historial de pagos de un cliente específico
 */
const getPagosPorCliente = async (id_cliente) => {
  const res = await db.query(
    `SELECT p.id_pago, p.fecha_pago, p.concepto, p.monto, p.metodo_pago, p.estatus,
            t.fraccionamiento, t.numero_lote AS lote
     FROM sistema.pagos p
     LEFT JOIN sistema.terrenos t ON p.id_terreno = t.id_terreno
     WHERE p.id_cliente = $1
     ORDER BY p.fecha_pago DESC`,
    [id_cliente]
  );
  return res.rows;
};

/**
 * Obtener datos completos de un cliente por ID (para el dashboard)
 */
const getClientePorId = async (id_cliente) => {
  const res = await db.query(
    `SELECT id_cliente, nombre, apellido_paterno, apellido_materno, correo, telefono,
            foto_cliente, estatus, id_asesor_asignado, cita_fecha, cita_lote_id, 
            cita_nota, cita_estatus, fecha_registro
     FROM sistema.clientes
     WHERE id_cliente = $1`,
    [id_cliente]
  );
  return res.rows[0];
};

/**
 * Obtener los lotes apartados por un cliente específico
 */
const getMisLotesApartados = async (id_cliente) => {
  const res = await db.query(
    `SELECT id_terreno, fraccionamiento, numero_lote AS lote, manzana, superficie, precio_lista, 
            precio_venta, estado, municipio, imagen AS imagen_principal
     FROM sistema.terrenos
     WHERE id_propietario = $1 AND LOWER(estado) = 'apartado'
     ORDER BY id_terreno DESC`,
    [id_cliente]
  );
  return res.rows;
};

/**
 * Liberar un lote apartado por arrepentimiento o cancelación
 */
const liberarLote = async (id_lote, id_cliente) => {
  const res = await db.query(
    `UPDATE sistema.terrenos 
     SET estado = 'disponible', id_propietario = NULL
     WHERE id_terreno = $1 AND id_propietario = $2
     RETURNING id_terreno, fraccionamiento, numero_lote AS lote`,
    [id_lote, id_cliente]
  );
  return res.rows[0];
};

module.exports = {
  registrarClientePortal,
  loginCliente,
  getLotesDisponibles,
  getAsesoresActivos,
  apartarLote,
  asignarAsesor,
  agendarCita,
  getPagosPorCliente,
  getClientePorId,
  getMisLotesApartados,
  liberarLote
};
