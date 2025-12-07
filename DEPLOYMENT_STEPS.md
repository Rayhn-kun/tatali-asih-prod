# Panduan Deployment Otomatis (Free Forever)

Aplikasi Anda telah berhasil di-push ke GitHub! 🎉
Sekarang, ikuti langkah-langkah mudah ini untuk membuat website Anda LIVE dan dapat diakses oleh semua orang secara GRATIS selamanya.

## 1. Setup Database (Sekali Saja)

Kita perlu tempat untuk menyimpan data user dan pesanan.
1.  Buka [Supabase](https://supabase.com/) atau [Neon](https://neon.tech/).
2.  Daftar akun gratis (Free Tier).
3.  Buat Project baru.
4.  Cari **Connection String** database Anda.
    *   Format: `postgres://user:password@host:port/database`
    *   Simpan ini, kita butuh di langkah berikutnya.

## 2. Aktifkan Backend (Render.com)

Backend adalah "otak" aplikasi Anda. Kita akan hosting di Render karena gratis dan mendukung Docker.

1.  Buka [Render Dashboard](https://dashboard.render.com/).
2.  Klik **New +** -> **Web Service**.
3.  Pilih **Build and deploy from a Git repository**.
4.  Pilih repo `tatali-asih-prod` yang baru saja kita push.
5.  Render akan otomatis mendeteksi `render.yaml` kita. Klik **Apply** atau **Create Web Service**.
6.  **PENTING**: Masukkan Environment Variables:
    *   `DATABASE_URL`: Masukkan link database dari Langkah 1.
    *   `JWT_SECRET`: Ketik sembarang kata sandi acak yang panjang (contoh: `kuncirahasia12345`).
7.  Tunggu sampai statusnya **Live**.
8.  Salin URL Backend Anda (misal: `https://tatali-asih-api.onrender.com`).

## 3. Aktifkan Frontend (GitHub Pages)

Frontend adalah "wajah" aplikasi yang dilihat pengunjung.

1.  Buka repository GitHub Anda: [https://github.com/Rayhn-kun/tatali-asih-prod](https://github.com/Rayhn-kun/tatali-asih-prod)
2.  Masuk ke **Settings** -> **Secrets and variables** -> **Actions**.
3.  Klik **New repository variable**:
    *   Name: `VITE_API_BASE_URL`
    *   Value: URL Backend dari Langkah 2 (tambahkan `/api` di belakangnya jika perlu, misal: `https://tatali-asih-api.onrender.com/api`).
4.  Masuk ke **Settings** -> **Pages**.
5.  Di bagian **Build and deployment**, pilih Source: **GitHub Actions**.
6.  Selesai! GitHub akan otomatis men-deploy website Anda.
    *   Cek tab **Actions** untuk melihat prosesnya.
    *   Jika sudah hijau, website Anda sudah online!

## Masalah Umum

*   **3D Model Tidak Muncul**: Pastikan file `model.glb` benar-benar ada di folder `frontend/egoQitl/public/assets/`. Kode sudah saya update untuk otomatis menyesuaikan path.
*   **Database Error**: Cek log di Render. Pastikan URL database benar.
