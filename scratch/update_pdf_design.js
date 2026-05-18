const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'View', 'dashboard.html');
let content = fs.readFileSync(filePath, 'utf8');

// We will target the entire `else if (formato === 'pdf') { ... }` block
const targetStart = "else if (formato === 'pdf') {";
const targetEnd = "printWindow.document.close();\r\n        }";
const targetEndLF = "printWindow.document.close();\n        }";

// Let's replace from `else if (formato === 'pdf') {` to `printWindow.document.close();\r\n        }`
const newPdfCode = `else if (formato === 'pdf') {
          const printWindow = window.open('', '_blank');
          const totalVendido = data.contratos.reduce((sum, c) => sum + parseFloat(c.precio_total || 0), 0);
          const totalRecaudado = data.pagos.reduce((sum, p) => sum + parseFloat(p.monto || 0), 0);
          const logoUrl = window.location.origin + '/public/img/LogoApp.png';
          
          printWindow.document.write(\`
            <html>
              <head>
                <title>Auditoría Financiera - Arévalo & CIA</title>
                <link rel="preconnect" href="https://fonts.googleapis.com">
                <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
                <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700;800&display=swap" rel="stylesheet">
                <style>
                  @page {
                    size: letter portrait;
                    margin: 15mm;
                  }
                  body {
                    font-family: 'Outfit', 'Segoe UI', Roboto, sans-serif;
                    color: #1e293b;
                    background: #ffffff;
                    padding: 0;
                    margin: 0;
                    line-height: 1.5;
                    font-size: 13px;
                  }
                  .container {
                    padding: 10px;
                  }
                  /* Encabezado Corporativo Premium */
                  .header-container {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-bottom: 3px solid #1e1b4b;
                    padding-bottom: 20px;
                    margin-bottom: 25px;
                  }
                  .header-logo-section {
                    display: flex;
                    align-items: center;
                    gap: 18px;
                  }
                  .logo-img {
                    height: 65px;
                    width: auto;
                    object-fit: contain;
                    filter: drop-shadow(0px 3px 5px rgba(30, 27, 75, 0.15));
                  }
                  .header-title-box {
                    display: flex;
                    flex-direction: column;
                  }
                  .title {
                    font-size: 28px;
                    font-weight: 800;
                    color: #1e1b4b;
                    margin: 0;
                    letter-spacing: -0.5px;
                    text-transform: uppercase;
                  }
                  .subtitle {
                    font-size: 12px;
                    font-weight: 600;
                    color: #b45309;
                    margin: 2px 0 0 0;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                  }
                  .header-meta {
                    text-align: right;
                  }
                  .meta-date-label {
                    font-size: 10px;
                    font-weight: 700;
                    color: #64748b;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                  }
                  .meta-date-value {
                    font-size: 13px;
                    font-weight: 700;
                    color: #1e1b4b;
                    margin-top: 3px;
                  }
                  /* Caja de Indicadores Premium (KPIs) */
                  .meta-box {
                    background: #f8fafc;
                    border: 1px solid #e2e8f0;
                    border-top: 4px solid #b45309;
                    border-radius: 12px;
                    padding: 18px;
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 15px;
                    margin-bottom: 30px;
                    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
                    page-break-inside: avoid;
                  }
                  .meta-item {
                    text-align: center;
                    border-right: 1px solid #e2e8f0;
                    padding: 5px 10px;
                  }
                  .meta-item:last-child {
                    border-right: none;
                  }
                  .meta-label {
                    font-size: 10px;
                    font-weight: 700;
                    color: #64748b;
                    text-transform: uppercase;
                    letter-spacing: 0.8px;
                    margin-bottom: 6px;
                  }
                  .meta-value {
                    font-size: 20px;
                    font-weight: 800;
                    color: #1e1b4b;
                  }
                  .meta-value.green {
                    color: #047857;
                  }
                  /* Secciones y Tablas */
                  h2 {
                    font-size: 15px;
                    font-weight: 700;
                    color: #1e1b4b;
                    margin-top: 30px;
                    margin-bottom: 12px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                  }
                  h2::before {
                    content: '';
                    display: inline-block;
                    width: 4px;
                    height: 16px;
                    background: #b45309;
                    border-radius: 2px;
                  }
                  table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 25px;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.02);
                  }
                  tr {
                    page-break-inside: avoid;
                  }
                  th {
                    background: #1e1b4b;
                    color: #ffffff;
                    font-weight: 700;
                    font-size: 11px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    padding: 10px 12px;
                    text-align: left;
                    border-bottom: 2px solid #b45309;
                  }
                  td {
                    padding: 10px 12px;
                    border-bottom: 1px solid #e2e8f0;
                    color: #334155;
                    font-size: 12px;
                  }
                  tr:nth-child(even) td {
                    background: #f8fafc;
                  }
                  /* Badges de Estado */
                  .badge {
                    display: inline-block;
                    padding: 3px 8px;
                    border-radius: 12px;
                    font-size: 9px;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    text-align: center;
                  }
                  .badge-contado {
                    background: #d1fae5;
                    color: #065f46;
                    border: 1px solid #a7f3d0;
                  }
                  .badge-fin {
                    background: #dbeafe;
                    color: #1e40af;
                    border: 1px solid #bfdbfe;
                  }
                  .badge-status {
                    background: #f1f5f9;
                    color: #475569;
                    border: 1px solid #e2e8f0;
                  }
                  .badge-status-activo {
                    background: #e0f2fe;
                    color: #0369a1;
                    border: 1px solid #bae6fd;
                  }
                  /* Pie de Página */
                  .footer {
                    margin-top: 50px;
                    text-align: center;
                    font-size: 10px;
                    color: #94a3b8;
                    border-top: 1px solid #e2e8f0;
                    padding-top: 15px;
                    page-break-inside: avoid;
                  }
                  .confidential-seal {
                    font-weight: 700;
                    color: #b45309;
                    text-transform: uppercase;
                    font-size: 9px;
                    letter-spacing: 1px;
                    margin-bottom: 5px;
                  }
                </style>
              </head>
              <body>
                <div class="container">
                  <!-- Cabecera -->
                  <div class="header-container">
                    <div class="header-logo-section">
                      <img src="\${logoUrl}" class="logo-img" alt="Arévalo & CIA">
                      <div class="header-title-box">
                        <h1 class="title">ARÉVALO & CIA</h1>
                        <p class="subtitle">Dictamen Oficial de Auditoría de Cuentas</p>
                      </div>
                    </div>
                    <div class="header-meta">
                      <div class="meta-date-label">Fecha de Emisión</div>
                      <div class="meta-date-value">\${new Date().toLocaleString('es-MX', { dateStyle: 'long', timeStyle: 'short' })}</div>
                    </div>
                  </div>

                  <!-- KPIs -->
                  <div class="meta-box">
                    <div class="meta-item">
                      <div class="meta-label">Total en Acuerdos Emitidos</div>
                      <div class="meta-value">$ \${totalVendido.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    </div>
                    <div class="meta-item">
                      <div class="meta-label">Total Recaudado Real</div>
                      <div class="meta-value green">$ \${totalRecaudado.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    </div>
                    <div class="meta-item">
                      <div class="meta-label">Índice de Inventario Libre</div>
                      <div class="meta-value">\${data.terrenos.filter(t => (t.estado||'').toLowerCase().includes('libre') || (t.estado||'').toLowerCase().includes('disponible')).length} lotes</div>
                    </div>
                  </div>

                  <!-- Tabla 1 -->
                  <h2>1. Resumen de Contratos Formalizados</h2>
                  <table>
                    <thead>
                      <tr>
                        <th>Folio</th>
                        <th>Cliente</th>
                        <th>Terreno Adquirido</th>
                        <th>Modalidad</th>
                        <th>Precio de Venta</th>
                        <th>Estatus</th>
                      </tr>
                    </thead>
                    <tbody>
                      \${data.contratos.map(c => \`
                        <tr>
                          <td><b>#\${c.id_contrato.substring(0,8).toUpperCase()}</b></td>
                          <td>\${c.cliente_nombre}</td>
                          <td>\${c.fraccionamiento} - Lote \${c.lote_num || ''}</td>
                          <td><span class="badge \${c.tipo_plan === 'contado' ? 'badge-contado' : 'badge-fin'}">\${c.tipo_plan}</span></td>
                          <td><b>$ \${parseFloat(c.precio_total).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</b></td>
                          <td><span class="badge badge-status \${(c.estatus||'').toLowerCase() === 'activo' ? 'badge-status-activo' : ''}">\${c.estatus}</span></td>
                        </tr>
                      \`).join('')}
                    </tbody>
                  </table>

                  <!-- Tabla 2 -->
                  <h2>2. Bitácora de Transacciones y Caja (Últimos Pagos)</h2>
                  <table>
                    <thead>
                      <tr>
                        <th>ID Pago</th>
                        <th>Comprobante</th>
                        <th>Cliente</th>
                        <th>Concepto</th>
                        <th>Método de Pago</th>
                        <th>Monto Recibido</th>
                      </tr>
                    </thead>
                    <tbody>
                      \${data.pagos.map(p => \`
                        <tr>
                          <td>#\${p.id_pago}</td>
                          <td><b>\${p.comprobante || 'N/A'}</b></td>
                          <td>\${p.cliente_nombre}</td>
                          <td style="text-transform: uppercase; font-weight: 600;">\${p.concepto}</td>
                          <td style="text-transform: uppercase;">\${p.metodo_pago}</td>
                          <td style="font-weight: 700; color: #047857;">$ \${parseFloat(p.monto).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        </tr>
                      \`).join('')}
                    </tbody>
                  </table>

                  <!-- Pie de Página -->
                  <div class="footer">
                    <div class="confidential-seal">Documento Confidencial - Uso Exclusivo de Arévalo & CIA</div>
                    <p>Este documento constituye un dictamen oficial autogenerado de forma segura por el panel de Dirección General de Arévalo & CIA.</p>
                  </div>
                </div>

                <script>
                  window.onload = function() {
                    window.print();
                  };
                <\\/script>
              </body>
            </html>
          \`);
          printWindow.document.close();
        }`;

// Let's find and replace
const startIndex = content.indexOf(targetStart);
if (startIndex !== -1) {
  // Let's find printWindow.document.close();\r\n        } or printWindow.document.close();\n        }
  let endIndex = content.indexOf(targetEnd);
  let searchLen = targetEnd.length;
  if (endIndex === -1) {
    endIndex = content.indexOf(targetEndLF);
    searchLen = targetEndLF.length;
  }
  
  if (endIndex !== -1) {
    const originalBlock = content.substring(startIndex, endIndex + searchLen);
    content = content.replace(originalBlock, newPdfCode);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log("Successfully updated PDF design in dashboard.html!");
  } else {
    console.log("Could not find the end of the PDF block in dashboard.html.");
  }
} else {
  console.log("Could not find the start of the PDF block in dashboard.html.");
}
