const fs = require('fs');
const path = require('path');

const dirsToSearch = ['View', 'public', 'Controller'];

const imageRegex = /(['"`]|\b)(\/?\.\.\/|\/)?public\/([^/]+?\.(?:png|jpg|jpeg|svg|gif|webp))/gi;

function processDirectory(dirPath) {
  const files = fs.readdirSync(dirPath);

  for (const file of files) {
    const fullPath = path.join(dirPath, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.html') || fullPath.endsWith('.js') || fullPath.endsWith('.css')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Replace only files in public/ that don't have another subfolder path
      let newContent = content.replace(imageRegex, (match, quote, prefix, filename) => {
        prefix = prefix || '';
        return `${quote}${prefix}public/img/${filename}`;
      });

      if (content !== newContent) {
        fs.writeFileSync(fullPath, newContent, 'utf8');
        console.log(`Updated paths in: ${fullPath}`);
      }
    }
  }
}

dirsToSearch.forEach(dir => {
  const fullDirPath = path.join(__dirname, '..', dir);
  if (fs.existsSync(fullDirPath)) {
    processDirectory(fullDirPath);
  }
});

console.log('Update complete.');
