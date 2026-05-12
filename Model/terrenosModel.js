const db = require('./db');

// Función interna para asegurar que todas las columnas catastrales existan en BD de manera atómica
const asegurarColumnasCatastrales = async () => {
  const columnas = [
    "imagen TEXT", "numero_lote VARCHAR(50)", "manzana VARCHAR(50)", "clave_catastral VARCHAR(100)",
    "frente NUMERIC(10,2)", "fondo NUMERIC(10,2)", "lado_izquierdo NUMERIC(10,2)", "lado_derecho NUMERIC(10,2)",
    "colindancia_norte VARCHAR(255)", "colindancia_sur VARCHAR(255)", "colindancia_este VARCHAR(255)", "colindancia_oeste VARCHAR(255)",
    "direccion TEXT", "colonia VARCHAR(150)", "municipio VARCHAR(150)", "estado_rep VARCHAR(100)",
    "codigo_postal VARCHAR(20)", "latitud NUMERIC(12,8)", "longitud NUMERIC(12,8)", "tipo_uso VARCHAR(50)",
    "anticipo NUMERIC(12,2)", "servicio_agua BOOLEAN DEFAULT FALSE", "servicio_luz BOOLEAN DEFAULT FALSE",
    "servicio_drenaje BOOLEAN DEFAULT FALSE", "servicio_internet BOOLEAN DEFAULT FALSE", "calle_pavimentada BOOLEAN DEFAULT FALSE",
    "descripcion TEXT", "galeria_imagenes TEXT", "plano_lote TEXT", "documento_escritura TEXT",
    "fecha_registro DATE DEFAULT CURRENT_DATE", "fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
    "id_propietario INT", "observaciones TEXT"
  ];

  for (const col of columnas) {
    try {
      await db.query(`ALTER TABLE sistema.terrenos ADD COLUMN IF NOT EXISTS ${col};`);
    } catch (err) {}
  }
};

// Obtener todos los terrenos (disponibles, apartados y vendidos) para gestión integral
const getTerrenos = async () => {
  await asegurarColumnasCatastrales();
  const res = await db.query(
    "SELECT * FROM sistema.terrenos ORDER BY id_terreno DESC"
  );
  return res.rows;
};

// Crear un nuevo terreno con todas las especificaciones catastrales
const crearTerreno = async (t) => {
  await asegurarColumnasCatastrales();

  const estadoInsert = ['disponible', 'apartado', 'vendido'].includes(t.estado) ? t.estado : 'disponible';

  const queryInsert = `
    INSERT INTO sistema.terrenos (
      fraccionamiento, superficie, precio_lista, precio_venta, estado, ubicacion, imagen,
      numero_lote, manzana, clave_catastral, frente, fondo, lado_izquierdo, lado_derecho,
      colindancia_norte, colindancia_sur, colindancia_este, colindancia_oeste,
      direccion, colonia, municipio, estado_rep, codigo_postal, latitud, longitud,
      tipo_uso, anticipo, servicio_agua, servicio_luz, servicio_drenaje, servicio_internet,
      calle_pavimentada, descripcion, galeria_imagenes, plano_lote, documento_escritura,
      id_propietario, observaciones
    ) VALUES (
      $1, $2, $3, $4, '${estadoInsert}', $5, $6,
      $7, $8, $9, $10, $11, $12, $13,
      $14, $15, $16, $17,
      $18, $19, $20, $21, $22, $23, $24,
      $25, $26, $27, $28, $29, $30,
      $31, $32, $33, $34, $35,
      $36, $37
    ) RETURNING *;
  `;

  const values = [
    t.fraccionamiento || '', 
    t.superficie || 0, 
    t.precio_lista || t.precio_venta || 0, 
    t.precio_venta || 0, 
    t.ubicacion || '', 
    t.imagen || '',
    t.numero_lote || '', 
    t.manzana || '', 
    t.clave_catastral || '', 
    t.frente || null, 
    t.fondo || null, 
    t.lado_izquierdo || null, 
    t.lado_derecho || null,
    t.colindancia_norte || '', 
    t.colindancia_sur || '', 
    t.colindancia_este || '', 
    t.colindancia_oeste || '',
    t.direccion || '', 
    t.colonia || '', 
    t.municipio || '', 
    t.estado_rep || '', 
    t.codigo_postal || '', 
    t.latitud || null, 
    t.longitud || null,
    t.tipo_uso || 'habitacional', 
    t.anticipo || 0, 
    !!t.servicio_agua, 
    !!t.servicio_luz, 
    !!t.servicio_drenaje, 
    !!t.servicio_internet,
    !!t.calle_pavimentada, 
    t.descripcion || '', 
    t.galeria_imagenes || '', 
    t.plano_lote || '', 
    t.documento_escritura || '',
    t.id_propietario || null, 
    t.observaciones || ''
  ];

  try {
    const res = await db.query(queryInsert, values);
    return res.rows[0];
  } catch (error) {
    console.error('Error estricto en BD al crear lote completo:', error.message);
    throw error;
  }
};

const actualizarTerrenoDB = async (id, t) => {
  await asegurarColumnasCatastrales();

  const estadoSanitizado = ['disponible', 'apartado', 'vendido'].includes(t.estado) ? t.estado : 'disponible';

  const queryUpdate = `
    UPDATE sistema.terrenos SET
      estado = '${estadoSanitizado}', fraccionamiento = $1, superficie = $2, precio_lista = $3, precio_venta = $4, ubicacion = $5, imagen = $6,
      numero_lote = $7, manzana = $8, clave_catastral = $9, frente = $10, fondo = $11, lado_izquierdo = $12, lado_derecho = $13,
      colindancia_norte = $14, colindancia_sur = $15, colindancia_este = $16, colindancia_oeste = $17,
      direccion = $18, colonia = $19, municipio = $20, estado_rep = $21, codigo_postal = $22, latitud = $23, longitud = $24,
      tipo_uso = $25, anticipo = $26, servicio_agua = $27, servicio_luz = $28, servicio_drenaje = $29, servicio_internet = $30,
      calle_pavimentada = $31, descripcion = $32, galeria_imagenes = $33, plano_lote = $34, documento_escritura = $35,
      id_propietario = $36, observaciones = $37, fecha_actualizacion = CURRENT_TIMESTAMP
    WHERE id_terreno = $38 RETURNING *;
  `;

  const values = [
    t.fraccionamiento || '', t.superficie || 0, t.precio_lista || t.precio_venta || 0, t.precio_venta || 0, t.ubicacion || '', t.imagen || '',
    t.numero_lote || '', t.manzana || '', t.clave_catastral || '', t.frente || null, t.fondo || null, t.lado_izquierdo || null, t.lado_derecho || null,
    t.colindancia_norte || '', t.colindancia_sur || '', t.colindancia_este || '', t.colindancia_oeste || '',
    t.direccion || '', t.colonia || '', t.municipio || '', t.estado_rep || '', t.codigo_postal || '', t.latitud || null, t.longitud || null,
    t.tipo_uso || 'habitacional', t.anticipo || 0, !!t.servicio_agua, !!t.servicio_luz, !!t.servicio_drenaje, !!t.servicio_internet,
    !!t.calle_pavimentada, t.descripcion || '', t.galeria_imagenes || '', t.plano_lote || '', t.documento_escritura || '',
    t.id_propietario || null, t.observaciones || '', id
  ];

  try {
    const res = await db.query(queryUpdate, values);
    return res.rows[0];
  } catch (error) {
    console.error('Error estricto en BD al actualizar lote completo:', error.message);
    throw error;
  }
};

const eliminarTerrenoDB = async (id) => {
  try {
    await db.query(`DELETE FROM sistema.terrenos WHERE id_terreno = $1`, [id]);
    return true;
  } catch (e) {
    await db.query(`UPDATE sistema.terrenos SET estado = 'apartado' WHERE id_terreno = $1`, [id]);
    return true;
  }
};

module.exports = { 
  getTerrenos,
  crearTerreno,
  actualizarTerrenoDB,
  eliminarTerrenoDB
};