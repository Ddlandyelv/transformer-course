/* ===== 分步动画引擎 =====
   设计原则：
   1. 不自动播完 —— 用户控制节奏，每步只变一件事
   2. 每步有独立说明，画面和文字同步
   3. 键盘 ← → 可操作，支持重播
   动画用 SVG + CSS transition 实现，不依赖画布库。
*/
(function () {
  'use strict';

  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }

  var ICON_PLAY = '<svg viewBox="0 0 12 12" width="11" height="11" aria-hidden="true">' +
    '<path d="M3.4 1.6 L10 6 L3.4 10.4 Z" fill="currentColor"/></svg>';
  var ICON_PAUSE = '<svg viewBox="0 0 12 12" width="11" height="11" aria-hidden="true">' +
    '<rect x="3" y="1.8" width="2.4" height="8.4" rx="1" fill="currentColor"/>' +
    '<rect x="6.6" y="1.8" width="2.4" height="8.4" rx="1" fill="currentColor"/></svg>';

  function mount(root, opts) {
    if (!root || root.dataset.mounted) return;
    root.dataset.mounted = '1';

    var count = opts.count;
    var caps = opts.captions || [];
    var render = opts.render;
    var i = 0, timer = null;

    var head = el('div', 'an-head');
    head.appendChild(el('span', 'an-title', opts.title || ''));
    var counter = el('span', 'an-counter', '');
    head.appendChild(counter);

    var body = el('div', 'an-body');
    var cap = el('div', 'an-cap');

    var ctrl = el('div', 'an-ctrl');
    var prev = el('button', 'an-btn', '上一步');
    var next = el('button', 'an-btn an-btn-key', '下一步');
    var play = el('button', 'an-play', ICON_PLAY);
    play.setAttribute('aria-label', '自动播放');
    play.title = '自动播放';
    ctrl.appendChild(prev);
    ctrl.appendChild(next);
    ctrl.appendChild(el('span', 'an-gap'));
    ctrl.appendChild(play);

    var dots = el('div', 'an-dots');
    var dotEls = [];
    for (var k = 0; k < count; k++) {
      (function (n) {
        var d = el('button', 'an-dot');
        d.setAttribute('aria-label', '第 ' + (n + 1) + ' 步');
        d.onclick = function () { stop(); go(n); };
        dots.appendChild(d);
        dotEls.push(d);
      })(k);
    }

    root.appendChild(head);
    root.appendChild(body);
    root.appendChild(cap);
    root.appendChild(ctrl);
    root.appendChild(dots);

    function go(k) {
      i = Math.max(0, Math.min(count - 1, k));
      counter.textContent = (i + 1) + ' / ' + count;
      dotEls.forEach(function (d, n) { d.classList.toggle('on', n <= i); });
      cap.innerHTML = caps[i] || '';
      render(i, body);
      prev.disabled = i === 0;
      next.disabled = i === count - 1;
      if (i === count - 1) stop();
    }

    function stop() {
      if (timer) { clearInterval(timer); timer = null; }
      play.innerHTML = ICON_PLAY;
      play.classList.remove('playing');
      play.title = '自动播放';
    }

    function start() {
      if (i >= count - 1) go(0);
      play.innerHTML = ICON_PAUSE;
      play.classList.add('playing');
      play.title = '暂停';
      timer = setInterval(function () {
        if (i >= count - 1) { stop(); return; }
        go(i + 1);
      }, opts.interval || 2000);
    }

    prev.onclick = function () { stop(); go(i - 1); };
    next.onclick = function () { stop(); go(i + 1); };
    play.onclick = function () { if (timer) stop(); else start(); };

    // 滚出视口就停掉自动播放，避免后台空转
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (!e.isIntersecting && timer) stop(); });
      }, { threshold: 0 }).observe(root);
    }

    root.setAttribute('tabindex', '0');
    root.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); stop(); go(i + 1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); stop(); go(i - 1); }
      if (e.key === ' ') { e.preventDefault(); if (timer) stop(); else start(); }
    });

    go(0);
  }

  function boot() {
    document.querySelectorAll('[data-anim]').forEach(function (root) {
      var name = root.dataset.anim;
      var def = window.ANIMS && window.ANIMS[name];
      if (!def) return;
      mount(root, def);
    });
  }

  window.Anim = { mount: mount, boot: boot };
  window.ANIMS = window.ANIMS || {};

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
