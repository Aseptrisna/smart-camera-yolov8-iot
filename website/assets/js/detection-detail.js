/* ============================================================
   Detection Detail Page — Smart Camera
   ============================================================ */

document.addEventListener('DOMContentLoaded', async () => {
  const id = getQueryParam('id');
  if (!id) {
    document.getElementById('content').innerHTML = `
      <div class="empty-state py-5">
        <div class="empty-icon">❌</div>
        <div class="empty-title">ID deteksi tidak ditemukan di URL</div>
        <a href="../pages/detections.html" class="btn btn-primary btn-sm mt-3">Kembali</a>
      </div>`;
    return;
  }

  try {
    document.getElementById('loading-overlay').style.display = 'flex';
    const result = await API.detections.getById(id);
    if (!result.success || !result.data) throw new Error('Data tidak ditemukan');
    renderDetail(result.data);
  } catch (err) {
    document.getElementById('content').innerHTML = `
      <div class="empty-state py-5">
        <div class="empty-icon">⚠️</div>
        <div class="empty-title">Gagal memuat detail</div>
        <div class="empty-sub">${err.message}</div>
        <a href="../pages/detections.html" class="btn btn-primary btn-sm mt-3">Kembali</a>
      </div>`;
  } finally {
    document.getElementById('loading-overlay').style.display = 'none';
  }
});

function renderDetail({ raw_image, detection, objects, image_original, image_detection }) {
  // Breadcrumb / title
  const titleEl = document.getElementById('detail-filename');
  if (titleEl) titleEl.textContent = detection.filename;

  // Meta info
  setText('meta-device',   detection.device_id);
  setText('meta-detected', formatDate(detection.detected_at));
  setText('meta-objects',  detection.total_objects);
  setText('meta-raw-id',   detection.raw_image_id);

  // Images
  const imgOriginal = document.getElementById('img-original');
  const imgDetected = document.getElementById('img-detected');

  if (imgOriginal) {
    const rawFilename = raw_image?.filename;
    imgOriginal.src = rawFilename ? API.rawImages.imageUrl(rawFilename) : '';
    imgOriginal.onerror = () => { imgOriginal.src = ''; imgOriginal.alt = 'Gambar tidak tersedia'; };
  }

  if (imgDetected) {
    const detFilename = image_detection
      ? image_detection.split('/').pop().split('\\').pop()
      : null;
    if (detFilename) {
      imgDetected.src = API.detections.imageUrl(detFilename);
    } else {
      imgDetected.src = '';
      imgDetected.alt = 'Gambar deteksi tidak tersedia';
    }
    imgDetected.onerror = () => { imgDetected.alt = 'Gambar deteksi tidak tersedia'; };
  }

  // Objects list
  const objectsList = document.getElementById('objects-list');
  if (objectsList) {
    if (!objects.length) {
      objectsList.innerHTML = `<li class="text-muted py-3 text-center">Tidak ada objek terdeteksi</li>`;
    } else {
      objectsList.innerHTML = objects.map((obj, i) => `
        <li class="object-item">
          <span class="fw-bold" style="min-width:20px">${i + 1}</span>
          <span class="flex-grow-1">
            <span class="badge badge-primary me-1">${obj.class_name}</span>
          </span>
          <div class="conf-bar-wrap" style="width:120px">
            <div class="conf-bar" style="width:${Math.round(obj.confidence * 100)}%"></div>
          </div>
          <span class="text-muted" style="min-width:40px;text-align:right">${Math.round(obj.confidence * 100)}%</span>
        </li>
      `).join('');
    }
  }

  // BBox table
  const bboxBody = document.getElementById('bbox-table-body');
  if (bboxBody && objects.length) {
    bboxBody.innerHTML = objects.map((obj, i) => `
      <tr>
        <td>${i + 1}</td>
        <td><span class="badge badge-primary">${obj.class_name}</span></td>
        <td>${Math.round(obj.confidence * 100)}%</td>
        <td>${Math.round(obj.bbox.x1)}</td>
        <td>${Math.round(obj.bbox.y1)}</td>
        <td>${Math.round(obj.bbox.x2)}</td>
        <td>${Math.round(obj.bbox.y2)}</td>
      </tr>
    `).join('');
  }

  // Show content
  document.getElementById('content').style.display = 'block';
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val ?? '—';
}
