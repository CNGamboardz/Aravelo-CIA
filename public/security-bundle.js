/**
 * ==============================================================================
 * ESCUDO DE SEGURIDAD AVANZADA — ARÉVALO & CIA (MILITARY-GRADE SHIELD)
 * ==============================================================================
 * Protección activa contra Crackers, Scrapers, Inspección de DOM y Robo de Imágenes.
 */

(function () {
  'use strict';

  console.log("%c¡ALTO AHÍ!", "color: red; font-size: 40px; font-weight: bold; -webkit-text-stroke: 1px black;");
  console.log("%cEste sistema cuenta con seguridad avanzada y auditoría activa de intrusiones. Cualquier intento de descompilación, scraping o acceso no autorizado será registrado con su IP.", "font-size: 14px; color: #333;");

  // ============================================================================
  // 1. BLOQUEO ACTIVO DE HERRAMIENTAS DE DESARROLLADOR (ANTI-INSPECCIÓN)
  // ============================================================================
  
  // Bloquear menú contextual (clic derecho)
  document.addEventListener('contextmenu', function (e) {
    e.preventDefault();
    return false;
  }, false);

  // Bloquear combinaciones de teclas de crackers y scrapers
  window.addEventListener('keydown', function (e) {
    // F12
    if (e.key === 'F12' || e.keyCode === 123) {
      e.preventDefault();
      return false;
    }
    // Ctrl+Shift+I / Cmd+Option+I (Inspeccionar)
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.keyCode === 73)) {
      e.preventDefault();
      return false;
    }
    // Ctrl+Shift+J / Cmd+Option+J (Consola)
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'J' || e.key === 'j' || e.keyCode === 74)) {
      e.preventDefault();
      return false;
    }
    // Ctrl+Shift+C (Inspección de elemento directo)
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'C' || e.key === 'c' || e.keyCode === 67)) {
      e.preventDefault();
      return false;
    }
    // Ctrl+U / Cmd+U (Ver código fuente)
    if ((e.ctrlKey || e.metaKey) && (e.key === 'U' || e.key === 'u' || e.keyCode === 85)) {
      e.preventDefault();
      return false;
    }
    // Ctrl+S / Cmd+S (Guardar página)
    if ((e.ctrlKey || e.metaKey) && (e.key === 'S' || e.key === 's' || e.keyCode === 83)) {
      e.preventDefault();
      return false;
    }
  }, false);

  // Bucle trampa para pausar infinitamente DevTools si el cracker logra abrirlas
  // Se ejecuta de forma sutil para no afectar el rendimiento general
  setInterval(function () {
    const start = new Date();
    // La sentencia debugger detiene la ejecución SOLO si DevTools está abierto
    // Congelando la interfaz del atacante de forma cíclica
    (function () {}.constructor("debugger")());
    if (new Date() - start > 100) {
      // Intrusión detectada por retardo de renderizado en Debugger
      document.body.style.display = 'none'; // Ocultar DOM sensible visualmente
      setTimeout(() => { document.body.style.display = ''; }, 500);
    }
  }, 3000);


  // ============================================================================
  // 2. ENCRIPTACIÓN CLIENTE CONFIDENCIAL (SECURE VAULT)
  // ============================================================================
  // Permite cifrar en base a un algoritmo XOR rotativo y codificación Base64
  // para ocultar datos confidenciales en Storage.

  const SHIELD_KEY = "Ar3v4loS3cur1tyK3y_2026_xOr";

  window.SecureVault = {
    encriptar: function (texto) {
      if (!texto) return "";
      try {
        const str = typeof texto === 'object' ? JSON.stringify(texto) : String(texto);
        let cifrado = "";
        for (let i = 0; i < str.length; i++) {
          const charCode = str.charCodeAt(i) ^ SHIELD_KEY.charCodeAt(i % SHIELD_KEY.length);
          cifrado += String.fromCharCode(charCode);
        }
        // Retornar en Base64 para máxima ofuscación y compatibilidad de caracteres
        return btoa(unescape(encodeURIComponent(cifrado)));
      } catch(e) {
        return btoa(String(texto));
      }
    },

    desencriptar: function (hashBase64) {
      if (!hashBase64) return null;
      try {
        const descodificado = decodeURIComponent(escape(atob(hashBase64)));
        let descifrado = "";
        for (let i = 0; i < descodificado.length; i++) {
          const charCode = descodificado.charCodeAt(i) ^ SHIELD_KEY.charCodeAt(i % SHIELD_KEY.length);
          descifrado += String.fromCharCode(charCode);
        }
        try {
          return JSON.parse(descifrado);
        } catch(err) {
          return descifrado;
        }
      } catch (e) {
        try {
          return atob(hashBase64);
        } catch(err2) {
          return null;
        }
      }
    }
  };


  // ============================================================================
  // 3. PROTECCIÓN Y ENCRIPTACIÓN VISUAL DE FOTOGRAFÍAS E IMÁGENES
  // ============================================================================
  // Evita el robo de fotos bloqueando el arrastre, menús contextuales y toques largos.

  function blindarImagenes(contexto) {
    const imagenes = (contexto || document).querySelectorAll('img');
    imagenes.forEach(img => {
      if (img.dataset.blindado) return;
      
      // Bloquear arrastre nativo de archivo
      img.ondragstart = function () { return false; };
      img.addEventListener('dragstart', e => e.preventDefault());

      // Deshabilitar menús en móviles (toque largo en iOS/Android)
      img.style.webkitTouchCallout = "none";
      img.style.userSelect = "none";
      img.style.webkitUserSelect = "none";
      
      // Marcar como protegida
      img.dataset.blindado = "true";
    });
  }

  // Ejecutar blindaje al iniciar
  document.addEventListener('DOMContentLoaded', () => {
    blindarImagenes();
    
    // Proteger imágenes dinámicas inyectadas posteriormente (ej. en catálogos)
    const observer = new MutationObserver(mutations => {
      mutations.forEach(m => {
        if (m.addedNodes && m.addedNodes.length > 0) {
          m.addedNodes.forEach(nodo => {
            if (nodo.nodeName === 'IMG') blindarImagenes(document);
            else if (nodo.querySelectorAll) blindarImagenes(nodo);
          });
        }
      });
    });

    observer.observe(document.body, { childList: true, subtree: true });
  });

  // ============================================================================
  // 4. MONITOR DE INACTIVIDAD GLOBAL (AUTO-LOGOUT)
  // ============================================================================
  // Cierra sesiones abandonadas después de 5 minutos de inactividad + 1 minuto de gracia.

  let idleTimeoutWarning;
  let idleTimeoutLogout;
  const TIME_WARNING = 5 * 60 * 1000; // 5 minutos
  const TIME_GRACE = 1 * 60 * 1000;   // 1 minuto extra

  function cargarSweetAlertSiFalta(callback) {
    if (window.Swal) {
      callback();
    } else {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/sweetalert2@11';
      script.onload = callback;
      document.head.appendChild(script);
    }
  }

  async function ejecutarLogoutCerrado() {
    const isCRM = localStorage.getItem('arevalo_user');
    const isPortal = localStorage.getItem('secure_portal_token') || localStorage.getItem('portal_cliente');

    if (isCRM) {
      try {
        const u = JSON.parse(isCRM);
        if (u.id_usuario) {
          await fetch('/api/usuarios/logout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id_usuario: u.id_usuario })
          });
        }
      } catch(e) {}
      localStorage.removeItem('arevalo_user');
      window.location.replace('/login.html');
    } else if (isPortal) {
      localStorage.removeItem('secure_portal_token');
      localStorage.removeItem('portal_cliente');
      window.location.replace('/login-cliente.html');
    }
  }

  function mostrarAdvertenciaInactividad() {
    cargarSweetAlertSiFalta(() => {
      // Configurar el logout incondicional si no hay respuesta
      idleTimeoutLogout = setTimeout(() => {
        if(window.Swal) Swal.close();
        ejecutarLogoutCerrado();
      }, TIME_GRACE);

      Swal.fire({
        title: 'Sesión Inactiva',
        html: '<div style="font-size:14px; color:#475569;">Por tu seguridad, tu sesión se cerrará automáticamente en <b>1 minuto</b> por falta de actividad.</div>',
        icon: 'warning',
        showCancelButton: false,
        confirmButtonText: 'Sigo aquí',
        confirmButtonColor: '#2563eb',
        allowOutsideClick: false,
        allowEscapeKey: false
      }).then((result) => {
        if (result.isConfirmed) {
          clearTimeout(idleTimeoutLogout);
          resetearTemporizadorInactividad();
        }
      });
    });
  }

  function resetearTemporizadorInactividad() {
    // Solo activar si el usuario está realmente logueado en algún lado
    if (!localStorage.getItem('arevalo_user') && !localStorage.getItem('secure_portal_token') && !localStorage.getItem('portal_cliente')) {
      return;
    }
    clearTimeout(idleTimeoutWarning);
    clearTimeout(idleTimeoutLogout);
    idleTimeoutWarning = setTimeout(mostrarAdvertenciaInactividad, TIME_WARNING);
  }

  // Escuchar eventos de actividad del usuario
  document.addEventListener('DOMContentLoaded', () => {
    resetearTemporizadorInactividad();

    const eventos = ['mousemove', 'keydown', 'mousedown', 'touchstart', 'scroll'];
    eventos.forEach(evt => {
      document.addEventListener(evt, () => {
        // Solo resetear si no se está mostrando la alerta
        if (window.Swal && Swal.isVisible && Swal.isVisible()) return;
        resetearTemporizadorInactividad();
      }, { passive: true });
    });
  });

})();
