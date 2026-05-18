const pool = require('./Model/db');
pool.query("SELECT password_cliente FROM sistema.clientes WHERE correo = 'erick.gamboa93@unach.mx'")
  .then(r => { console.log(r.rows); process.exit(0); })
  .catch(console.error);
