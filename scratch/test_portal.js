const portalModel = require('../Model/portalClienteModel.js');
async function run() {
  try {
    // vamos a consultar los clientes y los lotes que hay en la BD para probar.
    const pool = require('../Model/db.js');
    const cl = await pool.query("SELECT id_cliente FROM sistema.clientes LIMIT 1");
    const cli_id = cl.rows[0]?.id_cliente;
    const as = await pool.query("SELECT id_usuario FROM sistema.usuarios WHERE rol='asesor' LIMIT 1");
    const as_id = as.rows[0]?.id_usuario;

    if (!cli_id) { console.log("No hay cliente registrado"); return; }
    
    console.log("Probando getMisPagos:", cli_id);
    await portalModel.getPagosPorCliente(cli_id).catch(e => console.error("Error pagos:", e.message));

    console.log("Probando asignarAsesor:", cli_id, as_id);
    if(as_id) await portalModel.asignarAsesor(cli_id, as_id).catch(e => console.error("Error asesor:", e.message));

    console.log("Probando agendarCita:", cli_id);
    await portalModel.agendarCita(cli_id, "2026-05-15", null, "Test").catch(e => console.error("Error cita:", e.message));
    
  } catch(e) {
    console.error(e);
  }
}
run();
