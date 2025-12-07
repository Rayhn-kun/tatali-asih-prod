# Panduan Deployment Langkah demi Langkah

Berikut adalah langkah-langkah lengkap untuk men-deploy aplikasi Tatali Asih ke produksi menggunakan Render (Backend) dan GitHub Pages (Frontend).

## 1. Persiapan GitHub Repository

Karena Anda belum menghubungkan folder ini ke GitHub, lakukan langkah ini terlebih dahulu:

1.  Buka [GitHub](https://github.com) dan buat repository baru (misalnya: `tatali-asih-prod`).
2.  Jangan centang "Add a README file" (biarkan kosong).
3.  Jalankan perintah berikut di terminal VS Code (terminal ini):

```bash
# Ganti URL_REPO_ANDA dengan URL repository baru Anda
# Contoh: https://github.com/username/tatali-asih-prod.git
git remote add origin URL_REPO_ANDA
git branch -M master
git push -u origin master
```

## 2. Setup Database (Supabase / Neon)

Anda memerlukan database PostgreSQL yang dapat diakses dari internet.

1.  Daftar di [Supabase](https://supabase.com/) atau [Neon](https://neon.tech/).
2.  Buat project baru.
3.  Salin **Connection String** (URI).
    *   Supabase: Settings -> Database -> Connection string -> URI (Mode: Session/Transaction).
    *   Contoh format: `postgres://postgres.xxxx:password@aws-0-region.pooler.supabase.com:6543/postgres`

## 3. Deploy Backend ke Render.com

1.  Daftar/Login ke [Render Dashboard](https://dashboard.render.com/).
2.  Klik **New +** -> **Web Service**.
3.  Pilih **Build and deploy from a Git repository**.
4.  Connect akun GitHub Anda dan pilih repository `tatali-asih-prod` yang baru dibuat.
5.  Render akan mendeteksi `render.yaml` di dalam repository.
    *   Jika diminta konfirmasi, klik **Apply**.
    *   Jika tidak, pilih Runtime: **Docker**.
6.  Konfigurasi **Environment Variables**:
    *   `DATABASE_URL`: Paste connection string dari langkah 2.
    *   `JWT_SECRET`: Isi dengan string acak (contoh: `rahasia_super_aman_123`).
    *   `PORT`: `8000` (biasanya sudah otomatis dari render.yaml).
7.  Klik **Create Web Service**.
8.  Tunggu proses build selesai. Setelah sukses, salin URL backend Anda (misal: `https://tatali-asih-api.onrender.com`).

## 4. Konfigurasi Frontend untuk GitHub Pages

1.  Kembali ke halaman repository GitHub Anda.
2.  Masuk ke **Settings** -> **Secrets and variables** -> **Actions**.
3.  Klik **New repository variable**:
    *   **Name**: `VITE_API_BASE_URL`
    *   **Value**: URL Backend dari Render (tanpa slash di akhir, misal: `https://tatali-asih-api.onrender.com/api`).
    *   *Catatan: Pastikan tambahkan `/api` jika backend Anda melayani rute di bawah `/api`.*
4.  Masuk ke **Settings** -> **Pages**.
5.  Pada bagian **Build and deployment**, pilih **Source** -> **GitHub Actions**.
6.  GitHub Actions akan otomatis berjalan (karena ada file `.github/workflows/deploy-frontend-vite.yml`).
    *   Cek tab **Actions** di GitHub untuk melihat progress.
    *   Jika gagal pertama kali, coba "Re-run jobs" setelah variabel `VITE_API_BASE_URL` diset.

## 5. Verifikasi

1.  Buka URL Frontend yang diberikan oleh GitHub Pages.
2.  Coba fitur Login/Register.
3.  Cek apakah data tersimpan di database.

---

### Troubleshooting

*   **Error 3D Model**: Pastikan file `model.glb` ada di folder `frontend/egoQitl/public/assets/`. Kode sudah disesuaikan untuk memuat dari path yang benar di produksi.
*   **CORS Error**: Jika frontend tidak bisa akses backend, pastikan backend mengizinkan origin frontend. (Saat ini backend dikonfigurasi `cors()` default yang mengizinkan semua, namun untuk keamanan lebih baik dibatasi nanti).
*   **Database Error**: Pastikan URL database benar dan database sudah di-migrate. `render.yaml` sudah menyertakan perintah migrate otomatis, tapi jika gagal, Anda mungkin perlu menjalankannya manual atau cek log Render.
