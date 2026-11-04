/* 0.5 注意力：五个词直接连线，弧线依次生长，权重跟着浮上来 */
(function () {
  function mk(t, a) {
    var e = document.createElementNS('http://www.w3.org/2000/svg', t);
    for (var k in a) e.setAttribute(k, a[k]);
    return e;
  }
  var WORDS = [
    { l: '小猫', w: 25 },
    { l: '追', w: 8 },
    { l: '老鼠', w: 60 },
    { l: '因为', w: 4 },
    { l: '它', w: 3 }
  ];
  var FOCUS = 4;
  var W = 92, GAP = 12, X0 = 86, TOP = 96, BH = 44;
  var BAR_Y = 196, BAR_H = 30;

  function cx(i) { return X0 + i * (W + GAP) + W / 2; }

  var caps = [
    '先看一句话：「小猫 追 老鼠 因为 它 跑得 快」。要理解<ruby>它</ruby>，必须先知道它指的是谁——这个信息不在「它」这个字里。',
    '注意力做的是：让「它」向句中<b>每一个词</b>都发出一条询问。看这些线，是从「它」那里一根一根伸出去的，不是挨个传递。',
    '每条询问都得到一个分数，归一化成权重。这里「老鼠」拿到 <b>60%</b>，「小猫」25%。线越粗，权重越大。',
    '然后把各词的信息按权重混起来：新表示 = 60% 的老鼠 + 25% 的小猫 + 8% 的追 + …。这一步叫加权求和。',
    '关键在于：从「它」到「老鼠」只隔了<b>一步</b>，中间不管隔多少个词都一样。RNN 要走 4 步，卷积要堆 2 层以上。'
  ];

  var built = false, boxes = [], arcs = [], nums = [], segs = [], barLbl;

  function build(host) {
    if (built) return;
    var svg = mk('svg', { viewBox: '0 0 680 240', width: '100%', 'aria-label': '注意力：一个词向所有词连线并按权重混合' });
    var defs = mk('defs', {});
    defs.innerHTML = '<marker id="atA" viewBox="0 0 10 10" refX="7.5" refY="5" markerWidth="4" markerHeight="4" orient="auto"><path d="M1 1.4L8 5L1 8.6" fill="none" stroke="#2F5BE8" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></marker>';
    svg.appendChild(defs);

    // 词框
    for (var i = 0; i < WORDS.length; i++) {
      var x = X0 + i * (W + GAP);
      var r = mk('rect', { x: x, y: TOP, width: W, height: BH, rx: 10, class: 'an-cell' });
      svg.appendChild(r); boxes.push(r);
      var t = mk('text', { x: x + W / 2, y: TOP + BH / 2 + 1, class: 'an-word' });
      t.textContent = WORDS[i].l;
      svg.appendChild(t);
    }

    // 弧线：高度只由距离决定（近的矮、远的拱得高），粗细才代表权重
    for (var k = 0; k < WORDS.length; k++) {
      if (k === FOCUS) continue;
      var x1 = cx(FOCUS) - 48 + k * 16;
      var x2 = cx(k);
      var lift = 50 + Math.abs(x2 - x1) * 0.24;
      var d = 'M' + x1 + ' ' + (TOP - 1) +
        ' Q' + ((x1 + x2) / 2) + ' ' + (TOP - 1 - lift) + ' ' + x2 + ' ' + (TOP - 1);
      var a = mk('path', { d: d, fill: 'none', 'marker-end': 'url(#atA)', class: 'an-arc an-draw' });
      svg.appendChild(a);
      var len = a.getTotalLength();
      a.style.setProperty('--len', len);
      a.dataset.len = len;
      arcs.push({ el: a, k: k });
    }

    // 权重数字
    for (var n = 0; n < WORDS.length; n++) {
      var nx = X0 + n * (W + GAP) + W / 2;
      var nt = mk('text', { x: nx, y: TOP + BH + 27, class: 'an-wt an-rise' });
      svg.appendChild(nt); nums.push(nt);
    }

    // 加权求和条
    barLbl = mk('text', { x: X0, y: BAR_Y - 12, class: 'an-lbl an-rise' });
    barLbl.textContent = '加权求和后的新表示';
    svg.appendChild(barLbl);

    var bx = X0;
    for (var s = 0; s < WORDS.length; s++) {
      var wpx = WORDS[s].w / 100 * (W * 5 + GAP * 4);
      var seg = mk('rect', { x: bx + 1.5, y: BAR_Y, width: Math.max(wpx - 3, 2), height: BAR_H, rx: 4, class: 'an-seg an-sweep' });
      svg.appendChild(seg); segs.push(seg);
      bx += wpx;
    }

    host.appendChild(svg);
    built = true;
  }

  window.ANIMS.attn = {
    title: '注意力：一次直达，不靠传递',
    count: 5,
    captions: caps,
    render: function (i, host) {
      build(host);

      boxes.forEach(function (b, k) {
        b.classList.toggle('hot', k === FOCUS);
      });

      // 弧线：依次生长，权重越大线越粗
      arcs.forEach(function (o, n) {
        var k = o.k, a = o.el;
        var on = i >= 1;
        a.classList.toggle('on', on);
        a.style.transitionDelay = on ? (n * 0.12) + 's' : '0s';
        a.style.strokeWidth = (i >= 2 ? (0.9 + WORDS[k].w * 0.05) : 1.1) + 'px';
        a.style.opacity = on ? (i >= 2 ? String(0.45 + WORDS[k].w / 100 * 0.55) : '0.6') : '0';
      });

      // 数字：弧线落位之后浮上来
      nums.forEach(function (t, k) {
        var show = i >= 2;
        t.classList.toggle('on', show);
        t.style.transitionDelay = show ? (0.35 + k * 0.11) + 's' : '0s';
        t.textContent = show ? WORDS[k].w + '%' : '';
        t.style.fontWeight = WORDS[k].w > 20 ? '600' : '400';
        t.style.fill = WORDS[k].w > 20 ? 'var(--accent-ink)' : 'var(--ink-3)';
      });

      // 总和条：从左往右刷出来
      var showBar = i >= 3;
      segs.forEach(function (g, k) {
        g.classList.toggle('on', showBar);
        g.style.transitionDelay = showBar ? (0.1 + k * 0.08) + 's' : '0s';
        g.style.opacity = String(0.92 - k * 0.14);
      });
      barLbl.classList.toggle('on', showBar);
    }
  };

  if (window.Anim) Anim.boot();
})();
