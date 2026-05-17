const fs = require('fs');
const path = require('path');

const viewDir = path.join(__dirname, '..', 'View');

const scriptTag = `<script src="/public/security-bundle.js"></script>`;

const filesToInject = [
  'clientes.html', 'configuracion.html', 'miperfil.html', 
  'modificarlote.html', 'modificarvendedores.html', 'pagos.html', 
  'registrar.html', 'registrarlote.html', 'registrar_cliente.html', 
  'terrenos.html', 'vendedores.html'
];

function injectSecurityBundle(file) {
  const filePath = path.join(viewDir, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    if (!content.includes('security-bundle.js')) {
      // Find the end of the head or the beginning of the body to inject the script
      if (content.includes('</head>')) {
        content = content.replace('</head>', `  ${scriptTag}\n</head>`);
      } else {
         // Fallback if no head tag exists
         content = content + `\n${scriptTag}`;
      }
      fs.writeFileSync(filePath, content);
      console.log('Injected security-bundle.js into ' + file);
    } else {
      console.log('Already has security-bundle.js ' + file);
    }
  } else {
    console.log('Not found ' + file);
  }
}

filesToInject.forEach(file => injectSecurityBundle(file));
