/* 站点交互 v2：导航 / 目录抽屉 / 滚动同步 / 阅读进度 / 搜索 / 自查清单 / 续读 */
(function () {
  'use strict';

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  /* ---------- 顶栏：章节导航（窄屏） ---------- */
  var navToggle = $('.nav-toggle');
  var nav = $('.nav');
  if (navToggle && nav) {
    navToggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') nav.classList.remove('open');
    });
  }

  /* ---------- 目录抽屉（<1340px） ---------- */
  var tocToggle = $('.toc-toggle');
  var scrim = $('.toc-scrim');
  var side = $('.side');

  function closeToc() {
    document.body.classList.remove('toc-open');
    if (scrim) scrim.classList.remove('show');
    if (tocToggle) tocToggle.setAttribute('aria-expanded', 'false');
  }
  if (tocToggle && side) {
    var tocClose = document.createElement('button');
    tocClose.className = 'toc-close';
    tocClose.type = 'button';
    tocClose.setAttribute('aria-label', '关闭目录');
    tocClose.textContent = '×';
    tocClose.addEventListener('click', closeToc);
    side.appendChild(tocClose);

    tocToggle.addEventListener('click', function () {
      var open = document.body.classList.toggle('toc-open');
      if (scrim) scrim.classList.toggle('show', open);
      tocToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }
  if (scrim) scrim.addEventListener('click', closeToc);
  if (side) side.addEventListener('click', function (e) {
    if (e.target.closest && e.target.closest('a') && window.innerWidth < 1340) closeToc();
  });

  /* ---------- 阅读进度条 ---------- */
  var bar = $('.progress');
  var raf = false;
  function paintProgress() {
    var h = document.documentElement;
    var max = h.scrollHeight - h.clientHeight;
    var p = max > 0 ? (window.scrollY || h.scrollTop || 0) / max : 0;
    if (bar) bar.style.width = Math.min(100, Math.max(0, p * 100)) + '%';
    raf = false;
  }

  /* ---------- 回到顶部 ---------- */
  var top = $('.to-top');
  if (top) {
    top.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ---------- 目录滚动同步 ---------- */
  var heads = $$('.prose h2[id], .prose h3[id]');
  var tocLinks = $$('.side .toc-link, .side .toc-sub a');
  var tocItems = $$('.side .toc-item');
  var linkMap = {};
  tocLinks.forEach(function (a) {
    var id = decodeURIComponent(a.getAttribute('href').slice(1));
    linkMap[id] = a;
  });

  function markToc(id) {
    tocItems.forEach(function (li) { li.classList.remove('is-active', 'is-open'); });
    tocLinks.forEach(function (a) { a.classList.remove('is-active'); });

    var a = linkMap[id];
    if (!a) return;
    var li = a.closest('.toc-item');
    if (li) li.classList.add('is-active', 'is-open');
    a.classList.add('is-active');
  }

  var lastId = '';
  function syncToc() {
    if (!heads.length || !tocLinks.length) return;
    var y = window.scrollY + 140;
    var cur = heads[0];
    for (var i = 0; i < heads.length; i++) {
      var t = heads[i].getBoundingClientRect().top + window.scrollY;
      if (t <= y) cur = heads[i]; else break;
    }
    if (cur && cur.id && cur.id !== lastId) {
      lastId = cur.id;
      markToc(cur.id);
      scrollTocIntoView(cur.id);
    }
  }

  function scrollTocIntoView(id) {
    if (!side || window.innerWidth < 1340 || !side.scrollHeight) return;
    var a = linkMap[id];
    if (!a) return;
    var sideRect = side.getBoundingClientRect();
    var aRect = a.getBoundingClientRect();
    if (aRect.top < sideRect.top + 8) {
      side.scrollTop += aRect.top - sideRect.top - 8;
    } else if (aRect.bottom > sideRect.bottom - 12) {
      side.scrollTop += aRect.bottom - sideRect.bottom + 12;
    }
  }

  /* ---------- 章节锚点链接 ---------- */
  heads.forEach(function (h) {
    var a = document.createElement('a');
    a.className = 'h-anchor';
    a.href = '#' + h.id;
    a.setAttribute('aria-label', '本节链接');
    a.textContent = '#';
    h.appendChild(a);
  });

  /* ---------- 续读位置 ---------- */
  var resume = null;
  var posKey = 'ma:pos:' + location.pathname.split('/').pop();
  var resumeRatio = 0;
  try { resumeRatio = parseFloat(localStorage.getItem(posKey) || '0'); } catch (e) { resumeRatio = 0; }

  if (resumeRatio > 0.05 && resumeRatio < 0.96 && $('.pagenav')) {
    resume = document.createElement('button');
    resume.className = 'resume';
    resume.type = 'button';
    resume.innerHTML = '上次读到 <b>' + Math.round(resumeRatio * 100) + '%</b> · 继续<span class="x" aria-hidden="true">×</span>';
    document.body.appendChild(resume);
    resume.addEventListener('click', function (e) {
      if (e.target.classList.contains('x')) {
        try { localStorage.removeItem(posKey); } catch (er) {}
        resume.classList.remove('show');
        return;
      }
      var max = document.documentElement.scrollHeight - window.innerHeight;
      window.scrollTo({ top: max * resumeRatio, behavior: 'smooth' });
      resume.classList.remove('show');
    });
    setTimeout(function () { resume.classList.add('show'); }, 900);
  }

  /* ---------- 滚动总调度 ---------- */
  var saveTick = 0;
  window.addEventListener('scroll', function () {
    if (!raf) { raf = true; window.requestAnimationFrame(paintProgress); }
    if (top) top.classList.toggle('show', (window.scrollY || 0) > 700);
    syncToc();
    var now = Date.now();
    if (now - saveTick > 900 && posKey) {
      saveTick = now;
      var max = document.documentElement.scrollHeight - window.innerHeight;
      if (max > 0) {
        try { localStorage.setItem(posKey, (window.scrollY / max).toFixed(3)); } catch (e) {}
      }
    }
  }, { passive: true });

  /* ---------- 自查清单：勾选 + 计数 ---------- */
  $$('.checklist').forEach(function (box, bi) {
    var list = $('ol', box);
    if (!list) return;
    var items = $$('li', list);
    if (!items.length) return;

    items.forEach(function (li) {
      if ($('.ck', li)) return;
      var html = li.innerHTML;
      li.innerHTML = '<label class="ck"><span class="ck-text">' + html + '</span><input type="checkbox" aria-label="勾选此项"></label>';
    });

    var status = document.createElement('div');
    status.className = 'ck-status';
    status.innerHTML = '已勾选 <b>0</b> / ' + items.length + ' <span class="ck-meter"><i></i></span>';
    box.appendChild(status);

    var count = $('b', status);
    var meter = $('.ck-meter i', status);
    list.addEventListener('change', function () {
      var n = $$('input:checked', list).length;
      count.textContent = n;
      meter.style.width = (n / items.length * 100) + '%';
    });
  });

  /* ---------- 全站搜索 ---------- */
  var INDEX = window.SEARCH_INDEX || [];
  var modal = null, input = null, results = null, sugg = null, sel = -1, hits = [];

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }
  function hl(raw, q) {
    if (!q) return esc(raw);
    var i = String(raw).toLowerCase().indexOf(q.toLowerCase());
    if (i < 0) return esc(raw);
    return esc(raw.slice(0, i)) + '<mark>' + esc(raw.slice(i, i + q.length)) + '</mark>' + esc(raw.slice(i + q.length));
  }

  function buildModal() {
    modal = document.createElement('div');
    modal.className = 'search-modal';
    modal.innerHTML =
      '<div class="search-backdrop"></div>' +
      '<div class="search-panel" role="dialog" aria-modal="true" aria-label="搜索全站">' +
        '<div class="search-field">' +
          '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20.5 20.5 16.7 16.7"/></svg>' +
          '<input type="search" id="searchInput" placeholder="搜索全站：彩礼、520、亲子鉴定、保护令…" autocomplete="off" spellcheck="false">' +
          '<kbd>Esc</kbd>' +
        '</div>' +
        '<div class="search-sugg"></div>' +
        '<div class="search-results"></div>' +
        '<div class="search-foot"><span><kbd>↑</kbd><kbd>↓</kbd> 选择</span><span><kbd>Enter</kbd> 打开</span><span><kbd>Ctrl</kbd>+<kbd>K</kbd> 随时唤起</span><span style="margin-left:auto">共 ' + INDEX.length + ' 节</span></div>' +
      '</div>';
    document.body.appendChild(modal);
    input = $('#searchInput', modal);
    results = $('.search-results', modal);
    sugg = $('.search-sugg', modal);

    ['彩礼', '520', '亲子鉴定', '人身安全保护令', '聊天记录', '净身出户'].forEach(function (w) {
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = w;
      b.addEventListener('click', function () {
        input.value = w;
        run();
        input.focus();
      });
      sugg.appendChild(b);
    });

    $('.search-backdrop', modal).addEventListener('click', closeSearch);
    input.addEventListener('input', run);
    input.addEventListener('keydown', onKey);
  }

  function openSearch() {
    if (!modal) buildModal();
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
    input.value = '';
    run();
    setTimeout(function () { input.focus(); }, 30);
  }
  function closeSearch() {
    if (!modal) return;
    modal.classList.remove('open');
    document.body.style.overflow = '';
  }

  function render(list) {
    hits = list;
    sel = -1;
    if (!list.length) {
      results.innerHTML = '<div class="search-empty">没有匹配的章节。换个更短的词试试，例如「彩礼」「鉴定」「报警」。</div>';
      return;
    }
    results.innerHTML = list.map(function (it, i) {
      return '<a class="search-hit" data-i="' + i + '" href="' + it.p + '.html#' + it.a + '">' +
        '<small>' + esc(it.n) + '</small>' +
        '<b>' + hl(it.t, it._q) + '</b>' +
        '<span>' + hl(it.x, it._q) + '</span>' +
        '</a>';
    }).join('');
    $$('.search-hit', results).forEach(function (a) {
      a.addEventListener('mouseenter', function () { setSel(parseInt(a.dataset.i, 10)); });
    });
  }

  function setSel(i) {
    var nodes = $$('.search-hit', results);
    if (!nodes.length) return;
    sel = Math.max(0, Math.min(nodes.length - 1, i));
    nodes.forEach(function (n, k) { n.classList.toggle('is-sel', k === sel); });
    nodes[sel].scrollIntoView({ block: 'nearest' });
  }

  function run() {
    var q = input.value.trim();
    sugg.style.display = q ? 'none' : 'flex';
    if (!q) {
      render(INDEX.slice(0, 6));
      return;
    }
    var ql = q.toLowerCase();
    var out = [];
    INDEX.forEach(function (it) {
      var t = it.t.toLowerCase(), x = it.x.toLowerCase();
      var score = 0;
      if (t.indexOf(ql) >= 0) score += 10;
      if (x.indexOf(ql) >= 0) score += 3;
      if (score) {
        out.push({ p: it.p, n: it.n, t: it.t, a: it.a, x: it.x, _q: q, _s: score + (t.startsWith(ql) ? 5 : 0) });
      }
    });
    out.sort(function (a, b) { return b._s - a._s; });
    render(out.slice(0, 20));
  }

  function onKey(e) {
    if (e.key === 'Escape') { closeSearch(); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); setSel(sel + 1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSel(sel - 1); }
    else if (e.key === 'Enter') {
      e.preventDefault();
      var target = hits[sel >= 0 ? sel : 0];
      if (target) location.href = target.p + '.html#' + target.a;
    }
  }

  $$('.search-open').forEach(function (b) {
    b.addEventListener('click', openSearch);
  });

  document.addEventListener('keydown', function (e) {
    var k = e.key.toLowerCase();
    if ((e.ctrlKey || e.metaKey) && k === 'k') { e.preventDefault(); openSearch(); return; }
    if (k === '/' && !e.target.matches('input, textarea, select')) {
      e.preventDefault();
      openSearch();
      return;
    }
    if (e.key === 'Escape') { closeToc(); closeSearch(); }
  });

  /* ---------- 左右键翻章 ---------- */
  var prev = $('.pagenav .prev');
  var next = $('.pagenav .next');
  document.addEventListener('keydown', function (e) {
    if (e.target.matches('input, textarea, select')) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (modal && modal.classList.contains('open')) return;
    if (e.key === 'ArrowLeft' && prev) location.href = prev.getAttribute('href');
    if (e.key === 'ArrowRight' && next) location.href = next.getAttribute('href');
  });

  /* ---------- 初始化 ---------- */
  paintProgress();
  syncToc();
})();
