/* p13 位置编码：四对频率的正弦波叠成每个位置的指纹 */
(function () {
  function mk(t, a) {
    var e = document.createElementNS('http://www.w3.org/2000/svg', t);
    for (var k in a) e.setAttribute(k, a[k]);
    return e;
  }
  var COLS = 16, ROWS = 8, CW = 34, RH = 18, X0 = 74, Y0 = 88;
  // 从 512 维里抽 4 对展示，频率依次减半（真实模型里是连续变化的）
  var FREQ = [1, 0.5, 0.25, 0.125];

  function pe(pos, dim) {
    var k = Math.floor(dim / 2);
    var f = FREQ[k];
    return dim % 2 === 0 ? Math.sin(pos * f) : Math.cos(pos * f);
  }

  function tier(v) {
    var a = Math.abs(v);
    if (a < 0.14) return 0;
    if (a < 0.38) return 1;
    if (a < 0.62) return 2;
    if (a < 0.85) return 3;
    return 4;
  }

  var caps = [
    '注意力本身对顺序无感：把「猫追狗」的词打乱，自注意力的输出只是跟着换位置，内容完全一样。所以位置信息必须<b>加进向量里</b>。',
    '办法是：在向量的不同维度上放不同频率的正弦波。这一行频率最高，16 个位置上振荡了两个半周期。',
    '下一对频率减半，波长翻倍。越往下的行，变化越慢。',
    '四对叠在一起。注意看：<b>没有两列的颜色组合是一样的</b>，每个位置都被这串数唯一地标记了。',
    '完整的 8 行（实际是 512 个维度）。每一列就是一个位置的「指纹」——竖着读，可以把它当成这个位置写成一串 −1 到 1 之间小数后的编号。',
    '框出位置 3 的这一列。它就是一串 −0.14、0.99、0.42… 的数，被直接<b>加</b>到词向量上。',
    '位置 10 的列，跟位置 3 明显不同。而且因为是正弦，任意两个位置的差异只取决于<b>它们相距多远</b>，与绝对位置无关——这正是相对位置信息。'
  ];

  var built = false, grid = [], colHi, rowLbl = [], lastRows = -1, lastCol = -1;

  function build(host) {
    if (built) return;
    var svg = mk('svg', { viewBox: '0 0 680 264', width: '100%', 'aria-label': '位置编码热力图' });

    var top = mk('text', { x: X0, y: Y0 - 16, class: 'an-lbl' });
    top.textContent = '位置 →'; svg.appendChild(top);
    var left = mk('text', { x: X0 - 12, y: Y0 - 16, class: 'an-lbl', 'text-anchor': 'end' });
    left.textContent = '维度'; svg.appendChild(left);

    var sub = ['₁', '₂', '₃', '₄'];
    for (var r = 0; r < ROWS; r++) {
      var lb = mk('text', { x: X0 - 10, y: Y0 + r * RH + RH / 2 + 4, class: 'an-lbl', 'text-anchor': 'end', 'font-size': 9.5 });
      lb.textContent = (r % 2 === 0 ? 'sin' : 'cos') + sub[Math.floor(r / 2)];
      svg.appendChild(lb); rowLbl.push(lb);
    }

    for (var r2 = 0; r2 < ROWS; r2++) {
      for (var c = 0; c < COLS; c++) {
        var v = pe(c, r2);
        var rect = mk('rect', {
          x: X0 + c * CW + 1, y: Y0 + r2 * RH + 1,
          width: CW - 2, height: RH - 2, rx: 2,
          class: 'an-heat ' + (v >= 0 ? 'p' : 'n') + tier(v)
        });
        svg.appendChild(rect);
        grid.push({ r: rect, row: r2, col: c, v: v });
      }
    }

    for (var c2 = 0; c2 < COLS; c2++) {
      var n = mk('text', { x: X0 + c2 * CW + CW / 2, y: Y0 + ROWS * RH + 16, class: 'an-lbl', 'font-size': 9 });
      n.textContent = c2;
      svg.appendChild(n);
    }

    colHi = mk('rect', { x: X0, y: Y0 - 3, width: CW, height: ROWS * RH + 4, rx: 4, class: 'an-colhi' });
    svg.appendChild(colHi);

    host.appendChild(svg);
    built = true;
  }

  window.ANIMS.pos = {
    title: '位置编码：每个位置一串不同的数',
    count: 7,
    captions: caps,
    render: function (i, host) {
      build(host);

      var rowsOn = i === 0 ? 0 : (i === 1 ? 2 : (i === 2 ? 4 : 8));

      if (rowsOn !== lastRows) {
        for (var n = 0; n < grid.length; n++) {
          var g = grid[n];
          g.r.style.transitionDelay = ((g.row % 2) * 0.05) + 's';
          g.r.style.opacity = g.row < rowsOn ? 1 : 0.16;
        }
        for (var m = 0; m < rowLbl.length; m++) {
          rowLbl[m].style.opacity = m < rowsOn ? 0.9 : 0.28;
        }
        lastRows = rowsOn;
      }

      var col = i === 5 ? 3 : (i === 6 ? 10 : -1);
      if (col !== lastCol) {
        colHi.style.opacity = col < 0 ? 0 : 1;
        if (col >= 0) colHi.setAttribute('x', X0 + col * CW);
        lastCol = col;
      }
    }
  };

  if (window.Anim) Anim.boot();
})();
