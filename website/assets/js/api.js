/* ============================================================
   API Client — Smart Camera Dashboard
   ============================================================ */

const API_BASE = `${location.protocol}//${location.host}/api`;

async function _request(method, endpoint, body = null) {
  const url = `${API_BASE}${endpoint}`;
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || `HTTP ${res.status}`);
  }
  return res.json();
}

async function apiPost(endpoint, body)   { return _request('POST',   endpoint, body); }
async function apiPut(endpoint, body)    { return _request('PUT',    endpoint, body); }
async function apiDelete(endpoint)       { return _request('DELETE', endpoint); }

async function apiFetch(endpoint, params = {}) {
  const url = new URL(`${API_BASE}${endpoint}`);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== null && v !== undefined && v !== '') url.searchParams.set(k, v);
  });

  const res = await fetch(url.toString());
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || `HTTP ${res.status}`);
  }
  return res.json();
}

const API = {
  rawImages: {
    list: (params) => apiFetch('/raw-images', params),
    getById: (id) => apiFetch(`/raw-images/${id}`),
    imageUrl: (filename) => `${API_BASE}/raw-images/image/${filename}`,
  },
  detections: {
    list: (params) => apiFetch('/detections', params),
    getById: (id) => apiFetch(`/detections/${id}`),
    imageUrl: (filename) => `${API_BASE.replace('/api', '')}/api/detected-images/${filename}`,
  },
  devices: {
    list:    (params)     => apiFetch('/devices', params),
    summary: ()           => apiFetch('/devices/summary'),
    getById: (id)         => apiFetch(`/devices/${id}`),
    create:  (data)       => apiPost('/devices', data),
    update:  (id, data)   => apiPut(`/devices/${id}`, data),
    delete:  (id)         => apiDelete(`/devices/${id}`),
    control: (id, action) => apiPost(`/devices/${id}/control`, { action }),
  },
  dashboard: {
    summary: () => apiFetch('/dashboard/summary'),
    devices: () => apiFetch('/dashboard/devices'),
    objectStats: () => apiFetch('/dashboard/object-stats'),
    dailyStats: (days) => apiFetch('/dashboard/daily-stats', { days }),
  },
};

/* ---- Utilities ---- */

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('id-ID', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

function formatDateShort(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('id-ID', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

function statusBadge(status) {
  const map = {
    pending_detection: ['secondary', 'Pending'],
    processing:        ['info',      'Processing'],
    completed:         ['success',   'Completed'],
    failed:            ['danger',    'Failed'],
  };
  const [cls, label] = map[status] || ['secondary', status];
  return `<span class="badge badge-${cls}">${label}</span>`;
}

function showToast(msg, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const t = document.createElement('div');
  t.className = `alert alert-${type} alert-dismissible fade show shadow-sm`;
  t.innerHTML = `${msg}<button type="button" class="btn-close" data-bs-dismiss="alert"></button>`;
  container.appendChild(t);
  setTimeout(() => t.remove(), 4000);
}

function getQueryParam(key) {
  return new URLSearchParams(window.location.search).get(key);
}
