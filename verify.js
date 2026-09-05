// scripts/verify.js
const http = require('http');

const CHECKS = [
  { path: '/',              expect: 200, name: 'Página principal' },
  { path: '/manifest.json', expect: 200, name: 'Manifest PWA' },
  { path: '/sw.js',         expect: 200, name: 'Service Worker' },
  { path: '/styles.css',    expect: 200, name: 'Estilos' },
  { path: '/app.js',        expect: 200, name: 'Lógica app' },
  { path: '/robots.txt',    expect: 200, name: 'Robots.txt (noindex)' },
  { path: '/api/health',    expect: 200, name: 'Health check' },
];

console.log('\n🔍 Verificando Minimarket Don Tomas...\n');

let passed = 0;
let pending = CHECKS.length;

CHECKS.forEach(check => {
  http.get(`http://localhost:5000${check.path}`, res => {
    const ok = res.statusCode === check.expect;
    console.log(`${ok ? '✅' : '❌'} ${check.name.padEnd(25)} → ${res.statusCode}`);
    if (ok) passed++;
    pending--;
    if (pending === 0) {
      console.log(`\n📊 Resultado: ${passed}/${CHECKS.length} checks OK`);
      if (passed === CHECKS.length) {
        console.log('\n🎉 SISTEMA OPERATIVO — Abre http://localhost:5000\n');
      } else {
        console.log('\n⚠️  Revisa los errores arriba.\n');
      }
    }
  }).on('error', e => {
    console.log(`❌ ${check.name.padEnd(25)} → ERROR: ${e.message}`);
    pending--;
  });
});