const terrenosModel = require('../Model/terrenosModel');
const fs = require('fs');
const path = require('path');
const { encriptarId } = require('./cryptoHelper');

const obtenerTerrenos = async (req, res) => {
  try {
    const terrenos = await terrenosModel.getTerrenos();
    const ofuscados = terrenos.map(t => ({
      ...t,
      id_asesor_contrato: t.id_asesor_contrato ? encriptarId(t.id_asesor_contrato) : null,
      id_asesor_cliente: t.id_asesor_cliente ? encriptarId(t.id_asesor_cliente) : null,
      id_asesor_asignado_cliente: t.id_asesor_asignado_cliente ? encriptarId(t.id_asesor_asignado_cliente) : null
    }));
    res.json(ofuscados);
  } catch (error) {
    console.error('Error al obtener terrenos:', error);
    res.status(500).json({ error: 'Error interno del servidor al obtener terrenos' });
  }
};

const guardarTerreno = async (req, res) => {
  try {
    const {
      fraccionamiento, superficie, precio_lista, precio_venta, ubicacion, imagen,
      numero_lote, manzana, clave_catastral, frente, fondo, lado_izquierdo, lado_derecho,
      colindancia_norte, colindancia_sur, colindancia_este, colindancia_oeste,
      direccion, colonia, municipio, estado_rep, codigo_postal, latitud, longitud,
      tipo_uso, anticipo, servicio_agua, servicio_luz, servicio_drenaje, servicio_internet,
      calle_pavimentada, descripcion, galeria_imagenes, plano_lote, documento_escritura,
      id_propietario, observaciones, estado, id_asesor, fecha_venta
    } = req.body;

    if (!fraccionamiento || !precio_venta) {
      return res.status(400).json({ error: 'El fraccionamiento y precio de venta son obligatorios' });
    }

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
      } catch (errUpload) {
        console.error('Error al persistir imagen local:', errUpload);
      }
    }

    const nuevo = await terrenosModel.crearTerreno({
      fraccionamiento,
      superficie: superficie ? parseFloat(superficie) : 0,
      precio_lista: precio_lista ? parseFloat(precio_lista) : parseFloat(precio_venta),
      precio_venta: parseFloat(precio_venta),
      ubicacion: ubicacion || '',
      imagen: rutaGuardada,
      numero_lote, manzana, clave_catastral,
      frente: frente ? parseFloat(frente) : null,
      fondo: fondo ? parseFloat(fondo) : null,
      lado_izquierdo: lado_izquierdo ? parseFloat(lado_izquierdo) : null,
      lado_derecho: lado_derecho ? parseFloat(lado_derecho) : null,
      colindancia_norte, colindancia_sur, colindancia_este, colindancia_oeste,
      direccion, colonia, municipio, estado_rep, codigo_postal,
      latitud: latitud ? parseFloat(latitud) : null,
      longitud: longitud ? parseFloat(longitud) : null,
      tipo_uso,
      anticipo: anticipo ? parseFloat(anticipo) : 0,
      servicio_agua, servicio_luz, servicio_drenaje, servicio_internet, calle_pavimentada,
      descripcion, galeria_imagenes, plano_lote, documento_escritura,
      id_propietario: id_propietario || null,
      observaciones,
      estado,
      id_asesor: id_asesor || null,
      fecha_venta: fecha_venta || null
    });

    res.status(201).json(nuevo);
  } catch (error) {
    console.error('Error al guardar terreno:', error);
    res.status(500).json({ error: error.message || 'Error del servidor al registrar el terreno' });
  }
};

const actualizarTerreno = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      fraccionamiento, superficie, precio_lista, precio_venta, ubicacion, imagen,
      numero_lote, manzana, clave_catastral, frente, fondo, lado_izquierdo, lado_derecho,
      colindancia_norte, colindancia_sur, colindancia_este, colindancia_oeste,
      direccion, colonia, municipio, estado_rep, codigo_postal, latitud, longitud,
      tipo_uso, anticipo, servicio_agua, servicio_luz, servicio_drenaje, servicio_internet,
      calle_pavimentada, descripcion, galeria_imagenes, plano_lote, documento_escritura,
      id_propietario, observaciones, estado, id_asesor, fecha_venta
    } = req.body;

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
      imagen: rutaGuardada,
      numero_lote, manzana, clave_catastral,
      frente: frente ? parseFloat(frente) : null,
      fondo: fondo ? parseFloat(fondo) : null,
      lado_izquierdo: lado_izquierdo ? parseFloat(lado_izquierdo) : null,
      lado_derecho: lado_derecho ? parseFloat(lado_derecho) : null,
      colindancia_norte, colindancia_sur, colindancia_este, colindancia_oeste,
      direccion, colonia, municipio, estado_rep, codigo_postal,
      latitud: latitud ? parseFloat(latitud) : null,
      longitud: longitud ? parseFloat(longitud) : null,
      tipo_uso,
      anticipo: anticipo ? parseFloat(anticipo) : 0,
      servicio_agua, servicio_luz, servicio_drenaje, servicio_internet, calle_pavimentada,
      descripcion, galeria_imagenes, plano_lote, documento_escritura,
      id_propietario: id_propietario || null,
      observaciones,
      estado,
      id_asesor: id_asesor || null,
      fecha_venta: fecha_venta || null
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
