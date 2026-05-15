const db = require('../Model/db');
async function promote() {
  try {
    const res = await db.query("UPDATE sistema.usuarios SET rol = 'direccion' WHERE correo = 'gyt221041@gmail.com' RETURNING *");
    if (res.rows.length > 0) {
      console.log('¡ÉXITO! Usuario ' + res.rows[0].nombre + ' promovido a DIRECCIÓN.');
    } else {
      console.log('No se encontró el usuario.');
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
promote();
