/**
 * KOMMO Asistente Virtual conversacional
 * Widget flotante estilo Messenger inyectable de forma autónoma.
 */

(function() {
  // Evitar inyección duplicada
  if (document.getElementById('kommo-widget-root')) return;

  // 1. INYECCIÓN DE HOJA DE ESTILOS CSS PREMIÚM
  const style = document.createElement('style');
  style.innerHTML = `
    /* DISPARADOR FLOTANTE (TRIGGER) - FONDO BLANCO PARA RESALTAR EL LOGO */
    .kommo-trigger {
      position: fixed;
      bottom: 24px;
      right: 24px;
      width: 68px;
      height: 68px;
      border-radius: 50%;
      background: #ffffff;
      box-shadow: 0 10px 35px rgba(0, 0, 0, 0.15);
      cursor: pointer;
      z-index: 999999;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease, border-color 0.3s ease;
      border: 3px solid #2563eb; /* Anillo azul corporativo */
      box-sizing: border-box;
    }
    .kommo-trigger:hover {
      transform: scale(1.08) rotate(5deg);
      box-shadow: 0 15px 40px rgba(37, 99, 235, 0.35);
      border-color: #3b07ff;
    }
    .kommo-trigger img {
      width: 48px;
      height: 48px;
      object-fit: contain;
      transition: transform 0.2s ease;
    }
    .kommo-trigger:hover img {
      transform: scale(1.05);
    }
    
    /* BURBUJA DE NOTIFICACIÓN DE MENSAJE NUEVO */
    .kommo-badge {
      position: absolute;
      top: -4px;
      right: -4px;
      background: #ef4444;
      color: #ffffff;
      font-size: 12px;
      font-weight: 800;
      font-family: 'Inter', sans-serif;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px solid #ffffff;
      box-shadow: 0 3px 8px rgba(239, 68, 68, 0.4);
      animation: kommoPulse 2s infinite;
    }

    @keyframes kommoPulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.15); }
      100% { transform: scale(1); }
    }

    /* VENTANA DE CHAT COMPLETA */
    .kommo-panel {
      position: fixed;
      bottom: 105px;
      right: 24px;
      width: 360px;
      height: 540px;
      background: #ffffff;
      border-radius: 28px;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.15);
      border: 1px solid #cbd5e1;
      z-index: 999999;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      font-family: 'Inter', sans-serif;
      opacity: 0;
      pointer-events: none;
      transform: translateY(20px) scale(0.95);
      transform-origin: bottom right;
      transition: opacity 0.3s ease, transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
      box-sizing: border-box;
    }
    .kommo-panel.active {
      opacity: 1;
      pointer-events: auto;
      transform: translateY(0) scale(1);
    }

    /* ADAPTACIÓN AL MODO OSCURO GLOBAL */
    body.dark-mode .kommo-panel {
      background: #0f172a;
      border-color: #334155;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6);
    }
    body.dark-mode .kommo-trigger {
      background: #1e293b;
      border-color: #3b82f6;
      box-shadow: 0 10px 35px rgba(0, 0, 0, 0.5);
    }
    body.dark-mode .kommo-badge {
      border-color: #1e293b;
    }

    /* CABECERA DE CHAT */
    .kommo-header {
      background: linear-gradient(135deg, #2563eb 0%, #3b07ff 100%);
      padding: 16px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      color: #ffffff;
      flex-shrink: 0;
    }
    .kommo-header-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .kommo-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 19px;
      font-weight: 800;
      color: #3b07ff;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      border: 2px solid rgba(255,255,255,0.9);
    }
    .kommo-title-box {
      display: flex;
      flex-direction: column;
    }
    .kommo-title {
      font-size: 16px;
      font-weight: 800;
      line-height: 1.1;
      letter-spacing: 0.02em;
    }
    .kommo-status {
      font-size: 11px;
      color: #d1fae5;
      display: flex;
      align-items: center;
      gap: 5px;
      margin-top: 3px;
      font-weight: 600;
    }
    .kommo-status-dot {
      width: 7px;
      height: 7px;
      background: #10b981;
      border-radius: 50%;
      display: inline-block;
      box-shadow: 0 0 6px #10b981;
    }
    .kommo-close {
      background: rgba(255,255,255,0.15);
      border: none;
      color: #ffffff;
      width: 30px;
      height: 30px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 13px;
      transition: 0.2s;
    }
    .kommo-close:hover {
      background: rgba(255,255,255,0.35);
      transform: scale(1.1);
    }

    /* ÁREA DE MENSAJES SCROLLABLE */
    .kommo-messages {
      flex: 1;
      padding: 16px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 12px;
      background: #f8fafc;
      box-sizing: border-box;
    }
    body.dark-mode .kommo-messages {
      background: #1e293b;
    }

    /* GLOBOS DE DIÁLOGO */
    .kommo-bubble {
      max-width: 85%;
      padding: 12px 16px;
      border-radius: 18px;
      font-size: 13px;
      line-height: 1.4;
      animation: kommoBubbleFade 0.25s ease;
      word-wrap: break-word;
    }

    @keyframes kommoBubbleFade {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .kommo-bubble.bot {
      background: #ffffff;
      color: #0f172a;
      align-self: flex-start;
      border-bottom-left-radius: 4px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.05);
      border: 1px solid #e2e8f0;
    }
    body.dark-mode .kommo-bubble.bot {
      background: #0f172a;
      color: #e2e8f0;
      border-color: #334155;
    }

    .kommo-bubble.user {
      background: linear-gradient(135deg, #2563eb 0%, #3b07ff 100%);
      color: #ffffff;
      align-self: flex-end;
      border-bottom-right-radius: 4px;
      box-shadow: 0 3px 10px rgba(37, 99, 235, 0.25);
    }

    /* MENÚ DE PÍLDORAS INTERACTIVAS - WRAPPABLE PARA VISIBILIDAD TOTAL */
    .kommo-options {
      padding: 12px 14px;
      background: #ffffff;
      border-top: 1px solid #f1f5f9;
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 8px;
      flex-shrink: 0;
      box-shadow: 0 -2px 10px rgba(0,0,0,0.02);
    }
    body.dark-mode .kommo-options {
      background: #0f172a;
      border-color: #334155;
      box-shadow: 0 -2px 10px rgba(0,0,0,0.2);
    }

    .kommo-pill {
      background: #f1f5f9;
      color: #334155;
      border: 1px solid #cbd5e1;
      padding: 7px 12px;
      border-radius: 18px;
      font-size: 11px;
      font-weight: 700;
      cursor: pointer;
      transition: 0.2s;
      display: inline-flex;
      align-items: center;
      gap: 5px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    }
    .kommo-pill:hover {
      background: #eff6ff;
      color: #2563eb;
      border-color: #93c5fd;
      transform: translateY(-2px);
      box-shadow: 0 3px 6px rgba(37,99,235,0.15);
    }
    body.dark-mode .kommo-pill {
      background: #1e293b;
      color: #e2e8f0;
      border-color: #475569;
    }
    body.dark-mode .kommo-pill:hover {
      background: #334155;
      color: #60a5fa;
      border-color: #3b82f6;
    }

    /* BARRA DE ENTRADA DE TEXTO (FOOTER) */
    .kommo-input-area {
      display: flex;
      align-items: center;
      padding: 12px 16px;
      background: #ffffff;
      border-top: 1px solid #e2e8f0;
      gap: 8px;
      flex-shrink: 0;
      box-sizing: border-box;
    }
    body.dark-mode .kommo-input-area {
      background: #0f172a;
      border-color: #334155;
    }

    .kommo-input {
      flex: 1;
      border: none;
      outline: none;
      font-size: 13px;
      color: #0f172a;
      background: transparent;
      font-family: inherit;
    }
    body.dark-mode .kommo-input {
      color: #f8fafc;
    }
    .kommo-input::placeholder {
      color: #94a3b8;
    }

    .kommo-send {
      background: #2563eb;
      color: white;
      border: none;
      width: 34px;
      height: 34px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: 0.2s;
      font-size: 14px;
    }
    .kommo-send:hover {
      background: #3b07ff;
      transform: scale(1.08);
    }

    /* ADAPTACIÓN MÓVIL */
    @media (max-width: 480px) {
      .kommo-panel {
        width: calc(100vw - 32px);
        right: 16px;
        bottom: 95px;
      }
      .kommo-trigger {
        right: 16px;
        bottom: 16px;
      }
    }
  `;
  document.head.appendChild(style);

  // 2. CONSTRUCCIÓN DEL ÁRBOL HTML DEL WIDGET
  const root = document.createElement('div');
  root.id = 'kommo-widget-root';
  root.innerHTML = `
    <!-- BOTÓN DE ACTIVACIÓN FLOTANTE -->
    <div class="kommo-trigger" id="kommoTrigger" title="Chatear con asistente de ayuda">
      <img src="/public/LogoApp.png" alt="Logo Arévalo" onerror="this.src='https://placehold.co/40/transparent/white?text=💬'">
      <div class="kommo-badge" id="kommoBadge">1</div>
    </div>

    <!-- PANEL DE CHAT -->
    <section class="kommo-panel" id="kommoPanel">
      
      <!-- CABECERA -->
      <header class="kommo-header">
        <div class="kommo-header-info">
          <div class="kommo-avatar">K</div>
          <div class="kommo-title-box">
            <span class="kommo-title">KOMMO Asistente</span>
            <span class="kommo-status"><span class="kommo-status-dot"></span> Ayuda Inmobiliaria</span>
          </div>
        </div>
        <button class="kommo-close" id="kommoClose" title="Minimizar">✖</button>
      </header>

      <!-- ÁREA DE SCROLL DE MENSAJES -->
      <div class="kommo-messages" id="kommoMsgArea">
        <div class="kommo-bubble bot">
          ¡Hola! 👋 Soy <b>KOMMO</b>, tu asistente virtual inteligente de <b>Arévalo & CIA</b>.<br><br>
          Puedo ayudarte a consultar disponibilidad de terrenos en tiempo real, cotizar precios o encontrar fraccionamientos cercanos. ¿Qué te gustaría consultar hoy?
        </div>
      </div>

      <!-- SUGERENCIAS RÁPIDAS CLICABLES (ENVOLVIBLES Y CENTRADAS) -->
      <div class="kommo-options">
        <button class="kommo-pill" data-ask="disponibles">🟢 Lotes Libres</button>
        <button class="kommo-pill" data-ask="precios">💰 Inversión y Valores</button>
        <button class="kommo-pill" data-ask="ubicaciones">📍 Zonas Cercanas</button>
        <button class="kommo-pill" data-ask="contacto">📞 Contáctanos</button>
      </div>

      <!-- FOOTER DE INPUT -->
      <form class="kommo-input-area" id="kommoForm">
        <input type="text" class="kommo-input" id="kommoInput" placeholder="Escribe tu consulta o elige arriba..." autocomplete="off">
        <button type="submit" class="kommo-send" title="Enviar mensaje">➤</button>
      </form>

    </section>
  `;
  document.body.appendChild(root);

  // 3. LÓGICA DE CONTROL E INTELIGENCIA DEL ASISTENTE
  const trigger = document.getElementById('kommoTrigger');
  const badge = document.getElementById('kommoBadge');
  const panel = document.getElementById('kommoPanel');
  const closeBtn = document.getElementById('kommoClose');
  const msgArea = document.getElementById('kommoMsgArea');
  const form = document.getElementById('kommoForm');
  const input = document.getElementById('kommoInput');

  let inventarioCache = [];
  let inventarioCargado = false;

  // Extraer información atómica del inventario de forma asíncrona
  async function cargarDatosAutonomos() {
    if (inventarioCargado) return;
    try {
      const res = await fetch('/terrenos');
      if (res.ok) {
        inventarioCache = await res.json();
        inventarioCargado = true;
      }
    } catch(e) {
      // Manejo silencioso
    }
  }

  // Desplegar un mensaje en la ventana de chat
  function agregarMensaje(texto, tipo = 'bot') {
    const bubble = document.createElement('div');
    bubble.className = `kommo-bubble ${tipo}`;
    bubble.innerHTML = texto;
    msgArea.appendChild(bubble);
    // Scroll suave al último mensaje
    setTimeout(() => {
      msgArea.scrollTo({ top: msgArea.scrollHeight, behavior: 'smooth' });
    }, 50);
  }

  // Analizar respuesta conversacional basada en intención
  function procesarRespuestaKommo(query) {
    const q = query.toLowerCase().trim();
    
    const totalLotes = inventarioCache.length || 0;
    const libres = inventarioCache.filter(t => (t.estado || '').toLowerCase().includes('disponible') || (t.estado || '').toLowerCase().includes('libre'));
    
    // INTENCIÓN 1: DISPONIBILIDAD
    if (q.includes('disponible') || q.includes('libre') || q.includes('lote') || q.includes('terreno')) {
      if (totalLotes === 0) {
        return "Actualmente estamos sincronizando el inventario maestro. Por favor, visita la sección de <b>Lotes Inmobiliarios</b> para ver la disponibilidad completa en el mapa.";
      }
      if (libres.length > 0) {
        const ej = libres[0];
        const pVenta = parseFloat(ej.precio_venta || ej.precio_lista || 0).toLocaleString('es-MX', {maximumFractionDigits:0});
        return `✅ Contamos con <b>${libres.length} predios disponibles</b> listos para escrituración.<br><br>Por ejemplo, en el desarrollo <b>${ej.fraccionamiento || 'Residencial Arévalo'}</b> tenemos lotes desde <b>$${pVenta} MXN</b>. <a href="/terrenos.html" style="color:#2563eb; font-weight:700;">Ver catálogo →</a>`;
      } else {
        return "⚠️ Por el momento todos los lotes registrados aparecen como Apartados o Vendidos. Te recomendamos contactar a un agente de Arévalo & CIA para abrir lista de espera.";
      }
    }

    // INTENCIÓN 2: PRECIOS Y VALORES
    if (q.includes('precio') || q.includes('costo') || q.includes('valor') || q.includes('inversion') || q.includes('cuesta') || q.includes('dinero')) {
      if (totalLotes === 0) {
        return "Nuestros desarrollos residenciales se adaptan a diferentes capacidades de inversión, manejando esquemas de contado y apartados. Visita el catálogo para cotizaciones puntuales.";
      }
      let min = Infinity;
      let max = -Infinity;
      inventarioCache.forEach(t => {
        const p = parseFloat(t.precio_venta || t.precio_lista || 0);
        if (p > 0 && p < min) min = p;
        if (p > max) max = p;
      });
      const txtMin = min !== Infinity ? `$${min.toLocaleString('es-MX', {maximumFractionDigits:0})}` : '$150,000';
      const txtMax = max !== -Infinity ? `$${max.toLocaleString('es-MX', {maximumFractionDigits:0})}` : '$1,200,000';
      
      return `💰 Los valores de nuestros predios varían según metraje y cercanía a amenidades.<br><br>Manejamos oportunidades de inversión desde <b>${txtMin} MXN</b> hasta lotes exclusivos de <b>${txtMax} MXN</b>. Admitimos esquemas con enganches flexibles.`;
    }

    // INTENCIÓN 3: UBICACIONES Y CERCANÍA
    if (q.includes('ubicacion') || q.includes('cerca') || q.includes('donde') || q.includes('direccion') || q.includes('zona') || q.includes('municipio') || q.includes('mapa')) {
      if (totalLotes === 0) {
        return "📍 Tenemos presencia en fraccionamientos estratégicos y zonas de alta plusvalía. ¿Buscas algún sector o municipio en particular?";
      }
      const desarrollos = [...new Set(inventarioCache.map(t => t.fraccionamiento).filter(Boolean))];
      const muns = [...new Set(inventarioCache.map(t => t.municipio).filter(Boolean))];
      
      let resTxt = "📍 Nuestros terrenos se encuentran en zonas de excelente conectividad y crecimiento urbano aproximado.<br><br>";
      if (desarrollos.length > 0) {
        resTxt += `🏡 <b>Desarrollos Activos:</b> ${desarrollos.join(', ')}.<br>`;
      }
      if (muns.length > 0) {
        resTxt += `🌆 <b>Sectores / Municipios:</b> ${muns.join(', ')}.<br>`;
      }
      resTxt += "<br>¿Qué zona te queda más cómoda para agendar un recorrido presencial?";
      return resTxt;
    }

    // INTENCIÓN 4: CONTACTO Y ATENCIÓN CLIENTE
    if (q.includes('contacto') || q.includes('contactanos') || q.includes('llamar') || q.includes('telefono') || q.includes('whatsapp') || q.includes('asesor') || q.includes('oficina')) {
      return "📞 <b>Atención Comercial Directa:</b><br><br>Puedes comunicarte con nuestros asesores patrimoniales llamando al <b>(961) 123-4567</b> o visitando nuestras oficinas centrales.<br><br>También puedes consultar el <a href='/vendedores.html' style='color:#2563eb; font-weight:700;'>Directorio de Vendedores</a> para atención personalizada.";
    }

    // INTENCIÓN SALUDO
    if (q.includes('hola') || q.includes('buenas') || q.includes('buenos') || q.includes('kommo') || q.includes('ayuda')) {
      return "¡Qué gusto saludarte! Estoy listo para asistirte. Puedes consultarme libremente sobre <b>precios de terrenos, fraccionamientos con lotes disponibles, zonas cercanas</b> o solicitar contacto directo con un agente.";
    }

    // POR DEFECTO
    return "Entiendo tu consulta. Para darte la mejor orientación inmobiliaria, te sugiero seleccionar una de las píldoras de ayuda inferior o escribirme palabras clave como <b>'disponibles'</b>, <b>'precios'</b>, <b>'ubicaciones'</b> o <b>'contacto'</b>.";
  }

  let notifsPintadas = false;
  function pintarNotificacionesGuardadas() {
    if (notifsPintadas) return;
    try {
      let asesorLogueado = null;
      try {
        const strCrm = localStorage.getItem('arevalo_user');
        if (strCrm) asesorLogueado = JSON.parse(strCrm);
      } catch(e) {}

      const guardadas = JSON.parse(localStorage.getItem('kommo_notifications') || '[]');
      
      // Aislamiento estricto: El asesor solo ve las alertas dirigidas explícitamente a su ID
      const isVistaCliente = window.location.pathname.includes('portal-cliente') || window.location.pathname.includes('login-cliente');
      
      const notifsFiltradas = guardadas.filter(n => {
        if (isVistaCliente) return true;
        if (asesorLogueado && asesorLogueado.id_usuario) {
          // El agente ve las dirigidas a él, o si es administrativo/dirección ve las alertas generales para no perder el seguimiento
          const esSuya = n.id_asesor == asesorLogueado.id_usuario;
          const rLimpio = (asesorLogueado.rol || '').toLowerCase();
          const esAdmin = rLimpio.includes('administrativo') || rLimpio.includes('direcci') || rLimpio.includes('admin');
          return esSuya || esAdmin || !n.id_asesor;
        }
        return true;
      });

      notifsFiltradas.forEach(n => {
        const bubble = document.createElement('div');
        bubble.className = 'kommo-bubble bot';
        bubble.style.background = '#ecfdf5';
        bubble.style.borderLeft = '4px solid #10b981';
        bubble.style.marginTop = '8px';
        bubble.innerHTML = `<div style="font-size:10px; color:#10b981; text-align:right; margin-bottom:4px;">${n.fecha || ''}</div>${n.texto}`;
        msgArea.appendChild(bubble);
      });
      if (notifsFiltradas.length > 0) {
        setTimeout(() => { msgArea.scrollTo({ top: msgArea.scrollHeight, behavior: 'smooth' }); }, 100);
      }
      notifsPintadas = true;
    } catch(e) {}
  }

  // EVENTOS DEL INTERFAZ
  trigger.addEventListener('click', () => {
    const isActive = panel.classList.toggle('active');
    if (isActive) {
      badge.style.display = 'none';
      cargarDatosAutonomos();
      pintarNotificacionesGuardadas();
      input.focus();
    }
  });

  closeBtn.addEventListener('click', () => {
    panel.classList.remove('active');
  });

  // Opciones de Píldoras Rápidas
  document.querySelectorAll('.kommo-options .kommo-pill').forEach(pill => {
    pill.addEventListener('click', async () => {
      await cargarDatosAutonomos();
      const askType = pill.getAttribute('data-ask');
      const label = pill.innerText.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '').trim();
      
      agregarMensaje(label, 'user');
      
      setTimeout(() => {
        let resp = "";
        if (askType === 'disponibles') resp = procesarRespuestaKommo("disponible");
        else if (askType === 'precios') resp = procesarRespuestaKommo("precio");
        else if (askType === 'ubicaciones') resp = procesarRespuestaKommo("ubicacion");
        else resp = procesarRespuestaKommo("contacto");
        
        agregarMensaje(resp, 'bot');
      }, 400);
    });
  });

  // Envío de Formulario Libre
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const txt = input.value.trim();
    if (!txt) return;

    agregarMensaje(txt, 'user');
    input.value = '';
    await cargarDatosAutonomos();

    setTimeout(() => {
      const respuesta = procesarRespuestaKommo(txt);
      agregarMensaje(respuesta, 'bot');
    }, 450);
  });

  // ESCUCHADORES DE ACTUALIZACIONES EN TIEMPO REAL (REACCIÓN EN VIVO)
  function verificarNuevasNotificaciones() {
    try {
      let asesorLogueado = null;
      try {
        const strCrm = localStorage.getItem('arevalo_user');
        if (strCrm) asesorLogueado = JSON.parse(strCrm);
      } catch(e) {}

      const guardadas = JSON.parse(localStorage.getItem('kommo_notifications') || '[]');
      if (guardadas.length === 0) return;

      const n = guardadas[guardadas.length - 1]; // La última alerta ingresada
      
      const isVistaCliente = window.location.pathname.includes('portal-cliente') || window.location.pathname.includes('login-cliente');
      
      let debeMostrar = false;
      if (isVistaCliente) debeMostrar = true;
      else if (asesorLogueado && asesorLogueado.id_usuario) {
        const esSuya = n.id_asesor == asesorLogueado.id_usuario;
        const rLimpio = (asesorLogueado.rol || '').toLowerCase();
        const esAdmin = rLimpio.includes('administrativo') || rLimpio.includes('direcci') || rLimpio.includes('admin');
        if (esSuya || esAdmin || !n.id_asesor) debeMostrar = true;
      }

      if (debeMostrar) {
        // Verificar si ya está pintada para no duplicarla
        const existentes = msgArea.innerHTML;
        // Comparamos un fragmento limpio
        const txtLimpio = n.texto.substring(0, 40);
        if (!existentes.includes(txtLimpio)) {
          const bubble = document.createElement('div');
          bubble.className = 'kommo-bubble bot';
          bubble.style.background = '#ecfdf5';
          bubble.style.borderLeft = '4px solid #10b981';
          bubble.style.marginTop = '8px';
          bubble.innerHTML = `<div style="font-size:10px; color:#10b981; text-align:right; margin-bottom:4px;">${n.fecha || ''}</div>${n.texto}`;
          msgArea.appendChild(bubble);
          setTimeout(() => { msgArea.scrollTo({ top: msgArea.scrollHeight, behavior: 'smooth' }); }, 100);
          
          if (!panel.classList.contains('active')) {
            badge.style.display = 'flex';
          }
        }
      }
    } catch(e) {}
  }

  window.addEventListener('storage', (e) => {
    if (e.key === 'kommo_notifications') {
      verificarNuevasNotificaciones();
    }
  });
  window.addEventListener('kommo_update', () => {
    verificarNuevasNotificaciones();
  });

})();
