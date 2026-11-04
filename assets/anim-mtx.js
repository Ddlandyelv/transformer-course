/* p01 矩阵乘法：一行乘一列，逐个乘积点亮再相加 */
(function () {
  function mk(t, a) {
    var e = document.createElementNS('http://www.w3.org/2000/svg', t);
    for (var k in a) e.setAttribute(k, a[k]);
    return e;
  }
  var A = [[1, 2, 3], [4, 5, 6], [7, 8, 9]];
  var B = [[2, 1, 0], [1, 3, 1], [0, 1, 2]];
  var C = [[4, 10, 8], [13, 25, 17], [22, 40, 26]];

  var CS = 46, CG = 3, Y0 = 78;
  var AX = 44, BX = 252, CX = 472;

  var caps = [
    '左边 <b>A</b> 的每一行是一个词（或一个位置）的向量，中间 <b>B</b> 的每一列是一种「加工方式」。相乘的结果 <b>C</b> 里，每个格子只由一行和一列决定。',
    '先算 C 的第一格：取 A 的第 1 行、B 的第 1 列，按位置配成三对。',
    '第一对：<b>1 × 2 = 2</b>。对应位置的数相乘。',
    '第二对：<b>2 × 1 = 2</b>。',
    '第三对：<b>3 × 0 = 0</b>。',
    '三个乘积相加：2 + 2 + 0 = <b>4</b>，填进 C 左上角。整个矩阵乘法，就是把「取一行、取一列、乘、加」重复 9 次。',
    '九格填满。注意参数量：A 是 3×3，B 是 3×3，但真正被学的只有 B 的 9 个数——A 只是流过。Transformer 里那句「512 → 2048」，说的就是 B 的列数。'
  ];

  var built = false, ac = [], bc = [], cc = [], expr;

  function cell(grid, gi, r, c, x0) {
    var x = x0 + c * (CS + CG), y = Y0 + r * (CS + CG);
    var rect = mk('rect', { x: x, y: y, width: CS, height: CS, rx: 5, class: 'an-cell' });
    grid.appendChild(rect);
    var t = mk('text', { x: x + CS / 2, y: y + CS / 2 + 1, class: 'an-mtx an-pop' });
    grid.appendChild(t);
    return { r: rect, t: t };
  }

  function build(host) {
    if (built) return;
    var svg = mk('svg', { viewBox: '0 0 680 300', width: '100%', 'aria-label': '矩阵乘法：一行乘一列' });

    ['A（输入）', 'B（权重）', 'C（输出）'].forEach(function (lab, n) {
      var x = [AX, BX, CX][n];
      var t = mk('text', { x: x, y: Y0 - 12, class: 'an-lbl' });
      t.textContent = lab; svg.appendChild(t);
    });

    for (var r = 0; r < 3; r++) for (var c = 0; c < 3; c++) {
      var a = cell(svg, null, r, c, AX); a.t.textContent = A[r][c]; a.t.classList.add('on'); ac.push(a);
      var b = cell(svg, null, r, c, BX); b.t.textContent = B[r][c]; b.t.classList.add('on'); bc.push(b);
      var o = cell(svg, null, r, c, CX); o.t.textContent = ''; cc.push(o);
    }

    var opx = mk('text', { x: (AX + 147 + BX) / 2, y: Y0 + 1.5 * (CS + CG) + 4, class: 'an-op' });
    opx.textContent = '×'; svg.appendChild(opx);
    var eq = mk('text', { x: (BX + 147 + CX) / 2, y: Y0 + 1.5 * (CS + CG) + 4, class: 'an-op' });
    eq.textContent = '='; svg.appendChild(eq);

    expr = mk('text', { x: 340, y: 254, class: 'an-expr an-rise on', 'text-anchor': 'middle' });
    svg.appendChild(expr);

    host.appendChild(svg);
    built = true;
  }

  window.ANIMS.mtx = {
    title: '一行乘一列：矩阵乘法的最小单位',
    count: 7,
    captions: caps,
    render: function (i, host) {
      build(host);
      // i: 0 布局 / 1 取行取列 / 2-4 三对乘积 / 5 求和 / 6 全填
      var pair = i - 2;   // 0,1,2 对应三对

      function setHot(arr, idx, on) {
        arr[idx].r.classList.toggle('hot', on);
        arr[idx].t.classList.toggle('hot', on);
      }

      for (var r = 0; r < 3; r++) for (var c = 0; c < 3; c++) {
        var idx = r * 3 + c;

        // A：整行 / 单格
        var aOn = false;
        if (i === 1) aOn = (r === 0);
        else if (i >= 2 && i <= 4) aOn = (r === 0 && c === pair);
        else if (i >= 5) aOn = (r === 0);
        setHot(ac, idx, aOn);
        ac[idx].r.classList.toggle('dim', !aOn && r === 0 && i >= 1);

        // B：整列 / 单格
        var bOn = false;
        if (i === 1) bOn = (c === 0);
        else if (i >= 2 && i <= 4) bOn = (c === 0 && r === pair);
        else if (i >= 5) bOn = (c === 0);
        setHot(bc, idx, bOn);
        bc[idx].r.classList.toggle('dim', !bOn && c === 0 && i >= 1);

        // C
        var filled = (idx === 0) ? (i >= 5) : (i >= 6);
        cc[idx].t.textContent = filled ? C[r][c] : '';
        // 只有 C 自己的格子弹出，A/B 的输入数字保持静止
        cc[idx].t.classList.toggle('on', filled);
        cc[idx].r.classList.toggle('done', filled);
        cc[idx].r.classList.toggle('hot', idx === 0 && i === 5);
        cc[idx].t.style.transitionDelay = (filled ? (idx % 3) * 0.05 : 0) + 's';
      }

      var parts = [1 * 2, 2 * 1, 3 * 0];
      if (i === 0) expr.textContent = 'C 的每一格 = A 的一行 · B 的一列';
      else if (i === 1) expr.textContent = 'A 的第 1 行 · B 的第 1 列 → 三对数字';
      else if (i >= 2 && i <= 4) expr.textContent = parts.slice(0, i - 1).join('  +  ');
      else if (i === 5) expr.textContent = '2 + 2 + 0  =  4';
      else expr.textContent = '9 格全部填满';
    }
  };

  if (window.Anim) Anim.boot();
})();
