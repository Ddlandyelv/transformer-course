/* 轻量 LaTeX 子集渲染器：本论文只用到 18 个命令，不必引入 KaTeX */
(function () {
  var SYM = {
    cdot: '·', times: '×', in: '∈', notin: '∉', infty: '∞', pi: 'π',
    alpha: 'α', beta: 'β', epsilon: 'ε', lambda: 'λ', mu: 'μ', sigma: 'σ',
    le: '≤', leq: '≤', ge: '≥', geq: '≥', approx: '≈', sim: '∼',
    to: '→', rightarrow: '→', pm: '±', neq: '≠', ne: '≠',
    sum: '∑', prod: '∏', int: '∫', partial: '∂', nabla: '∇',
    ldots: '…', dots: '…', cdots: '⋯', quad: ' ', qquad: '  ',
    log: 'log', ln: 'ln', exp: 'exp', sin: 'sin', cos: 'cos',
    max: 'max', min: 'min', softmax: 'softmax', argmax: 'argmax',
    ' ': ' ', ',': ' ', ';': ' ', ':': ' ', '!': ''
  };
  var FUNC = { log: 1, ln: 1, exp: 1, sin: 1, cos: 1, max: 1, min: 1 };

  function esc(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // 读一个参数：{...} 或单个 token
  function arg(s, i) {
    while (s[i] === ' ') i++;
    if (s[i] === '{') {
      var d = 0, st = i + 1;
      for (var k = i; k < s.length; k++) {
        if (s[k] === '{') d++;
        else if (s[k] === '}') { d--; if (d === 0) return { body: s.slice(st, k), rest: k + 1 }; }
      }
      return { body: s.slice(st), rest: s.length };
    }
    if (s[i] === '\\') {
      var m = /^\\[a-zA-Z]+/.exec(s.slice(i));
      if (m) return { body: m[0], rest: i + m[0].length };
    }
    return { body: s[i] || '', rest: i + 1 };
  }

  function conv(s) {
    var out = '', i = 0;
    while (i < s.length) {
      var c = s[i];
      if (c === '\\') {
        var m = /^\\([a-zA-Z]+)/.exec(s.slice(i));
        if (m) {
          var name = m[1];
          i += m[0].length;
          if (name === 'frac' || name === 'dfrac' || name === 'tfrac') {
            var a = arg(s, i); i = a.rest;
            var b = arg(s, i); i = b.rest;
            out += '<span class="tx-frac"><span class="tx-num">' + conv(a.body) +
                   '</span><span class="tx-den">' + conv(b.body) + '</span></span>';
            continue;
          }
          if (name === 'sqrt') {
            var r = arg(s, i); i = r.rest;
            out += '<span class="tx-sqrt"><span class="tx-rad">√</span>' +
                   '<span class="tx-ov">' + conv(r.body) + '</span></span>';
            continue;
          }
          if (/^(mathrm|text|mathbf|mathbb|mathit|operatorname|textbf)$/.test(name)) {
            var g = arg(s, i); i = g.rest;
            var cls = {mathbf: 'tx-bf', mathbb: 'tx-bb', textbf: 'tx-bf', mathit: 'tx-it'}[name] || 'tx-rm';
            out += '<span class="' + cls + '">' + conv(g.body) + '</span>';
            continue;
          }
          if (name === 'left' || name === 'right') {
            if (s[i] === '.') { i++; continue; }
            if (s[i] === '\\') { var dm = /^\\[a-zA-Z]+/.exec(s.slice(i)); if (dm) { i += dm[0].length; continue; } }
            out += esc(s[i] || ''); i++;
            continue;
          }
          if (name === 'displaystyle' || name === 'textstyle') continue;
          if (name === 'begin' || name === 'end') {
            var e = arg(s, i); i = e.rest;
            continue;
          }
          if (FUNC[name]) { out += '<span class="tx-fn">' + SYM[name] + '</span>'; continue; }
          out += SYM[name] !== undefined ? SYM[name] : '';
          continue;
        }
        // \{ \} \% \_ 等
        var nxt = s[i + 1];
        i += 2;
        out += esc(nxt === '\\' ? '' : (nxt === '_' ? '_' : nxt));
        continue;
      }

      if (c === '^' || c === '_') {
        i++;
        var sub = arg(s, i); i = sub.rest;
        var inner = conv(sub.body);
        out += c === '^' ? '<sup>' + inner + '</sup>' : '<sub>' + inner + '</sub>';
        continue;
      }

      if (c === '{') {           // 裸分组
        var gg = arg(s, i); i = gg.rest;
        out += conv(gg.body);
        continue;
      }
      if (c === '}') { i++; continue; }

      if (c === '*') { out += '·'; i++; continue; }
      if (c === '~') { out += ' '; i++; continue; }

      out += esc(c);
      i++;
    }
    return out;
  }

  // 只转义裸露的尖括号与 &，保留自己写的少量排版标签
  var OK_TAG = /^<\/?(b|code|i|em|strong|span|br|sub|sup|small)\b/i;
  function softEsc(t) {
    var out = '', i = 0;
    while (i < t.length) {
      var c = t[i];
      if (c === '&') {
        if (/^&(amp|lt|gt|quot|#\d+|nbsp);/.test(t.slice(i))) { out += '&'; i++; continue; }
        out += '&amp;'; i++; continue;
      }
      if (c === '<') {
        if (OK_TAG.test(t.slice(i))) { out += '<'; i++; continue; }
        out += '&lt;'; i++; continue;
      }
      out += c; i++;
    }
    return out;
  }

  // 文字里的 $...$ 内联公式
  function inline(text) {
    return softEsc(String(text)).replace(/\$([^$]+)\$/g, function (_, tex) {
      return '<span class="tx">' + conv(tex) + '</span>';
    });
  }

  function block(tex) {
    return '<span class="tx tx-block">' + conv(tex.replace(/\\displaystyle/g, '')) + '</span>';
  }

  window.Tex = { conv: conv, inline: inline, block: block, esc: esc, softEsc: softEsc };
})();
