const pool = require('../Model/db.js');

async function run() {
  try {
    console.log("Corrigiendo esquema de sistema.contratos...");
    
    // Añadir columnas faltantes que espera el modelo
    await pool.query(`
      ALTER TABLE sistema.contratos 
      ADD COLUMN IF NOT EXISTS tipo_plan VARCHAR(50),
      ADD COLUMN IF NOT EXISTS precio_total NUMERIC,
      ADD COLUMN IF NOT EXISTS plazo INTEGER,
      ADD COLUMN IF NOT EXISTS monto_mensual NUMERIC;
    `);

    console.log("¡Esquema corregido exitosamente!");
  } catch (e) {
    console.error("Error al corregir esquema:", e.message);
  } finally {
    pool.end();
  }
}
run();
