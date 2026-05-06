// =====================
//  ADMIN SHARED JS
//  Hospital Vida Saudável
// =====================

// =====================
//  ADMIN SHARED JS
//  GHospital — Hospital Vida Saudável
// =====================

// A URL da API vem de config.js (carregado antes deste script em cada página).
// Fallback defensivo caso config.js não tenha sido incluído.
const API_URL = (typeof CONFIG !== 'undefined' && CONFIG.API_URL)
  ? CONFIG.API_URL
  : 'http://localhost:3000/api';

// ── Sanitização ───────────────────────────────────────────────────────────────
// Escapa HTML para evitar XSS ao inserir dados do servidor no DOM via innerHTML.
// Usa sempre esta função antes de injectar qualquer string não controlada.
function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

// ── Auth ──────────────────────────────────────────────────────────────────────
// NOTA DE SEGURANÇA: sessionStorage é usado em vez de localStorage para reduzir
// a janela de exposição do token (apagado ao fechar o separador). A solução
// ideal para produção é um httpOnly cookie gerido pelo servidor, que impede
// completamente o acesso via JavaScript mesmo em caso de XSS.
function getToken() { return sessionStorage.getItem('hvs_token'); }
function getUser()  {
  try { return JSON.parse(sessionStorage.getItem('hvs_user')); }
  catch { return null; }
}
function setSession(token, user) {
  sessionStorage.setItem('hvs_token', token);
  sessionStorage.setItem('hvs_user', JSON.stringify(user));
}

function requireAuth() {
  if (!getToken()) { window.location.href = '../login.html'; return false; }
  return true;
}

function logout() {
  sessionStorage.removeItem('hvs_token');
  sessionStorage.removeItem('hvs_user');
  window.location.href = '../login.html';
}

// ── API Helper ────────────────────────────────────────────────────────────────
async function api(method, endpoint, body = null, publicRoute = false) {
  const headers = { 'Content-Type': 'application/json' };
  if (!publicRoute) {
    const token = getToken();
    if (!token) { window.location.href = '../login.html'; return; }
    headers['Authorization'] = `Bearer ${token}`;
  }
  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);
  const res  = await fetch(`${API_URL}${endpoint}`, opts);
  const data = await res.json();
  if (res.status === 401) { logout(); return; }
  if (!res.ok) throw new Error(data.erro || 'Erro na API');
  return data;
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function toast(msg, type = 'success') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const icons = { success: 'fa-circle-check', error: 'fa-circle-exclamation' };
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  // escapeHtml na mensagem para evitar XSS em toasts com conteúdo dinâmico
  el.innerHTML = `<i class="fa-solid ${icons[type] || icons.success}"></i><span>${escapeHtml(msg)}</span>`;
  container.appendChild(el);
  setTimeout(() => el.remove(), 4000);
}

// ── Sidebar Builder ───────────────────────────────────────────────────────────
function buildSidebar(activePage) {
  const user = getUser();
  if (!user) return;

  const APP_DISPLAY = (typeof CONFIG !== 'undefined' && CONFIG.APP_NAME)
    ? CONFIG.APP_NAME
    : 'Vida Saudável';

  const pages = [
    { id: 'dashboard',    label: 'Dashboard',     icon: 'fa-gauge',          href: 'dashboard.html',    roles: ['admin','recepcao','medico'] },
    { id: 'consultas',    label: 'Consultas',      icon: 'fa-calendar-check', href: 'consultas.html',    roles: ['admin','recepcao','medico'], badge: 'pendentes' },
    { id: 'hospitais',    label: 'Hospitais',      icon: 'fa-hospital',       href: 'hospitais.html',    roles: ['admin','recepcao'] },
    { id: 'pacientes',    label: 'Pacientes',      icon: 'fa-users',          href: 'pacientes.html',    roles: ['admin','recepcao'] },
    { id: 'medicos',      label: 'Médicos',         icon: 'fa-user-doctor',    href: 'medicos.html',      roles: ['admin'] },
    { id: 'mensagens',    label: 'Mensagens',       icon: 'fa-envelope',       href: 'mensagens.html',    roles: ['admin','recepcao'], badge: 'naoLidas' },
    { id: 'utilizadores', label: 'Utilizadores',   icon: 'fa-shield-halved',  href: 'utilizadores.html', roles: ['admin'] },
  ];

  const sidebar = document.getElementById('sidebar');
  if (!sidebar) return;

  const navItems = pages
    .filter(p => p.roles.includes(user.role))
    .map(p => `
      <a href="${p.href}" class="nav-item ${activePage === p.id ? 'active' : ''}" data-page="${p.id}">
        <i class="fa-solid ${p.icon}"></i>
        <span>${escapeHtml(p.label)}</span>
        ${p.badge ? `<span class="badge hidden" id="badge-${p.badge}">0</span>` : ''}
      </a>
    `).join('');

  const initials = user.nome.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  const roleLabel = { admin: 'Administrador', medico: 'Médico', recepcao: 'Recepção' }[user.role] || user.role;

  sidebar.innerHTML = `
    <div class="sidebar-logo">
      <div class="logo-icon"><i class="fa-solid fa-plus"></i></div>
      <span>${escapeHtml(APP_DISPLAY)}</span>
    </div>
    <nav class="sidebar-nav">
      <div class="nav-section">
        <div class="nav-label">Menu Principal</div>
        ${navItems}
      </div>
      <div class="nav-section">
        <div class="nav-label">Acesso Rápido</div>
        <a href="../index.html" class="nav-item" target="_blank">
          <i class="fa-solid fa-globe"></i><span>Ver Site Público</span>
        </a>
      </div>
    </nav>
    <div class="sidebar-footer">
      <div class="user-info">
        <div class="user-avatar">${escapeHtml(initials)}</div>
        <div>
          <div class="user-name">${escapeHtml(user.nome.split(' ')[0])}</div>
          <div class="user-role">${escapeHtml(roleLabel)}</div>
        </div>
        <button class="btn-logout" onclick="logout()" title="Sair">
          <i class="fa-solid fa-right-from-bracket"></i>
        </button>
      </div>
    </div>
  `;

  loadBadges();
}

async function loadBadges() {
  try {
    const data = await api('GET', '/consultas/dashboard');
    const pendBadge = document.getElementById('badge-pendentes');
    if (pendBadge && data.totais.pendentes > 0) {
      pendBadge.textContent = data.totais.pendentes;
      pendBadge.classList.remove('hidden');
    }
  } catch {}
  try {
    const msgs = await api('GET', '/mensagens?lida=0');
    const msgBadge = document.getElementById('badge-naoLidas');
    if (msgBadge && msgs.length > 0) {
      msgBadge.textContent = msgs.length;
      msgBadge.classList.remove('hidden');
    }
  } catch {}
}

// ── Topbar Builder ────────────────────────────────────────────────────────────
function buildTopbar(title) {
  const user = getUser();
  const topbar = document.getElementById('topbar');
  if (!topbar) return;
  const hora = new Date().getHours();
  const greeting = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite';
  topbar.innerHTML = `
    <div class="topbar-left">
      <button class="btn btn-icon" id="sidebarToggle" style="display:none">
        <i class="fa-solid fa-bars"></i>
      </button>
      <h1 class="page-title">${escapeHtml(title)}</h1>
    </div>
    <div class="topbar-right">
      <span class="topbar-greeting">${greeting}, <strong>${escapeHtml(user?.nome?.split(' ')[0] || '')}</strong></span>
      <button class="topbar-btn" onclick="window.location.href='../login.html'">
        <i class="fa-solid fa-right-from-bracket"></i>
      </button>
    </div>
  `;
}

// ── Formatters ────────────────────────────────────────────────────────────────
function formatDate(dt) {
  if (!dt) return '—';
  return new Date(dt).toLocaleString('pt-AO', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}
function formatDateShort(dt) {
  if (!dt) return '—';
  return new Date(dt).toLocaleDateString('pt-AO', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

function estadoBadge(estado) {
  const map = {
    pendente:   ['badge-pendente',   'fa-clock',        'Pendente'],
    confirmada: ['badge-confirmada', 'fa-circle-check', 'Confirmada'],
    concluida:  ['badge-concluida',  'fa-check-double', 'Concluída'],
    cancelada:  ['badge-cancelada',  'fa-xmark',        'Cancelada'],
    falta:      ['badge-falta',      'fa-user-xmark',   'Falta'],
  };
  const [cls, icon, label] = map[estado] || ['badge-pendente', 'fa-clock', estado];
  return `<span class="badge ${cls}"><i class="fa-solid ${icon}"></i>${escapeHtml(label)}</span>`;
}

function roleBadge(role) {
  return `<span class="badge badge-${escapeHtml(role)}">${escapeHtml(role)}</span>`;
}

// ── Init ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  requireAuth();
});