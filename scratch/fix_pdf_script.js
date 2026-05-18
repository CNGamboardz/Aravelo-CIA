const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'View', 'dashboard.html');
let content = fs.readFileSync(filePath, 'utf8');

// The problematic script string in template
const target = `<scr' + 'ipt>\r\n                  window.onload = function() {\r\n                    window.print();\r\n                  };\r\n                </scr' + 'ipt>`;
const targetLF = `<scr' + 'ipt>\n                  window.onload = function() {\n                    window.print();\n                  };\n                </scr' + 'ipt>`;

const replacement = `<script>\n                  window.onload = function() {\n                    window.print();\n                  };\n                <\\/script>`;

if (content.includes("<scr' + 'ipt>")) {
  // Let's replace simple string parts
  content = content.replace("<scr' + 'ipt>", "<script>");
  content = content.replace("</scr' + 'ipt>", "<\\/script>");
  fs.writeFileSync(filePath, content, 'utf8');
  console.log("Successfully fixed script tags in dashboard.html!");
} else {
  console.log("Could not find the target string <scr' + 'ipt> inside dashboard.html.");
}
