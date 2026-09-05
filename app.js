import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, updateProfile, signOut, updatePassword, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyB9xycIeBDB2NesjATuJC1ZR3WQQIWSZ8I",
  authDomain: "appdontomas.firebaseapp.com",
  projectId: "appdontomas",
  storageBucket: "appdontomas.firebasestorage.app",
  messagingSenderId: "632341787194",
  appId: "1:632341787194:web:5ac7238fb3f64f79b3bb03"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ==================== LIBRERÍA DE ÍCONOS ====================
const ICON_LIBRARY = ['🍚','🍝','🛢️','🧂','🥤','🧀','🍗','🥩','🥔','🍌','🍎','🧴','🍫','🧻','🥚','🧅','🧄','🌶️','🍋','🍊','🍉','🍓','🫐','🥭','🥥','🥦','🌽','🥜','☕','🍵','🍷','🥃','🍽️','🍲','🌮','🌯','🍛','🍡','🍧','🍦','🧁','🍰','🎂','🍮','🍬','🍿','🍪','🌰','🥬','🫑','🫒','🍼','🫖','🍶','🍻','🍸','🍹','🥄','🥣','📦','🎁','🏷️','🍯','🧆','🥗','🥑','🥝','🍑'];

// ==================== USUARIOS ====================
const USERS = [
  { id:'u1', name:'Tomás', email:'tomas@dontomas.local', role:'admin', avatar:'👨‍💼' },
  { id:'u2', name:'Manuel', email:'manuel@dontomas.local', role:'admin', avatar:'👨‍🌾' },
  { id:'u3', name:'Antonio', email:'antonio@dontomas.local', role:'admin', avatar:'👨‍💻' },
  { id:'u4', name:'Walter', email:'walter@dontomas.local', role:'admin', avatar:'👔' },
  { id:'u5', name:'Vane', email:'vane@dontomas.local', role:'editor', avatar:'👩' },
  { id:'u6', name:'Lily', email:'lily@dontomas.local', role:'editor', avatar:'👩' },
  { id:'u7', name:'Mary', email:'mary@dontomas.local', role:'editor', avatar:'👩' },
];

// ==================== CATEGORÍAS ====================
let CATEGORIES = [
  { id:'cat1', name:'Abarrotes', icon:'🛒', color:'#f4a261' },
  { id:'cat2', name:'Bebidas', icon:'🥤', color:'#2a9d8f' },
  { id:'cat3', name:'Lácteos', icon:'🥛', color:'#e9c46a' },
  { id:'cat4', name:'Carnes', icon:'🥩', color:'#e76f51' },
  { id:'cat5', name:'Frutas y Verduras', icon:'🍎', color:'#264653' },
  { id:'cat6', name:'Limpieza', icon:'🧼', color:'#457b9d' },
  { id:'cat7', name:'Golosinas', icon:'🍬', color:'#f4a261' },
  { id:'cat8', name:'Higiene', icon:'🧴', color:'#a8dadc' },
];

// ==================== ESTADO GLOBAL ====================
let currentUser = null;
let selectedUser = null;
let isDemoMode = false;
let DB = { products: [], sales: [], fiado: [], providers: [], manuelList: [], turnos: [], turnoTotal: 0, diaTotal: 0, payBreakdown: { Efectivo:0, Yape:0, Plin:0, Fiado:0 } };
let cart = [];
let selectedPay = 'Efectivo';
let soundEnabled = true;
let html5QrcodeScanner = null;
let recognition = null;
let lastSale = null;
let paymentToConfirm = null;
let currentCategoryForProduct = null;
let selectedIcon = '📦';
let turnoActivo = null;
let charts = {};

// ==================== SONIDOS ====================
function playSound(type) {
  if (!soundEnabled) return;
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    const sounds = { tap: { f:[600], t:0.05, vol:0.15 }, add: { f:[800, 1000], t:0.08, vol:0.2 }, remove: { f:[400, 300], t:0.1, vol:0.15 }, cash: { f:[800, 1200, 800, 1400], t:0.08, vol:0.3 }, alert: { f:[440, 880, 440], t:0.15, vol:0.3 }, success: { f:[523, 659, 784], t:0.1, vol:0.25 }, error: { f:[300, 200], t:0.15, vol:0.25 }, category: { f:[700], t:0.06, vol:0.15 } };
    const s = sounds[type] || sounds.tap;
    let time = ctx.currentTime;
    s.f.forEach(function(f) { osc.frequency.setValueAtTime(f, time); time += s.t; });
    gain.gain.setValueAtTime(s.vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, time);
    osc.start(); osc.stop(time);
  } catch(e) {}
}

// ==================== LOGIN ====================
function renderUserGrid() {
  const grid = document.getElementById('userGrid');
  if (!grid) return;
  grid.innerHTML = '';
  USERS.forEach(function(u) {
    const el = document.createElement('div');
    el.className = 'user-chip-login';
    el.innerHTML = '<div class="avatar">' + u.avatar + '</div><div class="name">' + u.name + '</div><div class="role">' + u.role + '</div>';
    el.onclick = function() { playSound('tap'); selectUser(u, el); };
    grid.appendChild(el);
  });
}

function selectUser(u, element) {
  selectedUser = u;
  document.querySelectorAll('.user-chip-login').forEach(function(e) { e.classList.remove('selected'); });
  element.classList.add('selected');
  document.getElementById('pinArea').classList.remove('hidden');
  document.getElementById('selectedUser').textContent = u.avatar + ' ' + u.name;
  document.getElementById('pinInput').value = '';
  document.getElementById('pinInput').focus();
}

document.getElementById('btnEnter').onclick = async function() {
  const pin = document.getElementById('pinInput').value;
  const errorDiv = document.getElementById('pinError');
  if (!selectedUser) { errorDiv.textContent = 'Selecciona un usuario primero'; playSound('error'); return; }
  if (pin.length !== 4) { errorDiv.textContent = 'El PIN debe tener 4 dígitos'; playSound('error'); return; }
  try {
    errorDiv.textContent = 'Verificando...';
    const userCredential = await signInWithEmailAndPassword(auth, selectedUser.email, 'mdt_' + pin);
    currentUser = userCredential.user;
    isDemoMode = false;
    playSound('success');
    enterApp();
  } catch (error) {
    console.error(error);
    playSound('error');
    if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') { errorDiv.textContent = '❌ PIN incorrecto'; } 
    else if (error.code === 'auth/too-many-requests') { errorDiv.textContent = '⛔ Cuenta bloqueada temporalmente'; } 
    else { errorDiv.textContent = 'Error de red'; }
  }
};

document.getElementById('pinInput').addEventListener('keypress', function(e) { if (e.key === 'Enter') document.getElementById('btnEnter').click(); });

document.getElementById('btnToggleDemo').onclick = function() {
  playSound('tap');
  isDemoMode = true;
  currentUser = { displayName: 'Usuario Demo', photoURL: null, email: 'demo@dontomas.local' };
  document.getElementById('demoBanner').classList.remove('hidden');
  const demoData = localStorage.getItem('demo_db');
  if (demoData) DB = JSON.parse(demoData);
  enterApp();
};

async function loadUsers() {
  if (isDemoMode) return;
  try {
    const usersRef = collection(db, "users");
    const snapshot = await getDocs(usersRef);
    snapshot.forEach(function(docSnap) {
      const userData = docSnap.data();
      const exists = USERS.find(function(u) { return u.email === userData.email; });
      if (!exists) USERS.push(userData);
    });
    renderUserList();
  } catch (e) { console.error("Error cargando usuarios:", e); }
}

function enterApp() {
  document.getElementById('loginScreen').classList.add('hidden');
  document.getElementById('appScreen').classList.remove('hidden');
  const name = currentUser.displayName || (selectedUser ? selectedUser.name : 'Usuario');
  document.getElementById('userName').textContent = (selectedUser ? selectedUser.avatar : '👤') + ' ' + name;
  const tabUsuarios = document.getElementById('tabUsuarios');
  if (selectedUser && selectedUser.role === 'admin') { tabUsuarios.style.display = 'block'; } 
  else { tabUsuarios.style.display = 'none'; }
  if (currentUser.photoURL) document.getElementById('profilePreview').src = currentUser.photoURL;
  loadDB();
  loadUsers();
  checkTurnoActivo();
}

async function loadDB() {
  const collectionName = isDemoMode ? "demo_data" : "minimarket_data";
  try {
    const docRef = doc(db, "system", collectionName);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) { DB = Object.assign({}, DB, docSnap.data()); } 
    else {
      DB.products = [
        { id:'p1', name:'Arroz 1kg', price:4.50, stock:30, max:80, icon:'🍚', barcode:'7751122334455', category:'cat1' },
        { id:'p2', name:'Coca-Cola 500ml', price:3.50, stock:40, max:100, icon:'🥤', barcode:'7759876543210', category:'cat2' },
        { id:'p3', name:'Leche 1L', price:5.50, stock:3, max:40, icon:'🥛', barcode:'7751234567893', category:'cat3' },
      ];
      DB.providers = []; DB.turnos = [];
      await setDoc(docRef, DB);
    }
  } catch (e) { console.error("Error cargando DB:", e); }
  renderCategories(); renderInventory(); renderLowStockList(); renderFiadoList(); renderProviderList(); renderUserList(); renderManuelList(); renderIconGrid(); updateTurnoButton();
}

document.getElementById('btnLogout').onclick = async function() {
  playSound('tap');
  if (!isDemoMode) await signOut(auth);
  currentUser = null; selectedUser = null; isDemoMode = false; turnoActivo = null;
  document.getElementById('appScreen').classList.add('hidden');
  document.getElementById('loginScreen').classList.remove('hidden');
  document.getElementById('demoBanner').classList.add('hidden');
  document.getElementById('pinArea').classList.add('hidden');
  document.getElementById('pinError').textContent = '';
  renderUserGrid();
};

// ==================== CONTROL DE TURNOS ====================
function checkTurnoActivo() {
  const turnoKey = 'turno_activo_' + (selectedUser ? selectedUser.id : 'unknown');
  const saved = localStorage.getItem(turnoKey);
  if (saved) { try { turnoActivo = JSON.parse(saved); } catch(e) { turnoActivo = null; } }
  updateTurnoButton(); updateTurnoBadge();
}

function updateTurnoButton() {
  const btn = document.getElementById('btnTurno');
  if (turnoActivo) { btn.textContent = '⏹️ Cerrar'; btn.style.background = 'rgba(239, 68, 68, 0.3)'; } 
  else { btn.textContent = '▶️ Iniciar'; btn.style.background = 'rgba(255,255,255,0.2)'; }
}

function updateTurnoBadge() {
  const badge = document.getElementById('turnoBadge');
  if (turnoActivo) {
    badge.classList.remove('hidden');
    const inicio = new Date(turnoActivo.inicio);
    badge.textContent = '🟢 En turno desde ' + inicio.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
  } else { badge.classList.add('hidden'); }
}

document.getElementById('btnTurno').onclick = function() { playSound('tap'); turnoActivo ? cerrarTurno() : iniciarTurno(); };

function iniciarTurno() {
  turnoActivo = { id: 't' + Date.now(), userId: selectedUser ? selectedUser.id : 'demo', userName: selectedUser ? selectedUser.name : 'Demo', inicio: new Date().toISOString(), fin: null, ventas: 0, transacciones: 0, payBreakdown: { Efectivo:0, Yape:0, Plin:0, Fiado:0 }, sales: [] };
  localStorage.setItem('turno_activo_' + (selectedUser ? selectedUser.id : 'unknown'), JSON.stringify(turnoActivo));
  updateTurnoButton(); updateTurnoBadge(); playSound('success');
  alert('✅ Turno iniciado a las ' + new Date().toLocaleTimeString('es-PE'));
}

function cerrarTurno() {
  if (!turnoActivo) return;
  turnoActivo.fin = new Date().toISOString();
  DB.turnos.push(turnoActivo);
  saveDB();
  localStorage.removeItem('turno_activo_' + (selectedUser ? selectedUser.id : 'unknown'));
  playSound('success');
  showTurnoResumen(turnoActivo);
  turnoActivo = null; updateTurnoButton(); updateTurnoBadge();
}

function showTurnoResumen(turno) {
  const inicio = new Date(turno.inicio); const fin = new Date(turno.fin);
  const duracion = Math.floor((fin - inicio) / 60000);
  let html = '<div style="padding:10px;">';
  html += '<div style="margin-bottom:12px;"><strong>👤 Vendedor:</strong> ' + turno.userName + '</div>';
  html += '<div style="margin-bottom:12px;"><strong>🕐 Inicio:</strong> ' + inicio.toLocaleString('es-PE') + '</div>';
  html += '<div style="margin-bottom:12px;"><strong>🕐 Fin:</strong> ' + fin.toLocaleString('es-PE') + '</div>';
  html += '<div style="margin-bottom:12px;"><strong>⏱️ Duración:</strong> ' + Math.floor(duracion / 60) + 'h ' + (duracion % 60) + ' min</div><hr style="margin:12px 0;">';
  html += '<div style="font-size:24px; font-weight:bold; color:var(--brand); margin-bottom:12px;"> Total Vendido: S/ ' + turno.ventas.toFixed(2) + '</div>';
  html += '<div style="margin-bottom:12px;"><strong>🧾 Transacciones:</strong> ' + turno.transacciones + '</div>';
  if (turno.transacciones > 0) html += '<div style="margin-bottom:12px;"><strong>📊 Ticket Promedio:</strong> S/ ' + (turno.ventas / turno.transacciones).toFixed(2) + '</div>';
  html += '<hr style="margin:12px 0;"><h4 style="margin-bottom:8px;">💳 Por Método de Pago:</h4>';
  html += '<div style="background:#2a9d47; color:white; padding:8px; border-radius:6px; margin-bottom:4px;">💵 Efectivo: S/ ' + (turno.payBreakdown.Efectivo || 0).toFixed(2) + '</div>';
  html += '<div style="background:#7b2cbf; color:white; padding:8px; border-radius:6px; margin-bottom:4px;">📱 Yape: S/ ' + (turno.payBreakdown.Yape || 0).toFixed(2) + '</div>';
  html += '<div style="background:#00b4d8; color:white; padding:8px; border-radius:6px; margin-bottom:4px;">📲 Plin: S/ ' + (turno.payBreakdown.Plin || 0).toFixed(2) + '</div>';
  html += '<div style="background:#6c757d; color:white; padding:8px; border-radius:6px;">📒 Fiado: S/ ' + (turno.payBreakdown.Fiado || 0).toFixed(2) + '</div></div>';
  document.getElementById('turnoModalTitle').textContent = '📋 Cierre de Turno';
  document.getElementById('turnoModalContent').innerHTML = html;
  document.getElementById('turnoModal').classList.remove('hidden');
}

// ==================== LIBRERÍA DE ÍCONOS Y MODAL PRODUCTO ====================
function renderIconGrid() {
  const grid = document.getElementById('iconGrid');
  if (!grid) return;
  grid.innerHTML = '';
  ICON_LIBRARY.forEach(function(icon) {
    const el = document.createElement('div');
    el.className = 'icon-option';
    if (icon === selectedIcon) el.classList.add('selected');
    el.textContent = icon;
    el.onclick = function() {
      playSound('tap');
      document.querySelectorAll('.icon-option').forEach(function(e) { e.classList.remove('selected'); });
      el.classList.add('selected');
      selectedIcon = icon;
      document.getElementById('prodIcon').value = icon;
    };
    grid.appendChild(el);
  });
}

function openProductModal(categoryId) {
  currentCategoryForProduct = categoryId; selectedIcon = '📦';
  document.getElementById('prodName').value = ''; document.getElementById('prodPrice').value = '';
  document.getElementById('prodStock').value = ''; document.getElementById('prodMax').value = '';
  document.getElementById('prodBarcode').value = ''; document.getElementById('prodIcon').value = '';
  renderIconGrid();
  document.getElementById('productModal').classList.remove('hidden');
  document.getElementById('prodName').focus();
}

document.getElementById('btnSaveProduct').onclick = function() {
  const name = document.getElementById('prodName').value.trim();
  const price = parseFloat(document.getElementById('prodPrice').value);
  const stock = parseInt(document.getElementById('prodStock').value);
  const max = parseInt(document.getElementById('prodMax').value);
  const barcode = document.getElementById('prodBarcode').value.trim();
  const icon = document.getElementById('prodIcon').value || '📦';
  if (!name) { playSound('error'); return alert('Ingresa el nombre del producto'); }
  if (isNaN(price) || price <= 0) { playSound('error'); return alert('Precio inválido'); }
  if (isNaN(stock) || stock < 0) { playSound('error'); return alert('Stock inválido'); }
  if (isNaN(max) || max <= 0) { playSound('error'); return alert('Stock máximo inválido'); }
  DB.products.push({ id: 'p' + Date.now(), name: name, price: price, stock: stock, max: max, barcode: barcode, icon: icon, category: currentCategoryForProduct });
  saveDB(); closeModal('productModal'); renderProducts(currentCategoryForProduct); renderCategories(); renderInventory(); renderLowStockList();
  playSound('success'); alert('✅ Producto "' + name + '" agregado');
};

document.getElementById('btnVoiceProduct').onclick = function() {
  playSound('tap');
  if (!recognition) initVoiceRecognition();
  if (recognition) {
    recognition.start();
    const oldOnResult = recognition.onresult;
    recognition.onresult = function(event) {
      document.getElementById('prodName').value = event.results[event.results.length - 1][0].transcript;
      recognition.stop(); recognition.onresult = oldOnResult; playSound('success');
    };
    setTimeout(function() { if (recognition) recognition.stop(); }, 5000);
  }
};

// ==================== CATEGORÍAS Y PRODUCTOS ====================
function renderCategories() {
  const grid = document.getElementById('categoryGrid');
  if (!grid) return;
  grid.innerHTML = '';
  CATEGORIES.forEach(function(cat) {
    const count = DB.products.filter(function(p) { return p.category === cat.id; }).length;
    const el = document.createElement('div');
    el.className = 'category-card';
    el.style.borderTop = '4px solid ' + cat.color;
    el.innerHTML = '<div class="cat-icon">' + cat.icon + '</div><div class="cat-name">' + cat.name + '</div><div class="cat-count">' + count + ' productos</div>';
    el.onclick = function() { playSound('category'); showProductsByCategory(cat); };
    grid.appendChild(el);
  });
}

function showProductsByCategory(cat) {
  document.getElementById('categoriesView').classList.add('hidden');
  document.getElementById('productsByCategory').classList.remove('hidden');
  document.getElementById('currentCategoryTitle').innerHTML = cat.icon + ' ' + cat.name + ' <button onclick="openProductModal(\'' + cat.id + '\')" class="btn btn-sm btn-primary" style="margin-left:10px; font-size:11px; padding:4px 8px;">+ Producto</button>';
  renderProducts(cat.id);
}

document.getElementById('btnBackCategories').onclick = function() { playSound('tap'); document.getElementById('productsByCategory').classList.add('hidden'); document.getElementById('categoriesView').classList.remove('hidden'); };

document.getElementById('btnAddCategory').onclick = function() {
  playSound('tap');
  const name = prompt('Nombre de la categoría:'); if (!name) return;
  const icon = prompt('Ícono (emoji):', '📦') || '📦';
  const colors = ['#f4a261', '#2a9d8f', '#e9c46a', '#e76f51', '#264653', '#457b9d', '#a8dadc'];
  CATEGORIES.push({ id: 'cat' + Date.now(), name: name, icon: icon, color: colors[Math.floor(Math.random() * colors.length)] });
  renderCategories(); playSound('success'); alert('✅ Categoría "' + name + '" creada');
};

function renderProducts(categoryId) {
  const grid = document.getElementById('productGrid');
  if (!grid) return;
  grid.innerHTML = '';
  let products = DB.products;
  if (categoryId) products = products.filter(function(p) { return p.category === categoryId; });
  const search = (document.getElementById('searchProduct').value || '').toLowerCase();
  if (search) products = products.filter(function(p) { return p.name.toLowerCase().includes(search); });
  products.forEach(function(p) {
    const ratio = p.stock / p.max;
    const color = ratio > 0.5 ? 'linear-gradient(90deg, #0077b6, #00b4d8)' : ratio > 0.2 ? 'linear-gradient(90deg, #f77f00, #ffb703)' : 'linear-gradient(90deg, #d62828, #f77f00)';
    const pct = Math.min(100, ratio * 100);
    const el = document.createElement('div');
    el.className = 'product-card';
    el.innerHTML = '<div style="font-size:32px; text-align:center;">' + p.icon + '</div><div style="font-weight:600; text-align:center; font-size:14px;">' + p.name + '</div><div style="color:var(--brand); font-weight:700; text-align:center;">S/ ' + p.price.toFixed(2) + '</div><div style="height:8px; background:#eee; border-radius:4px; margin-top:6px; overflow:hidden;"><div style="height:100%; width:' + pct + '%; background:' + color + ';"></div></div><div style="font-size:11px; color:#666; text-align:center; margin-top:4px;">Stock: ' + p.stock + '/' + p.max + '</div>';
    el.onclick = function() { playSound('add'); addToCart(p.id); };
    grid.appendChild(el);
  });
}

document.getElementById('searchProduct').oninput = function() {
  const search = this.value.toLowerCase();
  if (search.length > 0) {
    document.getElementById('categoriesView').classList.add('hidden');
    document.getElementById('productsByCategory').classList.remove('hidden');
    document.getElementById('currentCategoryTitle').textContent = '🔍 Búsqueda';
    renderProducts(null);
  } else {
    document.getElementById('productsByCategory').classList.add('hidden');
    document.getElementById('categoriesView').classList.remove('hidden');
  }
};

function addToCart(pid) {
  const p = DB.products.find(function(x) { return x.id === pid; });
  if (!p || p.stock <= 0) { playSound('error'); return alert('Sin stock disponible'); }
  const item = cart.find(function(c) { return c.id === pid; });
  if (item) { if (item.qty >= p.stock) { playSound('error'); return alert('Stock máximo alcanzado'); } item.qty++; } 
  else { cart.push({ id: p.id, name: p.name, price: p.price, qty: 1 }); }
  renderCart();
}

function renderCart() {
  const list = document.getElementById('cartList');
  if (!list) return;
  list.innerHTML = '';
  let total = 0;
  cart.forEach(function(it, idx) {
    total += it.price * it.qty;
    list.innerHTML += '<div class="cart-item"><div><strong>' + it.name + '</strong><br><small>S/ ' + it.price.toFixed(2) + ' x ' + it.qty + '</small></div><div style="display:flex; gap:5px; align-items:center;"><button onclick="updateQty(' + idx + ', -1)" style="width:28px; height:28px; border-radius:50%; border:none; background:#eee;">-</button><span>' + it.qty + '</span><button onclick="updateQty(' + idx + ', 1)" style="width:28px; height:28px; border-radius:50%; border:none; background:#eee;">+</button><button onclick="removeFromCart(' + idx + ')" style="width:28px; height:28px; border-radius:50%; border:none; background:#d62828; color:white;">×</button></div></div>';
  });
  document.getElementById('cartTotal').textContent = 'S/ ' + total.toFixed(2);
}

window.updateQty = function(idx, delta) { playSound('tap'); cart[idx].qty += delta; if (cart[idx].qty <= 0) { playSound('remove'); cart.splice(idx, 1); } renderCart(); };
window.removeFromCart = function(idx) { playSound('remove'); cart.splice(idx, 1); renderCart(); };

// ==================== PAGOS Y VENTAS ====================
document.querySelectorAll('.pay-btn').forEach(function(btn) {
  btn.onclick = function() {
    playSound('tap');
    document.querySelectorAll('.pay-btn').forEach(function(b) { b.classList.remove('selected'); });
    btn.classList.add('selected');
    selectedPay = btn.dataset.pay;
    const fiadoFields = document.getElementById('fiadoFields');
    if (selectedPay === 'Fiado') fiadoFields.classList.remove('hidden'); else fiadoFields.classList.add('hidden');
  };
});

document.getElementById('btnCharge').onclick = async function() {
  if (cart.length === 0) { playSound('error'); return alert('El carrito está vacío'); }
  const total = cart.reduce(function(sum, it) { return sum + (it.price * it.qty); }, 0);
  for (let i = 0; i < cart.length; i++) {
    const p = DB.products.find(function(x) { return x.id === cart[i].id; });
    if (p && p.stock < cart[i].qty) { playSound('error'); return alert('Stock insuficiente para ' + p.name); }
  }
  cart.forEach(function(it) {
    const p = DB.products.find(function(x) { return x.id === it.id; });
    if (p) { p.stock -= it.qty; if (p.stock <= p.max * 0.2) { showStockAlert(p); playSound('alert'); } }
  });
  const sale = { id: 'v' + Date.now(), total: total, pay: selectedPay, user: currentUser ? currentUser.email : 'demo', userName: selectedUser ? selectedUser.name : 'Demo', date: new Date().toISOString(), items: JSON.parse(JSON.stringify(cart)) };
  if (selectedPay === 'Fiado') {
    const cliente = document.getElementById('clienteFiado').value.trim();
    const dni = document.getElementById('dniFiado').value.trim();
    if (!cliente) { playSound('error'); return alert('Ingresa el nombre del cliente'); }
    sale.cliente = cliente; sale.dni = dni; sale.paid = false;
    DB.fiado.push(sale);
  }
  DB.sales.push(sale); DB.turnoTotal += total; DB.diaTotal += total;
  DB.payBreakdown[selectedPay] = (DB.payBreakdown[selectedPay] || 0) + total;
  if (turnoActivo) {
    turnoActivo.ventas += total; turnoActivo.transacciones++;
    turnoActivo.payBreakdown[selectedPay] = (turnoActivo.payBreakdown[selectedPay] || 0) + total;
    turnoActivo.sales.push(sale.id);
    localStorage.setItem('turno_activo_' + (selectedUser ? selectedUser.id : 'unknown'), JSON.stringify(turnoActivo));
  }
  lastSale = sale;
  if (isDemoMode) localStorage.setItem('demo_db', JSON.stringify(DB));
  else { try { await updateDoc(doc(db, "system", "minimarket_data"), DB); } catch(e) { console.error(e); } }
  playSound('cash'); showTicket(sale);
};

// ==================== TICKET ====================
function showTicket(sale) {
  document.getElementById('appScreen').classList.add('hidden');
  document.getElementById('ticketView').classList.remove('hidden');
  const date = new Date(sale.date);
  document.getElementById('ticketDate').textContent = date.toLocaleString('es-PE');
  document.getElementById('ticketUser').textContent = selectedUser ? selectedUser.name : 'Usuario';
  const payLabels = { 'Efectivo': '💵 Efectivo', 'Yape': '📱 Yape', 'Plin': '📲 Plin', 'Fiado': '📒 Fiado' };
  document.getElementById('ticketPay').textContent = payLabels[sale.pay] || sale.pay;
  if (sale.cliente) { document.getElementById('ticketClientRow').classList.remove('hidden'); document.getElementById('ticketClient').textContent = sale.cliente + (sale.dni ? ' (' + sale.dni + ')' : ''); } 
  else { document.getElementById('ticketClientRow').classList.add('hidden'); }
  const itemsDiv = document.getElementById('ticketItems');
  itemsDiv.innerHTML = '';
  sale.items.forEach(function(item) { itemsDiv.innerHTML += '<div class="ticket-item"><span>' + item.name + '</span><span>' + item.qty + ' x S/ ' + item.price.toFixed(2) + '</span><span>S/ ' + (item.qty * item.price).toFixed(2) + '</span></div>'; });
  document.getElementById('ticketTotal').textContent = 'S/ ' + sale.total.toFixed(2);
  document.getElementById('btnSendWhatsApp').onclick = function() { sendWhatsApp(sale); };
  document.getElementById('btnPrintTicket').onclick = function() { playSound('tap'); window.print(); };
  document.getElementById('btnNewSale').onclick = function() { playSound('tap'); newSale(); };
}

function sendWhatsApp(sale) {
  const date = new Date(sale.date).toLocaleString('es-PE');
  let message = '*Minimarket Don Tomas*\n📅 ' + date + '\n👤 Atendido por: ' + (selectedUser ? selectedUser.name : 'Usuario') + '\n💳 Pago: ' + sale.pay + '\n\n*Productos:*\n';
  sale.items.forEach(function(item) { message += '• ' + item.name + ' - ' + item.qty + ' x S/ ' + item.price.toFixed(2) + ' = S/ ' + (item.qty * item.price).toFixed(2) + '\n'; });
  message += '\n*TOTAL: S/ ' + sale.total.toFixed(2) + '*\n\n¡Gracias por su compra! 🙏';
  window.open('https://wa.me/?text=' + encodeURIComponent(message), '_blank');
  playSound('success');
}

function newSale() {
  cart = []; document.getElementById('clienteFiado').value = ''; document.getElementById('dniFiado').value = '';
  document.getElementById('fiadoFields').classList.add('hidden');
  document.getElementById('ticketView').classList.add('hidden');
  document.getElementById('appScreen').classList.remove('hidden');
  renderCart(); renderProducts(); renderInventory();
}

function showStockAlert(product) {
  const alert = document.createElement('div');
  alert.className = 'alert-notification';
  alert.innerHTML = '⚠️ <strong>' + product.name + '</strong> stock crítico: ' + product.stock + ' unidades';
  document.body.appendChild(alert);
  setTimeout(function() { alert.remove(); }, 5000);
}

document.getElementById('btnMute').onclick = function() { soundEnabled = !soundEnabled; document.getElementById('btnMute').textContent = soundEnabled ? '🔊' : '🔇'; playSound('tap'); };

// ==================== STOCK BAJO ====================
function renderLowStockList() {
  const list = document.getElementById('lowStockList');
  if (!list) return;
  list.innerHTML = '';
  const lowStock = DB.products.filter(function(p) { return p.stock <= p.max * 0.2; });
  if (lowStock.length === 0) { list.innerHTML = '<div style="text-align:center; padding:40px; color:#666;">✅ Todos los productos están bien abastecidos</div>'; document.getElementById('totalLowStock').textContent = '0'; return; }
  lowStock.forEach(function(p) {
    const ratio = p.stock / p.max;
    const color = ratio > 0.1 ? '#f77f00' : '#d62828';
    const qtyToBuy = p.max - p.stock;
    list.innerHTML += '<div style="background:white; padding:12px; border-radius:10px; margin:8px 0; border-left:4px solid ' + color + ';"><div style="display:flex; justify-content:space-between; align-items:center;"><div><strong>' + p.icon + ' ' + p.name + '</strong><br><small>Stock actual: ' + p.stock + '/' + p.max + ' (' + Math.round(ratio*100) + '%)</small></div><div style="text-align:right;"><div style="font-weight:bold; color:' + color + '; margin-bottom:4px;">Comprar: ' + qtyToBuy + ' und</div><button onclick="addToManuelList(\'' + p.id + '\', ' + qtyToBuy + ')" class="btn btn-sm btn-primary">+ Agregar a lista</button></div></div></div>';
  });
  document.getElementById('totalLowStock').textContent = lowStock.length;
}

window.addToManuelList = function(productId, qty) {
  playSound('tap');
  const p = DB.products.find(function(x) { return x.id === productId; });
  if (!p) return;
  DB.manuelList.push({ id: 'm' + Date.now(), name: p.name, qty: qty, price: p.price, total: qty * p.price, purchased: false, date: new Date().toISOString() });
  saveDB(); renderManuelList(); playSound('success'); alert('✅ ' + p.name + ' agregado a la lista de Manuel');
};

// ==================== MANUEL COMPRAS ====================
function initVoiceRecognition() {
  if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.lang = 'es-PE'; recognition.continuous = true; recognition.interimResults = false;
    recognition.onresult = function(event) { parseVoiceCommand(event.results[event.results.length - 1][0].transcript); };
    recognition.onerror = function(event) { console.error('Voice error:', event.error); playSound('error'); };
  } else { alert('Tu navegador no soporta reconocimiento de voz. Usa Google Chrome.'); }
}

function parseVoiceCommand(text) {
  const patterns = [/(?:agregar|comprar|añadir)\s+(\d+)\s+(?:kilos|kg|unidades|und|botellas)\s+de\s+(.+?)\s+(?:a|por)\s+(\d+(?:\.\d+)?)\s+(?:soles|s\/)/i];
  for (let i = 0; i < patterns.length; i++) {
    const match = text.match(patterns[i]);
    if (match) { addManuelItem(match[2].trim(), parseInt(match[1]), parseFloat(match[3])); playSound('success'); return; }
  }
  playSound('error'); alert('No entendí. Intenta: "Agregar 50 kilos de papa a 80 soles"');
}

function addManuelItem(name, qty, price) {
  DB.manuelList.push({ id: 'm' + Date.now(), name: name, qty: qty, price: price, total: qty * price, purchased: false, date: new Date().toISOString() });
  saveDB(); renderManuelList(); playSound('add');
}

function renderManuelList() {
  const listDiv = document.getElementById('manuelShoppingList');
  const purchasedDiv = document.getElementById('manuelPurchasedList');
  const totalSpan = document.getElementById('manuelTotal');
  const spentSpan = document.getElementById('manuelSpent');
  if (!listDiv || !purchasedDiv) return;
  const pending = DB.manuelList.filter(function(i) { return !i.purchased; });
  listDiv.innerHTML = pending.map(function(item) { return '<div style="padding:8px; margin:4px 0; background:#f8f9fa; border-radius:6px;"><div style="display:flex; justify-content:space-between;"><div><strong>' + item.name + '</strong><br><small>' + item.qty + ' und x S/ ' + item.price.toFixed(2) + '</small></div><div style="text-align:right;"><div style="font-weight:bold; color:var(--brand);">S/ ' + item.total.toFixed(2) + '</div><button onclick="markManuelPurchased(\'' + item.id + '\')" style="background:#28a745; color:white; border:none; padding:4px 8px; border-radius:4px; margin-top:4px; cursor:pointer; font-size:11px;">✅ Comprado</button></div></div></div>'; }).join('') || '<p style="color:#666; text-align:center;">Lista vacía</p>';
  const purchased = DB.manuelList.filter(function(i) { return i.purchased; });
  purchasedDiv.innerHTML = purchased.map(function(item) { return '<div style="padding:8px; margin:4px 0; background:#d4edda; border-radius:6px;"><strong>' + item.name + '</strong><br><small>' + item.qty + ' und x S/ ' + item.price.toFixed(2) + '</small><div style="font-weight:bold; color:#28a745;">S/ ' + item.total.toFixed(2) + '</div></div>'; }).join('') || '<p style="color:#666; text-align:center;">Sin productos comprados</p>';
  totalSpan.textContent = 'S/ ' + pending.reduce(function(sum, i) { return sum + i.total; }, 0).toFixed(2);
  spentSpan.textContent = 'S/ ' + purchased.reduce(function(sum, i) { return sum + i.total; }, 0).toFixed(2);
}

window.markManuelPurchased = async function(itemId) {
  playSound('tap');
  const item = DB.manuelList.find(function(i) { return i.id === itemId; });
  if (item) {
    item.purchased = true; item.purchasedDate = new Date().toISOString();
    const product = DB.products.find(function(p) { return p.name.toLowerCase().includes(item.name.toLowerCase()); });
    if (product) product.stock += item.qty;
    await saveDB(); renderManuelList(); renderInventory(); renderLowStockList(); playSound('success');
  }
};

document.getElementById('btnVoiceList').onclick = function() { playSound('tap'); if (!recognition) initVoiceRecognition(); if (recognition) { recognition.start(); alert('🎤 Escuchando... Di: "Agregar 50 kilos de papa a 80 soles"'); } };
document.getElementById('btnManualList').onclick = function() { playSound('tap'); const name = prompt('Nombre del producto:'); if (!name) return; const qty = parseInt(prompt('Cantidad:')); const price = parseFloat(prompt('Precio total:')); if (qty && price) addManuelItem(name, qty, price); };

document.getElementById('btnGenerateComparison').onclick = function() {
  playSound('tap');
  const comparisonDiv = document.getElementById('manuelComparison');
  const contentDiv = document.getElementById('comparisonContent');
  const pending = DB.manuelList.filter(function(i) { return !i.purchased; });
  const purchased = DB.manuelList.filter(function(i) { return i.purchased; });
  if (pending.length === 0 && purchased.length === 0) { playSound('error'); alert('No hay lista'); return; }
  let html = '<h5>📋 Resumen</h5><div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin:12px 0;">';
  html += '<div style="background:#fff3cd; padding:12px; border-radius:6px;"><strong>Pendientes:</strong> ' + pending.length + '<br><strong>Total:</strong> S/ ' + pending.reduce(function(s,i){return s+i.total;},0).toFixed(2) + '</div>';
  html += '<div style="background:#d4edda; padding:12px; border-radius:6px;"><strong>Comprados:</strong> ' + purchased.length + '<br><strong>Total:</strong> S/ ' + purchased.reduce(function(s,i){return s+i.total;},0).toFixed(2) + '</div></div>';
  if (pending.length > 0) {
    html += '<h5>⚠️ Faltantes:</h5>';
    html += pending.map(function(p) { return '<div style="padding:8px; margin:4px 0; background:#fff3cd; border-radius:4px; border-left:3px solid #ffc107;">' + p.name + ' - ' + p.qty + ' und (S/ ' + p.total.toFixed(2) + ')</div>'; }).join('');
  } else { html += '<div style="background:#d4edda; padding:12px; border-radius:6px; text-align:center; margin-top:12px;"><strong>✅ ¡Todos comprados!</strong></div>'; }
  contentDiv.innerHTML = html; comparisonDiv.classList.remove('hidden'); playSound('success');
};

document.getElementById('btnClearManuelList').onclick = async function() { playSound('tap'); if (confirm('¿Limpiar toda la lista?')) { DB.manuelList = []; await saveDB(); renderManuelList(); } };

// ==================== DASHBOARD ====================
function renderDashboard() {
  const today = new Date().toDateString();
  const todaySales = DB.sales.filter(function(s) { return new Date(s.date).toDateString() === today; });
  const totalHoy = todaySales.reduce(function(sum, s) { return sum + s.total; }, 0);
  const ticketPromedio = todaySales.length > 0 ? totalHoy / todaySales.length : 0;
  const productCount = {};
  todaySales.forEach(function(s) { s.items.forEach(function(it) { productCount[it.name] = (productCount[it.name] || 0) + it.qty; }); });
  let topProduct = '-', topCount = 0;
  for (let name in productCount) { if (productCount[name] > topCount) { topCount = productCount[name]; topProduct = name; } }
  
  document.getElementById('kpiVentasHoy').textContent = 'S/ ' + totalHoy.toFixed(2);
  document.getElementById('kpiTransacciones').textContent = todaySales.length;
  document.getElementById('kpiTicketPromedio').textContent = 'S/ ' + ticketPromedio.toFixed(2);
  document.getElementById('kpiProductoTop').textContent = topProduct;
  
  renderChartVentasHora(todaySales); renderChartMetodosPago(todaySales); renderChartVentasDia(); renderChartTopProductos();
}

function renderChartVentasHora(todaySales) {
  const ctx = document.getElementById('chartVentasHora'); if (!ctx) return;
  if (charts.ventasHora) charts.ventasHora.destroy();
  const hours = [], data = [];
  for (let i = 6; i <= 22; i++) {
    hours.push(i + ':00');
    const hourSales = todaySales.filter(function(s) { return new Date(s.date).getHours() === i; });
    data.push(hourSales.reduce(function(sum, s) { return sum + s.total; }, 0));
  }
  charts.ventasHora = new Chart(ctx, { type: 'bar', data: { labels: hours, datasets: [{ label: 'Ventas (S/)', data: data, backgroundColor: 'rgba(59, 130, 246, 0.6)', borderColor: 'rgba(59, 130, 246, 1)', borderWidth: 1, borderRadius: 6 }] }, options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } } });
}

function renderChartMetodosPago(todaySales) {
  const ctx = document.getElementById('chartMetodosPago'); if (!ctx) return;
  if (charts.metodosPago) charts.metodosPago.destroy();
  const byPay = { Efectivo:0, Yape:0, Plin:0, Fiado:0 };
  todaySales.forEach(function(s) { byPay[s.pay] = (byPay[s.pay] || 0) + s.total; });
  charts.metodosPago = new Chart(ctx, { type: 'doughnut', data: { labels: ['Efectivo', 'Yape', 'Plin', 'Fiado'], datasets: [{ data: [byPay.Efectivo, byPay.Yape, byPay.Plin, byPay.Fiado], backgroundColor: ['#10b981', '#7c3aed', '#06b6d4', '#64748b'], borderWidth: 2, borderColor: '#fff' }] }, options: { responsive: true, plugins: { legend: { position: 'bottom' } } } });
}

function renderChartVentasDia() {
  const ctx = document.getElementById('chartVentasDia'); if (!ctx) return;
  if (charts.ventasDia) charts.ventasDia.destroy();
  const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const data = [0,0,0,0,0,0,0];
  const weekAgo = new Date(Date.now() - 7*24*60*60*1000);
  DB.sales.forEach(function(s) { const d = new Date(s.date); if (d >= weekAgo) data[d.getDay()] += s.total; });
  charts.ventasDia = new Chart(ctx, { type: 'line', data: { labels: dias, datasets: [{ label: 'Ventas (S/)', data: data, borderColor: '#f59e0b', backgroundColor: 'rgba(245, 158, 11, 0.2)', fill: true, tension: 0.4, borderWidth: 2, pointRadius: 4 }] }, options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } } });
}

function renderChartTopProductos() {
  const ctx = document.getElementById('chartTopProductos'); if (!ctx) return;
  if (charts.topProductos) charts.topProductos.destroy();
  const productCount = {};
  DB.sales.forEach(function(s) { s.items.forEach(function(it) { productCount[it.name] = (productCount[it.name] || 0) + it.qty; }); });
  const sorted = Object.entries(productCount).sort(function(a,b) { return b[1] - a[1]; }).slice(0, 10);
  charts.topProductos = new Chart(ctx, { type: 'bar', data: { labels: sorted.map(function(x) { return x[0]; }), datasets: [{ label: 'Unidades vendidas', data: sorted.map(function(x) { return x[1]; }), backgroundColor: 'rgba(124, 58, 237, 0.6)', borderColor: '#7c3aed', borderWidth: 1, borderRadius: 6 }] }, options: { indexAxis: 'y', responsive: true, plugins: { legend: { display: false } }, scales: { x: { beginAtZero: true } } } });
}

// ==================== REPORTES AVANZADOS ====================
window.generateSalesReport = function() {
  playSound('tap');
  const period = document.getElementById('reportPeriod').value;
  const userFilter = document.getElementById('reportUser').value;
  const reportDiv = document.getElementById('salesReport');
  const now = new Date();
  let filteredSales = DB.sales;
  let periodName = '';
  
  if (period === 'day') { filteredSales = filteredSales.filter(function(s) { return new Date(s.date).toDateString() === now.toDateString(); }); periodName = 'Hoy'; } 
  else if (period === 'yesterday') { const d = new Date(now.getTime() - 24*60*60*1000); filteredSales = filteredSales.filter(function(s) { return new Date(s.date).toDateString() === d.toDateString(); }); periodName = 'Ayer'; } 
  else if (period === 'week') { const d = new Date(now.getTime() - 7*24*60*60*1000); filteredSales = filteredSales.filter(function(s) { return new Date(s.date) >= d; }); periodName = 'Esta Semana'; } 
  else if (period === 'lastWeek') { const s = new Date(now.getTime() - 14*24*60*60*1000), e = new Date(now.getTime() - 7*24*60*60*1000); filteredSales = filteredSales.filter(function(x) { const d = new Date(x.date); return d >= s && d < e; }); periodName = 'Semana Pasada'; } 
  else if (period === 'month') { const d = new Date(now.getTime() - 30*24*60*60*1000); filteredSales = filteredSales.filter(function(s) { return new Date(s.date) >= d; }); periodName = 'Este Mes'; } 
  else if (period === 'lastMonth') { const s = new Date(now.getFullYear(), now.getMonth() - 1, 1), e = new Date(now.getFullYear(), now.getMonth(), 0); filteredSales = filteredSales.filter(function(x) { const d = new Date(x.date); return d >= s && d <= e; }); periodName = 'Mes Pasado'; } 
  else if (period === 'bimonthly') { const d = new Date(now.getTime() - 60*24*60*60*1000); filteredSales = filteredSales.filter(function(s) { return new Date(s.date) >= d; }); periodName = 'Últimos 2 Meses'; } 
  else if (period === 'quarterly') { const d = new Date(now.getTime() - 90*24*60*60*1000); filteredSales = filteredSales.filter(function(s) { return new Date(s.date) >= d; }); periodName = 'Últimos 3 Meses'; } 
  else if (period === 'year') { const d = new Date(now.getFullYear(), 0, 1); filteredSales = filteredSales.filter(function(s) { return new Date(s.date) >= d; }); periodName = 'Este Año'; } 
  else if (period === 'lastYear') { const s = new Date(now.getFullYear() - 1, 0, 1), e = new Date(now.getFullYear(), 0, 0); filteredSales = filteredSales.filter(function(x) { const d = new Date(x.date); return d >= s && d <= e; }); periodName = 'Año Pasado'; }
  
  if (userFilter !== 'all' && selectedUser && selectedUser.role === 'admin') { filteredSales = filteredSales.filter(function(s) { return s.user === userFilter; }); }
  
  let totalSales = 0; const byUser = {}; const byPay = { Efectivo:0, Yape:0, Plin:0, Fiado:0 }; const byCategory = {}; const productCount = {}; const productQty = {};
  filteredSales.forEach(function(sale) {
    totalSales += sale.total;
    if (!byUser[sale.userName]) byUser[sale.userName] = { count: 0, total: 0 };
    byUser[sale.userName].count++; byUser[sale.userName].total += sale.total;
    byPay[sale.pay] = (byPay[sale.pay] || 0) + sale.total;
    sale.items.forEach(function(item) {
      productCount[item.name] = (productCount[item.name] || 0) + item.qty;
      productQty[item.name] = (productQty[item.name] || 0) + (item.qty * item.price);
      const product = DB.products.find(function(p) { return p.name === item.name; });
      const catName = product ? (CATEGORIES.find(function(c) { return c.id === product.category; }) || {name:'Otros'}).name : 'Otros';
      byCategory[catName] = (byCategory[catName] || 0) + (item.qty * item.price);
    });
  });
  
  let prevPeriodSales = [];
  if (period === 'day') { const d = new Date(now.getTime() - 24*60*60*1000); prevPeriodSales = DB.sales.filter(function(s) { return new Date(s.date).toDateString() === d.toDateString(); }); } 
  else if (period === 'week') { const s = new Date(now.getTime() - 14*24*60*60*1000), e = new Date(now.getTime() - 7*24*60*60*1000); prevPeriodSales = DB.sales.filter(function(x) { const d = new Date(x.date); return d >= s && d < e; }); } 
  else if (period === 'month') { const s = new Date(now.getFullYear(), now.getMonth() - 1, 1), e = new Date(now.getFullYear(), now.getMonth(), 0); prevPeriodSales = DB.sales.filter(function(x) { const d = new Date(x.date); return d >= s && d <= e; }); }
  
  const prevTotal = prevPeriodSales.reduce(function(sum, s) { return sum + s.total; }, 0);
  const variacion = prevTotal > 0 ? ((totalSales - prevTotal) / prevTotal * 100).toFixed(1) : 0;
  const variacionClass = variacion >= 0 ? 'color:#10b981' : 'color:#ef4444';
  const variacionIcon = variacion >= 0 ? '📈' : '📉';
  const ticketPromedio = filteredSales.length > 0 ? totalSales / filteredSales.length : 0;
  const topProducts = Object.entries(productQty).sort(function(a,b) { return b[1] - a[1]; }).slice(0, 5);
  
  let html = '<div style="padding:10px;"><h3>📊 Informe: ' + periodName + '</h3>';
  html += '<div style="background:#f8f9fa; padding:12px; border-radius:6px; margin:12px 0; text-align:center;"><div style="font-size:13px; color:#666; margin-bottom:4px;">Comparativo vs período anterior</div><div style="font-size:24px; font-weight:bold; ' + variacionClass + ';">' + variacionIcon + ' ' + (variacion >= 0 ? '+' : '') + variacion + '%</div><div style="font-size:12px; color:#666;">Anterior: S/ ' + prevTotal.toFixed(2) + ' | Actual: S/ ' + totalSales.toFixed(2) + '</div></div>';
  html += '<div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin:12px 0;">';
  html += '<div style="background:#e7f3ff; padding:12px; border-radius:6px;"><div style="font-size:13px; color:#666;">Total Ventas</div><div style="font-size:24px; font-weight:bold; color:#0077b6;">S/ ' + totalSales.toFixed(2) + '</div></div>';
  html += '<div style="background:#d4edda; padding:12px; border-radius:6px;"><div style="font-size:13px; color:#666;">N° Transacciones</div><div style="font-size:24px; font-weight:bold; color:#28a745;">' + filteredSales.length + '</div></div>';
  html += '<div style="background:#fff3cd; padding:12px; border-radius:6px;"><div style="font-size:13px; color:#666;">Ticket Promedio</div><div style="font-size:24px; font-weight:bold; color:#f59e0b;">S/ ' + ticketPromedio.toFixed(2) + '</div></div>';
  html += '<div style="background:#f3e8ff; padding:12px; border-radius:6px;"><div style="font-size:13px; color:#666;">Productos Vendidos</div><div style="font-size:24px; font-weight:bold; color:#7c3aed;">' + Object.values(productCount).reduce(function(a,b){return a+b;},0) + ' und</div></div></div>';
  html += '<h4 style="margin-top:16px;">💳 Por Método de Pago</h4><div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">';
  html += '<div style="padding:8px; background:#2a9d47; color:white; border-radius:4px;">💵 Efectivo: S/ ' + byPay.Efectivo.toFixed(2) + ' (' + (totalSales > 0 ? ((byPay.Efectivo/totalSales)*100).toFixed(1) : 0) + '%)</div>';
  html += '<div style="padding:8px; background:#7b2cbf; color:white; border-radius:4px;">📱 Yape: S/ ' + byPay.Yape.toFixed(2) + ' (' + (totalSales > 0 ? ((byPay.Yape/totalSales)*100).toFixed(1) : 0) + '%)</div>';
  html += '<div style="padding:8px; background:#00b4d8; color:white; border-radius:4px;">📲 Plin: S/ ' + byPay.Plin.toFixed(2) + ' (' + (totalSales > 0 ? ((byPay.Plin/totalSales)*100).toFixed(1) : 0) + '%)</div>';
  html += '<div style="padding:8px; background:#6c757d; color:white; border-radius:4px;">📒 Fiado: S/ ' + byPay.Fiado.toFixed(2) + ' (' + (totalSales > 0 ? ((byPay.Fiado/totalSales)*100).toFixed(1) : 0) + '%)</div></div>';
  html += '<h4 style="margin-top:16px;">👥 Por Vendedor</h4>';
  for (let userName in byUser) { html += '<div style="padding:8px; margin:4px 0; background:#f8f9fa; border-radius:4px; display:flex; justify-content:space-between;"><span>' + userName + '</span><span>' + byUser[userName].count + ' ventas - S/ ' + byUser[userName].total.toFixed(2) + ' (' + (totalSales > 0 ? ((byUser[userName].total/totalSales)*100).toFixed(1) : 0) + '%)</span></div>'; }
  html += '<h4 style="margin-top:16px;">🏆 Top 5 Productos</h4>';
  topProducts.forEach(function(p, idx) { html += '<div style="padding:8px; margin:4px 0; background:#f8f9fa; border-radius:4px; display:flex; justify-content:space-between;"><span>' + (idx+1) + '. ' + p[0] + '</span><span>' + productCount[p[0]] + ' und - S/ ' + p[1].toFixed(2) + '</span></div>'; });
  html += '</div>';
  reportDiv.innerHTML = html;
  
  renderChartTendencia(filteredSales, period); renderChartVendedores(filteredSales); renderChartTopProductosReport(productQty); renderChartCategorias(byCategory);
};

function renderChartTendencia(filteredSales, period) {
  const ctx = document.getElementById('chartTendencia'); if (!ctx) return;
  if (charts.tendencia) charts.tendencia.destroy();
  const labels = [], data = [];
  if (period === 'day') { for (let i = 0; i < 24; i++) { labels.push(i + ':00'); const h = filteredSales.filter(function(s) { return new Date(s.date).getHours() === i; }); data.push(h.reduce(function(sum, s) { return sum + s.total; }, 0)); } } 
  else if (period === 'week') { const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']; for (let i = 6; i >= 0; i--) { const d = new Date(Date.now() - i*24*60*60*1000); labels.push(dias[d.getDay()] + ' ' + d.getDate()); const h = filteredSales.filter(function(s) { return new Date(s.date).toDateString() === d.toDateString(); }); data.push(h.reduce(function(sum, s) { return sum + s.total; }, 0)); } } 
  else { for (let i = 29; i >= 0; i--) { const d = new Date(Date.now() - i*24*60*60*1000); labels.push(d.getDate() + '/' + (d.getMonth()+1)); const h = filteredSales.filter(function(s) { return new Date(s.date).toDateString() === d.toDateString(); }); data.push(h.reduce(function(sum, s) { return sum + s.total; }, 0)); } }
  charts.tendencia = new Chart(ctx, { type: 'line', data: { labels: labels, datasets: [{ label: 'Ventas (S/)', data: data, borderColor: '#3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.1)', fill: true, tension: 0.4, borderWidth: 2, pointRadius: 3 }] }, options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } } });
}

function renderChartVendedores(filteredSales) {
  const ctx = document.getElementById('chartVendedores'); if (!ctx) return;
  if (charts.vendedores) charts.vendedores.destroy();
  const byUser = {};
  filteredSales.forEach(function(s) { if (!byUser[s.userName]) byUser[s.userName] = 0; byUser[s.userName] += s.total; });
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#7c3aed', '#06b6d4', '#ec4899'];
  charts.vendedores = new Chart(ctx, { type: 'bar', data: { labels: Object.keys(byUser), datasets: [{ label: 'Ventas (S/)', data: Object.values(byUser), backgroundColor: colors.slice(0, Object.keys(byUser).length), borderRadius: 6 }] }, options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } } });
}

function renderChartTopProductosReport(productQty) {
  const ctx = document.getElementById('chartTopProductosReport'); if (!ctx) return;
  if (charts.topProductosReport) charts.topProductosReport.destroy();
  const sorted = Object.entries(productQty).sort(function(a,b) { return b[1] - a[1]; }).slice(0, 10);
  charts.topProductosReport = new Chart(ctx, { type: 'bar', data: { labels: sorted.map(function(x) { return x[0]; }), datasets: [{ label: 'Monto (S/)', data: sorted.map(function(x) { return x[1]; }), backgroundColor: 'rgba(16, 185, 129, 0.6)', borderColor: '#10b981', borderWidth: 1, borderRadius: 6 }] }, options: { indexAxis: 'y', responsive: true, plugins: { legend: { display: false } }, scales: { x: { beginAtZero: true } } } });
}

function renderChartCategorias(byCategory) {
  const ctx = document.getElementById('chartCategorias'); if (!ctx) return;
  if (charts.categorias) charts.categorias.destroy();
  charts.categorias = new Chart(ctx, { type: 'doughnut', data: { labels: Object.keys(byCategory), datasets: [{ data: Object.values(byCategory), backgroundColor: ['#f4a261', '#2a9d8f', '#e9c46a', '#e76f51', '#264653', '#457b9d', '#a8dadc'], borderWidth: 2, borderColor: '#fff' }] }, options: { responsive: true, plugins: { legend: { position: 'bottom' } } } });
}

// ==================== PROVEEDORES ====================
function renderProviderList() {
  const list = document.getElementById('providerList'); if (!list) return;
  list.innerHTML = '';
  let totalDebt = 0; let totalPaid = 0;
  DB.providers.forEach(function(provider) {
    if (!provider.paid) totalDebt += provider.amount; else totalPaid += provider.amount;
    const el = document.createElement('div');
    el.style.background = provider.paid ? '#d4edda' : '#fff3cd';
    el.style.borderLeft = provider.paid ? '4px solid #28a745' : '4px solid #ffc107';
    el.style.padding = '12px'; el.style.borderRadius = '10px'; el.style.marginBottom = '8px';
    el.innerHTML = '<div style="display:flex; justify-content:space-between; align-items:center;"><div><strong>' + provider.name + '</strong><br><small>' + provider.description + '</small><br><small>Fecha: ' + new Date(provider.date).toLocaleDateString('es-PE') + '</small>' + (provider.paid ? '<br><small style="color:#28a745; font-weight:bold;">✅ PAGADO</small>' : '') + '</div><div style="text-align:right;"><div style="font-size:20px; font-weight:bold; color:' + (provider.paid ? '#28a745' : '#f77f00') + '; margin-bottom:8px;">S/ ' + provider.amount.toFixed(2) + '</div>' + (!provider.paid ? '<button onclick="confirmProviderPayment(\'' + provider.id + '\', ' + provider.amount + ')" class="btn btn-sm btn-success">💳 Dar por Pagado</button>' : '') + '</div></div>';
    list.appendChild(el);
  });
  document.getElementById('totalProviderDebt').textContent = totalDebt.toFixed(2);
  document.getElementById('totalProviderPaid').textContent = totalPaid.toFixed(2);
}

window.confirmProviderPayment = function(providerId, amount) {
  paymentToConfirm = { type: 'provider', id: providerId, amount: amount };
  document.getElementById('confirmPaymentText').textContent = '¿Confirmar que el crédito de proveedor ha sido pagado?';
  document.getElementById('confirmPaymentAmount').textContent = amount.toFixed(2);
  document.getElementById('confirmPaymentModal').classList.remove('hidden');
};

document.getElementById('btnConfirmPayment').onclick = function() {
  playSound('tap');
  if (paymentToConfirm) {
    if (paymentToConfirm.type === 'provider') { const p = DB.providers.find(function(x) { return x.id === paymentToConfirm.id; }); if (p) { p.paid = true; p.paidDate = new Date().toISOString(); } } 
    else if (paymentToConfirm.type === 'fiado') { const f = DB.fiado.find(function(x) { return x.id === paymentToConfirm.id; }); if (f) { f.paid = true; f.paidDate = new Date().toISOString(); } }
    saveDB(); renderProviderList(); renderFiadoList(); playSound('success');
  }
  closeModal('confirmPaymentModal');
};

document.getElementById('btnAddProvider').onclick = function() {
  playSound('tap');
  const name = prompt('Nombre del proveedor:'); if (!name) return;
  const description = prompt('Descripción:') || '';
  const amount = parseFloat(prompt('Monto (S/):'));
  if (isNaN(amount) || amount <= 0) { playSound('error'); return alert('Monto inválido'); }
  DB.providers.push({ id: 'pr' + Date.now(), name: name, description: description, amount: amount, paid: false, date: new Date().toISOString() });
  saveDB(); renderProviderList(); playSound('success'); alert('✅ Crédito agregado');
};

// ==================== FIADO ====================
function renderFiadoList() {
  const list = document.getElementById('fiadoList'); if (!list) return;
  list.innerHTML = '';
  let totalPending = 0; let totalPaid = 0;
  DB.fiado.forEach(function(fiado) {
    if (!fiado.paid) totalPending += fiado.total; else totalPaid += fiado.total;
    const el = document.createElement('div');
    el.style.background = fiado.paid ? '#d4edda' : '#fff3cd';
    el.style.borderLeft = fiado.paid ? '4px solid #28a745' : '4px solid #ffc107';
    el.style.padding = '12px'; el.style.borderRadius = '10px'; el.style.marginBottom = '8px';
    el.innerHTML = '<div style="display:flex; justify-content:space-between; align-items:center;"><div><strong>' + fiado.cliente + '</strong>' + (fiado.dni ? '<br><small>DNI/Tel: ' + fiado.dni + '</small>' : '') + '<br><small>Fecha: ' + new Date(fiado.date).toLocaleDateString('es-PE') + '</small>' + (fiado.paid ? '<br><small style="color:#28a745; font-weight:bold;">✅ COBRADO</small>' : '') + '</div><div style="text-align:right;"><div style="font-size:20px; font-weight:bold; color:' + (fiado.paid ? '#28a745' : '#f77f00') + '; margin-bottom:8px;">S/ ' + fiado.total.toFixed(2) + '</div>' + (!fiado.paid ? '<button onclick="confirmFiadoPayment(\'' + fiado.id + '\', ' + fiado.total + ')" class="btn btn-sm btn-success">💳 Dar por Cobrado</button>' : '') + '</div></div>';
    list.appendChild(el);
  });
  document.getElementById('totalFiadoPending').textContent = totalPending.toFixed(2);
  document.getElementById('totalFiadoPaid').textContent = totalPaid.toFixed(2);
}

window.confirmFiadoPayment = function(fiadoId, amount) {
  paymentToConfirm = { type: 'fiado', id: fiadoId, amount: amount };
  document.getElementById('confirmPaymentText').textContent = '¿Confirmar que el fiado ha sido cobrado?';
  document.getElementById('confirmPaymentAmount').textContent = amount.toFixed(2);
  document.getElementById('confirmPaymentModal').classList.remove('hidden');
};

window.showFiadoModal = function(filter) {
  playSound('tap');
  const modal = document.getElementById('fiadoModal');
  const content = document.getElementById('fiadoModalContent');
  let filtered = DB.fiado;
  if (filter === 'pending') filtered = filtered.filter(function(f) { return !f.paid; });
  else if (filter === 'paid') filtered = filtered.filter(function(f) { return f.paid; });
  let html = '<h4>' + (filter === 'pending' ? 'Pendiente de Cobro' : 'Cobrado') + '</h4>';
  if (filtered.length === 0) html += '<p style="text-align:center; color:#666; padding:20px;">No hay registros</p>';
  else filtered.forEach(function(f) { html += '<div style="padding:8px; margin:4px 0; background:#f8f9fa; border-radius:4px;"><strong>' + f.cliente + '</strong> - S/ ' + f.total.toFixed(2) + (f.paid ? ' <span style="color:#28a745;">✅</span>' : '') + '</div>'; });
  content.innerHTML = html; modal.classList.remove('hidden');
};

// ==================== USUARIOS ====================
function renderUserList() {
  const list = document.getElementById('userList'); if (!list) return;
  list.innerHTML = '';
  USERS.forEach(function(u) {
    const el = document.createElement('div');
    el.style.display = 'flex'; el.style.justifyContent = 'space-between'; el.style.alignItems = 'center';
    el.style.padding = '12px'; el.style.background = 'white'; el.style.borderRadius = '10px'; el.style.margin = '4px 0';
    el.innerHTML = '<div><strong>' + u.avatar + ' ' + u.name + '</strong><br><small>' + u.email + '</small><br><small style="color:' + (u.role === 'admin' ? '#dc3545' : '#28a745') + '; font-weight:bold;">' + (u.role === 'admin' ? 'Administrador' : 'Editor') + '</small></div>';
    list.appendChild(el);
  });
}

document.getElementById('btnAddUser').onclick = function() { playSound('tap'); document.getElementById('newUserModal').classList.remove('hidden'); };

window.createNewUser = async function() {
  const name = document.getElementById('newUserName').value.trim();
  const email = document.getElementById('newUserEmail').value.trim();
  const pin = document.getElementById('newUserPin').value;
  const role = document.getElementById('newUserRole').value;
  if (!name || !email || pin.length !== 4) { playSound('error'); return alert('Completa todos los campos'); }
  if (!email.includes('@dontomas.local')) { playSound('error'); return alert('El correo debe terminar en @dontomas.local'); }
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, 'mdt_' + pin);
    const firebaseUser = userCredential.user;
    const newUser = { id: firebaseUser.uid, name: name, email: email, role: role, avatar: '', createdAt: new Date().toISOString(), lastAccess: null };
    USERS.push(newUser);
    if (!isDemoMode) await setDoc(doc(db, "users", firebaseUser.uid), newUser);
    closeModal('newUserModal'); renderUserList(); playSound('success');
    alert('✅ Usuario "' + name + '" creado\nCorreo: ' + email + '\nPIN: ' + pin + '\nRol: ' + (role === 'admin' ? 'Administrador' : 'Editor'));
    document.getElementById('newUserName').value = ''; document.getElementById('newUserEmail').value = ''; document.getElementById('newUserPin').value = '';
  } catch (err) {
    playSound('error');
    if (err.code === 'auth/email-already-in-use') alert('❌ El correo ya está registrado');
    else if (err.code === 'auth/weak-password') alert('❌ Contraseña débil');
    else alert('Error: ' + err.message);
  }
};

// ==================== INVENTARIO ====================
function renderInventory() {
  const list = document.getElementById('inventoryList'); if (!list) return;
  list.innerHTML = '';
  DB.products.forEach(function(p) {
    const ratio = p.stock / p.max;
    const color = ratio > 0.5 ? 'linear-gradient(90deg, #0077b6, #00b4d8)' : ratio > 0.2 ? 'linear-gradient(90deg, #f77f00, #ffb703)' : 'linear-gradient(90deg, #d62828, #f77f00)';
    const pct = Math.min(100, ratio * 100);
    list.innerHTML += '<div class="inv-card"><div style="display:flex; justify-content:space-between; align-items:center;"><strong>' + p.icon + ' ' + p.name + '</strong><button onclick="editProduct(\'' + p.id + '\')" style="background:#0077b6; color:white; border:none; padding:4px 8px; border-radius:4px; cursor:pointer;">✏️</button></div><div style="margin:8px 0;"><div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:4px;"><span>Stock: ' + p.stock + '/' + p.max + '</span><span>' + Math.round(ratio*100) + '%</span></div><div class="stock-bar-container"><div class="stock-bar-fill" style="width:' + pct + '%; background:' + color + ';"></div><div class="stock-level-text">' + p.stock + ' und</div></div></div><div style="font-size:12px; color:#666;">Precio: S/ ' + p.price.toFixed(2) + ' | Código: ' + (p.barcode || 'N/A') + '</div></div>';
  });
}

window.editProduct = function(pid) {
  playSound('tap');
  const p = DB.products.find(function(x) { return x.id === pid; });
  if (!p) return;
  const newStock = prompt('Stock actual: ' + p.stock + '\nNuevo stock máximo:', p.max);
  if (newStock !== null && !isNaN(newStock)) { p.max = parseInt(newStock); saveDB(); renderInventory(); renderCategories(); renderLowStockList(); }
};

document.getElementById('btnAddProductGlobal').onclick = function() { playSound('tap'); if (CATEGORIES.length > 0) openProductModal(CATEGORIES[0].id); else alert('Primero crea una categoría'); };

// ==================== PERFIL ====================
document.getElementById('btnUploadPhoto').onclick = function() {
  playSound('tap');
  const file = document.getElementById('photoInput').files[0];
  if (!file) return alert('Selecciona una imagen');
  const reader = new FileReader();
  reader.onload = async function(e) {
    try { await updateProfile(currentUser, { photoURL: e.target.result }); document.getElementById('profilePreview').src = e.target.result; playSound('success'); alert('✅ Foto actualizada'); } 
    catch (err) { playSound('error'); alert('Error: ' + err.message); }
  };
  reader.readAsDataURL(file);
};

document.getElementById('btnUpdateName').onclick = async function() {
  playSound('tap');
  const newName = document.getElementById('newDisplayName').value.trim();
  if (!newName) return alert('Ingresa un nombre');
  try { await updateProfile(currentUser, { displayName: newName }); document.getElementById('userName').textContent = '👤 ' + newName; playSound('success'); alert('✅ Nombre actualizado'); } 
  catch (err) { playSound('error'); alert('Error: ' + err.message); }
};

document.getElementById('btnChangePin').onclick = async function() {
  playSound('tap');
  const currentPin = document.getElementById('currentPinVerify').value;
  const newPin = document.getElementById('newPinInput').value;
  if (currentPin.length !== 4 || newPin.length !== 4) { playSound('error'); return alert('Los PINs deben tener 4 dígitos'); }
  if (currentPin === newPin) { playSound('error'); return alert('El nuevo PIN debe ser diferente'); }
  try { await updatePassword(currentUser, 'mdt_' + newPin); playSound('success'); alert('✅ PIN actualizado'); document.getElementById('currentPinVerify').value = ''; document.getElementById('newPinInput').value = ''; } 
  catch (err) { playSound('error'); alert('Error: ' + err.message); }
};

// ==================== MODALES Y HELPERS ====================
window.closeModal = function(modalId) { document.getElementById(modalId).classList.add('hidden'); paymentToConfirm = null; };

let deferredPrompt;
window.addEventListener('beforeinstallprompt', function(e) { e.preventDefault(); deferredPrompt = e; document.getElementById('btnInstallApp').classList.remove('hidden'); });
document.getElementById('btnInstallApp').onclick = async function() {
  playSound('tap');
  if (deferredPrompt) { deferredPrompt.prompt(); const result = await deferredPrompt.userChoice; if (result.outcome === 'accepted') document.getElementById('btnInstallApp').classList.add('hidden'); deferredPrompt = null; }
};

document.querySelectorAll('.tab').forEach(function(tab) {
  tab.onclick = function() {
    playSound('tap');
    document.querySelectorAll('.tab').forEach(function(t) { t.classList.remove('active'); });
    document.querySelectorAll('.tab-panel').forEach(function(p) { p.classList.remove('active'); });
    tab.classList.add('active');
    document.getElementById('tab-' + tab.dataset.tab).classList.add('active');
    if (tab.dataset.tab === 'dashboard') renderDashboard();
  };
});

async function saveDB() {
  if (isDemoMode) localStorage.setItem('demo_db', JSON.stringify(DB));
  else { try { await updateDoc(doc(db, "system", "minimarket_data"), DB); } catch(e) { console.error(e); } }
}

document.getElementById('btnScanBarcode').onclick = function() { playSound('tap'); document.getElementById('scannerModal').classList.remove('hidden'); startScanner(); };
document.getElementById('btnCloseScanner').onclick = function() { document.getElementById('scannerModal').classList.add('hidden'); if (html5QrcodeScanner) { html5QrcodeScanner.clear(); html5QrcodeScanner = null; } };

function startScanner() {
  html5QrcodeScanner = new Html5Qrcode("reader");
  html5QrcodeScanner.start({ facingMode: "environment" }, { fps: 10, qrbox: { width: 250, height: 250 } },
    function(decodedText) {
      const product = DB.products.find(function(p) { return p.barcode === decodedText; });
      if (product) { playSound('add'); addToCart(product.id); document.getElementById('btnCloseScanner').click(); }
      else { playSound('error'); alert('⚠️ Código no registrado'); }
    }, function() {}
  ).catch(function() { playSound('error'); alert("No se pudo iniciar la cámara"); });
}

document.getElementById('btnVoiceSearch').onclick = function() {
  playSound('tap');
  if (!recognition) initVoiceRecognition();
  if (recognition) {
    recognition.start();
    const oldOnResult = recognition.onresult;
    recognition.onresult = function(event) {
      document.getElementById('searchProduct').value = event.results[event.results.length - 1][0].transcript;
      document.getElementById('searchProduct').dispatchEvent(new Event('input'));
      recognition.stop(); recognition.onresult = oldOnResult;
    };
    setTimeout(function() { if (recognition) recognition.stop(); }, 5000);
  }
};

// ==================== INICIALIZAR ====================
renderUserGrid();