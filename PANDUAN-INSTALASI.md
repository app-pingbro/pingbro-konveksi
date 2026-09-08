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
├── README.md
├── css/
│   └── style.css
└── js/
    ├── config.js
    ├── api.js
    ├── app.js
    ├── pages.js
    └── forms.js
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
| 7 | Cetak SPK / Invoice | PDF terbuka di jendela pratinjau, ada tombol Unduh & Print |
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
| PDF tidak terbuka | Belum login Google di browser yang sama | Login ke akun Google pemilik Drive |

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
