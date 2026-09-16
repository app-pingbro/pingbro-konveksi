/**
 * ============================================================
 * PING BRO KONVEKSI & SABLON — Frontend
 * app.js — state aplikasi, inisialisasi, router SPA, dan utilitas UI
 * ============================================================
 */

// ══════════════════════════════════════════════════════════
// BAGIAN 1: STATE APLIKASI
// ══════════════════════════════════════════════════════════

const AppState = {
  config      : {},
  orders      : [],
  spk         : [],
  invoices    : [],
  masterHarga : [],
  customers   : [],
  material    : [],        // daftar rumus material (Pengaturan → Rumus Material)
  dashboard   : null,
  tahapProduksi: [],       // daftar tahapan checklist produksi dari server
  serverDate  : '',
  currentPage : 'dashboard',
  history     : [],        // riwayat internal (cadangan bila pushState tidak tersedia)
  tumpukan    : 0,         // jumlah langkah yang kita dorong ke riwayat browser
  filter      : { jenis:'Semua', spk:'Semua', invoice:'Semua' },
  charts      : {},
  itemSeq     : 0,
  katSeq      : 0,          // nomor urut kartu kategori / item pada form order
  produkKustom: [],         // jenis produk tambahan buatan Owner
  editingOrder: null,       // nomor order yang sedang diubah (null = buat baru)
  mockup      : null,       // { base64, nama, mime }
  siap        : false
};

const CACHE_KEY = KONFIG.KUNCI_CACHE;

// ══════════════════════════════════════════════════════════
// BAGIAN 2: INISIALISASI
// ══════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', function () {
  terapkanTemaTersimpan();
  terapkanFavicon();       // favicon awal dari logo bawaan
  muatProdukKustom();
  siapkanAreaMockup();
  pasangGesturKembali();   // geser dari tepi kiri = kembali (ponsel)
  pasangTombolBackBrowser();

  // Aplikasi berdiri sendiri di GitHub Pages, jadi PIN adalah gerbang pertama.
  if (konfigBelumDiisi()) { gagalKonfigurasi(); return; }
  if (!ambilToken()) { tampilkanLayarPin(); return; }

  mulaiAplikasi();
});

/** Jalankan aplikasi setelah PIN diterima (atau token lama masih berlaku). */
function mulaiAplikasi() {
  sembunyikanLayarPin();

  // Splash sempat disembunyikan saat layar PIN tampil — kembalikan sebelum animasi.
  // Bila splash sudah dilewati (sesi habis di tengah pemakaian), langsung ke halaman terakhir.
  const splash = document.getElementById('splashScreen');
  if (splash) { splash.hidden = false; animasiSplash(); }

  muatCacheLokal();      // tampilkan data lama dulu (UX instant)
  muatDataServer(true);  // lalu segarkan dari server

  if (!splash) navigateTo(AppState.currentPage || 'dashboard', { tanpaRiwayat: true });
}

/** Pesan bila js/config.js belum diisi URL /exec. */
function gagalKonfigurasi() {
  const hint = document.getElementById('splashHint');
  if (hint) {
    hint.innerHTML = '<b>Alamat backend belum diisi.</b><br>' +
      'Buka berkas <code>js/config.js</code>, isi <code>GAS_URL</code> dengan URL ' +
      '<code>/exec</code> dari Google Apps Script Anda, lalu unggah ulang.';
    hint.style.color = '#DC2626';
  }
}

// ══════════════════════════════════════════════════════════
// BAGIAN 1B: LAYAR PIN (pengganti "siapa pun boleh masuk")
// ══════════════════════════════════════════════════════════

/** Tampilkan layar PIN dan sembunyikan isi aplikasi. */
function tampilkanLayarPin(pesan) {
  const layar = document.getElementById('loginScreen');
  const splash = document.getElementById('splashScreen');
  if (splash) splash.hidden = true;
  if (!layar) return;

  layar.hidden = false;
  document.body.classList.add('terkunci');
  tampilkanPesanPin(pesan || '');

  const isian = document.getElementById('pinInput');
  if (isian) { isian.value = ''; setTimeout(function () { isian.focus(); }, 60); }
}

function sembunyikanLayarPin() {
  const layar = document.getElementById('loginScreen');
  if (layar) layar.hidden = true;
  document.body.classList.remove('terkunci');
}

function tampilkanPesanPin(pesan) {
  const kotak = document.getElementById('pinError');
  if (!kotak) return;
  kotak.textContent = pesan || '';
  kotak.hidden = !pesan;
}

/** Kirim PIN ke server dan tukar dengan token sesi. */
function kirimPin(e) {
  e.preventDefault();
  const isian = document.getElementById('pinInput');
  const tombol = document.getElementById('pinBtn');
  const pin = (isian.value || '').trim();
  if (!pin) { tampilkanPesanPin('PIN belum diisi.'); return; }

  tombol.disabled = true;
  tombol.innerHTML = '<i class="bi bi-hourglass-split"></i> Memeriksa…';
  tampilkanPesanPin('');

  apiLogin(pin)
    .then(function (res) {
      tombol.disabled = false;
      tombol.innerHTML = '<i class="bi bi-unlock"></i> Masuk';
      if (!res || !res.success) {
        tampilkanPesanPin(res ? res.message : 'Tidak ada respons dari server.');
        isian.select();
        return;
      }
      mulaiAplikasi();
      if (res.data && res.data.pinBawaan) {
        setTimeout(function () {
          toast('Ganti PIN', 'Anda masih memakai PIN bawaan. Ganti di Pengaturan → Keamanan.', 'warning');
        }, 2500);
      }
    })
    .catch(function (err) {
      tombol.disabled = false;
      tombol.innerHTML = '<i class="bi bi-unlock"></i> Masuk';
      tampilkanPesanPin(pesanError(err));
    });
}

/** Keluar: hapus token & cache lokal, lalu kembali ke layar PIN. */
function keluarAplikasi() {
  konfirmasi('Keluar Aplikasi',
    'Sesi di perangkat ini akan diakhiri dan PIN diminta lagi saat membuka aplikasi. Lanjutkan?',
    function () {
      hapusToken();
      try { localStorage.removeItem(CACHE_KEY); } catch (e) {}
      location.reload();
    });
}

/** Terapkan tema yang tersimpan di localStorage. */
function terapkanTemaTersimpan() {
  let tema = 'light';
  try { tema = localStorage.getItem(KONFIG.KUNCI_TEMA) || 'light'; } catch (e) {}
  document.documentElement.setAttribute('data-theme', tema);
  perbaruiIkonTema(tema);
}

function perbaruiIkonTema(tema) {
  const btn = document.getElementById('themeBtn');
  if (btn) btn.innerHTML = tema === 'dark'
    ? '<i class="bi bi-sun"></i>' : '<i class="bi bi-moon-stars"></i>';
}

function toggleDarkMode() {
  const skrg = document.documentElement.getAttribute('data-theme');
  const baru = skrg === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', baru);
  try { localStorage.setItem(KONFIG.KUNCI_TEMA, baru); } catch (e) {}
  perbaruiIkonTema(baru);
  perbaruiTemaChart();
  toast('Tampilan', 'Mode ' + (baru === 'dark' ? 'gelap' : 'terang') + ' diaktifkan.', 'info');
}

/** Animasi progress bar splash sementara data dimuat. */
function animasiSplash() {
  let p = 0;
  const bar = document.getElementById('splashBar');
  const txt = document.getElementById('splashPercent');
  const timer = setInterval(function () {
    p += AppState.siap ? 12 : 4;
    if (p >= 100) { p = 100; clearInterval(timer); }
    if (bar) bar.style.width = p + '%';
    if (txt) txt.textContent = p + '%';
  }, 90);
}

/** Tampilkan data dari cache lokal agar layar tidak kosong saat menunggu server. */
function muatCacheLokal() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return;
    const cache = JSON.parse(raw);
    if (!cache || !cache.orders) return;
    Object.assign(AppState, {
      config: cache.config || {}, orders: cache.orders || [],
      spk: cache.spk || [], invoices: cache.invoices || [],
      masterHarga: cache.masterHarga || [], customers: cache.customers || [],
      material: cache.material || [],
      dashboard: cache.dashboard || null, serverDate: cache.serverDate || '',
      tahapProduksi: cache.tahapProduksi || []
    });
    gambarSemua();
  } catch (e) { /* cache rusak — abaikan */ }
}

function simpanCacheLokal() {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      config: AppState.config, orders: AppState.orders, spk: AppState.spk,
      invoices: AppState.invoices, masterHarga: AppState.masterHarga,
      customers: AppState.customers, material: AppState.material,
      dashboard: AppState.dashboard,
      serverDate: AppState.serverDate, tahapProduksi: AppState.tahapProduksi
    }));
  } catch (e) { /* kuota penuh — abaikan */ }
}

/** Ambil seluruh data awal dalam SATU panggilan server. */
function muatDataServer(pertamaKali) {
  apiCall('getBootstrapData')
    .then(function (res) {
      // Sesi habis: layar PIN sudah ditampilkan oleh api.js — jangan timpa dengan pesan error
      if (res && res.perluLogin) return;
      if (!res || !res.success) {
        gagalMuat(res ? res.message : 'Respons server kosong.');
        return;
      }
      const d = res.data;
      AppState.config      = d.config || {};
      AppState.orders      = d.orders || [];
      AppState.spk         = d.spk || [];
      AppState.invoices    = d.invoices || [];
      AppState.masterHarga = d.masterHarga || [];
      AppState.customers   = d.customers || [];
      AppState.material    = d.material || [];
      AppState.dashboard   = d.dashboard || null;
      AppState.tahapProduksi = d.tahapProduksi || [];
      AppState.serverDate  = d.serverDate || '';
      AppState.siap = true;

      simpanCacheLokal();
      gambarSemua();

      const el1 = document.getElementById('splashSpk');
      const el2 = document.getElementById('splashInv');
      if (el1) el1.textContent = 'Tabel SPK: ' + AppState.spk.length + ' Active';
      if (el2) el2.textContent = 'Invoice Sync: OK';
      const btn = document.getElementById('splashBtn');
      const hint = document.getElementById('splashHint');
      if (btn) btn.disabled = false;
      if (hint) hint.textContent = 'Data siap. Silakan masuk ke dashboard.';

      if (!pertamaKali) toast('Berhasil', 'Data terbaru berhasil dimuat.', 'success');
    })
    .catch(function (err) {
      gagalMuat(err && err.message ? err.message : String(err));
    });
}

function gagalMuat(pesan) {
  AppState.siap = true;
  const hint = document.getElementById('splashHint');
  const btn  = document.getElementById('splashBtn');
  if (hint) hint.innerHTML = '⚠️ ' + escapeHtml(pesan) +
    '<br>Pastikan <b>setupAppEnvironment()</b> sudah dijalankan.';
  if (btn) { btn.disabled = false; btn.querySelector('span').textContent = 'Lanjut Tanpa Data'; }
  toast('Gagal memuat', pesan, 'danger');
}

/** Tutup splash dan masuk ke aplikasi. */
function masukAplikasi() {
  const s = document.getElementById('splashScreen');
  if (s) { s.classList.add('hide'); setTimeout(function () { s.remove(); }, 500); }
  navigateTo('dashboard');
}

/** Gambar ulang seluruh layar dari AppState. */
function gambarSemua() {
  terapkanKonfigurasi();
  renderDashboard();
  renderDaftarOrder();
  renderSpk();
  renderInvoice();
  isiPilihanCustomer();
  isiFormPengaturan();
  renderNotifikasi();
  perbaruiBadge();
  // Siapkan form order sesuai alur produksi terpilih (default: Full Order)
  const adaKartu = document.querySelectorAll(
    '#itemRows .kat-card, #sablonRows .kat-card, #screenRows .kat-card').length > 0;
  terapkanAlurProduksi(!adaKartu);
}

/** Terapkan identitas usaha dari AppConfig. */
function terapkanKonfigurasi() {
  const c = AppState.config || {};
  const nama = c.appName || 'PINGBRO Konveksi & Sablon';
  const owner = c.ownerName || 'Owner';
  // Judul tab browser selalu "Konveksi & Sablon"
  document.title = 'Konveksi & Sablon';

  const brand = document.getElementById('brandName');
  if (brand) brand.textContent = String(nama).split(' ')[0].toUpperCase();

  const judul = document.getElementById('headerTitle');
  if (judul) judul.textContent = 'Halo, ' + owner + ' 👋';

  const tgl = document.getElementById('headerDate');
  if (tgl) tgl.textContent = 'Monitoring order & produksi: ' + formatTanggalPanjang(AppState.serverDate);

  // SATU logo untuk seluruh aplikasi. Variabel CSS --logo-pingbro dipakai oleh
  // splash screen, rail sidebar, dan header sekaligus, jadi cukup diganti sekali.
  const logo = c.logoData || c.logoUrl || '';
  document.documentElement.style.setProperty('--logo-pingbro',
    logo ? 'url(' + logo + ')' : '');
  const pratinjauLogo = document.getElementById('logoPreview');
  if (pratinjauLogo) pratinjauLogo.style.backgroundImage = logo ? 'url(' + logo + ')' : '';

  // Favicon mengikuti Logo Perusahaan — otomatis berubah saat logo diganti
  terapkanFavicon();

  const meta = document.getElementById('workshopMeta');
  if (meta) meta.textContent = AppState.orders.length + ' order · ' + AppState.spk.length + ' SPK';

  const hintDp = document.getElementById('hintDp');
  if (hintDp) hintDp.textContent = 'Minimal DP yang disarankan: ' + (c.minDpPersen || 50) + '%.';
}

/**
 * Pasang Logo Perusahaan sebagai favicon.
 * Catatan: di Google Apps Script aplikasi berjalan di dalam iframe, sehingga
 * ikon tab browser sesungguhnya diatur doGet() (setFaviconUrl). Fungsi ini
 * menjaga favicon dokumen aplikasi tetap sinkron dengan logo terbaru.
 */
function terapkanFavicon() {
  // Ambil dari variabel CSS --logo-pingbro: satu sumber logo untuk seluruh aplikasi,
  // sehingga favicon otomatis ikut logo bawaan maupun logo unggahan Owner.
  const nilai = getComputedStyle(document.documentElement)
    .getPropertyValue('--logo-pingbro').trim();
  const cocok = nilai.match(/url\(\s*['"]?(.+?)['"]?\s*\)/);
  if (!cocok) return;

  ['faviconApp', 'faviconApple'].forEach(function (id) {
    const el = document.getElementById(id);
    if (el && el.getAttribute('href') !== cocok[1]) el.setAttribute('href', cocok[1]);
  });
}

// ══════════════════════════════════════════════════════════
// BAGIAN 3: ROUTER SPA (tanpa perubahan URL)
// ══════════════════════════════════════════════════════════

const JUDUL_HALAMAN = {
  dashboard:'Dashboard', daftar:'Daftar Order', tambah:'Buat Order Baru',
  spk:'SPK Produksi', invoice:'Invoice & Pembayaran',
  pengaturan:'Pengaturan Sistem', bantuan:'Bantuan', detail:'Detail Order',
  notifikasi:'Notifikasi'
};

/**
 * Satu-satunya cara berpindah halaman.
 * Tidak pernah memakai window.location / window.open / ?page=
 */
function navigateTo(halaman, opsi) {
  opsi = opsi || {};
  const target = document.getElementById('section-' + halaman);
  if (!target) return;

  if (AppState.currentPage && AppState.currentPage !== halaman && !opsi.tanpaRiwayat) {
    AppState.history.push(AppState.currentPage);
  }

  // Catat ke riwayat browser supaya tombol back bawaan HP/browser berfungsi.
  // Tidak dilakukan saat perpindahan justru DIPICU oleh tombol back (popstate).
  if (!opsi.dariPopstate && AppState.currentPage !== halaman) {
    try {
      history.pushState({ halaman: halaman }, '', '#' + halaman);
      AppState.tumpukan++;
    } catch (e) { /* browser lama — navigasi tetap jalan tanpa riwayat */ }
  }

  document.querySelectorAll('.content-section').forEach(function (s) { s.classList.remove('active'); });
  target.classList.add('active');
  AppState.currentPage = halaman;

  // Sorot menu aktif (sidebar + dock)
  document.querySelectorAll('.nav-item[data-section],.dock-item[data-section]').forEach(function (el) {
    el.classList.toggle('active', el.dataset.section === halaman);
  });

  // Muat ulang konten yang perlu selalu segar
  if (halaman === 'dashboard') renderDashboard();
  if (halaman === 'daftar')    renderDaftarOrder();
  if (halaman === 'spk')       renderSpk();
  if (halaman === 'invoice')   renderInvoice();
  if (halaman === 'notifikasi')renderNotifikasi();
  if (halaman === 'pengaturan'){ isiFormPengaturan(); muatLinkSistem(); }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Kembali ke halaman sebelumnya.
 * Bila ada modal/pratinjau yang terbuka, modal itu yang ditutup lebih dulu —
 * perilakunya sama seperti tombol kembali pada aplikasi mobile.
 * Bila riwayat sudah habis, kembali ke Dashboard.
 */
function kembali() {
  if (tutupLapisanAtas()) return;

  // Selama masih ada langkah yang kita catat sendiri, serahkan ke riwayat browser
  // supaya tombol Kembali di layar, tombol back HP, dan gestur geser sinkron.
  if (AppState.tumpukan > 0) { history.back(); return; }

  let sebelumnya = AppState.history.pop();
  // Lewati riwayat yang menunjuk ke halaman yang sedang dibuka
  while (sebelumnya && sebelumnya === AppState.currentPage) sebelumnya = AppState.history.pop();
  navigateTo(sebelumnya || 'dashboard', { tanpaRiwayat: true });
}

/**
 * Aktifkan tombol back bawaan browser & tombol back fisik Android.
 * Ini baru mungkin setelah migrasi: di versi iframe Apps Script, URL tidak
 * boleh berubah sehingga history.pushState tidak bisa dipakai.
 */
function pasangTombolBackBrowser() {
  try {
    history.replaceState({ halaman: 'dashboard' }, '', location.pathname + location.search);
  } catch (e) { return; }

  window.addEventListener('popstate', function (ev) {
    if (AppState.tumpukan > 0) AppState.tumpukan--;
    // Modal yang terbuka ditutup lebih dulu, persis seperti aplikasi mobile
    if (tutupLapisanAtas()) return;
    const tujuan = (ev.state && ev.state.halaman) || 'dashboard';
    navigateTo(tujuan, { tanpaRiwayat: true, dariPopstate: true });
  });
}

/** Tutup modal/pratinjau paling atas bila ada. Mengembalikan true bila ada yang ditutup. */
function tutupLapisanAtas() {
  const terbuka = document.querySelector('.modal.show');
  if (terbuka && window.bootstrap && bootstrap.Modal) {
    const m = bootstrap.Modal.getInstance(terbuka);
    if (m) { m.hide(); return true; }
  }
  return false;
}

/* ══════════════════════════════════════════════════════════
   GESTUR KEMBALI (geser dari tepi kiri layar)
   Dipasang pasif — tidak pernah memanggil preventDefault,
   sehingga scroll & gestur lain yang sudah ada tetap normal.
   ══════════════════════════════════════════════════════════ */
const GESTUR = {
  LEBAR_TEPI : 28,   // px dari tepi kiri tempat gestur boleh dimulai
  JARAK_MIN  : 70,   // px minimal geseran mendatar
  RASIO      : 1.8,  // geseran harus jelas mendatar, bukan menggulir
  DURASI_MAX : 700   // ms
};
let gsr = null;      // status geseran yang sedang berjalan

function pasangGesturKembali() {
  // Hanya untuk perangkat sentuh
  if (!('ontouchstart' in window)) return;

  document.addEventListener('touchstart', function (e) {
    gsr = null;
    if (e.touches.length !== 1) return;
    const t = e.touches[0];
    if (t.clientX > GESTUR.LEBAR_TEPI) return;
    // Jangan ganggu elemen yang memang bisa digeser mendatar (tabel, carousel, dsb.)
    if (adaGulirMendatar(e.target)) return;
    gsr = { x: t.clientX, y: t.clientY, waktu: Date.now(), batal: false };
  }, { passive: true });

  document.addEventListener('touchmove', function (e) {
    if (!gsr || gsr.batal) return;
    const t = e.touches[0];
    const dx = t.clientX - gsr.x, dy = Math.abs(t.clientY - gsr.y);
    if (dy > 40 && dy > Math.abs(dx)) { gsr.batal = true; petunjukGeser(0); return; }
    if (dx > 0) petunjukGeser(Math.min(dx / GESTUR.JARAK_MIN, 1));
  }, { passive: true });

  document.addEventListener('touchend', function (e) {
    const g = gsr; gsr = null; petunjukGeser(0);
    if (!g || g.batal) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - g.x, dy = Math.abs(t.clientY - g.y);
    if (Date.now() - g.waktu > GESTUR.DURASI_MAX) return;
    if (dx >= GESTUR.JARAK_MIN && dx > dy * GESTUR.RASIO) kembali();
  }, { passive: true });

  document.addEventListener('touchcancel', function () { gsr = null; petunjukGeser(0); }, { passive: true });
}

/** true bila titik sentuh berada di dalam wadah yang bisa digulir mendatar. */
function adaGulirMendatar(el) {
  for (let n = el; n && n !== document.body; n = n.parentElement) {
    if (n.scrollWidth - n.clientWidth > 8) {
      const gaya = getComputedStyle(n).overflowX;
      if (gaya === 'auto' || gaya === 'scroll') return true;
    }
  }
  return false;
}

/** Penanda visual tipis di tepi kiri saat gestur berjalan (0–1). */
function petunjukGeser(rasio) {
  let el = document.getElementById('gesturHint');
  if (!el) {
    if (!rasio) return;
    el = document.createElement('div');
    el.id = 'gesturHint';
    el.className = 'gestur-hint';
    el.innerHTML = '<i class="bi bi-arrow-left"></i>';
    document.body.appendChild(el);
  }
  el.style.opacity = rasio ? String(Math.min(rasio, 1)) : '0';
  el.style.transform = 'translateY(-50%) translateX(' + (rasio ? (rasio * 14 - 14) : -14) + 'px)';
}

function refreshSemua() {
  busy(true, 'Menyegarkan data…');
  apiCall('getBootstrapData')
    .then(function (res) {
      busy(false);
      if (res && res.perluLogin) return;      // layar PIN sudah muncul
      if (res && res.success) {
        const d = res.data;
        AppState.orders = d.orders; AppState.spk = d.spk;
        AppState.invoices = d.invoices; AppState.masterHarga = d.masterHarga;
        AppState.customers = d.customers; AppState.dashboard = d.dashboard;
        AppState.material = d.material || AppState.material;
        AppState.config = d.config; AppState.serverDate = d.serverDate;
        AppState.tahapProduksi = d.tahapProduksi || AppState.tahapProduksi;
        simpanCacheLokal();
        gambarSemua();
        toast('Berhasil', 'Data terbaru sudah dimuat.', 'success');
      } else {
        toast('Gagal', res ? res.message : 'Tidak ada respons.', 'danger');
      }
    })
    .catch(function (err) { busy(false); toast('Error', pesanError(err), 'danger'); });
}

// ══════════════════════════════════════════════════════════
// BAGIAN 4: UTILITAS UI
// ══════════════════════════════════════════════════════════

function rupiah(n) {
  const v = Number(n) || 0;
  return 'Rp ' + v.toLocaleString('id-ID');
}
function rupiahSingkat(n) {
  const v = Number(n) || 0;
  if (v >= 1000000000) return 'Rp ' + (v / 1000000000).toFixed(1) + 'M';
  if (v >= 1000000)    return 'Rp ' + (v / 1000000).toFixed(1) + 'jt';
  if (v >= 1000)       return 'Rp ' + Math.round(v / 1000) + 'rb';
  return 'Rp ' + v;
}
function escapeHtml(s) {
  return String(s === null || s === undefined ? '' : s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
function escapeAttr(s) { return escapeHtml(s).replace(/`/g, ''); }

/** Ambil nilai angka murni dari input bertitik (mis. "55.000" → 55000). */
function parseAngka(nilai) {
  return Number(String(nilai === null || nilai === undefined ? '' : nilai)
    .replace(/[^0-9]/g, '')) || 0;
}

/** Nilai numerik sebuah elemen input. */
function nilaiInput(el) { return el ? parseAngka(el.value) : 0; }

/**
 * Format isi field uang memakai pemisah ribuan Indonesia ("55.000").
 * Posisi kursor dipulihkan ke digit yang sama agar mengetik di tengah tidak melompat.
 */
function formatRibuan(input) {
  if (!input) return;
  const posAwal = input.selectionStart;
  const digitSebelumKursor = String(input.value).slice(0, posAwal).replace(/[^0-9]/g, '').length;

  const angka = parseAngka(input.value);
  const teks = angka ? angka.toLocaleString('id-ID') : '';
  input.value = teks;

  let hitung = 0, pos = 0;
  if (digitSebelumKursor > 0) {
    for (pos = 0; pos < teks.length; pos++) {
      if (teks.charCodeAt(pos) >= 48 && teks.charCodeAt(pos) <= 57) hitung++;
      if (hitung >= digitSebelumKursor) { pos++; break; }
    }
  }
  try { input.setSelectionRange(pos, pos); } catch (e) { /* input tanpa dukungan seleksi */ }

  hitungTotalOrder();
}

/** Field jumlah: hanya terima digit, tanpa stepper naik-turun. */
function hanyaAngka(input) {
  if (!input) return;
  const bersih = String(input.value).replace(/[^0-9]/g, '');
  if (bersih !== input.value) input.value = bersih;
  hitungTotalOrder();
}
// pesanError() didefinisikan di js/api.js — versinya mengenali kegagalan jaringan.

const NAMA_BULAN = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
const NAMA_HARI  = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];

function formatTanggal(iso) {
  if (!iso) return '-';
  const p = String(iso).substring(0,10).split('-');
  if (p.length !== 3) return iso;
  return Number(p[2]) + ' ' + NAMA_BULAN[Number(p[1]) - 1] + ' ' + p[0];
}
function formatTanggalPanjang(iso) {
  if (!iso) return '-';
  const d = new Date(String(iso).substring(0,10) + 'T00:00:00');
  if (isNaN(d.getTime())) return iso;
  return NAMA_HARI[d.getDay()] + ', ' + formatTanggal(iso);
}
function labelSisaHari(n) {
  if (n === null || n === undefined) return '-';
  if (n < 0)  return 'Terlambat ' + Math.abs(n) + ' hari';
  if (n === 0) return 'Deadline hari ini';
  if (n === 1) return 'Deadline besok';
  return n + ' hari lagi';
}

/** Status produksi kini bernilai: Belum Dikerjakan → Material … Kirim → Sukses. */
function statusSelesai(status) { return status === 'Sukses' || status === 'Selesai'; }

function kelasChipProduksi(status) {
  if (statusSelesai(status)) return 'chip-success';
  if (status === 'Belum Dikerjakan') return 'chip-pending';
  if (status === 'Terlambat') return 'chip-danger';
  return 'chip-progress';
}
function kelasChipBayar(status) {
  return { 'Lunas':'chip-success', 'DP':'chip-dp', 'Belum Bayar':'chip-danger' }[status] || 'chip-pending';
}
/** Persentase progres mengikuti posisi tahap pada checklist. */
function persenProduksi(status) {
  if (statusSelesai(status)) return 100;
  if (status === 'Belum Dikerjakan') return 3;
  const daftar = daftarTahap();
  const i = daftar.indexOf(status);
  return (i >= 0) ? Math.round(((i + 1) / daftar.length) * 100) : 40;
}

/**
 * Indikator urgensi deadline berdasarkan sisa hari:
 *   Merah  → kurang dari 3 hari (termasuk yang sudah terlambat)
 *   Kuning → kurang dari 7 hari (3–6 hari)
 *   Hijau  → 7 hari atau lebih
 */
function kelasUrgensi(sisaHari) {
  if (sisaHari === null || sisaHari === undefined) return 'chip-pending';
  const n = Number(sisaHari);
  if (isNaN(n)) return 'chip-pending';
  if (n < 3) return 'chip-danger';
  if (n < 7) return 'chip-warning';
  return 'chip-success';
}

/** Cari nomor invoice milik sebuah order (untuk tombol Cetak Invoice). */
function nomorInvoiceOrder(nomorOrder) {
  const inv = AppState.invoices.filter(function (i) { return i.NomorOrder === nomorOrder; })[0];
  return inv ? inv.NomorInvoice : '';
}

/** Toast non-blocking. */
let toastTimer = null;
function toast(judul, pesan, tipe) {
  const el = document.getElementById('appToast');
  if (!el) return;
  const ikon = { success:'bi-check-circle-fill', danger:'bi-exclamation-octagon-fill',
                 warning:'bi-exclamation-triangle-fill', info:'bi-info-circle-fill' };
  document.getElementById('toastTitle').textContent = judul;
  document.getElementById('toastBody').textContent = pesan;
  document.getElementById('toastIcon').className = 'bi ' + (ikon[tipe] || ikon.info);
  el.className = 'app-toast show ' + (tipe || 'info');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function () { el.className = 'app-toast'; }, 4200);
}

/** Overlay loading global. */
function busy(aktif, teks) {
  const el = document.getElementById('busyOverlay');
  if (!el) return;
  document.getElementById('busyText').textContent = teks || 'Memproses…';
  el.hidden = !aktif;
}

/** Modal konfirmasi umum. */
function konfirmasi(judul, teks, aksi) {
  document.getElementById('confirmTitle').textContent = judul;
  document.getElementById('confirmText').textContent = teks;
  const modal = new bootstrap.Modal(document.getElementById('confirmModal'));
  const btn = document.getElementById('confirmOkBtn');
  const klon = btn.cloneNode(true);       // buang listener lama
  btn.parentNode.replaceChild(klon, btn);
  klon.onclick = function () { modal.hide(); aksi(); };
  modal.show();
}

/** Pratinjau dokumen/gambar — SELALU di modal, tidak pernah menggeser halaman. */
function bukaPratinjau(judul, sumber, tipe, unduhUrl, printUrl) {
  document.getElementById('previewTitle').textContent = judul;
  const body = document.getElementById('previewBody');
  body.innerHTML = (tipe === 'image')
    ? '<img src="' + escapeAttr(sumber) + '" alt="' + escapeAttr(judul) + '">'
    : '<iframe src="' + escapeAttr(sumber) + '" loading="lazy"></iframe>';

  // Kembalikan tombol ke bentuk biasa — js/cetak.js mengubahnya saat mencetak JPG
  const dl = document.getElementById('previewDownload');
  dl.href = unduhUrl || sumber;
  dl.removeAttribute('download');
  dl.setAttribute('target', '_blank');
  dl.innerHTML = '<i class="bi bi-download"></i> Unduh';

  const penuh = document.getElementById('previewFull');
  if (penuh) { penuh.hidden = true; penuh.onclick = null; }

  const pr = document.getElementById('previewPrint');
  if (pr) {
    pr.onclick = null;
    pr.innerHTML = '<i class="bi bi-printer"></i> Print';
    if (!printUrl) { pr.hidden = true; }
    else { pr.hidden = false; pr.href = printUrl; pr.setAttribute('target', '_blank'); }
  }

  new bootstrap.Modal(document.getElementById('previewModal')).show();
}

/** Perbarui angka badge pada menu. */
function perbaruiBadge() {
  const aktif = AppState.orders.filter(function (o) { return !statusSelesai(o.StatusProduksi); }).length;
  const spkAktif = AppState.spk.filter(function (s) { return !statusSelesai(s.StatusPengerjaan); }).length;
  const bo = document.getElementById('badgeOrder'); if (bo) bo.textContent = aktif;
  const bs = document.getElementById('badgeSpk');   if (bs) bs.textContent = spkAktif;
  const cs = document.getElementById('chipSpkAktif'); if (cs) cs.textContent = spkAktif + ' aktif diproses';

  const notif = jumlahNotifikasi();
  const bn = document.getElementById('badgeNotif');
  if (bn) { bn.textContent = notif; bn.classList.toggle('hide', notif === 0); }
}

function jumlahNotifikasi() {
  const batas = Number(AppState.config.deadlineWarning || 3);
  return AppState.orders.filter(function (o) {
    return !statusSelesai(o.StatusProduksi) && o.SisaHari <= batas;
  }).length + AppState.orders.filter(function (o) { return o.SisaPembayaran > 0; }).length;
}
