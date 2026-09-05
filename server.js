const express = require('express');
const path = require('path');
const app = express();
const PORT = 5000;

// 1. SEGURIDAD DE CABECERAS - CSP ACTUALIZADO
app.use((req, res, next) => {
  res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive, nosnippet');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Content-Security-Policy', 
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' " +
      "https://www.gstatic.com " +
      "https://unpkg.com " +
      "https://cdn.jsdelivr.net " +
      "https://apis.google.com " +
      "https://*.googleapis.com; " +
    "style-src 'self' 'unsafe-inline' " +
      "https://fonts.googleapis.com " +
      "https://cdnjs.cloudflare.com; " +
    "font-src 'self' " +
      "https://fonts.gstatic.com " +
      "https://cdnjs.cloudflare.com; " +
    "img-src 'self' data: blob: https:; " +
    "connect-src 'self' " +
      "https://firestore.googleapis.com " +
      "https://identitytoolkit.googleapis.com " +
      "https://securetoken.googleapis.com " +
      "https://www.gstatic.com " +
      "https://*.googleapis.com " +
      "https://cdn.jsdelivr.net;"
  );
  next();
});

// 2. GEO-FENCING (Solo localhost)
app.use((req, res, next) => {
  const ip = req.ip || req.socket.remoteAddress;
  const allowed = ['127.0.0.1', '::1', 'localhost', '::ffff:127.0.0.1'];
  
  if (allowed.includes(ip)) {
    return next();
  }
  console.warn(`⛔ Intento de acceso bloqueado desde IP: ${ip}`);
  res.status(403).send('Acceso denegado: Red no autorizada.');
});

// 3. SERVIR ARCHIVOS ESTÁTICOS
app.use(express.static(path.join(__dirname, 'public'), {
  index: 'index.html',
  setHeaders: (res, path) => {
    if (path.endsWith('.js')) res.setHeader('Content-Type', 'application/javascript');
  }
}));

// 4. FALLBACK SEGURO
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log('==================================================');
  console.log('🏪 MINIMARKET DON TOMAS - Servidor Seguro Activo');
  console.log('🌐 http://localhost:5000');
  console.log('🔒 CSP, Geo-fencing y Anti-Directory Traversal: ON');
  console.log('==================================================');
});