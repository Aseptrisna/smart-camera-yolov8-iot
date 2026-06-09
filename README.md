# Smart Camera API

REST API backend untuk sistem deteksi objek berbasis **YOLOv8** dan **IoT**. API ini menerima data hasil deteksi dari kamera pintar, menyimpannya ke MongoDB, dan menyediakan endpoint untuk manajemen perangkat, visualisasi hasil deteksi, serta pengendalian aktuator melalui protokol **MQTT**.

## Teknologi

| Komponen | Teknologi |
|---|---|
| Runtime | Node.js (CommonJS) |
| Framework | Express.js |
| Database | MongoDB (Mongoose) |
| Protokol IoT | MQTT (aktuator) |
| Logging | Winston + Morgan |
| Dokumentasi | Swagger UI |
| Keamanan | Helmet, CORS |

## Struktur Direktori

```
api/
├── index.js                  # Entry point — bootstrap server
├── .env                      # Konfigurasi environment (tidak di-commit)
├── .env.example              # Template konfigurasi
├── package.json
├── logs/                     # Log file (auto-generated)
├── uploads/
│   └── detection/            # Gambar hasil deteksi (auto-generated)
└── src/
    ├── index.js              # Express app (middleware, route, error handler)
    ├── config/               # Konfigurasi terpusat dari .env
    ├── database/             # Koneksi MongoDB
    ├── logger/               # Konfigurasi Winston
    ├── middleware/           # Error handler global
    ├── model/                # Mongoose schema
    │   ├── device.model.js
    │   ├── detection_model.js
    │   └── raw_image.model.js
    ├── repository/           # Query layer ke MongoDB
    ├── service/              # Business logic
    │   ├── actuator.service.js   # Kontrol aktuator via MQTT
    │   ├── detection.service.js
    │   ├── device.service.js
    │   ├── dashboard.service.js
    │   └── raw_image.service.js
    ├── controller/           # Request handler
    ├── route/                # Definisi route Express
    └── swagger/              # Konfigurasi Swagger/OpenAPI
```

## Instalasi

**Prasyarat:** Node.js >= 18, MongoDB, broker MQTT

```bash
# Clone repository
git clone <repo-url>
cd api

# Install dependensi
npm install

# Salin file konfigurasi
cp .env.example .env

# Edit .env sesuai environment
nano .env
```

## Konfigurasi Environment

Salin `.env.example` ke `.env` lalu sesuaikan nilainya:

```env
# Aplikasi
NODE_ENV=development
PORT=3003
LOG_LEVEL=info

# MongoDB
MONGODB_URI=mongodb://localhost:27017/smart-camera

# Storage gambar deteksi
UPLOAD_DIR=uploads/detection

# Proxy gambar original (dari kamera)
IMAGE_BASE_URL=https://example.com/data

# CORS
CORS_ORIGIN=*

# Aktuator — MQTT Broker
ACTUATOR_MQTT_HOST=localhost
ACTUATOR_MQTT_PORT=1883
ACTUATOR_MQTT_USERNAME=user
ACTUATOR_MQTT_PASSWORD=password
ACTUATOR_MQTT_TOPIC=Aktuator
```

## Menjalankan Server

```bash
# Mode produksi
npm start

# Mode development (hot-reload dengan nodemon)
npm run dev
```

Server akan berjalan di `http://localhost:3003` secara default.

## API Endpoints

### Health Check

| Method | Endpoint | Deskripsi |
|---|---|---|
| GET | `/health` | Status server |

### Perangkat (Devices)

| Method | Endpoint | Deskripsi |
|---|---|---|
| GET | `/api/devices` | Daftar semua perangkat |
| GET | `/api/devices/summary` | Ringkasan statistik perangkat |
| GET | `/api/devices/:id` | Detail perangkat |
| POST | `/api/devices` | Tambah perangkat baru |
| PUT | `/api/devices/:id` | Update perangkat |
| DELETE | `/api/devices/:id` | Hapus perangkat |
| POST | `/api/devices/:id/control` | Kirim perintah ke aktuator (on/off) |

Tipe perangkat yang didukung: `camera`, `sensor`, `aktuator`

### Gambar Mentah (Raw Images)

| Method | Endpoint | Deskripsi |
|---|---|---|
| GET | `/api/raw-images` | Daftar semua gambar mentah |
| GET | `/api/raw-images/:id` | Detail gambar mentah |
| GET | `/api/raw-images/image/:filename` | Ambil file gambar mentah |

### Hasil Deteksi (Detections)

| Method | Endpoint | Deskripsi |
|---|---|---|
| GET | `/api/detections` | Daftar hasil deteksi |
| GET | `/api/detections/:id` | Detail hasil deteksi |
| GET | `/api/detected-images/:filename` | Ambil gambar hasil anotasi YOLOv8 |

### Dashboard

| Method | Endpoint | Deskripsi |
|---|---|---|
| GET | `/api/dashboard/summary` | Ringkasan total deteksi & perangkat |
| GET | `/api/dashboard/devices` | Statistik per perangkat |
| GET | `/api/dashboard/object-stats` | Statistik per kelas objek |
| GET | `/api/dashboard/daily-stats` | Statistik deteksi harian |

### Dokumentasi & UI

| Endpoint | Deskripsi |
|---|---|
| `/api-docs` | Swagger UI interaktif |
| `/api-docs.json` | OpenAPI spec (JSON) |
| `/web` | Dashboard website (static) |

## Model Data

### Device

```json
{
  "device_id": "CAM-001",
  "name": "Kamera Pintu Utama",
  "type": "camera",
  "location": "Gedung A Lt. 1",
  "ip_address": "192.168.1.10",
  "is_active": true,
  "guid": "",
  "last_status": "unknown"
}
```

### Detection

```json
{
  "raw_image_id": "abc123",
  "filename": "det_20240601_120000.jpg",
  "device_id": "CAM-001",
  "total_objects": 2,
  "objects": [
    {
      "class_name": "person",
      "confidence": 0.92,
      "bbox": { "x1": 10, "y1": 20, "x2": 100, "y2": 200 }
    }
  ],
  "detected_at": "2024-06-01T12:00:00.000Z"
}
```

## Kontrol Aktuator

Endpoint `POST /api/devices/:id/control` mengirim perintah ke aktuator melalui MQTT.

**Request body:**
```json
{ "action": "on" }
```

Payload MQTT yang dikirim: `{guid}#{state}` (contoh: `abc-123#1`)

## Logging

Log disimpan di direktori `logs/` menggunakan Winston dengan level:
- `error` — kesalahan kritis
- `warn` — peringatan
- `info` — informasi umum
- `http` — log request HTTP (Morgan)
- `debug` — debug detail (aktif jika `LOG_LEVEL=debug`)

## Arsitektur Sistem

```
[Kamera / YOLOv8 Worker]
        |
        | (simpan hasil deteksi ke MongoDB)
        |
   [MongoDB]
        |
        v
  [Smart Camera API]  <── REST ──  [Dashboard Web / Client]
        |
        | (MQTT publish)
        v
  [MQTT Broker]  ──>  [Aktuator IoT]
```
