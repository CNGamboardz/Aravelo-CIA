const terrenosModel = require('../Model/terrenosModel');
const fs = require('fs');
const path = require('path');
const { encriptarId, desencriptarId, obtenerResponsable } = require('./cryptoHelper');
const dashboardModel = require('../Model/dashboardModel');

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
      id_propietario, observaciones, estado, id_asesor, fecha_venta,
      porcentaje_comision, porcentaje_iva
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

    // Regla de Negocio: No se puede vender un lote sin un cliente (propietario) asignado
    if (estado === 'vendido') {
      const propietarioId = id_propietario ? desencriptarId(id_propietario) : null;
      if (!propietarioId) {
        return res.status(400).json({ error: 'Regla de negocio: No se puede registrar como vendido un lote sin un cliente (propietario) asignado.' });
      }
    }

    // Regla de Negocio: No se puede cancelar un lote sin un motivo documentado
    if (estado === 'cancelado') {
      const obs = observaciones || '';
      if (obs.trim().length < 10) {
        return res.status(400).json({ error: 'Regla de negocio: Para cancelar un terreno, debe documentar un motivo detallado (mínimo 10 caracteres) en el campo de observaciones.' });
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
      id_propietario: id_propietario ? desencriptarId(id_propietario) : null,
      observaciones,
      estado,
      id_asesor: id_asesor ? desencriptarId(id_asesor) : null,
      fecha_venta: fecha_venta || null,
      porcentaje_comision: porcentaje_comision ? parseFloat(porcentaje_comision) : 0,
      porcentaje_iva: porcentaje_iva ? parseFloat(porcentaje_iva) : 0
    });

    const responsable = await obtenerResponsable(req);
    await dashboardModel.registrarMovimiento(
      'terrenos',
      'creacion',
      `Ficha técnica creada para Lote ${nuevo.numero_lote || ''} de Fraccionamiento ${nuevo.fraccionamiento}. Estado inicial: ${nuevo.estado}.`,
      responsable,
      nuevo.id_terreno
    );

    res.status(201).json(nuevo);
  } catch (error) {
    console.error('Error al guardar terreno:', error);
    res.status(500).json({ error: error.message || 'Error del servidor al registrar el terreno' });
  }
};

const actualizarTerreno = async (req, res) => {
  try {
    const { id } = req.params;

    // Bloqueo de seguridad: Si el estado actual del terreno en la DB es 'vendido', denegar cambios
    const db = require('../Model/db');
    const queryActual = await db.query('SELECT estado FROM sistema.terrenos WHERE id_terreno = $1', [id]);
    if (queryActual.rows.length > 0 && queryActual.rows[0].estado === 'vendido') {
      return res.status(400).json({ error: 'Acceso denegado: Este lote ya ha sido vendido y se encuentra cerrado para modificaciones.' });
    }
    const {
      fraccionamiento, superficie, precio_lista, precio_venta, ubicacion, imagen,
      numero_lote, manzana, clave_catastral, frente, fondo, lado_izquierdo, lado_derecho,
      colindancia_norte, colindancia_sur, colindancia_este, colindancia_oeste,
      direccion, colonia, municipio, estado_rep, codigo_postal, latitud, longitud,
      tipo_uso, anticipo, servicio_agua, servicio_luz, servicio_drenaje, servicio_internet,
      calle_pavimentada, descripcion, galeria_imagenes, plano_lote, documento_escritura,
      id_propietario, observaciones, estado, id_asesor, fecha_venta,
      porcentaje_comision, porcentaje_iva
    } = req.body;

    // Regla de Negocio: No se puede vender un lote sin un cliente (propietario) asignado
    if (estado === 'vendido') {
      const propietarioId = id_propietario ? desencriptarId(id_propietario) : null;
      if (!propietarioId) {
        if (queryActual.rows.length === 0 || !queryActual.rows[0].id_propietario) {
          return res.status(400).json({ error: 'Regla de negocio: No se puede registrar como vendido un lote sin un cliente (propietario) asignado.' });
        }
      }
    }

    // Regla de Negocio: No se puede cancelar un terreno sin un motivo documentado
    if (estado === 'cancelado') {
      const obs = observaciones || '';
      if (obs.trim().length < 10) {
        return res.status(400).json({ error: 'Regla de negocio: Para cancelar un terreno, debe documentar un motivo detallado (mínimo 10 caracteres) en el campo de observaciones.' });
      }
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
      id_propietario: id_propietario ? desencriptarId(id_propietario) : null,
      observaciones,
      estado,
      id_asesor: id_asesor ? desencriptarId(id_asesor) : null,
      fecha_venta: fecha_venta || null,
      porcentaje_comision: porcentaje_comision ? parseFloat(porcentaje_comision) : 0,
      porcentaje_iva: porcentaje_iva ? parseFloat(porcentaje_iva) : 0
    });

    const responsable = await obtenerResponsable(req);
    const esCancelacion = estado === 'cancelado';
    await dashboardModel.registrarMovimiento(
      'terrenos',
      esCancelacion ? 'cancelacion' : 'edicion',
      `Ficha técnica del terreno actualizada (Lote ${actualizado.numero_lote || ''}, Fracc ${actualizado.fraccionamiento}). Nuevo estado: ${actualizado.estado}. Motivo/Obs: ${actualizado.observaciones || 'N/A'}.`,
      responsable,
      id
    );

    res.json(actualizado);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Error al actualizar terreno' });
  }
};

const eliminarTerreno = async (req, res) => {
  try {
    const { id } = req.params;
    await terrenosModel.eliminarTerrenoDB(id);

    const responsable = await obtenerResponsable(req);
    await dashboardModel.registrarMovimiento(
      'terrenos',
      'eliminacion',
      `Eliminación definitiva del terreno catastral con ID ${id}.`,
      responsable,
      id
    );

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
