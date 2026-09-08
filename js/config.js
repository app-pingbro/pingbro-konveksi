/**
 * ============================================================
 * PING BRO KONVEKSI & SABLON — config.js
 *
 *  ⚠️  SATU-SATUNYA BERKAS YANG WAJIB ANDA EDIT.
 *
 *  Isi GAS_URL dengan alamat Web App Google Apps Script Anda.
 *  Cara mendapatkannya:
 *    Apps Script → Deploy → New deployment → Web app
 *      Execute as     : Me
 *      Who has access : Anyone
 *    → Salin "Web app URL" yang berakhiran /exec
 * ============================================================
 */

const KONFIG = {

  // ── WAJIB DIISI ────────────────────────────────────────
  // Contoh: 'https://script.google.com/macros/s/AKfycbxxxxxxxxxxxx/exec'
  GAS_URL: 'https://script.google.com/macros/s/AKfycbzdVwctWNeH7jqXf3NplRuAW7XaToCauzVxjpQZ9tv9MzVybHVd5jITHXNh0qGgA7Kp/exec',

  // ── Opsional ───────────────────────────────────────────
  // Kunci penyimpanan lokal di browser (ubah bila memasang lebih dari satu aplikasi
  // di domain GitHub Pages yang sama, agar datanya tidak saling menimpa).
  KUNCI_TOKEN : 'pingbro_token_v1',
  KUNCI_CACHE : 'pingbro_cache_v1',
  KUNCI_TEMA  : 'pingbro_theme',

  // Batas waktu satu permintaan ke server (milidetik).
  // Pembuatan PDF bisa memakan waktu, jadi jangan dibuat terlalu pendek.
  TIMEOUT_MS  : 60000
};

/** true bila GAS_URL masih berupa teks contoh dan belum diisi alamat sungguhan. */
function konfigBelumDiisi() {
  const u = String(KONFIG.GAS_URL || '').trim();
  return !u || u.indexOf('GANTI_DENGAN') === 0 || u.indexOf('http') !== 0;
}
