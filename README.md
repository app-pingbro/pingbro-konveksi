# PING BRO — Konveksi & Sablon

Aplikasi manajemen order, produksi (SPK), dan keuangan untuk usaha konveksi & sablon.

- **Frontend** — situs statis ini, di-*host* di GitHub Pages
- **Backend** — Google Apps Script sebagai REST API, database Google Sheets

## Isi folder

```
index.html            Halaman aplikasi (SPA satu halaman)
.nojekyll             Menonaktifkan pemrosesan Jekyll di GitHub Pages
css/style.css         Seluruh tampilan (design system + dark mode)
js/config.js          ← SATU-SATUNYA berkas yang wajib Anda edit
js/api.js             Lapisan fetch ke Apps Script + token sesi
js/app.js             State, router, utilitas UI, layar PIN
js/pages.js           Dashboard, Order, Detail, SPK, Invoice, Notifikasi
js/forms.js           Form Order, Ubah Order, Pengaturan
```

## Cara memasang

Lihat **PANDUAN-INSTALASI.md** — langkah demi langkah dari nol, termasuk memasang
backend di Apps Script dan mengunggah folder ini ke GitHub Pages.

Ringkasnya:

1. Pasang `Kode.gs` di Google Apps Script → jalankan `setupAppEnvironment()` **sekali**
2. Deploy sebagai Web App (Execute as **Me**, access **Anyone**) → salin URL `/exec`
3. Tempel URL itu ke `GAS_URL` di `js/config.js`
4. Unggah folder ini ke GitHub → aktifkan GitHub Pages
5. Buka situsnya, masukkan PIN (bawaan: `112233`), lalu **segera ganti PIN**
   di **Pengaturan → Keamanan**

## Catatan

- `index.html` **harus** berada di root repository, bukan di dalam subfolder.
- Berkas backend (`Kode.gs`) **tidak** diunggah ke repository ini.
- Repository wajib **Public** agar GitHub Pages gratis dapat dipakai.
