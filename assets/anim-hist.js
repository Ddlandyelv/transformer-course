/* 0.7 发展史：时间轴逐节点点亮，两次寒冬用灰色 */
(function () {
  function mk(t, a) {
    var e = document.createElementNS('http://www.w3.org/2000/svg', t);
    for (var k in a) e.setAttribute(k, a[k]);
    return e;
  }
  var NODES = [
    { y: '1943', e: '神经元模型', cold: 0 },
    { y: '1958', e: '感知机', cold: 0 },
    { y: '1969', e: '第一次寒冬', cold: 1 },
    { y: '1986', e: '反向传播', cold: 0 },
    { y: '1990s', e: '第二次寒冬', cold: 1 },
    { y: '2012', e: 'AlexNet', cold: 0 },
    { y: '2014', e: '注意力登场', cold: 0 },
    { y: '2017', e: 'Transformer', cold: 0 },
    { y: '2018+', e: '预训练时代', cold: 0 }
  ];
  var X0 = 52, STEP = 66, AX = 152;

  var caps = [
    '整条线有三次浪潮、两次寒冬。横轴不是等比例年份——真按比例，1943 到 2012 之间会挤成一点。',
    '1943：一个神经元第一次被写成数学公式。但权重还得人来定，它<b>不会学</b>。',
    '1958：感知机让权重可以自动调整，第一次浪潮开始。当时被宣传成「会思考的机器」。',
    '1969：一本 100 多页的书证明单层感知机连 XOR 都做不了，资助随之撤走。真正的缺口不是表达力，是<b>不知道怎么训练多层</b>。',
    '1986：反向传播普及，多层网络终于可训练。中间层「错在哪」有了算法回答。第二次浪潮。',
    '1990s 末：SVM 这类方法有更漂亮的数学保证，同时算力也撑不住深层网络。第二次寒冬。',
    '2012：AlexNet 把 ImageNet 错误率从 26.2% 压到 15.3%。这次不是算法突破，是数据、GPU、训练技巧同时到位。',
    '2014：注意力出现，但只是给 RNN 打的补丁——解码器每写一个词回头看一眼原文，主体仍是循环。',
    '2017：Transformer 把补丁变成主体，整个拿掉 RNN。论文标题那句话的分量就在这里。',
    '2018 之后：预训练 + 微调成为默认做法。参数规模从千万级走到千亿级，但底层零件还是这一页列的那些。'
  ];

  var built = false, dots = [], yrs = [], evs = [], prog, cursor;

  function build(host) {
    if (built) return;
    var svg = mk('svg', { viewBox: '0 0 680 202', width: '100%', 'aria-label': '神经网络发展时间轴，三次浪潮与两次寒冬' });

    svg.appendChild(mk('line', { x1: 40, y1: AX, x2: 646, y2: AX, stroke: '#E2E6E9', 'stroke-width': 2 }));
    prog = mk('line', { x1: 40, y1: AX, x2: X0, y2: AX, class: 'an-prog' });
    svg.appendChild(prog);

    // 寒冬底色段
    [2, 4].forEach(function (n) {
      var x = X0 + n * STEP;
      svg.appendChild(mk('rect', { x: x - 26, y: AX - 34, width: 52, height: 68, rx: 8, fill: '#F1F3F5' }));
    });

    for (var i = 0; i < NODES.length; i++) {
      var x = X0 + i * STEP, n = NODES[i];
      var d = mk('circle', { cx: x, cy: AX, r: 6, class: 'an-node' + (n.cold ? ' cold' : '') });
      svg.appendChild(d); dots.push(d);

      var y = mk('text', { x: x, y: AX + 28, class: 'an-yr' });
      y.textContent = n.y; svg.appendChild(y); yrs.push(y);

      var ey = i % 2 === 0 ? AX - 52 : AX - 32;
      var t = mk('text', { x: x, y: ey, class: 'an-ev', 'font-size': n.e.length > 8 ? 9.5 : 11 });
      t.textContent = n.e; svg.appendChild(t); evs.push(t);
    }

    cursor = mk('circle', { cx: X0, cy: AX, r: 13, class: 'an-cursor' });
    svg.appendChild(cursor);

    host.appendChild(svg);
    built = true;
  }

  window.ANIMS.hist = {
    title: '三次浪潮，两次寒冬',
    count: 10,
    captions: caps,
    render: function (i, host) {
      build(host);
      var cur = Math.max(0, i - 1);          // i=0 是总览，1..9 对应节点
      var active = i === 0 ? -1 : cur;
      for (var k = 0; k < NODES.length; k++) {
        var reached = i > 0 && k <= cur;
        dots[k].classList.toggle('on', reached);
        dots[k].classList.toggle('cur', k === active);
        dots[k].setAttribute('r', k === active ? 8 : 6);
        yrs[k].classList.toggle('on', reached);
        evs[k].classList.toggle('on', reached);
        evs[k].classList.toggle('cur', k === active);
      }
      prog.setAttribute('x2', i === 0 ? X0 : X0 + cur * STEP);
      cursor.setAttribute('cx', i === 0 ? X0 : X0 + cur * STEP);
      cursor.style.opacity = i === 0 ? 0 : 1;
    }
  };

  if (window.Anim) Anim.boot();
})();
