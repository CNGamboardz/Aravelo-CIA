const db = require('./Model/db');

async function fix() {
  try {
    await db.query("ALTER TABLE sistema.terrenos ALTER COLUMN id_asesor TYPE VARCHAR(255);");
    await db.query("ALTER TABLE sistema.terrenos ALTER COLUMN id_propietario TYPE VARCHAR(255);");
    console.log("Columnas arregladas.");
  } catch (e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
fix();
