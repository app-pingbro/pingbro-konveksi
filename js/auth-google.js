/**
 * ============================================================
 * PING BRO KONVEKSI & SABLON — auth-google.js
 *
 * Login dengan akun Google lewat Supabase Auth, memakai alur
 * PKCE (RFC 7636) yang ditulis langsung dengan fetch + Web Crypto.
 *
 * Tidak memakai pustaka supabase-js sama sekali — sejalan dengan
 * seluruh aplikasi ini yang vanilla, dan tidak menambah satu pun
 * berkas dari CDN yang bisa gagal dimuat.
 *
 * Alur yang terjadi:
 *   1. authMulaiLogin()
 *        buat code_verifier acak → simpan di sessionStorage
 *        kirim SHA-256-nya (code_challenge) ke Supabase /authorize
 *        browser pindah ke Google
 *   2. Google → Supabase /callback → kembali ke aplikasi dengan ?code=…
 *   3. authSelesaikanLogin()
 *        tukar (code + code_verifier) di /token?grant_type=pkce
 *        simpan access_token + refresh_token
 *   4. authTokenAkses()
 *        dipakai setiap permintaan; memperbarui sendiri bila hampir habis
 *
 * Berlaku hanya bila KONFIG.MODE_LOGIN === 'google'.
 * Bila 'pin', seluruh berkas ini menganggur dan layar PIN tetap dipakai.
 * ============================================================
 */

const AUTH_KUNCI = {
  SESI     : 'pingbro_sesi_google_v1',
  VERIFIER : 'pingbro_pkce_verifier_v1'
};

/** true bila aplikasi disetel memakai login Google. */
function authAktif() {
  const m = (typeof KONFIG !== 'undefined' && KONFIG.MODE_LOGIN) || 'pin';
  return String(m).toLowerCase() === 'google';
}

/** true bila alamat & kunci Supabase sudah terisi. */
function authSiap() {
  return !!(typeof KONFIG !== 'undefined' &&
            KONFIG.SUPABASE_URL && KONFIG.SUPABASE_ANON_KEY);
}

function authPangkal() {
  return String(KONFIG.SUPABASE_URL || '').replace(/\/+$/, '');
}

// ── Peralatan kecil ───────────────────────────────────────

/** Ubah ArrayBuffer menjadi base64url (tanpa '=' di belakang). */
function authB64Url(buf) {
  const arr = new Uint8Array(buf);
  let s = '';
  for (let i = 0; i < arr.length; i++) s += String.fromCharCode(arr[i]);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * code_verifier acak. PKCE mewajibkan 43–128 karakter dari himpunan
 * "unreserved": A-Z a-z 0-9 - . _ ~
 */
function authAcak(n) {
  const abjad = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  const arr = new Uint8Array(n);
  (self.crypto || window.crypto).getRandomValues(arr);
  let s = '';
  for (let i = 0; i < arr.length; i++) s += abjad.charAt(arr[i] % abjad.length);
  return s;
}

function authSha256B64Url(teks) {
  const data = new TextEncoder().encode(teks);
  return (self.crypto || window.crypto).subtle.digest('SHA-256', data).then(authB64Url);
}

// ── Sesi tersimpan ────────────────────────────────────────

function authSesi() {
  try { return JSON.parse(localStorage.getItem(AUTH_KUNCI.SESI) || 'null'); }
  catch (e) { return null; }
}

function authSimpanSesi(sesi) {
  try { localStorage.setItem(AUTH_KUNCI.SESI, JSON.stringify(sesi)); } catch (e) {}
}

/** Hapus sesi di perangkat ini. Tidak mencabut akses di Supabase. */
function authKeluar() {
  try { localStorage.removeItem(AUTH_KUNCI.SESI); } catch (e) {}
  try { sessionStorage.removeItem(AUTH_KUNCI.VERIFIER); } catch (e) {}
}

/** Email pengguna yang sedang masuk, atau '' bila belum masuk. */
function authEmail() {
  const s = authSesi();
  return (s && s.email) || '';
}

function authNama() {
  const s = authSesi();
  return (s && (s.nama || s.email)) || '';
}

// ── Langkah 1: berangkat ke Google ────────────────────────

/**
 * Mulai login. Fungsi ini MEMINDAHKAN halaman, jadi tidak pernah
 * "selesai" secara normal — kode setelahnya tidak akan berjalan.
 */
function authMulaiLogin() {
  if (!authSiap()) {
    return Promise.reject(new Error(
      'Alamat Supabase belum diisi. Periksa Environment Variables di Vercel ' +
      '(SUPABASE_URL dan SUPABASE_ANON_KEY), lalu Redeploy.'));
  }

  const verifier = authAcak(64);
  try {
    sessionStorage.setItem(AUTH_KUNCI.VERIFIER, verifier);
  } catch (e) {
    return Promise.reject(new Error(
      'Browser memblokir penyimpanan sementara. Matikan mode penyamaran ' +
      'yang ketat atau izinkan cookie untuk situs ini.'));
  }

  return authSha256B64Url(verifier).then(function (challenge) {
    // redirect_to sengaja TANPA query & hash, supaya cocok dengan daftar
    // Redirect URLs di Supabase dan tidak menumpuk parameter lama.
    const kembali = location.origin + location.pathname;

    location.href = authPangkal() + '/auth/v1/authorize'
      + '?provider=google'
      + '&redirect_to='          + encodeURIComponent(kembali)
      + '&code_challenge='       + encodeURIComponent(challenge)
      + '&code_challenge_method=s256';
  });
}

// ── Langkah 2: kembali dari Google ────────────────────────

function authParamUrl(nama) {
  try { return new URLSearchParams(location.search).get(nama) || ''; }
  catch (e) { return ''; }
}

/** Ada '?code=' di alamat → berarti kita baru kembali dari Google. */
function authAdaKode() { return authParamUrl('code'); }

/** Google/Supabase menolak → pesan kesalahannya. */
function authAdaError() {
  return authParamUrl('error_description') || authParamUrl('error');
}

/** Buang jejak login dari alamat supaya tidak ikut ter-bookmark atau ter-refresh. */
function authBersihkanUrl() {
  try {
    const u = new URL(location.href);
    ['code', 'state', 'error', 'error_code', 'error_description']
      .forEach(function (k) { u.searchParams.delete(k); });
    const sisa = u.searchParams.toString();
    history.replaceState({}, '', u.pathname + (sisa ? '?' + sisa : '') + (u.hash || ''));
  } catch (e) {}
}

/** Tukar kode dari Google menjadi sesi. */
function authSelesaikanLogin() {
  const kode = authAdaKode();
  const salah = authAdaError();

  if (salah) {
    authBersihkanUrl();
    return Promise.reject(new Error(salah));
  }
  if (!kode) return Promise.reject(new Error('Tidak ada kode login di alamat.'));

  let verifier = '';
  try { verifier = sessionStorage.getItem(AUTH_KUNCI.VERIFIER) || ''; } catch (e) {}

  if (!verifier) {
    authBersihkanUrl();
    return Promise.reject(new Error(
      'Kode pengaman login tidak ditemukan. Ini terjadi bila proses login ' +
      'diselesaikan di tab atau browser yang berbeda. Silakan klik ' +
      '"Masuk dengan Google" sekali lagi dari tab ini.'));
  }

  return authTukarToken('pkce', { auth_code: kode, code_verifier: verifier })
    .then(function (sesi) {
      try { sessionStorage.removeItem(AUTH_KUNCI.VERIFIER); } catch (e) {}
      authBersihkanUrl();
      return sesi;
    })
    .catch(function (err) {
      authBersihkanUrl();
      throw err;
    });
}

// ── Penukaran & pembaruan token ───────────────────────────

function authTukarToken(grant, isi) {
  const url = authPangkal() + '/auth/v1/token?grant_type=' + encodeURIComponent(grant);

  return fetch(url, {
    method : 'POST',
    headers: {
      'apikey'      : KONFIG.SUPABASE_ANON_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(isi)
  })
  .then(function (resp) {
    return resp.text().then(function (teks) {
      let j = null;
      try { j = JSON.parse(teks); } catch (e) {}
      return { ok: resp.ok, status: resp.status, j: j };
    });
  })
  .then(function (r) {
    if (!r.ok || !r.j || !r.j.access_token) {
      const pesan = (r.j && (r.j.error_description || r.j.msg || r.j.error))
                  || ('Supabase menjawab ' + r.status + '.');
      throw new Error(pesan);
    }
    const p = r.j.user || {};
    const meta = p.user_metadata || {};
    const sesi = {
      access_token : r.j.access_token,
      refresh_token: r.j.refresh_token || '',
      expires_at   : Date.now() + ((Number(r.j.expires_in) || 3600) * 1000),
      email        : p.email || '',
      nama         : meta.full_name || meta.name || p.email || ''
    };
    authSimpanSesi(sesi);
    return sesi;
  });
}

// Satu janji bersama, supaya sepuluh permintaan yang bersamaan tidak
// memicu sepuluh pembaruan token sekaligus.
let authJanjiSegar = null;

/**
 * Token akses yang dijamin masih berlaku.
 * Diperbarui otomatis bila sisa umurnya kurang dari 60 detik.
 */
function authTokenAkses() {
  const sesi = authSesi();

  if (!sesi || !sesi.access_token) {
    return Promise.reject(authErrorPerluLogin('Belum masuk.'));
  }

  if (Date.now() < (Number(sesi.expires_at || 0) - 60000)) {
    return Promise.resolve(sesi.access_token);
  }

  if (!sesi.refresh_token) {
    authKeluar();
    return Promise.reject(authErrorPerluLogin('Sesi berakhir. Silakan masuk lagi.'));
  }

  if (!authJanjiSegar) {
    authJanjiSegar = authTukarToken('refresh_token', { refresh_token: sesi.refresh_token })
      .then(function (baru) {
        authJanjiSegar = null;
        return baru.access_token;
      })
      .catch(function (err) {
        authJanjiSegar = null;
        authKeluar();
        throw authErrorPerluLogin('Sesi berakhir. Silakan masuk lagi.');
      });
  }
  return authJanjiSegar;
}

function authErrorPerluLogin(pesan) {
  const e = new Error(pesan);
  e.perluLogin = true;
  return e;
}
