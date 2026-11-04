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
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }

  function mount(root, opts) {
    if (!root || root.dataset.mounted) return;
    root.dataset.mounted = '1';

    const count = opts.count;
    const caps = opts.captions || [];
    const render = opts.render;
    let i = 0, timer = null;

    const head = el('div', 'an-head');
    const title = el('span', 'an-title', opts.title || '');
    const counter = el('span', 'an-counter', '');
    head.appendChild(title);
    head.appendChild(counter);

    const body = el('div', 'an-body');
    const cap = el('div', 'an-cap');

    const ctrl = el('div', 'an-ctrl');
    const prev = el('button', 'an-btn', '上一步');
    const play = el('button', 'an-btn an-btn-main', '播放');
    const next = el('button', 'an-btn', '下一步');
    const dots = el('div', 'an-dots');
    ctrl.appendChild(prev);
    ctrl.appendChild(play);
    ctrl.appendChild(next);

    const dotEls = [];
    for (let k = 0; k < count; k++) {
      const d = el('button', 'an-dot');
      d.setAttribute('aria-label', '第 ' + (k + 1) + ' 步');
      d.onclick = () => { stop(); go(k); };
      dots.appendChild(d);
      dotEls.push(d);
    }

    root.appendChild(head);
    root.appendChild(body);
    root.appendChild(cap);
    root.appendChild(ctrl);
    root.appendChild(dots);

    function go(k) {
      i = Math.max(0, Math.min(count - 1, k));
      counter.textContent = (i + 1) + ' / ' + count;
      dotEls.forEach((d, n) => d.classList.toggle('on', n === i));
      cap.innerHTML = caps[i] || '';
      cap.style.opacity = '0';
      requestAnimationFrame(() => { cap.style.opacity = '1'; });
      render(i, body);
      prev.disabled = i === 0;
      next.disabled = i === count - 1;
    }

    function stop() {
      if (timer) { clearInterval(timer); timer = null; }
      play.textContent = '播放';
      play.classList.remove('playing');
    }

    function start() {
      if (i >= count - 1) go(0);
      play.textContent = '暂停';
      play.classList.add('playing');
      timer = setInterval(() => {
        if (i >= count - 1) { stop(); return; }
        go(i + 1);
      }, opts.interval || 1700);
    }

    prev.onclick = () => { stop(); go(i - 1); };
    next.onclick = () => { stop(); go(i + 1); };
    play.onclick = () => { if (timer) stop(); else start(); };

    root.setAttribute('tabindex', '0');
    root.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight') { e.preventDefault(); stop(); go(i + 1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); stop(); go(i - 1); }
      if (e.key === ' ') { e.preventDefault(); if (timer) stop(); else start(); }
    });

    go(0);
  }

  function boot() {
    document.querySelectorAll('[data-anim]').forEach(root => {
      const name = root.dataset.anim;
      const def = window.ANIMS && window.ANIMS[name];
      if (!def) return;
      mount(root, def);
    });
  }

  window.Anim = { mount, boot };
  window.ANIMS = window.ANIMS || {};

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
