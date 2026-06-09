/* ============================================================
   Dashboard Page — Smart Camera
   ============================================================ */

let dailyChart, objectChart, deviceChart;

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('btn-refresh')?.addEventListener('click', loadDashboard);
  loadDashboard();
});

async function loadDashboard() {
  try {
    showPageLoading(true);
    const [summary, daily, objectStats, devices] = await Promise.all([
      API.dashboard.summary(),
      API.dashboard.dailyStats(7),
      API.dashboard.objectStats(),
      API.dashboard.devices(),
    ]);

    renderSummary(summary.data);
    renderDailyChart(daily.data);
    renderObjectChart(objectStats.data);
    renderDeviceChart(devices.data);
    renderDeviceTable(devices.data);
  } catch (err) {
    showToast(`Gagal memuat data: ${err.message}`, 'danger');
    console.error(err);
  } finally {
    showPageLoading(false);
  }
}

function renderSummary(d) {
  setText('stat-total-images',  d.total_raw_images    ?? 0);
  setText('stat-total-detections', d.total_detections ?? 0);
  setText('stat-total-objects', d.total_detected_objects ?? 0);
  setText('stat-active-devices', d.active_devices     ?? 0);
  setText('stat-today-images',  d.today_images        ?? 0);
  setText('stat-today-detections', d.today_detections ?? 0);
}

function renderDailyChart(data) {
  const ctx = document.getElementById('chart-daily')?.getContext('2d');
  if (!ctx) return;
  if (dailyChart) dailyChart.destroy();
  dailyChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: data.map(r => r.date),
      datasets: [{
        label: 'Deteksi',
        data: data.map(r => r.count),
        backgroundColor: 'rgba(37,99,235,.7)',
        borderColor: '#2563eb',
        borderWidth: 1,
        borderRadius: 4,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, ticks: { precision: 0 }, grid: { color: '#f1f5f9' } },
        x: { grid: { display: false } },
      },
    },
  });
}

function renderObjectChart(data) {
  const ctx = document.getElementById('chart-objects')?.getContext('2d');
  if (!ctx) return;
  if (objectChart) objectChart.destroy();
  const top10 = data.slice(0, 10);
  const colors = [
    '#2563eb','#16a34a','#d97706','#dc2626','#7c3aed',
    '#0891b2','#9333ea','#c2410c','#15803d','#1d4ed8',
  ];
  objectChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: top10.map(r => r.class_name),
      datasets: [{
        data: top10.map(r => r.total),
        backgroundColor: colors.slice(0, top10.length),
        borderWidth: 2,
        borderColor: '#fff',
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'right', labels: { boxWidth: 12, font: { size: 11 } } },
      },
      cutout: '60%',
    },
  });
}

function renderDeviceChart(data) {
  const ctx = document.getElementById('chart-devices')?.getContext('2d');
  if (!ctx) return;
  if (deviceChart) deviceChart.destroy();
  deviceChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: data.map(r => r.device_id),
      datasets: [
        {
          label: 'Total Gambar',
          data: data.map(r => r.total_images),
          backgroundColor: 'rgba(37,99,235,.6)',
          borderRadius: 4,
        },
        {
          label: 'Total Deteksi',
          data: data.map(r => r.total_detections),
          backgroundColor: 'rgba(22,163,74,.6)',
          borderRadius: 4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { labels: { font: { size: 11 } } } },
      scales: {
        y: { beginAtZero: true, ticks: { precision: 0 }, grid: { color: '#f1f5f9' } },
        x: { grid: { display: false } },
      },
    },
  });
}

function renderDeviceTable(data) {
  const tbody = document.getElementById('device-table-body');
  if (!tbody) return;
  if (!data.length) {
    tbody.innerHTML = `<tr><td colspan="3"><div class="empty-state"><div class="empty-icon">📷</div><div class="empty-title">Belum ada data</div></div></td></tr>`;
    return;
  }
  tbody.innerHTML = data.map((d, i) => `
    <tr>
      <td>${i + 1}</td>
      <td><code>${d.device_id}</code></td>
      <td>${d.total_images.toLocaleString()}</td>
      <td>${d.total_detections.toLocaleString()}</td>
    </tr>
  `).join('');
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = Number(val).toLocaleString();
}

function showPageLoading(show) {
  const el = document.getElementById('page-loading');
  if (el) el.style.display = show ? 'flex' : 'none';
}
