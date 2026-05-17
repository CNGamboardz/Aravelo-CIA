const fs = require('fs');
const path = require('path');

const viewDir = path.join(__dirname, '..', 'View');

const scriptPortalCliente = `  <script>
    // Escudo Anti-Intrusión: Verificación de Sesión Cliente
    (function(){
      const token = localStorage.getItem('secure_portal_token');
      const ses = localStorage.getItem('portal_cliente');
      if (!token && !ses) {
        document.documentElement.innerHTML = '';
        window.location.replace('/login-cliente.html');
      }
    })();
  </script>\n`;

const scriptLogin = `  <script>
    // Redirección automática si ya hay sesión activa
    (function(){
      const u = localStorage.getItem('arevalo_user');
      if (u) {
        document.documentElement.innerHTML = '';
        window.location.replace('/dashboard.html');
      }
    })();
  </script>\n`;

const scriptLoginCliente = `  <script>
    // Redirección automática si ya hay sesión activa
    (function(){
      const token = localStorage.getItem('secure_portal_token');
      const ses = localStorage.getItem('portal_cliente');
      if (token || ses) {
        document.documentElement.innerHTML = '';
        window.location.replace('/portal-cliente.html');
      }
    })();
  </script>\n`;

function injectScript(file, scriptContent) {
  const filePath = path.join(viewDir, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    if (!content.includes('<script>\\n    // Escudo') && !content.includes('<script>\\n    // Redirección')) {
      content = content.replace('<head>', '<head>\n' + scriptContent);
      fs.writeFileSync(filePath, content);
      console.log('Injected ' + file);
    } else {
      console.log('Already injected ' + file);
    }
  } else {
    console.log('Not found ' + file);
  }
}

injectScript('portal-cliente.html', scriptPortalCliente);
injectScript('login.html', scriptLogin);
injectScript('login-cliente.html', scriptLoginCliente);
