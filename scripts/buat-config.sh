#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════════════
# buat-config.sh — PINGBRO Konveksi & Sablon
#
# Dijalankan otomatis oleh Vercel setiap kali deploy.
# Tugasnya: menulis js/config.js dari Environment Variables Vercel,
# supaya TIDAK ADA satu pun alamat/kunci yang tersimpan di GitHub.
#
# Dipasang di Vercel → Settings → Build & Development Settings:
#   Build Command    : bash scripts/buat-config.sh
#   Output Directory : .   (titik — berarti folder utama)
# ══════════════════════════════════════════════════════════════════
set -euo pipefail

gagal() { echo ""; echo "❌ $1"; echo ""; exit 1; }

# ── Wajib ada ─────────────────────────────────────────────────────
[ -n "${GAS_URL:-}" ] || gagal "Environment Variable GAS_URL belum diisi di Vercel.
   Vercel → Settings → Environment Variables → Add New → nama: GAS_URL"

# ── Mode data: 'gas' (lama, aman) atau 'supabase' (baru) ──────────
SUMBER_DATA="${SUMBER_DATA:-gas}"

if [ "$SUMBER_DATA" = "supabase" ]; then
  [ -n "${SUPABASE_URL:-}" ]      || gagal "SUMBER_DATA=supabase tapi SUPABASE_URL belum diisi."
  [ -n "${SUPABASE_ANON_KEY:-}" ] || gagal "SUMBER_DATA=supabase tapi SUPABASE_ANON_KEY belum diisi."
fi

# ── Penjaga: service role key TIDAK BOLEH ikut ke browser ─────────
# Kalau tanpa sengaja diberi nama yang terbaca di sini, deploy dihentikan.
case "${SUPABASE_ANON_KEY:-}" in
  *service_role*) gagal "SUPABASE_ANON_KEY berisi SERVICE ROLE KEY.
   Kunci itu memberi akses penuh ke seluruh data dan TIDAK BOLEH masuk browser.
   Pakai kunci 'anon public' dari Supabase → Settings → API." ;;
esac
[ -z "${SUPABASE_SERVICE_ROLE_KEY:-}" ] || gagal "SUPABASE_SERVICE_ROLE_KEY terdeteksi di lingkungan build.
   Hapus dari Vercel. Kunci itu hanya untuk skrip migrasi di komputer Anda."

mkdir -p js
cat > js/config.js <<EOF
/**
 * ============================================================
 *  BERKAS INI DIBUAT OTOMATIS SAAT DEPLOY — JANGAN DIEDIT.
 *  Sumbernya: Environment Variables di Vercel.
 *  Dibuat pada: $(date -u '+%Y-%m-%d %H:%M UTC')
 * ============================================================
 */
const KONFIG = {
  // Sumber data: 'gas' = Google Sheets (lama) · 'supabase' = PostgreSQL (baru)
  SUMBER_DATA : '${SUMBER_DATA}',

  // Apps Script — tetap dipakai untuk mockup di Google Drive
  GAS_URL     : '${GAS_URL}',

  // Supabase — kunci anon aman di browser karena dijaga RLS
  SUPABASE_URL      : '${SUPABASE_URL:-}',
  SUPABASE_ANON_KEY : '${SUPABASE_ANON_KEY:-}',

  KUNCI_TOKEN : 'pingbro_token_v1',
  KUNCI_CACHE : 'pingbro_cache_v1',
  KUNCI_TEMA  : 'pingbro_theme',
  TIMEOUT_MS  : 60000
};

function konfigBelumDiisi() {
  const u = String(KONFIG.GAS_URL || '').trim();
  return !u || u.indexOf('GANTI_DENGAN') === 0 || u.indexOf('http') !== 0;
}
EOF

echo "✅ js/config.js dibuat — SUMBER_DATA=${SUMBER_DATA}"
echo "   GAS_URL       : ${GAS_URL:0:45}…"
if [ "$SUMBER_DATA" = "supabase" ]; then
  echo "   SUPABASE_URL  : ${SUPABASE_URL}"
  echo "   ANON_KEY      : ${SUPABASE_ANON_KEY:0:12}… (${#SUPABASE_ANON_KEY} karakter)"
fi
