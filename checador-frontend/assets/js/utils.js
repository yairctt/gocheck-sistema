/**
 * utils.js — Funciones utilitarias reutilizables
 */

const Utils = (() => {

  // ── Fechas ─────────────────────────────────────────────

  function formatDate(str) {
    if (!str) return '—';
    // Si la cadena es solo "YYYY-MM-DD", forzamos tratarla en hora local de MX para no tener un desfase de UTC
    if (typeof str === 'string' && str.length === 10) str += 'T12:00:00';
    const d = new Date(str);
    return d.toLocaleDateString('es-MX', { timeZone: 'America/Mexico_City', day:'2-digit', month:'short', year:'numeric' });
  }

  function formatDateTime(str) {
    if (!str) return '—';
    const d = new Date(str);
    return d.toLocaleString('es-MX', {
      timeZone: 'America/Mexico_City',
      day:'2-digit', month:'short', year:'numeric',
      hour:'2-digit', minute:'2-digit',
    });
  }

  function formatTime(str) {
    if (!str) return '—';
    if (str.length <= 8) return str.substring(0, 5);
    const d = new Date(str);
    return d.toLocaleTimeString('es-MX', { timeZone: 'America/Mexico_City', hour:'2-digit', minute:'2-digit' });
  }

  function todayISO() {
    const d = new Date();
    const parts = new Intl.DateTimeFormat('es-MX', {
      timeZone: 'America/Mexico_City',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).formatToParts(d);
    
    let y, m, dd;
    for (const p of parts) {
      if (p.type === 'year') y = p.value;
      if (p.type === 'month') m = p.value;
      if (p.type === 'day') dd = p.value;
    }
    return `${y}-${m}-${dd}`;
  }

  // ── Minutos → hh:mm ──────────────────────────────────

  function minutesToHHMM(mins) {
    if (!mins && mins !== 0) return '—';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
  }

  // ── Iniciales ────────────────────────────────────────

  function initials(name) {
    if (!name) return '?';
    return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
  }

  // ── Badges ────────────────────────────────────────────

  function incidenciaBadge(inc) {
    const map = {
      NORMAL:             ['bs-normal',   'Normal'],
      RETARDO:            ['bs-retardo',  'Retardo'],
      RETARDO_JUSTIFICADO:['bs-retardo',  'Ret. Justificado'],
      FALTA:              ['bs-falta',    'Falta'],
      FALTA_JUSTIFICADA:  ['bs-falta',    'Falta Justificada'],
      PERMISO:            ['bs-pending',  'Permiso'],
      VACACIONES:         ['bs-entrada',  'Vacaciones'],
      INCAPACIDAD:        ['bs-salida',   'Incapacidad'],
      DESCANSO:           ['bs-inactive', 'Descanso'],
    };
    const [cls, label] = map[inc] || ['bs-inactive', inc || '—'];
    return `<span class="badge-status ${cls}">${label}</span>`;
  }

  function tipoMovimientoBadge(clave) {
    const map = {
      ENTRADA:        ['bs-entrada', 'Entrada'],
      SALIDA:         ['bs-salida',  'Salida'],
      SALIDA_COMIDA:  ['bs-pending', 'Sal. Comida'],
      REGRESO_COMIDA: ['bs-normal',  'Reg. Comida'],
      PERMISO:        ['bs-retardo', 'Permiso'],
      VACACIONES:     ['bs-entrada', 'Vacaciones'],
      INCAPACIDAD:    ['bs-falta',   'Incapacidad'],
    };
    const [cls, label] = map[clave] || ['bs-inactive', clave || '—'];
    return `<span class="badge-status ${cls}">${label}</span>`;
  }

  function activoBadge(activo) {
    return activo
      ? `<span class="badge-status bs-active">Activo</span>`
      : `<span class="badge-status bs-inactive">Inactivo</span>`;
  }

  function solicitudBadge(clave) {
    const map = {
      PENDIENTE: 'bs-pending',
      APROBADO:  'bs-approved',
      RECHAZADO: 'bs-rejected',
      CANCELADO: 'bs-inactive',
    };
    return `<span class="badge-status ${map[clave] || 'bs-inactive'}">${clave || '—'}</span>`;
  }

  function metodoBadge(m) {
    const icons = { qr:'qrcode', huella:'fingerprint', pin:'keyboard', manual:'pen' };
    return `<span class="text-mono" style="font-size:12px"><i class="fas fa-${icons[m]||'circle'} me-1"></i>${m||'—'}</span>`;
  }

  function rolBadge(rol) {
    const map = {
      superadmin: 'bs-falta',
      admin:      'bs-entrada',
      supervisor: 'bs-retardo',
      consulta:   'bs-inactive',
    };
    return `<span class="badge-status ${map[rol]||'bs-inactive'}">${rol||'—'}</span>`;
  }

  // ── Toast ──────────────────────────────────────────────

  function toast(message, type = 'success') {
    const color   = type === 'success' ? 'var(--accent-primary)' : type === 'error' ? 'var(--accent-red)' : 'var(--accent-blue)';
    const icon    = type === 'success' ? 'check-circle' : type === 'error' ? 'times-circle' : 'info-circle';

    let container = document.getElementById('toastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toastContainer';
      container.className = 'toast-container position-fixed bottom-0 end-0 p-3';
      document.body.appendChild(container);
    }

    const id = 'toast_' + Date.now();
    container.insertAdjacentHTML('beforeend', `
      <div id="${id}" class="toast align-items-center show" role="alert" aria-live="assertive">
        <div class="toast-header">
          <i class="fas fa-${icon} me-2" style="color:${color}"></i>
          <strong class="me-auto" style="font-size:13px">${type === 'success' ? 'Éxito' : type === 'error' ? 'Error' : 'Info'}</strong>
          <button type="button" class="btn-close" data-bs-dismiss="toast"></button>
        </div>
        <div class="toast-body" style="font-size:13px">${message}</div>
      </div>
    `);

    setTimeout(() => {
      const el = document.getElementById(id);
      if (el) el.remove();
    }, 4000);
  }

  // ── Loading ────────────────────────────────────────────

  function showLoader(tbodyId, cols) {
    const el = document.getElementById(tbodyId);
    if (!el) return;
    el.innerHTML = Array(5).fill(`
      <tr>
        ${Array(cols).fill('<td><div class="skeleton" style="height:14px;width:80%;border-radius:4px"></div></td>').join('')}
      </tr>
    `).join('');
  }

  function emptyState(tbodyId, cols, msg = 'Sin registros') {
    const el = document.getElementById(tbodyId);
    if (el) el.innerHTML = `<tr><td colspan="${cols}" class="text-center py-4 text-muted">${msg}</td></tr>`;
  }

  // ── Build query string from object ─────────────────────

  function buildQuery(params) {
    const q = Object.entries(params).filter(([,v]) => v !== '' && v !== null && v !== undefined);
    if (!q.length) return '';
    return '?' + q.map(([k,v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&');
  }

  // ── CSV export ─────────────────────────────────────────

  function exportTableToCSV(tableId, filename) {
    const table = document.getElementById(tableId);
    if (!table) return;
    const rows = [...table.querySelectorAll('tr')];
    const csv = rows.map(row =>
      [...row.querySelectorAll('th,td')]
        .map(cell => `"${cell.textContent.trim().replace(/"/g,'""')}"`)
        .join(',')
    ).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename || 'export.csv'; a.click();
    URL.revokeObjectURL(url);
  }

  // ── Confirm dialog ─────────────────────────────────────

  function confirm(message, onConfirm) {
    const existing = document.getElementById('confirmModal');
    if (existing) existing.remove();

    document.body.insertAdjacentHTML('beforeend', `
      <div class="modal fade" id="confirmModal" tabindex="-1">
        <div class="modal-dialog modal-sm">
          <div class="modal-content">
            <div class="modal-header">
              <h6 class="modal-title"><i class="fas fa-exclamation-triangle text-orange me-2"></i>Confirmar acción</h6>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body" style="font-size:13.5px">${message}</div>
            <div class="modal-footer">
              <button class="btn btn-outline btn-sm" data-bs-dismiss="modal">Cancelar</button>
              <button class="btn btn-danger-outline btn-sm" id="confirmYes">Confirmar</button>
            </div>
          </div>
        </div>
      </div>
    `);

    const modal = new bootstrap.Modal(document.getElementById('confirmModal'));
    modal.show();

    document.getElementById('confirmYes').addEventListener('click', () => {
      modal.hide();
      onConfirm();
    });
  }

  // ── Populate <select> ──────────────────────────────────

  function fillSelect(selectId, items, valueKey, labelKey, placeholder = 'Seleccionar') {
    const el = document.getElementById(selectId);
    if (!el) return;

    // Filtro para evitar duplicados en la interfaz (por ID y por nombre)
    const uniqueItems = [];
    const seenValues = new Set();
    const seenLabels = new Set();

    (items || []).forEach(item => {
      const val = item[valueKey];
      const lab = String(item[labelKey] || '').trim();
      if (val != null && lab !== '' && !seenValues.has(val) && !seenLabels.has(lab)) {
        seenValues.add(val);
        seenLabels.add(lab);
        uniqueItems.push(item);
      }
    });

    el.innerHTML = `<option value="">${placeholder}</option>` +
      uniqueItems.map(i => `<option value="${i[valueKey]}">${i[labelKey]}</option>`).join('');
  }

  // ── Auth guard ─────────────────────────────────────────

  function requireAuth() {
    const token = localStorage.getItem('auth_token');
    if (!token) window.location.href = '/login.html';
  }

  // ── Expose ────────────────────────────────────────────

  return {
    formatDate, formatDateTime, formatTime, todayISO,
    minutesToHHMM, initials,
    incidenciaBadge, tipoMovimientoBadge, activoBadge, solicitudBadge,
    metodoBadge, rolBadge,
    toast, showLoader, emptyState,
    buildQuery, exportTableToCSV, confirm, fillSelect, requireAuth,
  };
})();
