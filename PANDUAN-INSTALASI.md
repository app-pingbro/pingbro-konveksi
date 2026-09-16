# PANDUAN INSTALASI — PING BRO Konveksi & Sablon
### Backend di Google Apps Script · Frontend di GitHub Pages

Panduan ini ditulis untuk yang **belum pernah memakai Git atau GitHub sama sekali**.
Kerjakan berurutan, jangan melompat. Setiap tahap ada cara memastikan hasilnya benar
sebelum lanjut.

Total waktu: sekitar 30–45 menit untuk pemasangan pertama.

---

## Daftar Isi

- [BAGIAN A — Backend (Google Apps Script)](#bagian-a--backend-google-apps-script)
- [BAGIAN B — Frontend (GitHub Pages)](#bagian-b--frontend-github-pages)
- [BAGIAN C — Uji Coba](#bagian-c--uji-coba)
- [BAGIAN D — Cara Memperbarui](#bagian-d--cara-memperbarui)
- [Troubleshooting](#troubleshooting)
- [Glosarium](#glosarium)

---

# BAGIAN A — Backend (Google Apps Script)

## A1. Buat proyek Apps Script

1. Buka **https://script.google.com**
2. Klik **New project** (Proyek baru)
3. Klik nama proyek di kiri atas, ganti menjadi: `PINGBRO API`

## A2. Tempel kode backend

1. Di panel kiri, klik berkas **`Code.gs`**
2. **Hapus seluruh isinya** (Ctrl+A lalu Delete)
3. Buka berkas **`Kode.gs`** yang saya kirimkan, salin **seluruh** isinya
4. Tempel ke editor Apps Script
5. Tekan **Ctrl+S** untuk menyimpan

> Berkas `appsscript.json` bersifat opsional. Kalau ingin memakainya:
> ikon ⚙️ **Project Settings** → centang *Show "appsscript.json" manifest file* →
> kembali ke Editor → klik `appsscript.json` → ganti isinya.

## A3. Jalankan setup — HANYA SEKALI

1. Di bar atas editor, pada dropdown fungsi, pilih **`setupAppEnvironment`**
2. Klik **▶ Run**
3. Muncul jendela izin:
   - **Review permissions** → pilih akun Google Anda
   - Muncul "Google hasn't verified this app" → klik **Advanced** →
     **Go to PINGBRO API (unsafe)** → **Allow**

   > Peringatan ini normal untuk skrip buatan sendiri yang belum diverifikasi Google.
   > Skrip ini hanya mengakses Drive & Sheets milik Anda sendiri.

4. Tunggu sampai selesai, lalu buka **Execution log** di bawah editor.

**Yang harus terlihat di log:**

```
✅ SETUP PINGBRO BERHASIL
📁 Folder Drive : https://drive.google.com/...
📊 Spreadsheet  : https://docs.google.com/...
🔑 PIN Akses    : 112233   ← GANTI di menu Pengaturan!
```

5. Buka Google Drive Anda — folder **PINGBRO** sudah terbuat, berisi spreadsheet
   **DB_PINGBRO** dengan sheet: Customer, Order, Order_Item, Master_Harga, SPK,
   Invoice, Pembayaran, AppConfig.

> ⚠️ **Jangan jalankan `setupAppEnvironment()` lebih dari sekali.** Kalau terlanjur,
> hapus folder & spreadsheet duplikatnya di Drive, lalu jalankan ulang satu kali.

## A4. Deploy sebagai Web App

1. Klik **Deploy** (kanan atas) → **New deployment**
2. Klik ikon ⚙️ di sebelah "Select type" → pilih **Web app**
3. Isi:

   | Kolom | Nilai |
   |---|---|
   | Description | `PINGBRO API v1` |
   | Execute as | **Me (email Anda)** |
   | Who has access | **Anyone** |

   > **"Anyone" itu aman di sini** karena backend menolak setiap permintaan yang
   > tidak membawa token hasil login PIN. Tanpa "Anyone", situs GitHub Pages Anda
   > tidak akan bisa menghubungi backend sama sekali.

4. Klik **Deploy** → **Authorize access** bila diminta
5. **Salin "Web app URL"** — bentuknya:

   ```
   https://script.google.com/macros/s/AKfycb.....................TfQ/exec
   ```

6. **Simpan URL ini** di Notepad. Ini yang akan dipakai di Bagian B.

> 💡 Uji cepat: tempel URL itu di tab browser baru lalu tambahkan `?action=ping`
> di belakangnya. Yang muncul harus teks JSON berisi `"success":true`.
> Kalau yang muncul halaman login Google atau error, ulangi langkah A4 dan
> pastikan **Who has access = Anyone**.

---

# BAGIAN B — Frontend (GitHub Pages)

## B1. Pasang Git di komputer

| Sistem | Cara |
|---|---|
| **Windows** | Unduh di **https://git-scm.com/download/win**, pasang dengan pengaturan bawaan (Next terus) |
| **Mac** | Buka **Terminal**, ketik `git --version` — macOS akan menawarkan pemasangan otomatis |
| **Linux** | `sudo apt install git` |

**Pastikan berhasil.** Buka **PowerShell** (Windows) atau **Terminal** (Mac/Linux), ketik:

```bash
git --version
```

Harus muncul sesuatu seperti `git version 2.45.1`. Kalau muncul "not recognized",
Git belum terpasang atau komputer perlu di-restart.

## B2. Buat akun GitHub

Daftar di **https://github.com** kalau belum punya.

> Username yang Anda pilih akan menjadi bagian alamat situs nanti
> (`https://username.github.io/nama-repo/`), jadi pilih yang enak dibaca.

## B3. Kenalkan identitas Anda ke Git (sekali seumur hidup komputer)

```bash
git config --global user.name "Nama Anda"
git config --global user.email "email@akun-github-anda.com"
```

> `user.name` bebas — hanya label di catatan perubahan, bukan username GitHub.
> `user.email` sebaiknya sama dengan email akun GitHub.

Cek hasilnya:

```bash
git config --global user.name
git config --global user.email
```

## B4. Buat repository di GitHub

1. Di github.com, klik tombol **+** (kanan atas) → **New repository**
2. Isi:

   | Kolom | Nilai |
   |---|---|
   | Repository name | `pingbro-konveksi` (atau nama lain, tanpa spasi) |
   | Visibility | **Public** ← wajib, GitHub Pages gratis hanya untuk repo publik |
   | Add a README file | **JANGAN dicentang** |
   | .gitignore / license | **JANGAN dipilih** |

3. Klik **Create repository**
4. Biarkan halaman yang muncul tetap terbuka — nanti URL-nya dipakai

> Repo publik aman di sini: berkas frontend tidak memuat satu pun kata sandi.
> PIN tersimpan di Google Sheets Anda, bukan di dalam kode.

## B5. Siapkan folder proyek

1. Ekstrak berkas **`pingbro-konveksi.zip`** yang saya kirimkan
2. Folder hasil ekstraksi bernama **`pingbro-konveksi`** — **inilah folder kerjanya**.
   Jangan membuat folder pembungkus baru, jangan masuk lebih dalam.

Isinya harus persis begini:

```
pingbro-konveksi/
├── index.html          ← harus di lapisan paling luar
├── .nojekyll
├── logo-share.png      ← logo persegi untuk kartu preview tautan
├── og-image.png        ← spanduk lebar (alternatif kartu preview)
├── README.md
├── css/
│   └── style.css
└── js/
    ├── config.js
    ├── api.js
    ├── app.js
    ├── pages.js
    ├── forms.js
    ├── material.js
    └── cetak.js
```

## B6. ⚠️ Isi alamat backend — JANGAN DILEWATI

1. Buka **`js/config.js`** dengan Notepad (Windows) atau TextEdit (Mac)
2. Cari baris:

   ```javascript
   GAS_URL: 'GANTI_DENGAN_URL_EXEC_ANDA',
   ```

3. Ganti isinya dengan URL `/exec` dari langkah **A4**:

   ```javascript
   GAS_URL: 'https://script.google.com/macros/s/AKfycb.....TfQ/exec',
   ```

4. **Simpan** (Ctrl+S)

> Tanda petik `'` di kiri dan kanan harus tetap ada, dan koma di ujung jangan dihapus.
> Kalau langkah ini terlewat, situs tetap terbuka tapi menampilkan pesan
> *"Alamat backend belum diisi"*.

## B7. Buka terminal DI DALAM folder proyek

**Windows (cara tercepat):** buka folder `pingbro-konveksi` di File Explorer →
klik kolom alamat di atas → ketik `powershell` → Enter.

**Atau ketik manual:**

```powershell
cd "C:\Users\NAMA-ANDA\Downloads\pingbro-konveksi"
```

**Mac / Linux:**

```bash
cd ~/Downloads/pingbro-konveksi
```

## B8. 🚦 Gerbang pemeriksaan — jangan lewati langkah ini

Ini langkah paling penting di seluruh panduan. Git akan menerima folder yang salah
**tanpa memberi satu pun pesan error**, dan akibatnya baru terasa saat situs
menampilkan 404.

**Windows:**

```powershell
dir
```

**Mac / Linux:**

```bash
ls -la
```

**Yang HARUS terlihat:**

```
✅ BENAR                      ❌ SALAH — Anda satu level terlalu tinggi
index.html                    pingbro-konveksi/
README.md                     backend/
css/                          PANDUAN-INSTALASI.md
js/
```

- Kalau `index.html` **tidak terlihat**, Anda berada di folder yang salah.
  Ketik `cd pingbro-konveksi` lalu ulangi `dir`.
- Kalau yang terlihat justru folder `backend/`, Anda berada di folder induk.
  Masuk dulu ke folder frontend-nya.

**Jangan lanjut ke B9 sebelum `index.html` terlihat.**

## B9. Kirim ke GitHub

Jalankan **satu per satu**, jangan disatukan. Perhatikan hasil tiap perintah.

**1) Siapkan folder ini sebagai repositori Git**

```bash
git init
```
Hasil normal: `Initialized empty Git repository in ...`

**2) Tandai semua berkas untuk dikirim**

```bash
git add .
```
> ⚠️ Ada **titik** di akhir. Tanpa titik itu, tidak ada berkas yang ikut.

Hasil normal: tidak ada tulisan apa pun (diam = berhasil).

**3) Simpan perubahan dengan catatan**

```bash
git commit -m "Pemasangan pertama"
```
Hasil normal: daftar berkas, misalnya `create mode 100644 index.html`.

**4) Beri nama cabang utama**

```bash
git branch -M main
```
Hasil normal: tidak ada tulisan.

**5) Sambungkan ke repository GitHub Anda**

```bash
git remote add origin https://github.com/USERNAME/pingbro-konveksi.git
```
Ganti `USERNAME` dengan username GitHub Anda.

**6) Kirim**

```bash
git push -u origin main
```

Saat diminta:
- **Username:** username GitHub Anda
- **Password:** **Personal Access Token**, bukan kata sandi akun (lihat B10)

> 💡 Saat mengetik atau menempel token, **layar tidak menampilkan apa pun** —
> tidak ada bintang, tidak ada karakter. Ini normal, bukan tanda gagal.
> Tempel lalu langsung Enter.
> Menempel di PowerShell: klik kanan. Di Git Bash: Shift+Insert.

Tanda berhasil: muncul `Writing objects: 100%` dan `* [new branch] main -> main`.

## B10. Membuat Personal Access Token

Kalau muncul `Password authentication is not supported`, itu bukan kerusakan —
GitHub memang tidak lagi menerima kata sandi akun untuk `git push`.

1. Buka **https://github.com/settings/tokens**
2. **Generate new token** → **Generate new token (classic)**
3. Isi:
   - **Note:** `git-push-pingbro`
   - **Expiration:** `90 days` (atau `No expiration` kalau tidak mau repot)
   - **Centang scope:** ✅ **repo**
4. Klik **Generate token**
5. **Salin token** (`ghp_…`) — hanya ditampilkan sekali, simpan di Notepad
6. Ulangi `git push -u origin main`, tempel token sebagai password

> Kalau terminal terasa terlalu merepotkan, ada jalur visual:
> pasang **GitHub Desktop** (https://desktop.github.com) → login lewat browser →
> **Add Local Repository** → pilih folder `pingbro-konveksi` → **Publish repository**.

## B11. Aktifkan GitHub Pages

**Periksa dulu:** buka `https://github.com/USERNAME/pingbro-konveksi` di browser.
Di daftar berkas harus terlihat **`index.html`**, folder **`css`**, dan folder **`js`**.
Kalau yang terlihat malah folder `backend` atau `frontend`, lihat
[Perbaikan: situs 404](#perbaikan-situs-404) di bawah.

Lalu:

1. Di repo, klik tab **Settings**
2. Sidebar kiri → **Pages**
3. Isi:

   | Kolom | Nilai |
   |---|---|
   | Source | **Deploy from a branch** |
   | Branch | **main** — **/ (root)** |

4. Klik **Save**
5. Centang **Enforce HTTPS** (kalau belum aktif)
6. Tunggu 1–2 menit, refresh halaman. Muncul:

   > Your site is live at `https://USERNAME.github.io/pingbro-konveksi/`

---

# BAGIAN C — Uji Coba

Buka alamat situs Anda, lalu periksa berurutan:

| No | Yang dilakukan | Hasil yang benar |
|---|---|---|
| 1 | Buka situs | Muncul **layar PIN** dengan logo PING BRO |
| 2 | Masukkan PIN `112233` | Masuk ke splash screen, lalu Dashboard |
| 3 | **Pengaturan → Keamanan → Ganti PIN** | **Lakukan sekarang juga.** PIN bawaan diketahui umum |
| 4 | Buka menu Order, SPK, Invoice | Data contoh dari setup muncul |
| 5 | Buat order baru | Muncul nomor `ORD-…`, `SPK-…`, `INV-…` sekaligus |
| 6 | Unggah mockup pada order | Tersimpan, gambar tampil di Detail Order & kartu SPK |
| 7 | Cetak SPK / Invoice | Gambar **JPG** terbuka di jendela pratinjau dengan tombol **Preview · Unduh JPG · Print** |
| 7b | Perhatikan mockup pada SPK | Mockup mengisi ruang kosong yang tersisa, rasio gambar tidak berubah, seluruh isi tetap 1 halaman |
| 7c | Pengaturan → Data Customer → Hapus | Muncul konfirmasi; setelah dihapus, customer hilang dari daftar **tetapi order, SPK, invoice, dan pembayarannya tetap ada** |
| 7d | Pengaturan → Preview Tautan → **Salin Baris Meta**, tempel ke `index.html`, lalu `git push` | Lihat bagian **Preview tautan** di Catatan Teknis |
| 7e | Bagikan link situs ke WhatsApp | Muncul kartu: **logo kotak di kiri** + "Konveksi & Sablon" + deskripsi |
| 7f | Isi Rincian Ukuran pada Buat Order | **RINCIAN MATERIAL** di bawahnya langsung menampilkan kebutuhan bahan, tanpa tombol Hitung |
| 7g | Pengaturan → Rumus Material | Muncul 11 material bawaan; tekan Edit untuk mengubah rumusnya |
| 8 | Centang checklist produksi di SPK | Status di Dashboard ikut berubah seketika |
| 9 | Catat pembayaran | Status berubah Belum Bayar → DP → Lunas |
| 10 | Tekan tombol back HP/browser | Kembali ke halaman sebelumnya |
| 11 | Tutup browser, buka lagi situsnya | Langsung masuk tanpa PIN (sesi 30 hari) |
| 12 | Buka di HP | Tampilan menyesuaikan, bottom navigation muncul |

**Kalau ada yang gagal:** tekan **F12** di browser → tab **Console** → baca pesan
merahnya, lalu cocokkan dengan tabel Troubleshooting di bawah.

---

# BAGIAN D — Cara Memperbarui

## Mengubah tampilan / frontend

Ubah berkasnya, lalu dari dalam folder proyek jalankan tiga perintah:

```bash
git add .
git commit -m "Penjelasan singkat perubahan"
git push
```

GitHub Pages membangun ulang dalam 1–2 menit. Kalau masih tampil versi lama,
itu cache browser — tekan **Ctrl+Shift+R**, atau buka di jendela **Incognito**.

## Memastikan versi backend yang aktif

Menekan **Ctrl+S** di editor Apps Script **tidak** mengubah apa yang dijalankan
`/exec`. Yang dijalankan adalah **versi deployment**, dan versi baru harus dibuat
sendiri. Inilah sebab paling umum munculnya pesan *"Aksi tidak dikenal"*.

### Cara memeriksa

Buka alamat ini di tab browser (ganti dengan URL `/exec` Anda):

```
https://script.google.com/macros/s/AKfycb...../exec?action=ping
```

Yang keluar berupa teks JSON. Perhatikan dua bagian:

```json
"versi": "2.2.0",
"sheetMaterial": true,
"aksiTulis": [ ... "saveMaterial", "deleteMaterial" ... ]
```

| Yang terlihat | Artinya |
|---|---|
| `versi` bukan `2.2.0` | Deployment masih kode lama → buat versi baru |
| `saveMaterial` tidak ada di `aksiTulis` | Deployment masih kode lama → buat versi baru |
| `sheetMaterial: false` | `migrasiMaterial()` belum dijalankan |
| Semua sesuai, tapi aplikasi tetap gagal | `GAS_URL` di `js/config.js` menunjuk deployment yang berbeda |

### Cara membuat versi baru (URL tidak berubah)

1. Di Apps Script: **Deploy** → **Manage deployments**
2. Klik ikon **✏️ (Edit)** pada deployment yang sedang dipakai
3. **Version** → pilih **New version**
4. **Deploy**

> Gunakan **Manage deployments**, bukan **New deployment**. "New deployment"
> membuat URL `/exec` yang berbeda sehingga `js/config.js` harus diubah juga.

---

## Menambahkan sheet baru (mis. saat fitur Rincian Material dipasang)

Sebagian pembaruan butuh tabel baru di database. Caranya:

1. Tempel `Kode.gs` yang baru ke Apps Script, **Ctrl+S**
2. Pada dropdown fungsi di bar atas, pilih **`migrasiMaterial`** → **▶ Run**
3. Buka **Execution log**, pastikan muncul `✅ Migrasi Rincian Material selesai.`
4. Lanjutkan dengan **Deploy → Manage deployments → ✏️ → New version → Deploy**

Fungsi migrasi aman dijalankan berkali-kali: sheet yang sudah ada tidak disentuh,
dan material bawaan hanya ditambahkan bila daftarnya masih kosong.

> Menjalankan ulang `setupAppEnvironment()` juga bisa dipakai dan sama amannya —
> semua folder dan sheet dibuat hanya bila belum ada. Tapi `migrasiMaterial()`
> lebih ringkas karena hanya mengurus bagian yang baru.

---

## Mengubah backend / Kode.gs

1. Ubah kodenya di editor Apps Script, **Ctrl+S**
2. **Deploy → Manage deployments** → ikon ✏️ (Edit) →
   **Version: New version** → **Deploy**

> ⚠️ Menyimpan saja **tidak** membuat perubahan aktif. Wajib deploy versi baru.
> Selama Anda memakai *Manage deployments* (bukan *New deployment*), **URL `/exec`
> tetap sama** sehingga `js/config.js` tidak perlu diubah.

---

# Troubleshooting

## Masalah frontend / GitHub

| Yang terlihat | Sebabnya | Solusinya |
|---|---|---|
| `fatal: not a git repository` | `git init` belum dijalankan, atau salah folder | Jalankan `dir`, pastikan `index.html` terlihat, baru `git init` |
| `remote origin already exists` | Sudah pernah disambungkan | Lewati saja. Kalau URL-nya salah: `git remote set-url origin <url>` |
| `Password authentication is not supported` | GitHub menolak kata sandi akun | Buat Personal Access Token (langkah B10) |
| `Invalid username or token` | Token salah / kedaluwarsa / scope kurang | Buat token baru, pastikan scope **repo** dicentang |
| Tidak ada karakter muncul saat mengetik password | Perilaku normal terminal | Tetap tempel lalu Enter |
| `src refspec main does not match any` | Belum ada commit | `git add .` lalu `git commit -m "Pemasangan pertama"` |
| `Updates were rejected because the remote contains work` | Repo GitHub punya berkas yang tidak ada di lokal | `git pull --rebase origin main` lalu `git push` |
| `LF will be replaced by CRLF` | Beda format baris Windows vs Linux | **Abaikan** — ini peringatan, bukan error |
| Halaman tampil tanpa warna/tata letak | Folder `css/` dan `js/` tidak ikut terkirim | Lihat [Perbaikan: berkas rata di root](#perbaikan-berkas-rata-di-root) |
| Halaman **404** | `index.html` tidak di root repo | Lihat [Perbaikan: situs 404](#perbaikan-situs-404) |
| Situs tampil versi lama | Cache browser | Ctrl+Shift+R, atau buka Incognito |

## Masalah backend / data

| Yang terlihat | Sebabnya | Solusinya |
|---|---|---|
| "Alamat backend belum diisi" | `GAS_URL` di `js/config.js` masih teks contoh | Ulangi langkah **B6**, lalu `git add . && git commit -m "isi config" && git push` |
| "Respons server bukan JSON" | Akses Web App bukan **Anyone**, atau URL bukan `/exec` | Deploy ulang (A4) dengan Who has access = **Anyone** |
| "Tidak dapat menghubungi server" | Koneksi putus, atau URL salah ketik | Uji `URL?action=ping` di tab browser — harus keluar JSON |
| Selalu diminta PIN terus-menerus | Browser memblokir penyimpanan lokal | Jangan pakai mode Incognito; izinkan cookie & site data untuk situs ini |
| "Sesi berakhir" padahal baru login | PIN diganti di perangkat lain | Masukkan PIN yang baru |
| PIN lupa | — | Buka spreadsheet **DB_PINGBRO** → sheet **AppConfig** → baris `pinAkses` → lihat/ubah nilainya |
| Data tidak muncul, log Apps Script kosong | `setupAppEnvironment()` belum dijalankan | Jalankan sekali (langkah A3) |
| Rincian Material kosong padahal pcs sudah diisi | Kata kunci bahan tidak cocok, atau jenis produk tidak termasuk penyaring | Keterangannya muncul di tempat rincian; sesuaikan di Pengaturan → Rumus Material |
| Pengaturan → Rumus Material kosong | Sheet `Master_Material` belum dibuat | Jalankan `migrasiMaterial()` di Apps Script, lalu deploy versi baru |
| **"Aksi tidak dikenal: …"** atau **"Backend masih memakai kode versi lama"** | Kode baru sudah ditempel tapi belum di-deploy sebagai versi baru | Deploy → Manage deployments → ✏️ → **Version: New version** → Deploy. Lihat **Memastikan versi backend** di bawah |
| Angka material di order lama berbeda dari rumus sekarang | Memang begitu — yang tampil adalah hasil historis saat order disimpan | Buka Edit Order lalu simpan lagi bila ingin dihitung ulang |
| Gambar SPK/Invoice lama muncul | Dokumen padat butuh beberapa detik untuk dirender di browser | Tunggu sampai selesai; jangan menekan tombol cetak berkali-kali |
| Mockup tidak ikut tercetak | Gambar mockup gagal diambil dari Drive | Di tempatnya akan muncul keterangan + tautan Drive; buka mockup lewat Detail Order |
| Tombol Print tidak membuka apa-apa | Pop-up diblokir browser | Izinkan pop-up untuk situs ini, atau pakai **Unduh JPG** lalu cetak dari galeri |
| Logo tidak muncul sama sekali saat link dibagikan | `og:image` masih memakai alamat relatif | Pengaturan → Preview Tautan → **Salin Baris Meta**, tempel ke `index.html` menggantikan baris bertanda ⤵, lalu `git push` |
| Preview tautan masih memakai logo lama | `logo-share.png` belum diperbarui | Pengaturan → Preview Tautan → **Buat Ulang logo-share.png**, timpa berkasnya, lalu `git push` |
| Preview tautan tidak muncul di WhatsApp | WhatsApp menyimpan cache preview per tautan | Kirim tautan dengan tambahan `?v=2` di belakangnya, atau tunggu beberapa jam |
| Kartu preview tampil melebar, bukan logo kotak | `og:image` mengarah ke `og-image.png` | Ganti ke `logo-share.png` dan setel `og:image:width`/`height` ke 600 |

## Perbaikan: situs 404

Gejalanya khas: situs menampilkan **404 — File not found**, padahal **semua perintah
git berhasil tanpa satu pun pesan error**, dan di halaman repository yang terlihat di
lapisan luar adalah **folder** (`backend/`, `frontend/`) — bukan `index.html`.

Penyebabnya: `git init` dijalankan di folder induk. Tidak perlu menghapus repository —
cukup kirim ulang dari folder yang benar:

```bash
cd "C:\path\ke\pingbro-konveksi"
dir
```

Pastikan `index.html` terlihat. Baru kemudian:

```bash
git init
git add .
git commit -m "Perbaikan: kirim dari folder yang benar"
git branch -M main
git remote add origin https://github.com/USERNAME/pingbro-konveksi.git
git push -u origin main --force
```

> `--force` menimpa isi repository dengan versi di komputer Anda. Aman dilakukan di sini
> karena isi lama memang struktur yang salah — tapi Anda berhak tahu apa yang sedang
> dijalankan, bukan menyalin perintah begitu saja.

Tunggu 1–2 menit, buka situs, tekan **Ctrl+Shift+R**.

## Perbaikan: berkas rata di root

Gejalanya: halaman terbuka tapi **tanpa warna dan tata letak** (teks polos), dan
Console browser (F12) menampilkan **404** untuk `style.css` dan berkas `.js`.
Di repo GitHub, semua berkas tergeletak di root tanpa folder `css/` dan `js/`.

Biasanya terjadi kalau berkas diunggah lewat tombol **"Add file → Upload files"** di
web GitHub — cara itu tidak mempertahankan struktur folder. **Selalu pakai terminal.**

Perbaikannya:

```bash
git clone https://github.com/USERNAME/pingbro-konveksi.git perbaikan
cd perbaikan
mkdir css js
git mv style.css css/style.css
git mv config.js js/config.js
git mv api.js    js/api.js
git mv app.js    js/app.js
git mv pages.js  js/pages.js
git mv forms.js  js/forms.js
git commit -m "Kembalikan struktur folder css/ dan js/"
git push
```

---

# Catatan Teknis

## SPK & Invoice berupa JPG, bukan PDF

Dokumen disusun di backend sebagai HTML, lalu **dirender menjadi gambar JPG di
browser Anda** pada resolusi 3× (±288 DPI, lebar 2382 piksel) sehingga hurufnya
tetap tajam saat dicetak.

Akibat yang perlu diketahui:

- **Tidak ada berkas PDF** yang dibuat maupun disimpan ke Google Drive lagi.
  Folder `PINGBRO/SPK` dan `PINGBRO/Invoice` tidak lagi bertambah isinya.
- Proses render terjadi di perangkat Anda, jadi kecepatannya mengikuti perangkat —
  hitungan detik untuk dokumen biasa.
- Pada SPK, **ukuran mockup dihitung otomatis**: aplikasi mengukur tinggi isi yang
  sebenarnya, lalu memperbesar mockup sebesar mungkin selama seluruh informasi masih
  muat dalam satu halaman. Rasio gambar tidak pernah diubah dan mockup tidak pernah
  melewati margin.
- Tombol **Print** membuka gambar di tab baru lalu memanggil dialog cetak. Bila
  pop-up diblokir, pakai **Unduh JPG** lalu cetak dari galeri/berkas.

## Menghapus Customer tanpa kehilangan transaksi

Penghapusan customer memakai cara **arsip**, bukan menghapus baris:

- Baris customer tetap ada di sheet `Customer`, hanya diberi penanda pada kolom
  `Dihapus`. Karena itu `IDCustomer` pada order lama tidak pernah menunjuk ke data
  yang hilang.
- Sheet `Order`, `SPK`, `Invoice`, dan `Pembayaran` **tidak disentuh sama sekali**.
  Nama dan nomor WhatsApp customer memang sudah tersimpan pada masing-masing baris
  order, sehingga dokumen lama tetap lengkap.
- Customer yang dihapus tidak lagi muncul di daftar Pengaturan maupun di pilihan
  customer saat membuat order.
- Ingin mengembalikannya? Buka spreadsheet `DB_PINGBRO` → sheet `Customer` →
  kosongkan kembali sel pada kolom `Dihapus`.

## Rincian Material — kebutuhan bahan yang terhitung sendiri

Di bawah **Rincian Item** (Detail Order) dan di bawah **Rincian Ukuran & Harga**
(form Buat/Ubah Order) ada bagian **RINCIAN MATERIAL**. Isinya kebutuhan kain
yang dihitung otomatis dari jumlah pcs per kategori dan ukuran.

### Rumusnya tidak ditanam di kode

Semua rumus tersimpan di sheet **Master_Material** dan diubah lewat
**Pengaturan → Rumus Material**. Anda bisa menambah material baru, mengganti
pembagi, mengubah satuan, atau menonaktifkan material — tanpa memasang ulang
aplikasi dan tanpa menyentuh satu baris kode pun.

### Material bawaan

| Material | Satuan | Untuk Jenis Produk | Kata Kunci Bahan |
|---|---|---|---|
| NORMAL 30s | Kg | Kaos | 30s |
| LONGSLEEVE 30s | Kg | Lengan Panjang | 30s |
| NORMAL 24s | Kg | Kaos | 24s |
| LONGSLEEVE 24s | Kg | Lengan Panjang | 24s |
| NORMAL 20s | Kg | Kaos | 20s |
| LONGSLEEVE 20s | Kg | Lengan Panjang | 20s |
| OVERSIZE 24 | Kg | Oversize | 24 |
| OVERSIZE 20s | Kg | Oversize | 20s |
| POLO 24s | Kg | Polo | 24s |
| RIB LONGSLEEVE | Cm | Lengan Panjang | *(semua)* |
| RIB | Kg | — | — | *(nonaktif, rumusnya Anda isi sendiri)* |

### Bagaimana aplikasi memilih material

Dua penyaring dipakai bersamaan:

1. **Jenis Produk** pada kartu kategori (Kaos / Oversize / Polo / Lengan Panjang)
2. **Kata kunci bahan** dicocokkan dengan isi kolom **Bahan** pada order

Contoh: order Kaos dengan bahan "Cotton Combed 30s" → yang muncul hanya
**NORMAL 30s**. Ganti bahannya jadi "Cotton Combed 24s" → yang muncul
**NORMAL 24s**. Material yang hasilnya nol tidak ditampilkan.

> **Kalau tidak ada material yang muncul**, biasanya kolom Bahan ditulis dengan
> istilah lain (mis. "CC 30" bukan "30s"). Aplikasi akan menyebutkan hal itu
> di tempat rincian material. Perbaiki dengan salah satu cara: tulis bahannya
> memakai kata kunci yang cocok, atau ubah kata kunci material di
> **Pengaturan → Rumus Material**.

### Cara menulis rumus

| Variabel | Artinya |
|---|---|
| `COWOK` `CEWEK` `ANAK` | jumlah pcs kategori tersebut |
| `COWOK XS-M` | dibatasi rentang ukuran |
| `COWOK M` | satu ukuran saja |
| `TOTAL` | semua pcs yang lolos penyaring material |
| `TOTAL SEMUA` | semua pcs pada order, tanpa penyaring |
| `PRODUK Lengan Panjang` | pcs jenis produk tertentu |

Operator: `+` `-` `*` `×` `/` dan tanda kurung `( )`. Desimal boleh pakai koma.

```
(COWOK XS-M / 6) + (COWOK L-XL / 5,5) + (CEWEK XS-XXXL / 6)
TOTAL / 4 × 13
```

Saat rumus diketik, kotak di bawahnya langsung memberi tahu apakah rumusnya
terbaca, dan memperlihatkan contoh hasilnya. Rumus yang salah tidak bisa disimpan.

> Ukuran buatan sendiri (mis. "4L Jumbo") ikut terhitung pada `TOTAL` dan pada
> rentang penuh `XS-XXXL`, tetapi tidak pada rentang sempit seperti `L-XL` —
> supaya kainnya tidak hilang dari perhitungan, tapi juga tidak salah masuk.

### Mengubah rumus tidak merusak order lama

Setiap kali order disimpan, hasil perhitungannya ikut dicatat di sheet
**Order_Material** lengkap dengan teks rumus yang dipakai saat itu. Jadi:

- Order lama tetap menampilkan angka historisnya walaupun rumusnya Anda ubah
- Setiap kali order diedit (pcs, ukuran, kategori, jenis produk, bahan),
  angkanya dihitung ulang dan arsipnya ditimpa
- Menghapus material di Pengaturan **tidak** menghapus angka pada order lama

---

## Preview tautan — supaya logo muncul saat link dibagikan

Aplikasi pembaca tautan (WhatsApp, Facebook, Telegram) **tidak menjalankan
JavaScript**, jadi kartu preview harus berupa teks statis di dalam `index.html`
dan berkas gambar di folder situs.

Bentuk kartunya mengikuti ukuran gambar:

| Berkas | Ukuran | Hasil di WhatsApp |
|---|---|---|
| `logo-share.png` | 600 × 600 (persegi) | **Kartu ringkas** — logo kotak di kiri, judul & deskripsi di kanan ← dipakai sekarang |
| `og-image.png` | 1200 × 630 (melebar) | Kartu besar melebar dengan spanduk di atas judul |

Ingin menukar ke spanduk lebar? Di `index.html`, ganti `logo-share.png` menjadi
`og-image.png` pada baris `og:image`, `og:image:secure_url`, dan `twitter:image`;
ubah `og:image:width` menjadi `1200` dan `og:image:height` menjadi `630`; lalu
ubah `twitter:card` dari `summary` menjadi `summary_large_image`.

### Langkah 1 — pasang alamat penuh (sekali saja, WAJIB)

Ini penyebab paling umum logo **tidak muncul**: sebagian aplikasi chat menolak
alamat gambar yang relatif seperti `logo-share.png` dan hanya menerima alamat
penuh seperti `https://namaanda.github.io/pingbro-konveksi/logo-share.png`.

Tidak perlu mengetik manual:

1. Buka aplikasi **dari alamat situs yang sudah online** (bukan dari berkas lokal)
2. Masuk ke **Pengaturan → Preview Tautan**
3. Tekan **Salin Baris Meta** — alamat situs terbaca otomatis dari address bar
4. Buka `index.html`, cari empat baris bertanda **⤵**, ganti dengan hasil salinan
5. `git add . && git commit -m "alamat preview tautan" && git push`

> Kalau aplikasi dibuka dari alamat lokal (`127.0.0.1` atau berkas di komputer),
> tombol itu menolak menyalin dan memberi tahu alasannya — supaya alamat lokal
> tidak ikut tertanam di `index.html`.

### Langkah 2 — setiap kali Logo Perusahaan diganti

1. **Pengaturan → Preview Tautan → Buat Ulang logo-share.png**
2. Timpa berkas `logo-share.png` di folder proyek dengan hasil unduhan
3. ```bash
   git add .
   git commit -m "perbarui logo preview tautan"
   git push
   ```

(Tombol **Buat Ulang og-image.png** melakukan hal yang sama untuk versi spanduk lebar.)

### Menguji hasilnya

WhatsApp menyimpan preview per tautan cukup lama, jadi tautan yang sudah pernah
dikirim biasanya masih menampilkan versi lama. Untuk menguji:

- Kirim tautan dengan tambahan pembeda di belakangnya, misalnya
  `https://namaanda.github.io/pingbro-konveksi/?v=2`
- Untuk Facebook: buka **developers.facebook.com/tools/debug**, tempel tautannya,
  tekan **Scrape Again**

Bila logo tetap tidak muncul, periksa berurutan:

1. Buka alamat gambar langsung di browser —
   `https://alamat-situs-anda/logo-share.png` harus menampilkan logo, bukan 404
2. Buka halaman situs → klik kanan → **View Page Source** → cari `og:image` —
   isinya harus alamat penuh `https://…`, bukan `logo-share.png` saja
3. Pastikan situs diakses lewat **https**, bukan http

---

# Glosarium

| Istilah | Artinya |
|---|---|
| **Repository (repo)** | Folder proyek di GitHub — seperti Google Drive-nya programmer |
| **Commit** | Menyimpan perubahan beserta catatannya; bisa dilihat dan dibatalkan kapan saja |
| **Push** | Mengirim commit dari komputer ke GitHub — seperti "Upload" |
| **Clone** | Mengunduh salinan repo dari GitHub ke komputer |
| **Branch** | Cabang/versi proyek. Yang dipakai di sini: `main` |
| **Personal Access Token** | "Kata sandi khusus" dari GitHub untuk perintah Git di terminal |
| **PowerShell** | Terminal bawaan Windows |
| **Git Bash** | Terminal Git di Windows yang memakai perintah gaya Linux |
| **`/exec`** | Alamat Web App Apps Script — pintu masuk backend |
| **Token sesi** | Tanda "sudah login PIN", tersimpan 30 hari di browser Anda |
