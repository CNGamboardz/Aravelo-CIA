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
    const parsed = parseInt(token, 10);
    return isNaN(parsed) ? token : parsed;
  }

  try {
    const hex = token.replace('AC-', '');
    const decipher = crypto.createDecipheriv(ALGORITHM, SECRET_KEY, IV);
    let decrypted = decipher.update(hex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    const idEntero = parseInt(decrypted, 10);
    return isNaN(idEntero) ? decrypted : idEntero;
  } catch (e) {
    return null;
  }
}

module.exports = {
  encriptarId,
  desencriptarId
};
