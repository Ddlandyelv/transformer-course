/* p12 嵌入：查表——按 id 取出一行数字 */
(function () {
  function mk(t, a) {
    var e = document.createElementNS('http://www.w3.org/2000/svg', t);
    for (var k in a) e.setAttribute(k, a[k]);
    return e;
  }
  var WORDS = ['猫', '狗', '跑', '快', '因为', '它'];
  var ROWS = 6, COLS = 6, CW = 34, CH = 28;
  var MX = 168, MY = 82;
  var PICK = 0; // 猫

  function tier(v) {
    var a = Math.abs(v);
    if (a < 0.15) return 0;
    if (a < 0.4) return 1;
    if (a < 0.68) return 2;
    return 3;
  }

  function val(r, c) {
    var v = Math.sin(r * 3.7 + c * 1.9) * 0.92;
    return Math.round(v * 100) / 100;
  }

  var caps = [
    '嵌入层不是算法，就是<b>一张表</b>：37000 行（词表大小）× 512 列。这里的 6 × 8 只是示意。',
    '第一步是查 id：词表给每个词一个编号，「猫」是 0 号。这跟词典里的页码是一个意思。',
    '按编号取出对应的那一行。整张表里只有这一行被读到，其余 36999 行这一步完全不动。',
    '取出来的这 512 个数，就是「猫」在模型里的全部表示。它一开始是随机的，训练中被梯度一点点改。',
    '再乘 √d = √512 ≈ <b>22.6</b>。为什么？因为后面要加位置编码，而位置编码的数值在 ±1 附近。先把词向量放大，位置信息才不会被淹没。',
    '加完位置编码，这个向量才真正进入第一层。注意整张表是<b>可学习参数</b>——它和注意力里的 W 一样，是被训练出来的。'
  ];

  var built = false, rowHi, cells = [], pickVec, pickTxt, pickLbl, scaleLbl, pickCells = [];

  function build(host) {
    if (built) return;
    var svg = mk('svg', { viewBox: '0 0 680 258', width: '100%', 'aria-label': '嵌入层查表过程' });

    var lt = mk('text', { x: 36, y: MY - 16, class: 'an-lbl' });
    lt.textContent = '词表'; svg.appendChild(lt);
    var mt = mk('text', { x: MX, y: MY - 16, class: 'an-lbl' });
    mt.textContent = '嵌入矩阵 37000 × 512'; svg.appendChild(mt);

    // 行高亮
    rowHi = mk('rect', { x: MX - 5, y: MY - 3, width: COLS * CW + 10, height: CH + 6, rx: 6, class: 'an-rowhi an-sweep' });
    svg.appendChild(rowHi);

    for (var r = 0; r < ROWS; r++) {
      var wl = mk('text', { x: 36, y: MY + r * CH + CH / 2 + 4, class: 'an-wtxt' });
      wl.textContent = WORDS[r] + '　' + r;
      svg.appendChild(wl);

      for (var c = 0; c < COLS; c++) {
        var x = MX + c * CW, y = MY + r * CH;
        var rc = mk('rect', { x: x + 1, y: y + 1, width: CW - 2, height: CH - 2, rx: 3, class: 'an-cell' });
        svg.appendChild(rc);
        var tv = mk('text', { x: x + CW / 2, y: y + CH / 2 + 3.5, class: 'an-mtx', 'font-size': 10 });
        tv.textContent = val(r, c).toFixed(1);
        svg.appendChild(tv);
        cells.push({ r: rc, t: tv, ri: r });
      }
    }

    // 右侧取出的向量
    pickLbl = mk('text', { x: 430, y: MY - 16, class: 'an-lbl' });
    pickLbl.textContent = '取出的那一行';
    svg.appendChild(pickLbl);

    pickVec = mk('rect', { x: 430, y: MY - 3, width: 186, height: CH + 6, rx: 6, class: 'an-pick' });
    svg.appendChild(pickVec);

    var cw = 186 / COLS;
    for (var k = 0; k < COLS; k++) {
      var vv = val(PICK, k);
      var cr = mk('rect', {
        x: 430 + k * cw + 1.5, y: MY, width: cw - 3, height: CH, rx: 3,
        class: 'an-heat ' + (vv >= 0 ? 'p' : 'n') + tier(vv)
      });
      svg.appendChild(cr); pickCells.push(cr);
    }

    scaleLbl = mk('text', { x: 430, y: MY + 72, class: 'an-step' });
    scaleLbl.textContent = '';
    svg.appendChild(scaleLbl);

    pickTxt = mk('text', { x: 430, y: MY + 100, class: 'an-step' });
    pickTxt.textContent = '';
    svg.appendChild(pickTxt);

    host.appendChild(svg);
    built = true;
  }

  window.ANIMS.embed = {
    title: '嵌入层：查一次表',
    count: 6,
    captions: caps,
    render: function (i, host) {
      build(host);

      rowHi.style.opacity = i >= 2 ? 1 : 0;
      rowHi.classList.toggle('on', i >= 2);
      pickVec.style.opacity = i >= 3 ? 1 : 0;
      pickLbl.style.opacity = i >= 3 ? 1 : 0;

      cells.forEach(function (c) {
        var on = (c.ri === PICK && i >= 2);
        c.r.classList.toggle('hot', on);
        c.t.classList.toggle('hot', on);
        c.r.style.opacity = (i >= 3 && c.ri !== PICK) ? 0.3 : 1;
        c.t.style.opacity = (i >= 3 && c.ri !== PICK) ? 0.3 : 1;
      });

      pickCells.forEach(function (cr, n) {
        cr.style.transitionDelay = i >= 3 ? (n * 0.05) + 's' : '0s';
        cr.style.opacity = i >= 3 ? 1 : 0;
        cr.style.transform = (i >= 3 ? 'scale(1)' : 'scale(.7)');
      });

      scaleLbl.textContent = i >= 4 ? '每格数值 × 22.6　例：0.9 → 20.1' : '6 个色块代表 512 个数';
      pickTxt.textContent = i >= 5 ? '再加位置编码 → 进入第 1 层' : '';
      pickTxt.style.opacity = i >= 5 ? 1 : 0;
    }
  };

  if (window.Anim) Anim.boot();
})();
