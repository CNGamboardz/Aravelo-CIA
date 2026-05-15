const db = require('../Model/db');
async function migrate() {
  try {
    await db.query("ALTER TABLE sistema.clientes ADD COLUMN IF NOT EXISTS etapa VARCHAR(50) DEFAULT 'Prospecto nuevo'");
    console.log('Columna etapa añadida con éxito.');
    
    // Inicializar registros existentes
    await db.query("UPDATE sistema.clientes SET etapa = 'Prospecto nuevo' WHERE etapa IS NULL");
    console.log('Registros existentes inicializados.');
    
    process.exit(0);
  } catch (err) {
    console.error('Error en migración:', err);
    process.exit(1);
  }
}
migrate();
