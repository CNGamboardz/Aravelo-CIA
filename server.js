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
app.post('/api/registro-validar-pin', usuariosController.validarPin);

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

// Servidor
app.listen(3000, () => {
  console.log('Servidor en http://localhost:3000');
});