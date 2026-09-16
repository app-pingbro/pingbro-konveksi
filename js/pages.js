/**
 * ============================================================
 * PING BRO KONVEKSI & SABLON — Frontend
 * pages.js — Dashboard, Daftar Order, Detail Order, SPK, Invoice, Notifikasi
 * ============================================================
 */

// ══════════════════════════════════════════════════════════
// BAGIAN 5: DASHBOARD
// ══════════════════════════════════════════════════════════

function renderDashboard() {
  const d = AppState.dashboard;
  if (!d) return;
  const k = d.kpi;

  // ── KPI ──
  document.getElementById('kpiGrid').innerHTML =
    kartuKpi('bi-inbox', '', k.totalAktif, 'Total Order Aktif', 'chip-progress', '+' + k.totalOrder + ' total') +
    kartuKpi('bi-arrow-repeat', '', k.diproses, 'Sedang Diproses', 'chip-progress', 'Dalam antrean') +
    kartuKpi('bi-hourglass-split', 'amber', k.deadlineDekat, 'Deadline Dekat', 'chip-warning', '≤ ' + d.batasWarning + ' hari') +
    kartuKpi('bi-exclamation-octagon', 'red', k.terlambat, 'Order Terlambat', 'chip-danger', k.terlambat > 0 ? 'Perlu tindakan!' : 'Aman', k.terlambat > 0);

  // ── Kartu keuangan ──
  const bulan = NAMA_BULAN[new Date().getMonth()] + ' ' + new Date().getFullYear();
  document.getElementById('kartuKeuangan').innerHTML =
    '<div class="finance-card">' +
      '<div class="finance-head"><span>KEUANGAN OPERASIONAL</span>' +
        '<span class="chip chip-progress">' + bulan + '</span></div>' +
      '<div class="finance-note">Total Pemasukan Bulan Ini</div>' +
      '<div class="finance-value num">' + rupiah(k.pemasukanBulanIni) + '</div>' +
      '<div class="finance-note">Omset berjalan seluruh order: ' + rupiah(k.omsetBerjalan) + '</div>' +
      '<div class="finance-sub">' +
        '<div><small>Piutang / Belum Lunas (' + k.orderBelumLunas + ' order)</small>' +
          '<b class="num">' + rupiah(k.piutang) + '</b></div>' +
        '<button class="btn-primary" onclick="navigateTo(\'invoice\')">' +
          '<i class="bi bi-receipt"></i> Tagih</button>' +
      '</div>' +
    '</div>';

  // ── Analisis otomatis ──
  document.getElementById('insightList').innerHTML =
    (d.insights || []).map(function (t) { return '<li>' + t + '</li>'; }).join('') ||
    '<li>Belum ada data yang cukup untuk dianalisis.</li>';

  // ── Legend jenis pekerjaan ──
  const total = k.totalOrder || 1;
  const warna = { 'Full Order':'#0D9488', 'Sablon':'#2DD4BF', 'Jahit':'#94A3B8' };
  document.getElementById('legendJenis').innerHTML = Object.keys(d.perJenis).map(function (j) {
    const pct = Math.round((d.perJenis[j] / total) * 100);
    return '<div class="legend-item"><span class="legend-dot" style="background:' +
      (warna[j] || '#64748B') + '"></span><b>' + pct + '%</b> ' + escapeHtml(j) + '</div>';
  }).join('');

  // ── Order prioritas ──
  const box = document.getElementById('listPrioritas');
  box.innerHTML = (d.prioritas && d.prioritas.length)
    ? d.prioritas.map(function (o) { return kartuOrder(o, { prioritas: true }); }).join('')
    : '<div class="empty-state"><i class="bi bi-check2-circle"></i>Tidak ada order mendesak. Semua terkendali.</div>';

  const per = document.getElementById('dashPeriode');
  if (per) per.textContent = bulan;

  gambarChartOmset(d.tren);
  gambarChartStatus(d.perStatus);
}

function kartuKpi(ikon, warna, nilai, label, chipKelas, chipTeks, bahaya) {
  return '<div class="kpi-card' + (bahaya ? ' danger' : '') + '">' +
    '<div class="kpi-top"><div class="kpi-icon ' + warna + '"><i class="bi ' + ikon + '"></i></div>' +
    '<span class="chip ' + chipKelas + '">' + escapeHtml(chipTeks) + '</span></div>' +
    '<div class="kpi-value num">' + nilai + '</div>' +
    '<div class="kpi-label">' + escapeHtml(label) + '</div></div>';
}

function warnaTeksChart() {
  return document.documentElement.getAttribute('data-theme') === 'dark' ? '#8CA3BC' : '#64748B';
}
function warnaGridChart() {
  return document.documentElement.getAttribute('data-theme') === 'dark' ? 'rgba(255,255,255,.07)' : 'rgba(15,23,42,.07)';
}

function gambarChartOmset(tren) {
  const ctx = document.getElementById('chartOmset');
  if (!ctx || typeof Chart === 'undefined' || !tren) return;
  if (AppState.charts.omset) AppState.charts.omset.destroy();

  AppState.charts.omset = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: tren.map(function (b) {
        return (b.bulanIdx !== undefined) ? NAMA_BULAN[b.bulanIdx] : b.label;
      }),
      datasets: [{
        label: 'Omset (juta)',
        data: tren.map(function (b) { return +(b.omset / 1000000).toFixed(2); }),
        backgroundColor: tren.map(function (_, i) {
          return i === tren.length - 1 ? '#0D9488' : 'rgba(13,148,136,.35)';
        }),
        borderRadius: 8, borderSkipped: false, maxBarThickness: 42
      }]
    },
    options: {
      responsive:true, maintainAspectRatio:false,
      plugins:{
        legend:{ display:false },
        tooltip:{
          callbacks:{ label:function (c) { return 'Omset: Rp ' + (c.parsed.y * 1000000).toLocaleString('id-ID'); } }
        }
      },
      scales:{
        y:{ beginAtZero:true, ticks:{ color:warnaTeksChart(), callback:function (v) { return v + 'jt'; } },
            grid:{ color:warnaGridChart(), drawBorder:false } },
        x:{ ticks:{ color:warnaTeksChart() }, grid:{ display:false, drawBorder:false } }
      }
    }
  });
}

function gambarChartStatus(perStatus) {
  const ctx = document.getElementById('chartStatus');
  if (!ctx || typeof Chart === 'undefined' || !perStatus) return;
  if (AppState.charts.status) AppState.charts.status.destroy();

  const label = Object.keys(perStatus);
  const nilai = label.map(function (l) { return perStatus[l]; });
  const warna = { 'Belum Dikerjakan':'#94A3B8', 'Proses':'#0D9488',
                  'Material':'#5EEAD4', 'Cutting':'#2DD4BF', 'Jahit':'#14B8A6',
                  'Sablon':'#0D9488', 'Finishing':'#0F766E', 'Kirim':'#115E59',
                  'Sukses':'#22C55E', 'Selesai':'#22C55E', 'Terlambat':'#DC2626' };

  AppState.charts.status = new Chart(ctx, {
    type:'doughnut',
    data:{ labels:label, datasets:[{
      data:nilai,
      backgroundColor: label.map(function (l) { return warna[l] || '#64748B'; }),
      borderWidth:0, cutout:'62%'
    }]},
    options:{
      responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{ position:'bottom',
        labels:{ color:warnaTeksChart(), padding:14, usePointStyle:true, pointStyle:'circle', boxWidth:8 } } }
    }
  });
}

function perbaruiTemaChart() {
  if (AppState.dashboard) {
    gambarChartOmset(AppState.dashboard.tren);
    gambarChartStatus(AppState.dashboard.perStatus);
  }
}

// ══════════════════════════════════════════════════════════
// BAGIAN 6: DAFTAR ORDER
// ══════════════════════════════════════════════════════════

function setFilterJenis(el, jenis) {
  document.querySelectorAll('#filterJenis .chip-filter').forEach(function (b) { b.classList.remove('active'); });
  el.classList.add('active');
  AppState.filter.jenis = jenis;
  renderDaftarOrder();
}

function resetFilterOrder() {
  document.getElementById('cariOrder').value = '';
  document.getElementById('filterBayar').value = '';
  document.getElementById('filterProduksi').value = '';
  document.getElementById('filterUrutan').value = 'baru';
  AppState.filter.jenis = 'Semua';
  document.querySelectorAll('#filterJenis .chip-filter').forEach(function (b, i) {
    b.classList.toggle('active', i === 0);
  });
  renderDaftarOrder();
}

function orderTersaring() {
  const q      = (document.getElementById('cariOrder') || {}).value || '';
  const bayar  = (document.getElementById('filterBayar') || {}).value || '';
  const produksi = (document.getElementById('filterProduksi') || {}).value || '';
  const urut   = (document.getElementById('filterUrutan') || {}).value || 'baru';
  const kata   = q.toLowerCase().trim();

  let hasil = AppState.orders.filter(function (o) {
    if (AppState.filter.jenis !== 'Semua' && o.JenisOrder !== AppState.filter.jenis) return false;
    if (bayar && o.StatusPembayaran !== bayar) return false;
    if (produksi === '__terlambat') { if (!o.Terlambat) return false; }
    else if (produksi && o.StatusProduksi !== produksi) return false;
    if (!kata) return true;
    return [o.NomorOrder, o.NamaProject, o.NamaCustomer, o.NomorSPK, o.Bahan]
      .join(' ').toLowerCase().indexOf(kata) !== -1;
  });

  if (urut === 'deadline') hasil.sort(function (a, b) { return a.SisaHari - b.SisaHari; });
  else if (urut === 'nilai') hasil.sort(function (a, b) { return b.TotalHarga - a.TotalHarga; });

  return hasil;
}

function renderDaftarOrder() {
  const box = document.getElementById('listOrder');
  if (!box) return;
  const data = orderTersaring();

  // Ringkasan atas
  const totalQty = data.reduce(function (a, o) { return a + (o.TotalQty || 0); }, 0);
  const terlambat = data.filter(function (o) { return o.Terlambat; }).length;
  const nilai = data.reduce(function (a, o) { return a + o.TotalHarga; }, 0);
  const rb = document.getElementById('ringkasDaftar');
  if (rb) rb.innerHTML =
    '<div class="ringkas-item"><b class="num">' + data.length + '</b><small>Order</small></div>' +
    '<div class="ringkas-item"><b class="num">' + totalQty + '</b><small>Total Pcs</small></div>' +
    '<div class="ringkas-item ' + (terlambat ? 'warn' : 'ok') + '"><b class="num">' + terlambat + '</b><small>Terlambat</small></div>' +
    '<div class="ringkas-item"><b class="num">' + rupiahSingkat(nilai) + '</b><small>Nilai Order</small></div>';

  box.innerHTML = data.length
    ? data.map(function (o) { return kartuOrder(o); }).join('')
    : '<div class="empty-state"><i class="bi bi-inbox"></i>Belum ada order yang cocok dengan filter.<br>' +
      '<button class="btn-ghost mt-2" onclick="navigateTo(\'tambah\')">+ Buat order baru</button></div>';
}

/**
 * Kartu order (dipakai di dashboard & daftar order).
 * @param {object} o    data order
 * @param {object} opsi { prioritas:true } → varian kartu "Order Prioritas & Deadline Mendekat"
 *                      pada Dashboard: menampilkan warna kain dan badge hitung mundur
 *                      deadline di bawah baris Jenis Order & status pembayaran.
 */
function kartuOrder(o, opsi) {
  // Array.map mengirim indeks sebagai argumen kedua — abaikan bila bukan objek opsi
  opsi = (opsi && typeof opsi === 'object') ? opsi : {};
  const kelas = o.Terlambat ? 'late'
              : statusSelesai(o.StatusProduksi) ? 'done'
              : o.StatusProduksi === 'Belum Dikerjakan' ? 'pending' : '';
  const pct = persenProduksi(o.StatusProduksi);
  const urgen = kelasUrgensi(o.SisaHari);

  // Bahan · Warna Kain · Qty (warna hanya ditambahkan pada kartu prioritas Dashboard)
  const bahanQty = escapeHtml(o.Bahan || '-') +
    (opsi.prioritas && o.WarnaBahan ? ' · ' + escapeHtml(o.WarnaBahan) : '') +
    ' · ' + (o.TotalQty || 0) + ' pcs';

  // Blok identitas: #KODE ORDER → Nama Project → Nama Customer · WhatsApp.
  // Ketiganya berurutan tanpa disela apa pun, jadi terbaca sebagai satu kesatuan.
  // Badge (jenis order, status bayar, hitung mundur) diletakkan sesudahnya —
  // pada layar lebar badge otomatis naik ke sisi kanan blok yang sama.
  return '<div class="order-card ' + kelas + '">' +
    '<div class="oc-ident">' +
      '<span class="oc-code">#' + escapeHtml(o.NomorOrder) + '</span>' +
      '<div class="oc-title">' + escapeHtml(o.NamaProject) + '</div>' +
      '<div class="oc-cust"><i class="bi bi-person"></i> ' + escapeHtml(o.NamaCustomer) +
        (o.WhatsApp ? ' &nbsp;·&nbsp; ' + escapeHtml(o.WhatsApp) : '') + '</div>' +
      '<div class="oc-chips">' +
        '<span class="chip chip-navy">' + escapeHtml(o.JenisOrder) + '</span>' +
        '<span class="chip ' + kelasChipBayar(o.StatusPembayaran) + '">' + escapeHtml(o.StatusPembayaran) + '</span>' +
        (opsi.prioritas
          ? '<span class="chip ' + urgen + '"><i class="bi bi-alarm"></i> ' + labelSisaHari(o.SisaHari) + '</span>'
          : '') +
      '</div>' +
    '</div>' +

    '<div class="oc-spec">' +
      '<div class="oc-spec-row"><span><i class="bi bi-box-seam"></i> Bahan &amp; Qty</span>' +
        '<span>' + bahanQty + '</span></div>' +
      // Kartu prioritas Dashboard: cukup tanggal deadline (berwarna sesuai urgensi).
      // Hitung mundur "berapa hari lagi" hanya tampil sekali, di badge atas.
      '<div class="oc-spec-row"><span><i class="bi bi-calendar-event"></i> Deadline</span>' +
        (opsi.prioritas
          ? '<span><span class="chip ' + urgen + '">' + formatTanggal(o.TanggalDeadline) + '</span></span>'
          : '<span>' + formatTanggal(o.TanggalDeadline) +
            ' <span class="chip ' + urgen + '">' + labelSisaHari(o.SisaHari) + '</span></span>') +
      '</div>' +
    '</div>' +

    '<div class="oc-progress">' +
      '<div class="oc-progress-head"><span>Status SPK: <b>' + escapeHtml(o.StatusProduksi) + '</b></span>' +
        '<b>' + pct + '%</b></div>' +
      '<div class="progress-track"><div class="progress-fill ' +
        (o.Terlambat ? 'late' : statusSelesai(o.StatusProduksi) ? 'done' : '') +
        '" style="width:' + pct + '%"></div></div>' +
    '</div>' +

    '<div class="oc-money">' +
      '<div><small>TOTAL ORDER</small><b class="num">' + rupiah(o.TotalHarga) + '</b></div>' +
      '<div style="text-align:right">' +
        (o.SisaPembayaran > 0
          ? '<small>SISA TAGIHAN</small><span class="sisa num">' + rupiah(o.SisaPembayaran) + '</span>'
          : '<small>PEMBAYARAN</small><span class="lunas">✓ Lunas</span>') +
      '</div>' +
    '</div>' +

    '<div class="oc-actions">' +
      '<button class="btn-navy" onclick="bukaDetail(\'' + escapeAttr(o.NomorOrder) + '\')">' +
        '<i class="bi bi-eye"></i> Detail</button>' +
      '<button class="btn-outline" onclick="editOrder(\'' + escapeAttr(o.NomorOrder) + '\')">' +
        '<i class="bi bi-pencil-square"></i> Edit</button>' +
      // Pasangan tombol cetak: [ Cetak SPK ][ Cetak Invoice ]
      // Dibungkus satu wadah agar SELALU bersebelahan dengan lebar & style identik.
      (function () {
        const nomorInv = opsi.prioritas ? nomorInvoiceOrder(o.NomorOrder) : '';
        const btnSpk = o.NomorSPK
          ? '<button class="btn-outline" onclick="cetakSpk(\'' + escapeAttr(o.NomorSPK) + '\')">' +
            '<i class="bi bi-printer"></i> Cetak SPK</button>' : '';
        const btnInv = nomorInv
          ? '<button class="btn-outline" onclick="cetakInvoice(\'' + escapeAttr(nomorInv) + '\')">' +
            '<i class="bi bi-file-earmark-image"></i> Cetak Invoice</button>' : '';
        if (btnSpk && btnInv) return '<div class="oc-print-pair">' + btnSpk + btnInv + '</div>';
        return btnSpk + btnInv;
      })() +
      (o.SisaPembayaran > 0
        ? '<button class="btn-soft" onclick="bukaPesanWa(\'' + escapeAttr(o.NomorOrder) + '\')">' +
          '<i class="bi bi-whatsapp"></i> Tagih</button>'
        : '') +
    '</div></div>';
}

// ══════════════════════════════════════════════════════════
// BAGIAN 7: DETAIL ORDER
// ══════════════════════════════════════════════════════════

function bukaDetail(nomorOrder) {
  navigateTo('detail');
  const box = document.getElementById('detailOrderBody');
  box.innerHTML = '<div class="empty-state"><div class="busy-spinner"></div>Memuat detail order…</div>';

  apiCall('getOrderDetail', { nomor: nomorOrder })
    .then(function (res) {
      if (!res || !res.success) {
        box.innerHTML = '<div class="empty-state"><i class="bi bi-exclamation-triangle"></i>' +
          escapeHtml(res ? res.message : 'Gagal memuat.') + '</div>';
        return;
      }
      box.innerHTML = htmlDetailOrder(res.data);
    })
    .catch(function (err) {
      box.innerHTML = '<div class="empty-state"><i class="bi bi-wifi-off"></i>' + escapeHtml(pesanError(err)) + '</div>';
    });
}

function htmlDetailOrder(d) {
  const o = d.order, spk = d.spk, inv = d.invoice, bayar = d.pembayaran || [];

  const riwayat = bayar.length
    ? bayar.map(function (p) {
        return '<li><b>' + rupiah(p.JumlahDibayar) + '</b>' +
          '<small>' + formatTanggal(p.TanggalPembayaran) + ' · ' + escapeHtml(p.MetodePembayaran || '-') +
          (p.CatatanPembayaran ? ' · ' + escapeHtml(p.CatatanPembayaran) : '') + '</small></li>';
      }).join('')
    : '<li><b>Belum ada pembayaran</b><small>Catat DP atau pelunasan pertama</small></li>';

  return '<div class="detail-hero">' +
      '<div class="code">#' + escapeHtml(o.NomorOrder) + '</div>' +
      '<div class="title">' + escapeHtml(o.NamaProject) + ' — ' + escapeHtml(o.NamaCustomer) + '</div>' +
      '<div class="chips">' +
        '<span class="chip chip-progress">' + escapeHtml(o.JenisOrder) + '</span>' +
        '<span class="chip chip-status-spk ' + kelasChipProduksi(o.StatusProduksi) + '">' + escapeHtml(o.StatusProduksi) + '</span>' +
        (o.Terlambat ? '<span class="chip chip-danger">Terlambat</span>' : '') +
        '<span class="chip ' + kelasChipBayar(o.StatusPembayaran) + '">' + escapeHtml(o.StatusPembayaran) + '</span>' +
        (o.NomorSPK ? '<span class="chip chip-pending">' + escapeHtml(o.NomorSPK) + '</span>' : '') +
      '</div></div>' +

    '<div class="card-surface mb-3">' +
      '<div class="card-head"><div><h2 class="card-title">Spesifikasi Produksi</h2>' +
        '<p class="card-sub">Data acuan workshop</p></div></div>' +
      '<div class="spec-grid">' +
        boxSpec('Bahan / Material', o.Bahan || '-') +
        boxSpec('Warna Kain', o.WarnaBahan || '-') +
        boxSpec('Tanggal Order', formatTanggal(o.TanggalOrder)) +
        boxSpec('Deadline', formatTanggal(o.TanggalDeadline) + ' (' + labelSisaHari(o.SisaHari) + ')') +
        boxSpec('Jenis Sablon', o.JenisSablon || '-') +
        boxSpec('Sablon Depan', o.SablonDepan || '-') +
        boxSpec('Sablon Belakang', o.SablonBelakang || '-') +
      '</div>' +
      (o.CatatanTambahan ? '<div class="mockup-info mt-3"><i class="bi bi-sticky"></i> ' +
        escapeHtml(o.CatatanTambahan) + '</div>' : '') +
    '</div>' +

    // ── Mockup desain ────────────────────────────────────
    '<div class="card-surface mb-3">' +
      '<div class="card-head"><div><h2 class="card-title">Mockup Desain</h2>' +
        '<p class="card-sub">' + (o.MockupUrl ? 'Tersimpan di Google Drive' : 'Belum ada desain yang diunggah') + '</p></div>' +
        (o.MockupUrl
          ? '<button class="btn-ghost" onclick="perbesarMockup(\'' + escapeAttr(o.NomorOrder) + '\')">' +
            'Perbesar <i class="bi bi-arrows-fullscreen"></i></button>'
          : '') + '</div>' +
      (o.MockupUrl
        ? '<div class="mockup-frame" id="mockupFrame">' +
            '<img id="mockupImg" class="mockup-detail" alt="Mockup ' + escapeAttr(o.NomorOrder) + '" ' +
            'src="' + escapeAttr(urlThumbDrive(o.MockupUrl, 1400)) + '" ' +
            'onerror="muatMockupCadangan(this,\'' + escapeAttr(o.NomorOrder) + '\')">' +
          '</div>' +
          '<a class="btn-ghost mt-2" href="' + escapeAttr(o.MockupUrl) + '" target="_blank" rel="noopener">' +
            '<i class="bi bi-box-arrow-up-right"></i> Buka di Google Drive</a>'
        : '<div class="item-empty"><i class="bi bi-image"></i>Belum ada mockup untuk order ini.<br>' +
          'Unggah desain saat membuat atau mengubah order.</div>') +
    '</div>' +

    // ── Rincian item — gaya kartu sama dengan RINCIAN UKURAN di Buat Order Baru ──
    '<div class="card-surface mb-3">' +
      '<div class="card-head"><div>' +
        '<h2 class="card-title">Rincian Item</h2>' +
        '<p class="card-sub">Kategori, ukuran, dan jumlah pcs yang dipesan</p></div>' +
        '<span class="chip chip-progress">' + (o.TotalQty || 0) + ' pcs</span></div>' +
      htmlRincianItem(o.Items) +
    '</div>' +

    // ── Rincian material — kebutuhan bahan dari rincian item di atas ──
    kartuMaterialDetail(d) +

    '<div class="card-surface mb-3">' +
      '<div class="card-head"><div><h2 class="card-title">Keuangan</h2>' +
        '<p class="card-sub">' + (inv ? escapeHtml(inv.NomorInvoice) : 'Invoice belum dibuat') + '</p></div></div>' +
      '<div class="calc-rows">' +
        '<div class="calc-row"><span>Total Tagihan</span><b class="num">' + rupiah(o.TotalHarga) + '</b></div>' +
        '<div class="calc-row"><span>Sudah Dibayar</span><b class="num">' + rupiah(o.DP) + '</b></div>' +
        '<div class="calc-row calc-total"><span>Sisa Tagihan</span><b class="num">' + rupiah(o.SisaPembayaran) + '</b></div>' +
      '</div>' +
      '<h3 class="card-title mt-3 mb-2" style="font-size:13px">Riwayat Pembayaran</h3>' +
      '<ul class="timeline">' + riwayat + '</ul>' +
      '<div class="oc-actions mt-2">' +
        (o.SisaPembayaran > 0
          ? '<button class="btn-primary" onclick="bukaModalBayar(\'' + escapeAttr(o.NomorOrder) + '\',' +
            o.SisaPembayaran + ')"><i class="bi bi-cash-coin"></i> Catat Pembayaran</button>' : '') +
        (inv ? '<button class="btn-outline" onclick="cetakInvoice(\'' + escapeAttr(inv.NomorInvoice) + '\')">' +
          '<i class="bi bi-file-earmark-image"></i> Cetak Invoice</button>' : '') +
        '<button class="btn-soft" onclick="bukaPesanWa(\'' + escapeAttr(o.NomorOrder) + '\')">' +
          '<i class="bi bi-whatsapp"></i> Kirim Tagihan</button>' +
      '</div>' +
    '</div>' +

    (spk ? '<div class="card-surface mb-3">' +
      '<div class="card-head"><div><h2 class="card-title">' + escapeHtml(spk.NomorSPK) + '</h2>' +
        '<p class="card-sub">' + escapeHtml(spk.DetailPekerjaan || '-') + '</p></div>' +
        '<span class="chip chip-status-spk ' + kelasChipProduksi(spk.StatusPengerjaan) + '">' +
          escapeHtml(spk.StatusPengerjaan) + '</span></div>' +
      (spk.CatatanProduksi ? '<div class="mockup-info mb-3"><i class="bi bi-tools"></i> ' +
        escapeHtml(spk.CatatanProduksi) + '</div>' : '') +

      // Checklist tahapan produksi — menggantikan dropdown status
      htmlChecklistTahap(spk) +

      '<div class="oc-actions mt-2">' +
        '<button class="btn-navy" onclick="cetakSpk(\'' + escapeAttr(spk.NomorSPK) + '\')">' +
          '<i class="bi bi-printer"></i> Cetak SPK</button></div>' +
    '</div>' : '') +

    '<div class="oc-actions mb-3">' +
      '<button class="btn-navy" onclick="editOrder(\'' + escapeAttr(o.NomorOrder) + '\')">' +
        '<i class="bi bi-pencil-square"></i> Edit Order</button>' +
      '<button class="btn-outline" onclick="hapusOrder(\'' + escapeAttr(o.NomorOrder) + '\')">' +
        '<i class="bi bi-trash"></i> Hapus Order</button>' +
    '</div>';
}

function boxSpec(label, isi) {
  return '<div class="spec-box"><small>' + escapeHtml(label) + '</small><b>' + escapeHtml(isi) + '</b></div>';
}

// ── Mockup ────────────────────────────────────────────────

/** URL thumbnail Drive — lebih andal ditampilkan di dalam iframe daripada tautan uc?export=view. */
function urlThumbDrive(url, lebar) {
  const m = String(url || '').match(/[-\w]{25,}/);
  return m ? ('https://drive.google.com/thumbnail?id=' + m[0] + '&sz=w' + (lebar || 1200)) : '';
}

/**
 * Cadangan bila gambar Drive gagal dimuat browser: ambil datanya dari server
 * lalu tampilkan sebagai data URI. Hanya dicoba satu kali per gambar.
 */
function muatMockupCadangan(img, nomorOrder) {
  if (!img) return;
  if (img.dataset.cadangan === '1') { gagalMockup(img, 'Mockup tidak dapat ditampilkan di sini.'); return; }
  img.dataset.cadangan = '1';

  apiCall('getMockupDataUri', { nomor: nomorOrder })
    .then(function (res) {
      if (res && res.success) img.src = res.data.dataUri;
      else gagalMockup(img, res ? res.message : 'Gagal memuat mockup.');
    })
    .catch(function (err) { gagalMockup(img, pesanError(err)); });
}

function gagalMockup(img, pesan) {
  const frame = img.parentNode;
  if (!frame) return;
  // Petunjuk menyesuaikan halaman: Detail Order punya tautan Drive, kartu SPK tidak
  const adaTautan = !!(frame.parentNode && frame.parentNode.querySelector('a[href*="drive"]'));
  frame.innerHTML = '<div class="item-empty"><i class="bi bi-image"></i>' + escapeHtml(pesan) +
    '<br>' + (adaTautan ? 'Gunakan tombol "Buka di Google Drive" di bawah.'
                        : 'Buka mockup melalui halaman Detail Order.') + '</div>';
}

/**
 * Blok mockup pada kartu SPK Produksi.
 * Gambar ditampilkan langsung (bukan hanya tombol) memakai tautan thumbnail Drive,
 * dengan cadangan data URI dari server bila browser menolak memuatnya di dalam iframe.
 * Berkas mockup di Drive tidak diubah sama sekali — hanya ditampilkan.
 */
function htmlMockupSpk(s, order) {
  order = order || {};
  const url = s.MockupUrl || order.MockupUrl || '';

  if (!url) {
    return '<div class="spk-mockup">' +
      '<div class="spk-mockup-head"><span><i class="bi bi-image"></i> Mockup Desain</span></div>' +
      '<div class="item-empty"><i class="bi bi-image"></i>Belum ada mockup pada order ini.<br>' +
      'Unggah desain melalui Edit Order.</div></div>';
  }

  return '<div class="spk-mockup">' +
    '<div class="spk-mockup-head"><span><i class="bi bi-image"></i> Mockup Desain</span>' +
      '<button type="button" class="btn-ghost" onclick="perbesarMockupKartu(this)">' +
        'Perbesar <i class="bi bi-arrows-fullscreen"></i></button></div>' +
    '<div class="mockup-frame">' +
      '<img class="mockup-detail" alt="Mockup ' + escapeAttr(s.NomorSPK) + '" loading="lazy" ' +
      'src="' + escapeAttr(urlThumbDrive(url, 1200)) + '" ' +
      'onerror="muatMockupCadangan(this,\'' + escapeAttr(s.NomorOrder) + '\')">' +
    '</div></div>';
}

/** Perbesar mockup pada kartu SPK — mengambil gambar di kartu yang sama. */
function perbesarMockupKartu(tombol) {
  const blok = tombol.closest('.spk-mockup');
  const img  = blok ? blok.querySelector('img') : null;
  if (!img || !img.src) { toast('Mockup', 'Gambar belum selesai dimuat.', 'warning'); return; }
  bukaPratinjau(img.alt || 'Mockup', img.src, 'image');
}

/** Perbesar mockup memakai gambar yang sudah berhasil dimuat. */
function perbesarMockup(nomorOrder) {
  const img = document.getElementById('mockupImg');
  if (!img || !img.src) { toast('Mockup', 'Gambar belum selesai dimuat.', 'warning'); return; }
  bukaPratinjau('Mockup ' + nomorOrder, img.src, 'image');
}

// ── Rincian item (gaya kartu RINCIAN UKURAN) ──────────────

/**
 * Tampilkan item order memakai struktur kartu yang sama dengan
 * panel RINCIAN UKURAN pada halaman Buat Order Baru — hanya baca.
 */
/**
 * Kartu RINCIAN MATERIAL pada Detail Order.
 *
 * Angka yang ditampilkan adalah hasil yang TERCATAT saat order terakhir
 * disimpan, bukan hitungan ulang. Dengan begitu mengubah rumus di kemudian
 * hari tidak mengubah angka pada order-order lama.
 *
 * Untuk order lama yang dibuat sebelum fitur ini ada, arsipnya kosong —
 * angkanya dihitung ulang memakai rumus yang berlaku sekarang, dan hal itu
 * disebutkan terus terang pada keterangan kartunya.
 */
function kartuMaterialDetail(d) {
  const o = d.order || {};
  const items = o.Items || [];
  const arsip = d.material || [];
  const dariArsip = arsip.length > 0;

  const hasil = dariArsip
    ? arsip.map(function (m) {
        return { id: m.id, nama: m.nama, satuan: m.satuan, rumus: m.rumus, hasil: m.hasil, error: '' };
      })
    : materialTerpakai(items, o.Bahan);

  const tanggal = dariArsip && arsip[0].dihitungPada ? formatTanggal(arsip[0].dihitungPada) : '';

  return '<div class="card-surface mb-3">' +
    '<div class="card-head"><div>' +
      '<h2 class="card-title">Rincian Material</h2>' +
      '<p class="card-sub">' +
        (dariArsip
          ? 'Kebutuhan bahan, dihitung saat order disimpan' + (tanggal ? ' · ' + tanggal : '')
          : 'Dihitung ulang memakai rumus yang berlaku sekarang') +
      '</p></div>' +
      (o.Bahan ? '<span class="chip chip-navy">' + escapeHtml(o.Bahan) + '</span>' : '') +
    '</div>' +
    htmlRincianMaterial(hasil, { bahan: o.Bahan, adaItem: items.length > 0 }) +
  '</div>';
}

function htmlRincianItem(items) {
  if (!items || !items.length) {
    return '<div class="item-empty"><i class="bi bi-inbox"></i>Order ini belum memiliki rincian item.</div>';
  }

  const grup = {};        // dikelompokkan per produk + kategori + harga
  const urutanGrup = [];
  const tanpaUkuran = []; // jasa sablon / screen — tidak punya ukuran

  items.forEach(function (i) {
    const ukuran = String(i.Ukuran || '-').trim();
    if (!ukuran || ukuran === '-') { tanpaUkuran.push(i); return; }

    const kunci = [i.JenisProduk, i.Kategori, i.HargaSatuan].join('||');
    if (!grup[kunci]) {
      grup[kunci] = {
        produk: i.JenisProduk || '-', kategori: i.Kategori || '-',
        harga: Number(i.HargaSatuan) || 0, ukuran: {}, custom: []
      };
      urutanGrup.push(kunci);
    }
    if (ukuran === 'Custom') {
      grup[kunci].custom.push({
        label: i.UkuranCustom || 'Custom Size', jumlah: Number(i.Jumlah) || 0
      });
    } else {
      grup[kunci].ukuran[ukuran] = (grup[kunci].ukuran[ukuran] || 0) + (Number(i.Jumlah) || 0);
    }
  });

  let html = urutanGrup.map(function (k) {
    const g = grup[k];
    let qty = 0;
    UKURAN_BAKU.forEach(function (u) { qty += (g.ukuran[u] || 0); });
    g.custom.forEach(function (c) { qty += c.jumlah; });

    return '<div class="kat-card readonly">' +
      '<div class="kat-head">' +
        '<div class="kat-ident"><span class="kat-name">' + escapeHtml(g.kategori) + '</span>' +
          '<span class="kat-produk-view">' + escapeHtml(g.produk) + '</span></div>' +
        '<div class="kat-harga"><label>Harga/pcs</label>' +
          '<span class="kat-harga-view num">' + rupiah(g.harga) + '</span></div>' +
      '</div>' +

      '<div class="size-grid">' +
        UKURAN_BAKU.map(function (u) {
          const n = g.ukuran[u] || 0;
          return '<div class="size-cell"><label>' + u + '</label>' +
            '<div class="size-box' + (n > 0 ? ' terisi' : ' kosong') + '">' + n + '</div></div>';
        }).join('') +
      '</div>' +

      g.custom.map(function (c) {
        return '<div class="manual-row-view"><span><i class="bi bi-rulers"></i> ' +
          escapeHtml(c.label) + '</span><b class="num">' + c.jumlah + ' pcs</b></div>';
      }).join('') +

      '<div class="kat-sub"><span>Subtotal kategori</span>' +
        '<b>' + qty + ' pcs · <span class="rp">' + rupiah(qty * g.harga) + '</span></b></div>' +
    '</div>';
  }).join('');

  html += tanpaUkuran.map(function (i) {
    const qty = Number(i.Jumlah) || 0;
    const harga = Number(i.HargaSatuan) || 0;
    const warna = [];
    if (i.WarnaSablonDepan) warna.push('Depan: ' + i.WarnaSablonDepan);
    if (i.WarnaSablonBelakang) warna.push('Belakang: ' + i.WarnaSablonBelakang);

    return '<div class="kat-card readonly">' +
      '<div class="kat-head">' +
        '<div class="kat-ident"><span class="kat-name">' + escapeHtml(i.JenisProduk || 'Item') + '</span></div>' +
        '<div class="kat-harga"><label>Harga satuan</label>' +
          '<span class="kat-harga-view num">' + rupiah(harga) + '</span></div>' +
      '</div>' +
      '<div class="manual-row-view"><span><i class="bi bi-box"></i> Jumlah</span>' +
        '<b class="num">' + qty + ' pcs</b></div>' +
      (warna.length
        ? '<div class="manual-row-view"><span><i class="bi bi-palette"></i> Warna sablon</span>' +
          '<b>' + escapeHtml(warna.join(' · ')) + '</b></div>' : '') +
      '<div class="kat-sub"><span>Subtotal item</span>' +
        '<b>' + qty + ' pcs · <span class="rp">' + rupiah(qty * harga) + '</span></b></div>' +
    '</div>';
  }).join('');

  return html;
}

// ── Checklist tahapan produksi ────────────────────────────

/** Daftar tahapan; dikirim server saat bootstrap, dengan cadangan bila kosong. */
function daftarTahap() {
  return (AppState.tahapProduksi && AppState.tahapProduksi.length)
    ? AppState.tahapProduksi
    : ['Material', 'Cutting', 'Jahit', 'Sablon', 'Finishing', 'Kirim'];
}

/**
 * Checklist tahapan produksi — pengganti dropdown status.
 * Setiap blok diberi data-spk agar beberapa checklist bisa tampil bersamaan
 * (mis. pada daftar SPK) tanpa saling mengganggu.
 */
function htmlChecklistTahap(spk) {
  const tahap = daftarTahap();
  const aktif = spk.TahapList || [];
  const selesai = aktif.length;
  const persen = Math.round((selesai / tahap.length) * 100);
  const kunci = escapeAttr(spk.NomorSPK);

  return '<div class="tahap-wrap" data-spk="' + kunci + '">' +
    '<div class="tahap-head"><span>Status Produksi</span>' +
      '<b data-tahap-ringkas>' + selesai + '/' + tahap.length + ' tahap · ' + persen + '%</b></div>' +
    '<div class="progress-track mb-3"><div class="progress-fill' + (persen >= 100 ? ' done' : '') +
      '" data-tahap-bar style="width:' + persen + '%"></div></div>' +

    '<div class="tahap-list">' +
      tahap.map(function (t) {
        const dicentang = aktif.indexOf(t) !== -1;
        return '<label class="tahap-item' + (dicentang ? ' done' : '') + '">' +
          '<input type="checkbox" value="' + escapeAttr(t) + '"' + (dicentang ? ' checked' : '') +
          ' onchange="simpanTahap(\'' + kunci + '\')">' +
          '<span class="tahap-box"><i class="bi bi-check-lg"></i></span>' +
          '<span class="tahap-nama">' + escapeHtml(t) + '</span>' +
        '</label>';
      }).join('') +
    '</div></div>';
}

/**
 * Simpan checklist. Seluruh tampilan diperbarui seketika di sisi client
 * (tanpa memuat ulang data dari server), lalu perubahan dikirim ke server
 * di latar belakang. Status SPK langsung terlihat berubah.
 */
function simpanTahap(nomorSPK) {
  const terpilih = [];
  document.querySelectorAll('.tahap-wrap[data-spk="' + nomorSPK + '"]').forEach(function (blok) {
    blok.querySelectorAll('input[type="checkbox"]').forEach(function (c) {
      c.closest('.tahap-item').classList.toggle('done', c.checked);
      if (c.checked && terpilih.indexOf(c.value) === -1) terpilih.push(c.value);
    });
  });

  // Urutkan mengikuti urutan baku, lalu turunkan statusnya secara lokal
  const daftar = daftarTahap();
  const urut = daftar.filter(function (t) { return terpilih.indexOf(t) !== -1; });
  const status = statusLokalDariTahap(urut);

  // 1. Perbarui state di memori
  AppState.spk.forEach(function (s) {
    if (s.NomorSPK === nomorSPK) { s.TahapList = urut; s.StatusPengerjaan = status; }
  });
  AppState.orders.forEach(function (o) {
    if (o.NomorSPK === nomorSPK) { o.TahapList = urut; o.StatusProduksi = status; }
  });
  simpanCacheLokal();

  // 2. Perbarui tampilan seketika — termasuk angka & kartu Dashboard
  perbaruiTampilanTahap(nomorSPK, urut, status);
  segarkanDashboardLokal();
  perbaruiBadge();
  renderDashboard();
  renderSpk();
  renderDaftarOrder();
  renderNotifikasi();

  // 3. Kirim ke server di latar belakang (tanpa overlay / muat ulang penuh)
  apiCall('updateTahapProduksi', { nomorSPK: nomorSPK, tahapList: urut })
    .then(function (res) {
      if (!res || !res.success) {
        toast('Gagal menyimpan', res ? res.message : 'Tidak ada respons.', 'danger');
        muatDataServer(true);      // kembalikan ke kondisi server yang benar
        return;
      }
      toast('Tersimpan', 'Status SPK: ' + res.data.status, 'success');
    })
    .catch(function (err) {
      toast('Error', pesanError(err), 'danger');
      muatDataServer(true);
    });
}

/**
 * Hitung ulang angka Dashboard yang dipengaruhi status produksi,
 * langsung dari data di memori — tanpa menunggu server.
 * Angka keuangan tidak disentuh karena tidak terpengaruh status.
 */
function segarkanDashboardLokal() {
  const d = AppState.dashboard;
  if (!d || !d.kpi) return;
  const batas = Number(AppState.config.deadlineWarning || d.batasWarning || 3);

  let totalAktif = 0, diproses = 0, terlambat = 0, deadlineDekat = 0;
  const perStatus = { 'Belum Dikerjakan': 0 };
  daftarTahap().forEach(function (t) { perStatus[t] = 0; });
  perStatus['Sukses'] = 0;

  AppState.orders.forEach(function (o) {
    perStatus[o.StatusProduksi] = (perStatus[o.StatusProduksi] || 0) + 1;
    if (statusSelesai(o.StatusProduksi)) return;
    totalAktif++;
    if (o.StatusProduksi !== 'Belum Dikerjakan') diproses++;
    if (o.Terlambat) terlambat++;
    else if (o.SisaHari >= 0 && o.SisaHari <= batas) deadlineDekat++;
  });

  d.kpi.totalAktif    = totalAktif;
  d.kpi.diproses      = diproses;
  d.kpi.terlambat     = terlambat;
  d.kpi.deadlineDekat = deadlineDekat;
  d.perStatus         = perStatus;
  d.prioritas = AppState.orders
    .filter(function (o) { return !statusSelesai(o.StatusProduksi); })
    .slice()
    .sort(function (a, b) { return a.SisaHari - b.SisaHari; })
    .slice(0, 5);

  simpanCacheLokal();
}

/** Status SPK = tahap terakhir yang dicentang; semua tercentang = "Sukses". */
function statusLokalDariTahap(urut) {
  const daftar = daftarTahap();
  if (!urut.length) return 'Belum Dikerjakan';
  if (urut.length >= daftar.length) return 'Sukses';
  for (let i = daftar.length - 1; i >= 0; i--) {
    if (urut.indexOf(daftar[i]) !== -1) return daftar[i];
  }
  return 'Belum Dikerjakan';
}

/** Segarkan progres & badge status pada seluruh blok checklist SPK terkait. */
function perbaruiTampilanTahap(nomorSPK, urut, status) {
  const total = daftarTahap().length;
  const persen = Math.round((urut.length / total) * 100);

  document.querySelectorAll('.tahap-wrap[data-spk="' + nomorSPK + '"]').forEach(function (blok) {
    const bar = blok.querySelector('[data-tahap-bar]');
    const ringkas = blok.querySelector('[data-tahap-ringkas]');
    if (bar) { bar.style.width = persen + '%'; bar.classList.toggle('done', persen >= 100); }
    if (ringkas) ringkas.textContent = urut.length + '/' + total + ' tahap · ' + persen + '%';
  });

  // Badge status pada kartu detail order
  document.querySelectorAll('#section-detail .chip-status-spk').forEach(function (el) {
    el.textContent = status;
    el.className = 'chip chip-status-spk ' + kelasChipProduksi(status);
  });
}

function hapusOrder(nomorOrder) {
  konfirmasi('Hapus Order', 'Order ' + nomorOrder +
    ' beserta SPK, invoice, dan riwayat pembayarannya akan dihapus permanen. Lanjutkan?', function () {
    busy(true, 'Menghapus order…');
    apiCall('deleteOrder', { nomor: nomorOrder })
      .then(function (res) {
        busy(false);
        if (res && res.success) { toast('Berhasil', res.message, 'success'); refreshSemua(); navigateTo('daftar'); }
        else toast('Gagal', res ? res.message : 'Tidak ada respons.', 'danger');
      })
      .catch(function (err) { busy(false); toast('Error', pesanError(err), 'danger'); });
  });
}

// ══════════════════════════════════════════════════════════
// BAGIAN 9: SPK
// ══════════════════════════════════════════════════════════

function setFilterSpk(el, status) {
  document.querySelectorAll('#filterSpkStatus .chip-filter').forEach(function (b) { b.classList.remove('active'); });
  el.classList.add('active');
  AppState.filter.spk = status;
  renderSpk();
}

function renderSpk() {
  const box = document.getElementById('listSpk');
  if (!box) return;
  const kata = ((document.getElementById('cariSpk') || {}).value || '').toLowerCase().trim();

  const data = AppState.spk.filter(function (s) {
    if (AppState.filter.spk === '__terlambat') { if (!s.Terlambat) return false; }
    else if (AppState.filter.spk !== 'Semua' && s.StatusPengerjaan !== AppState.filter.spk) return false;
    if (!kata) return true;
    return [s.NomorSPK, s.NomorOrder, s.NamaProject, s.NamaCustomer]
      .join(' ').toLowerCase().indexOf(kata) !== -1;
  });

  box.innerHTML = data.length ? data.map(kartuSpk).join('')
    : '<div class="empty-state"><i class="bi bi-clipboard-x"></i>Tidak ada SPK yang cocok.</div>';
}

function kartuSpk(s) {
  const pct = persenProduksi(s.StatusPengerjaan);
  const kelas = s.Terlambat ? 'late'
              : statusSelesai(s.StatusPengerjaan) ? 'done'
              : s.StatusPengerjaan === 'Belum Dikerjakan' ? 'pending' : '';
  const prio = { 'Tinggi':'chip-danger', 'Sedang':'chip-warning', 'Rendah':'chip-pending' }[s.Prioritas] || 'chip-pending';

  // Jenis Kain & Total Order diambil dari Order yang menjadi acuan SPK ini
  const order = (AppState.orders || []).find(function (o) { return o.NomorOrder === s.NomorOrder; }) || {};
  const jenisKain  = s.WarnaBahan || order.WarnaBahan || '';
  const totalOrder = (order.TotalQty != null ? order.TotalQty : (s.TotalQty || 0));

  return '<div class="order-card ' + kelas + '">' +
    '<div class="oc-top"><span class="oc-code">' + escapeHtml(s.NomorSPK) + '</span>' +
      '<div class="oc-chips">' +
        '<span class="chip ' + prio + '">Prioritas ' + escapeHtml(s.Prioritas || 'Sedang') + '</span>' +
        '<span class="chip ' + kelasChipProduksi(s.StatusPengerjaan) + '">' + escapeHtml(s.StatusPengerjaan) + '</span>' +
      '</div></div>' +
    '<div class="oc-title">' + escapeHtml(s.NamaProject) + '</div>' +
    '<div class="oc-cust"><i class="bi bi-person"></i> ' + escapeHtml(s.NamaCustomer || '-') +
      ' &nbsp;·&nbsp; Ref: ' + escapeHtml(s.NomorOrder) + '</div>' +

    '<div class="oc-spec">' +
      '<div class="oc-spec-row"><span><i class="bi bi-scissors"></i> Jenis Pekerjaan</span>' +
        '<span>' + escapeHtml(s.JenisPekerjaan || '-') + '</span></div>' +
      '<div class="oc-spec-row"><span><i class="bi bi-layers"></i> Material</span>' +
        '<span>' + escapeHtml(s.Material || '-') + '</span></div>' +
      '<div class="oc-spec-row"><span><i class="bi bi-palette"></i> Jenis Kain</span>' +
        '<span>' + escapeHtml(jenisKain || '-') + '</span></div>' +
      '<div class="oc-spec-row"><span><i class="bi bi-calendar-check"></i> Target Selesai</span>' +
        '<span>' + formatTanggal(s.Deadline) + '</span></div>' +
      '<div class="oc-spec-row"><span><i class="bi bi-box-seam"></i> Total Order</span>' +
        '<span>' + totalOrder + ' pcs</span></div>' +
    '</div>' +

    // Mockup desain langsung tampil di kartu SPK — bukan sekadar tombol
    htmlMockupSpk(s, order) +

    '<div class="oc-progress">' +
      '<div class="oc-progress-head"><span>Progres produksi</span><b>' + pct + '%</b></div>' +
      '<div class="progress-track"><div class="progress-fill ' +
        (s.Terlambat ? 'late' : statusSelesai(s.StatusPengerjaan) ? 'done' : '') +
        '" style="width:' + pct + '%"></div></div>' +
    '</div>' +

    (s.CatatanProduksi ? '<div class="mockup-info" style="margin-bottom:.7rem"><i class="bi bi-tools"></i> ' +
      escapeHtml(s.CatatanProduksi) + '</div>' : '') +

    // Status SPK mengikuti checklist ini — tidak ada lagi dropdown status
    htmlChecklistTahap(s) +

    '<div class="oc-actions">' +
      '<button class="btn-navy" onclick="cetakSpk(\'' + escapeAttr(s.NomorSPK) + '\')">' +
        '<i class="bi bi-printer"></i> Cetak SPK</button>' +
      '<button class="btn-outline" onclick="bukaDetail(\'' + escapeAttr(s.NomorOrder) + '\')">' +
        '<i class="bi bi-eye"></i> Detail Order</button>' +
    '</div></div>';
}

// cetakSpk() dipindah ke js/cetak.js — dokumen sekarang dibuat sebagai JPG.

// ══════════════════════════════════════════════════════════
// BAGIAN 10: INVOICE & PEMBAYARAN
// ══════════════════════════════════════════════════════════

function setFilterInvoice(el, status) {
  el.parentNode.querySelectorAll('.chip-filter').forEach(function (b) { b.classList.remove('active'); });
  el.classList.add('active');
  AppState.filter.invoice = status;
  renderInvoice();
}

function renderInvoice() {
  const box = document.getElementById('listInvoice');
  if (!box) return;
  const kata = ((document.getElementById('cariInvoice') || {}).value || '').toLowerCase().trim();

  // Gabungkan invoice dengan data order agar status pembayaran selalu mutakhir
  const peta = {};
  AppState.orders.forEach(function (o) { peta[o.NomorOrder] = o; });

  const data = AppState.invoices.map(function (inv) {
    const o = peta[inv.NomorOrder] || {};
    return {
      inv: inv, o: o,
      total: Number(o.TotalHarga || inv.TotalHarga) || 0,
      dibayar: Number(o.DP !== undefined ? o.DP : inv.TotalDibayar) || 0,
      sisa: Number(o.SisaPembayaran !== undefined ? o.SisaPembayaran : inv.SisaTagihan) || 0,
      status: o.StatusPembayaran || 'Belum Bayar'
    };
  }).filter(function (r) {
    if (AppState.filter.invoice !== 'Semua' && r.status !== AppState.filter.invoice) return false;
    if (!kata) return true;
    return [r.inv.NomorInvoice, r.inv.NomorOrder, r.inv.NamaCustomer, r.o.NamaProject]
      .join(' ').toLowerCase().indexOf(kata) !== -1;
  }).sort(function (a, b) { return String(b.inv.NomorInvoice).localeCompare(String(a.inv.NomorInvoice)); });

  // Ringkasan keuangan
  const k = AppState.dashboard ? AppState.dashboard.kpi : null;
  const rk = document.getElementById('ringkasKeuangan');
  if (rk && k) rk.innerHTML =
    kartuUang('Pemasukan Bulan Ini', rupiah(k.pemasukanBulanIni), 'Kas masuk tercatat', false) +
    kartuUang('Sisa Piutang', rupiah(k.piutang), k.orderBelumLunas + ' invoice belum lunas', true) +
    kartuUang('Omset Berjalan', rupiah(k.omsetBerjalan), k.totalOrder + ' order tercatat', false) +
    kartuUang('Total Invoice', String(k.totalInvoice), 'Dokumen diterbitkan', false);

  box.innerHTML = data.length ? data.map(kartuInvoice).join('')
    : '<div class="empty-state"><i class="bi bi-receipt"></i>Belum ada invoice yang cocok.</div>';
}

function kartuUang(label, nilai, ket, warn) {
  return '<div class="money-card' + (warn ? ' warn' : '') + '">' +
    '<small>' + escapeHtml(label).toUpperCase() + '</small>' +
    '<b class="num">' + escapeHtml(nilai) + '</b>' +
    '<span>' + escapeHtml(ket) + '</span></div>';
}

function kartuInvoice(r) {
  const inv = r.inv, o = r.o;
  const kelas = r.status === 'Lunas' ? 'done' : r.status === 'Belum Bayar' ? 'late' : '';
  const pctBayar = r.total > 0 ? Math.round((r.dibayar / r.total) * 100) : 0;

  // Urutan informasi: Nama Pelanggan → Nama Project → No. Invoice
  return '<div class="order-card ' + kelas + '">' +
    '<div class="oc-top"><span class="oc-code">' + escapeHtml(inv.NamaCustomer || '-') + '</span>' +
      '<div class="oc-chips">' +
        '<span class="chip ' + kelasChipBayar(r.status) + '">' + escapeHtml(r.status) + '</span>' +
      '</div></div>' +
    '<div class="oc-title">' + escapeHtml(o.NamaProject || inv.NomorOrder) + '</div>' +
    '<div class="oc-cust"><i class="bi bi-receipt"></i> ' + escapeHtml(inv.NomorInvoice) +
      ' &nbsp;·&nbsp; Ref: ' + escapeHtml(inv.NomorOrder) + '</div>' +

    '<div class="oc-spec">' +
      '<div class="oc-spec-row"><span><i class="bi bi-calendar3"></i> Tanggal Invoice</span>' +
        '<span>' + formatTanggal(inv.TanggalInvoice) + '</span></div>' +
      '<div class="oc-spec-row"><span><i class="bi bi-alarm"></i> Jatuh Tempo</span>' +
        '<span>' + formatTanggal(inv.JatuhTempo) + '</span></div>' +
      '<div class="oc-spec-row"><span><i class="bi bi-cash-stack"></i> Sudah Dibayar</span>' +
        '<span>' + rupiah(r.dibayar) + ' (' + pctBayar + '%)</span></div>' +
    '</div>' +

    '<div class="oc-progress">' +
      '<div class="oc-progress-head"><span>Progres pelunasan</span><b>' + pctBayar + '%</b></div>' +
      '<div class="progress-track"><div class="progress-fill ' + (pctBayar >= 100 ? 'done' : '') +
        '" style="width:' + Math.min(100, pctBayar) + '%"></div></div></div>' +

    '<div class="oc-money">' +
      '<div><small>TOTAL TAGIHAN</small><b class="num">' + rupiah(r.total) + '</b></div>' +
      '<div style="text-align:right">' + (r.sisa > 0
        ? '<small>SISA</small><span class="sisa num">' + rupiah(r.sisa) + '</span>'
        : '<small>STATUS</small><span class="lunas">✓ Lunas</span>') + '</div>' +
    '</div>' +

    '<div class="oc-actions">' +
      (r.sisa > 0 ? '<button class="btn-primary" onclick="bukaModalBayar(\'' +
        escapeAttr(inv.NomorOrder) + '\',' + r.sisa + ')"><i class="bi bi-cash-coin"></i> Catat Bayar</button>' : '') +
      '<button class="btn-navy" onclick="cetakInvoice(\'' + escapeAttr(inv.NomorInvoice) + '\')">' +
        '<i class="bi bi-file-earmark-image"></i> Cetak Invoice</button>' +
      '<button class="btn-soft" onclick="bukaPesanWa(\'' + escapeAttr(inv.NomorOrder) + '\')">' +
        '<i class="bi bi-whatsapp"></i> Kirim WA</button>' +
    '</div></div>';
}

// cetakInvoice() dipindah ke js/cetak.js — dokumen sekarang dibuat sebagai JPG.

/** Modal catat pembayaran. */
function bukaModalBayar(nomorOrder, sisa) {
  const o = AppState.orders.filter(function (x) { return x.NomorOrder === nomorOrder; })[0] || {};
  document.getElementById('bayarInfo').innerHTML =
    '<div><span>Order</span><b>' + escapeHtml(nomorOrder) + '</b></div>' +
    '<div><span>Customer</span><b>' + escapeHtml(o.NamaCustomer || '-') + '</b></div>' +
    '<div><span>Total Tagihan</span><b>' + rupiah(o.TotalHarga || 0) + '</b></div>' +
    '<div><span>Sisa Tagihan</span><b style="color:#DC2626">' + rupiah(sisa) + '</b></div>';
  document.getElementById('bayarJumlah').value = (Number(sisa) || 0).toLocaleString('id-ID');
  document.getElementById('bayarCatatan').value = '';

  const modal = new bootstrap.Modal(document.getElementById('bayarModal'));
  const btn = document.getElementById('bayarSimpanBtn');
  const klon = btn.cloneNode(true);
  btn.parentNode.replaceChild(klon, btn);
  klon.onclick = function () {
    const jumlah = parseAngka(document.getElementById('bayarJumlah').value);
    if (jumlah <= 0) { toast('Nilai tidak valid', 'Jumlah pembayaran harus lebih dari 0.', 'warning'); return; }
    modal.hide();
    busy(true, 'Menyimpan pembayaran…');
    apiCall('addPayment', {
        nomor: nomorOrder,
        jumlah: jumlah,
        metode: document.getElementById('bayarMetode').value,
        catatan: document.getElementById('bayarCatatan').value
      })
      .then(function (res) {
        busy(false);
        if (res && res.success) { toast('Pembayaran tercatat', res.message, 'success'); refreshSemua(); }
        else toast('Gagal', res ? res.message : 'Tidak ada respons.', 'danger');
      })
      .catch(function (err) { busy(false); toast('Error', pesanError(err), 'danger'); });
  };
  modal.show();
}

/** Siapkan draft pesan tagihan WhatsApp. */
function bukaPesanWa(nomorOrder) {
  busy(true, 'Menyusun pesan…');
  apiCall('buatPesanTagihan', { nomor: nomorOrder })
    .then(function (res) {
      busy(false);
      if (!res || !res.success) { toast('Gagal', res ? res.message : 'Tidak ada respons.', 'danger'); return; }
      document.getElementById('waPesan').value = res.data.pesan;
      const link = document.getElementById('waLink');
      if (res.data.linkWa) { link.href = res.data.linkWa; link.style.display = ''; }
      else link.style.display = 'none';
      new bootstrap.Modal(document.getElementById('waModal')).show();
    })
    .catch(function (err) { busy(false); toast('Error', pesanError(err), 'danger'); });
}

function salinPesanWa() {
  const ta = document.getElementById('waPesan');
  ta.removeAttribute('readonly');
  ta.select(); ta.setSelectionRange(0, 99999);
  try { document.execCommand('copy'); toast('Tersalin', 'Pesan tagihan disalin ke clipboard.', 'success'); }
  catch (e) { toast('Gagal menyalin', 'Silakan salin manual.', 'warning'); }
  ta.setAttribute('readonly', 'readonly');
}

// ══════════════════════════════════════════════════════════
// BAGIAN 12: NOTIFIKASI
// ══════════════════════════════════════════════════════════

function renderNotifikasi() {
  const box = document.getElementById('listNotifikasi');
  if (!box) return;
  const batas = Number(AppState.config.deadlineWarning || 3);

  const deadline = AppState.orders.filter(function (o) {
    return !statusSelesai(o.StatusProduksi) && o.SisaHari <= batas;
  }).sort(function (a, b) { return a.SisaHari - b.SisaHari; });

  const tagihan = AppState.orders.filter(function (o) { return o.SisaPembayaran > 0; })
    .sort(function (a, b) { return b.SisaPembayaran - a.SisaPembayaran; });

  let html = '';

  if (deadline.length) {
    html += '<h2 class="card-title mb-2">⏱️ Deadline Mendesak (' + deadline.length + ')</h2>';
    html += deadline.map(function (o) {
      const kelas = o.SisaHari < 0 ? 'chip-danger' : 'chip-warning';
      return '<div class="order-card ' + (o.SisaHari < 0 ? 'late' : '') + '">' +
        '<div class="oc-top"><span class="oc-code">#' + escapeHtml(o.NomorOrder) + '</span>' +
        '<span class="chip ' + kelas + '">' + labelSisaHari(o.SisaHari) + '</span></div>' +
        '<div class="oc-title">' + escapeHtml(o.NamaProject) + '</div>' +
        '<div class="oc-cust"><i class="bi bi-person"></i> ' + escapeHtml(o.NamaCustomer) +
          ' · ' + escapeHtml(o.StatusProduksi) + '</div>' +
        '<div class="oc-actions"><button class="btn-navy" onclick="bukaDetail(\'' +
          escapeAttr(o.NomorOrder) + '\')"><i class="bi bi-eye"></i> Tindak Lanjuti</button></div></div>';
    }).join('');
  }

  if (tagihan.length) {
    html += '<h2 class="card-title mb-2 mt-3">💰 Tagihan Belum Lunas (' + tagihan.length + ')</h2>';
    html += tagihan.map(function (o) {
      return '<div class="order-card">' +
        '<div class="oc-top"><span class="oc-code">#' + escapeHtml(o.NomorOrder) + '</span>' +
        '<span class="chip ' + kelasChipBayar(o.StatusPembayaran) + '">' + escapeHtml(o.StatusPembayaran) + '</span></div>' +
        '<div class="oc-title">' + escapeHtml(o.NamaProject) + '</div>' +
        '<div class="oc-cust"><i class="bi bi-person"></i> ' + escapeHtml(o.NamaCustomer) + '</div>' +
        '<div class="oc-money"><div><small>SISA TAGIHAN</small>' +
          '<b class="num" style="color:#DC2626">' + rupiah(o.SisaPembayaran) + '</b></div></div>' +
        '<div class="oc-actions">' +
          '<button class="btn-soft" onclick="bukaPesanWa(\'' + escapeAttr(o.NomorOrder) + '\')">' +
            '<i class="bi bi-whatsapp"></i> Tagih via WA</button>' +
          '<button class="btn-primary" onclick="bukaModalBayar(\'' + escapeAttr(o.NomorOrder) + '\',' +
            o.SisaPembayaran + ')"><i class="bi bi-cash-coin"></i> Catat Bayar</button>' +
        '</div></div>';
    }).join('');
  }

  box.innerHTML = html ||
    '<div class="empty-state"><i class="bi bi-bell-slash"></i>Tidak ada notifikasi. Semua terkendali 👍</div>';
}
