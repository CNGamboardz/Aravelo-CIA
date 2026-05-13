const express = require('express');
const path = require('path');

const app = express(); // ✅ PRIMERO se crea

// Controllers
const clientesController = require('./Controller/clientesController');
const dashboardController = require('./Controller/dashboardController');
const usuariosController = require('./Controller/usuariosController');
const terrenosController = require('./Controller/terrenosController');
const agendaController = require('./Controller/agendaController');
const contratosController = require('./Controller/contratosController');
const pagosController = require('./Controller/pagosController');
const portalController = require('./Controller/portalClienteController');

// Middlewares
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Servir carpetas estáticas
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'View')));
app.use('/style', express.static(path.join(__dirname, 'style')));

// Ruta principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'View', 'index.html'));
});

// Rutas de API - Usuarios & Seguridad
app.post('/api/usuarios/registrar', usuariosController.registrar);
app.post('/api/usuarios/login', usuariosController.login);
app.post('/api/usuarios/logout', usuariosController.logout);
app.post('/api/registro-validar-pin', usuariosController.validarPin);

// Rutas de API - Gestión de Vendedores (RBAC Admin)
app.get('/api/vendedores', usuariosController.listarVendedores);
app.get('/api/vendedores/:id', usuariosController.obtenerVendedor);
app.put('/api/vendedores/:id', usuariosController.modificarVendedor);

// Rutas de API - Agenda Personal
app.get('/api/agenda', agendaController.listarEventos);
app.post('/api/agenda', agendaController.guardarEvento);

// Rutas de API - Clientes
app.get('/clientes', clientesController.obtenerClientes);
app.post('/clientes', clientesController.guardarCliente);
app.put('/clientes/:id', clientesController.actualizarCliente);
app.delete('/clientes/:id', clientesController.eliminarCliente);

// Rutas de API - Terrenos
app.get('/terrenos', terrenosController.obtenerTerrenos);
app.post('/terrenos', terrenosController.guardarTerreno);
app.put('/terrenos/:id', terrenosController.actualizarTerreno);
app.delete('/terrenos/:id', terrenosController.eliminarTerreno);

// Rutas de API - Contratos
app.get('/contratos', contratosController.listarContratos);
app.post('/contratos', contratosController.guardarContrato);

// Rutas de API - Pagos y Cobranza
app.get('/pagos/calendario', pagosController.listarCalendario);
app.get('/pagos', pagosController.listarPagos);
app.post('/pagos', pagosController.aplicarPago);

// Rutas de API - Dashboard
app.get('/dashboard', dashboardController.dashboard);

// ====================================================
// PORTAL DE CLIENTES (Auto-Servicio)
// ====================================================
app.post('/api/portal/registrar', portalController.registrarPortal);
app.post('/api/portal/login', portalController.loginPortal);
app.get('/api/portal/lotes', portalController.getLotesPortal);
app.get('/api/portal/asesores', portalController.getAsesoresPortal);
app.post('/api/portal/apartar', portalController.apartarLote);
app.post('/api/portal/asesor', portalController.asignarAsesor);
app.post('/api/portal/cita', portalController.agendarCita);
app.get('/api/portal/mis-pagos/:id_cliente', portalController.getMisPagos);
app.get('/api/portal/cliente/:id', portalController.getClientePortal);
app.get('/api/portal/datos-banco', portalController.getDatosBanco);
app.post('/api/portal/stripe-intent', portalController.crearStripeIntent);
app.post('/api/portal/pagar', portalController.registrarPagoPortal);
app.get('/api/portal/mis-apartados/:id_cliente', portalController.getMisApartados);
app.post('/api/portal/liberar', portalController.liberarLote);

// Servidor
app.listen(3000, () => {
  console.log('Servidor en http://localhost:3000');
});