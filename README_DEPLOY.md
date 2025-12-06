# 🚀 Tatali Asih — Production Deployment Guide

## 📦 Persiapan
Pastikan server sudah terinstall:
- Docker
- Docker Compose

## 🧭 Struktur Utama
- `apps/api` — API Express + Prisma (backend)
- `frontend/egoQitl` — Frontend React (sudah siap build)
- `infra/nginx` — Reverse proxy config
- `docker-compose.yml` — Orkestrasi layanan
- `backend/prisma` — Skema database
- `backend/seed` — Script seed data produk

## 🐳 Jalankan Proyek
```bash
# 1. Masuk ke folder
cd tatali-asih-prod

# 2. (Opsional) salin dan sesuaikan .env
#    contoh: cp .env.example .env

# 3. Build dan jalankan semua service
docker compose up -d --build

# 4. Akses:
#    Frontend  -> http://localhost/
#    API       -> http://localhost:8000/
#    Swagger   -> http://localhost/api/docs (jika tidak dihapus)
```

## 🧹 Catatan
- Tidak ada `node_modules` — container akan install saat build.
- Database MySQL dijalankan otomatis di dalam docker-compose.
- Prisma migrate + seed dijalankan oleh entrypoint API.
- Nginx menjadi reverse proxy utama.

## 🛡️ Tips Produksi
- Gunakan HTTPS (bisa integrasi Let's Encrypt / Certbot).
- Ganti JWT_SECRET di file `.env` dengan nilai yang kuat.
- Buat user admin manual pertama jika perlu.

## ☁️ Deploy Gratis (Cloud)

### 1. Persiapan Database (Supabase / Neon)
1. Buat akun di [Supabase](https://supabase.com/) atau [Neon](https://neon.tech/).
2. Buat project baru.
3. Salin **Connection String** (URI) database.
   - Format: `postgres://user:password@host:port/database`
   - Jika menggunakan Supabase, pastikan pilih mode "Session" (port 5432) atau "Transaction" (port 6543).

### 2. Backend (Render.com)
1. Buat akun di [Render](https://render.com/).
2. Buat **New Web Service** -> Connect akun GitHub -> Pilih repo ini.
3. Render akan mendeteksi `render.yaml` secara otomatis jika ada, atau pilih "Docker" runtime.
4. **Environment Variables**:
   - `DATABASE_URL`: Masukkan Connection String dari langkah 1.
   - `JWT_SECRET`: Masukkan string acak yang aman.
5. Deploy! Salin URL backend (contoh: `https://tatali-api.onrender.com`).

### 3. Frontend (GitHub Pages)
> **⚠️ PENTING**: Konfigurasi default mengasumsikan nama repository GitHub Anda adalah `tatali-asih-prod`. Jika Anda menggunakan nama lain, silakan ubah nilai `base` di file `frontend/egoQitl/vite.config.ts` sebelum push.

1. Di repo GitHub, masuk ke **Settings** -> **Secrets and variables** -> **Actions**.
2. Buat **New Repository Variable**:
   - Name: `VITE_API_BASE_URL`
   - Value: URL Backend dari Render (tanpa slash akhir, misal: `https://tatali-api.onrender.com/api`).
3. Masuk ke **Settings** -> **Pages**.
4. Build and deployment source: Pilih **GitHub Actions**.
5. Push kode ke branch `main`. Action akan berjalan otomatis dan men-deploy frontend.

---
✨ Dibangun otomatis berdasarkan percakapan pengembanganmu.

