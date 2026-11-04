/* p11 FFN：16 格 → 64 格 → 16 格，先撑宽再压回 */
(function () {
  function mk(t, a) {
    var e = document.createElementNS('http://www.w3.org/2000/svg', t);
    for (var k in a) e.setAttribute(k, a[k]);
    return e;
  }
  var X0 = 56, TW = 7, TH = 32;
  var Y = [58, 128, 198];
  var N1 = 16, N2 = 64;

  function rnd(i) {
    var x = Math.sin(i * 12.9898) * 43758.5453;
    return x - Math.floor(x);
  }

  var caps = [
    '一个位置上的向量，宽 512（这里用 16 个格子示意，每格代表 32 维）。它已经过完注意力，跟其他词交换过信息了，现在要独自再加工一遍。',
    '乘上 W₁（512 × 2048）：格子从 16 个变成 <b>64 个</b>，宽度翻了 4 倍。这一步只是线性变换，没有任何非线性。',
    '过 ReLU：负数归零。训练好的网络里大约一半通道会被清零（灰色格子）。所以中间这一层虽然宽，实际活跃的只有一半左右。',
    '乘上 W₂（2048 × 512）：压回 16 格。信息在 2048 维里被重新组合过一次，再压缩回来。',
    '加上残差：原始输入原封不动加回来。如果这两层没学到有用的东西，输出至少等于输入，不会更糟——这是 6 层能训起来的关键。',
    '算参数：W₁ + W₂ = 2 × 512 × 2048 ≈ <b>210 万</b>。同一层里注意力只有 4 × 512 × 512 ≈ 105 万。所以 FFN 占每层参数的三分之二。'
  ];

  var built = false, t1 = [], t2 = [], t3 = [], arc, lab1, lab2, lab3, m1, m2;

  function ticks(n) {
    var out = [];
    for (var i = 0; i < n; i++) {
      var r = mk('rect', { x: X0 + i * TW, y: 0, width: TW - 0.9, height: TH, rx: 2, class: 'an-tick' });
      out.push(r);
    }
    return out;
  }

  function build(host) {
    if (built) return;
    var svg = mk('svg', { viewBox: '0 0 680 236', width: '100%', 'aria-label': 'FFN：通道数 16 → 64 → 16' });
    var defs = mk('defs', {});
    defs.innerHTML = '<marker id="rsA" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M1 1L8 5L1 9" fill="none" stroke="#0F6E56" stroke-width="1.6" stroke-linecap="round"/></marker>';
    svg.appendChild(defs);

    t1 = ticks(N1); t1.forEach(function (r) { r.setAttribute('y', Y[0]); svg.appendChild(r); });
    t2 = ticks(N2); t2.forEach(function (r, i) {
      r.setAttribute('y', Y[1]);
      r.style.opacity = '0';
      if (rnd(i) < 0.45) r.dataset.dead = '1';
      svg.appendChild(r);
    });
    t3 = ticks(N1); t3.forEach(function (r) { r.setAttribute('y', Y[2]); r.style.opacity = '0'; svg.appendChild(r); });

    // 残差弧线
    arc = mk('path', {
      d: 'M ' + (X0 - 2) + ' ' + (Y[0] + TH / 2) + ' C 16 ' + (Y[0] + TH / 2) + ', 16 ' + (Y[2] + TH / 2) + ', ' + (X0 - 2) + ' ' + (Y[2] + TH / 2),
      class: 'an-resarc an-draw', 'marker-end': 'url(#rsA)'
    });
    svg.appendChild(arc);
    var alen = arc.getTotalLength();
    arc.style.setProperty('--len', alen);

    // 宽度标签
    lab1 = mk('text', { x: X0 + N1 * TW + 10, y: Y[0] + TH / 2 + 4, class: 'an-step' });
    lab1.textContent = '512'; svg.appendChild(lab1);
    lab2 = mk('text', { x: X0 + N2 * TW + 10, y: Y[1] + TH / 2 + 4, class: 'an-step' });
    lab2.textContent = '2048'; svg.appendChild(lab2);
    lab3 = mk('text', { x: X0 + N1 * TW + 10, y: Y[2] + TH / 2 + 4, class: 'an-step' });
    lab3.textContent = '512'; svg.appendChild(lab3);

    // 变换标注
    m1 = mk('text', { x: X0, y: 109, class: 'an-step', 'font-size': 11 });
    m1.textContent = '× W₁　512 → 2048'; svg.appendChild(m1);
    m2 = mk('text', { x: X0, y: 179, class: 'an-step', 'font-size': 11 });
    m2.textContent = '× W₂　2048 → 512'; svg.appendChild(m2);

    host.appendChild(svg);
    built = true;
  }

  window.ANIMS.ffn = {
    title: 'FFN：16 格撑到 64 格，再压回来',
    count: 6,
    captions: caps,
    render: function (i, host) {
      build(host);

      t1.forEach(function (r, n) {
        r.style.transitionDelay = (n * 0.028) + 's';
        r.style.opacity = 1;
        r.classList.toggle('hot', i === 0 || i === 4);
      });
      t2.forEach(function (r, n) {
        r.style.transitionDelay = i >= 1 ? (n * 0.0045) + 's' : '0s';
        r.style.opacity = i >= 1 ? 1 : 0;
        r.classList.toggle('dead', !!r.dataset.dead && i >= 2);
        r.classList.toggle('hot', i === 1 && n < 16);
      });
      t3.forEach(function (r, n) {
        r.style.transitionDelay = i >= 3 ? (0.1 + n * 0.028) + 's' : '0s';
        r.style.opacity = i >= 3 ? 1 : 0;
        r.classList.toggle('hot', i === 3 || i === 4);
      });

      arc.style.opacity = i >= 4 ? 1 : 0;
      arc.classList.toggle('on', i >= 4);
      lab2.style.opacity = i >= 1 ? 1 : 0.25;
      lab3.style.opacity = i >= 3 ? 1 : 0.25;
      m1.style.opacity = i >= 1 ? 1 : 0.25;
      m2.style.opacity = i >= 3 ? 1 : 0.25;
    }
  };

  if (window.Anim) Anim.boot();
})();
