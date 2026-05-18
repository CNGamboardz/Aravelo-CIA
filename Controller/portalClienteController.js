const portalModel = require('../Model/portalClienteModel');
const pagosModel = require('../Model/pagosModel');
const clientesModel = require('../Model/clientesModel');
const { obtenerResponsable } = require('./cryptoHelper');
const dashboardModel = require('../Model/dashboardModel');

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
// AUTENTICACIÓN DEL PORTAL Y VALIDACIÓN DE CORREO
// ─────────────────────────────────────────────────────

const dns = require('dns').promises;

/**
 * POST /api/portal/validar-dominio-correo
 * Verifica si el dominio del correo tiene registros MX (es decir, si puede recibir correos)
 */
const validarDominioCorreo = async (req, res) => {
  const { correo } = req.body;
  if (!correo || !correo.includes('@')) {
    return res.status(400).json({ error: 'Formato de correo inválido.', valido: false });
  }

  const dominio = correo.split('@')[1];
  try {
    const mxRecords = await dns.resolveMx(dominio);
    if (mxRecords && mxRecords.length > 0) {
      return res.json({ valido: true, mensaje: 'El dominio existe y puede recibir correos.' });
    } else {
      return res.json({ valido: false, error: 'El dominio de correo no existe o no admite mensajes.' });
    }
  } catch (error) {
    // Si resolveMx tira error, el dominio no existe o no tiene registros MX
    return res.json({ valido: false, error: 'El dominio de correo no es válido o no existe.' });
  }
};

const crypto = require('crypto');
const nodemailer = require('nodemailer');

// Configuración de Nodemailer (Reemplazar con credenciales reales)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'tu_correo_real@gmail.com',
    pass: process.env.EMAIL_PASS || 'tu_contrasena_de_aplicacion'
  }
});

/**
 * POST /api/portal/solicitar-recuperacion
 */
const solicitarRecuperacion = async (req, res) => {
  const { correo } = req.body;
  if (!correo) return res.status(400).json({ error: 'El correo es obligatorio.' });

  try {
    const qCliente = `SELECT id_cliente, nombre FROM sistema.clientes WHERE correo = $1 LIMIT 1;`;
    const rCliente = await require('../Model/db').query(qCliente, [correo]);

    if (rCliente.rows.length === 0) {
      // Retornar éxito falso por seguridad (evitar enumeración de correos)
      return res.json({ success: true, mensaje: 'Si el correo existe, recibirás un enlace.' });
    }

    const cliente = rCliente.rows[0];
    const token = crypto.randomBytes(32).toString('hex');
    const expireDate = new Date(Date.now() + 15 * 60 * 1000); // 15 min

    await require('../Model/db').query(
      `UPDATE sistema.clientes SET reset_token = $1, reset_token_expires = $2 WHERE id_cliente = $3`,
      [token, expireDate, cliente.id_cliente]
    );

    const resetLink = `http://localhost:3000/reset-password.html?token=${token}`;

    // Imprimir en consola para pruebas sin correo real
    console.log('--- ENLACE DE RECUPERACIÓN SECRETO ---');
    console.log(resetLink);
    console.log('--------------------------------------');

    // Intentar enviar el correo
    try {
      await transporter.sendMail({
        from: '"Arévalo & CIA" <no-reply@arevalocia.com>',
        to: correo,
        subject: 'Recuperación de Contraseña - Portal de Clientes',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2>Hola ${cliente.nombre},</h2>
            <p>Hemos recibido una solicitud para restablecer tu contraseña en el Portal Inmobiliario de Arévalo & CIA.</p>
            <p>Haz clic en el siguiente enlace para crear una nueva contraseña. Este enlace expirará en 15 minutos por seguridad:</p>
            <a href="${resetLink}" style="display: inline-block; padding: 12px 24px; background: #2563eb; color: #fff; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 15px;">Restablecer mi Contraseña</a>
            <p style="margin-top: 20px; font-size: 12px; color: #777;">Si no solicitaste esto, puedes ignorar este correo.</p>
          </div>
        `
      });
    } catch(mailErr) {
      console.error('Fallo al enviar correo real (ver consola para el link):', mailErr.message);
    }

    res.json({ success: true, mensaje: 'Se ha enviado el enlace de recuperación a tu correo.' });

  } catch (error) {
    console.error('Error en solicitarRecuperacion:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

/**
 * POST /api/portal/restablecer-password
 */
const restablecerPassword = async (req, res) => {
  const { token, nuevaPassword } = req.body;
  if (!token || !nuevaPassword) return res.status(400).json({ error: 'Faltan datos.' });

  try {
    const qToken = `
      SELECT id_cliente, reset_token_expires 
      FROM sistema.clientes 
      WHERE reset_token = $1 LIMIT 1;
    `;
    const rToken = await require('../Model/db').query(qToken, [token]);

    if (rToken.rows.length === 0) {
      return res.status(400).json({ error: 'El enlace es inválido.' });
    }

    const cliente = rToken.rows[0];
    if (new Date() > new Date(cliente.reset_token_expires)) {
      return res.status(400).json({ error: 'El enlace ha expirado. Solicita uno nuevo.' });
    }

    // Encriptar la nueva contraseña
    const bcrypt = require('bcryptjs');
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(nuevaPassword, salt);

    // Actualizar clave y limpiar token
    await require('../Model/db').query(
      `UPDATE sistema.clientes SET password_cliente = $1, reset_token = NULL, reset_token_expires = NULL WHERE id_cliente = $2`,
      [passwordHash, cliente.id_cliente]
    );

    res.json({ success: true, mensaje: 'Contraseña actualizada correctamente.' });

  } catch (error) {
    console.error('Error en restablecerPassword:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

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

    // Actualizar etapa a 'Apartó'
    await clientesModel.actualizarEtapaCliente(id_cliente, 'Apartó');

    // ASIGNACIÓN AUTOMÁTICA DE ASESOR DEL LOTE AL CLIENTE
    if (lote.id_asesor) {
      await portalModel.asignarAsesor(id_cliente, lote.id_asesor);
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

    // BLOQUEO DE SEGURIDAD: SI TIENE PAGOS PENDIENTES NO PUEDE CAMBIAR DE ASESOR
    const tieneDeuda = await portalModel.tienePagosPendientes(id_cliente);
    if (tieneDeuda) {
      return res.status(403).json({ 
        error: 'bloqueado_por_deuda',
        mensaje: 'No puedes realizar el cambio de asesor debido a que cuentas con cuotas pendientes en tu plan de financiamiento. Por favor liquida tus pagos para habilitar esta opción.' 
      });
    }

    const resultado = await portalModel.asignarAsesor(id_cliente, id_asesor);
    res.json({ mensaje: 'Asesor asignado exitosamente.', resultado });
  } catch (error) {
    res.status(500).json({ error: 'Error al asignar asesor: ' + error.message });
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
    
    // ASIGNACIÓN AUTOMÁTICA SI SE ELIGIÓ UN LOTE EN LA CITA
    if (id_lote) {
      // Obtener el lote para saber quién es el asesor responsable
      const queryLote = await require('../Model/db').query('SELECT id_asesor FROM sistema.terrenos WHERE id_terreno = $1', [id_lote]);
      if (queryLote.rows.length > 0 && queryLote.rows[0].id_asesor) {
        await portalModel.asignarAsesor(id_cliente, queryLote.rows[0].id_asesor);
      }
    }
    
    // Actualizar etapa a 'Contactado' si es prospecto nuevo
    const cliente = await clientesModel.getClientes().then(list => list.find(c => c.id_cliente == id_cliente));
    if (cliente && cliente.etapa === 'Prospecto nuevo') {
      await clientesModel.actualizarEtapaCliente(id_cliente, 'Contactado');
    }

    res.json({ mensaje: 'Cita agendada exitosamente.', cita });
  } catch (error) {
    console.error('Error al agendar cita:', error.message);
    res.status(500).json({ error: 'Error al registrar la cita: ' + error.message });
  }
};

/** GET /api/portal/mis-pagos/:id_cliente */
const getMisPagos = async (req, res) => {
  try {
    const { id_cliente } = req.params;
    const pagos = await portalModel.getPagosPorCliente(id_cliente);
    res.json(pagos);
  } catch (error) {
    res.status(500).json({ error: 'Error al cargar el historial de pagos: ' + error.message });
  }
};

/** GET /api/portal/mis-alertas/:id_cliente */
const getMisAlertas = async (req, res) => {
  try {
    const { id_cliente } = req.params;
    
    // Obtener la configuración de recargos
    const configRes = await require('../Model/db').query('SELECT * FROM sistema.configuracion');
    const config = {};
    configRes.rows.forEach(r => { config[r.clave] = r.valor; });
    const pctMora = parseFloat(config['mora_porcentaje'] || 5) / 100;
    const cargoDiario = parseFloat(config['mora_diaria_fija'] || 50);

    // Obtener cuotas pendientes relevantes (vencidas, vence hoy o vence en 3 días)
    const alertasRes = await require('../Model/db').query(`
      SELECT cp.id_calendario, cp.numero_pago, cp.fecha_esperada, cp.monto_esperado, cp.estatus,
             t.fraccionamiento, t.numero_lote AS lote_num, t.manzana,
             CASE 
               WHEN cp.fecha_esperada < CURRENT_DATE THEN CURRENT_DATE - cp.fecha_esperada
               ELSE 0
             END AS dias_atraso
      FROM sistema.calendario_pagos cp
      JOIN sistema.contratos c ON cp.id_contrato = c.id_contrato
      JOIN sistema.terrenos t ON c.id_terreno = t.id_terreno
      WHERE cp.id_cliente = $1
        AND cp.estatus = 'pendiente'
        AND (
          cp.fecha_esperada < CURRENT_DATE
          OR cp.fecha_esperada = CURRENT_DATE
          OR cp.fecha_esperada = CURRENT_DATE + INTERVAL '3 days'
        )
      ORDER BY cp.fecha_esperada ASC
    `, [id_cliente]);

    const alertas = alertasRes.rows.map(a => {
      let comision_atraso = 0;
      if (a.dias_atraso > 0) {
        comision_atraso = (parseFloat(a.monto_esperado) * pctMora) + (cargoDiario * a.dias_atraso);
      }
      return {
        ...a,
        comision_atraso: parseFloat(comision_atraso.toFixed(2))
      };
    });

    res.json(alertas);
  } catch (error) {
    console.error('Error al obtener alertas de cliente:', error);
    res.status(500).json({ error: 'Error al consultar alertas del cliente' });
  }
};

/** GET /api/portal/cliente/:id */
const getClientePortal = async (req, res) => {
  try {
    const { id } = req.params;
    const cliente = await portalModel.getClientePorId(id);
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

    // Regla de Negocio: No se permite registrar pagos sin contrato
    if (!id_contrato) {
      return res.status(400).json({ error: 'Regla de negocio: No se permite registrar pagos sin un contrato asociado y válido.' });
    }

    const pago = await pagosModel.registrarPago({
      id_cliente: id_cliente,
      id_contrato: id_contrato,
      id_terreno: id_terreno || null,
      concepto: concepto || 'Pago desde portal',
      monto: parseFloat(monto),
      metodo_pago: metodo_pago || 'transferencia',
      id_usuario: null,
      comprobante: comprobante || stripe_payment_id || '',
      id_calendario: null
    });

    // Registrar en el historial de auditoría
    const responsable = await obtenerResponsable(req);
    await dashboardModel.registrarMovimiento(
      'pagos',
      'creacion',
      `Pago registrado desde portal: abono de $${parseFloat(monto).toLocaleString('es-MX', {minimumFractionDigits:2})} mediante ${metodo_pago || 'transferencia'} para Contrato ID ${pago.id_contrato}.`,
      responsable,
      pago.id_pago
    );

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
    const lotes = await portalModel.getMisLotesApartados(id_cliente);
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

    // --- LÓGICA DE ACTUALIZACIÓN DE ETAPA REAL ---
    // 1. Verificar si tiene más apartados o compras
    const otrosApartados = await portalModel.getMisLotesApartados(id_cliente);
    const comprasRealizadas = await portalModel.getMisLotesComprados(id_cliente);

    let nuevaEtapa = 'Cancelado';
    if (comprasRealizadas.length > 0 || otrosApartados.length > 0) {
      nuevaEtapa = 'En riesgo'; // Aún tiene interés pero canceló algo, poner en alerta
    }

    // 2. Ejecutar cambio de etapa y motivo documentado (Regla de negocio: motivo documentado)
    await clientesModel.actualizarEtapaCliente(id_cliente, nuevaEtapa);
    
    const db = require('../Model/db');
    await db.query(
      `UPDATE sistema.clientes 
       SET observaciones = CONCAT(COALESCE(observaciones, ''), '\n- Liberó el lote en ', $1::text, ' voluntariamente desde el portal de clientes.') 
       WHERE id_cliente = $2`,
      [liberado.fraccionamiento, id_cliente]
    );

    // Registrar en el historial de auditoría
    const responsable = await obtenerResponsable(req);
    await dashboardModel.registrarMovimiento(
      'terrenos',
      'cancelacion',
      `Lote en ${liberado.fraccionamiento} (Lote #${liberado.numero_lote || ''}, Mza #${liberado.manzana || ''}) liberado voluntariamente desde el portal de clientes.`,
      responsable,
      id_lote
    );

    res.json({ mensaje: `El lote en ${liberado.fraccionamiento} ha sido liberado exitosamente. Tu estatus ha sido actualizado a: ${nuevaEtapa}.`, liberado, nuevaEtapa });
  } catch (error) {
    console.error('Error al liberar lote:', error);
    res.status(500).json({ error: 'Error interno al liberar la reserva.' });
  }
};

/** PUT /api/portal/cliente/:id — Actualizar perfil completo del cliente */
const actualizarPerfilCliente = async (req, res) => {
  try {
    const { id } = req.params;
    const modificado = await portalModel.actualizarPerfilClienteDB(id, req.body);
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

/** GET /api/portal/mis-compras/:id_cliente — Obtener lotes comprados */
const getMisCompras = async (req, res) => {
  try {
    const { id_cliente } = req.params;
    const lotes = await portalModel.getMisLotesComprados(id_cliente);
    res.json(lotes);
  } catch (error) {
    console.error('Error obteniendo mis compras:', error);
    res.status(500).json({ error: 'Error interno al consultar historial de compras.' });
  }
};

module.exports = {
  validarDominioCorreo,
  solicitarRecuperacion,
  restablecerPassword,
  registrarPortal,
  loginPortal,
  getLotesPortal,
  getAsesoresPortal,
  apartarLote,
  asignarAsesor,
  agendarCita,
  getMisPagos,
  getMisAlertas,
  getClientePortal,
  getDatosBanco,
  crearStripeIntent,
  registrarPagoPortal,
  getMisApartados,
  liberarLote,
  actualizarPerfilCliente,
  getMisCompras
};
