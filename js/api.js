/**
 * ============================================================
 * PING BRO KONVEKSI & SABLON — api.js
 *
 * Lapisan komunikasi ke backend Google Apps Script.
 * Menggantikan google.script.run dari versi iframe.
 *
 * Aturan penting:
 *  • Permintaan BACA  → GET  ?action=…&token=…
 *  • Permintaan TULIS → POST body JSON, header text/plain;charset=utf-8
 *    (application/json akan memicu CORS preflight yang tidak dilayani
 *     Apps Script, sehingga permintaan gagal sebelum sampai ke server)
 *  • Semua respons memakai amplop { success, data, message }
 * ============================================================
 */

// Daftar aksi yang dikirim lewat GET. Selain ini dianggap tulis (POST).
const AKSI_BACA = [
  'ping', 'getBootstrapData', 'getOrderDetail',
  'getMockupDataUri', 'getLinkSistem', 'buatPesanTagihan',
  'dokumenSpk', 'dokumenInvoice'      // hanya menyusun HTML, tidak menulis apa pun
];

// ── Token sesi ────────────────────────────────────────────

/** Ambil token yang tersimpan di perangkat ini. */
function ambilToken() {
  try { return localStorage.getItem(KONFIG.KUNCI_TOKEN) || ''; }
  catch (e) { return ''; }
}

function simpanToken(token) {
  try { localStorage.setItem(KONFIG.KUNCI_TOKEN, token); } catch (e) {}
}

function hapusToken() {
  try { localStorage.removeItem(KONFIG.KUNCI_TOKEN); } catch (e) {}
}

// ── Pemanggil utama ───────────────────────────────────────

/**
 * Panggil satu aksi di backend.
 *
 * @param {string} aksi  nama aksi, mis. 'getBootstrapData'
 * @param {Object} args  argumen aksi (boleh kosong)
 * @return {Promise<Object>} amplop { success, data, message }
 *
 * Contoh:
 *   apiCall('getOrderDetail', { nomor: 'ORD-001' })
 *     .then(function (res) { ... })
 *     .catch(function (err) { ... });
 */
function apiCall(aksi, args) {
  args = args || {};

  if (konfigBelumDiisi()) {
    return Promise.reject(new Error(
      'Alamat backend belum diisi. Buka berkas js/config.js lalu isi GAS_URL ' +
      'dengan URL /exec dari Google Apps Script Anda.'));
  }

  const token = ambilToken();
  const bacaSaja = AKSI_BACA.indexOf(aksi) !== -1;

  let url = KONFIG.GAS_URL;
  const opsi = { method: 'GET', redirect: 'follow' };

  if (bacaSaja) {
    const q = ['action=' + encodeURIComponent(aksi)];
    if (token) q.push('token=' + encodeURIComponent(token));
    Object.keys(args).forEach(function (k) {
      if (args[k] !== undefined && args[k] !== null)
        q.push(encodeURIComponent(k) + '=' + encodeURIComponent(args[k]));
    });
    url += (url.indexOf('?') === -1 ? '?' : '&') + q.join('&');
  } else {
    opsi.method = 'POST';
    // text/plain = "simple request" → tidak ada preflight OPTIONS
    opsi.headers = { 'Content-Type': 'text/plain;charset=utf-8' };
    opsi.body = JSON.stringify({ action: aksi, token: token, args: args });
  }

  return denganBatasWaktu(fetch(url, opsi), KONFIG.TIMEOUT_MS)
    .then(function (resp) {
      if (!resp.ok) throw new Error('Server menjawab ' + resp.status + ' ' + resp.statusText);
      return resp.text();
    })
    .then(function (teks) {
      let hasil;
      try {
        hasil = JSON.parse(teks);
      } catch (e) {
        // Biasanya terjadi bila URL /exec salah, deployment belum diperbarui,
        // atau akses Web App belum disetel "Anyone" — Google mengirim halaman HTML.
        throw new Error('Respons server bukan JSON. Periksa URL /exec dan pastikan ' +
                        'akses Web App disetel "Anyone".');
      }
      // Sesi habis → paksa kembali ke layar PIN
      if (hasil && hasil.perluLogin) {
        hapusToken();
        if (typeof tampilkanLayarPin === 'function') tampilkanLayarPin(hasil.message);
      }
      return hasil;
    });
}

/** Bungkus promise dengan batas waktu agar aplikasi tidak menggantung selamanya. */
function denganBatasWaktu(promise, ms) {
  return new Promise(function (resolve, reject) {
    const jam = setTimeout(function () {
      reject(new Error('Server tidak merespons dalam ' + Math.round(ms / 1000) + ' detik. ' +
                       'Periksa koneksi internet Anda.'));
    }, ms);
    promise.then(
      function (v) { clearTimeout(jam); resolve(v); },
      function (e) { clearTimeout(jam); reject(e); }
    );
  });
}

/** Tukar PIN dengan token sesi. */
function apiLogin(pin) {
  return apiCall('login', { pin: pin }).then(function (res) {
    if (res && res.success && res.data && res.data.token) simpanToken(res.data.token);
    return res;
  });
}

/** Ubah error apa pun menjadi kalimat yang bisa dibaca Owner. */
function pesanError(err) {
  if (!err) return 'Terjadi kesalahan yang tidak diketahui.';
  const teks = err.message || String(err);
  if (teks.indexOf('Failed to fetch') !== -1 || teks.indexOf('NetworkError') !== -1) {
    return 'Tidak dapat menghubungi server. Periksa koneksi internet, ' +
           'lalu pastikan URL /exec di js/config.js sudah benar.';
  }
  return teks;
}
