/* 站点交互：移动端导航、阅读进度、目录高亮、回到顶部 */
(function () {
  'use strict';

  // 移动端导航
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.querySelector('.nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') nav.classList.remove('open');
    });
  }

  // 阅读进度条
  var bar = document.querySelector('.progress');
  if (bar) {
    var raf = false;
    var update = function () {
      var h = document.documentElement;
      var max = h.scrollHeight - h.clientHeight;
      var p = max > 0 ? (h.scrollTop || document.body.scrollTop) / max : 0;
      bar.style.width = Math.min(100, Math.max(0, p * 100)) + '%';
      raf = false;
    };
    window.addEventListener('scroll', function () {
      if (!raf) { raf = true; window.requestAnimationFrame(update); }
    }, { passive: true });
    update();
  }

  // 回到顶部
  var top = document.querySelector('.to-top');
  if (top) {
    window.addEventListener('scroll', function () {
      top.classList.toggle('show', (window.scrollY || 0) > 600);
    }, { passive: true });
    top.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // 目录滚动高亮
  var links = Array.prototype.slice.call(document.querySelectorAll('.side-list a[href^="#"]'));
  if (links.length && 'IntersectionObserver' in window) {
    var map = {};
    var targets = [];
    links.forEach(function (a) {
      var id = decodeURIComponent(a.getAttribute('href').slice(1));
      var el = document.getElementById(id);
      if (el) { map[id] = a; targets.push(el); }
    });
    var setActive = function (id) {
      links.forEach(function (a) { a.classList.remove('is-active'); });
      if (map[id]) map[id].classList.add('is-active');
    };
    var io = new IntersectionObserver(function (entries) {
      var vis = entries.filter(function (e) { return e.isIntersecting; });
      if (vis.length) {
        vis.sort(function (a, b) { return a.boundingClientRect.top - b.boundingClientRect.top; });
        setActive(vis[0].target.id);
      }
    }, { rootMargin: '-84px 0px -68% 0px', threshold: 0 });
    targets.forEach(function (t) { io.observe(t); });
  }

  // 键盘：左右键翻章
  var prev = document.querySelector('.pagenav .prev');
  var next = document.querySelector('.pagenav .next');
  document.addEventListener('keydown', function (e) {
    if (e.target.matches('input, textarea, select')) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === 'ArrowLeft' && prev) window.location.href = prev.getAttribute('href');
    if (e.key === 'ArrowRight' && next) window.location.href = next.getAttribute('href');
  });
})();
