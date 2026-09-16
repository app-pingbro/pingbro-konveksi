/**
 * ============================================================
 * PING BRO KONVEKSI & SABLON — material.js
 *
 * Menghitung KEBUTUHAN MATERIAL dari Rincian Item.
 *
 * Rumusnya TIDAK ditanam di berkas ini. Semua rumus tersimpan di
 * sheet Master_Material dan bisa diubah Owner lewat
 * Pengaturan → Rumus Material. Berkas ini hanya mesin hitungnya.
 *
 * Bentuk rumus yang dimengerti:
 *
 *   (COWOK XS-M / 6) + (COWOK L-XL / 5,5) + (CEWEK XS-XXXL / 6)
 *   TOTAL / 4 * 13
 *   (PRODUK Lengan Panjang / 4) * 13
 *
 * Variabel:
 *   COWOK | CEWEK | ANAK      jumlah pcs kategori tsb
 *   COWOK XS-M                dibatasi rentang ukuran
 *   COWOK M                   satu ukuran saja
 *   TOTAL                     seluruh pcs yang lolos penyaring material
 *   TOTAL SEMUA               seluruh pcs pada order, tanpa penyaring
 *   PRODUK <nama produk>      pcs jenis produk tertentu, tanpa penyaring
 *
 * Operator: + - * × / : ( )
 * Angka boleh memakai koma sebagai desimal, seperti kebiasaan Indonesia.
 * ============================================================
 */

const UKURAN_URUT = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];

// ══════════════════════════════════════════════════════════
// 1. PENYARING — item mana yang ikut dihitung
// ══════════════════════════════════════════════════════════

/**
 * Apakah satu item ikut dihitung oleh material ini?
 *
 * @param {Object} item      baris Rincian Item
 * @param {Object} material  baris Master_Material
 * @param {string} bahan     isi kolom Bahan pada order
 */
function itemCocokMaterial(item, material, bahan) {
  // Penyaring jenis produk — kosong berarti semua produk ikut
  const daftarProdukFilter = pecahDaftar(material.Produk);
  if (daftarProdukFilter.length) {
    const produk = String(item.JenisProduk || item.jenisProduk || '').trim().toLowerCase();
    const cocok = daftarProdukFilter.some(function (p) { return p.toLowerCase() === produk; });
    if (!cocok) return false;
  }

  // Penyaring bahan — dicocokkan sebagai potongan kata pada kolom Bahan order
  const daftarBahanFilter = pecahDaftar(material.Bahan);
  if (daftarBahanFilter.length) {
    const teks = String(bahan || '').toLowerCase();
    const cocok = daftarBahanFilter.some(function (b) { return teks.indexOf(b.toLowerCase()) !== -1; });
    if (!cocok) return false;
  }

  return true;
}

/** "Kaos, Oversize" → ['Kaos','Oversize'] */
function pecahDaftar(teks) {
  return String(teks || '').split(/[,;|]/)
    .map(function (x) { return x.trim(); })
    .filter(function (x) { return x !== ''; });
}

// ══════════════════════════════════════════════════════════
// 2. PENGURAI RUMUS — tokenizer & parser
// ══════════════════════════════════════════════════════════

/**
 * Pecah rumus menjadi token.
 * Nama variabel boleh mengandung spasi dan tanda hubung (COWOK XS-M),
 * jadi tanda hubung di dalam nama TIDAK dianggap operator kurang.
 */
function tokenRumus(rumus) {
  const teks = String(rumus || '');
  const token = [];
  let i = 0;

  while (i < teks.length) {
    const c = teks[i];

    if (/\s/.test(c)) { i++; continue; }

    if ('+-*/:()'.indexOf(c) !== -1) { token.push({ t: 'op', v: c }); i++; continue; }
    if (c === '×') { token.push({ t: 'op', v: '*' }); i++; continue; }
    if (c === '÷') { token.push({ t: 'op', v: '/' }); i++; continue; }

    // Angka: 6   5,5   4.5
    if (/[0-9]/.test(c)) {
      const m = teks.slice(i).match(/^[0-9]+(?:[.,][0-9]+)?/);
      token.push({ t: 'num', v: Number(m[0].replace(',', '.')) });
      i += m[0].length;
      continue;
    }

    // Variabel: satu kata atau lebih, boleh berisi tanda hubung TANPA spasi
    if (/[A-Za-z]/.test(c)) {
      const m = teks.slice(i).match(/^[A-Za-z][A-Za-z0-9]*(?:[ \t]+[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*)*/);
      token.push({ t: 'var', v: m[0].replace(/\s+/g, ' ').trim() });
      i += m[0].length;
      continue;
    }

    throw new Error('Tanda "' + c + '" tidak dikenali dalam rumus.');
  }
  return token;
}

/**
 * Hitung nilai rumus.
 *
 * @param {string}   rumus
 * @param {Function} nilaiVariabel  fungsi(namaVariabel) → angka
 * @return {number}
 */
function hitungRumus(rumus, nilaiVariabel) {
  const token = tokenRumus(rumus);
  if (!token.length) return 0;

  let pos = 0;
  const lihat = function () { return token[pos]; };
  const ambil = function () { return token[pos++]; };

  // ekspresi := suku (('+'|'-') suku)*
  function ekspresi() {
    let nilai = suku();
    while (lihat() && lihat().t === 'op' && (lihat().v === '+' || lihat().v === '-')) {
      const op = ambil().v;
      const kanan = suku();
      nilai = (op === '+') ? nilai + kanan : nilai - kanan;
    }
    return nilai;
  }

  // suku := faktor (('*'|'/'|':') faktor)*
  function suku() {
    let nilai = faktor();
    while (lihat() && lihat().t === 'op' && '*/:'.indexOf(lihat().v) !== -1) {
      const op = ambil().v;
      const kanan = faktor();
      if (op === '*') nilai = nilai * kanan;
      else {
        if (!kanan) throw new Error('Rumus membagi dengan nol.');
        nilai = nilai / kanan;
      }
    }
    return nilai;
  }

  // faktor := angka | variabel | '(' ekspresi ')' | '-' faktor
  function faktor() {
    const t = lihat();
    if (!t) throw new Error('Rumus terpotong — ada bagian yang belum lengkap.');

    if (t.t === 'op' && t.v === '-') { ambil(); return -faktor(); }
    if (t.t === 'op' && t.v === '+') { ambil(); return faktor(); }

    if (t.t === 'num') { ambil(); return t.v; }

    if (t.t === 'var') {
      ambil();
      const n = nilaiVariabel(t.v);
      if (n === null || n === undefined || isNaN(n))
        throw new Error('Variabel "' + t.v + '" tidak dikenali.');
      return Number(n);
    }

    if (t.t === 'op' && t.v === '(') {
      ambil();
      const nilai = ekspresi();
      const tutup = ambil();
      if (!tutup || tutup.v !== ')') throw new Error('Kurung tutup ")" kurang.');
      return nilai;
    }

    throw new Error('Tanda "' + t.v + '" tidak berada di tempat yang benar.');
  }

  const hasil = ekspresi();
  if (pos < token.length) throw new Error('Ada bagian rumus yang tidak terbaca setelah posisi ' + pos + '.');
  return hasil;
}

// ══════════════════════════════════════════════════════════
// 3. NILAI VARIABEL — diambil dari Rincian Item
// ══════════════════════════════════════════════════════════

/**
 * Siapkan pembaca variabel untuk satu material.
 *
 * @param {Object[]} items     seluruh item order (bentuk apa pun: dari form atau dari server)
 * @param {Object}   material  baris Master_Material
 * @param {string}   bahan     kolom Bahan pada order
 */
function pembacaVariabel(items, material, bahan) {
  const semua = (items || []).map(bakukanItem);
  const terpilih = semua.filter(function (it) {
    return itemCocokMaterial(it, material, bahan);
  });

  return function (nama) {
    const kunci = String(nama).trim().toUpperCase();

    if (kunci === 'TOTAL')       return jumlahPcs(terpilih);
    if (kunci === 'TOTAL SEMUA') return jumlahPcs(semua);

    // PRODUK <nama produk> — mengabaikan penyaring material
    if (kunci.indexOf('PRODUK ') === 0) {
      const produk = String(nama).trim().slice(7).trim().toLowerCase();
      return jumlahPcs(semua.filter(function (it) {
        return String(it.JenisProduk).toLowerCase() === produk;
      }));
    }

    // <KATEGORI> [rentang ukuran]
    const bagian = kunci.split(' ');
    const kategori = bagian[0];
    const rentang = bagian.slice(1).join(' ');

    const cocokKategori = terpilih.filter(function (it) {
      return String(it.Kategori).toUpperCase() === kategori;
    });
    if (!cocokKategori.length && !rentangSah(rentang)) {
      // Kategori tidak ada di order ini — nilainya nol, bukan error,
      // supaya rumus tetap jalan untuk order yang hanya berisi satu kategori.
      if (!rentang) return 0;
    }
    if (rentang && !rentangSah(rentang)) return null;   // → dilaporkan sebagai variabel tak dikenal

    return jumlahPcs(cocokKategori.filter(function (it) {
      return ukuranMasuk(it.Ukuran, rentang);
    }));
  };
}

/** Samakan bentuk item dari form (huruf kecil) dan dari server (huruf besar). */
function bakukanItem(it) {
  return {
    JenisProduk: String(it.JenisProduk !== undefined ? it.JenisProduk : (it.jenisProduk || '')).trim(),
    Kategori   : String(it.Kategori    !== undefined ? it.Kategori    : (it.kategori || '')).trim(),
    Ukuran     : String(it.Ukuran      !== undefined ? it.Ukuran      : (it.ukuran || '')).trim(),
    Jumlah     : Number(it.Jumlah      !== undefined ? it.Jumlah      : (it.jumlah || 0)) || 0
  };
}

function jumlahPcs(daftar) {
  return daftar.reduce(function (a, it) { return a + it.Jumlah; }, 0);
}

/** Rentang sah: kosong, satu ukuran baku, atau "AWAL-AKHIR". */
function rentangSah(rentang) {
  if (!rentang) return true;
  const r = rentang.toUpperCase();
  if (UKURAN_URUT.indexOf(r) !== -1) return true;
  const p = r.split('-');
  return p.length === 2 &&
         UKURAN_URUT.indexOf(p[0]) !== -1 &&
         UKURAN_URUT.indexOf(p[1]) !== -1 &&
         UKURAN_URUT.indexOf(p[0]) <= UKURAN_URUT.indexOf(p[1]);
}

/**
 * Apakah ukuran item masuk rentang?
 *
 * Catatan penting: ukuran buatan sendiri (mis. "4L Jumbo") hanya ikut terhitung
 * bila rentangnya mencakup SELURUH skala (XS-XXXL) atau rentangnya dikosongkan.
 * Dengan begitu kain untuk ukuran khusus tidak hilang dari perhitungan, tetapi
 * juga tidak salah masuk ke rentang sempit seperti L-XL.
 */
function ukuranMasuk(ukuran, rentang) {
  const u = String(ukuran || '').toUpperCase();
  const indeks = UKURAN_URUT.indexOf(u);
  const seluruhSkala = !rentang ||
    rentang.toUpperCase() === UKURAN_URUT[0] + '-' + UKURAN_URUT[UKURAN_URUT.length - 1];

  if (indeks === -1) return seluruhSkala;      // ukuran custom
  if (!rentang) return true;

  const r = rentang.toUpperCase();
  if (UKURAN_URUT.indexOf(r) !== -1) return u === r;

  const p = r.split('-');
  return indeks >= UKURAN_URUT.indexOf(p[0]) && indeks <= UKURAN_URUT.indexOf(p[1]);
}

// ══════════════════════════════════════════════════════════
// 4. PERHITUNGAN SATU ORDER
// ══════════════════════════════════════════════════════════

/**
 * Hitung kebutuhan seluruh material untuk satu order.
 *
 * @param {Object[]} items  Rincian Item
 * @param {string}   bahan  kolom Bahan pada order
 * @param {Object[]} daftar daftar material (bila kosong dipakai AppState.material)
 * @return {Object[]} [{ id, nama, satuan, rumus, hasil, error }]
 */
function hitungMaterial(items, bahan, daftar) {
  const material = daftar || AppState.material || [];

  return material
    .filter(function (m) { return m.Aktif !== false && String(m.Rumus || '').trim() !== ''; })
    .map(function (m) {
      const baris = { id: m.ID, nama: m.Nama, satuan: m.Satuan || 'Kg',
                      rumus: m.Rumus, hasil: 0, error: '' };
      try {
        baris.hasil = hitungRumus(m.Rumus, pembacaVariabel(items, m, bahan));
        if (!isFinite(baris.hasil)) throw new Error('Hasil perhitungan tidak masuk akal.');
      } catch (e) {
        baris.error = e.message;
        baris.hasil = 0;
      }
      return baris;
    });
}

/** Hanya material yang benar-benar terpakai pada order ini. */
function materialTerpakai(items, bahan, daftar) {
  return hitungMaterial(items, bahan, daftar).filter(function (m) {
    return m.error || m.hasil > 0;
  });
}

// ══════════════════════════════════════════════════════════
// 5. FORMAT ANGKA INDONESIA
// ══════════════════════════════════════════════════════════

/** 6 → "6,0"   6,85 → "6,9"   0,3 → "0,3" */
function angkaMaterial(n) {
  const nilai = Number(n) || 0;
  // Satu angka di belakang koma sudah cukup untuk kebutuhan kain,
  // kecuali hasilnya sangat kecil sehingga akan terbaca 0,0.
  const desimal = (nilai !== 0 && Math.abs(nilai) < 0.1) ? 2 : 1;
  return nilai.toLocaleString('id-ID', {
    minimumFractionDigits: desimal, maximumFractionDigits: desimal
  });
}

/** "6,0 Kg" */
function nilaiMaterial(n, satuan) {
  return angkaMaterial(n) + ' ' + (satuan || '');
}

// ══════════════════════════════════════════════════════════
// 6. TAMPILAN — grid RINCIAN MATERIAL
// ══════════════════════════════════════════════════════════

/**
 * Susun grid material. Tiap sel: nama material di atas, angka di bawah —
 * mengikuti bentuk tabel yang biasa dipakai Owner.
 *
 * @param {Object[]} hasil   keluaran materialTerpakai()
 * @param {Object}   opsi    { bahan, adaItem }
 */
function htmlRincianMaterial(hasil, opsi) {
  opsi = opsi || {};

  if (!hasil || !hasil.length) return kosongMaterial(opsi);

  return '<div class="mat-grid">' + hasil.map(function (m) {
    return '<div class="mat-sel' + (m.error ? ' error' : '') + '">' +
      '<span class="mat-nama">' + escapeHtml(m.nama) + '</span>' +
      (m.error
        ? '<span class="mat-galat" title="' + escapeAttr(m.error) + '">Rumus bermasalah</span>'
        : '<b class="mat-nilai num">' + escapeHtml(angkaMaterial(m.hasil)) +
          ' <span>' + escapeHtml(m.satuan || '') + '</span></b>') +
    '</div>';
  }).join('') + '</div>';
}

/** Keterangan saat tidak ada material yang cocok — sebutkan sebabnya. */
function kosongMaterial(opsi) {
  const adaMaterial = (AppState.material || []).some(function (m) {
    return m.Aktif !== false && String(m.Rumus || '').trim() !== '';
  });

  if (!adaMaterial) {
    return '<div class="item-empty"><i class="bi bi-rulers"></i>' +
      'Belum ada rumus material yang aktif.<br>' +
      'Atur di <b>Pengaturan → Rumus Material</b>.</div>';
  }
  if (!opsi.adaItem) {
    return '<div class="item-empty"><i class="bi bi-rulers"></i>' +
      'Isi jumlah pcs pada rincian di atas, kebutuhan material akan terhitung sendiri.</div>';
  }
  return '<div class="item-empty"><i class="bi bi-funnel"></i>' +
    'Tidak ada material yang cocok dengan bahan <b>' + escapeHtml(opsi.bahan || '(kosong)') +
    '</b> dan jenis produk pada order ini.<br>' +
    'Sesuaikan penyaring di <b>Pengaturan → Rumus Material</b>.</div>';
}
