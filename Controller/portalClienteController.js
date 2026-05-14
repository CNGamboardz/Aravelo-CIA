const portalModel = require('../Model/portalClienteModel');
const pagosModel = require('../Model/pagosModel');

// ============================================================
// DATOS BANCARIOS (Reemplaza con los datos reales de Arévalo)
// ============================================================
const DATOS_BANCO = {
  banco: 'BBVA México',
  titular: 'Arévalo & CIA S.A. de C.V.',
  clabe: '012345678901234567',        // ← REEMPLAZAR
  numero_cuenta: '1234567890',       // ← REEMPLAZAR
  referencia_base: 'AREVALO'
};

// Stripe en modo test (reemplaza con tu Secret Key real)
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_REEMPLAZAR_CON_TU_CLAVE_STRIPE');

// ─────────────────────────────────────────────────────
// AUTENTICACIÓN DEL PORTAL
// ─────────────────────────────────────────────────────

/**
 * POST /api/portal/registrar
 * Auto-registro del cliente en el portal
 */
const registrarPortal = async (req, res) => {
  try {
    const { 
      nombre, apellido_paterno, apellido_materno, correo, telefono, password_cliente,
      municipio, estado, rfc, curp, ocupacion, ingresos_mensuales, fuente_lead, sexo, fecha_nacimiento
    } = req.body;

    if (!nombre || !correo || !password_cliente) {
      return res.status(400).json({ error: 'Nombre, correo y contraseña son obligatorios.' });
    }
    if (password_cliente.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres.' });
    }

    const cliente = await portalModel.registrarClientePortal({ 
      nombre, apellido_paterno, apellido_materno, correo, telefono, password_cliente,
      municipio, estado, rfc, curp, ocupacion, ingresos_mensuales, fuente_lead, sexo, fecha_nacimiento
    });

    res.status(201).json({ mensaje: 'Cuenta creada exitosamente. ¡Bienvenido a Arévalo & CIA!', cliente });
  } catch (error) {
    console.error('Error en registro portal:', error.message);
    res.status(400).json({ error: error.message || 'Error al crear la cuenta.' });
  }
};

/**
 * POST /api/portal/login
 * Autenticación del cliente
 */
const loginPortal = async (req, res) => {
  try {
    const { correo, password } = req.body;
    if (!correo || !password) {
      return res.status(400).json({ error: 'Correo y contraseña son obligatorios.' });
    }
    const cliente = await portalModel.loginCliente(correo, password);
    if (!cliente) {
      return res.status(401).json({ error: 'Correo o contraseña incorrectos.' });
    }
    res.json({ mensaje: 'Acceso autorizado', cliente });
  } catch (error) {
    console.error('Error en login portal:', error.message);
    res.status(500).json({ error: 'Error interno al iniciar sesión.' });
  }
};

// ─────────────────────────────────────────────────────
// OPERACIONES DEL PORTAL
// ─────────────────────────────────────────────────────

/** GET /api/portal/lotes */
const getLotesPortal = async (req, res) => {
  try {
    const lotes = await portalModel.getLotesDisponibles();
    res.json(lotes);
  } catch (error) {
    res.status(500).json({ error: 'Error al cargar el catálogo de lotes.' });
  }
};

/** GET /api/portal/asesores */
const getAsesoresPortal = async (req, res) => {
  try {
    const asesores = await portalModel.getAsesoresActivos();
    res.json(asesores);
  } catch (error) {
    res.status(500).json({ error: 'Error al cargar los asesores.' });
  }
};

/** POST /api/portal/apartar */
const apartarLote = async (req, res) => {
  try {
    const { id_lote, id_cliente, nombre_cliente } = req.body;
    if (!id_lote || !id_cliente) {
      return res.status(400).json({ error: 'Se requiere id_lote e id_cliente.' });
    }
    const lote = await portalModel.apartarLote(id_lote, id_cliente);
    if (!lote) {
      return res.status(404).json({ error: 'Lote no encontrado.' });
    }
    res.json({ mensaje: `Lote ${lote.lote} en ${lote.fraccionamiento} apartado exitosamente.`, lote });
  } catch (error) {
    console.error('Error al apartar lote:', error.message);
    res.status(500).json({ error: 'Error al procesar el apartado.' });
  }
};

/** POST /api/portal/asesor */
const asignarAsesor = async (req, res) => {
  try {
    const { id_cliente, id_asesor } = req.body;
    if (!id_cliente || !id_asesor) {
      return res.status(400).json({ error: 'Se requiere id_cliente e id_asesor.' });
    }
    const resultado = await portalModel.asignarAsesor(id_cliente, id_asesor);
    res.json({ mensaje: 'Asesor asignado exitosamente.', resultado });
  } catch (error) {
    res.status(500).json({ error: 'Error al asignar asesor.' });
  }
};

/** POST /api/portal/cita */
const agendarCita = async (req, res) => {
  try {
    const { id_cliente, fecha, id_lote, nota } = req.body;
    if (!id_cliente || !fecha) {
      return res.status(400).json({ error: 'Se requieren id_cliente y fecha.' });
    }
    const cita = await portalModel.agendarCita(id_cliente, fecha, id_lote, nota);
    res.json({ mensaje: 'Cita agendada exitosamente.', cita });
  } catch (error) {
    console.error('Error al agendar cita:', error.message);
    res.status(500).json({ error: 'Error al registrar la cita.' });
  }
};

/** GET /api/portal/mis-pagos/:id_cliente */
const getMisPagos = async (req, res) => {
  try {
    const { id_cliente } = req.params;
    const pagos = await portalModel.getPagosPorCliente(parseInt(id_cliente));
    res.json(pagos);
  } catch (error) {
    res.status(500).json({ error: 'Error al cargar el historial de pagos.' });
  }
};

/** GET /api/portal/cliente/:id */
const getClientePortal = async (req, res) => {
  try {
    const { id } = req.params;
    const cliente = await portalModel.getClientePorId(parseInt(id));
    if (!cliente) return res.status(404).json({ error: 'Cliente no encontrado.' });
    res.json(cliente);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener datos del cliente.' });
  }
};

/** GET /api/portal/datos-banco */
const getDatosBanco = async (req, res) => {
  try {
    res.json(DATOS_BANCO);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener datos bancarios.' });
  }
};

/** POST /api/portal/stripe-intent — Crear PaymentIntent en Stripe */
const crearStripeIntent = async (req, res) => {
  try {
    const { monto, id_cliente, concepto } = req.body;
    if (!monto || monto <= 0) {
      return res.status(400).json({ error: 'El monto debe ser mayor a cero.' });
    }
    // Stripe trabaja en centavos (MXN)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(parseFloat(monto) * 100),
      currency: 'mxn',
      metadata: {
        id_cliente: String(id_cliente),
        concepto: concepto || 'Pago Arévalo & CIA'
      },
      description: `Pago cliente #${id_cliente} - ${concepto || 'Mensualidad'}`
    });
    res.json({ clientSecret: paymentIntent.client_secret, id: paymentIntent.id });
  } catch (error) {
    console.error('Error Stripe:', error.message);
    res.status(500).json({ error: 'Error al procesar el pago con tarjeta. Verifica la configuración de Stripe.' });
  }
};

/** POST /api/portal/pagar — Registrar pago (transferencia/depósito) */
const registrarPagoPortal = async (req, res) => {
  try {
    const { id_cliente, id_terreno, id_contrato, concepto, monto, metodo_pago, comprobante, stripe_payment_id } = req.body;
    if (!monto || parseFloat(monto) <= 0) {
      return res.status(400).json({ error: 'El monto debe ser mayor a cero.' });
    }
    const pago = await pagosModel.registrarPago({
      id_cliente: parseInt(id_cliente),
      id_contrato: id_contrato ? parseInt(id_contrato) : null,
      id_terreno: id_terreno ? parseInt(id_terreno) : null,
      concepto: concepto || 'Pago desde portal',
      monto: parseFloat(monto),
      metodo_pago: metodo_pago || 'transferencia',
      id_usuario: null,
      comprobante: comprobante || stripe_payment_id || '',
      id_calendario: null
    });
    res.status(201).json({ mensaje: 'Pago registrado exitosamente.', pago });
  } catch (error) {
    console.error('Error registrando pago portal:', error.message);
    res.status(500).json({ error: 'Error al registrar el pago.' });
  }
};

/** GET /api/portal/mis-apartados/:id_cliente */
const getMisApartados = async (req, res) => {
  try {
    const { id_cliente } = req.params;
    const lotes = await portalModel.getMisLotesApartados(parseInt(id_cliente));
    res.json(lotes);
  } catch (error) {
    res.status(500).json({ error: 'Error al cargar los lotes apartados.' });
  }
};

/** POST /api/portal/liberar */
const liberarLote = async (req, res) => {
  try {
    const { id_lote, id_cliente } = req.body;
    if (!id_lote || !id_cliente) {
      return res.status(400).json({ error: 'Faltan parámetros de identificación.' });
    }
    const liberado = await portalModel.liberarLote(id_lote, id_cliente);
    if (!liberado) {
      return res.status(404).json({ error: 'No se pudo liberar el lote. Verifica tu propiedad.' });
    }
    res.json({ mensaje: `El lote en ${liberado.fraccionamiento} ha sido liberado exitosamente.`, liberado });
  } catch (error) {
    res.status(500).json({ error: 'Error interno al liberar la reserva.' });
  }
};

/** PUT /api/portal/cliente/:id — Actualizar perfil completo del cliente */
const actualizarPerfilCliente = async (req, res) => {
  try {
    const { id } = req.params;
    const modificado = await portalModel.actualizarPerfilClienteDB(parseInt(id), req.body);
    if (!modificado) {
      return res.status(404).json({ error: 'No se pudo actualizar el perfil.' });
    }
    // Ocultar password de la respuesta
    delete modificado.password_cliente;
    res.json({ mensaje: 'Perfil y expediente actualizados exitosamente.', cliente: modificado });
  } catch (error) {
    console.error('Error actualizando perfil cliente:', error.message);
    res.status(500).json({ error: 'Error interno al actualizar la información.' });
  }
};

module.exports = {
  registrarPortal,
  loginPortal,
  getLotesPortal,
  getAsesoresPortal,
  apartarLote,
  asignarAsesor,
  agendarCita,
  getMisPagos,
  getClientePortal,
  getDatosBanco,
  crearStripeIntent,
  registrarPagoPortal,
  getMisApartados,
  liberarLote,
  actualizarPerfilCliente
};
