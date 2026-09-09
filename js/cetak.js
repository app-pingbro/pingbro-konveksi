/**
 * ============================================================
 * PING BRO KONVEKSI & SABLON — cetak.js
 *
 * Membuat SPK & Invoice sebagai gambar JPG (bukan PDF lagi).
 *
 * Cara kerja:
 *  1. Backend mengirim HTML dokumen (layout, logo, dan seluruh
 *     informasi tetap sama seperti versi PDF).
 *  2. HTML itu dirender di dalam IFRAME tersembunyi berukuran A4.
 *     Iframe dipakai supaya CSS dokumen dan CSS aplikasi tidak
 *     saling mengganggu.
 *  3. Khusus SPK: gambar mockup diambil terpisah lalu DIPERBESAR
 *     sampai memenuhi ruang kosong yang tersisa di halaman.
 *  4. Halaman dirasterisasi pada skala 3× sehingga teks tetap tajam
 *     saat dicetak (setara ±288 DPI).
 *  5. Hasilnya JPEG kualitas tinggi: bisa dilihat, diunduh, dicetak.
 *
 * Cara rasterisasi — mesin gambar browser sendiri, tanpa pustaka luar:
 *   Isi halaman dibungkus ke dalam <foreignObject> sebuah SVG, lalu SVG itu
 *   digambar ke <canvas>. Karena yang melakukan tata letak adalah mesin
 *   render browser, hasilnya identik dengan yang terlihat di layar — huruf
 *   tetap tajam, letter-spacing, tabel, dan sudut membulat tidak bergeser.
 *   Cara ini bisa dipakai sebab dokumen dari backend sudah mandiri: CSS
 *   inline, logo dan mockup berupa data URI, tanpa font atau gambar luar.
 *
 *   Bila mesin render browser gagal (sebagian versi Safari lama bermasalah
 *   dengan gambar di dalam foreignObject), html2canvas diambil dari CDN
 *   sebagai jalan cadangan.
 * ============================================================
 */

// Ukuran kertas A4 dalam piksel CSS pada 96 DPI
const A4 = {
  LEBAR : 794,     // 210 mm
  TINGGI: 1123,    // 297 mm
  SKALA : 3,       // 794 × 3 = 2382 px lebar  → tajam untuk cetak
  MUTU  : 0.95     // kualitas JPEG
};

const HTML2CANVAS_CDN =
  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';

// Dokumen terakhir yang dirender — dipakai tombol Unduh & Print
let dokumenTerakhir = null;   // { dataUri, namaBerkas, judul }

// ══════════════════════════════════════════════════════════
// PINTU MASUK — dipanggil tombol "Cetak SPK" / "Cetak Invoice"
// ══════════════════════════════════════════════════════════

function cetakSpk(nomorSPK) {
  cetakDokumen('dokumenSpk', { nomorSPK: nomorSPK }, 'SPK ' + nomorSPK);
}

function cetakInvoice(nomorInvoice) {
  cetakDokumen('dokumenInvoice', { nomorInvoice: nomorInvoice }, 'Invoice ' + nomorInvoice);
}

/**
 * Alur lengkap: ambil HTML → render → jadikan JPG → tampilkan pratinjau.
 *
 * @param {string} aksi   'dokumenSpk' atau 'dokumenInvoice'
 * @param {Object} args   argumen aksi
 * @param {string} judul  judul yang tampil di jendela pratinjau
 */
function cetakDokumen(aksi, args, judul) {
  busy(true, 'Menyiapkan dokumen…');

  let dok = null;

  busy(true, 'Mengambil data dokumen…');
  apiCall(aksi, args)
    .then(function (res) {
      if (res && res.perluLogin) throw new Error('__sesi__');
      if (!res || !res.success) throw new Error(res ? res.message : 'Tidak ada respons dari server.');
      dok = res.data;

      // Mockup diambil terpisah agar balasan dokumen tetap ringan
      if (!dok.mockupOrder) return null;
      busy(true, 'Mengambil gambar mockup…');
      return apiCall('getMockupDataUri', { nomor: dok.mockupOrder })
        .then(function (m) { return (m && m.success) ? m.data.dataUri : null; })
        .catch(function () { return null; });   // mockup gagal ≠ cetak gagal
    })
    .then(function (mockupDataUri) {
      busy(true, 'Membuat gambar JPG…');
      return renderKeJpg(dok.html, mockupDataUri);
    })
    .then(function (dataUri) {
      busy(false);
      dokumenTerakhir = { dataUri: dataUri, namaBerkas: dok.namaBerkas, judul: judul };
      bukaPratinjauJpg(judul, dokumenTerakhir);
      toast('JPG siap', 'Dokumen ' + dok.nomor + ' berhasil dibuat.', 'success');
    })
    .catch(function (err) {
      busy(false);
      if (err && err.message === '__sesi__') return;   // layar PIN sudah muncul
      toast('Gagal mencetak', pesanError(err), 'danger');
    });
}

// ══════════════════════════════════════════════════════════
// CADANGAN: html2canvas dari CDN
// Hanya diambil bila mesin render bawaan browser gagal.
// ══════════════════════════════════════════════════════════

/** Muat html2canvas sekali saja, dan hanya saat benar-benar dibutuhkan. */
function muatHtml2Canvas() {
  if (window.html2canvas) return Promise.resolve();
  if (window.__muatH2C) return window.__muatH2C;

  window.__muatH2C = new Promise(function (resolve, reject) {
    const sc = document.createElement('script');
    sc.src = HTML2CANVAS_CDN;
    sc.onload = function () { resolve(); };
    sc.onerror = function () {
      window.__muatH2C = null;
      reject(new Error('Gagal memuat pustaka pembuat gambar. Periksa koneksi internet Anda.'));
    };
    document.head.appendChild(sc);
  });
  return window.__muatH2C;
}

// ══════════════════════════════════════════════════════════
// RENDER HTML → JPEG
// ══════════════════════════════════════════════════════════

/**
 * @param {string} html            HTML dokumen dari backend
 * @param {?string} mockupDataUri  gambar mockup (SPK saja), boleh null
 * @return {Promise<string>} data URI JPEG
 */
function renderKeJpg(html, mockupDataUri) {
  const frame = document.createElement('iframe');
  frame.setAttribute('aria-hidden', 'true');
  frame.style.cssText =
    'position:fixed;left:-20000px;top:0;border:0;background:#fff;' +
    'width:' + A4.LEBAR + 'px;height:' + A4.TINGGI + 'px';
  document.body.appendChild(frame);

  const bersihkan = function () {
    if (frame.parentNode) frame.parentNode.removeChild(frame);
  };

  return new Promise(function (resolve, reject) {
    const doc = frame.contentDocument;
    doc.open();
    doc.write(html + gayaTambahan());
    doc.close();

    const gambarMockup = doc.getElementById('mkGambar');

    if (gambarMockup) {
      if (mockupDataUri) {
        gambarMockup.src = mockupDataUri;
      } else {
        // Mockup ada di order tapi gambarnya tidak bisa diambil:
        // ganti dengan keterangan, jangan tinggalkan kotak kosong.
        const wadah = doc.getElementById('mkWadah');
        const tautan = gambarMockup.getAttribute('data-drive') || '';
        if (wadah) {
          wadah.className = 'nt';
          wadah.textContent = 'Gambar mockup tidak dapat dimuat saat mencetak.' +
            (tautan ? ' Buka di Google Drive: ' + tautan : '');
        }
      }
    }

    tungguGambar(doc)
      .then(function () {
        // Perbesar mockup memakai ruang kosong yang tersisa
        if (gambarMockup && mockupDataUri) besarkanMockup(doc, gambarMockup);
        return rasterisasi(doc);
      })
      .then(function (dataUri) { bersihkan(); resolve(dataUri); })
      .catch(function (err) { bersihkan(); reject(err); });
  });
}

/**
 * Gaya tambahan khusus proses render.
 * @page tidak berlaku di dalam iframe, jadi ukuran & margin halaman
 * ditegakkan ulang di sini agar hasilnya benar-benar sebesar A4.
 */
function gayaTambahan() {
  return '<style id="gayaRender">' +
    'html,body{width:' + A4.LEBAR + 'px;margin:0;background:#fff;' +
      '-webkit-font-smoothing:antialiased}' +
    // Margin halaman dipindahkan ke padding body supaya isi tidak menempel tepi
    'body{box-sizing:border-box;padding:9mm;height:' + A4.TINGGI + 'px}' +
    // Kelas .ukur dipakai sementara untuk mengukur tinggi isi yang SEBENARNYA.
    // Tanpa ini, tinggi html/body selalu setinggi halaman sehingga tidak bisa
    // dibedakan antara "isinya pas" dan "isinya masih menyisakan ruang".
    'html.ukur,body.ukur{height:auto !important}' +
    'body.ukur .sheet{height:auto !important}' +
    'img{image-rendering:auto}' +
    '</style>';
}

/** Tunggu semua gambar (logo & mockup) selesai dimuat, maksimal 15 detik. */
function tungguGambar(doc) {
  const gambar = [].slice.call(doc.images || []);
  const semua = gambar.map(function (g) {
    if (g.complete && g.naturalWidth) return Promise.resolve();
    return new Promise(function (selesai) {
      g.addEventListener('load', selesai, { once: true });
      g.addEventListener('error', selesai, { once: true });   // gagal pun lanjut
    });
  });
  const batas = new Promise(function (selesai) { setTimeout(selesai, 15000); });
  // Fonts API tidak ada di semua browser lama
  const font = (doc.fonts && doc.fonts.ready) ? doc.fonts.ready : Promise.resolve();
  return Promise.race([Promise.all(semua).then(function () { return font; }), batas]);
}

// ══════════════════════════════════════════════════════════
// MEMPERBESAR MOCKUP KE SISA RUANG HALAMAN
// ══════════════════════════════════════════════════════════

/**
 * Cari ukuran mockup TERBESAR yang masih membuat seluruh isi SPK
 * muat dalam satu halaman A4.
 *
 * Metodenya mengukur tinggi isi yang sebenarnya di browser, bukan menebak:
 * tinggi mockup dinaikkan-turunkan dengan pencarian biner sampai ketemu
 * nilai terbesar yang masih pas. Rasio gambar tidak pernah diubah karena
 * hanya SALAH SATU sisi yang dibatasi (max-height), sisi lain dibiarkan auto
 * dan max-width menahannya agar tidak melewati margin.
 */
function besarkanMockup(doc, img) {
  const body = doc.body;
  const BATAS = A4.TINGGI - 2;          // sisa 2px sebagai jaga-jaga

  mulaiUkur(doc);                       // tinggi isi diukur apa adanya

  const tinggiIsi = function () {
    void body.offsetHeight;             // paksa hitung ulang tata letak
    // Hanya kotak body yang dibaca: html selalu setinggi iframe,
    // jadi scrollHeight-nya tidak berguna untuk mengukur isi.
    return body.getBoundingClientRect().height;
  };

  const coba = function (px) {
    img.style.maxHeight = px + 'px';
    img.style.maxWidth  = '100%';
    img.style.width     = 'auto';
    img.style.height    = 'auto';
    return tinggiIsi();
  };

  // Batas atas yang masuk akal: setinggi halaman, dan tidak lebih besar
  // daripada tinggi gambar bila lebarnya dibuat penuh (supaya tidak buram).
  const lebarArea = body.clientWidth;
  const rasio = (img.naturalWidth && img.naturalHeight)
    ? (img.naturalHeight / img.naturalWidth) : 1;
  const tinggiPenuhLebar = Math.round(lebarArea * rasio);

  let hi = Math.min(A4.TINGGI, tinggiPenuhLebar);
  let lo = 60;

  // Bila ukuran terkecil pun sudah tidak muat, pakai yang terkecil.
  if (coba(lo) > BATAS) { selesaiUkur(doc); return; }
  // Bila ukuran terbesar sudah muat, tidak perlu mencari lagi.
  if (coba(hi) <= BATAS) { selesaiUkur(doc); return; }

  // Pencarian biner: 12 langkah cukup untuk ketelitian ±1 px
  for (let i = 0; i < 12; i++) {
    const tengah = Math.floor((lo + hi) / 2);
    if (coba(tengah) <= BATAS) lo = tengah; else hi = tengah;
  }
  coba(lo);
  selesaiUkur(doc);
}

/** Aktifkan mode ukur: tinggi html & body mengikuti isi, bukan tinggi halaman. */
function mulaiUkur(doc) {
  doc.documentElement.classList.add('ukur');
  doc.body.classList.add('ukur');
}

function selesaiUkur(doc) {
  doc.documentElement.classList.remove('ukur');
  doc.body.classList.remove('ukur');
}

// ══════════════════════════════════════════════════════════
// RASTERISASI
// ══════════════════════════════════════════════════════════

/** Ubah isi iframe menjadi JPEG beresolusi tinggi. */
function rasterisasi(doc) {
  const body = doc.body;

  // Tinggi akhir: satu halaman penuh. Bila isi ternyata lebih tinggi
  // (data sangat padat), gambar ikut memanjang — lebih baik daripada
  // ada informasi yang terpotong.
  mulaiUkur(doc);
  const tinggiIsi = Math.ceil(body.getBoundingClientRect().height);
  selesaiUkur(doc);

  const tinggi = Math.max(A4.TINGGI, tinggiIsi);
  if (tinggi > A4.TINGGI) body.style.height = tinggi + 'px';

  return lewatSvg(doc, A4.LEBAR, tinggi)
    .catch(function () { return lewatHtml2Canvas(doc, A4.LEBAR, tinggi); });
}

/**
 * Rasterisasi memakai mesin render browser sendiri:
 * isi halaman → <foreignObject> di dalam SVG → <canvas> → JPEG.
 */
function lewatSvg(doc, lebar, tinggi) {
  return new Promise(function (resolve, reject) {
    let svg;
    try {
      svg = susunSvg(doc, lebar, tinggi);
    } catch (e) { reject(e); return; }

    const img = new Image();
    img.decoding = 'sync';

    const jam = setTimeout(function () { reject(new Error('Rasterisasi SVG melebihi batas waktu.')); }, 20000);

    img.onload = function () {
      clearTimeout(jam);
      try {
        const c = document.createElement('canvas');
        c.width  = Math.round(lebar * A4.SKALA);
        c.height = Math.round(tinggi * A4.SKALA);
        const x = c.getContext('2d', { willReadFrequently: true });
        x.fillStyle = '#FFFFFF';
        x.fillRect(0, 0, c.width, c.height);
        x.drawImage(img, 0, 0, c.width, c.height);

        if (kanvasKosong(x, c)) { reject(new Error('Hasil rasterisasi kosong.')); return; }
        resolve(c.toDataURL('image/jpeg', A4.MUTU));
      } catch (e) { reject(e); }
    };

    img.onerror = function () {
      clearTimeout(jam);
      reject(new Error('Browser menolak merender dokumen sebagai gambar.'));
    };

    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  });
}

/**
 * Bungkus isi dokumen menjadi SVG berukuran halaman.
 *
 * <foreignObject> hanya merender konten alir biasa, bukan elemen <html>.
 * Karena itu isi <body> dipindahkan ke sebuah <div> pembungkus yang
 * mewarisi gaya <body> apa adanya (font, warna, ukuran, padding halaman),
 * sehingga hasilnya sama persis dengan yang tampil di iframe.
 */
function susunSvg(doc, lebar, tinggi) {
  const body = doc.body;
  const cs = doc.defaultView.getComputedStyle(body);

  // Semua <style> dokumen dibawa serta apa adanya
  const gaya = [].slice.call(doc.querySelectorAll('style'))
    .map(function (el) { return el.textContent; }).join('\n');

  const bungkus = doc.createElement('div');
  bungkus.setAttribute('style', [
    'width:' + lebar + 'px',
    'height:' + tinggi + 'px',
    'box-sizing:border-box',
    'padding:' + cs.padding,
    'margin:0',
    'background:#FFFFFF',
    'font-family:' + cs.fontFamily,
    'font-size:' + cs.fontSize,
    'font-weight:' + cs.fontWeight,
    'line-height:' + cs.lineHeight,
    'letter-spacing:' + cs.letterSpacing,
    'color:' + cs.color
  ].join(';'));
  bungkus.innerHTML = '<style>' + gaya + '</style>' + body.innerHTML;

  // XMLSerializer menghasilkan markup yang sah sebagai XML (wajib di dalam SVG)
  let isi = new XMLSerializer().serializeToString(bungkus);
  if (isi.indexOf('xmlns=') === -1) {
    isi = isi.replace('<div', '<div xmlns="http://www.w3.org/1999/xhtml"');
  }

  return '<svg xmlns="http://www.w3.org/2000/svg" width="' + lebar + '" height="' + tinggi + '">' +
    '<foreignObject x="0" y="0" width="' + lebar + '" height="' + tinggi + '">' +
    isi +
    '</foreignObject></svg>';
}

/**
 * Deteksi hasil gagal: kanvas putih bersih padahal dokumen jelas ada isinya.
 * Diperiksa dengan menyapu kisi piksel, bukan beberapa titik saja — dokumen
 * ini banyak ruang putihnya, jadi menebak satu-dua titik mudah keliru.
 */
function kanvasKosong(ctx, canvas) {
  const LANGKAH = 8;                       // periksa tiap 8 piksel
  let bertinta = 0;
  for (let y = 0; y < canvas.height; y += LANGKAH) {
    const baris = ctx.getImageData(0, y, canvas.width, 1).data;
    for (let x = 0; x < baris.length; x += 4 * LANGKAH) {
      if (baris[x] < 245 || baris[x + 1] < 245 || baris[x + 2] < 245) {
        bertinta++;
        if (bertinta > 200) return false;  // cukup bukti bahwa dokumen tergambar
      }
    }
  }
  return true;
}

/** Jalan cadangan bila mesin render browser gagal. */
function lewatHtml2Canvas(doc, lebar, tinggi) {
  return muatHtml2Canvas().then(function () {
    return window.html2canvas(doc.body, {
      scale          : A4.SKALA,
      backgroundColor: '#FFFFFF',
      width          : lebar,
      height         : tinggi,
      windowWidth    : lebar,
      windowHeight   : tinggi,
      scrollX        : 0,
      scrollY        : 0,
      useCORS        : false,     // semua gambar sudah berupa data URI
      logging        : false
    }).then(function (canvas) {
      return canvas.toDataURL('image/jpeg', A4.MUTU);
    });
  });
}

// ══════════════════════════════════════════════════════════
// PRATINJAU · UNDUH · PRINT
// ══════════════════════════════════════════════════════════

/** Tampilkan hasil JPG beserta tombol Unduh JPG dan Print. */
function bukaPratinjauJpg(judul, dokumen) {
  document.getElementById('previewTitle').textContent = judul;
  document.getElementById('previewBody').innerHTML =
    '<img src="' + escapeAttr(dokumen.dataUri) + '" alt="' + escapeAttr(judul) + '">';

  // Preview ukuran penuh di tab baru — modal hanya menampilkan versi diperkecil
  const penuh = document.getElementById('previewFull');
  if (penuh) {
    penuh.hidden = false;
    penuh.removeAttribute('href');
    penuh.onclick = function (e) { e.preventDefault(); previewPenuh(); };
  }

  const unduh = document.getElementById('previewDownload');
  unduh.href = dokumen.dataUri;
  unduh.setAttribute('download', dokumen.namaBerkas);
  unduh.removeAttribute('target');
  unduh.innerHTML = '<i class="bi bi-download"></i> Unduh JPG';

  const print = document.getElementById('previewPrint');
  if (print) {
    print.hidden = false;
    print.removeAttribute('href');
    print.removeAttribute('target');
    print.onclick = function (e) { e.preventDefault(); printDokumen(); };
    print.innerHTML = '<i class="bi bi-printer"></i> Print';
  }

  new bootstrap.Modal(document.getElementById('previewModal')).show();
}

/** Buka JPG ukuran penuh di tab baru agar ketajamannya bisa diperiksa. */
function previewPenuh() {
  if (!dokumenTerakhir) return;
  const jendela = window.open('', '_blank');
  if (!jendela) {
    toast('Pop-up diblokir', 'Izinkan pop-up untuk situs ini agar pratinjau penuh bisa dibuka.', 'warning');
    return;
  }
  jendela.document.write(
    '<!DOCTYPE html><html><head><meta charset="UTF-8">' +
    '<title>' + escapeHtml(dokumenTerakhir.judul) + '</title><style>' +
    'html,body{margin:0;background:#111827;display:grid;place-items:start center}' +
    'img{max-width:100%;height:auto;box-shadow:0 8px 32px rgba(0,0,0,.5)}' +
    '</style></head><body><img src="' + escapeAttr(dokumenTerakhir.dataUri) + '" alt="' +
    escapeAttr(dokumenTerakhir.judul) + '"></body></html>');
  jendela.document.close();
}

/**
 * Cetak JPG yang sedang dipratinjau.
 * Gambar dibuka di jendela baru berukuran A4 penuh tanpa margin,
 * lalu dialog print browser dipanggil.
 */
function printDokumen() {
  if (!dokumenTerakhir) { toast('Belum ada dokumen', 'Buat dokumen terlebih dahulu.', 'warning'); return; }

  const jendela = window.open('', '_blank');
  if (!jendela) {
    toast('Pop-up diblokir',
      'Izinkan pop-up untuk situs ini, atau pakai tombol "Unduh JPG" lalu cetak dari galeri.',
      'warning');
    return;
  }

  jendela.document.write(
    '<!DOCTYPE html><html><head><meta charset="UTF-8">' +
    '<title>' + escapeHtml(dokumenTerakhir.judul) + '</title><style>' +
    '@page{size:A4;margin:0}' +
    'html,body{margin:0;padding:0;background:#fff}' +
    'img{display:block;width:100%;height:auto}' +
    '@media print{img{width:100%}}' +
    '</style></head><body>' +
    '<img src="' + escapeAttr(dokumenTerakhir.dataUri) + '" alt="' +
      escapeAttr(dokumenTerakhir.judul) + '">' +
    '<script>' +
    'window.onload=function(){setTimeout(function(){window.focus();window.print();},250)};' +
    '<\/script></body></html>');
  jendela.document.close();
}
