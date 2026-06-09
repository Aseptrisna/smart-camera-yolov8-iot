/* ============================================================
   Raw Images — Gallery View (terbaru ke terlama)
   ============================================================ */

const LIMIT = 16; // 4×4 grid

let currentPage = 1;
let currentFilters = {};

document.addEventListener('DOMContentLoaded', () => {
  loadData();

  document.getElementById('btn-search')?.addEventListener('click', () => {
    currentPage = 1;
    applyFilters();
  });

  document.getElementById('btn-reset')?.addEventListener('click', () => {
    ['f-filename', 'f-device', 'f-start', 'f-end'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    currentPage = 1;
    currentFilters = {};
    loadData();
  });

  document.getElementById('btn-refresh')?.addEventListener('click', () => {
    currentPage = 1;
    loadData();
  });

  document.getElementById('f-filename')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { currentPage = 1; applyFilters(); }
  });
  document.getElementById('f-device')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { currentPage = 1; applyFilters(); }
  });
});

function applyFilters() {
  currentFilters = {
    filename:   document.getElementById('f-filename')?.value.trim(),
    device_id:  document.getElementById('f-device')?.value.trim(),
    start_date: document.getElementById('f-start')?.value,
    end_date:   document.getElementById('f-end')?.value,
  };
  loadData();
}

async function loadData() {
  try {
    showLoading(true);
    const result = await API.rawImages.list({
      page:  currentPage,
      limit: LIMIT,
      sort:  'desc',        // terbaru ke terlama
      ...currentFilters,
    });
    renderGallery(result.data);
    renderPagination(result.pagination);
    updateInfo(result.pagination);
  } catch (err) {
    showToast(`Gagal memuat data: ${err.message}`, 'danger');
    renderGallery([]);
  } finally {
    showLoading(false);
  }
}

/* ── Render gallery ─────────────────────────────────────────── */

function renderGallery(data) {
  const grid = document.getElementById('gallery-grid');

  if (!data.length) {
    grid.innerHTML = `
      <div class="gallery-empty">
        <div class="ei">🖼️</div>
        <div class="et">Tidak ada gambar</div>
        <div class="es">Ubah filter atau tunggu data baru masuk.</div>
      </div>`;
    return;
  }

  grid.innerHTML = data.map(row => {
    const detailUrl = `detection-detail.html?raw_id=${row._id}`;
    const imgUrl    = row.filename ? API.rawImages.imageUrl(row.filename) : '';

    return `
      <a href="${detailUrl}" class="img-card">
        ${imgUrl
          ? `<img
               src="${imgUrl}"
               class="img-card-thumb"
               alt="${row.filename}"
               loading="lazy"
               onerror="this.outerHTML='<div class=img-card-thumb-placeholder>📷</div>'"
             >`
          : `<div class="img-card-thumb-placeholder">📷</div>`
        }
        <div class="img-card-body">
          <span class="img-card-badge">${statusBadge(row.status)}</span>
          <div class="img-card-filename" title="${row.filename}">${row.filename}</div>
          <div class="img-card-meta">
            <span>📷</span><span>${row.device_id}</span>
          </div>
          <div class="img-card-meta">
            <span>🕐</span><span>${formatDate(row.received_at)}</span>
          </div>
        </div>
      </a>`;
  }).join('');
}

/* ── Pagination ─────────────────────────────────────────────── */

function renderPagination(p) {
  const bar        = document.getElementById('paging-bar');
  const container  = document.getElementById('pagination');
  if (!bar || !container || !p) return;

  if (!p.total) { bar.style.display = 'none'; return; }
  bar.style.display = 'flex';

  const { page, total_pages } = p;

  if (total_pages <= 1) {
    container.innerHTML = '';
    return;
  }

  const pages = buildPageNumbers(page, total_pages);

  container.innerHTML = `
    <button class="pg-btn pg-nav" onclick="goPage(1)"       ${page <= 1 ? 'disabled' : ''} title="Halaman pertama">«</button>
    <button class="pg-btn pg-nav" onclick="goPage(${page - 1})" ${page <= 1 ? 'disabled' : ''} title="Sebelumnya">‹</button>
    ${pages.map(n =>
      n === '…'
        ? `<span class="pg-btn" style="cursor:default;border:none">…</span>`
        : `<button class="pg-btn ${n === page ? 'active' : ''}" onclick="goPage(${n})">${n}</button>`
    ).join('')}
    <button class="pg-btn pg-nav" onclick="goPage(${page + 1})" ${page >= total_pages ? 'disabled' : ''} title="Berikutnya">›</button>
    <button class="pg-btn pg-nav" onclick="goPage(${total_pages})" ${page >= total_pages ? 'disabled' : ''} title="Halaman terakhir">»</button>
  `;
}

function buildPageNumbers(current, total) {
  const pages = [];
  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || (i >= current - 2 && i <= current + 2)) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== '…') {
      pages.push('…');
    }
  }
  return pages;
}

function updateInfo(p) {
  const el = document.getElementById('page-info');
  if (!el || !p) return;
  if (!p.total) { el.textContent = 'Tidak ada data'; return; }
  const from = (p.page - 1) * p.limit + 1;
  const to   = Math.min(p.page * p.limit, p.total);
  el.textContent = `${from}–${to} dari ${p.total.toLocaleString()} gambar  •  Hal. ${p.page}/${p.total_pages}`;
}

function goPage(n) {
  currentPage = n;
  loadData();
  // scroll ke atas konten
  document.querySelector('.page-content')?.scrollTo({ top: 0, behavior: 'smooth' });
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showLoading(show) {
  const overlay = document.getElementById('loading-overlay');
  if (overlay) overlay.style.display = show ? 'flex' : 'none';
}
