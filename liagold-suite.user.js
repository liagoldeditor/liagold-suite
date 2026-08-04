// ==UserScript==
// @name         LiaGold Suite — Totalizer + Scanner (Unified)
// @namespace    liagold.suite.unified
// @version      1.0.5
// @description  Gabungan LiaGold Totalizer + LiaGold Scanner dengan page detection + bug fixes + UX polish
// @match        https://liagold.cuan.co/*
// @match        http://liagold.cuan.co/*
// @run-at       document-idle
// @grant        none
// @updateURL    https://raw.githubusercontent.com/liagoldeditor/liagold-suite/main/liagold-suite.user.js
// @downloadURL  https://raw.githubusercontent.com/liagoldeditor/liagold-suite/main/liagold-suite.user.js
// ==/UserScript==

(function () {
  'use strict';

  if (window.__lgSuite) return;
  window.__lgSuite = true;

  const TOTAL_PAGES = [
    /^\/sales\/?$/,
    /^\/sales-cancel\/?$/,
    /^\/purchasing\/?$/,
    /^\/purchasing-non-invoice\/?$/,
    /^\/money-balance\/?$/,
    /^\/repair\/?$/,
    /^\/order\/?$/,
  ];

  const SCANNER_PAGES = [
    /^\/stock-opname\/?$/,
    /^\/stock-opname\/create\/?$/,
    /^\/product-daily\/?$/,
    /^\/product\/?$/,
  ];

  const isTotalPage = () => TOTAL_PAGES.some((re) => re.test(location.pathname));
  const isScannerPage = () => SCANNER_PAGES.some((re) => re.test(location.pathname));

  const suiteStyle = document.createElement('style');
  suiteStyle.textContent = `
    html:not(.lgs-scanner-on) #lg-panel,
    html:not(.lgs-scanner-on) #lg-fab,
    html:not(.lgs-scanner-on) #lg-img-overlay {
      display: none !important;
    }
  `;
  document.documentElement.appendChild(suiteStyle);

  let totalStarted = false;
  let scannerStarted = false;

  function applyRouteClass() {
    document.documentElement.classList.toggle('lgs-scanner-on', isScannerPage());
  }

  function startTotalizer() {
    if (totalStarted) return;
    totalStarted = true;

    (function () {
      'use strict';

      if (window.__lgTotalizer) return;
      window.__lgTotalizer = true;

      const PAGES = [
        { re: /^\/sales\/?$/,                   label: 'Sales' },
        { re: /^\/sales-cancel\/?$/,            label: 'Sales Cancel' },
        { re: /^\/purchasing\/?$/,              label: 'Purchasing' },
        { re: /^\/purchasing-non-invoice\/?$/,  label: 'Purchasing Non-Invoice' },
        { re: /^\/money-balance\/?$/,           label: 'Money Balance' },
        { re: /^\/repair\/?$/,                  label: 'Repair' },
        { re: /^\/order\/?$/,                   label: 'Order' },
      ];

      function detectPage() {
        const path = location.pathname;
        for (const p of PAGES) if (p.re.test(path)) return p.label;
        return null;
      }

      const isAllowedPage = () => detectPage() !== null;

      const style = document.createElement('style');
      style.textContent = `
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Space+Grotesk:wght@500;600;700&display=swap');

        html:not(.lgt-page-on) #lgt-fab,
        html:not(.lgt-page-on) #lgt-panel,
        html:not(.lgt-page-on) #lgt-toast{ display:none !important; }

        .lgt-num{
          cursor:pointer; border-radius:4px;
          text-decoration:underline dotted rgba(21,21,28,.18);
          text-underline-offset:2px; text-decoration-thickness:1px;
          box-decoration-break:clone; -webkit-box-decoration-break:clone;
          -webkit-user-select:none; user-select:none; white-space:nowrap;
          transition:background .14s ease, box-shadow .14s ease, color .14s ease;
        }
        .lgt-num:hover{ background:rgba(189,138,6,.10); text-decoration-color:#bd8a06; }
        .lgt-num.lgt-sel{ background:#fcf5e2; color:#7c5c00; font-weight:700; text-decoration:none; box-shadow:0 0 0 1.5px #ecca63; }
        .lgt-num.lgt-sel.lgt-neg{ background:#fdeceb; color:#d2453a; box-shadow:0 0 0 1.5px #f0a59f; }
        .lgt-num.lgt-sel.lgt-neg::before{ content:'−'; margin-right:1px; font-weight:700; }

        #lgt-fab{
          position:fixed; right:22px; bottom:22px; z-index:2147483002;
          width:54px; height:54px; border-radius:50%;
          background:#fff; color:#15151c; border:1px solid #e8e8ee;
          box-shadow:0 2px 6px rgba(16,16,29,.10), 0 12px 28px -10px rgba(16,16,29,.25);
          cursor:pointer; padding:0;
          transition:transform .18s cubic-bezier(.2,.85,.25,1), box-shadow .2s, background .2s, color .2s;
          animation:lgtFabIn .45s .1s cubic-bezier(.2,.85,.25,1) both;
        }
        @keyframes lgtFabIn{ from{opacity:0;transform:translateY(16px) scale(.7);} to{opacity:1;transform:none;} }
        #lgt-fab:hover{ transform:translateY(-2px) scale(1.05); box-shadow:0 4px 10px rgba(16,16,29,.12), 0 18px 36px -12px rgba(16,16,29,.30); }
        #lgt-fab:active{ transform:scale(.96); }
        #lgt-fab.lgt-active{ background:#15151c; color:#fff; border-color:#15151c; }

        #lgt-fab .lgt-glyph{
          position:absolute; inset:0; display:flex; align-items:center; justify-content:center;
          font-family:'Space Grotesk',sans-serif; font-size:23px; font-weight:700;
          transition:opacity .22s, transform .28s cubic-bezier(.2,.85,.25,1);
        }
        #lgt-fab .lgt-glyph-close{ opacity:0; transform:rotate(-90deg) scale(.5); }
        #lgt-fab.lgt-active .lgt-glyph-open{ opacity:0; transform:rotate(90deg) scale(.5); }
        #lgt-fab.lgt-active .lgt-glyph-close{ opacity:1; transform:none; }

        #lgt-fab.lgt-nudge{ animation:lgtNudge .35s ease; }
        @keyframes lgtNudge{ 0%{transform:scale(1);} 30%{transform:scale(1.14);} 100%{transform:scale(1);} }

        #lgt-fab .lgt-badge{
          position:absolute; top:-4px; right:-4px; min-width:20px; height:20px; padding:0 5px;
          border-radius:999px; background:#e3b53d; color:#241c00; border:2px solid #fff;
          font:700 10.5px/16px 'Plus Jakarta Sans',sans-serif; text-align:center;
          display:none; box-sizing:border-box;
        }
        #lgt-fab .lgt-badge.lgt-show{ display:block; animation:lgtBadgePop .3s ease; }
        @keyframes lgtBadgePop{ 0%{transform:scale(.4);} 60%{transform:scale(1.18);} 100%{transform:scale(1);} }

        #lgt-panel{
          position:fixed; right:22px; bottom:90px; z-index:2147483000;
          width:322px; max-width:calc(100vw - 28px);
          background:#fff; color:#15151c; border:1px solid #e8e8ee; border-radius:18px;
          box-shadow:0 10px 24px -10px rgba(16,16,29,.16), 0 30px 60px -24px rgba(16,16,29,.18);
          font-family:'Plus Jakarta Sans',sans-serif; overflow:hidden;
          opacity:0; visibility:hidden; transform:translateY(14px) scale(.97); pointer-events:none;
          transition:opacity .25s, transform .28s cubic-bezier(.2,.85,.25,1), visibility .25s;
        }
        #lgt-panel.lgt-open{ opacity:1; visibility:visible; transform:none; pointer-events:auto; }
        #lgt-panel::before{ content:''; position:absolute; top:0; left:0; right:0; height:3px; background:linear-gradient(90deg,#e3b53d,#bd8a06,#e3b53d); }

        #lgt-panel .lgt-head{ display:flex; align-items:center; gap:9px; padding:13px 15px 12px; cursor:grab; border-bottom:1px solid #f1f1f5; }
        #lgt-panel .lgt-head:active{ cursor:grabbing; }
        #lgt-panel .lgt-dot{ width:8px; height:8px; border-radius:50%; background:#bd8a06; animation:lgtPulse 2.4s infinite; flex:none; }
        @keyframes lgtPulse{ 0%{box-shadow:0 0 0 0 rgba(189,138,6,.45);} 70%{box-shadow:0 0 0 7px rgba(189,138,6,0);} 100%{box-shadow:0 0 0 0 rgba(189,138,6,0);} }

        #lgt-panel .lgt-title{ font-family:'Space Grotesk',sans-serif; font-size:11.5px; font-weight:600; letter-spacing:.16em; text-transform:uppercase; color:#565661; }
        #lgt-panel .lgt-page{
          margin-left:auto; font-family:'Space Grotesk',sans-serif; font-size:9.5px; font-weight:700;
          letter-spacing:.1em; text-transform:uppercase; color:#7c5c00;
          background:#fcf5e2; border:1px solid #ecca63; border-radius:999px;
          padding:3px 9px; line-height:1.2; white-space:nowrap;
        }
        #lgt-panel .lgt-page.lgt-pop{ animation:lgtPagePop .32s cubic-bezier(.2,.85,.25,1); }
        @keyframes lgtPagePop{ 0%{transform:scale(.5);opacity:0;} 60%{transform:scale(1.15);} 100%{transform:scale(1);opacity:1;} }

        #lgt-panel .lgt-close{ width:26px; height:26px; border:1px solid #e8e8ee; border-radius:8px; cursor:pointer; background:#fff; color:#565661; font-size:15px; line-height:1; flex:none; }
        #lgt-panel .lgt-close:hover{ background:#fdeceb; color:#d2453a; border-color:#f0a59f; }

        #lgt-panel .lgt-body{ padding:14px 16px 16px; }
        #lgt-panel .lgt-total{ font-family:'Space Grotesk',sans-serif; font-size:30px; font-weight:700; letter-spacing:-.5px; color:#15151c; font-variant-numeric:tabular-nums; display:flex; align-items:baseline; gap:7px; }
        #lgt-panel .lgt-cur{ font-size:15px; font-weight:600; color:#90909b; }
        #lgt-panel .lgt-total.lgt-pop #lgt-total-num{ animation:lgtPop .28s ease; }
        @keyframes lgtPop{ 0%{transform:scale(1);} 35%{transform:scale(1.06);color:#bd8a06;} 100%{transform:scale(1);} }

        #lgt-panel .lgt-meta{ margin-top:6px; font-size:11.5px; color:#90909b; }
        #lgt-panel .lgt-meta b{ color:#565661; }
        #lgt-panel .lgt-negcount{ color:#d2453a; }

        #lgt-panel .lgt-actions{ display:flex; gap:7px; margin-top:13px; }
        #lgt-panel .lgt-actions button{ flex:1; padding:9px 6px; border-radius:10px; cursor:pointer; font-family:inherit; font-size:11px; font-weight:700; border:1px solid #e8e8ee; background:#fff; color:#565661; transition:.15s; }
        #lgt-panel .lgt-actions button:hover{ transform:translateY(-1px); box-shadow:0 4px 12px -4px rgba(16,16,29,.18); color:#15151c; }
        #lgt-panel .lgt-actions .lgt-primary{ background:#15151c; color:#fff; border-color:#15151c; }
        #lgt-panel .lgt-actions .lgt-primary:hover{ background:#000; }

        #lgt-panel .lgt-hint{ margin-top:12px; padding-top:11px; border-top:1px solid #f1f1f5; font-size:10.5px; line-height:1.55; color:#90909b; }
        #lgt-panel .lgt-hint b{ color:#565661; }

        #lgt-toast{ position:fixed; left:50%; bottom:30px; transform:translateX(-50%) translateY(16px); z-index:2147483003; padding:10px 18px; border-radius:999px; background:#15151c; color:#fff; font:600 12.5px/1 'Plus Jakarta Sans',sans-serif; box-shadow:0 12px 30px -8px rgba(16,16,29,.4); opacity:0; pointer-events:none; transition:.25s; }
        #lgt-toast.lgt-show{ opacity:1; transform:translateX(-50%) translateY(0); }
        #lgt-toast .lgt-tick{ color:#e3b53d; margin-right:6px; }
      `;
      document.documentElement.appendChild(style);

      const fab = document.createElement('button');
      fab.id = 'lgt-fab';
      fab.type = 'button';
      fab.innerHTML = `<span class="lgt-glyph lgt-glyph-open">Σ</span><span class="lgt-glyph lgt-glyph-close">×</span><span class="lgt-badge" id="lgt-badge">0</span>`;
      document.documentElement.appendChild(fab);

      const panel = document.createElement('div');
      panel.id = 'lgt-panel';
      panel.innerHTML = `
        <div class="lgt-head" id="lgt-head">
          <span class="lgt-dot"></span>
          <span class="lgt-title">Total Pilihan</span>
          <span class="lgt-page" id="lgt-page">—</span>
          <button class="lgt-close" id="lgt-close" title="Tutup">×</button>
        </div>
        <div class="lgt-body">
          <div class="lgt-total" id="lgt-total"><span class="lgt-cur">Rp</span><span id="lgt-total-num">0</span></div>
          <div class="lgt-meta"><b id="lgt-count">0</b> nominal dipilih <span id="lgt-negcount" class="lgt-negcount" hidden></span></div>
          <div class="lgt-actions">
            <button id="lgt-all" class="lgt-primary">Pilih Semua</button>
            <button id="lgt-copy">Salin</button>
            <button id="lgt-reset">Reset</button>
          </div>
          <div class="lgt-hint">Klik angka: <b>1×</b> tambah · <b>2×</b> kurang · <b>3×</b> lepas.</div>
        </div>`;
      document.documentElement.appendChild(panel);

      const toast = document.createElement('div');
      toast.id = 'lgt-toast';
      document.documentElement.appendChild(toast);

      const badge = fab.querySelector('#lgt-badge');
      const totalEl = panel.querySelector('#lgt-total');
      const totalNumEl = panel.querySelector('#lgt-total-num');
      const curEl = panel.querySelector('.lgt-cur');
      const countEl = panel.querySelector('#lgt-count');
      const negCountEl = panel.querySelector('#lgt-negcount');
      const pageEl = panel.querySelector('#lgt-page');

      let open = false;

      function setOpen(v) {
        open = v;
        panel.classList.toggle('lgt-open', v);
        fab.classList.toggle('lgt-active', v);
      }

      fab.addEventListener('click', (e) => {
        e.stopPropagation();
        setOpen(!open);
      });

      panel.querySelector('#lgt-close').addEventListener('click', (e) => {
        e.stopPropagation();
        setOpen(false);
      });

      const REG_LONG = /\d{1,3}(?:[.,]\d{3})*(?:[.,]\d+)?/g;
      const REG_STRICT = /\d{1,3}(?:[.,]\d{3})+(?:[.,]\d+)?/g;
      const parseNum = (s) => parseInt(String(s).replace(/[.,]/g, ''), 10) || 0;
      const fmt = (n) => Math.abs(n).toLocaleString('id-ID');
      const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

      let prevCount = 0;
      let lastSum = 0;

      function update() {
        const sels = [...document.querySelectorAll('.lgt-num.lgt-sel')];
        let sum = 0;
        let neg = 0;

        sels.forEach((s) => {
          const v = +s.dataset.val || 0;
          if (s.classList.contains('lgt-neg')) {
            sum -= v;
            neg++;
          } else {
            sum += v;
          }
        });

        lastSum = sum;
        curEl.textContent = sum < 0 ? '−Rp' : 'Rp';
        totalNumEl.textContent = fmt(sum);

        totalEl.classList.remove('lgt-pop');
        void totalEl.offsetWidth;
        totalEl.classList.add('lgt-pop');

        countEl.textContent = sels.length;
        negCountEl.hidden = neg === 0;
        negCountEl.textContent = '· ' + neg + ' pengurang';

        badge.textContent = sels.length;
        badge.classList.toggle('lgt-show', sels.length > 0);

        if (sels.length > prevCount && !open) {
          fab.classList.remove('lgt-nudge');
          void fab.offsetWidth;
          fab.classList.add('lgt-nudge');
        }

        prevCount = sels.length;
        fab.title = (detectPage() || '') + ' — Rp ' + fmt(sum) + ' (' + sels.length + ' dipilih)';
      }

      function showToast(msg) {
        toast.innerHTML = '<span class="lgt-tick">✓</span>' + esc(msg);
        toast.classList.add('lgt-show');
        clearTimeout(showToast._t);
        showToast._t = setTimeout(() => toast.classList.remove('lgt-show'), 1500);
      }

      document.addEventListener('click', function (e) {
        const span = e.target.closest && e.target.closest('.lgt-num');
        if (!span) return;

        e.stopPropagation();
        e.preventDefault();

        const grp = span.dataset.grp;
        const isSel = span.classList.contains('lgt-sel');
        const isNeg = span.classList.contains('lgt-neg');

        if (!isSel) {
          if (grp === 'T' || grp === 'R') {
            const row = span.closest('mat-row, .mat-row, tr');
            if (row) {
              row.querySelectorAll('.lgt-num.lgt-sel[data-grp="' + (grp === 'T' ? 'R' : 'T') + '"]')
                .forEach((s) => s.classList.remove('lgt-sel', 'lgt-neg'));
            }
          }
          span.classList.add('lgt-sel');
          span.classList.remove('lgt-neg');
        } else if (!isNeg) {
          span.classList.add('lgt-neg');
        } else {
          span.classList.remove('lgt-sel', 'lgt-neg');
        }

        update();
      }, true);

      panel.querySelector('#lgt-all').addEventListener('click', () => {
        document.querySelectorAll('.lgt-num.lgt-sel[data-grp="R"]').forEach((s) => s.classList.remove('lgt-sel', 'lgt-neg'));
        document.querySelectorAll('.lgt-num[data-grp="T"]').forEach((s) => {
          s.classList.add('lgt-sel');
          s.classList.remove('lgt-neg');
        });
        update();
      });

      panel.querySelector('#lgt-reset').addEventListener('click', () => {
        document.querySelectorAll('.lgt-num.lgt-sel').forEach((s) => s.classList.remove('lgt-sel', 'lgt-neg'));
        update();
      });

      panel.querySelector('#lgt-copy').addEventListener('click', async () => {
        const txt = (lastSum < 0 ? '-' : '') + fmt(lastSum);
        try {
          await navigator.clipboard.writeText(txt);
          showToast('Tersalin: ' + txt);
        } catch (_) {
          const ta = document.createElement('textarea');
          ta.value = txt;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy');
          ta.remove();
          showToast('Tersalin: ' + txt);
        }
      });

      (function () {
        const head = panel.querySelector('#lgt-head');
        let d = false, sx, sy, ox, oy;

        head.addEventListener('mousedown', (e) => {
          if (e.target.closest('button')) return;
          d = true;
          const r = panel.getBoundingClientRect();
          panel.style.left = r.left + 'px';
          panel.style.top = r.top + 'px';
          panel.style.right = 'auto';
          panel.style.bottom = 'auto';
          sx = e.clientX;
          sy = e.clientY;
          ox = r.left;
          oy = r.top;
          e.preventDefault();
        });

        addEventListener('mousemove', (e) => {
          if (!d) return;
          panel.style.left = Math.max(4, Math.min(ox + e.clientX - sx, innerWidth - panel.offsetWidth - 4)) + 'px';
          panel.style.top = Math.max(4, Math.min(oy + e.clientY - sy, innerHeight - panel.offsetHeight - 4)) + 'px';
        });

        addEventListener('mouseup', () => {
          d = false;
        });
      })();

      const TABLE_ZONE = 'mat-table, .mat-table, table, [role="grid"]';
      const SKIP = '#lgt-panel,#lgt-fab,#lgt-toast,.lgt-num,script,style,noscript,input,textarea,select,button,form,mat-form-field,.mat-form-field,[contenteditable],mat-dialog-container,.mat-dialog-container,mat-step,mat-expansion-panel';

      function groupOf(node) {
        const cell = node.parentNode ? node.parentNode.closest('mat-cell, td') : null;
        if (!cell) return { grp: 'X', re: REG_STRICT };

        const cls = cell.className || '';
        if (cls.includes('mat-column-totalReal')) return { grp: 'T', re: REG_LONG };
        if (cls.includes('mat-column-cashBanks')) return { grp: 'R', re: REG_LONG };
        if (cls.includes('mat-column-price') || cls.includes('mat-column-total') || cls.includes('mat-column-amount')) {
          return { grp: 'X', re: REG_LONG };
        }

        return { grp: 'X', re: REG_STRICT };
      }

      let selfMutating = false;

      function processTextNode(node) {
        const parent = node.parentNode;
        if (!parent || !parent.closest) return;
        if (parent.closest(SKIP)) return;
        if (!parent.closest(TABLE_ZONE)) return;

        const text = node.nodeValue;
        if (!text || !/\d/.test(text)) return;

        const { grp, re } = groupOf(node);
        re.lastIndex = 0;

        const hits = [];
        let m;
        while ((m = re.exec(text)) !== null) {
          hits.push({ v: m[0], i: m.index });
          if (m.index === re.lastIndex) re.lastIndex++;
        }

        if (!hits.length) return;

        selfMutating = true;

        const frag = document.createDocumentFragment();
        let last = 0;

        for (const h of hits) {
          if (h.i > last) frag.appendChild(document.createTextNode(text.slice(last, h.i)));

          const span = document.createElement('span');
          span.className = 'lgt-num';
          span.dataset.grp = grp;
          span.dataset.val = String(parseNum(h.v));
          span.textContent = h.v;
          span.title = 'Klik: + • klik lagi: − • klik lagi: lepas';
          frag.appendChild(span);

          last = h.i + h.v.length;
        }

        if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
        parent.replaceChild(frag, node);

        selfMutating = false;
      }

      let processing = false;

      function scan(root) {
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
          acceptNode(n) {
            const p = n.parentNode;
            if (!p || !p.closest) return NodeFilter.FILTER_REJECT;
            if (p.closest(SKIP)) return NodeFilter.FILTER_REJECT;
            if (!p.closest(TABLE_ZONE)) return NodeFilter.FILTER_REJECT;
            return NodeFilter.FILTER_ACCEPT;
          }
        });

        const list = [];
        let n;
        while ((n = walker.nextNode())) list.push(n);
        list.forEach(processTextNode);
      }

      function processAll() {
        if (processing) return;
        if (!isAllowedPage()) return;

        processing = true;
        try {
          scan(document.body);
          update();
        } finally {
          processing = false;
        }
      }

      let obsTimer = null;

      const obs = new MutationObserver((mutations) => {
        if (selfMutating || processing) return;
        if (!isAllowedPage()) return;

        let relevant = false;

        for (const mut of mutations) {
          if (mut.type === 'attributes') continue;

          let t = mut.target;
          if (t.nodeType === 3) t = t.parentNode;
          if (!t || !t.closest) continue;
          if (!t.closest(TABLE_ZONE)) continue;
          if (t.closest(SKIP)) continue;
          if (t.classList && t.classList.contains('lgt-num')) continue;

          relevant = true;
          break;
        }

        if (!relevant) return;

        clearTimeout(obsTimer);
        obsTimer = setTimeout(processAll, 250);
      });

      obs.observe(document.body, { childList: true, subtree: true, characterData: true });

      let lastHref = location.href;
      let lastPage = null;

      function applyPageState(navigated) {
        const page = detectPage();
        const on = page !== null;

        document.documentElement.classList.toggle('lgt-page-on', on);

        if (on && page !== lastPage) {
          pageEl.textContent = page;
          pageEl.classList.remove('lgt-pop');
          void pageEl.offsetWidth;
          pageEl.classList.add('lgt-pop');
        }

        lastPage = page;

        if (on) {
          if (navigated) {
            setOpen(false);
            setTimeout(processAll, 350);
            setTimeout(processAll, 1000);
            setTimeout(processAll, 2200);
          }
        } else {
          setOpen(false);
        }

        update();
      }

      function onNav() {
        if (location.href === lastHref) return;
        lastHref = location.href;
        applyPageState(true);
      }

      // Fix 2: Ekspos fungsi onNav agar dapat dipicu oleh Outer Router untuk menghilangkan lag 800ms
      window.__lgtTriggerNav = onNav;

      addEventListener('popstate', onNav);
      addEventListener('hashchange', onNav);
      setInterval(onNav, 800);

      applyPageState(false);
      addEventListener('load', () => applyPageState(false));
      setTimeout(processAll, 800);
      setTimeout(processAll, 2500);
    })();
  }

  function startScanner() {
    if (scannerStarted) return;
    scannerStarted = true;

    if (window.__lgScannerUnified) return;
    window.__lgScannerUnified = true;

    (function () {
      'use strict';

      const API_STOCK = '/web/product?sortOrder=desc&sortField=id&startIndexCustom=-1&generalFilter=&isInStockFilter=true';
      const API_BYCODE = '/web/helper/product-by-code?codeProductFilter=';
      const FIREBASE = 'https://stock-baki-default-rtdb.asia-southeast1.firebasedatabase.app';
      const PAGE_SIZE = 1000;
      const MAX_SCAN_LOG = 2000;
      const MAX_FORM_RETRY = 20;

      const ST = {
        MASUK:      { label: 'MASUK',             color: '#16a34a', bg: '#f0fdf4', bd: '#bbf7d0' },
        SUDAH:      { label: 'SUDAH DISCAN',      color: '#d97706', bg: '#fffbeb', bd: '#fde68a' },
        SALAH_BAKI: { label: 'SALAH BAKI',        color: '#ea580c', bg: '#fff7ed', bd: '#fed7aa' },
        TERJUAL:    { label: 'TERJUAL / RUSAK',   color: '#7c3aed', bg: '#f5f3ff', bd: '#ddd6fe' },
        TIDAK_ADA:  { label: 'BARCODE TIDAK ADA', color: '#dc2626', bg: '#fef2f2', bd: '#fecaca' },
      };

      function esc(str) {
        const s = String(str ?? '');
        return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
                .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
      }

      function escAttr(str) {
        return String(str ?? '').replace(/&/g,'&amp;').replace(/"/g,'&quot;')
                                .replace(/'/g,'&#39;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
      }

      function safeParse(key, fallback) {
        try {
          const raw = localStorage.getItem(key);
          if (raw === null) return fallback;
          return JSON.parse(raw);
        } catch (e) {
          console.warn('[LiaGold] localStorage korup untuk key:', key, e);
          localStorage.removeItem(key);
          return fallback;
        }
      }

      let allProducts = [];
      let productMap = new Map();
      let filteredProducts = [];
      let trayList = safeParse('lg_trayList', []);
      let selectedTray = 'all';
      let traySelected = false;
      let scanFilter = 'all';
      let autoFillForm = true;
      let scanLog = safeParse('lg_scanLog', []);
      let scannedCodes = new Set(scanLog.filter(l => l.status === 'MASUK').map(l => String(l.codeProduct).toLowerCase()));
      let sessionId = localStorage.getItem('lg_session') || null;
      let myName = localStorage.getItem('lg_mp_name') || '';
      let myId = localStorage.getItem('lg_mp_id') || (() => {
        const id = 'u' + Math.random().toString(36).substr(2, 8);
        localStorage.setItem('lg_mp_id', id);
        return id;
      })();

      let cloudScans = {};
      let participants = {};
      let dupeCount = 0;
      let es = null;
      let esFailCount = 0;
      let knownCloudKeys = new Set();
      let initialCloudSyncDone = false;
      let isDeletingSession = false;
      let formQueue = [];
      let isProcessingForm = false;
      let formFilledCodes = new Set();
      let formRetryCount = 0;
      let formRetryTimer = null;
      let panelVisible = false;
      let isLoading = false;
      let currentLoadId = 0;
      let scanQueue = [];
      let isScanning = false;
      let pendingLocalScans = new Set();
      let pendingCloudPushes = [];
      let retryTimer = null;
      let audioCtx = null;
      let renderThrottleTimer = null;
      let persistDebounceTimer = null;
      let initialized = false;

      const sleep = ms => new Promise(r => setTimeout(r, ms));
      const isMulti = () => !!sessionId;

      function sanitizeKey(str) {
        return String(str).replace(/[.#$\[\]\/]/g, '_');
      }

      function mapItem(item) {
        return {
          codeProduct: item.CodeProduct || '',
          code: item.Code || '',
          name: item.Name || '',
          size: item.Size || '-',
          weight: item.WeightReal || item.WeightSystem || 0,
          price: item.SellingPriceDisplay || '0',
          image: item.ProductPicture || '',
          kadar: item.Kadar || '',
          trayId: item.TrayId ?? null,
          trayCode: item.TrayCode || '-',
          group: item.GroupCode || '',
        };
      }

      function rebuildProductMap() {
        productMap = new Map();
        allProducts.forEach(p => productMap.set(String(p.codeProduct).toLowerCase(), p));
      }

      function injectStyles() {
        if (document.getElementById('lg-styles')) return;

        const s = document.createElement('style');
        s.id = 'lg-styles';
        s.textContent = `
          @keyframes lgPop { 0%{transform:scale(.96);opacity:0} 100%{transform:scale(1);opacity:1} }
          @keyframes lgPulse { 0%,100%{box-shadow:0 0 0 0 rgba(22,163,74,.5)} 50%{box-shadow:0 0 0 6px rgba(22,163,74,0)} }
          .lg-dot-live { animation: lgPulse 1.6s infinite; }
          #lg-panel button { transition: transform .12s ease, box-shadow .12s ease, filter .12s ease; }
          #lg-panel button:hover { transform: translateY(-1px); filter: brightness(1.06); }
          #lg-panel button:active { transform: translateY(0) scale(.98); }
          #lg-panel tbody tr { transition: background .15s ease; }
          #lg-panel tbody tr:hover { background: #f1f5f9 !important; }
          .lg-tray-opt { transition: background .12s ease; }
          .lg-result-anim { animation: lgPop .18s ease; }
          #lg-fab { transition: transform .2s ease, box-shadow .2s ease !important; }
        `;
        document.head.appendChild(s);
      }

      function getFormInput() {
        return document.querySelector('input[formcontrolname="CodeProduct"]')
            || document.querySelector('input[placeholder="Masukan Kode Barang"]');
      }

      function fillCodeProductToForm(code) {
        const input = getFormInput();
        if (!input) return false;

        Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set.call(input, code);
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        input.focus();

        return true;
      }

      function clickSearchBtn() {
        const input = getFormInput();
        if (!input) return;

        const group = input.closest('.input-group');
        if (group) {
          const btn = group.querySelector('.input-group-append button');
          if (btn) btn.click();
        }
      }

      function getFormCounters() {
        const counters = {};
        document.querySelectorAll('.label-info-cont .label-info').forEach(li => {
          const help = li.querySelector('.m-form__help');
          const val = li.querySelector('.m-label');
          if (help && val) counters[help.textContent.trim()] = val.textContent.trim();
        });
        return JSON.stringify(counters);
      }

      async function waitForFormChange(beforeSig, timeout = 8000) {
        const start = Date.now();
        while (Date.now() - start < timeout) {
          await sleep(100);
          if (getFormCounters() !== beforeSig) return true;
        }
        return false;
      }

      function getFormListText() {
        let txt = '';
        document.querySelectorAll('.list-section ul.product-item').forEach(ul => {
          txt += ' ' + (ul.textContent || '');
        });
        return txt.toLowerCase();
      }

      function isCodeInForm(code, formTextLower) {
        const ft = formTextLower !== undefined ? formTextLower : getFormListText();
        const c = String(code).toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        try {
          return new RegExp('(?<![a-z0-9])' + c + '(?![a-z0-9])', 'i').test(ft);
        } catch (e) {
          return ft.includes(String(code).toLowerCase());
        }
      }

      function queueFormInput(code) {
        const lc = String(code).toLowerCase();
        if (formFilledCodes.has(lc)) return;
        if (formQueue.some(c => String(c).toLowerCase() === lc)) return;

        formQueue.push(code);
        processFormQueue();
      }

      async function processFormQueue() {
        if (isProcessingForm) return;
        if (!formQueue.length) return;

        if (!getFormInput()) {
          formRetryCount++;
          if (formRetryCount > MAX_FORM_RETRY) {
            updateStatus(`⚠️ Form tidak tersedia setelah ${MAX_FORM_RETRY}x retry. Queue dihapus (${formQueue.length} kode).`);
            formQueue = [];
            formRetryCount = 0;
            return;
          }

          updateStatus(`⚠️ Form belum tersedia. Retry ${formRetryCount}/${MAX_FORM_RETRY}…`);
          if (!formRetryTimer) {
            formRetryTimer = setTimeout(() => {
              formRetryTimer = null;
              processFormQueue();
            }, 3000);
          }
          return;
        }

        isProcessingForm = true;
        formRetryCount = 0;
        let processed = 0;

        try {
          while (formQueue.length) {
            const code = formQueue.shift();
            const lc = String(code).toLowerCase();

            if (formFilledCodes.has(lc)) continue;

            if (!getFormInput()) {
              formQueue.unshift(code);
              formRetryCount++;

              if (formRetryCount > MAX_FORM_RETRY) {
                updateStatus(`⚠️ Form hilang. Sisa ${formQueue.length} kode dihapus.`);
                formQueue = [];
                formRetryCount = 0;
                break;
              }

              if (!formRetryTimer) {
                formRetryTimer = setTimeout(() => {
                  formRetryTimer = null;
                  processFormQueue();
                }, 3000);
              }
              return;
            }

            if (isCodeInForm(code)) {
              formFilledCodes.add(lc);
              continue;
            }

            const beforeSig = getFormCounters();

            if (fillCodeProductToForm(code)) {
              await sleep(150);
              clickSearchBtn();
              await waitForFormChange(beforeSig, 6000);
            }

            formFilledCodes.add(lc);
            processed++;
            await sleep(120);
          }
        } finally {
          isProcessingForm = false;
        }

        if (processed > 0) updateStatus(`✅ ${processed} kode berhasil diinput ke form.`);
      }

      async function fbPut(path, data) {
        const res = await fetch(`${FIREBASE}${path}.json`, {
          method: 'PUT',
          body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
      }

      async function pushScanToCloud(entry, retries = 3) {
        if (!isMulti()) return;

        const key = sanitizeKey(entry.codeProduct.toLowerCase());

        for (let i = 0; i < retries; i++) {
          if (!isMulti()) return;

          try {
            await fbPut(`/opname/${sessionId}/scans/${key}`, entry);
            return;
          } catch (e) {
            if (i === retries - 1) {
              updateStatus('⚠️ Gagal kirim ke cloud setelah ' + retries + 'x. Data di-queue.');
              pendingCloudPushes.push(entry);
              scheduleRetryPush();
            } else {
              await sleep(400 * (i + 1));
            }
          }
        }
      }

      function scheduleRetryPush() {
        if (retryTimer) return;

        retryTimer = setTimeout(async () => {
          retryTimer = null;

          if (!pendingCloudPushes.length || !isMulti()) return;

          const batch = pendingCloudPushes.splice(0, 10);

          for (const entry of batch) {
            if (!isMulti()) {
              pendingCloudPushes.push(entry);
              break;
            }

            const key = sanitizeKey(entry.codeProduct.toLowerCase());

            try {
              await fbPut(`/opname/${sessionId}/scans/${key}`, entry);
            } catch (e) {
              pendingCloudPushes.push(entry);
            }

            await sleep(200);
          }

          if (pendingCloudPushes.length) scheduleRetryPush();
        }, 5000);
      }

      async function migrateSoloScansToSession() {
        if (!scanLog.length) return;

        const byCode = new Map();

        scanLog.forEach(l => {
          if (!l || !l.codeProduct) return;
          const k = String(l.codeProduct).toLowerCase();
          if (!byCode.has(k)) byCode.set(k, l);
        });

        let existingKeys = new Set();

        try {
          const res = await fetch(`${FIREBASE}/opname/${sessionId}/scans.json`);
          const data = await res.json();
          if (data) existingKeys = new Set(Object.keys(data));
        } catch (e) {}

        const payload = {};
        let count = 0;

        byCode.forEach((l, k) => {
          const sKey = sanitizeKey(k);
          if (existingKeys.has(sKey)) return;

          payload[sKey] = {
            by: myName,
            time: l.timeIso || new Date().toISOString(),
            status: l.status,
            codeProduct: l.codeProduct,
            code: l.code || '-',
            name: l.name || '-',
            tray: l.tray || '-',
            image: l.image || '',
          };

          count++;
        });

        if (!count) {
          updateStatus('✅ Semua scan solo sudah ada di sesi — progress LANJUT.');
          return;
        }

        updateStatus(`📤 Melanjutkan progress: unggah ${count} scan solo ke sesi…`);

        const keys = Object.keys(payload);
        let ok = 0;

        for (let i = 0; i < keys.length; i += 100) {
          const batch = {};
          keys.slice(i, i + 100).forEach(k => {
            batch[k] = payload[k];
          });

          try {
            const res = await fetch(`${FIREBASE}/opname/${sessionId}/scans.json`, {
              method: 'PATCH',
              body: JSON.stringify(batch)
            });

            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            ok += Object.keys(batch).length;
          } catch (e) {
            Object.values(batch).forEach(entry => pendingCloudPushes.push(entry));
          }

          await sleep(150);
        }

        if (pendingCloudPushes.length) scheduleRetryPush();
        updateStatus(`✅ ${ok}/${count} scan solo terunggah — progress LANJUT.`);
      }

      async function createSession() {
        const nama = document.getElementById('lg-mp-name').value.trim() || 'Anonim';
        myName = nama;
        localStorage.setItem('lg_mp_name', nama);

        const code = 'OPNAME-' + Math.random().toString(36).substr(2, 5).toUpperCase();

        try {
          await fbPut(`/opname/${code}/meta`, {
            nama: 'Opname ' + new Date().toLocaleDateString('id-ID'),
            dibuat: new Date().toISOString()
          });

          await fbPut(`/opname/${code}/peserta/${myId}`, {
            nama: myName,
            join: new Date().toISOString()
          });

          sessionId = code;
          localStorage.setItem('lg_session', code);

          knownCloudKeys = new Set();
          initialCloudSyncDone = false;
          dupeCount = 0;
          formFilledCodes = new Set();
          formQueue = [];
          formRetryCount = 0;
          pendingLocalScans = new Set();
          pendingCloudPushes = [];

          await migrateSoloScansToSession();

          listenSession();
          updateMpUI();
          updateStatus(`✅ Sesi ${code} dibuat! COPY kodenya & bagikan ke rekan.`);
        } catch (e) {
          updateStatus('❌ Gagal buat sesi: ' + e.message + ' (cek Rules Firebase)');
        }
      }

      async function joinSession() {
        const nama = document.getElementById('lg-mp-name').value.trim() || 'Anonim';
        const code = document.getElementById('lg-mp-code').value.trim().toUpperCase();

        if (!code) {
          updateStatus('⚠️ Masukkan kode sesi dulu.');
          return;
        }

        myName = nama;
        localStorage.setItem('lg_mp_name', nama);

        try {
          const res = await fetch(`${FIREBASE}/opname/${code}/meta.json`);
          const meta = await res.json();

          if (!meta) {
            updateStatus('❌ Sesi "' + code + '" tidak ditemukan.');
            return;
          }

          await fbPut(`/opname/${code}/peserta/${myId}`, {
            nama: myName,
            join: new Date().toISOString()
          });

          sessionId = code;
          localStorage.setItem('lg_session', code);

          knownCloudKeys = new Set();
          initialCloudSyncDone = false;
          dupeCount = 0;
          formFilledCodes = new Set();
          formQueue = [];
          formRetryCount = 0;
          pendingLocalScans = new Set();
          pendingCloudPushes = [];

          await migrateSoloScansToSession();

          listenSession();
          updateMpUI();
          updateStatus(`✅ Bergabung ke sesi ${code}!`);
        } catch (e) {
          updateStatus('❌ Gagal gabung: ' + e.message);
        }
      }

      function leaveSession() {
        if (sessionId) {
          fetch(`${FIREBASE}/opname/${sessionId}/peserta/${myId}.json`, { method: 'DELETE' }).catch(() => {});
        }

        persistScanLog();
        cleanupSessionLocal();
        updateStatus('🔴 Keluar dari sesi. Mode solo.');
      }

      function cleanupSessionLocal() {
        if (es) {
          es.close();
          es = null;
        }

        sessionId = null;
        cloudScans = {};
        participants = {};
        dupeCount = 0;
        knownCloudKeys = new Set();
        initialCloudSyncDone = false;
        formFilledCodes = new Set();
        formQueue = [];
        formRetryCount = 0;
        pendingLocalScans = new Set();
        pendingCloudPushes = [];
        esFailCount = 0;

        if (retryTimer) {
          clearTimeout(retryTimer);
          retryTimer = null;
        }

        if (formRetryTimer) {
          clearTimeout(formRetryTimer);
          formRetryTimer = null;
        }

        localStorage.removeItem('lg_session');

        scanLog = safeParse('lg_scanLog', []);
        scannedCodes = new Set(scanLog.filter(l => l.status === 'MASUK').map(l => String(l.codeProduct).toLowerCase()));

        updateMpUI();
        updateStats();
        renderLog();
        applyFilters();
      }

      async function deleteSession() {
        if (!sessionId || isDeletingSession) return;

        const totalScans = Object.keys(cloudScans).length;

        if (!confirm(`Hapus sesi ${sessionId} PERMANEN dari cloud?
 ${totalScans} data scan akan dihapus untuk SEMUA peserta.
Semua device lain akan OTOMATIS keluar.
⚠️ Export CSV dulu kalau masih perlu datanya!`)) return;

        isDeletingSession = true;

        try {
          persistScanLog();

          const res = await fetch(`${FIREBASE}/opname/${sessionId}.json`, { method: 'DELETE' });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);

          cleanupSessionLocal();
          updateStatus('🗑️ Sesi dihapus permanen. Semua peserta otomatis keluar.');
        } catch (e) {
          updateStatus('❌ Gagal hapus sesi: ' + e.message);
        } finally {
          isDeletingSession = false;
        }
      }

      function persistScanLog() {
        try {
          if (scanLog.length > MAX_SCAN_LOG) scanLog = scanLog.slice(0, MAX_SCAN_LOG);
          localStorage.setItem('lg_scanLog', JSON.stringify(scanLog));
        } catch (e) {
          try {
            scanLog = scanLog.slice(0, 500);
            localStorage.setItem('lg_scanLog', JSON.stringify(scanLog));
          } catch (e2) {}
        }
      }

      function debouncedPersist() {
        if (persistDebounceTimer) return;

        persistDebounceTimer = setTimeout(() => {
          persistDebounceTimer = null;
          persistScanLog();
        }, 1000);
      }

      window.addEventListener('beforeunload', () => {
        if (scanLog.length) persistScanLog();
      });

      async function verifySessionAlive() {
        if (!sessionId || isDeletingSession) return;

        try {
          const res = await fetch(`${FIREBASE}/opname/${sessionId}/meta.json`);
          const meta = await res.json();
          if (meta === null) onSessionDeletedRemotely();
        } catch (e) {}
      }

      function onSessionDeletedRemotely() {
        if (!sessionId || isDeletingSession) return;

        persistScanLog();
        cleanupSessionLocal();
        updateStatus('🗑️ Sesi dihapus oleh peserta lain — kamu otomatis keluar.');

        alert(`🗑️ Sesi telah DIHAPUS oleh peserta lain.
Kamu otomatis kembali ke MODE SOLO.
Data scan di device ini tetap tersimpan lokal.`);
      }

      function listenSession() {
        if (es) es.close();

        esFailCount = 0;
        es = new EventSource(`${FIREBASE}/opname/${sessionId}.json`);

        es.addEventListener('put', e => {
          let path, data;
          try {
            ({ path, data } = JSON.parse(e.data));
          } catch (err) {
            return;
          }

          if (path === '/') {
            if (data === null) {
              verifySessionAlive();
              return;
            }

            cloudScans = data.scans || {};
            participants = data.peserta || {};
            dupeCount = data.dupes ? Object.keys(data.dupes).length : 0;

            onCloudUpdate();
            renderParticipants();
            return;
          }

          if (path === '/scans') {
            if (data === null) {
              cloudScans = {};
              onCloudUpdate();
              return;
            }

            cloudScans = data;
            onCloudUpdate();
            return;
          }

          if (path.startsWith('/scans/')) {
            const k = path.slice('/scans/'.length);
            if (data === null) delete cloudScans[k];
            else cloudScans[k] = data;

            onCloudUpdate();
            return;
          }

          if (path === '/peserta') {
            participants = data || {};
            renderParticipants();
            return;
          }

          if (path.startsWith('/peserta/')) {
            const k = path.slice('/peserta/'.length);
            if (data === null) delete participants[k];
            else participants[k] = data;

            renderParticipants();
            return;
          }

          if (path === '/dupes') {
            dupeCount = data ? Object.keys(data).length : 0;
            updateStats();
            return;
          }

          if (path.startsWith('/dupes/')) {
            dupeCount = data === null ? Math.max(0, dupeCount - 1) : dupeCount + 1;
            updateStats();
            return;
          }
        });

        es.addEventListener('patch', e => {
          let path, data;
          try {
            ({ path, data } = JSON.parse(e.data));
          } catch (err) {
            return;
          }

          if (path === '/') {
            Object.entries(data || {}).forEach(([k, v]) => {
              if (k === 'scans') cloudScans = v || {};
              if (k === 'peserta') participants = v || {};
              if (k === 'dupes') dupeCount = v ? Object.keys(v).length : 0;
            });

            onCloudUpdate();
            renderParticipants();
            return;
          }

          if (path === '/scans') {
            Object.entries(data || {}).forEach(([k, v]) => {
              if (v === null) delete cloudScans[k];
              else cloudScans[k] = v;
            });

            onCloudUpdate();
            return;
          }

          if (path.startsWith('/scans/')) {
            const k = path.slice('/scans/'.length);
            if (!cloudScans[k]) cloudScans[k] = {};

            Object.entries(data || {}).forEach(([subK, v]) => {
              if (v === null) delete cloudScans[k][subK];
              else cloudScans[k][subK] = v;
            });

            onCloudUpdate();
            return;
          }

          if (path === '/peserta') {
            Object.entries(data || {}).forEach(([k, v]) => {
              if (v === null) delete participants[k];
              else participants[k] = v;
            });

            renderParticipants();
            return;
          }

          if (path.startsWith('/peserta/')) {
            const k = path.slice('/peserta/'.length);
            if (data === null) delete participants[k];
            else participants[k] = data;

            renderParticipants();
            return;
          }

          if (path === '/dupes' || path.startsWith('/dupes/')) {
            if (data && typeof data === 'object') dupeCount = Object.keys(data).length;
            updateStats();
            return;
          }
        });

        es.onerror = () => {
          if (!sessionId) return;

          esFailCount++;
          updateStatus('⚠️ Koneksi terputus (percobaan ' + esFailCount + ')…');

          setTimeout(async () => {
            if (!sessionId) return;

            try {
              const res = await fetch(`${FIREBASE}/opname/${sessionId}.json`);
              const data = await res.json();

              if (data === null) {
                verifySessionAlive();
                return;
              }

              cloudScans = data.scans || {};
              participants = data.peserta || {};
              dupeCount = data.dupes ? Object.keys(data.dupes).length : 0;

              onCloudUpdate();
              renderParticipants();

              esFailCount = 0;
              updateStatus('🟢 Koneksi pulih, data disinkronkan.');
            } catch (e) {
              updateStatus('⚠️ Gagal re-sync.');
            }

            if (esFailCount >= 5) {
              esFailCount = 0;
              updateStatus('🔄 Membuat ulang koneksi real-time…');
              listenSession();
            }
          }, 2500);
        };
      }

      function onCloudUpdate() {
        const newScannedCodes = new Set();

        Object.values(cloudScans).forEach(v => {
          if (v && v.status === 'MASUK' && v.codeProduct) {
            newScannedCodes.add(String(v.codeProduct).toLowerCase());
          }
        });

        pendingLocalScans.forEach(rawCode => newScannedCodes.add(rawCode));
        scannedCodes = newScannedCodes;

        pendingLocalScans.forEach(rawCode => {
          const sKey = sanitizeKey(rawCode);
          if (cloudScans[sKey]) pendingLocalScans.delete(rawCode);
        });

        scanLog = Object.entries(cloudScans)
          .filter(([k, v]) => v && typeof v === 'object')
          .map(([k, v]) => ({
            time: v.time ? new Date(v.time).toLocaleString('id-ID') : '-',
            timeIso: v.time || '',
            scanCode: v.codeProduct || k,
            codeProduct: v.codeProduct || k.toUpperCase(),
            code: v.code || '-',
            name: v.name || '-',
            tray: v.tray || '-',
            image: v.image || '',
            status: v.status || '',
            by: v.by || '',
          }))
          .sort((a, b) => (b.timeIso || '').localeCompare(a.timeIso || ''));

        debouncedPersist();

        const newKeys = [];
        Object.keys(cloudScans).forEach(k => {
          if (!knownCloudKeys.has(k)) {
            knownCloudKeys.add(k);
            newKeys.push(k);
          }
        });

        if (initialCloudSyncDone && autoFillForm && newKeys.length) {
          newKeys.forEach(k => {
            const scan = cloudScans[k];
            if (!scan || !scan.codeProduct) return;
            if (scan.by === myName) return;
            if (scan.status === 'MASUK' || scan.status === 'SALAH BAKI') queueFormInput(scan.codeProduct);
          });
        }

        initialCloudSyncDone = true;
        scheduleRender();
      }

      function scheduleRender() {
        if (renderThrottleTimer) return;

        renderThrottleTimer = setTimeout(() => {
          renderThrottleTimer = null;
          updateStats();
          renderLog();
          applyFilters();
        }, 200);
      }

      async function pushDupe(code) {
        if (!isMulti()) return;

        try {
          await fetch(`${FIREBASE}/opname/${sessionId}/dupes.json`, {
            method: 'POST',
            body: JSON.stringify({
              code,
              by: myName,
              time: new Date().toISOString()
            })
          });
        } catch (e) {}
      }

      function copySessionCode() {
        if (!sessionId) return;

        navigator.clipboard.writeText(sessionId).then(() => {
          updateStatus(`📋 Kode sesi "${sessionId}" disalin!`);
        }).catch(() => {
          updateStatus(`Kode sesi: ${sessionId} (salin manual)`);
        });
      }

      function updateMpUI() {
        const box = document.getElementById('lg-mp-box');
        if (!box) return;

        if (isMulti()) {
          box.innerHTML = `
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
              <span class="lg-dot-live" style="width:10px;height:10px;border-radius:50%;background:#16a34a;display:inline-block;"></span>
              <b style="font-size:13px;color:#16a34a;">🟢 Online · Login: ${esc(myName)}</b>
            </div>
            <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:6px;padding:10px;margin-bottom:10px;">
              <div style="font-size:10px;color:#64748b;margin-bottom:4px;">KODE SESI (simpan & bagikan ke rekan):</div>
              <div style="display:flex;align-items:center;gap:8px;">
                <b style="font-size:17px;color:#2563eb;letter-spacing:1px;font-family:monospace;">${esc(sessionId)}</b>
                <button id="lg-mp-copy" style="padding:5px 12px;background:#2563eb;color:#fff;border:none;border-radius:5px;cursor:pointer;font-size:11px;font-weight:600;">📋 Copy</button>
              </div>
            </div>
            <div id="lg-mp-participants" style="font-size:11px;color:#475569;margin-bottom:10px;"></div>
            <div style="display:flex;gap:6px;flex-wrap:wrap;">
              <button id="lg-mp-leave" style="padding:7px 14px;background:#dc2626;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:11px;font-weight:600;">🚪 Keluar Sesi</button>
              <button id="lg-mp-delete" style="padding:7px 14px;background:#991b1b;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:11px;font-weight:600;">🗑️ Selesai & Hapus</button>
            </div>
            <div style="margin-top:8px;font-size:10px;color:#94a3b8;line-height:1.5;">💡 Scan pemain lain otomatis terinput ke form kamu (sinkron real-time). Progress solo otomatis dimerge saat buat/gabung sesi.</div>
          `;

          document.getElementById('lg-mp-leave').addEventListener('click', leaveSession);
          document.getElementById('lg-mp-delete').addEventListener('click', deleteSession);
          document.getElementById('lg-mp-copy').addEventListener('click', copySessionCode);

          renderParticipants();
        } else {
          box.innerHTML = `
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
              <span style="width:10px;height:10px;border-radius:50%;background:#94a3b8;display:inline-block;"></span>
              <b style="font-size:13px;color:#64748b;">🔴 Mode Solo (offline)</b>
            </div>
            <input id="lg-mp-name" type="text" placeholder="Nama kamu" value="${escAttr(myName)}"
              style="width:100%;padding:8px 10px;border-radius:6px;border:1px solid #cbd5e1;font-size:12px;margin-bottom:8px;" />
            <button id="lg-mp-create" style="width:100%;padding:8px;background:#2563eb;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:11px;font-weight:600;margin-bottom:8px;">➕ Buat Sesi Baru <span style="font-weight:400;opacity:.85;">(progress solo ikut)</span></button>
            <div style="display:flex;gap:6px;">
              <input id="lg-mp-code" type="text" placeholder="Kode sesi (OPNAME-XXXXX)"
                style="flex:1;padding:8px 10px;border-radius:6px;border:1px solid #cbd5e1;font-size:12px;text-transform:uppercase;" />
              <button id="lg-mp-join" style="padding:8px 14px;background:#16a34a;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:11px;font-weight:600;">Gabung</button>
            </div>
          `;

          document.getElementById('lg-mp-create').addEventListener('click', createSession);
          document.getElementById('lg-mp-join').addEventListener('click', joinSession);
        }
      }

      function renderParticipants() {
        const el = document.getElementById('lg-mp-participants');
        if (!el) return;

        const list = Object.values(participants || {}).map(p => esc(p.nama || '?'));
        el.innerHTML = `👥 Online (${list.length}): ` + (list.length ? list.map(n => `<b>${n}</b>`).join(', ') : '-');
      }

      async function syncTrayList() {
        const myLoadId = ++currentLoadId;
        isLoading = true;
        const tmp = [];
        let page = 0;

        try {
          while (true) {
            updateStatus(`⏳ Sinkron baki… hal ${page + 1} (${tmp.length})`);

            const res = await fetch(`${API_STOCK}&pageNumber=${page}&pageSize=${PAGE_SIZE}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);

            const items = (await res.json()).items || [];
            if (!items.length) break;

            if (myLoadId !== currentLoadId) return;

            items.forEach(i => tmp.push(mapItem(i)));

            if (items.length < PAGE_SIZE) break;

            page++;
            await sleep(300);

            if (myLoadId !== currentLoadId) return;
          }

          if (myLoadId !== currentLoadId) return;

          const m = new Map();

          tmp.forEach(p => {
            if (p.trayId === null) return;
            const k = `${p.trayId}`;
            if (!m.has(k)) m.set(k, { trayId: p.trayId, trayCode: p.trayCode, count: 0 });
            m.get(k).count++;
          });

          trayList = [...m.values()].sort((a, b) => a.trayId - b.trayId);
          localStorage.setItem('lg_trayList', JSON.stringify(trayList));

          allProducts = tmp;
          rebuildProductMap();

          selectedTray = 'all';
          traySelected = false;
          scanFilter = 'all';

          resetScanTabUI();
          renderTrayDropdown('');
          applyFilters();

          updateStatus(`✅ ${trayList.length} baki · ${allProducts.length} produk`);
        } catch (e) {
          if (myLoadId !== currentLoadId) return;
          updateStatus(`⚠️ Gagal: ${e.message}`);
          if (tmp.length) {
            allProducts = tmp;
            rebuildProductMap();
            applyFilters();
          }
        } finally {
          if (myLoadId === currentLoadId) {
            isLoading = false;
          }
        }
      }

      async function loadTrayData(trayId) {
        const myLoadId = ++currentLoadId;
        isLoading = true;
        allProducts = [];
        let page = 0;

        const isAll = trayId === 'all';
        const label = isAll ? 'Semua Baki' : `Baki ${trayId}`;

        try {
          while (true) {
            const url = isAll
              ? `${API_STOCK}&pageNumber=${page}&pageSize=${PAGE_SIZE}`
              : `${API_STOCK}&trayFilter=${trayId}&pageNumber=${page}&pageSize=${PAGE_SIZE}`;

            updateStatus(`⏳ ${label}… hal ${page + 1} (${allProducts.length})`);

            const res = await fetch(url);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);

            const items = (await res.json()).items || [];
            if (!items.length) break;

            if (myLoadId !== currentLoadId) return;

            items.forEach(i => allProducts.push(mapItem(i)));

            if (items.length < PAGE_SIZE) break;

            page++;
            await sleep(300);

            if (myLoadId !== currentLoadId) return;
          }

          if (myLoadId !== currentLoadId) return;

          rebuildProductMap();
          applyFilters();
          updateStatus(`✅ ${label}: ${allProducts.length} produk dimuat`);
        } catch (e) {
          if (myLoadId !== currentLoadId) return;
          updateStatus(`⚠️ Gagal: ${e.message}`);
          if (allProducts.length) {
            rebuildProductMap();
            applyFilters();
          }
        } finally {
          if (myLoadId === currentLoadId) {
            isLoading = false;
          }
        }
      }

      function highlightMatch(text, query) {
        if (!query) return esc(text);

        const idx = text.toLowerCase().indexOf(query.toLowerCase());
        if (idx === -1) return esc(text);

        return esc(text.slice(0, idx))
          + `<b style="color:#2563eb;background:#eff6ff;border-radius:3px;padding:0 2px;">${esc(text.slice(idx, idx + query.length))}</b>`
          + esc(text.slice(idx + query.length));
      }

      function renderTrayDropdown(filter) {
        const dd = document.getElementById('lg-tray-dropdown');
        if (!dd) return;

        const f = (filter || '').trim().toLowerCase();
        let html = '';

        if (!f) {
          html += `<div class="lg-tray-opt" data-val="all" data-label="Semua Baki" style="padding:9px 12px;cursor:pointer;font-size:12px;border-bottom:1px solid #f1f5f9;font-weight:600;color:#94a3b8;">📦 Semua Baki (hanya lihat)</div>`;
        }

        trayList.forEach(t => {
          const label = `Baki ${t.trayCode}`;
          if (f && !label.toLowerCase().includes(f)) return;

          html += `<div class="lg-tray-opt" data-val="${escAttr(t.trayId)}" data-label="${escAttr(label)}" style="padding:9px 12px;cursor:pointer;font-size:12px;border-bottom:1px solid #f1f5f9;">${highlightMatch(label, f)}</div>`;
        });

        if (!html) html = '<div style="padding:12px;font-size:11px;color:#94a3b8;text-align:center;">Tidak ada baki yang cocok</div>';

        dd.innerHTML = html;

        dd.querySelectorAll('.lg-tray-opt').forEach(opt => {
          opt.addEventListener('mouseenter', () => opt.style.background = '#eff6ff');
          opt.addEventListener('mouseleave', () => opt.style.background = '#fff');
          opt.addEventListener('click', () => selectTray(opt.dataset.val, opt.dataset.label));
        });
      }

      function selectTray(val, label) {
        selectedTray = val;
        traySelected = (val !== 'all');

        document.getElementById('lg-tray-search').value = label;
        document.getElementById('lg-tray-dropdown').style.display = 'none';

        const info = trayList.find(t => String(t.trayId) === val);

        document.getElementById('lg-tray-info').textContent = info
          ? `Baki ${info.trayCode} · ${info.count} barang${val === 'all' ? ' · ⚠️ pilih baki spesifik untuk scan' : ' · ✅ siap scan'}`
          : (val === 'all' ? '⚠️ Pilih baki spesifik untuk memulai scan' : '');

        loadTrayData(val);
      }

      async function checkSoldProduct(cp) {
        try {
          const res = await fetch(`${API_BYCODE}${encodeURIComponent(cp)}`);
          if (!res.ok) return null;

          const d = await res.json();
          let item = null;

          if (Array.isArray(d) && d.length) item = d[0];
          else if (d.items?.length) item = d.items[0];
          else if (d.data?.length) item = d.data[0];
          else if (d.Name || d.FullName || d.Id) item = d;

          if (!item) return null;

          let code = item.CodeProduct || '';
          if (!code && item.FullName) code = item.FullName.split(' - ')[0].trim();
          if (!code) code = cp;

          return {
            codeProduct: code,
            code: item.Code || '-',
            name: item.Name || '',
            fullName: item.FullName || '',
            weight: item.WeightReal || item.WeightSystem || 0,
            price: item.SellingPriceDisplay || item.Price || '0',
            image: item.ProductPicture || '',
            kadar: item.Kadar || '',
            trayCode: item.TrayCode || '-',
            stockQty: item.StockQuantity ?? 0,
          };
        } catch (e) {
          return null;
        }
      }

      function applyFilters() {
        filteredProducts = allProducts.filter(p => {
          const s = scannedCodes.has(String(p.codeProduct).toLowerCase());
          return scanFilter === 'all' || (scanFilter === 'scanned' && s) || (scanFilter === 'unscanned' && !s);
        });

        renderProducts();
        updateStats();
        updateFilterCounts();
      }

      function updateFilterCounts() {
        const total = allProducts.length;
        const sc = allProducts.filter(p => scannedCodes.has(String(p.codeProduct).toLowerCase())).length;

        document.querySelectorAll('.lg-scan-tab').forEach(tab => {
          const v = tab.dataset.val;
          const countEl = tab.querySelector('.lg-tab-count');
          if (countEl) countEl.textContent = v === 'all' ? total : v === 'scanned' ? sc : total - sc;
        });
      }

      function resetScanTabUI() {
        scanFilter = 'all';

        document.querySelectorAll('.lg-scan-tab').forEach(t => {
          const a = t.dataset.val === 'all';
          t.style.background = a ? '#2563eb' : '#fff';
          t.style.color = a ? '#fff' : '#64748b';
          t.style.borderColor = a ? '#2563eb' : '#cbd5e1';
        });
      }

      function enqueueScan(code) {
        if (!code) return;
        scanQueue.push(code);
        processScanQueue();
      }

      async function processScanQueue() {
        if (isScanning) return;

        isScanning = true;
        const btn = document.getElementById('lg-scan-btn');

        while (scanQueue.length) {
          const code = scanQueue.shift();

          try {
            await doScanInternal(code);
          } catch (e) {
            console.error('[LiaGold] Scan error:', code, e);
            showResult(`❌ Error saat scan "${esc(code)}": ${esc(e.message)}`, ST.TIDAK_ADA, '');
          }
        }

        isScanning = false;

        if (btn) {
          btn.disabled = false;
          btn.textContent = 'CEK';
        }

        const input = document.getElementById('lg-scan-input');
        if (input) input.focus();
      }

      async function doScanInternal(code) {
        if (!traySelected) {
          showResult('⚠️ Pilih baki spesifik terlebih dahulu sebelum scan!', ST.TIDAK_ADA, '');
          beep(200);
          return;
        }

        if (!allProducts.length) {
          showResult('Data baki belum dimuat. Tunggu sebentar…', ST.TIDAK_ADA, '');
          return;
        }

        const btn = document.getElementById('lg-scan-btn');
        if (btn) {
          btn.disabled = true;
          btn.textContent = '…';
        }

        const now = new Date();
        const found = productMap.get(code.toLowerCase());

        let st, msg, imgUrl = '', finalCodeProduct = code, finalName = '-', finalTray = '-', finalCode = '-';

        if (found) {
          imgUrl = found.image;
          finalCodeProduct = found.codeProduct;
          finalName = found.name;
          finalTray = found.trayCode;
          finalCode = found.code;

          const cpL = String(found.codeProduct).toLowerCase();

          if (scannedCodes.has(cpL) || pendingLocalScans.has(cpL)) {
            st = ST.SUDAH;
            const sKey = sanitizeKey(cpL);
            const byWhom = isMulti() && cloudScans[sKey]?.by ? ` (oleh ${esc(cloudScans[sKey].by)})` : '';
            msg = `SUDAH DISCAN — "${esc(found.name)}" (${esc(found.codeProduct)}) · Baki ${esc(found.trayCode)}${byWhom}`;
            pushDupe(found.codeProduct);
          } else if (String(found.trayId) !== selectedTray) {
            st = ST.SALAH_BAKI;
            msg = `SALAH BAKI — "${esc(found.name)}" seharusnya di Baki ${esc(found.trayCode)}`;
          } else {
            st = ST.MASUK;
            msg = `MASUK — "${esc(found.name)}" · ${esc(found.codeProduct)} · ${found.weight} gr · Kadar ${esc(found.kadar)} · Baki ${esc(found.trayCode)} · Rp${Number(found.price).toLocaleString('id-ID')}`;
          }
        } else {
          showResult(`🔍 Mengecek "${esc(code)}"…`, ST.SUDAH, '');

          const soldItem = await checkSoldProduct(code);

          if (soldItem) {
            imgUrl = soldItem.image;
            finalCodeProduct = soldItem.codeProduct;
            finalName = soldItem.fullName || soldItem.name;
            finalTray = soldItem.trayCode;
            finalCode = soldItem.code;

            if (soldItem.stockQty > 0) {
              st = ST.SALAH_BAKI;
              msg = `SALAH BAKI — "${esc(finalName)}" seharusnya di Baki ${esc(soldItem.trayCode)}`;
            } else {
              st = ST.TERJUAL;
              msg = `TERJUAL / RUSAK — "${esc(finalName)}" · ${esc(soldItem.codeProduct)} · ${soldItem.weight} gr · Baki ${esc(soldItem.trayCode)} · Stock: ${soldItem.stockQty}`;
            }
          } else {
            st = ST.TIDAK_ADA;
            msg = `BARCODE TIDAK ADA — "${esc(code)}" tidak ditemukan`;
          }
        }

        const logEntry = {
          time: now.toLocaleString('id-ID'),
          timeIso: now.toISOString(),
          scanCode: code,
          codeProduct: finalCodeProduct,
          code: finalCode,
          name: finalName,
          tray: finalTray,
          image: imgUrl,
          status: st.label,
          by: myName || '',
        };

        if (isMulti()) {
          if (st !== ST.SUDAH) {
            if (st === ST.MASUK) {
              scannedCodes.add(finalCodeProduct.toLowerCase());
              pendingLocalScans.add(finalCodeProduct.toLowerCase());
            }

            scanLog.unshift(logEntry);
            if (scanLog.length > MAX_SCAN_LOG) scanLog = scanLog.slice(0, MAX_SCAN_LOG);

            debouncedPersist();
            scheduleRender();

            await pushScanToCloud({
              by: myName,
              time: now.toISOString(),
              status: st.label,
              codeProduct: finalCodeProduct,
              code: finalCode,
              name: finalName,
              tray: finalTray,
              image: imgUrl,
            });
          }
        } else {
          if (st === ST.MASUK) scannedCodes.add(finalCodeProduct.toLowerCase());

          scanLog.unshift(logEntry);
          if (scanLog.length > MAX_SCAN_LOG) scanLog = scanLog.slice(0, MAX_SCAN_LOG);

          persistScanLog();
          scheduleRender();
        }

        showResult(msg, st, imgUrl);
        beep(st === ST.MASUK ? 880 : st === ST.SUDAH ? 440 : 220);

        if (autoFillForm && st === ST.MASUK) queueFormInput(finalCodeProduct);
      }

      function beep(freq) {
        try {
          if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
          if (audioCtx.state === 'suspended') audioCtx.resume();

          const o = audioCtx.createOscillator();
          const g = audioCtx.createGain();

          o.frequency.value = freq;
          g.gain.value = 0.25;

          o.connect(g);
          g.connect(audioCtx.destination);

          o.start();
          o.stop(audioCtx.currentTime + 0.12);
        } catch (e) {}
      }

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
          { l: '✅ Masuk', v: cnt('MASUK'), c: '#16a34a' },
          { l: '⚠️ Sudah Discan', v: sudah, c: '#d97706' },
          { l: '🟠 Salah Baki', v: cnt('SALAH BAKI'), c: '#ea580c' },
          { l: '🟣 Terjual / Rusak', v: cnt('TERJUAL / RUSAK'), c: '#7c3aed' },
          { l: '🔴 Barcode Tidak Ada', v: cnt('BARCODE TIDAK ADA'), c: '#dc2626' },
          { l: '📊 Progress', v: `${progress}/${total} (${pct}%)`, c: '#2563eb' },
          { l: '⏳ Sisa', v: sisa < 0 ? 0 : sisa, c: '#64748b' },
        ];

        const el = document.getElementById('lg-stats');
        if (!el) return;

        el.innerHTML = cards.map(c => `
          <div style="background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:8px 6px;text-align:center;">
            <div style="font-size:1.05rem;font-weight:700;color:${c.c};">${c.v}</div>
            <div style="font-size:0.6rem;color:#64748b;margin-top:2px;">${c.l}</div>
          </div>
        `).join('');

        const bar = document.getElementById('lg-progress-bar');
        if (bar) {
          bar.style.width = pct + '%';
          bar.textContent = pct > 8 ? pct + '%' : '';
        }
      }

      function renderLog() {
        const el = document.getElementById('lg-log');
        if (!el) return;

        if (!scanLog.length) {
          el.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#94a3b8;padding:16px;">Belum ada riwayat scan</td></tr>';
          return;
        }

        el.innerHTML = scanLog.slice(0, 150).map(l => {
          const s = Object.values(ST).find(x => x.label === l.status) || ST.TIDAK_ADA;

          return `<tr style="border-bottom:1px solid #f1f5f9;">
            <td style="padding:6px 8px;font-size:10px;color:#94a3b8;white-space:nowrap;">${esc(l.time)}</td>
            <td style="padding:6px 8px;"><code style="background:#f1f5f9;padding:2px 6px;border-radius:4px;font-size:10px;border:1px solid #e2e8f0;">${esc(l.scanCode)}</code></td>
            <td style="padding:6px 8px;font-size:11px;">${l.codeProduct !== '-' ? `<a href="#" class="lg-img-link" data-img="${escAttr(l.image)}" data-name="${escAttr(l.name)}" style="color:#2563eb;text-decoration:none;font-weight:600;">${esc(l.codeProduct)}</a>` : '-'}</td>
            <td style="padding:6px 8px;font-size:11px;max-width:100px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(l.name)}</td>
            <td style="padding:6px 8px;font-size:10px;text-align:center;color:#64748b;">${esc(l.tray)}</td>
            <td style="padding:6px 8px;font-size:10px;text-align:center;color:#64748b;">${esc(l.by || '-')}</td>
            <td style="padding:6px 8px;"><span style="display:inline-block;padding:2px 8px;border-radius:4px;font-size:9px;font-weight:700;color:${s.color};background:${s.bg};border:1px solid ${s.bd};white-space:nowrap;">${esc(l.status)}</span></td>
          </tr>`;
        }).join('');

        bindImageLinks(el);
      }

      function renderProducts() {
        const el = document.getElementById('lg-products');
        if (!el) return;

        if (!filteredProducts.length) {
          const m = scanFilter === 'unscanned'
            ? '🎉 Semua sudah discan!'
            : scanFilter === 'scanned'
              ? 'Belum ada yang discan'
              : 'Pilih baki untuk memuat';

          el.innerHTML = `<tr><td colspan="8" style="text-align:center;color:#94a3b8;padding:16px;">${m}</td></tr>`;
          return;
        }

        el.innerHTML = filteredProducts.map((p, i) => {
          const sc = scannedCodes.has(String(p.codeProduct).toLowerCase());

          return `<tr style="${sc ? 'opacity:0.45;background:#f0fdf4;' : ''}border-bottom:1px solid #f1f5f9;">
            <td style="padding:5px 8px;text-align:center;font-size:10px;color:#94a3b8;">${i + 1}</td>
            <td style="padding:5px 8px;"><a href="#" class="lg-img-link" data-img="${escAttr(p.image)}" data-name="${escAttr(p.name)}" style="color:#2563eb;text-decoration:none;font-weight:600;font-size:11px;font-family:monospace;">${esc(p.codeProduct)}</a></td>
            <td style="padding:5px 8px;font-size:11px;max-width:130px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(p.name)}</td>
            <td style="padding:5px 8px;text-align:center;font-size:10px;color:#64748b;">${esc(p.trayCode)}</td>
            <td style="padding:5px 8px;text-align:center;font-size:10px;">${p.weight} gr</td>
            <td style="padding:5px 8px;text-align:center;font-size:10px;">${esc(p.kadar)}</td>
            <td style="padding:5px 8px;text-align:right;font-size:10px;">Rp${Number(p.price).toLocaleString('id-ID')}</td>
            <td style="padding:5px 8px;text-align:center;">${sc ? '✅' : '⬜'}</td>
          </tr>`;
        }).join('');

        bindImageLinks(el);
      }

      function showImageModal(imgUrl, name) {
        let ov = document.getElementById('lg-img-overlay');
        if (ov) ov.remove();

        ov = document.createElement('div');
        ov.id = 'lg-img-overlay';
        ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:100000;display:flex;align-items:center;justify-content:center;cursor:pointer;';

        ov.innerHTML = `<div style="background:#fff;border-radius:12px;padding:24px;max-width:520px;width:90%;text-align:center;cursor:default;box-shadow:0 20px 60px rgba(0,0,0,0.25);animation:lgPop .18s ease;">
          <div style="font-weight:700;font-size:14px;color:#1e293b;margin-bottom:14px;">${esc(name || 'Produk')}</div>
          ${imgUrl ? `<img src="${escAttr(imgUrl)}" style="max-width:100%;max-height:400px;border-radius:8px;border:1px solid #e2e8f0;" onerror="this.outerHTML='<div style=\\'padding:40px;color:#94a3b8;\\'>Gambar tidak tersedia</div>'" />` : '<div style="padding:40px;color:#94a3b8;">Gambar tidak tersedia</div>'}
          <div style="margin-top:16px;"><button id="lg-img-close-btn" style="padding:8px 28px;background:#1e293b;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:13px;">Tutup</button></div>
        </div>`;

        ov.addEventListener('click', e => {
          if (e.target === ov) ov.remove();
        });

        document.body.appendChild(ov);
        document.getElementById('lg-img-close-btn').addEventListener('click', () => ov.remove());
      }

      function bindImageLinks(c) {
        c.querySelectorAll('.lg-img-link').forEach(a => {
          a.onclick = e => {
            e.preventDefault();
            showImageModal(a.dataset.img, a.dataset.name);
          };
        });
      }

      function updateStatus(msg) {
        const el = document.getElementById('lg-status');
        if (el) el.textContent = msg;
      }

      function showResult(msg, st, imgUrl) {
        const el = document.getElementById('lg-result');
        if (!el) return;

        el.style.display = 'block';
        el.style.background = st.bg;
        el.style.border = `1px solid ${st.bd}`;
        el.style.color = st.color;
        el.innerHTML = `<div style="font-weight:700;font-size:13px;">${msg}</div>`;

        if (imgUrl) {
          el.innerHTML += `<div style="margin-top:6px;"><a href="#" class="lg-img-link" data-img="${escAttr(imgUrl)}" data-name="" style="color:#2563eb;font-size:11px;text-decoration:underline;">📷 Lihat Gambar</a></div>`;
          bindImageLinks(el);
        }

        el.classList.remove('lg-result-anim');
        void el.offsetWidth;
        el.classList.add('lg-result-anim');
      }

      function exportLog() {
        if (!scanLog.length) {
          updateStatus('⚠️ Tidak ada data untuk di-export.');
          return;
        }

        const csvEsc = s => '"' + String(s ?? '').replace(/"/g, '""') + '"';

        let csv = '\uFEFF' + ['Waktu','Kode Scan','CodeProduct','Code','Nama Barang','Baki','Oleh','Status'].map(csvEsc).join(',') + '\n';

        scanLog.forEach(l => {
          csv += [l.time, l.scanCode, l.codeProduct, l.code, l.name, l.tray, l.by || '-', l.status].map(csvEsc).join(',') + '\n';
        });

        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
        a.download = `scan_log_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();

        setTimeout(() => URL.revokeObjectURL(a.href), 5000);
        updateStatus('✅ CSV berhasil di-export (' + scanLog.length + ' baris).');
      }

      function resetProgress() {
        if (isMulti()) {
          if (!confirm('Reset SEMUA progress sesi (untuk semua peserta)?')) return;

          fetch(`${FIREBASE}/opname/${sessionId}/scans.json`, { method: 'DELETE' });
          fetch(`${FIREBASE}/opname/${sessionId}/dupes.json`, { method: 'DELETE' });

          pendingLocalScans = new Set();
          knownCloudKeys = new Set();
          formFilledCodes = new Set();
          formQueue = [];
          formRetryCount = 0;
          initialCloudSyncDone = false;

          updateStatus('🔄 Mereset progress sesi…');
        } else {
          if (!confirm('Reset semua progress scan?')) return;

          scanLog = [];
          scannedCodes = new Set();
          formFilledCodes = new Set();
          formQueue = [];

          localStorage.removeItem('lg_scanLog');

          updateStats();
          renderLog();
          applyFilters();

          updateStatus('🔄 Progress direset.');
        }
      }

      async function sendToForm() {
        if (isProcessingForm) return;

        const input = getFormInput();
        if (!input) {
          updateStatus('❌ Form tidak ditemukan. Buka /stock-opname/create.');
          return;
        }

        const scannedList = [...scannedCodes];
        if (!scannedList.length) {
          updateStatus('⚠️ Belum ada barang yang discan.');
          return;
        }

        updateStatus('🔍 Memeriksa isi form…');

        const formTextLower = getFormListText();
        const missing = scannedList.filter(code => !isCodeInForm(code, formTextLower) && !formFilledCodes.has(code));
        const already = scannedList.length - missing.length;

        if (!missing.length) {
          updateStatus(`✅ Semua ${scannedList.length} barang sudah ada di form.`);
          return;
        }

        if (!confirm(`📊 Hasil pemeriksaan form:
✅ Sudah ada di form : ${already} barang
📤 Belum ada di form : ${missing.length} barang
Lanjutkan?`)) return;

        missing.forEach(code => queueFormInput(code));
        updateStatus(`📤 Mengirim ${missing.length} barang ke form…`);
      }

      function togglePanel() {
        panelVisible = !panelVisible;

        const p = document.getElementById('lg-panel');
        const f = document.getElementById('lg-fab');

        if (panelVisible) {
          p.style.display = 'block';
          f.textContent = '✕';
          f.style.background = '#dc2626';
          setTimeout(() => document.getElementById('lg-scan-input')?.focus(), 100);
        } else {
          p.style.display = 'none';
          f.textContent = '📦';
          f.style.background = '#2563eb';
        }
      }

      // Fix 1: Ekspos fungsi untuk memaksa tutup panel Scanner
      window.__lgCloseScannerPanel = () => {
        if (panelVisible) togglePanel();
      };

      function onDocClick(e) {
        if (!e.target.closest('#lg-tray-search') && !e.target.closest('#lg-tray-dropdown')) {
          const dd = document.getElementById('lg-tray-dropdown');
          if (dd) dd.style.display = 'none';
        }
      }

      function injectUI() {
        document.getElementById('lg-panel')?.remove();
        document.getElementById('lg-fab')?.remove();
        document.removeEventListener('click', onDocClick);

        const panel = document.createElement('div');
        panel.id = 'lg-panel';
        panel.style.cssText = `position:fixed;top:0;right:0;width:50vw;min-width:500px;height:100vh;background:#f8fafc;color:#1e293b;font-family:system-ui,-apple-system,'Segoe UI',sans-serif;font-size:13px;overflow-y:auto;z-index:99999;border-left:1px solid #e2e8f0;box-shadow:-4px 0 24px rgba(0,0,0,0.08);padding:24px;display:none;`;

        panel.innerHTML = `
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;padding-bottom:12px;border-bottom:2px solid #e2e8f0;">
            <div>
              <div style="font-size:18px;font-weight:800;color:#1e293b;">📦 LiaGold Scanner</div>
              <div style="font-size:11px;color:#64748b;margin-top:2px;">Stock Opname · Multiplayer + Merge Solo <b style="color:#16a34a;">v25</b></div>
            </div>
            <button id="lg-close" style="background:#f1f5f9;border:1px solid #e2e8f0;color:#64748b;border-radius:6px;padding:6px 12px;cursor:pointer;font-size:14px;">✕</button>
          </div>

          <div id="lg-status" style="font-size:12px;color:#64748b;margin-bottom:12px;padding:8px 12px;background:#fff;border:1px solid #e2e8f0;border-radius:6px;">Pilih baki untuk memulai</div>

          <div style="background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:14px;margin-bottom:12px;">
            <div style="font-size:10px;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px;">👥 Multiplayer</div>
            <div id="lg-mp-box"></div>
          </div>

          <div style="background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:14px;margin-bottom:12px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
              <span style="font-size:10px;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:0.5px;">🗂️ Baki <span style="color:#dc2626;">*</span></span>
              <button id="lg-sync-btn" style="padding:3px 10px;background:#f1f5f9;border:1px solid #cbd5e1;border-radius:4px;cursor:pointer;font-size:10px;color:#64748b;font-weight:600;">🔄 Sinkron Baki</button>
            </div>
            <div style="position:relative;">
              <input id="lg-tray-search" type="text" placeholder="Pilih Baki (wajib untuk scan)" autocomplete="off"
                style="width:100%;padding:10px 12px;border-radius:6px;border:1px solid #cbd5e1;font-size:13px;background:#fff;color:#1e293b;font-weight:600;" />
              <div id="lg-tray-dropdown" style="display:none;position:absolute;top:100%;left:0;right:0;background:#fff;border:1px solid #cbd5e1;border-radius:6px;max-height:220px;overflow-y:auto;z-index:10;box-shadow:0 4px 12px rgba(0,0,0,0.1);margin-top:4px;"></div>
            </div>
            <div id="lg-tray-info" style="margin-top:6px;font-size:10px;color:#94a3b8;">⚠️ Pilih baki spesifik untuk memulai scan</div>
          </div>

          <div style="background:#e2e8f0;border-radius:8px;height:24px;overflow:hidden;margin-bottom:12px;">
            <div id="lg-progress-bar" style="height:100%;background:linear-gradient(90deg,#2563eb,#3b82f6);width:0%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#fff;transition:width 0.4s;border-radius:8px;"></div>
          </div>

          <div id="lg-stats" style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:12px;"></div>

          <div style="background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:14px;margin-bottom:12px;">
            <div style="display:flex;gap:8px;">
              <input id="lg-scan-input" type="text" placeholder="Scan barcode / ketik CodeProduct lalu Enter…"
                style="flex:1;padding:12px 16px;border-radius:8px;border:2px solid #2563eb;font-size:15px;font-weight:600;color:#1e293b;" />
              <button id="lg-scan-btn" style="padding:12px 20px;background:#2563eb;color:#fff;border:none;border-radius:8px;cursor:pointer;font-weight:700;font-size:14px;">CEK</button>
            </div>
            <div style="margin-top:10px;">
              <label style="display:flex;align-items:center;gap:8px;font-size:11px;color:#64748b;cursor:pointer;user-select:none;">
                <input type="checkbox" id="lg-autofill" checked style="accent-color:#2563eb;width:14px;height:14px;" />
                Auto-isi & sinkron form <span style="color:#94a3b8;">(scan kamu + scan pemain lain otomatis masuk form)</span>
              </label>
            </div>
            <div style="margin-top:8px;font-size:10px;color:#94a3b8;line-height:1.6;">
              ✅ Masuk · ⚠️ Sudah Discan · 🟠 Salah Baki · 🟣 Terjual/Rusak · 🔴 Barcode Tidak Ada — <b>semua otomatis</b>
            </div>
          </div>

          <div id="lg-result" style="display:none;padding:12px 16px;border-radius:8px;font-size:13px;margin-bottom:12px;line-height:1.6;"></div>

          <div style="display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap;">
            <button id="lg-send-form-btn" style="padding:8px 16px;background:#2563eb;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:12px;font-weight:600;">📤 Kirim ke Form</button>
            <button id="lg-export-btn" style="padding:8px 16px;background:#16a34a;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:12px;font-weight:600;">📥 Export CSV</button>
            <button id="lg-reset-btn" style="padding:8px 16px;background:#dc2626;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:12px;font-weight:600;">🔄 Reset Progress</button>
          </div>

          <div style="background:#fff;border:1px solid #e2e8f0;border-radius:8px;margin-bottom:14px;overflow:hidden;">
            <div style="padding:10px 14px;border-bottom:1px solid #e2e8f0;font-weight:700;font-size:12px;color:#475569;">📜 Riwayat Scan</div>
            <div style="max-height:220px;overflow-y:auto;">
              <table style="width:100%;border-collapse:collapse;">
                <thead>
                  <tr style="background:#f8fafc;position:sticky;top:0;">
                    <th style="padding:8px;text-align:left;font-size:10px;color:#64748b;border-bottom:1px solid #e2e8f0;">Waktu</th>
                    <th style="padding:8px;text-align:left;font-size:10px;color:#64748b;border-bottom:1px solid #e2e8f0;">Kode</th>
                    <th style="padding:8px;text-align:left;font-size:10px;color:#64748b;border-bottom:1px solid #e2e8f0;">CodeProduct</th>
                    <th style="padding:8px;text-align:left;font-size:10px;color:#64748b;border-bottom:1px solid #e2e8f0;">Nama</th>
                    <th style="padding:8px;text-align:center;font-size:10px;color:#64748b;border-bottom:1px solid #e2e8f0;">Baki</th>
                    <th style="padding:8px;text-align:center;font-size:10px;color:#64748b;border-bottom:1px solid #e2e8f0;">Oleh</th>
                    <th style="padding:8px;text-align:left;font-size:10px;color:#64748b;border-bottom:1px solid #e2e8f0;">Status</th>
                  </tr>
                </thead>
                <tbody id="lg-log"></tbody>
              </table>
            </div>
          </div>

          <div style="background:#fff;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
            <div style="padding:10px 14px;border-bottom:1px solid #e2e8f0;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
              <span style="font-weight:700;font-size:12px;color:#475569;">📋 Daftar Barang</span>
              <div style="display:flex;gap:4px;">
                <button class="lg-scan-tab" data-val="all" style="padding:5px 12px;border-radius:5px;border:1px solid #2563eb;background:#2563eb;color:#fff;font-size:10px;cursor:pointer;font-weight:600;">Semua <span class="lg-tab-count">0</span></button>
                <button class="lg-scan-tab" data-val="scanned" style="padding:5px 12px;border-radius:5px;border:1px solid #cbd5e1;background:#fff;color:#64748b;font-size:10px;cursor:pointer;font-weight:600;">✅ Sudah <span class="lg-tab-count">0</span></button>
                <button class="lg-scan-tab" data-val="unscanned" style="padding:5px 12px;border-radius:5px;border:1px solid #cbd5e1;background:#fff;color:#64748b;font-size:10px;cursor:pointer;font-weight:600;">⬜ Belum <span class="lg-tab-count">0</span></button>
              </div>
            </div>
            <div style="max-height:340px;overflow-y:auto;">
              <table style="width:100%;border-collapse:collapse;">
                <thead>
                  <tr style="background:#f8fafc;position:sticky;top:0;">
                    <th style="padding:8px;font-size:10px;color:#64748b;border-bottom:1px solid #e2e8f0;">No</th>
                    <th style="padding:8px;text-align:left;font-size:10px;color:#64748b;border-bottom:1px solid #e2e8f0;">CodeProduct</th>
                    <th style="padding:8px;text-align:left;font-size:10px;color:#64748b;border-bottom:1px solid #e2e8f0;">Nama</th>
                    <th style="padding:8px;text-align:center;font-size:10px;color:#64748b;border-bottom:1px solid #e2e8f0;">Baki</th>
                    <th style="padding:8px;text-align:center;font-size:10px;color:#64748b;border-bottom:1px solid #e2e8f0;">Berat</th>
                    <th style="padding:8px;text-align:center;font-size:10px;color:#64748b;border-bottom:1px solid #e2e8f0;">Kadar</th>
                    <th style="padding:8px;text-align:right;font-size:10px;color:#64748b;border-bottom:1px solid #e2e8f0;">Harga</th>
                    <th style="padding:8px;text-align:center;font-size:10px;color:#64748b;border-bottom:1px solid #e2e8f0;">✓</th>
                  </tr>
                </thead>
                <tbody id="lg-products"></tbody>
              </table>
            </div>
          </div>
        `;

        document.body.appendChild(panel);

        const fab = document.createElement('button');
        fab.id = 'lg-fab';
        fab.textContent = '📦';
        fab.style.cssText = `position:fixed;bottom:24px;right:24px;width:56px;height:56px;border-radius:50%;background:#2563eb;color:#fff;font-size:24px;border:none;cursor:pointer;z-index:99998;box-shadow:0 4px 16px rgba(37,99,235,0.4);`;

        fab.onmouseenter = () => fab.style.transform = 'scale(1.1)';
        fab.onmouseleave = () => fab.style.transform = 'scale(1)';

        document.body.appendChild(fab);

        fab.addEventListener('click', togglePanel);
        document.getElementById('lg-close').addEventListener('click', togglePanel);

        document.getElementById('lg-scan-input').addEventListener('keydown', e => {
          if (e.key === 'Enter') {
            e.preventDefault();
            const inp = document.getElementById('lg-scan-input');
            const val = inp.value.trim();
            if (val) {
              enqueueScan(val);
              inp.value = '';
            }
          }
        });

        document.getElementById('lg-scan-btn').addEventListener('click', () => {
          const inp = document.getElementById('lg-scan-input');
          const val = inp.value.trim();
          if (val) {
            enqueueScan(val);
            inp.value = '';
          }
        });

        document.getElementById('lg-export-btn').addEventListener('click', exportLog);
        document.getElementById('lg-reset-btn').addEventListener('click', resetProgress);
        document.getElementById('lg-sync-btn').addEventListener('click', syncTrayList);
        document.getElementById('lg-send-form-btn').addEventListener('click', sendToForm);

        document.getElementById('lg-autofill').addEventListener('change', e => {
          autoFillForm = e.target.checked;
        });

        const traySearch = document.getElementById('lg-tray-search');
        const trayDrop = document.getElementById('lg-tray-dropdown');

        traySearch.addEventListener('focus', () => {
          renderTrayDropdown(traySearch.value);
          trayDrop.style.display = 'block';
        });

        traySearch.addEventListener('input', () => {
          renderTrayDropdown(traySearch.value);
          trayDrop.style.display = 'block';
        });

        traySearch.addEventListener('keydown', e => {
          if (e.key === 'Enter') {
            e.preventDefault();
            const first = trayDrop.querySelector('.lg-tray-opt');
            if (first) first.click();
          }
          if (e.key === 'Escape') trayDrop.style.display = 'none';
        });

        document.addEventListener('click', onDocClick);

        panel.querySelectorAll('.lg-scan-tab').forEach(tab => {
          tab.addEventListener('click', () => {
            scanFilter = tab.dataset.val;

            panel.querySelectorAll('.lg-scan-tab').forEach(t => {
              const a = t === tab;
              t.style.background = a ? '#2563eb' : '#fff';
              t.style.color = a ? '#fff' : '#64748b';
              t.style.borderColor = a ? '#2563eb' : '#cbd5e1';
            });

            applyFilters();
          });
        });
      }

      function init() {
        if (initialized) return;
        initialized = true;

        injectStyles();
        injectUI();
        updateMpUI();
        renderLog();
        updateStats();

        if (isMulti()) {
          listenSession();
          updateStatus(`🟢 Menyambung ke sesi ${sessionId}…`);
        }

        if (trayList.length) {
          renderTrayDropdown('');
          if (!isMulti()) updateStatus(`✅ ${trayList.length} baki tersedia · Pilih baki spesifik untuk scan`);
        } else {
          syncTrayList();
        }
      }

      if (document.readyState === 'complete' || document.readyState === 'interactive') {
        setTimeout(init, 500);
      } else {
        window.addEventListener('DOMContentLoaded', () => setTimeout(init, 500));
      }
    })();
  }

  function bootByRoute() {
    applyRouteClass();

    if (isTotalPage()) startTotalizer();
    if (isScannerPage()) startScanner();
  }

  let lastHref = location.href;

  function onRouteChange() {
    if (location.href === lastHref) return;

    lastHref = location.href;
    applyRouteClass();

    // Bug 4 Fix: Close image overlay
    const ov = document.getElementById('lg-img-overlay');
    if (ov) ov.remove();

    // Fix 1: Paksa tutup panel Scanner kalau pindah halaman
    if (window.__lgCloseScannerPanel) window.__lgCloseScannerPanel();

    // Fix 2: Pancing Totalizer agar langsung update tanpa nunggu interval 800ms
    if (window.__lgtTriggerNav) window.__lgtTriggerNav();

    setTimeout(bootByRoute, 150);
    setTimeout(bootByRoute, 800);
    setTimeout(bootByRoute, 2200);
  }

  const originalPush = history.pushState;
  const originalReplace = history.replaceState;

  history.pushState = function (...args) {
    const res = originalPush.apply(this, args);
    onRouteChange();
    return res;
  };

  history.replaceState = function (...args) {
    const res = originalReplace.apply(this, args);
    onRouteChange();
    return res;
  };

  addEventListener('popstate', onRouteChange);
  addEventListener('hashchange', onRouteChange);
  setInterval(onRouteChange, 900);

  bootByRoute();
})();
