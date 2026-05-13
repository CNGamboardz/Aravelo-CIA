const usuariosModel = require('../Model/usuariosModel');
const bcrypt = require('bcryptjs');
const { encriptarId, desencriptarId } = require('./cryptoHelper');

// Registrar un nuevo usuario
const registrar = async (req, res) => {
  try {
    const { nombre, correo, password, rol } = req.body;

    // Validar campos requeridos
    if (!nombre || !correo || !password || !rol) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    // Verificar si el usuario ya existe
    const usuarioExistente = await usuariosModel.getUsuarioByCorreo(correo);
    if (usuarioExistente) {
      return res.status(400).json({ error: 'El correo electrónico ya está registrado' });
    }

    // Encriptar la contraseña
    const salt = await bcrypt.genSalt(10);
    const passwordEncriptada = await bcrypt.hash(password, salt);

    // Guardar en la base de datos
    const nuevoUsuario = await usuariosModel.crearUsuario({
      nombre,
      correo,
      password: passwordEncriptada,
      rol
    });

    res.status(201).json({
      mensaje: 'Usuario registrado exitosamente',
      usuario: {
        ...nuevoUsuario,
        id_usuario: encriptarId(nuevoUsuario.id_usuario)
      }
    });
  } catch (error) {
    console.error('Error al registrar usuario:', error);
    // Código 23505 es violación de restricción UNIQUE en PostgreSQL
    if (error.code === '23505') {
      return res.status(400).json({ error: 'El correo electrónico ya está registrado' });
    }
    res.status(500).json({ error: 'Error interno del servidor al registrar' });
  }
};

// Iniciar sesión
const login = async (req, res) => {
  try {
    const { correo, password } = req.body;

    if (!correo || !password) {
      return res.status(400).json({ error: 'Correo y contraseña son obligatorios' });
    }

    // Buscar usuario por correo
    const usuario = await usuariosModel.getUsuarioByCorreo(correo);
    if (!usuario) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    // Comparar contraseñas
    const passwordValida = await bcrypt.compare(password, usuario.password);
    if (!passwordValida) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    // Encender atómicamente la presencia del usuario regida por la columna de estado
    await usuariosModel.actualizarEstadoSesionDB(usuario.id_usuario, true);

    // Retornar datos del usuario sin la contraseña
    res.json({
      mensaje: 'Inicio de sesión exitoso',
      usuario: {
        id_usuario: encriptarId(usuario.id_usuario),
        nombre: usuario.nombre,
        correo: usuario.correo,
        rol: usuario.rol
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error interno del servidor en login' });
  }
};

// Validar PIN de propietario para acceso al registro
const validarPin = (req, res) => {
  const { pin } = req.body;
  if (pin === 'AREVALO781') { // PIN de cumpleaños
    return res.json({ success: true });
  }
  return res.status(401).json({ error: 'PIN de acceso incorrecto' });
};

// Controladores para la gestión avanzada de vendedores / agentes
const listarVendedores = async (req, res) => {
  try {
    const data = await usuariosModel.getVendedores();
    const encriptados = data.map(u => ({
      ...u,
      id_usuario: encriptarId(u.id_usuario)
    }));
    res.json(encriptados);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Error al obtener vendedores' });
  }
};

const obtenerVendedor = async (req, res) => {
  try {
    const idReal = desencriptarId(req.params.id);
    const data = await usuariosModel.getVendedorById(idReal);
    if (!data) return res.status(404).json({ error: 'Vendedor no encontrado' });
    res.json({
      ...data,
      id_usuario: encriptarId(data.id_usuario)
    });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Error al obtener vendedor' });
  }
};

const modificarVendedor = async (req, res) => {
  try {
    const idReal = desencriptarId(req.params.id);
    const actualizado = await usuariosModel.actualizarVendedorDB(idReal, req.body);
    res.json({
      ...actualizado,
      id_usuario: encriptarId(actualizado ? actualizado.id_usuario : idReal)
    });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Error al actualizar vendedor' });
  }
};

// Cerrar sesión y desconectar presencia atómicamente
const logout = async (req, res) => {
  try {
    const idReal = desencriptarId(req.body.id_usuario);
    if (idReal) {
      await usuariosModel.actualizarEstadoSesionDB(idReal, false);
    }
    res.json({ success: true, mensaje: 'Presencia desconectada' });
  } catch (error) {
    res.status(500).json({ error: 'Error al desconectar presencia' });
  }
};

module.exports = {
  registrar,
  login,
  logout,
  validarPin,
  listarVendedores,
  obtenerVendedor,
  modificarVendedor
};
