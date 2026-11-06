/* 论文阅读器：渲染 + 模式切换 + 目录高亮 + 阅读进度 */
(function () {
  var D = window.PAPER;
  var main = document.getElementById('rdMain');
  if (!D) {
    main.innerHTML = '<div class="rd-loading">论文数据未载入（paper-data.js 缺失）</div>';
    return;
  }

  /* ---------- 工具 ---------- */
  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }
  function paras(text) {
    return String(text || '').split(/\n{2,}/)
      .map(function (s) { return s.trim(); })
      .filter(Boolean)
      .map(function (s) { return '<p>' + window.Tex.inline(s) + '</p>'; })
      .join('');
  }

  /* ---------- 头部 ---------- */
  var html = '';
  html += '<div class="rd-inner">';
  html += '<div class="rd-head">';
  html += '<div class="rd-kicker">arXiv:1706.03762v7 · NeurIPS 2017</div>';
  html += '<h1>' + window.Tex.esc(D.title) + '</h1>';
  html += '<div class="rd-authors">' + window.Tex.esc(D.authors) + '</div>';
  html += '<div class="rd-affil">' + window.Tex.esc(D.affil) + '</div>';
  html += '<div class="rd-head-meta">' +
          '<span>' + D.sections.length + ' 节</span>' +
          '<span>' + (D.words || '') + '</span>' +
          '<span>英文原文 + 中文拆解</span>' +
          '</div>';
  html += '</div>';
  html += '</div>';

  /* ---------- 正文 ---------- */
  html += '<div class="rd-inner" id="rdBody">';

  D.sections.forEach(function (sec, si) {
    html += '<section class="rd-sec" id="sec-' + sec.id + '">';
    html += '<div class="rd-sec-h">';
    if (sec.no) html += '<span class="rd-sec-no">' + sec.no + '</span>';
    html += '<h2>' + window.Tex.esc(sec.en) + '</h2>';
    if (sec.zh) html += '<span class="zh">' + window.Tex.esc(sec.zh) + '</span>';
    html += '</div>';
    if (sec.gist) html += '<div class="rd-gist">' + sec.gist + '</div>';

    // 每个 item 自成一个 pair：一段原文配一段拆解，滚到哪看到哪
    var n = 0;

    (sec.items || []).forEach(function (it) {
      if (it.eq) {
        html += '<div class="rd-eq">';
        if (it.eq.no) html += '<span class="eq-no">' + it.eq.no + '</span>';
        html += window.Tex.block(it.eq.tex);
        html += '</div>';
        if (it.eq.cap) html += '<div class="rd-eq-cap">' + window.Tex.inline(it.eq.cap) + '</div>';
        return;
      }
      if (it.fig) {
        var fg = it.fig;
        html += '<figure class="rd-fig' + (fg.wide ? ' wide' : '') + '">';
        html += '<img src="assets/figs/' + fg.src + '" alt="' +
                window.Tex.esc(fg.alt || '') + '" loading="lazy">';
        if (fg.cap) html += '<figcaption>' + window.Tex.inline(fg.cap) + '</figcaption>';
        html += '</figure>';
        return;
      }
      if (it.tbl) {
        var t = it.tbl;
        html += '<div class="rd-tbl">';
        if (t.title) html += '<div class="rd-tbl-h">' + window.Tex.esc(t.title) + '</div>';
        html += '<div class="scroll"><table>';
        html += '<thead><tr>' + t.head.map(function (h) {
          return '<th>' + window.Tex.inline(h) + '</th>';
        }).join('') + '</tr></thead><tbody>';
        t.rows.forEach(function (row, ri) {
          var hi = t.hl && t.hl.indexOf(ri) >= 0 ? ' class="hi"' : '';
          html += '<tr' + hi + '>' + row.map(function (c, ci) {
            var cls = ci === 0 ? '' : ' class="num"';
            return '<td' + cls + '>' + window.Tex.inline(String(c)) + '</td>';
          }).join('') + '</tr>';
        });
        html += '</tbody></table></div>';
        if (t.note) html += '<div class="rd-tbl-note">' + window.Tex.inline(t.note) + '</div>';
        html += '</div>';
        return;
      }
      n++;
      html += '<div class="rd-pair" data-n="' + n + '">';
      html += '<div class="rd-en">' + (it.en ? paras(it.en) : '') + '</div>';
      html += '<div class="rd-zh">' + (it.zh ? paras(it.zh) : '') + '</div>';
      html += '</div>';
    });

    html += '</section>';
  });

  html += '<div class="rd-foot">原文：Vaswani et al., <i>Attention Is All You Need</i>, NeurIPS 2017。' +
          '正文取自 <a href="https://arxiv.org/abs/1706.03762" target="_blank" rel="noopener">arXiv:1706.03762v7</a>，' +
          '拆解为本课程编写。图片未收录，需要看图请对照 <a href="https://arxiv.org/pdf/1706.03762" target="_blank" rel="noopener">PDF 原文</a>。</div>';
  html += '</div>';

  main.innerHTML = html;

  /* ---------- 目录 ---------- */
  var toc = document.getElementById('rdToc');
  D.sections.forEach(function (sec) {
    if (sec.level && sec.level >= 5) return;      // 跳过末级小标题
    var a = el('a', sec.level >= 4 ? 'lv4' : (sec.level === 3 ? 'lv3' : ''));
    a.href = '#sec-' + sec.id;
    a.innerHTML = '<span class="n">' + (sec.no || '') + '</span><span>' +
                  window.Tex.esc(sec.en) + '</span>';
    a.dataset.id = sec.id;
    toc.appendChild(a);
  });

  /* ---------- 交互 ---------- */
  var body = document.body;
  var side = document.getElementById('rdSide');
  var veil = document.getElementById('rdVeil');
  var menu = document.getElementById('rdMenu');

  function closeSide() {
    side.classList.remove('open');
    veil.classList.remove('on');
  }
  menu.addEventListener('click', function () {
    var on = side.classList.toggle('open');
    veil.classList.toggle('on', on);
  });
  veil.addEventListener('click', closeSide);
  toc.addEventListener('click', function (e) {
    if (e.target.closest('a')) closeSide();
  });

  // 模式
  var mBtns = document.querySelectorAll('[data-mode]');
  function setMode(m) {
    body.dataset.mode = m;
    mBtns.forEach(function (b) { b.classList.toggle('on', b.dataset.mode === m); });
    try { localStorage.setItem('rd-mode', m); } catch (e) {}
  }
  mBtns.forEach(function (b) {
    b.addEventListener('click', function () { setMode(b.dataset.mode); });
  });

  // 字号
  var fBtns = document.querySelectorAll('[data-fs]');
  function setFs(f) {
    body.dataset.fs = f;
    fBtns.forEach(function (b) { b.classList.toggle('on', b.dataset.fs === f); });
    try { localStorage.setItem('rd-fs', f); } catch (e) {}
  }
  fBtns.forEach(function (b) {
    b.addEventListener('click', function () { setFs(b.dataset.fs); });
  });

  try {
    var sm = localStorage.getItem('rd-mode');
    if (sm) setMode(sm);
    var sf = localStorage.getItem('rd-fs');
    if (sf) setFs(sf);
  } catch (e) {}

  // 进度与目录高亮
  var prog = document.getElementById('rdProg');
  var links = [].slice.call(toc.querySelectorAll('a'));
  var secs = [].slice.call(document.querySelectorAll('.rd-sec'));
  var ticking = false;

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var p = max > 0 ? Math.min(1, window.scrollY / max) : 0;
      prog.style.width = (p * 100).toFixed(2) + '%';

      // 当前章节：最后一个顶部越过阈值线的
      var line = 140, cur = secs[0];
      for (var i = 0; i < secs.length; i++) {
        if (secs[i].getBoundingClientRect().top <= line) cur = secs[i];
        else break;
      }
      if (cur) {
        var id = cur.id.replace('sec-', '');
        links.forEach(function (a) { a.classList.toggle('on', a.dataset.id === id); });
      }
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  // 深链接：打开时若带 #sec-xxx，滚动过去
  if (location.hash.indexOf('#sec-') === 0) {
    var t = document.querySelector(location.hash);
    if (t) setTimeout(function () { t.scrollIntoView(); }, 60);
  }
})();
