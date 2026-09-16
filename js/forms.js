/**
 * ============================================================
 * PING BRO KONVEKSI & SABLON — Frontend
 * forms.js — Form Order Baru, Ubah Order, dan Pengaturan Sistem
 * ============================================================
 */

// ══════════════════════════════════════════════════════════
// BAGIAN 8: FORM ORDER BARU
// ══════════════════════════════════════════════════════════

let modeCustomer = 'lama';
let jenisOrderTerpilih = 'Full Order';

/**
 * Konfigurasi tiap alur produksi.
 * Menentukan blok mana yang tampil dan bentuk kartu Detail Item Produk.
 *   modeItem 'matrix' → kartu kategori + grid ukuran (Full Order, Jahit Saja)
 *   modeItem 'sablon' → kartu item sablon (jumlah, warna depan/belakang, harga)
 *   modeItem 'hybrid' → kartu kategori + grid ukuran + warna sablon (Jahit + Sablon)
 */
const ALUR = {
  'Full Order': {
    bahan: true, mockup: true, modeItem: 'matrix',
    kategori: true, sablon: false, screen: false,
    subItem: 'Kategori → Ukuran → Jumlah → Harga otomatis dari Master Harga'
  },
  'Sablon': {
    bahan: false, mockup: true, modeItem: 'sablon',
    kategori: false, sablon: true, screen: true,
    subItem: 'Rincian item sablon dan screen yang dipakai'
  },
  'Jahit': {
    bahan: true, mockup: false, modeItem: 'matrix',
    kategori: true, sablon: false, screen: false,
    subItem: 'Kategori → Ukuran → Jumlah → Harga satuan jasa jahit'
  },
  'Jahit + Sablon': {
    bahan: true, mockup: true, modeItem: 'hybrid',
    kategori: true, sablon: true, screen: true,
    subItem: 'Rincian ukuran per kategori, item sablon, dan screen sablon'
  }
};

const UKURAN_BAKU = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
const PRODUK_BAWAAN = ['Kaos', 'Oversize', 'Polo', 'Lengan Panjang'];
const KUNCI_PRODUK = 'pingbro_produk_kustom';

/** Daftar jenis produk = bawaan + yang ditambahkan Owner sendiri. */
function daftarProduk() {
  return PRODUK_BAWAAN.concat(AppState.produkKustom || []);
}

function muatProdukKustom() {
  try {
    const raw = localStorage.getItem(KUNCI_PRODUK);
    AppState.produkKustom = raw ? JSON.parse(raw) : [];
  } catch (e) { AppState.produkKustom = []; }
}

function simpanProdukKustom() {
  try { localStorage.setItem(KUNCI_PRODUK, JSON.stringify(AppState.produkKustom || [])); }
  catch (e) { /* penyimpanan penuh — abaikan */ }
}

/** Dipanggil saat dropdown jenis produk berubah. */
function pilihProduk(id, el) {
  const kotak = document.getElementById('produkBaru-' + id);
  if (el.value === '__tambah') {
    el.value = el.dataset.terakhir || 'Kaos';
    if (kotak) {
      kotak.hidden = false;
      const inp = kotak.querySelector('input');
      inp.value = ''; inp.focus();
    }
    return;
  }
  el.dataset.terakhir = el.value;
  if (kotak) kotak.hidden = true;
  isiHargaOtomatisKat(id);
}

/** Simpan jenis produk baru lalu terapkan ke seluruh dropdown yang terbuka. */
function tambahJenisProduk(id) {
  const kotak = document.getElementById('produkBaru-' + id);
  if (!kotak) return;
  const nama = (kotak.querySelector('input').value || '').trim();
  if (!nama) { toast('Belum diisi', 'Tulis nama jenis produknya dulu.', 'warning'); return; }

  const sudahAda = daftarProduk().some(function (p) {
    return p.toLowerCase() === nama.toLowerCase();
  });
  if (!sudahAda) {
    AppState.produkKustom = (AppState.produkKustom || []).concat([nama]);
    simpanProdukKustom();
  }

  // Bangun ulang semua dropdown produk, pertahankan pilihan masing-masing kartu
  document.querySelectorAll('#itemRows [data-f="produk"]').forEach(function (sel) {
    const kartuId = sel.closest('.kat-card').id.split('-')[1];
    const terpilih = (kartuId === String(id)) ? nama : sel.value;
    sel.innerHTML = opsiProduk(terpilih);
    sel.dataset.terakhir = terpilih;
  });

  kotak.hidden = true;
  toast('Jenis produk ditambahkan', '"' + nama + '" siap dipakai pada order berikutnya.', 'success');
  isiHargaOtomatisKat(id);
}

/** Opsi dropdown jenis produk + baris "tambah jenis produk". */
function opsiProduk(terpilih) {
  return daftarProduk().map(function (p) {
    return '<option value="' + escapeAttr(p) + '"' +
      (p === terpilih ? ' selected' : '') + '>' + escapeHtml(p) + '</option>';
  }).join('') +
  '<option value="__tambah">+ Tambah Jenis Produk…</option>';
}

function konfigAlur() { return ALUR[jenisOrderTerpilih] || ALUR['Full Order']; }

function setModeCustomer(el, mode) {
  document.querySelectorAll('#section-tambah .seg-control .seg-btn').forEach(function (b) {
    if (b.parentNode === el.parentNode) b.classList.remove('active');
  });
  el.classList.add('active');
  modeCustomer = mode;
  const f = document.getElementById('fieldCustLama');
  if (f) f.style.display = (mode === 'lama') ? '' : 'none';
  if (mode === 'baru') {
    document.getElementById('custExisting').value = '';
    document.getElementById('custNama').value = '';
    document.getElementById('custWa').value = '';
  }
}

/** Pilih alur produksi → seluruh form menyesuaikan. */
function setJenisAlur(el, jenis) {
  if (el) {
    el.parentNode.querySelectorAll('.alur-btn').forEach(function (b) { b.classList.remove('active'); });
    el.classList.add('active');
  }
  const berubah = (jenisOrderTerpilih !== jenis);
  jenisOrderTerpilih = jenis;
  terapkanAlurProduksi(berubah);
}

/**
 * Tampilkan hanya field yang relevan untuk alur produksi terpilih.
 * Blok yang tidak diperlukan disembunyikan penuh agar form tidak kepanjangan.
 */
function terapkanAlurProduksi(resetItem) {
  const cfg = konfigAlur();

  // Blok Bahan Material — hilang pada alur "Sablon Saja" (kain dari customer)
  document.querySelectorAll('#section-tambah [data-grup="bahan"]').forEach(function (el) {
    el.hidden = !cfg.bahan;
  });
  const judulBahan = document.getElementById('judulBlokBahan');
  const subBahan   = document.getElementById('subBlokBahan');
  if (judulBahan) judulBahan.textContent = cfg.bahan ? 'Bahan Material & Deadline' : 'Deadline Pengerjaan';
  if (subBahan) subBahan.textContent = cfg.bahan
    ? 'Spesifikasi kain dan komitmen jadwal kirim'
    : 'Kain disediakan customer — cukup tentukan jadwal kirim';

  // Bagian sablon (upload mockup + posisi sablon) — hilang pada alur "Jahit Saja".
  // Blok tetap tampil agar Prioritas Produksi & Catatan Workshop tidak ikut hilang.
  document.querySelectorAll('#blokMockup [data-grup="sablon"]').forEach(function (el) {
    el.hidden = !cfg.mockup;
  });
  const judulMockup = document.getElementById('judulBlokMockup');
  const subMockup   = document.getElementById('subBlokMockup');
  if (judulMockup) judulMockup.textContent = cfg.mockup
    ? 'Mockup & Spesifikasi Sablon' : 'Instruksi Produksi';
  if (subMockup) subMockup.textContent = cfg.mockup
    ? 'Desain akan tersimpan di Google Drive dan tampil pada SPK'
    : 'Prioritas dan catatan kerja untuk workshop jahit';
  if (!cfg.mockup) hapusMockup();

  // Tiga panel rincian tampil sesuai kebutuhan alur produksi
  const panelKategori = document.getElementById('panelKategori');
  const panelSablon   = document.getElementById('panelSablon');
  const panelScreen   = document.getElementById('panelScreen');
  if (panelKategori) panelKategori.hidden = !cfg.kategori;
  if (panelSablon)   panelSablon.hidden   = !cfg.sablon;
  if (panelScreen)   panelScreen.hidden   = !cfg.screen;

  // Kebutuhan material hanya relevan untuk alur yang memakai kategori & ukuran
  const panelMaterial = document.getElementById('panelMaterial');
  if (panelMaterial) panelMaterial.hidden = !cfg.kategori;

  const subItem = document.getElementById('subBlokItem');
  if (subItem) subItem.innerHTML = cfg.subItem;

  renderTombolTambahItem();

  // Ganti alur = struktur kartu berbeda, jadi rincian lama dikosongkan
  if (resetItem) {
    ['itemRows', 'sablonRows', 'screenRows'].forEach(function (id) {
      const el = document.getElementById(id);
      if (el) el.innerHTML = '';
    });
    AppState.katSeq = 0;
    tambahKartuAwal();
  }

  nomorUlangBlok();
  hitungTotalOrder();
}

/** Nomor blok mengikuti blok yang benar-benar tampil. */
function nomorUlangBlok() {
  let n = 0;
  ['blokCustomer', 'blokBahan', 'blokItem', 'blokMockup', 'blokKalkulasi'].forEach(function (id) {
    const blok = document.getElementById(id);
    if (!blok || blok.hidden) return;
    n++;
    const badge = blok.querySelector('.block-num');
    if (badge && !badge.querySelector('i')) badge.textContent = n;
  });
}

/** Tombol tambah kategori pada panel rincian ukuran. */
function renderTombolTambahItem() {
  const box = document.getElementById('itemAddRow');
  if (!box) return;
  box.innerHTML = ['Cowok', 'Cewek', 'Anak'].map(function (k) {
    return '<button type="button" class="pill-add" onclick="tambahKategori(\'' + k + '\')">' +
      '<i class="bi bi-plus-lg"></i> ' + k + '</button>';
  }).join('') +
  '<button type="button" class="pill-add" onclick="tambahKategori(\'Manual\')">' +
    '<i class="bi bi-pencil"></i> Isi Manual</button>';
}

/** Kartu pertama saat form dibuka / alur diganti. */
function tambahKartuAwal() {
  const cfg = konfigAlur();
  if (cfg.kategori) tambahKategori('Cowok');
  if (cfg.sablon)   tambahItemSablon();
  if (cfg.screen)   tambahItemScreen();
}

function isiPilihanCustomer() {
  const sel = document.getElementById('custExisting');
  if (!sel) return;
  sel.innerHTML = '<option value="">— Pilih customer —</option>' +
    AppState.customers.map(function (c) {
      return '<option value="' + escapeAttr(c.ID) + '" data-wa="' + escapeAttr(c.WhatsApp || '') + '">' +
        escapeHtml(c.NamaCustomer) + (c.WhatsApp ? ' · ' + escapeHtml(c.WhatsApp) : '') + '</option>';
    }).join('');
}

function pilihCustomerLama() {
  const sel = document.getElementById('custExisting');
  const opt = sel.options[sel.selectedIndex];
  if (!sel.value) return;
  const cust = AppState.customers.filter(function (c) { return c.ID === sel.value; })[0];
  if (cust) {
    document.getElementById('custNama').value = cust.NamaCustomer || '';
    document.getElementById('custWa').value = cust.WhatsApp || '';
  } else if (opt) {
    document.getElementById('custNama').value = opt.textContent.split(' · ')[0];
  }
}


/**
 * Kartu KATEGORI — mode 'matrix' (Full Order, Jahit Saja) dan 'hybrid' (Jahit + Sablon).
 * Satu kartu = satu kategori, satu harga/pcs, dan matriks jumlah per ukuran.
 */
function tambahKategori(kategori) {
  const id     = ++AppState.katSeq;
  const manual = (kategori === 'Manual');

  const wrap = document.createElement('div');
  wrap.className = 'kat-card';
  wrap.id = 'kat-' + id;
  wrap.dataset.mode = 'matrix';

  wrap.innerHTML =
    '<div class="kat-head">' +
      '<div class="kat-ident">' +
        (manual
          ? '<input type="text" class="kat-name-input" data-f="kategori" placeholder="Nama kategori">'
          : '<span class="kat-name" data-f="kategori" data-nilai="' + escapeAttr(kategori) + '">' +
            escapeHtml(kategori) + '</span>') +
        '<select class="kat-produk" data-f="produk" data-terakhir="Kaos" ' +
          'onchange="pilihProduk(' + id + ',this)">' + opsiProduk('Kaos') + '</select>' +
      '</div>' +
      '<div class="kat-harga"><label>Harga/pcs</label>' +
        '<input type="text" inputmode="numeric" data-f="harga" ' +
        'placeholder="0" oninput="formatRibuan(this)"></div>' +
      '<button type="button" class="btn-hapus-kat" onclick="hapusKartuItem(' + id + ')">Hapus</button>' +
    '</div>' +

    // Kotak isian jenis produk baru (muncul saat memilih "+ Tambah Jenis Produk")
    '<div class="produk-baru" id="produkBaru-' + id + '" hidden>' +
      '<input type="text" class="input" placeholder="Nama jenis produk, mis. Hoodie / Kemeja / Jaket" ' +
      'onkeydown="if(event.key===\'Enter\'){event.preventDefault();tambahJenisProduk(' + id + ')}">' +
      '<button type="button" class="btn-primary" onclick="tambahJenisProduk(' + id + ')">Simpan</button>' +
      '<button type="button" class="btn-remove" onclick="this.parentNode.hidden=true">' +
        '<i class="bi bi-x-lg"></i></button>' +
    '</div>' +

    '<div class="size-grid">' +
      UKURAN_BAKU.map(function (u) {
        return '<div class="size-cell"><label>' + u + '</label>' +
          '<input type="text" inputmode="numeric" placeholder="0" ' +
          'data-size="' + u + '" oninput="hanyaAngka(this)"></div>';
      }).join('') +
    '</div>' +

    '<div class="manual-rows"></div>' +
    '<button type="button" class="link-add" onclick="tambahUkuranManual(' + id + ')">' +
      '<i class="bi bi-plus"></i> Tambah ukuran manual</button>' +

    '<div class="kat-sub"><span>Subtotal kategori</span>' +
      '<b><span data-sub-qty>0 pcs</span> · <span class="rp" data-sub-rp>Rp 0</span></b></div>';

  document.getElementById('itemRows').appendChild(wrap);
  isiHargaOtomatisKat(id);
}

/**
 * Kartu RINCIAN ITEM SABLON — jumlah pcs, warna sablon depan/belakang, harga satuan.
 * Dipakai pada alur "Sablon Saja" dan "Jahit + Sablon".
 */
function tambahItemSablon() {
  const id = ++AppState.katSeq;
  const urut = document.querySelectorAll('#sablonRows .kat-card').length + 1;
  const wrap = document.createElement('div');
  wrap.className = 'kat-card';
  wrap.id = 'kat-' + id;
  wrap.dataset.mode = 'sablon';

  wrap.innerHTML =
    '<div class="kat-head">' +
      '<div class="kat-ident"><span class="kat-name">Item Sablon #' + urut + '</span></div>' +
      '<button type="button" class="btn-hapus-kat" onclick="hapusKartuItem(' + id + ')">Hapus</button>' +
    '</div>' +

    '<div class="sablon-grid">' +
      '<div class="field"><label>Jumlah (pcs)</label>' +
        '<input type="text" class="input" data-f="jumlah" placeholder="0" ' +
        'inputmode="numeric" oninput="hanyaAngka(this)"></div>' +
      '<div class="field"><label>Warna Sablon Depan</label>' +
        '<input type="text" class="input" data-f="warnaDepan" placeholder="Putih solid + Teal"></div>' +
      '<div class="field"><label>Warna Sablon Belakang</label>' +
        '<input type="text" class="input" data-f="warnaBelakang" placeholder="2 warna separasi"></div>' +
      '<div class="field"><label>Harga Satuan (Rp)</label>' +
        '<input type="text" class="input" data-f="harga" placeholder="0" ' +
        'inputmode="numeric" oninput="formatRibuan(this)"></div>' +
    '</div>' +

    '<div class="kat-sub"><span>Subtotal item</span>' +
      '<b><span data-sub-qty>0 pcs</span> · <span class="rp" data-sub-rp>Rp 0</span></b></div>';

  document.getElementById('sablonRows').appendChild(wrap);
  hitungTotalOrder();
}

/**
 * Kartu RINCIAN SCREEN SABLON — jumlah screen dan harga satuannya.
 * Dipakai pada alur "Sablon Saja" dan "Jahit + Sablon".
 */
function tambahItemScreen() {
  const id = ++AppState.katSeq;
  const urut = document.querySelectorAll('#screenRows .kat-card').length + 1;
  const wrap = document.createElement('div');
  wrap.className = 'kat-card';
  wrap.id = 'kat-' + id;
  wrap.dataset.mode = 'screen';

  wrap.innerHTML =
    '<div class="kat-head">' +
      '<div class="kat-ident"><span class="kat-name">Screen #' + urut + '</span></div>' +
      '<button type="button" class="btn-hapus-kat" onclick="hapusKartuItem(' + id + ')">Hapus</button>' +
    '</div>' +

    '<div class="sablon-grid">' +
      '<div class="field"><label>Jumlah Screen (pcs)</label>' +
        '<input type="text" class="input" data-f="jumlah" placeholder="0" ' +
        'inputmode="numeric" oninput="hanyaAngka(this)"></div>' +
      '<div class="field"><label>Harga Satuan (Rp)</label>' +
        '<input type="text" class="input" data-f="harga" placeholder="0" ' +
        'inputmode="numeric" oninput="formatRibuan(this)"></div>' +
    '</div>' +

    '<div class="kat-sub"><span>Subtotal screen</span>' +
      '<b><span data-sub-qty>0 pcs</span> · <span class="rp" data-sub-rp>Rp 0</span></b></div>';

  document.getElementById('screenRows').appendChild(wrap);
  hitungTotalOrder();
}

/** Baris ukuran di luar daftar baku (Custom Size). */
function tambahUkuranManual(id) {
  const card = document.getElementById('kat-' + id);
  if (!card) return;
  const box = card.querySelector('.manual-rows');
  const row = document.createElement('div');
  row.className = 'manual-row';
  row.innerHTML =
    '<div class="field manual-label"><label>Custom Size</label>' +
      '<input type="text" class="input" data-mlabel placeholder="Contoh: 4L / Jumbo"></div>' +
    '<div class="field manual-qty"><label>Jumlah</label>' +
      '<input type="text" class="input" data-mqty placeholder="0" ' +
      'inputmode="numeric" oninput="hanyaAngka(this)"></div>' +
    '<button type="button" class="btn-remove" onclick="this.parentNode.remove();hitungTotalOrder()" ' +
      'title="Hapus ukuran"><i class="bi bi-x-lg"></i></button>';
  box.appendChild(row);
}

/** Hapus kartu kategori / item. */
function hapusKartuItem(id) {
  const el = document.getElementById('kat-' + id);
  if (el) el.remove();
  hitungTotalOrder();
}

/**
 * Isi Harga/pcs otomatis dari Master Harga (tanpa panggilan server → instan).
 * Acuan harga memakai ukuran M pada kombinasi produk + kategori tersebut,
 * lalu dapat ditimpa manual oleh Owner.
 */
function isiHargaOtomatisKat(id) {
  const card = document.getElementById('kat-' + id);
  if (!card) return;
  const produk = card.querySelector('[data-f="produk"]').value;
  const katEl  = card.querySelector('[data-f="kategori"]');
  const kategori = katEl ? (katEl.dataset.nilai || katEl.value || '') : '';
  const input  = card.querySelector('[data-f="harga"]');

  if (kategori) {
    const cocok = AppState.masterHarga.filter(function (h) {
      return h.JenisProduk === produk && h.Kategori === kategori && String(h.Ukuran) === 'M';
    })[0];
    if (cocok) input.value = (Number(cocok.Harga) || 0).toLocaleString('id-ID');
  }
  hitungTotalOrder();
}

/**
 * Hitung ulang satu panel rincian.
 * @return {object} { qty, total, jumlahKartu }
 */
function hitungPanel(wadahId, totalId, kosongTeks) {
  const wadah = document.getElementById(wadahId);
  if (!wadah) return { qty: 0, total: 0, jumlahKartu: 0 };

  const kartu = wadah.querySelectorAll('.kat-card');
  const kosong = wadah.querySelector('.item-empty');
  if (!kartu.length) {
    if (!kosong) {
      wadah.innerHTML = '<div class="item-empty"><i class="bi bi-inbox"></i>' +
        escapeHtml(kosongTeks) + '</div>';
    }
  } else if (kosong) {
    kosong.remove();
  }

  let qtyPanel = 0, totalPanel = 0;

  kartu.forEach(function (card) {
    let qty = 0;
    if (card.dataset.mode === 'matrix') {
      card.querySelectorAll('[data-size]').forEach(function (inp) {
        const v = parseAngka(inp.value);
        qty += v;
        inp.classList.toggle('terisi', v > 0);
      });
      card.querySelectorAll('.manual-row').forEach(function (row) {
        qty += nilaiInput(row.querySelector('[data-mqty]'));
      });
    } else {
      qty = nilaiInput(card.querySelector('[data-f="jumlah"]'));
    }

    const harga = nilaiInput(card.querySelector('[data-f="harga"]'));
    const sub = qty * harga;
    qtyPanel += qty;
    totalPanel += sub;

    card.querySelector('[data-sub-qty]').textContent = qty + ' pcs';
    card.querySelector('[data-sub-rp]').textContent = rupiah(sub);
  });

  const totalEl = document.getElementById(totalId);
  if (totalEl) totalEl.textContent = qtyPanel + ' pcs';

  return { qty: qtyPanel, total: totalPanel, jumlahKartu: kartu.length };
}

/** Hitung ulang seluruh subtotal, total, DP, dan sisa secara real-time. */
function hitungTotalOrder() {
  const cfg = konfigAlur();

  const kategori = hitungPanel('itemRows', 'itemPanelTotal',
    'Belum ada kategori. Tekan tombol di atas untuk menambahkan.');
  const sablon = hitungPanel('sablonRows', 'sablonPanelTotal',
    'Belum ada item sablon. Tekan "Tambah Item Sablon".');
  const screen = hitungPanel('screenRows', 'screenPanelTotal',
    'Belum ada screen. Tekan "Tambah Screen".');

  // Panel yang tidak dipakai alur ini tidak ikut dihitung
  let qtyTotal = 0, total = 0;
  if (cfg.kategori) { qtyTotal += kategori.qty; total += kategori.total; }
  if (cfg.sablon)   { qtyTotal += sablon.qty;   total += sablon.total; }
  if (cfg.screen)   { qtyTotal += screen.qty;   total += screen.total; }

  const dp = nilaiInput(document.getElementById('orderDp'));
  const sisa = Math.max(0, total - dp);

  document.getElementById('calcQty').textContent = qtyTotal + ' pcs';
  document.getElementById('calcSubtotal').textContent = rupiah(total);
  document.getElementById('calcTotal').textContent = rupiah(total);
  document.getElementById('calcSisa').textContent = rupiah(sisa);
  document.getElementById('chipJumlahItem').textContent = cfg.kategori
    ? kategori.jumlahKartu + ' kategori'
    : sablon.jumlahKartu + ' item';

  const status = dp <= 0 ? 'Belum Bayar' : (dp >= total && total > 0 ? 'Lunas' : 'DP');
  const chip = document.getElementById('chipStatusBayar');
  chip.textContent = status;
  chip.className = 'chip ' + kelasChipBayar(status);

  const box = document.querySelector('.sisa-box');
  if (box) box.classList.toggle('lunas', sisa === 0 && total > 0);

  // Kebutuhan material ikut terhitung ulang di sini — tidak ada tombol "Hitung"
  renderMaterialForm();
}

/**
 * Gambar ulang RINCIAN MATERIAL pada form order.
 * Sumber datanya persis sama dengan yang nanti dikirim ke server
 * (kumpulkanItems), jadi tidak ada input jumlah kedua yang terpisah.
 */
function renderMaterialForm() {
  const kotak = document.getElementById('materialRows');
  if (!kotak) return;

  const bahan = (document.getElementById('orderBahan') || {}).value || '';
  const label = document.getElementById('materialBahan');
  if (label) label.textContent = 'Bahan: ' + (bahan.trim() || '—');

  const items = kumpulkanItems().filter(function (i) { return i.ukuran && i.ukuran !== '-'; });
  kotak.innerHTML = htmlRincianMaterial(
    materialTerpakai(items, bahan),
    { bahan: bahan, adaItem: items.length > 0 }
  );
}

/** Bentuk ringkas hasil material untuk disimpan bersama order. */
function arsipMaterial(items) {
  const bahan = konfigAlur().bahan
    ? (document.getElementById('orderBahan').value || '').trim() : '';
  const berukuran = (items || []).filter(function (i) { return i.ukuran && i.ukuran !== '-'; });

  return materialTerpakai(berukuran, bahan)
    .filter(function (m) { return !m.error; })
    .map(function (m) {
      return { id: m.id, nama: m.nama, satuan: m.satuan, rumus: m.rumus, hasil: m.hasil };
    });
}

/**
 * Ubah kartu-kartu di layar menjadi daftar item datar untuk dikirim ke server.
 * Satu ukuran dengan jumlah > 0 menjadi satu baris Order_Item.
 */
function kumpulkanItems() {
  const cfg = konfigAlur();
  const items = [];

  // ── Panel A: kategori & ukuran ──────────────────────────
  if (cfg.kategori) {
    document.querySelectorAll('#itemRows .kat-card').forEach(function (card) {
      const harga  = nilaiInput(card.querySelector('[data-f="harga"]'));
      const produk = card.querySelector('[data-f="produk"]').value;
      const katEl  = card.querySelector('[data-f="kategori"]');
      const kategori = (katEl.dataset.nilai || katEl.value || 'Lainnya').trim() || 'Lainnya';

      card.querySelectorAll('[data-size]').forEach(function (inp) {
        const jumlah = parseAngka(inp.value);
        if (jumlah <= 0) return;
        items.push({
          jenisProduk: produk, kategori: kategori,
          ukuran: inp.dataset.size, ukuranCustom: '',
          jumlah: jumlah, hargaSatuan: harga,
          warnaSablonDepan: '', warnaSablonBelakang: ''
        });
      });

      card.querySelectorAll('.manual-row').forEach(function (row) {
        const jumlah = nilaiInput(row.querySelector('[data-mqty]'));
        const label  = (row.querySelector('[data-mlabel]').value || '').trim();
        if (jumlah <= 0) return;
        items.push({
          jenisProduk: produk, kategori: kategori,
          ukuran: 'Custom', ukuranCustom: label || 'Custom Size',
          jumlah: jumlah, hargaSatuan: harga,
          warnaSablonDepan: '', warnaSablonBelakang: ''
        });
      });
    });
  }

  // ── Panel B: item sablon ────────────────────────────────
  if (cfg.sablon) {
    document.querySelectorAll('#sablonRows .kat-card').forEach(function (card) {
      const jumlah = nilaiInput(card.querySelector('[data-f="jumlah"]'));
      if (jumlah <= 0) return;
      items.push({
        jenisProduk: 'Jasa Sablon', kategori: '-', ukuran: '-', ukuranCustom: '',
        jumlah: jumlah,
        hargaSatuan: nilaiInput(card.querySelector('[data-f="harga"]')),
        warnaSablonDepan: (card.querySelector('[data-f="warnaDepan"]') || {}).value || '',
        warnaSablonBelakang: (card.querySelector('[data-f="warnaBelakang"]') || {}).value || ''
      });
    });
  }

  // ── Panel C: screen sablon ──────────────────────────────
  if (cfg.screen) {
    document.querySelectorAll('#screenRows .kat-card').forEach(function (card) {
      const jumlah = nilaiInput(card.querySelector('[data-f="jumlah"]'));
      if (jumlah <= 0) return;
      items.push({
        jenisProduk: 'Screen Sablon', kategori: '-', ukuran: '-', ukuranCustom: '',
        jumlah: jumlah,
        hargaSatuan: nilaiInput(card.querySelector('[data-f="harga"]')),
        warnaSablonDepan: '', warnaSablonBelakang: ''
      });
    });
  }

  return items;
}

/** Dipanggil dari input file. */
function pratinjauMockup(input) {
  const file = input.files && input.files[0];
  if (file) terimaFileMockup(file);
}

/**
 * Terima satu berkas gambar mockup dari mana pun asalnya:
 * pilih file, drag & drop, atau tempel (Ctrl + V).
 */
function terimaFileMockup(file) {
  if (!file) return;
  if (String(file.type || '').indexOf('image/') !== 0) {
    toast('Bukan gambar', 'Hanya berkas gambar (PNG/JPG) yang bisa dijadikan mockup.', 'warning');
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    toast('Ukuran terlalu besar', 'Maksimal 5 MB. Kompres gambar terlebih dahulu.', 'warning');
    return;
  }

  const reader = new FileReader();
  reader.onload = function () {
    const dataUrl = reader.result;
    const nama = file.name || ('tempel-' + Date.now() + '.png');
    AppState.mockup = {
      base64: String(dataUrl).split(',')[1],
      nama: nama,
      mime: file.type || 'image/png'
    };
    const img = document.getElementById('mockupPreview');
    img.src = dataUrl; img.hidden = false;
    document.getElementById('uploadPlaceholder').hidden = true;
    const info = document.getElementById('mockupInfo');
    info.hidden = false;
    info.innerHTML = '<span><i class="bi bi-image"></i> ' + escapeHtml(nama) + ' · ' +
      (file.size / 1024 / 1024).toFixed(2) + ' MB</span>' +
      '<button type="button" class="btn-remove" onclick="hapusMockup()"><i class="bi bi-x-lg"></i></button>';
  };
  reader.readAsDataURL(file);
}

/** Pasang penerima drag & drop dan tempel (Ctrl + V) pada area mockup. */
function siapkanAreaMockup() {
  const zona = document.getElementById('uploadZone');
  if (!zona || zona.dataset.siap === '1') return;
  zona.dataset.siap = '1';

  ['dragenter', 'dragover'].forEach(function (ev) {
    zona.addEventListener(ev, function (e) {
      e.preventDefault(); e.stopPropagation();
      zona.classList.add('seret');
    });
  });
  ['dragleave', 'drop'].forEach(function (ev) {
    zona.addEventListener(ev, function (e) {
      e.preventDefault(); e.stopPropagation();
      zona.classList.remove('seret');
    });
  });
  zona.addEventListener('drop', function (e) {
    const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
    if (f) terimaFileMockup(f);
  });

  // Ctrl + V: aktif saat halaman Buat Order Baru terbuka
  document.addEventListener('paste', function (e) {
    if (AppState.currentPage !== 'tambah') return;
    if (!konfigAlur().mockup) return;
    const item = [].slice.call((e.clipboardData || {}).items || [])
      .filter(function (i) { return String(i.type || '').indexOf('image/') === 0; })[0];
    if (!item) return;
    e.preventDefault();
    const f = item.getAsFile();
    if (f) { terimaFileMockup(f); toast('Mockup ditempel', 'Gambar dari clipboard berhasil dimuat.', 'success'); }
  });
}

function hapusMockup() {
  AppState.mockup = null;
  document.getElementById('mockupInput').value = '';
  const img = document.getElementById('mockupPreview');
  img.hidden = true; img.src = '';
  document.getElementById('uploadPlaceholder').hidden = false;
  document.getElementById('mockupInfo').hidden = true;
}

// ══════════════════════════════════════════════════════════
// BAGIAN 8B: UBAH ORDER YANG SUDAH ADA
// ══════════════════════════════════════════════════════════

/** Buka form dengan data order yang sudah tersimpan. */
function editOrder(nomorOrder) {
  busy(true, 'Memuat data order…');
  apiCall('getOrderDetail', { nomor: nomorOrder })
    .then(function (res) {
      busy(false);
      if (!res || !res.success) { toast('Gagal', res ? res.message : 'Tidak ada respons.', 'danger'); return; }
      isiFormDariOrder(res.data);
      navigateTo('tambah');
    })
    .catch(function (err) { busy(false); toast('Error', pesanError(err), 'danger'); });
}

/** Isi seluruh field form dari sebuah order, lalu masuk mode ubah. */
function isiFormDariOrder(d) {
  const o = d.order, spk = d.spk;
  AppState.editingOrder = o.NomorOrder;
  setModeFormOrder(true, o.NomorOrder);

  // 1. Alur produksi lebih dulu — struktur kartu bergantung padanya
  const tombol = document.querySelectorAll('#alurProduksi .alur-btn');
  const petaAlur = { 'Full Order': 0, 'Sablon': 1, 'Jahit': 2, 'Jahit + Sablon': 3 };
  const idx = petaAlur[o.JenisOrder] !== undefined ? petaAlur[o.JenisOrder] : 0;
  jenisOrderTerpilih = o.JenisOrder || 'Full Order';
  tombol.forEach(function (b, i) { b.classList.toggle('active', i === idx); });
  terapkanAlurProduksi(false);

  // 2. Data customer & project
  const seg = document.querySelectorAll('#section-tambah .seg-control .seg-btn');
  if (seg.length >= 2) setModeCustomer(seg[0], 'lama');
  const selCust = document.getElementById('custExisting');
  selCust.value = AppState.customers.some(function (c) { return c.ID === o.IDCustomer; }) ? o.IDCustomer : '';
  document.getElementById('custNama').value = o.NamaCustomer || '';
  document.getElementById('custWa').value = o.WhatsApp || '';
  document.getElementById('orderProject').value = o.NamaProject || '';
  document.getElementById('orderDeadline').value = String(o.TanggalDeadline || '').substring(0, 10);
  document.getElementById('orderBahan').value = o.Bahan || '';
  document.getElementById('orderWarna').value = o.WarnaBahan || '';
  document.getElementById('sablonDepan').value = o.SablonDepan || '';
  document.getElementById('sablonBelakang').value = o.SablonBelakang || '';
  document.getElementById('orderJenisSablon').value = o.JenisSablon || '';
  document.getElementById('detailPekerjaan').value = (spk && spk.DetailPekerjaan) || '';
  document.getElementById('catatanProduksi').value = (spk && spk.CatatanProduksi) || '';
  document.getElementById('orderCatatan').value = o.CatatanTambahan || '';

  // 3. Bangun ulang kartu rincian dari item tersimpan
  bangunKartuDariItems(o.Items || []);

  // 4. Mockup lama (bisa diganti dengan unggah/tempel baru)
  hapusMockup();
  if (o.MockupUrl) {
    const img = document.getElementById('mockupPreview');
    img.src = urlThumbDrive(o.MockupUrl, 800); img.hidden = false;
    document.getElementById('uploadPlaceholder').hidden = true;
    const info = document.getElementById('mockupInfo');
    info.hidden = false;
    info.innerHTML = '<span><i class="bi bi-image"></i> Mockup tersimpan — unggah / tempel gambar ' +
      'baru bila ingin mengganti</span>';
  }

  // 5. DP awal saja — pembayaran susulan tetap utuh dan tidak diubah dari sini
  const barisDp = (d.pembayaran || []).filter(function (p) {
    return String(p.CatatanPembayaran || '') === 'Down Payment saat order dibuat';
  })[0];
  const dp = barisDp ? toAngka(barisDp.JumlahDibayar) : 0;
  document.getElementById('orderDp').value = dp ? dp.toLocaleString('id-ID') : '';
  const hint = document.getElementById('hintDp');
  const lain = (d.pembayaran || []).length - (barisDp ? 1 : 0);
  if (hint) hint.textContent = lain > 0
    ? 'Ini DP awal. ' + lain + ' pembayaran susulan tetap tersimpan dan tidak ikut berubah.'
    : 'Minimal DP yang disarankan: ' + (AppState.config.minDpPersen || 50) + '%.';

  hitungTotalOrder();
  toast('Mode ubah', 'Order ' + o.NomorOrder + ' siap diubah.', 'info');
}

function toAngka(v) { return Number(v) || 0; }

/** Ubah kembali daftar item datar menjadi kartu-kartu pada form. */
function bangunKartuDariItems(items) {
  ['itemRows', 'sablonRows', 'screenRows'].forEach(function (id) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = '';
  });
  AppState.katSeq = 0;

  const grup = {}, urutan = [];
  items.forEach(function (i) {
    const uk = String(i.Ukuran || '-').trim();

    if (i.JenisProduk === 'Screen Sablon') {
      tambahItemScreen();
      const c = document.querySelector('#screenRows .kat-card:last-child');
      c.querySelector('[data-f="jumlah"]').value = toAngka(i.Jumlah);
      c.querySelector('[data-f="harga"]').value = toAngka(i.HargaSatuan).toLocaleString('id-ID');
      return;
    }
    if (!uk || uk === '-') {
      tambahItemSablon();
      const c = document.querySelector('#sablonRows .kat-card:last-child');
      c.querySelector('[data-f="jumlah"]').value = toAngka(i.Jumlah);
      c.querySelector('[data-f="harga"]').value = toAngka(i.HargaSatuan).toLocaleString('id-ID');
      c.querySelector('[data-f="warnaDepan"]').value = i.WarnaSablonDepan || '';
      c.querySelector('[data-f="warnaBelakang"]').value = i.WarnaSablonBelakang || '';
      return;
    }

    const kunci = [i.JenisProduk, i.Kategori, i.HargaSatuan].join('||');
    if (!grup[kunci]) { grup[kunci] = []; urutan.push(kunci); }
    grup[kunci].push(i);
  });

  urutan.forEach(function (k) {
    const baris = grup[k];
    const contoh = baris[0];
    const bawaan = ['Cowok', 'Cewek', 'Anak'].indexOf(contoh.Kategori) !== -1;

    tambahKategori(bawaan ? contoh.Kategori : 'Manual');
    const card = document.querySelector('#itemRows .kat-card:last-child');
    const id = card.id.split('-')[1];

    if (!bawaan) card.querySelector('[data-f="kategori"]').value = contoh.Kategori || '';

    // Jenis produk mungkin custom — daftarkan agar bisa dipilih
    const sel = card.querySelector('[data-f="produk"]');
    const produk = contoh.JenisProduk || 'Kaos';
    if (!daftarProduk().some(function (p) { return p === produk; })) {
      AppState.produkKustom = (AppState.produkKustom || []).concat([produk]);
      simpanProdukKustom();
      document.querySelectorAll('#itemRows [data-f="produk"]').forEach(function (s2) {
        s2.innerHTML = opsiProduk(s2.value);
      });
    }
    sel.innerHTML = opsiProduk(produk);
    sel.dataset.terakhir = produk;

    card.querySelector('[data-f="harga"]').value =
      toAngka(contoh.HargaSatuan).toLocaleString('id-ID');

    baris.forEach(function (i) {
      if (String(i.Ukuran) === 'Custom') {
        tambahUkuranManual(id);
        const row = card.querySelector('.manual-row:last-child');
        row.querySelector('[data-mlabel]').value = i.UkuranCustom || 'Custom Size';
        row.querySelector('[data-mqty]').value = toAngka(i.Jumlah);
      } else {
        const kotak = card.querySelector('[data-size="' + i.Ukuran + '"]');
        if (kotak) kotak.value = toAngka(i.Jumlah);
      }
    });
  });

  hitungTotalOrder();
}

/** Ganti judul, tombol, dan penanda form sesuai mode (baru / ubah). */
function setModeFormOrder(mode, nomorOrder) {
  const judul  = document.getElementById('judulFormOrder');
  const sub    = document.getElementById('subFormOrder');
  const banner = document.getElementById('editBanner');
  const chip   = document.getElementById('stepIndicator');
  const label  = document.getElementById('labelSimpanOrder');

  if (mode) {
    judul.textContent = 'Ubah Order';
    sub.textContent = 'Perubahan langsung menyesuaikan SPK dan invoice yang sudah ada';
    document.getElementById('editNomorOrder').textContent = nomorOrder;
    banner.hidden = false;
    chip.textContent = 'Mode Ubah';
    label.innerHTML = 'Simpan Perubahan Order';
  } else {
    judul.textContent = 'Buat Order Baru';
    sub.textContent = 'Input customer, item, sablon, dan pembayaran';
    banner.hidden = true;
    chip.textContent = 'Order Baru';
    label.innerHTML = 'Simpan Order &amp; Terbitkan SPK';
  }
}

/** Keluar dari mode ubah tanpa menyimpan. */
function batalEditOrder() {
  const nomor = AppState.editingOrder;
  AppState.editingOrder = null;
  resetFormOrder();
  if (nomor) bukaDetail(nomor); else navigateTo('daftar');
}

function resetFormOrder() {
  AppState.editingOrder = null;
  setModeFormOrder(false);
  document.getElementById('formOrder').reset();
  ['itemRows', 'sablonRows', 'screenRows'].forEach(function (id) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = '';
  });
  AppState.katSeq = 0;
  hapusMockup();

  // Kembalikan pilihan alur ke Full Order, lalu bangun ulang kartu awal
  const tombolPertama = document.querySelector('#alurProduksi .alur-btn');
  if (tombolPertama) {
    tombolPertama.parentNode.querySelectorAll('.alur-btn').forEach(function (b) {
      b.classList.remove('active');
    });
    tombolPertama.classList.add('active');
  }
  jenisOrderTerpilih = 'Full Order';
  terapkanAlurProduksi(true);
  toast('Form direset', 'Silakan isi order baru.', 'info');
}

/** Simpan order ke server. */
function simpanOrder(event) {
  event.preventDefault();

  const nama = document.getElementById('custNama').value.trim();
  const project = document.getElementById('orderProject').value.trim();
  const deadline = document.getElementById('orderDeadline').value;

  if (!nama)     { toast('Belum lengkap', 'Nama customer wajib diisi.', 'warning'); return; }
  if (!project)  { toast('Belum lengkap', 'Nama project wajib diisi.', 'warning'); return; }
  if (!deadline) { toast('Belum lengkap', 'Target deadline wajib diisi.', 'warning'); return; }

  const items = kumpulkanItems();
  const modeSablon = (konfigAlur().modeItem === 'sablon');

  if (!items.length) {
    toast('Belum lengkap', modeSablon
      ? 'Isi jumlah pcs pada minimal satu item sablon.'
      : 'Isi jumlah pcs pada minimal satu ukuran.', 'warning');
    return;
  }
  if (items.some(function (i) { return i.hargaSatuan <= 0; })) {
    toast('Harga kosong', modeSablon
      ? 'Setiap item sablon harus memiliki harga satuan.'
      : 'Setiap kategori harus memiliki Harga/pcs.', 'warning');
    return;
  }

  const payload = {
    customer: {
      id: (modeCustomer === 'lama') ? (document.getElementById('custExisting').value || '') : '',
      nama: nama,
      whatsapp: document.getElementById('custWa').value.trim(),
      alamat: ''
    },
    project        : project,
    tanggalDeadline: deadline,
    jenisOrder     : jenisOrderTerpilih,
    // Field yang tidak relevan untuk alur terpilih dikirim kosong,
    // supaya tidak ada sisa isian dari alur yang sebelumnya dipilih.
    bahan          : konfigAlur().bahan  ? document.getElementById('orderBahan').value.trim() : '',
    warnaBahan     : konfigAlur().bahan  ? document.getElementById('orderWarna').value.trim() : '',
    sablonDepan    : konfigAlur().mockup ? document.getElementById('sablonDepan').value.trim() : '',
    sablonBelakang : konfigAlur().mockup ? document.getElementById('sablonBelakang').value.trim() : '',
    jenisSablon    : konfigAlur().mockup
      ? document.getElementById('orderJenisSablon').value.trim() : '',
    detailPekerjaan: document.getElementById('detailPekerjaan').value.trim(),
    catatanProduksi: document.getElementById('catatanProduksi').value.trim(),
    catatan        : document.getElementById('orderCatatan').value.trim(),
    dp             : nilaiInput(document.getElementById('orderDp')),
    metodeBayar    : document.getElementById('metodeBayar').value,
    items          : items,
    mockup         : AppState.mockup,
    // Kebutuhan material ikut dikirim sebagai ARSIP: angkanya persis yang
    // dilihat Owner di layar saat menyimpan, beserta teks rumus yang dipakai.
    // Mengubah rumus di kemudian hari tidak mengubah arsip order ini.
    material       : arsipMaterial(items)
  };

  const btn = document.getElementById('btnSimpanOrder');
  const teksAsli = btn.innerHTML;
  const nomorEdit = AppState.editingOrder;
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner-inline"></span> Menyimpan…';
  busy(true, AppState.mockup
    ? 'Mengunggah mockup & menyimpan…'
    : (nomorEdit ? 'Menyimpan perubahan order…' : 'Menyimpan order…'));

  const sukses = function (res) {
    busy(false);
    btn.disabled = false; btn.innerHTML = teksAsli;
    if (res && res.success) {
      toast(nomorEdit ? 'Perubahan tersimpan' : 'Order tersimpan', res.message, 'success');
      resetFormOrder();
      refreshSemua();
      if (nomorEdit) bukaDetail(nomorEdit); else navigateTo('daftar');
    } else {
      toast('Gagal menyimpan', res ? res.message : 'Tidak ada respons dari server.', 'danger');
    }
  };
  const gagal = function (err) {
    busy(false);
    btn.disabled = false; btn.innerHTML = teksAsli;
    toast('Error', pesanError(err), 'danger');
  };

  // Mengubah order yang sudah ada TIDAK membuat order baru
  if (nomorEdit) {
    apiCall('updateOrderLengkap', { nomor: nomorEdit, payload: payload })
      .then(sukses)
      .catch(gagal);
  } else {
    apiCall('saveOrder', { payload: payload })
      .then(sukses)
      .catch(gagal);
  }
}

// ══════════════════════════════════════════════════════════
// BAGIAN 13: PENGATURAN
// ══════════════════════════════════════════════════════════

function isiFormPengaturan() {
  const c = AppState.config || {};
  const set = function (id, nilai) { const el = document.getElementById(id); if (el) el.value = nilai || ''; };
  set('setAppName',  c.appName);
  set('setOwnerName',c.ownerName);
  set('setAlamat',   c.alamatUsaha);
  set('setTelp',     c.telpUsaha);
  set('setRekening', c.rekeningBank);
  set('setInstagram',c.instagramUsaha);
  set('setNoRek',    c.noRekening);
  set('setAtasNama', c.atasNamaRekening);
  set('setMinDp',    c.minDpPersen || 50);
  set('setWarning',  c.deadlineWarning || 3);
  // PIN tidak pernah dikirim server ke browser — kolomnya selalu dikosongkan
  set('setPin',  '');
  set('setPin2', '');

  renderDaftarCustomer();
  renderDaftarMaterial();
  segarkanPratinjauOg();
}

// ══════════════════════════════════════════════════════════
// BAGIAN 13D: RUMUS MATERIAL
//
// Seluruh rumus tersimpan sebagai baris di sheet Master_Material.
// Owner menambah, mengubah, dan menghapusnya dari sini — tidak perlu
// menyentuh kode aplikasi sama sekali.
// ══════════════════════════════════════════════════════════

/** Daftar material beserta rumus ringkasnya. */
function renderDaftarMaterial() {
  const box = document.getElementById('listMaterial');
  if (!box) return;

  const daftar = AppState.material || [];
  if (!daftar.length) {
    box.innerHTML = '<div class="empty-state"><i class="bi bi-rulers"></i>' +
      'Belum ada material. Tekan "Tambah Material" untuk membuat yang pertama.</div>';
    return;
  }

  box.innerHTML = daftar.map(function (m) {
    const aktif = m.Aktif !== false;
    const penyaring = [
      m.Produk ? escapeHtml(m.Produk) : 'semua produk',
      m.Bahan  ? 'bahan "' + escapeHtml(m.Bahan) + '"' : 'semua bahan'
    ].join(' · ');

    return '<div class="mat-row' + (aktif ? '' : ' nonaktif') + '">' +
      '<div class="mat-info">' +
        '<b>' + escapeHtml(m.Nama) +
          '<span class="mat-satuan">' + escapeHtml(m.Satuan || 'Kg') + '</span>' +
          (aktif ? '' : '<span class="mat-off">nonaktif</span>') +
        '</b>' +
        '<span class="mat-filter">' + penyaring + '</span>' +
        '<code class="mat-rumus">' +
          (String(m.Rumus || '').trim() ? escapeHtml(m.Rumus) : 'Rumus belum diisi') +
        '</code>' +
      '</div>' +
      '<div class="mat-aksi">' +
        '<button type="button" class="btn-ghost" onclick="bukaFormMaterial(\'' + escapeAttr(m.ID) + '\')">' +
          '<i class="bi bi-pencil"></i> Edit</button>' +
        '<button type="button" class="btn-remove" title="Hapus material" ' +
          'onclick="hapusMaterial(\'' + escapeAttr(m.ID) + '\',\'' + escapeAttr(m.Nama) + '\')">' +
          '<i class="bi bi-trash"></i></button>' +
      '</div>' +
    '</div>';
  }).join('');
}

/** Buka modal untuk menambah (id kosong) atau mengubah material. */
function bukaFormMaterial(id) {
  const m = (AppState.material || []).filter(function (x) { return x.ID === id; })[0] || {};
  const set = function (kotak, nilai) { document.getElementById(kotak).value = nilai || ''; };

  document.getElementById('materialTitle').textContent = id ? 'Ubah Rumus Material' : 'Material Baru';
  set('matId', m.ID || '');
  set('matNama', m.Nama || '');
  set('matSatuan', m.Satuan || 'Kg');
  set('matProduk', m.Produk || '');
  set('matBahan', m.Bahan || '');
  set('matRumus', m.Rumus || '');
  document.getElementById('matAktif').checked = (m.Aktif !== false);

  cobaRumusMaterial();
  new bootstrap.Modal(document.getElementById('materialModal')).show();
}

/**
 * Periksa rumus sambil diketik memakai contoh sederhana,
 * supaya kesalahan penulisan ketahuan sebelum disimpan.
 */
function cobaRumusMaterial() {
  const kotak = document.getElementById('matUji');
  if (!kotak) return;

  const rumus = (document.getElementById('matRumus').value || '').trim();
  if (!rumus) {
    kotak.className = 'mat-uji';
    kotak.innerHTML = 'Rumus masih kosong — material tidak akan ikut dihitung.';
    return;
  }

  // Contoh: 10 pcs di tiap ukuran untuk tiga kategori (70 pcs per kategori)
  const contoh = [];
  ['COWOK', 'CEWEK', 'ANAK'].forEach(function (kat) {
    UKURAN_BAKU.forEach(function (u) {
      contoh.push({ jenisProduk: 'Kaos', kategori: kat, ukuran: u, jumlah: 10 });
    });
  });

  const satuan = (document.getElementById('matSatuan').value || 'Kg').trim();
  try {
    const nilai = hitungRumus(rumus, pembacaVariabel(contoh,
      { Produk: '', Bahan: '' }, ''));
    if (!isFinite(nilai)) throw new Error('Hasil perhitungan tidak masuk akal.');
    kotak.className = 'mat-uji ok';
    kotak.innerHTML = '<i class="bi bi-check-circle"></i> Rumus terbaca. ' +
      'Contoh: bila tiap ukuran berisi 10 pcs untuk COWOK, CEWEK, dan ANAK → <b>' +
      escapeHtml(nilaiMaterial(nilai, satuan)) + '</b>';
  } catch (e) {
    kotak.className = 'mat-uji galat';
    kotak.innerHTML = '<i class="bi bi-exclamation-triangle"></i> ' + escapeHtml(e.message);
  }
}

/** Simpan material baru atau perubahan rumus. */
function simpanMaterial() {
  const nama = (document.getElementById('matNama').value || '').trim();
  if (!nama) { toast('Nama kosong', 'Isi nama material terlebih dahulu.', 'warning'); return; }

  const rumus = (document.getElementById('matRumus').value || '').trim();
  if (rumus) {
    try {
      hitungRumus(rumus, function () { return 0; });
    } catch (e) {
      toast('Rumus belum benar', e.message, 'danger');
      return;
    }
  }

  const data = {
    ID     : document.getElementById('matId').value || '',
    Nama   : nama,
    Satuan : (document.getElementById('matSatuan').value || 'Kg').trim() || 'Kg',
    Produk : (document.getElementById('matProduk').value || '').trim(),
    Bahan  : (document.getElementById('matBahan').value || '').trim(),
    Rumus  : rumus,
    Aktif  : document.getElementById('matAktif').checked
  };

  busy(true, 'Menyimpan rumus material…');
  apiCall('saveMaterial', { material: data })
    .then(function (res) {
      busy(false);
      if (!res || !res.success) {
        toast('Gagal', res ? res.message : 'Tidak ada respons.', 'danger');
        return;
      }
      tutupLapisanAtas();
      segarkanMaterial();
      toast('Tersimpan', res.message, 'success');
    })
    .catch(function (err) { busy(false); toast('Error', pesanError(err), 'danger'); });
}

/** Hapus satu material dari daftar rumus. */
function hapusMaterial(id, nama) {
  konfirmasi('Hapus Material',
    'Material "' + nama + '" akan dihapus dari daftar rumus.\n\n' +
    'Hasil perhitungan pada order yang sudah tersimpan TIDAK ikut terhapus — ' +
    'angka historisnya tetap tercatat.\n\nLanjutkan?',
    function () {
      busy(true, 'Menghapus material…');
      apiCall('deleteMaterial', { id: id })
        .then(function (res) {
          busy(false);
          if (!res || !res.success) {
            toast('Gagal', res ? res.message : 'Tidak ada respons.', 'danger');
            return;
          }
          segarkanMaterial();
          toast('Material dihapus', res.message, 'success');
        })
        .catch(function (err) { busy(false); toast('Error', pesanError(err), 'danger'); });
    });
}

/** Ambil ulang daftar material dari server lalu gambar ulang yang terpengaruh. */
function segarkanMaterial() {
  apiCall('getBootstrapData')
    .then(function (res) {
      if (!res || !res.success) return;
      AppState.material = res.data.material || [];
      simpanCacheLokal();
      renderDaftarMaterial();
      // Form order yang sedang terbuka ikut menyesuaikan rumus terbaru
      if (document.getElementById('materialRows')) renderMaterialForm();
    })
    .catch(function () { /* daftar akan segar saat data dimuat ulang */ });
}

// ══════════════════════════════════════════════════════════
// BAGIAN 13B: DATA CUSTOMER
// ══════════════════════════════════════════════════════════

/** Daftar customer aktif beserta jumlah order dan tombol Hapus. */
function renderDaftarCustomer() {
  const box = document.getElementById('listCustomer');
  if (!box) return;

  const kata = ((document.getElementById('cariCustomer') || {}).value || '')
    .toLowerCase().trim();

  const data = (AppState.customers || []).filter(function (c) {
    if (!kata) return true;
    return [c.NamaCustomer, c.WhatsApp, c.Alamat].join(' ').toLowerCase().indexOf(kata) !== -1;
  });

  if (!data.length) {
    box.innerHTML = '<div class="empty-state"><i class="bi bi-person-x"></i>' +
      (kata ? 'Tidak ada customer yang cocok.' : 'Belum ada data customer.') + '</div>';
    return;
  }

  box.innerHTML = data.map(function (c) {
    const jumlah = (AppState.orders || []).filter(function (o) {
      return o.IDCustomer === c.ID;
    }).length;

    return '<div class="cust-row">' +
      '<div class="cust-info">' +
        '<b>' + escapeHtml(c.NamaCustomer || '-') + '</b>' +
        '<span>' +
          (c.WhatsApp ? '<i class="bi bi-whatsapp"></i> ' + escapeHtml(c.WhatsApp) : 'Tanpa nomor WhatsApp') +
          (jumlah ? ' &nbsp;·&nbsp; ' + jumlah + ' order' : '') +
        '</span>' +
      '</div>' +
      '<button type="button" class="btn-remove" title="Hapus customer" ' +
        'onclick="hapusCustomer(\'' + escapeAttr(c.ID) + '\',\'' + escapeAttr(c.NamaCustomer || '') + '\',' + jumlah + ')">' +
        '<i class="bi bi-trash"></i></button>' +
    '</div>';
  }).join('');
}

/**
 * Hapus customer dari daftar.
 * Order, SPK, invoice, dan pembayaran TIDAK ikut terhapus — pesan konfirmasi
 * menyebutkan hal itu supaya Owner tahu apa yang sebenarnya terjadi.
 */
function hapusCustomer(id, nama, jumlahOrder) {
  const pesan = 'Customer "' + nama + '" akan dikeluarkan dari daftar pilihan customer.\n\n' +
    (jumlahOrder > 0
      ? jumlahOrder + ' order beserta SPK, invoice, dan riwayat pembayarannya TETAP TERSIMPAN ' +
        'dan tidak berubah sedikit pun.'
      : 'Customer ini belum punya order.') +
    '\n\nLanjutkan?';

  konfirmasi('Hapus Customer', pesan, function () {
    busy(true, 'Menghapus customer…');
    apiCall('deleteCustomer', { id: id })
      .then(function (res) {
        busy(false);
        if (!res || !res.success) {
          toast('Gagal', res ? res.message : 'Tidak ada respons.', 'danger');
          return;
        }
        // Hilangkan dari daftar lokal agar tampilan langsung berubah
        AppState.customers = (AppState.customers || []).filter(function (c) { return c.ID !== id; });
        simpanCacheLokal();
        renderDaftarCustomer();
        isiPilihanCustomer();      // dropdown pada form order ikut diperbarui
        toast('Customer dihapus', res.message, 'success');
      })
      .catch(function (err) { busy(false); toast('Error', pesanError(err), 'danger'); });
  });
}

// ══════════════════════════════════════════════════════════
// BAGIAN 13C: GAMBAR PREVIEW TAUTAN (og-image.png)
// ══════════════════════════════════════════════════════════

const OG = { LEBAR: 1200, TINGGI: 630, SISI: 600 };

/** Tampilkan tiruan kartu tautan + baris meta siap tempel di Pengaturan. */
function segarkanPratinjauOg() {
  const kotak = document.getElementById('ogPratinjau');
  if (kotak) {
    gambarLogoShare().then(function (dataUri) {
      kotak.style.backgroundImage = 'url(' + dataUri + ')';
    }).catch(function () { /* pratinjau opsional */ });
  }

  const alamat = alamatSitus();
  const domain = document.getElementById('ogDomain');
  if (domain) domain.textContent = alamat.domain;

  const label = document.getElementById('ogAlamat');
  if (label) label.textContent = alamat.lokal ? '(situs belum online)' : '';

  const kotakMeta = document.getElementById('ogMeta');
  if (kotakMeta) kotakMeta.value = barisMeta(alamat.dasar);
}

/**
 * Alamat situs ini, dibaca dari address bar browser.
 * Bagian nama berkas dibuang sehingga menyisakan folder tempat index.html berada.
 */
function alamatSitus() {
  const asal = location.origin;
  let jalur = location.pathname.replace(/[^/]*$/, '');   // buang nama berkas
  if (!jalur.endsWith('/')) jalur += '/';
  return {
    dasar : asal + jalur,
    domain: location.hostname || 'alamat-situs-anda',
    lokal : /^(localhost|127\.|0\.0\.0\.0|\[::1\])/.test(location.hostname) ||
            location.protocol === 'file:'
  };
}

/** Empat baris meta berisi alamat penuh — pengganti baris bertanda ⤵. */
function barisMeta(dasar) {
  return '<meta property="og:image"        content="' + dasar + 'logo-share.png">\n' +
         '<meta property="og:image:secure_url" content="' + dasar + 'logo-share.png">\n' +
         '<meta property="og:url"          content="' + dasar + '">\n' +
         '<meta name="twitter:image"       content="' + dasar + 'logo-share.png">';
}

/** Salin baris meta ke clipboard. */
function salinMetaPreview() {
  const kotak = document.getElementById('ogMeta');
  if (!kotak || !kotak.value) { toast('Belum siap', 'Baris meta belum tersusun.', 'warning'); return; }

  const alamat = alamatSitus();
  if (alamat.lokal) {
    toast('Situs belum online',
      'Alamat yang terdeteksi masih alamat lokal. Buka aplikasi dari alamat situs yang sudah ' +
      'online, baru salin baris metanya.', 'warning');
    return;
  }

  const sukses = function () {
    toast('Tersalin', 'Tempel menggantikan empat baris bertanda ⤵ di index.html, lalu git push.', 'success');
  };
  const manual = function () {
    kotak.removeAttribute('readonly');
    kotak.focus(); kotak.select(); kotak.setSelectionRange(0, 99999);
    kotak.setAttribute('readonly', 'readonly');
    toast('Salin manual', 'Teksnya sudah diblok — tekan Ctrl+C (atau tahan lalu Salin di HP).', 'warning');
  };

  // Clipboard API dulu (butuh HTTPS), baru cara lama sebagai cadangan
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(kotak.value).then(sukses).catch(function () { salinCaraLama(kotak, sukses, manual); });
  } else {
    salinCaraLama(kotak, sukses, manual);
  }
}

function salinCaraLama(kotak, sukses, manual) {
  kotak.removeAttribute('readonly');
  kotak.select(); kotak.setSelectionRange(0, 99999);
  let berhasil = false;
  try { berhasil = document.execCommand('copy'); } catch (e) {}
  kotak.setAttribute('readonly', 'readonly');
  if (berhasil) sukses(); else manual();
}

/** Unduh logo persegi untuk kartu preview (bentuk seperti contoh Owner). */
function buatLogoShare() {
  unduhGambar(gambarLogoShare(), 'logo-share.png');
}

/** Unduh spanduk lebar — alternatif bila ingin kartu besar melebar. */
function buatSpandukOg() {
  unduhGambar(gambarSpandukOg(), 'og-image.png');
}

function unduhGambar(janji, nama) {
  busy(true, 'Membuat gambar preview…');
  janji
    .then(function (dataUri) {
      busy(false);
      const a = document.createElement('a');
      a.href = dataUri; a.download = nama;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      toast(nama + ' terunduh',
        'Timpa berkasnya di folder proyek, lalu jalankan git add . / commit / push.', 'success');
    })
    .catch(function (err) { busy(false); toast('Gagal', pesanError(err), 'danger'); });
}

/**
 * Logo persegi 600×600 untuk kartu preview tautan.
 * Logo hitam diletakkan di atas plat putih bulat supaya tetap terbaca
 * saat WhatsApp mengecilkannya menjadi ±90 piksel.
 */
function gambarLogoShare() {
  return new Promise(function (resolve) {
    const S = OG.SISI;
    const c = document.createElement('canvas');
    c.width = S; c.height = S;
    const x = c.getContext('2d');

    const grad = x.createLinearGradient(0, 0, 0, S);
    grad.addColorStop(0, '#123243');
    grad.addColorStop(0.45, '#0A1725');
    grad.addColorStop(1, '#060D18');
    x.fillStyle = grad; x.fillRect(0, 0, S, S);

    const PLAT = 460;
    x.fillStyle = '#FFFFFF';
    x.beginPath(); x.arc(S / 2, S / 2, PLAT / 2, 0, Math.PI * 2); x.fill();

    muatLogo(function (img) {
      if (img) {
        const muat = PLAT - 56;
        const skala = Math.min(muat / img.width, muat / img.height);
        const w = img.width * skala, h = img.height * skala;
        x.drawImage(img, (S - w) / 2, (S - h) / 2, w, h);
      }
      resolve(c.toDataURL('image/png'));
    });
  });
}

/**
 * Spanduk lebar 1200×630 — dipakai bila Owner ingin kartu besar melebar.
 * Logonya diambil dari variabel CSS --logo-pingbro, jadi otomatis
 * mengikuti Logo Perusahaan yang terakhir diunggah.
 */
function gambarSpandukOg() {

/**
 * Gambar kartu preview 1200×630 di atas canvas.
 * Logonya diambil dari variabel CSS --logo-pingbro, jadi otomatis
 * mengikuti Logo Perusahaan yang terakhir diunggah.
 */
  return new Promise(function (resolve, reject) {
    const c = document.createElement('canvas');
    c.width = OG.LEBAR; c.height = OG.TINGGI;
    const x = c.getContext('2d');

    // Latar bergradasi seperti splash screen
    const grad = x.createLinearGradient(0, 0, 0, OG.TINGGI);
    grad.addColorStop(0, '#123243');
    grad.addColorStop(0.45, '#0A1725');
    grad.addColorStop(1, '#060D18');
    x.fillStyle = grad;
    x.fillRect(0, 0, OG.LEBAR, OG.TINGGI);

    // Pola titik halus
    x.fillStyle = 'rgba(45,212,191,.20)';
    for (let py = 0; py < OG.TINGGI; py += 22)
      for (let px = 0; px < OG.LEBAR; px += 22) x.fillRect(px, py, 1.5, 1.5);

    const tulis = function () {
      const X = 90 + 260 + 60;
      x.textBaseline = 'top';
      x.fillStyle = '#2DD4BF';
      x.font = 'bold 44px "Plus Jakarta Sans", Inter, Arial, sans-serif';
      x.fillText('PING BRO', X, 214);

      x.fillStyle = '#FFFFFF';
      x.font = 'bold 66px "Plus Jakarta Sans", Inter, Arial, sans-serif';
      x.fillText('Konveksi & Sablon', X, 268);

      x.fillStyle = '#CBD5E1';
      x.font = '30px Inter, Arial, sans-serif';
      x.fillText('Aplikasi Manajemen Operasional,', X, 356);
      x.fillText('Produksi & Keuangan', X, 396);

      x.fillStyle = '#0D9488';
      x.fillRect(X, 452, 96, 6);

      resolve(c.toDataURL('image/png'));
    };

    // Logo di atas plat putih bulat
    const sisi = 260, kiri = 90, atas = (OG.TINGGI - sisi) / 2;
    x.save();
    x.fillStyle = '#FFFFFF';
    x.beginPath();
    x.arc(kiri + sisi / 2, atas + sisi / 2, sisi / 2, 0, Math.PI * 2);
    x.fill();
    x.restore();

    muatLogo(function (img) {
      if (img) {
        const muat = sisi - 34;
        const skala = Math.min(muat / img.width, muat / img.height);
        const w = img.width * skala, h = img.height * skala;
        x.drawImage(img, kiri + (sisi - w) / 2, atas + (sisi - h) / 2, w, h);
      }
      tulis();   // tanpa logo pun kartunya tetap jadi
    });
  });
}

/** Muat Logo Perusahaan yang sedang dipakai dari variabel CSS --logo-pingbro. */
function muatLogo(selesai) {
  const sumber = (getComputedStyle(document.documentElement)
    .getPropertyValue('--logo-pingbro').trim().match(/url\(\s*['"]?(.+?)['"]?\s*\)/) || [])[1];
  if (!sumber) { selesai(null); return; }

  const img = new Image();
  img.onload  = function () { selesai(img); };
  img.onerror = function () { selesai(null); };
  img.src = sumber;
}

/**
 * Ganti PIN akses aplikasi.
 * Setelah PIN berubah, seluruh token lama otomatis batal — termasuk milik
 * perangkat ini — sehingga Owner diminta memasukkan PIN baru.
 */
function gantiPin() {
  const a = (document.getElementById('setPin').value || '').trim();
  const b = (document.getElementById('setPin2').value || '').trim();

  if (!a && !b) { toast('PIN kosong', 'Isi PIN baru terlebih dahulu.', 'warning'); return; }
  if (a.length < 4) { toast('PIN terlalu pendek', 'Gunakan minimal 4 karakter.', 'warning'); return; }
  if (a !== b) { toast('PIN tidak sama', 'Kolom "Ulangi PIN Baru" belum cocok.', 'warning'); return; }

  konfirmasi('Ganti PIN Akses',
    'Semua perangkat yang sudah login — termasuk perangkat ini — akan diminta ' +
    'memasukkan PIN baru. Lanjutkan?',
    function () {
      busy(true, 'Mengganti PIN…');
      apiCall('saveSettings', { settings: { pinAkses: a } })
        .then(function (res) {
          busy(false);
          if (!res || !res.success) {
            toast('Gagal', res ? res.message : 'Tidak ada respons.', 'danger');
            return;
          }
          // Token lama sudah tidak berlaku — tukar langsung dengan PIN baru
          // supaya Owner tidak terlempar keluar di tengah pekerjaan.
          apiLogin(a).then(function (masuk) {
            document.getElementById('setPin').value = '';
            document.getElementById('setPin2').value = '';
            if (masuk && masuk.success) toast('PIN diperbarui', 'PIN akses berhasil diganti.', 'success');
            else tampilkanLayarPin('PIN sudah diganti. Masukkan PIN baru Anda.');
          });
        })
        .catch(function (err) { busy(false); toast('Error', pesanError(err), 'danger'); });
    });
}

function simpanPengaturan() {
  const data = {
    appName        : document.getElementById('setAppName').value.trim(),
    ownerName      : document.getElementById('setOwnerName').value.trim(),
    alamatUsaha    : document.getElementById('setAlamat').value.trim(),
    telpUsaha      : document.getElementById('setTelp').value.trim(),
    rekeningBank   : document.getElementById('setRekening').value.trim(),
    instagramUsaha : document.getElementById('setInstagram').value.trim(),
    noRekening     : document.getElementById('setNoRek').value.trim(),
    atasNamaRekening: document.getElementById('setAtasNama').value.trim(),
    minDpPersen    : document.getElementById('setMinDp').value,
    deadlineWarning: document.getElementById('setWarning').value
  };

  busy(true, 'Menyimpan pengaturan…');
  apiCall('saveSettings', { settings: data })
    .then(function (res) {
      busy(false);
      if (res && res.success) {
        AppState.config = res.data;
        simpanCacheLokal();
        terapkanKonfigurasi();
        toast('Berhasil', res.message, 'success');
      } else toast('Gagal', res ? res.message : 'Tidak ada respons.', 'danger');
    })
    .catch(function (err) { busy(false); toast('Error', pesanError(err), 'danger'); });
}

// ── Logo perusahaan ───────────────────────────────────────

/**
 * Owner memilih berkas logo. Gambar dikecilkan di browser lebih dulu supaya
 * muat disimpan di Spreadsheet dan ringan dipakai di dokumen cetak.
 */
function pilihLogoPerusahaan(input) {
  const file = input.files && input.files[0];
  input.value = '';
  if (!file) return;
  if (String(file.type || '').indexOf('image/') !== 0) {
    toast('Bukan gambar', 'Pilih berkas gambar PNG atau JPG.', 'warning'); return;
  }

  const reader = new FileReader();
  reader.onload = function () {
    const img = new Image();
    img.onload = function () {
      // Coba beberapa ukuran sampai cukup kecil untuk disimpan satu sel Sheets
      let dataUri = '';
      [260, 200, 150].some(function (sisi) {
        dataUri = gambarKeDataUri(img, sisi, 'image/png');
        return dataUri.length <= 45000;
      });
      if (dataUri.length > 45000) dataUri = gambarKeDataUri(img, 200, 'image/jpeg');
      if (dataUri.length > 45000) {
        toast('Gambar terlalu rumit', 'Coba logo dengan warna lebih sederhana.', 'warning');
        return;
      }
      kirimLogo(dataUri, 'Logo perusahaan diperbarui di seluruh aplikasi.');
    };
    img.onerror = function () { toast('Gagal membaca', 'Berkas gambar tidak dapat dibuka.', 'danger'); };
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
}

/** Gambar ulang logo pada kanvas persegi (rasio asli dipertahankan). */
function gambarKeDataUri(img, sisi, mime) {
  const c = document.createElement('canvas');
  c.width = sisi; c.height = sisi;
  const ctx = c.getContext('2d');
  if (mime === 'image/jpeg') { ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, sisi, sisi); }
  const skala = Math.min(sisi / img.width, sisi / img.height);
  const w = img.width * skala, h = img.height * skala;
  ctx.drawImage(img, (sisi - w) / 2, (sisi - h) / 2, w, h);
  return c.toDataURL(mime, 0.9);
}

function kirimLogo(dataUri, pesanSukses) {
  busy(true, 'Menyimpan logo…');
  apiCall('simpanLogoPerusahaan', { dataUri: dataUri })
    .then(function (res) {
      busy(false);
      if (!res || !res.success) { toast('Gagal', res ? res.message : 'Tidak ada respons.', 'danger'); return; }
      AppState.config.logoData = res.data.logoData;
      AppState.config.logoUrl = '';
      simpanCacheLokal();
      terapkanKonfigurasi();
      segarkanPratinjauOg();     // kartu preview tautan ikut logo terbaru
      toast('Berhasil', pesanSukses, 'success');
    })
    .catch(function (err) { busy(false); toast('Error', pesanError(err), 'danger'); });
}

function hapusLogoPerusahaan() {
  konfirmasi('Pakai Logo Bawaan',
    'Logo perusahaan akan dikembalikan ke logo bawaan PINGBRO di seluruh aplikasi. Lanjutkan?',
    function () { kirimLogo('', 'Logo dikembalikan ke bawaan.'); });
}

function muatLinkSistem() {
  const box = document.getElementById('linkSistem');
  if (!box) return;
  apiCall('getLinkSistem')
    .then(function (res) {
      if (!res || !res.success) {
        box.innerHTML = '<div class="empty-state">Tautan belum tersedia. Jalankan setupAppEnvironment().</div>';
        return;
      }
      box.innerHTML =
        '<a class="link-item" href="' + escapeAttr(res.data.spreadsheetUrl) + '" target="_blank" rel="noopener">' +
          '<i class="bi bi-file-earmark-spreadsheet"></i><div><b>Database Google Sheets</b>' +
          '<small>Buka DB_PINGBRO di tab baru</small></div><i class="bi bi-box-arrow-up-right"></i></a>' +
        '<a class="link-item" href="' + escapeAttr(res.data.folderUrl) + '" target="_blank" rel="noopener">' +
          '<i class="bi bi-folder2-open"></i><div><b>Folder Google Drive</b>' +
          '<small>Mockup desain dan berkas order</small></div><i class="bi bi-box-arrow-up-right"></i></a>';
    })
    .catch(function () {
      box.innerHTML = '<div class="empty-state">Gagal memuat tautan sistem.</div>';
    });
}
