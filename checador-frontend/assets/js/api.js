/**
 * api.js — Capa de comunicación con la API REST
 * Todas las llamadas al backend pasan por este módulo.
 */

const API = (() => {
  const BASE_URL = window.APP_CONFIG?.apiBase || '/api';

  // ── Helpers ──────────────────────────────────────────────

  function getToken() {
    return localStorage.getItem('auth_token') || '';
  }

  function defaultHeaders() {
    const h = { 'Content-Type': 'application/json' };
    const tok = getToken();
    if (tok) h['Authorization'] = `Bearer ${tok}`;
    return h;
  }

  async function request(method, endpoint, body = null, signal = null) {
    const opts = {
      method,
      headers: defaultHeaders(),
    };
    if (body !== null) opts.body = JSON.stringify(body);
    if (signal) opts.signal = signal;

    try {
      const res = await fetch(`${BASE_URL}${endpoint}`, opts);

      if (res.status === 401 && endpoint !== '/login') {
        // Token expirado
        Auth.logout();
        return { ok: false, status: 401, data: null, error: 'Sesión expirada' };
      }

      let data = null;
      let rawJson = null;
      const ct = res.headers.get('content-type') || '';
      if (ct.includes('application/json')) {
        rawJson = await res.json();
        // Unwrap the standard backend response { success, message, data }
        // EXCEPT if it contains `meta`, which means it's paginated and the frontend 
        // `res.data?.data` checks are actually expecting the full { data, meta } structure
        data = rawJson.meta !== undefined ? rawJson : (rawJson.data !== undefined ? rawJson.data : rawJson);
      }

      return { ok: res.ok, status: res.status, data, error: res.ok ? null : (rawJson?.message || 'Error en la solicitud') };
    } catch (err) {
      if (err.name === 'AbortError') return { ok: false, status: 0, data: null, error: 'Solicitud cancelada' };
      console.error('[API] Error de red:', err);
      return { ok: false, status: 0, data: null, error: 'Sin conexión con el servidor' };
    }
  }

  // ── Métodos HTTP ──────────────────────────────────────────

  const get = (ep, signal) => request('GET', ep, null, signal);
  const post = (ep, body) => request('POST', ep, body);
  const put = (ep, body) => request('PUT', ep, body);
  const patch = (ep, body) => request('PATCH', ep, body);
  const del = (ep) => request('DELETE', ep, null);

  // ── Endpoints por módulo ──────────────────────────────────

  // Auth
  const Auth = {
    login: (u, p) => post('/login', { username: u, password: p }),
    logout: () => {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      window.location.href = '/login.html';
    },
    me: () => get('/me'),
  };

  // Dashboard
  const Dashboard = {
    kpis: () => get('/dashboard/kpis'),
    movimientosHoy: (params = '') => get(`/dashboard/movimientos-hoy${params}`),
    noLlegados: () => get('/dashboard/no-llegados'),
  };

  // Empleados
  const Empleados = {
    list: (params = '') => get(`/empleados${params}`),
    get: (id) => get(`/empleados/${id}`),
    create: (data) => post('/empleados', data),
    update: (id, data) => put(`/empleados/${id}`, data),
    toggle: (id, estado) => patch(`/empleados/${id}/estado`, { activo: estado }),
    qrToken: (id) => get(`/empleados/${id}/qr`),
    horario: (id) => get(`/empleados/${id}/horario`),
    saveHorario: (id, dias) => put(`/empleados/${id}/horario`, { dias }),
  };

  // Turnos
  const Turnos = {
    list: (params = '') => get(`/turnos${params}`),
    get: (id) => get(`/turnos/${id}`),
    create: (data) => post('/turnos', data),
    update: (id, data) => put(`/turnos/${id}`, data),
    toggle: (id, estado) => patch(`/turnos/${id}/estado`, { activo: estado }),
  };

  // Asistencias / Movimientos
  const Asistencias = {
    list: (params = '') => get(`/asistencias${params}`),
    byFecha: (f, params = '') => get(`/asistencias?fecha=${f}${params}`),
  };

  // Resumen diario
  const Reportes = {
    resumen: (params = '') => get(`/reportes/resumen${params}`),
    exportCsv: (params = '') => `${BASE_URL}/reportes/resumen/export${params}`,
  };

  // Solicitudes
  const Solicitudes = {
    list: (params = '') => get(`/solicitudes${params}`),
    get: (id) => get(`/solicitudes/${id}`),
    create: (data) => post('/solicitudes', data),
    aprobar: (id, obs) => patch(`/solicitudes/${id}/aprobar`, { observaciones: obs }),
    rechazar: (id, obs) => patch(`/solicitudes/${id}/rechazar`, { observaciones: obs }),
  };

  // Usuarios
  const Usuarios = {
    list: (params = '') => get(`/usuarios${params}`),
    get: (id) => get(`/usuarios/${id}`),
    create: (data) => post('/usuarios', data),
    update: (id, data) => put(`/usuarios/${id}`, data),
    toggle: (id, estado) => patch(`/usuarios/${id}/estado`, { activo: estado }),
  };

  // Bitácora
  const Bitacora = {
    list: (params = '') => get(`/bitacora${params}`),
  };

  // Checador terminal
  const Checador = {
    identify: (token, method = 'qr') => post('/checador/identificar', { token, metodo: method }),
    registrar: (data) => post('/checador/registrar', data),
    // data = { qr_token, tipo_movimiento, dispositivo, metodo_registro }
  };

  // Catálogos
  const Catalogos = {
    departamentos: () => get('/departamentos'),
    turnos: () => get('/turnos?activo=1'),
    puestos: (depId = '') => get(`/puestos${depId ? `?id_departamento=${depId}` : ''}`),
    tiposMovimiento: () => get('/tipos-movimiento'),
  };

  // ── Exportar ──────────────────────────────────────────────

  return {
    get, post, put, patch, del,
    Auth, Dashboard, Empleados, Turnos,
    Asistencias, Reportes, Solicitudes,
    Usuarios, Bitacora, Checador, Catalogos,
    getToken, BASE_URL,
  };
})();
