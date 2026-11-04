/* 0.5 注意力：一个词向其他所有词直接连线 */
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
  var BAR_Y = 208, BAR_H = 30;

  function cx(i) { return X0 + i * (W + GAP) + W / 2; }

  var caps = [
    '先看一句话：「小猫 追 老鼠 因为 它 跑得 快」。要理解<ruby>它</ruby>，必须先知道它指的是谁——这个信息不在「它」这个字里。',
    '注意力做的是：让「它」向句中<b>每一个词</b>都发出一条询问。注意，不是挨个传递，是同时直接连过去。',
    '每条询问都得到一个分数，归一化成权重。这里「老鼠」拿到 <b>60%</b>，「小猫」25%，其余的很少。箭头粗细就是权重。',
    '然后把各词的信息按权重混起来：新表示 = 60% 的老鼠 + 25% 的小猫 + 8% 的追 + …。这一步叫加权求和，是一行矩阵乘法。',
    '关键在于：从「它」到「老鼠」只隔了<b>一步</b>，中间不管隔多少个词都一样。RNN 要走 4 步，卷积要堆 2 层以上。'
  ];

  var built = false, boxes = [], arcs = [], nums = [], segs = [], barLbl;

  function build(host) {
    if (built) return;
    var svg = mk('svg', { viewBox: '0 0 680 252', width: '100%', 'aria-label': '注意力：一个词向所有词连线并按权重混合' });
    var defs = mk('defs', {});
    defs.innerHTML = '<marker id="atA" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="4.5" markerHeight="4.5" orient="auto"><path d="M1 1L8 5L1 9" fill="none" stroke="#0F6E56" stroke-width="1.8" stroke-linecap="round"/></marker>';
    svg.appendChild(defs);

    for (var i = 0; i < WORDS.length; i++) {
      var x = X0 + i * (W + GAP);
      var r = mk('rect', { x: x, y: TOP, width: W, height: BH, rx: 8, class: 'an-cell' });
      svg.appendChild(r); boxes.push(r);
      var t = mk('text', { x: x + W / 2, y: TOP + BH / 2 + 1, class: 'an-word' });
      t.textContent = WORDS[i].l;
      svg.appendChild(t);

      var n = mk('text', { x: x + W / 2, y: TOP + BH + 24, class: 'an-wt' });
      svg.appendChild(n); nums.push(n);

      // 弧：从焦点框顶到目标框顶
      var x1 = cx(FOCUS), x2 = cx(i);
      var d;
      if (i === FOCUS) {
        d = 'M' + (x1 - 8) + ' ' + (TOP - 2) + ' A 8 8 0 0 1 ' + (x1 + 8) + ' ' + (TOP - 2);
      } else {
        var lift = 100 + WORDS[i].w * 1.2;
        d = 'M' + x1 + ' ' + (TOP - 2) + ' Q' + ((x1 + x2) / 2) + ' ' + (TOP - 2 - lift) + ' ' + x2 + ' ' + (TOP - 2);
      }
      var a = mk('path', { d: d, fill: 'none', class: 'an-arc' });
      svg.appendChild(a); arcs.push(a);
    }

    barLbl = mk('text', { x: X0, y: BAR_Y - 10, class: 'an-lbl' });
    barLbl.textContent = '加权求和后的新表示';
    svg.appendChild(barLbl);

    var bx = X0;
    for (var k = 0; k < WORDS.length; k++) {
      var wpx = WORDS[k].w / 100 * (W * 5 + GAP * 4);
      var sr = mk('rect', { x: bx, y: BAR_Y, width: Math.max(wpx, 1), height: BAR_H, rx: 3, class: 'an-seg' });
      sr.style.opacity = String(0.9 - k * 0.13);
      svg.appendChild(sr); segs.push(sr);
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
      for (var k = 0; k < WORDS.length; k++) {
        boxes[k].classList.toggle('hot', k === FOCUS);
        boxes[k].classList.toggle('lit', i >= 2 && k !== FOCUS);
        arcs[k].classList.toggle('on', i >= 1);
        arcs[k].style.strokeWidth = (i >= 2 ? 0.8 + WORDS[k].w * 0.075 : 1) + 'px';
        arcs[k].style.opacity = i >= 1 ? (i >= 2 ? String(0.35 + WORDS[k].w / 100 * 1.3) : '0.5') : '0';
        nums[k].textContent = i >= 2 ? WORDS[k].w + '%' : '';
        nums[k].classList.toggle('on', i >= 2 && WORDS[k].w > 20);
        segs[k].style.opacity = i >= 3 ? String(0.9 - k * 0.13) : '0';
      }
      barLbl.style.opacity = i >= 3 ? 1 : 0;
    }
  };

  if (window.Anim) Anim.boot();
})();
