/* p07 编码器-解码器：数据从输入流到输出 */
(function () {
  function mk(t, a) {
    var e = document.createElementNS('http://www.w3.org/2000/svg', t);
    for (var k in a) e.setAttribute(k, a[k]);
    return e;
  }

  var ENC_X = 124, DEC_X = 288, EW = 86, EH = 42, EG = 6;
  var BOX = [
    { k: 'in',  x: 22,  y: 112, w: 74, h: 56, t: '输入', s: '我 爱 猫' },
    { k: 'out', x: 566, y: 112, w: 90, h: 56, t: '输出', s: '“猫”' },
    { k: 'lin', x: 420, y: 104, w: 104, h: 72, t: '线性 + softmax', s: '37000 个概率' }
  ];

  var caps = [
    '整个架构就一条流向：左边进词，依次穿过编码器和解码器，右边出下一个词。没有循环、没有时间步。',
    '三个词先变成三个 512 维向量——这一步只是一次查表，还没有任何「理解」。',
    '编码器逐层加工。每一层都做同样两件事：先让词与词互相看（自注意力），再各自加工（FFN）。6 层就是把这套动作重复 6 次。',
    '编码器输出一组向量，长度等于输入词数。这份结果会被<b>每一层解码器</b>读取，不是只用一次。',
    '解码器一层一层往上走，每层比编码器多一个子层：交叉注意力，专门用来「看」编码器的输出。',
    '最上层输出一个 512 维向量，线性层把它映到 37000 维（词表大小），softmax 变成概率。',
    '概率最高的那个词就是输出。把它接到输入末尾，再跑一遍，就得到下一个词——这就是「自回归」。'
  ];

  var built = false, boxes = {}, encs = [], decs = [], arrows = [], labels = [];

  function build(host) {
    if (built) return;
    var svg = mk('svg', { viewBox: '0 0 680 262', width: '100%', 'aria-label': '编码器-解码器数据流' });
    var defs = mk('defs', {});
    defs.innerHTML = '<marker id="flA" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M1 1L8 5L1 9" fill="none" stroke="#9AA6A2" stroke-width="1.6" stroke-linecap="round"/></marker>';
    svg.appendChild(defs);

    // 编码器 / 解码器堆
    for (var i = 0; i < 3; i++) {
      var y = 84 + i * (EH + EG);
      var e1 = mk('rect', { x: ENC_X, y: y, width: EW, height: EH, rx: 6, class: 'an-cell' });
      svg.appendChild(e1); encs.push(e1);
      var t1 = mk('text', { x: ENC_X + EW / 2, y: y + EH / 2 + 1, class: 'an-mtx', 'font-size': 10 });
      t1.textContent = i < 2 ? '编码层 ' + (i + 1) : '⋯ ×6';
      svg.appendChild(t1); encs.push(t1);

      var d1 = mk('rect', { x: DEC_X, y: y, width: EW, height: EH, rx: 6, class: 'an-cell' });
      svg.appendChild(d1); decs.push(d1);
      var t2 = mk('text', { x: DEC_X + EW / 2, y: y + EH / 2 + 1, class: 'an-mtx', 'font-size': 10 });
      t2.textContent = i < 2 ? '解码层 ' + (i + 1) : '⋯ ×6';
      svg.appendChild(t2); decs.push(t2);
    }

    // 顶部标题
    var h1 = mk('text', { x: ENC_X + EW / 2, y: 72, class: 'an-lbl', 'text-anchor': 'middle' });
    h1.textContent = '编码器'; svg.appendChild(h1);
    var h2 = mk('text', { x: DEC_X + EW / 2, y: 72, class: 'an-lbl', 'text-anchor': 'middle' });
    h2.textContent = '解码器'; svg.appendChild(h2);

    // 三个独立站点
    BOX.forEach(function (b) {
      var r = mk('rect', { x: b.x, y: b.y, width: b.w, height: b.h, rx: 8, class: 'an-cell' });
      svg.appendChild(r);
      var t = mk('text', { x: b.x + b.w / 2, y: b.y + 20, class: 'an-lbl', 'text-anchor': 'middle' });
      t.textContent = b.t; svg.appendChild(t);
      var s = mk('text', { x: b.x + b.w / 2, y: b.y + 40, class: 'an-mtx', 'font-size': 10.5 });
      s.textContent = b.s; svg.appendChild(s);
      boxes[b.k] = { r: r, t: t, s: s };
    });

    function arrow(x1, x2, y) {
      var l = mk('line', {
        x1: x1, y1: y, x2: x2, y2: y,
        class: 'an-flow an-draw', 'marker-end': 'url(#flA)'
      });
      svg.appendChild(l);
      var len = Math.abs(x2 - x1);
      l.style.setProperty('--len', len);
      arrows.push({ el: l, len: len });
      return l;
    }
    arrow(96, ENC_X - 2, 140);        // 输入 -> 编码器
    arrow(ENC_X + EW + 2, DEC_X - 2, 140); // 编码器 -> 解码器
    arrow(DEC_X + EW + 2, 418, 140);  // 解码器 -> 线性
    arrow(524, 564, 140);             // 线性 -> 输出

    // 回环箭头（自回归）
    var loop = mk('path', {
      d: 'M611 172 L611 226 L61 226 L61 172',
      fill: 'none', class: 'an-loop', 'marker-end': 'url(#flA)'
    });
    svg.appendChild(loop);
    var llen = loop.getTotalLength();
    loop.style.setProperty('--len', llen);
    loop.classList.add('an-draw');
    arrows.push({ el: loop, len: llen });
    var lt = mk('text', { x: 336, y: 246, class: 'an-lbl', 'text-anchor': 'middle' });
    lt.textContent = '把输出接到输入末尾，再跑一遍';
    svg.appendChild(lt); labels.push(lt);

    host.appendChild(svg);
    built = true;
  }

  window.ANIMS.flow = {
    title: '数据怎么穿过整个架构',
    count: 7,
    captions: caps,
    render: function (i, host) {
      build(host);

      function lit(o, on) { o.r.classList.toggle('hot', on); }
      Object.keys(boxes).forEach(function (k) { lit(boxes[k], false); });

      encs.forEach(function (n, idx) { n.classList.remove('hot'); });
      decs.forEach(function (n, idx) { n.classList.remove('hot'); });

      // 各步点亮
      if (i >= 1) lit(boxes.in, true);
      if (i === 2) { encs[0].classList.add('hot'); encs[1].classList.add('hot'); }
      if (i >= 3) { encs.forEach(function (n) { n.classList.add('hot'); }); }
      if (i >= 4) { decs.forEach(function (n) { n.classList.add('hot'); }); }
      if (i >= 5) lit(boxes.lin, true);
      if (i >= 6) lit(boxes.out, true);

      var gates = [2, 4, 5, 6, 6];
      arrows.forEach(function (o, n) {
        var on = i >= gates[n];
        o.el.classList.toggle('on', on);
        o.el.style.transitionDelay = on ? (n * 0.06) + 's' : '0s';
      });
      labels.forEach(function (l) { l.style.opacity = i >= 6 ? 1 : 0; });
    }
  };

  if (window.Anim) Anim.boot();
})();
