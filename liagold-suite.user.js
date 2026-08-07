function updateStats() {
  const total = allProducts.length;
  const progress = allProducts.filter(p => scannedCodes.has(String(p.codeProduct).toLowerCase())).length;
  const sisa = total - progress;
  const pct = total ? Math.round(progress / total * 100) : 0;

  const cnt = l => scanLog.filter(x => x.status === l).length;
  const sudah = isMulti() ? dupeCount : cnt('SUDAH DISCAN');

  const cards = [
    { l: 'Data In-Stock', v: total, c: '#1e293b' },
    { l: 'Total Scan', v: scanLog.length, c: '#1e293b' },
    { l: '✅ Masuk', v: cnt('MASUK'), c: '#16a34a', filter: 'MASUK' },
    { l: '⚠️ Sudah Discan', v: sudah, c: '#d97706', filter: 'SUDAH DISCAN' },
    { l: '🟠 Salah Baki', v: cnt('SALAH BAKI'), c: '#ea580c', filter: 'SALAH BAKI' },
    { l: '🟣 Terjual / Rusak', v: cnt('TERJUAL / RUSAK'), c: '#7c3aed', filter: 'TERJUAL / RUSAK' },
    { l: '🔴 Barcode Tidak Ada', v: cnt('BARCODE TIDAK ADA'), c: '#dc2626', filter: 'BARCODE TIDAK ADA' },
    { l: '📊 Progress', v: `${progress}/${total} (${pct}%)`, c: '#2563eb' },
    { l: '⏳ Sisa', v: sisa < 0 ? 0 : sisa, c: '#64748b' },
  ];

  const el = document.getElementById('lg-stats');
  if (!el) return;

  // ✅ v1.0.12 FIX: Generate HTML dengan class yang benar
  el.innerHTML = cards.map(c => {
    const clickable = !!c.filter;
    const active = c.filter && c.filter === statusFilter;
    const classes = [];
    if (clickable) classes.push('lg-stat-clickable');
    if (active) classes.push('lg-stat-active');
    
    return `
      <div class="${classes.join(' ')}"
           data-filter="${c.filter || ''}"
           title="${clickable ? 'Klik untuk filter daftar' : ''}"
           style="background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:8px 6px;text-align:center;${clickable ? 'cursor:pointer;' : 'cursor:default;'}">
        <div style="font-size:1.05rem;font-weight:700;color:${c.c};">${c.v}</div>
        <div style="font-size:0.6rem;color:#64748b;margin-top:2px;">${c.l}</div>
      </div>
    `;
  }).join('');

  // ✅ v1.0.12 FIX: Attach click handlers
  el.querySelectorAll('.lg-stat-clickable').forEach(card => {
    card.addEventListener('click', () => {
      const filter = card.dataset.filter;
      if (!filter) return;
      if (statusFilter === filter) {
        statusFilter = 'none';
      } else {
        statusFilter = filter;
      }
      applyFilters();
    });
  });

  const bar = document.getElementById('lg-progress-bar');
  if (bar) {
    bar.style.width = pct + '%';
    bar.textContent = pct > 8 ? pct + '%' : '';
  }
}
