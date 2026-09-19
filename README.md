# PING BRO — Konveksi & Sablon

Aplikasi manajemen order, produksi (SPK), dan keuangan untuk usaha konveksi & sablon.

| Bagian | Tempat |
|---|---|
| **Kode sumber** | GitHub (repository ini) |
| **Tampilan (frontend)** | Vercel — situs statis |
| **Database & Login** | Supabase — PostgreSQL + Google Login + RLS |
| **Mockup (gambar)** | Google Drive, lewat Google Apps Script |

---

## Isi folder

```
index.html            Halaman aplikasi (SPA satu halaman)
vercel.json           Pengaturan build & header keamanan untuk Vercel
.gitignore            Daftar berkas yang TIDAK boleh masuk GitHub
scripts/
  buat-config.sh      Membuat js/config.js otomatis saat deploy
logo-share.png        Logo persegi untuk kartu preview saat tautan dibagikan
og-image.png          Spanduk lebar (alternatif kartu preview)
css/style.css         Seluruh tampilan (design system + dark mode)
js/api.js             Lapisan fetch ke server + token sesi
js/app.js             State, router, utilitas UI, layar login
js/pages.js           Dashboard, Order, Detail, SPK, Invoice, Notifikasi
js/forms.js           Form Order, Ubah Order, Pengaturan, Data Customer, Rumus Material
js/material.js        Rumus & perhitungan kebutuhan bahan
js/cetak.js           SPK & Invoice menjadi gambar JPG siap cetak
```

### ⚠️ `js/config.js` TIDAK ADA di daftar ini — dan memang begitu seharusnya

Dulu, waktu memakai GitHub Pages, `js/config.js` adalah satu-satunya berkas yang
wajib Anda edit sendiri. **Sekarang tidak lagi.**

Berkas itu **dibuat otomatis oleh Vercel** setiap kali deploy, isinya diambil
dari Environment Variables. Tujuannya satu: **tidak ada satu pun alamat server
atau kunci yang tersimpan di GitHub.**

Kalau Anda melihat `js/config.js` muncul di daftar berkas GitHub, itu **masalah
keamanan** — keluarkan dengan:

```bash
git rm --cached js/config.js
git commit -m "Keluarkan config.js dari repo"
git push
```

> Perintah di atas menjawab `fatal: pathspec 'js/config.js' did not match any files`?
> **Bagus.** Artinya berkas itu memang tidak pernah masuk repo. Tidak ada yang
> perlu diperbaiki — lanjut saja.

---

## Yang wajib Anda isi — bukan di kode, tapi di Vercel

**Vercel → Settings → Environment Variables:**

| Key | Contoh isi | Keterangan |
|---|---|---|
| `SUMBER_DATA` | `gas` | `gas` = Google Sheets · `supabase` = PostgreSQL |
| `GAS_URL` | `https://script.google.com/macros/s/AKfy…/exec` | Alamat Apps Script |
| `SUPABASE_URL` | `https://abcdefgh.supabase.co` | Supabase → Settings → API |
| `SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1…` | Kunci **anon public** |

> 🔴 **`service_role` key JANGAN pernah dimasukkan ke sini.** Kunci itu menembus
> seluruh RLS. `scripts/buat-config.sh` akan **menggagalkan deploy** kalau kunci
> itu sampai terdeteksi.

Setelah mengubah Environment Variable, **wajib Redeploy** —
nilainya hanya dibaca saat build.

---

## Build Settings di Vercel

| Kolom | Isi |
|---|---|
| Framework Preset | `Other` |
| Build Command | `bash scripts/buat-config.sh` |
| Output Directory | `.` |
| Install Command | *(kosong)* |

Biasanya terisi otomatis dari `vercel.json`. Tetap periksa.

---

## Cara memasang dari nol

Lihat **`PANDUAN-INSTALASI-SUPABASE.md`** — langkah demi langkah:
GitHub → Supabase → Google Login → Vercel → Google Drive → uji coba.

---

## Saklar aman

| Mau apa | Caranya | Lama |
|---|---|---|
| Pindah ke Supabase | `SUMBER_DATA` = `supabase` → **Redeploy** | ±2 menit |
| **Mundur ke Google Sheets** | `SUMBER_DATA` = `gas` → **Redeploy** | ±2 menit |

Seluruh aplikasi (7.383 baris) menghubungi server **hanya lewat `js/api.js`**
(148 baris). Itu sebabnya perpindahan ini bisa dibalik semudah itu.

---

## Catatan

- `index.html` **harus** berada di root repository, bukan di dalam subfolder.
- Berkas backend (`Kode.gs`) **tidak** diunggah ke repository ini.
- Repository boleh **Private** — Vercel tetap bisa membacanya.
- `.nojekyll` sudah tidak diperlukan di Vercel (hanya untuk GitHub Pages),
  tapi aman kalau tetap ada.
- SPK & Invoice dibuat sebagai **JPG** langsung di browser — tidak ada berkas
  PDF yang dibuat maupun disimpan ke Google Drive.
