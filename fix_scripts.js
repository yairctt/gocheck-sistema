const fs = require('fs');
const path = require('path');

const pLogin = path.join(__dirname, 'checador-frontend', 'login.html');
let loginContent = fs.readFileSync(pLogin, 'utf8');
if (!loginContent.includes('<script src="/assets/js/main.js"></script>')) {
  loginContent = loginContent.replace(
    '<script src="/assets/js/api.js"></script>',
    '<script src="/assets/js/main.js"></script>\n  <script src="/assets/js/api.js"></script>'
  );
  fs.writeFileSync(pLogin, loginContent);
}

const dir = path.join(__dirname, 'checador-frontend', 'pages');
const pages = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

for (const p of pages) {
  const filePath = path.join(dir, p);
  let content = fs.readFileSync(filePath, 'utf8');
  if (content.indexOf('main.js') > content.indexOf('api.js')) {
    // Already has both, but in wrong order. Remove main.js first.
    content = content.replace(/<script src="\/assets\/js\/main\.js"><\/script>\n?/, '');
    // Insert before api.js
    content = content.replace(
      '<script src="/assets/js/api.js"></script>',
      '<script src="/assets/js/main.js"></script>\n<script src="/assets/js/api.js"></script>'
    );
    fs.writeFileSync(filePath, content);
  }
}

console.log('Fixed script ordering in HTML files.');
