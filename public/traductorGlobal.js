// ============================================================================
// MICRO-CONTROLADOR GLOBAL DE TRADUCCIÓN NEURONAL (CUSTOM UI)
// ============================================================================

(function() {
  // 1. INYECCIÓN DE ESTILOS PRÉMIUM (SOPORTE MODO OSCURO Y GLASSMORPHISM)
  const estilo = document.createElement('style');
  estilo.innerHTML = `
    /* Ocultar elementos nativos de Google Translate */
    .skiptranslate iframe { display: none !important; }
    body { top: 0 !important; }
    #google_translate_element { display: none !important; }
    
    /* Botón disparador en el Sidebar */
    .btn-custom-lang {
      width: 100%;
      background: #ffffff;
      color: #0f172a;
      border: 1px solid #cbd5e1;
      border-radius: 12px;
      padding: 8px 12px;
      font-size: 12px;
      font-weight: 800;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 2px 8px rgba(0,0,0,0.04);
      transition: 0.2s;
      margin-bottom: 8px;
    }
    .btn-custom-lang:hover {
      border-color: #570fff;
      background: #f8fafc;
      transform: translateY(-1px);
    }
    body.dark-mode .btn-custom-lang {
      background: #1e293b;
      color: #f8fafc;
      border-color: #475569;
    }
    body.dark-mode .btn-custom-lang:hover {
      border-color: #c4b5fd;
      background: #0f172a;
    }

    /* Modal Glassmorphism de Selección de Idioma */
    .modal-lang-overlay {
      position: fixed;
      top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(15, 23, 42, 0.75);
      backdrop-filter: blur(12px);
      z-index: 999999;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.3s ease;
    }
    .modal-lang-overlay.active {
      opacity: 1;
      pointer-events: auto;
    }
    .modal-lang-card {
      background: #ffffff;
      width: 90%;
      max-width: 500px;
      border-radius: 24px;
      padding: 24px;
      box-shadow: 0 25px 50px rgba(0,0,0,0.25);
      transform: scale(0.95);
      transition: transform 0.3s ease;
      border: 1px solid #e2e8f0;
      max-height: 85vh;
      overflow-y: auto;
    }
    .modal-lang-overlay.active .modal-lang-card {
      transform: scale(1);
    }
    body.dark-mode .modal-lang-card {
      background: #0f172a;
      border-color: #334155;
      box-shadow: 0 25px 50px rgba(0,0,0,0.5);
    }

    /* Cabecera del modal */
    .modal-lang-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      border-bottom: 2px solid #f1f5f9;
      padding-bottom: 12px;
    }
    body.dark-mode .modal-lang-header {
      border-color: #1e293b;
    }
    .modal-lang-title {
      font-size: 16px;
      font-weight: 800;
      color: #0f172a;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    body.dark-mode .modal-lang-title { color: #ffffff; }
    .btn-lang-close {
      background: #f1f5f9;
      border: none;
      width: 32px; height: 32px;
      border-radius: 50%;
      font-size: 14px;
      font-weight: bold;
      color: #64748b;
      cursor: pointer;
      transition: 0.2s;
    }
    .btn-lang-close:hover { background: #e2e8f0; color: #0f172a; }
    body.dark-mode .btn-lang-close { background: #1e293b; color: #94a3b8; }
    body.dark-mode .btn-lang-close:hover { background: #334155; color: #ffffff; }

    /* Cuadrícula de Idiomas */
    .lang-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
    }
    .lang-option {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      border-radius: 16px;
      border: 2px solid #f1f5f9;
      background: #ffffff;
      cursor: pointer;
      transition: all 0.2s;
      text-align: left;
    }
    .lang-option:hover {
      border-color: #570fff;
      background: #ede9fe;
      transform: translateY(-2px);
    }
    body.dark-mode .lang-option {
      background: #1e293b;
      border-color: #334155;
    }
    body.dark-mode .lang-option:hover {
      border-color: #c4b5fd;
      background: #0f172a;
    }
    .lang-option.active {
      border-color: #10b981;
      background: #dcfce7;
    }
    body.dark-mode .lang-option.active {
      border-color: #059669;
      background: #064e3b;
    }
    .lang-flag { font-size: 20px; }
    .lang-name { font-weight: 700; font-size: 13px; color: #1e293b; }
    .lang-native { font-size: 11px; color: #64748b; font-weight: 600; }
    body.dark-mode .lang-name { color: #f8fafc; }
    body.dark-mode .lang-native { color: #94a3b8; }
  `;
  document.head.appendChild(estilo);

  // Catálogo de Idiomas Principales
  const IDIOMAS = [
    { code: 'es', flag: '🇪🇸', name: 'Español', native: 'Original' },
    { code: 'en', flag: '🇺🇸', name: 'English', native: 'Inglés' },
    { code: 'zh-CN', flag: '🇨🇳', name: '中文', native: 'Chino Mandarín' },
    { code: 'ru', flag: '🇷🇺', name: 'Русский', native: 'Ruso' },
    { code: 'ja', flag: '🇯🇵', name: '日本語', native: 'Japonés' },
    { code: 'de', flag: '🇩🇪', name: 'Deutsch', native: 'Alemán' },
    { code: 'fr', flag: '🇫🇷', name: 'Français', native: 'Francés' },
    { code: 'it', flag: '🇮🇹', name: 'Italiano', native: 'Italiano' },
    { code: 'pt', flag: '🇵🇹', name: 'Português', native: 'Portugués' },
    { code: 'ar', flag: '🇸🇦', name: 'العربية', native: 'Árabe' }
  ];

  // Extraer idioma activo de la cookie googtrans
  function getIdiomaActivo() {
    const match = document.cookie.match(/(?:^|;)\s*googtrans=([^;]*)/);
    if (!match) return 'es';
    const partes = decodeURIComponent(match[1]).split('/');
    return partes[2] || 'es';
  }

  // Conmutador Neuronal Infallible
  function aplicarTraduccion(langCode) {
    const host = location.hostname;
    if (langCode === 'es') {
      // Borrar cookies para volver al idioma base
      document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; domain=.${host}; path=/;`;
    } else {
      // Establecer cookie neuronal
      document.cookie = `googtrans=/es/${langCode}; path=/`;
      document.cookie = `googtrans=/es/${langCode}; domain=.${host}; path=/`;
    }
    location.reload();
  }

  // 2. CONSTRUCCIÓN DE LA INTERFAZ DOM
  window.addEventListener('DOMContentLoaded', () => {
    // Inyectar contenedor base nativo oculto
    const divGoogle = document.createElement('div');
    divGoogle.id = 'google_translate_element';
    document.body.appendChild(divGoogle);

    // Cargar script nativo de Google Translate de fondo
    const scriptGoogle = document.createElement('script');
    scriptGoogle.type = 'text/javascript';
    scriptGoogle.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    document.body.appendChild(scriptGoogle);

    window.googleTranslateElementInit = function() {
      new google.translate.TranslateElement({
        pageLanguage: 'es',
        layout: google.translate.TranslateElement.InlineLayout.SIMPLE,
        autoDisplay: false
      }, 'google_translate_element');
    };

    // Crear Modal Flotante Prémium
    const langActivo = getIdiomaActivo();
    const objActivo = IDIOMAS.find(i => i.code === langActivo) || IDIOMAS[0];

    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'modal-lang-overlay';
    modalOverlay.innerHTML = `
      <div class="modal-lang-card">
        <div class="modal-lang-header">
          <div class="modal-lang-title">🌐 Seleccionar Idioma de Interfaz</div>
          <button class="btn-lang-close" onclick="this.closest('.modal-lang-overlay').classList.remove('active')">✕</button>
        </div>
        <div class="lang-grid">
          ${IDIOMAS.map(i => `
            <div class="lang-option ${i.code === langActivo ? 'active' : ''}" data-lang="${i.code}">
              <span class="lang-flag">${i.flag}</span>
              <div>
                <div class="lang-name">${i.name}</div>
                <div class="lang-native">${i.native}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
    document.body.appendChild(modalOverlay);

    // Eventos de selección en el modal
    modalOverlay.querySelectorAll('.lang-option').forEach(op => {
      op.addEventListener('click', () => {
        const targetLang = op.getAttribute('data-lang');
        aplicarTraduccion(targetLang);
      });
    });

    // Cerrar modal al hacer clic afuera
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) modalOverlay.classList.remove('active');
    });

    // Crear Botón Disparador en la interfaz del usuario
    const btnDisparador = document.createElement('button');
    btnDisparador.className = 'btn-custom-lang';
    btnDisparador.innerHTML = `
      <span style="display:flex; align-items:center; gap:6px;">
        <span style="font-size:14px;">${objActivo.flag}</span>
        <span>${objActivo.name}</span>
      </span>
      <span style="font-size:10px; color:#64748b;">▼</span>
    `;
    btnDisparador.addEventListener('click', () => {
      modalOverlay.classList.add('active');
    });

    // Inyectar de forma inteligente en el Sidebar o como botón flotante
    const sidebarFooter = document.querySelector('.sidebar-footer');
    if (sidebarFooter) {
      // Colocar como primer elemento del footer lateral
      sidebarFooter.insertBefore(btnDisparador, sidebarFooter.firstChild);
    } else {
      // Si la página no tiene sidebar, colocar flotando en la esquina inferior izquierda
      btnDisparador.style.position = 'fixed';
      btnDisparador.style.bottom = '20px';
      btnDisparador.style.left = '20px';
      btnDisparador.style.width = 'auto';
      btnDisparador.style.padding = '10px 16px';
      btnDisparador.style.borderRadius = '50px';
      btnDisparador.style.boxShadow = '0 10px 25px rgba(0,0,0,0.2)';
      btnDisparador.style.zIndex = '99999';
      document.body.appendChild(btnDisparador);
    }
  });
})();
