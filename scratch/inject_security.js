const fs = require('fs');
const path = require('path');

const viewDir = path.join(__dirname, '..', 'View');

const scriptGeneral = `  <script>
    // Escudo Anti-Intrusión: Verificación de Sesión Corporativa
    (function(){
      const u = localStorage.getItem('arevalo_user');
      if (!u) {
        document.documentElement.innerHTML = '';
        window.location.replace('/login.html');
      }
    })();
  </script>\n`;

const scriptDireccion = `  <script>
    // Escudo Anti-Intrusión: Verificación de Rol Directivo
    (function(){
      const u = localStorage.getItem('arevalo_user');
      if (!u) {
        document.documentElement.innerHTML = '';
        window.location.replace('/login.html');
        return;
      }
      try {
        const user = JSON.parse(u);
        if (!user.rol || user.rol.toLowerCase() !== 'direccion') {
          document.documentElement.innerHTML = '';
          window.location.replace('/dashboard.html');
        }
      } catch(e) {
        document.documentElement.innerHTML = '';
        window.location.replace('/login.html');
      }
    })();
  </script>\n`;

const filesGeneral = [
  'clientes.html', 'contratos.html', 'dashboard.html', 'detalle-lote.html',
  'miperfil.html', 'modificarlote.html', 'pagos.html', 'registrar_cliente.html',
  'registrarlote.html', 'terrenos.html'
];

const filesDireccion = [
  'configuracion.html', 'modificarvendedores.html', 'registrar.html', 'vendedores.html'
];

function injectScript(file, scriptContent) {
  const filePath = path.join(viewDir, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    if (!content.includes('Escudo Anti-Intrusión')) {
      content = content.replace('<head>', '<head>\\n' + scriptContent);
      fs.writeFileSync(filePath, content);
      console.log('Injected ' + file);
    } else {
      console.log('Already injected ' + file);
    }
  } else {
    console.log('Not found ' + file);
  }
}

filesGeneral.forEach(file => injectScript(file, scriptGeneral));
filesDireccion.forEach(file => injectScript(file, scriptDireccion));
