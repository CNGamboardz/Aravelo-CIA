const crypto = require('crypto');

// Algoritmo AES-256-CBC con clave estática de alta seguridad
const ALGORITHM = 'aes-256-cbc';
const SECRET_KEY = crypto.scryptSync('ArevaloCIA_Secure_Key_2026_!@#', 'salt_arevalo_cia', 32);
// Vector de inicialización fijo para que un mismo ID siempre devuelva el mismo token (necesario para persistencia visual en URLs)
const IV = Buffer.alloc(16, 0);

/**
 * Encripta un identificador numérico o de texto en un token seguro (ej. AC-8f9a2b...)
 */
function encriptarId(id) {
  if (id === null || id === undefined || id === '') return null;
  // Si ya está encriptado, devolverlo intacto
  if (typeof id === 'string' && id.startsWith('AC-')) return id;
  
  try {
    const cipher = crypto.createCipheriv(ALGORITHM, SECRET_KEY, IV);
    let encrypted = cipher.update(id.toString(), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return 'AC-' + encrypted;
  } catch (e) {
    return id;
  }
}

/**
 * Desencripta un token seguro (AC-...) devolviendo el ID entero original
 */
function desencriptarId(token) {
  if (!token) return null;
  // Si es un número o un string numérico sin prefijo, devolverlo parseado
  if (typeof token === 'number') return token;
  if (typeof token === 'string' && !token.startsWith('AC-')) {
    return token;
  }

  try {
    const hex = token.replace('AC-', '');
    const decipher = crypto.createDecipheriv(ALGORITHM, SECRET_KEY, IV);
    let decrypted = decipher.update(hex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (e) {
    return null;
  }
}

async function obtenerResponsable(req) {
  if (!req) return 'Sistema Automatizado';

  // 1. Validar si el cliente final del portal está enviando su identificación
  if (req.params && req.params.id_cliente) {
    try {
      const db = require('../Model/db');
      const c = await db.query('SELECT nombre, correo FROM sistema.clientes WHERE id_cliente = $1', [desencriptarId(req.params.id_cliente)]);
      if (c.rows.length > 0) {
        return `Cliente: ${c.rows[0].nombre} (${c.rows[0].correo})`;
      }
    } catch (e) {}
  }

  // 2. Verificar cabecera personalizada
  if (req.headers && req.headers['x-responsable']) {
    return req.headers['x-responsable'];
  }
  
  // 3. Verificar cuerpo del request
  if (req.body && req.body.responsable) {
    return req.body.responsable;
  }
  
  // 4. Intentar resolver id_usuario del cuerpo
  if (req.body && req.body.id_usuario) {
    try {
      const idReal = desencriptarId(req.body.id_usuario);
      if (idReal) {
        const db = require('../Model/db');
        const u = await db.query('SELECT nombre, correo FROM sistema.usuarios WHERE id_usuario = $1', [idReal]);
        if (u.rows.length > 0) {
          return `${u.rows[0].nombre} (${u.rows[0].correo})`;
        }
      }
    } catch (e) {}
  }
  
  return 'Usuario Administrador';
}

module.exports = {
  encriptarId,
  desencriptarId,
  obtenerResponsable
};
