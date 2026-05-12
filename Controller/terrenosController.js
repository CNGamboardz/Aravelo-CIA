const terrenosModel = require('../Model/terrenosModel');
const fs = require('fs');
const path = require('path');

const obtenerTerrenos = async (req, res) => {
  try {
    const terrenos = await terrenosModel.getTerrenos();
    res.json(terrenos);
  } catch (error) {
    console.error('Error al obtener terrenos:', error);
    res.status(500).json({ error: 'Error interno del servidor al obtener terrenos' });
  }
};

const guardarTerreno = async (req, res) => {
  try {
    const { fraccionamiento, superficie, precio_lista, precio_venta, ubicacion, imagen } = req.body;

    if (!fraccionamiento || !precio_venta) {
      return res.status(400).json({ error: 'El fraccionamiento y precio de venta son obligatorios' });
    }

    let rutaGuardada = imagen || '';

    // Si la imagen viene como archivo local decodificado en Base64, lo guardamos físicamente en el proyecto
    if (imagen && imagen.startsWith('data:image/')) {
      try {
        const matches = imagen.match(/^data:image\/([a-zA-Z0-9-.+]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
          const buffer = Buffer.from(matches[2], 'base64');
          const fileName = 'lote_' + Date.now() + '.' + ext;
          
          // Carpeta de uploads segura dentro de /public
          const dirPath = path.join(__dirname, '..', 'public', 'uploads');
          if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
          }

          const fullPath = path.join(dirPath, fileName);
          fs.writeFileSync(fullPath, buffer);
          rutaGuardada = '/public/uploads/' + fileName;
        }
      } catch (errUpload) {
        console.error('Error al persistir el archivo de imagen local:', errUpload);
      }
    }

    const nuevo = await terrenosModel.crearTerreno({
      fraccionamiento,
      superficie: superficie ? parseFloat(superficie) : 0,
      precio_lista: precio_lista ? parseFloat(precio_lista) : parseFloat(precio_venta),
      precio_venta: parseFloat(precio_venta),
      ubicacion: ubicacion || '',
      imagen: rutaGuardada
    });

    res.status(201).json(nuevo);
  } catch (error) {
    console.error('Error al guardar terreno:', error);
    res.status(500).json({ error: error.message || 'Error interno del servidor al registrar el terreno en la base de datos' });
  }
};

const actualizarTerreno = async (req, res) => {
  try {
    const { id } = req.params;
    const { fraccionamiento, superficie, precio_lista, precio_venta, ubicacion, imagen } = req.body;

    let rutaGuardada = imagen || '';
    if (imagen && imagen.startsWith('data:image/')) {
      try {
        const matches = imagen.match(/^data:image\/([a-zA-Z0-9-.+]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
          const buffer = Buffer.from(matches[2], 'base64');
          const fileName = 'lote_' + Date.now() + '.' + ext;
          const dirPath = path.join(__dirname, '..', 'public', 'uploads');
          if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
          fs.writeFileSync(path.join(dirPath, fileName), buffer);
          rutaGuardada = '/public/uploads/' + fileName;
        }
      } catch (errUp) {}
    }

    const actualizado = await terrenosModel.actualizarTerrenoDB(id, {
      fraccionamiento,
      superficie: superficie ? parseFloat(superficie) : 0,
      precio_lista: precio_lista ? parseFloat(precio_lista) : parseFloat(precio_venta),
      precio_venta: parseFloat(precio_venta),
      ubicacion: ubicacion || '',
      imagen: rutaGuardada
    });
    res.json(actualizado);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Error al actualizar terreno' });
  }
};

const eliminarTerreno = async (req, res) => {
  try {
    const { id } = req.params;
    await terrenosModel.eliminarTerrenoDB(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Error al eliminar terreno' });
  }
};

module.exports = {
  obtenerTerrenos,
  guardarTerreno,
  actualizarTerreno,
  eliminarTerreno
};
