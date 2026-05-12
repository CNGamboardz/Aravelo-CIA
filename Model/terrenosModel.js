const db = require('./db');

// Obtener terrenos disponibles
const getTerrenos = async () => {
  const res = await db.query(
    "SELECT * FROM sistema.terrenos WHERE estado = 'disponible' ORDER BY id_terreno DESC"
  );
  return res.rows;
};

// Crear un nuevo terreno en la base de datos con soporte de imagen
const crearTerreno = async (terreno) => {
  const { fraccionamiento, superficie, precio_lista, precio_venta, ubicacion, imagen } = terreno;

  // Verificamos proactivamente que exista la columna de imagen para que no falle la inserción
  try {
    await db.query('ALTER TABLE sistema.terrenos ADD COLUMN IF NOT EXISTS imagen TEXT;');
  } catch (errCol) {
    console.warn('Aviso: No se pudo verificar/crear la columna imagen en BD:', errCol.message);
  }

  // Insertar incluyendo la imagen
  try {
    const res = await db.query(
      `INSERT INTO sistema.terrenos 
       (fraccionamiento, superficie, precio_lista, precio_venta, estado, ubicacion, imagen)
       VALUES ($1, $2, $3, $4, 'disponible', $5, $6) RETURNING *`,
      [fraccionamiento, superficie, precio_lista, precio_venta, ubicacion, imagen || '']
    );
    return res.rows[0];
  } catch (error) {
    // Si por alguna razón la columna imagen sigue sin existir, hacemos fallback a la estructura clásica
    console.warn('Fallback: Insertando terreno sin columna imagen debido a estructura estricta:', error.message);
    const resFallback = await db.query(
      `INSERT INTO sistema.terrenos 
       (fraccionamiento, superficie, precio_lista, precio_venta, estado, ubicacion)
       VALUES ($1, $2, $3, $4, 'disponible', $5) RETURNING *`,
      [fraccionamiento, superficie, precio_lista, precio_venta, ubicacion]
    );
    return resFallback.rows[0];
  }
};

const actualizarTerrenoDB = async (id, terreno) => {
  const { fraccionamiento, superficie, precio_lista, precio_venta, ubicacion, imagen } = terreno;
  try {
    const res = await db.query(
      `UPDATE sistema.terrenos 
       SET fraccionamiento = $1, superficie = $2, precio_lista = $3, precio_venta = $4, ubicacion = $5, imagen = $6
       WHERE id_terreno = $7 RETURNING *`,
      [fraccionamiento, superficie, precio_lista, precio_venta, ubicacion, imagen || '', id]
    );
    return res.rows[0];
  } catch (e) {
    const resFallback = await db.query(
      `UPDATE sistema.terrenos 
       SET fraccionamiento = $1, superficie = $2, precio_lista = $3, precio_venta = $4, ubicacion = $5
       WHERE id_terreno = $6 RETURNING *`,
      [fraccionamiento, superficie, precio_lista, precio_venta, ubicacion, id]
    );
    return resFallback.rows[0];
  }
};

const eliminarTerrenoDB = async (id) => {
  try {
    await db.query(`DELETE FROM sistema.terrenos WHERE id_terreno = $1`, [id]);
    return true;
  } catch (e) {
    // Soft-delete si el terreno ya tiene contratos asignados
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