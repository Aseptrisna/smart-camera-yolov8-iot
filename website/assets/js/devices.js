/* ============================================================
   Devices — CRUD + Actuator Control
   ============================================================ */

const LIMIT = 20;
let currentPage = 1;
let currentFilters = {};
let deleteTargetId = null;

document.addEventListener('DOMContentLoaded', () => {
  loadData();
  loadSummary();

  document.getElementById('btn-refresh')?.addEventListener('click', () => {
    currentPage = 1;
    loadData();
    loadSummary();
  });

  document.getElementById('btn-add')?.addEventListener('click', openAddModal);

  document.getElementById('btn-search')?.addEventListener('click', () => {
    currentPage = 1;
    applyFilters();
  });

  document.getElementById('btn-reset')?.addEventListener('click', () => {
    document.getElementById('f-search').value = '';
    document.getElementById('f-type').value   = '';
    document.getElementById('f-active').value = '';
    currentPage = 1;
    currentFilters = {};
    loadData();
  });

  document.getElementById('f-search')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { currentPage = 1; applyFilters(); }
  });

  // Show/hide GUID field based on type selection
  document.getElementById('f-type-form')?.addEventListener('change', toggleGuidField);
});

function applyFilters() {
  currentFilters = {
    search:    document.getElementById('f-search')?.value.trim(),
    type:      document.getElementById('f-type')?.value,
    is_active: document.getElementById('f-active')?.value,
  };
  loadData();
}

/* ── Load & Render ─────────────────────────────────────── */

async function loadData() {
  showLoading(true);
  try {
    const result = await API.devices.list({ page: currentPage, limit: LIMIT, ...currentFilters });
    renderTable(result.data);
    renderPagination(result.pagination);
    updateInfo(result.pagination);
  } catch (err) {
    showToast(`Gagal memuat data: ${err.message}`, 'danger');
    renderTable([]);
  } finally {
    showLoading(false);
  }
}

async function loadSummary() {
  try {
    const result = await API.devices.summary();
    const map = { camera: 0, sensor: 0, aktuator: 0 };
    (result.data || []).forEach(r => { map[r.type] = r.total; });
    document.getElementById('sum-camera').textContent   = map.camera;
    document.getElementById('sum-sensor').textContent   = map.sensor;
    document.getElementById('sum-aktuator').textContent = map.aktuator;
  } catch (_) {}
}

function renderTable(data) {
  const tbody = document.getElementById('device-tbody');
  if (!data.length) {
    tbody.innerHTML = `
      <tr><td colspan="9">
        <div class="empty-state">
          <div class="empty-icon">📡</div>
          <div class="empty-title">Belum ada device</div>
          <div class="empty-sub">Klik "+ Tambah Device" untuk mendaftarkan perangkat baru.</div>
        </div>
      </td></tr>`;
    return;
  }
  const offset = (currentPage - 1) * LIMIT;
  tbody.innerHTML = data.map((d, i) => `
    <tr>
      <td style="color:var(--text-muted);font-size:.8rem">${offset + i + 1}</td>
      <td><code style="font-size:.82rem">${d.device_id}</code></td>
      <td style="font-weight:500">${d.name}</td>
      <td><span class="badge type-badge-${d.type}">${d.type}</span></td>
      <td style="color:var(--text-muted);font-size:.82rem">${d.location || '—'}</td>
      <td style="font-size:.82rem">${d.ip_address || '—'}</td>
      <td>
        ${d.is_active
          ? '<span class="badge badge-success">Aktif</span>'
          : '<span class="badge badge-secondary">Nonaktif</span>'}
      </td>
      <td>${renderControl(d)}</td>
      <td>
        <button class="action-btn btn-edit"   onclick="openEditModal('${d._id}')">✏️ Edit</button>
        <button class="action-btn btn-delete" onclick="openConfirm('${d._id}','${escHtml(d.device_id)}')">🗑️ Hapus</button>
      </td>
    </tr>`).join('');
}

function renderControl(d) {
  if (d.type !== 'aktuator') return '<span style="color:var(--text-muted);font-size:.78rem">—</span>';

  const statusMap = {
    on:      ['ctrl-status-on',      '● ON'],
    off:     ['ctrl-status-off',     '○ OFF'],
    unknown: ['ctrl-status-unknown', '? Unknown'],
  };
  const [cls, label] = statusMap[d.last_status] || statusMap.unknown;

  const isOn  = d.last_status === 'on';
  const isOff = d.last_status === 'off';

  return `
    <div class="ctrl-wrap">
      <span class="ctrl-status ${cls}">${label}</span>
      <button class="action-btn btn-ctrl-on  ${isOn  ? 'disabled' : ''}"
              onclick="controlDevice('${d._id}','on')"
              ${isOn  ? 'disabled' : ''}
              title="Nyalakan">▶ ON</button>
      <button class="action-btn btn-ctrl-off ${isOff ? 'disabled' : ''}"
              onclick="controlDevice('${d._id}','off')"
              ${isOff ? 'disabled' : ''}
              title="Matikan">■ OFF</button>
    </div>`;
}

/* ── Aktuator Control ───────────────────────────────────── */

async function controlDevice(id, action) {
  try {
    await API.devices.control(id, action);
    showToast(`Aktuator berhasil di-${action.toUpperCase()}`, 'success');
    loadData(); // refresh untuk tampilkan status terbaru
  } catch (err) {
    showToast(`Gagal kontrol aktuator: ${err.message}`, 'danger');
  }
}

/* ── Pagination ─────────────────────────────────────────── */

function renderPagination(p) {
  const bar = document.getElementById('paging-bar');
  const container = document.getElementById('pagination');
  if (!bar || !container || !p) return;

  if (!p.total) { bar.style.display = 'none'; return; }
  bar.style.display = 'flex';

  const { page, total_pages } = p;
  if (total_pages <= 1) { container.innerHTML = ''; return; }

  const pages = buildPageNumbers(page, total_pages);
  container.innerHTML = `
    <button class="pg-btn pg-nav" onclick="goPage(1)" ${page<=1?'disabled':''}>«</button>
    <button class="pg-btn pg-nav" onclick="goPage(${page-1})" ${page<=1?'disabled':''}>‹</button>
    ${pages.map(n => n==='…'
      ? `<span class="pg-btn" style="cursor:default;border:none">…</span>`
      : `<button class="pg-btn ${n===page?'active':''}" onclick="goPage(${n})">${n}</button>`
    ).join('')}
    <button class="pg-btn pg-nav" onclick="goPage(${page+1})" ${page>=total_pages?'disabled':''}>›</button>
    <button class="pg-btn pg-nav" onclick="goPage(${total_pages})" ${page>=total_pages?'disabled':''}>»</button>`;
}

function buildPageNumbers(current, total) {
  const pages = [];
  for (let i = 1; i <= total; i++) {
    if (i===1 || i===total || (i>=current-2 && i<=current+2)) pages.push(i);
    else if (pages[pages.length-1] !== '…') pages.push('…');
  }
  return pages;
}

function updateInfo(p) {
  const el = document.getElementById('page-info');
  if (!el || !p) return;
  if (!p.total) { el.textContent = 'Tidak ada data'; return; }
  const from = (p.page-1)*p.limit+1;
  const to   = Math.min(p.page*p.limit, p.total);
  el.textContent = `${from}–${to} dari ${p.total.toLocaleString()} device  •  Hal. ${p.page}/${p.total_pages}`;
}

function goPage(n) {
  currentPage = n;
  loadData();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ── Modal Form ─────────────────────────────────────────── */

function toggleGuidField() {
  const type = document.getElementById('f-type-form').value;
  document.getElementById('row-guid').style.display = type === 'aktuator' ? '' : 'none';
}

function openAddModal() {
  document.getElementById('modal-title').textContent  = 'Tambah Device';
  document.getElementById('f-id').value           = '';
  document.getElementById('f-device-id').value    = '';
  document.getElementById('f-name').value         = '';
  document.getElementById('f-type-form').value    = '';
  document.getElementById('f-guid').value         = '';
  document.getElementById('f-location').value     = '';
  document.getElementById('f-ip').value           = '';
  document.getElementById('f-description').value  = '';
  document.getElementById('f-metadata').value     = '';
  document.getElementById('f-is-active').checked  = true;
  document.getElementById('f-device-id').disabled = false;
  document.getElementById('row-guid').style.display = 'none';
  showModal('modal-form');
}

async function openEditModal(id) {
  try {
    showLoading(true);
    const result = await API.devices.getById(id);
    if (!result.success) throw new Error('Data tidak ditemukan');
    const d = result.data;

    document.getElementById('modal-title').textContent  = 'Edit Device';
    document.getElementById('f-id').value           = d._id;
    document.getElementById('f-device-id').value    = d.device_id;
    document.getElementById('f-name').value         = d.name;
    document.getElementById('f-type-form').value    = d.type;
    document.getElementById('f-guid').value         = d.guid || '';
    document.getElementById('f-location').value     = d.location  || '';
    document.getElementById('f-ip').value           = d.ip_address || '';
    document.getElementById('f-description').value  = d.description || '';
    document.getElementById('f-metadata').value     = d.metadata && Object.keys(d.metadata).length
      ? JSON.stringify(d.metadata, null, 2) : '';
    document.getElementById('f-is-active').checked  = d.is_active;
    document.getElementById('f-device-id').disabled = false;
    document.getElementById('row-guid').style.display = d.type === 'aktuator' ? '' : 'none';
    showModal('modal-form');
  } catch (err) {
    showToast(`Gagal memuat detail: ${err.message}`, 'danger');
  } finally {
    showLoading(false);
  }
}

function closeFormModal() { hideModal('modal-form'); }

async function saveDevice() {
  const id          = document.getElementById('f-id').value.trim();
  const device_id   = document.getElementById('f-device-id').value.trim();
  const name        = document.getElementById('f-name').value.trim();
  const type        = document.getElementById('f-type-form').value;
  const guid        = document.getElementById('f-guid').value.trim();
  const location    = document.getElementById('f-location').value.trim();
  const ip_address  = document.getElementById('f-ip').value.trim();
  const description = document.getElementById('f-description').value.trim();
  const is_active   = document.getElementById('f-is-active').checked;
  const metaRaw     = document.getElementById('f-metadata').value.trim();

  if (!device_id || !name || !type) {
    showToast('Device ID, Nama, dan Tipe wajib diisi', 'warning');
    return;
  }
  if (type === 'aktuator' && !guid) {
    showToast('GUID wajib diisi untuk tipe Aktuator', 'warning');
    return;
  }

  let metadata = {};
  if (metaRaw) {
    try { metadata = JSON.parse(metaRaw); }
    catch { showToast('Format Metadata bukan JSON yang valid', 'warning'); return; }
  }

  const payload = { device_id, name, type, guid, location, ip_address, description, is_active, metadata };

  const btn = document.getElementById('btn-save');
  btn.disabled = true;
  btn.textContent = 'Menyimpan…';

  try {
    if (id) {
      await API.devices.update(id, payload);
      showToast('Device berhasil diupdate', 'success');
    } else {
      await API.devices.create(payload);
      showToast('Device berhasil ditambahkan', 'success');
    }
    closeFormModal();
    loadData();
    loadSummary();
  } catch (err) {
    showToast(`Gagal menyimpan: ${err.message}`, 'danger');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Simpan';
  }
}

/* ── Modal Konfirmasi Hapus ─────────────────────────────── */

function openConfirm(id, deviceId) {
  deleteTargetId = id;
  document.getElementById('confirm-sub').textContent = `Device "${deviceId}" akan dihapus permanen.`;
  showModal('modal-confirm');
}

function closeConfirm() {
  deleteTargetId = null;
  hideModal('modal-confirm');
}

async function confirmDelete() {
  if (!deleteTargetId) return;
  const btn = document.getElementById('btn-confirm-delete');
  btn.disabled = true;
  btn.textContent = 'Menghapus…';
  try {
    await API.devices.delete(deleteTargetId);
    showToast('Device berhasil dihapus', 'success');
    closeConfirm();
    loadData();
    loadSummary();
  } catch (err) {
    showToast(`Gagal menghapus: ${err.message}`, 'danger');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Ya, Hapus';
  }
}

/* ── Helpers ────────────────────────────────────────────── */

function showModal(id)  { document.getElementById(id).classList.add('show'); }
function hideModal(id)  { document.getElementById(id).classList.remove('show'); }

function showLoading(show) {
  const el = document.getElementById('loading-overlay');
  if (el) el.style.display = show ? 'flex' : 'none';
}

function escHtml(str) {
  return String(str).replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

document.addEventListener('click', (e) => {
  if (e.target.id === 'modal-form')    closeFormModal();
  if (e.target.id === 'modal-confirm') closeConfirm();
});
