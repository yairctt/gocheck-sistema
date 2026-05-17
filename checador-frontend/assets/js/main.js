/**
 * main.js — Inicialización global y carga de componentes
 */

// ── Configuración de la aplicación ───────────────────────

window.APP_CONFIG = {
  apiBase: 'http://localhost:3000/api',
  appName: 'GoCheck',
  store: 'Abarrotes La Central',
  version: '2.1',
};

// ── Carga dinámica del sidebar y navbar ──────────────────

async function loadComponent(selector, file) {
  const el = document.querySelector(selector);
  if (!el) return;
  try {
    const res = await fetch(`/components/${file}`);
    if (res.ok) {
      el.innerHTML = await res.text();
      if (file === 'sidebar.html') initSidebar();
    }
  } catch (e) {
    console.warn(`[loadComponent] No se pudo cargar ${file}:`, e);
  }
}

// ── Sidebar interactivo ──────────────────────────────────

function initSidebar() {
  // Marcar enlace activo según la URL actual
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link[data-page]').forEach(link => {
    if (link.dataset.page === currentPage) link.classList.add('active');
  });

  // Toggle en mobile
  const toggleBtn = document.getElementById('sidebarToggle');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');

  if (toggleBtn && sidebar) {
    toggleBtn.addEventListener('click', () => {
      sidebar.classList.toggle('open');
      overlay?.classList.toggle('show');
    });
  }

  if (overlay) {
    overlay.addEventListener('click', () => {
      sidebar?.classList.remove('open');
      overlay.classList.remove('show');
    });
  }

  // Usuario actual
  const user = JSON.parse(localStorage.getItem('auth_user') || '{}');
  const nameEl = document.getElementById('sidebarUserName');
  const roleEl = document.getElementById('sidebarUserRole');
  if (nameEl && user.username) nameEl.textContent = user.username;
  if (roleEl && user.rol) roleEl.textContent = user.rol;
}

// ── Inicialización de páginas ────────────────────────────

document.addEventListener('DOMContentLoaded', async () => {
  // Cargar componentes comunes (no aplica a login ni checador)
  const isPublic = ['login.html', 'checador.html'].includes(
    window.location.pathname.split('/').pop()
  );

  if (!isPublic) {
    Utils.requireAuth(); // Comentado temporalmente para poder ver las vistas sin API
    await loadComponent('#sidebar-placeholder', 'sidebar.html');
    await loadComponent('#navbar-placeholder', 'navbar.html');
    await loadComponent('#footer-placeholder', 'footer.html');
  }

  // Ejecutar inicializador de página si existe
  if (typeof Page !== 'undefined' && typeof Page.init === 'function') {
    Page.init();
  }
});

// ── Logout ────────────────────────────────────────────────

document.addEventListener('click', e => {
  if (e.target.closest('#logoutBtn')) {
    Utils.confirm('¿Cerrar sesión?', () => API.Auth.logout());
  }
});
