const pool = require('../Model/db.js');

async function migrate() {
  try {
    console.log("Iniciando migración de campos para contratos...");
    
    // 1. Agregar penalizaciones (Texto)
    await pool.query('ALTER TABLE sistema.contratos ADD COLUMN IF NOT EXISTS penalizaciones TEXT;');
    
    // 2. Agregar documentos_json (JSONB) para adjuntos múltiples
    await pool.query('ALTER TABLE sistema.contratos ADD COLUMN IF NOT EXISTS documentos_json JSONB;');
    
    console.log("✅ Columnas penalizaciones y documentos_json añadidas correctamente.");
    
  } catch (error) {
    console.error("❌ Error en migración:", error.message);
  } finally {
    pool.end();
  }
}

migrate();
