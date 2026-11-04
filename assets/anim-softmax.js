/* 0.3 softmax：分数 → 取指数 → 归一化 */
(function () {
  function mk(t, a) {
    var e = document.createElementNS('http://www.w3.org/2000/svg', t);
    for (var k in a) e.setAttribute(k, a[k]);
    return e;
  }
  var DATA = [
    { l: '词 A', s: -1.0 },
    { l: '词 B', s: 2.0 },
    { l: '词 C', s: -0.5 },
    { l: '词 D', s: 0.5 }
  ];
  DATA.forEach(function (d) { d.e = Math.exp(d.s); });
  var SUM = DATA.reduce(function (a, d) { return a + d.e; }, 0);
  DATA.forEach(function (d) { d.p = d.e / SUM * 100; });

  var W = 64, GAP = 44, X0 = 96, BASE = 244;
  var caps = [
    '四个打分分别是 −1.0、2.0、−0.5、0.5。注意有负数——概率不能是负数，直接归一化这条路走不通。',
    '先取 e 的幂：<b>0.368、7.389、0.607、1.649</b>。负数不见了，大小顺序没变，差距被放大。',
    '把这四个数加起来：0.368 + 7.389 + 0.607 + 1.649 = <b>10.01</b>。这就是分母。',
    '各自除以 10.01：<b>3.7%、73.8%、6.1%、16.5%</b>。四者加起来正好 100%，这才是权重。',
    '最高的那个拿走 73.8%。它原本只是第二名的 4.5 倍，现在成了 20 倍——指数把差距又放大了一层。'
  ];

  var built = false, bars = [], vt = [], sums;

  function build(host) {
    if (built) return;
    var svg = mk('svg', { viewBox: '0 0 680 272', width: '100%', 'aria-label': 'softmax 三步：取指数再归一化' });

    // 基线
    svg.appendChild(mk('line', { x1: 56, y1: BASE, x2: 640, y2: BASE, class: 'an-base' }));
    var ay = mk('text', { x: 56, y: 26, class: 'an-lbl' });
    ay.textContent = '分值'; svg.appendChild(ay);

    for (var i = 0; i < DATA.length; i++) {
      var x = X0 + i * (W + GAP);
      var r = mk('rect', { x: x, y: BASE, width: W, height: 1, rx: 4, class: 'an-bar' });
      svg.appendChild(r); bars.push(r);

      var t = mk('text', { x: x + W / 2, y: BASE - 8, class: 'an-vtxt' });
      svg.appendChild(t); vt.push(t);

      var lx = mk('text', { x: x + W / 2, y: BASE + 22, class: 'an-xtxt' });
      lx.textContent = DATA[i].l; svg.appendChild(lx);
    }

    sums = mk('text', { x: 640, y: 26, class: 'an-sum', 'text-anchor': 'end' });
    sums.textContent = '';
    svg.appendChild(sums);

    host.appendChild(svg);
    built = true;
  }

  function geo(step, i) {
    var d = DATA[i];
    if (step === 0) {
      var k = 60;
      if (d.s >= 0) return { y: BASE - d.s * k, h: d.s * k, neg: false };
      return { y: BASE, h: -d.s * k, neg: true };
    }
    var val = step === 3 || step === 4 ? d.p : d.e;
    var max = step === 3 || step === 4 ? 73.8 : 7.389;
    var h = val / max * 150;
    return { y: BASE - h, h: Math.max(h, 2), neg: false };
  }

  function txt(step, i) {
    var d = DATA[i];
    if (step === 0) return (d.s < 0 ? '−' : '') + Math.abs(d.s).toFixed(1);
    if (step === 1) return d.e < 1 ? d.e.toFixed(3).slice(1) : d.e.toFixed(2);
    if (step === 2) return d.e.toFixed(2);
    return d.p.toFixed(1) + '%';
  }

  window.ANIMS.softmax = {
    title: 'softmax：分数怎么变成百分比',
    count: 5,
    captions: caps,
    render: function (i, host) {
      build(host);
      for (var k = 0; k < DATA.length; k++) {
        var g = geo(i, k);
        bars[k].setAttribute('y', g.y);
        bars[k].setAttribute('height', g.h);
        bars[k].classList.toggle('neg', g.neg);
        bars[k].classList.toggle('hot', (i === 4 || i === 3) && DATA[k].p > 50);
        vt[k].setAttribute('y', g.neg ? g.y + g.h + 16 : g.y - 8);
        vt[k].textContent = txt(i, k);
      }
      sums.textContent = i >= 2 ? '总和 = ' + (i >= 3 ? '100%' : '10.01') : '';
    }
  };

  if (window.Anim) Anim.boot();
})();
