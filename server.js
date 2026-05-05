const express = require('express');
const path = require('path');

const app = express(); // ✅ PRIMERO se crea

// Controllers
const clientesController = require('./Controller/clientesController');
const dashboardController = require('./Controller/dashboardController');

// Middlewares
app.use(express.json());

// Servir carpetas
app.use('/public', express.static(path.join(__dirname, 'Public')));
app.use(express.static(path.join(__dirname, 'View')));
app.use('/style', express.static(path.join(__dirname, 'style')));

// Ruta principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'View', 'index.html'));
});

// Rutas
app.get('/clientes', clientesController.obtenerClientes);
app.post('/clientes', clientesController.guardarCliente);

app.get('/dashboard', dashboardController.dashboard);

// Servidor
app.listen(3000, () => {
  console.log('Servidor en http://localhost:3000');
});