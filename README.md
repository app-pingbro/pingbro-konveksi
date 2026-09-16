# PING BRO — Konveksi & Sablon

Aplikasi manajemen order, produksi (SPK), dan keuangan untuk usaha konveksi & sablon.

- **Frontend** — situs statis ini, di-*host* di GitHub Pages
- **Backend** — Google Apps Script sebagai REST API, database Google Sheets

## Isi folder

```
index.html            Halaman aplikasi (SPA satu halaman)
.nojekyll             Menonaktifkan pemrosesan Jekyll di GitHub Pages
logo-share.png        Logo persegi untuk kartu preview saat tautan dibagikan
og-image.png          Spanduk lebar (alternatif kartu preview)
css/style.css         Seluruh tampilan (design system + dark mode)
js/config.js          ← SATU-SATUNYA berkas yang wajib Anda edit
js/api.js             Lapisan fetch ke Apps Script + token sesi
js/app.js             State, router, utilitas UI, layar PIN
js/pages.js           Dashboard, Order, Detail, SPK, Invoice, Notifikasi
js/forms.js           Form Order, Ubah Order, Pengaturan, Data Customer, Rumus Material
js/material.js        Rumus & perhitungan kebutuhan bahan
js/cetak.js           SPK & Invoice menjadi gambar JPG siap cetak
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
- SPK & Invoice dibuat sebagai **JPG** langsung di browser — tidak ada berkas PDF
  yang dibuat maupun disimpan ke Google Drive.
- Kartu preview tautan memakai `logo-share.png` (logo kotak di kiri, seperti
  kartu ringkas WhatsApp). Agar logonya benar-benar muncul, **alamat gambar harus
  alamat penuh** — buka **Pengaturan → Preview Tautan → Salin Baris Meta**, tempel
  ke `index.html` menggantikan empat baris bertanda ⤵, lalu `git push`.
- Setelah Logo Perusahaan diganti, buat ulang gambarnya lewat
  **Pengaturan → Preview Tautan**, timpa berkasnya, lalu `git push`.
- **Rincian Material** menghitung kebutuhan bahan otomatis dari Rincian Item.
  Rumusnya tersimpan di database dan diubah lewat **Pengaturan → Rumus Material** —
  tidak perlu menyentuh kode. Backend butuh sheet baru: jalankan
  `migrasiMaterial()` sekali di Apps Script.
