/* ===== 跨设备同步码 =====
   为什么不用云服务：站点部署在 GitHub Pages，浏览器跨域预检被云端拒绝，
   只能用「离线搬运」的方式在设备间同步。
   编码规则：每题 1 个字符（'.' 未答 / 0-3 选错 / a-d 选对），
   外加每页 1 个字符的学习标记，整码约 200 字符，可完整复制。
*/
(function () {
  'use strict';
  const QKEY = 'tfc-quiz-v2', DKEY = 'tfc-done';
  const ORDER = window.QUIZ_ORDER || {};
  const META = window.QUIZ_META || {};
  const PAGES = Object.keys(ORDER);

  const flatIds = () => {
    const out = [];
    PAGES.forEach(p => ORDER[p].forEach(s => out.push(p + ':' + s)));
    return out;
  };

  const readStore = () => {
    try {
      const o = JSON.parse(localStorage.getItem(QKEY) || '{}');
      return { v: 2, items: o.items || {} };
    } catch (e) { return { v: 2, items: {} }; }
  };
  const readDone = () => {
    try { const a = JSON.parse(localStorage.getItem(DKEY) || '[]'); return Array.isArray(a) ? a : []; }
    catch (e) { return []; }
  };

  /* ---------- 生成 ---------- */
  function encode() {
    const store = readStore(), items = store.items, ids = flatIds();
    let s = '';
    ids.forEach(id => {
      const r = items[id];
      if (!r || typeof r.pick !== 'number' || r.pick < 0) { s += '.'; return; }
      const p = Math.min(3, Math.max(0, r.pick | 0));
      s += r.ok ? 'abcd'[p] : String(p);
    });
    const done = readDone();
    const d = PAGES.map(p => done.indexOf(p) >= 0 ? '1' : '0').join('');
    return 'TFC1.' + ids.length + '.' + s + '.' + d;
  }

  /* ---------- 解析 ---------- */
  function parse(code) {
    const c = String(code || '').trim().replace(/\s+/g, '');
    const m = /^TFC1\.(\d+)\.([.0-3a-d]+)\.([01]*)$/.exec(c);
    if (!m) throw new Error('这不像是同步码。应该是 TFC1. 开头的一长串字符。');
    const n = parseInt(m[1], 10), quiz = m[2], doneStr = m[3] || '';
    const ids = flatIds();
    if (n !== ids.length) {
      throw new Error('题目数量不符：这个码是 ' + n + ' 题的版本，当前课程是 ' + ids.length + ' 题。可能是课程更新过了，请重新生成。');
    }
    if (quiz.length !== ids.length) throw new Error('同步码长度异常，可能复制时漏了字符。');
    return { ids, quiz, doneStr };
  }

  /* ---------- 应用 ---------- */
  function apply(code, mode) {
    const { ids, quiz, doneStr } = parse(code);
    const store = readStore();
    let added = 0, kept = 0, skipped = 0;
    ids.forEach((id, i) => {
      const ch = quiz[i];
      if (ch === '.') { skipped++; return; }
      const isOk = ch >= 'a' && ch <= 'd';
      const pick = isOk ? 'abcd'.indexOf(ch) : parseInt(ch, 10);
      if (mode !== 'over' && store.items[id]) { kept++; return; }
      const m = META[id] || {}, old = store.items[id] || {};
      store.items[id] = {
        p: id.split(':')[0],
        q: m.q || old.q || '',
        o: old.o || [],
        k: (m.k != null ? m.k : old.k),
        pick: pick,
        ok: isOk,
        e: m.e || old.e || '',
        ts: old.ts || Date.now()
      };
      added++;
    });
    try { localStorage.setItem(QKEY, JSON.stringify(store)); } catch (e) {}

    const done = readDone();
    let doneAdded = 0;
    PAGES.forEach((p, i) => {
      if (doneStr[i] === '1' && done.indexOf(p) < 0) { done.push(p); doneAdded++; }
    });
    try { localStorage.setItem(DKEY, JSON.stringify(done)); } catch (e) {}

    return { added, kept, skipped, doneAdded, total: ids.length };
  }

  /* ---------- UI ---------- */
  function mount() {
    const genBtn = document.getElementById('syncGenBtn');
    const impBtn = document.getElementById('syncImportBtn');
    if (!genBtn || !impBtn) return;
    const outWrap = document.getElementById('syncOut');
    const outBox = document.getElementById('syncCode');
    const inWrap = document.getElementById('syncIn');
    const inBox = document.getElementById('syncInput');
    const tip = document.getElementById('syncTip');
    const doMerge = document.getElementById('syncMergeBtn');
    const doOver = document.getElementById('syncOverBtn');

    const say = (t, bad) => {
      if (!tip) return;
      tip.textContent = t;
      tip.style.color = bad ? '#C4482F' : 'var(--green)';
    };

    genBtn.onclick = () => {
      outWrap.classList.remove('hide');
      inWrap.classList.add('hide');
      outBox.value = encode();
      outBox.focus();
      outBox.select();
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(outBox.value).then(
            () => say('已复制到剪贴板。到另一台设备打开本页，点「导入同步码」粘贴。'),
            () => say('已生成。请手动全选复制（' + outBox.value.length + ' 字符）。')
          );
        } else {
          say('已生成。请手动全选复制（' + outBox.value.length + ' 字符）。');
        }
      } catch (e) {
        say('已生成。请手动复制。');
      }
    };

    impBtn.onclick = () => {
      inWrap.classList.remove('hide');
      outWrap.classList.add('hide');
      inBox.value = '';
      inBox.focus();
      say('');
    };

    const run = (mode) => {
      try {
        const r = apply(inBox.value, mode);
        say(mode === 'over'
          ? '已用同步码覆盖：更新 ' + r.added + ' 题，学习标记 ' + r.doneAdded + ' 页。正在刷新…'
          : '已合并：新增 ' + r.added + ' 题，本地已有 ' + r.kept + ' 题保持不变。正在刷新…');
        setTimeout(() => location.reload(), 900);
      } catch (e) {
        say(e.message, true);
      }
    };
    if (doMerge) doMerge.onclick = () => run('merge');
    if (doOver) doOver.onclick = () => run('over');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();

  window.CourseSync = { encode, parse, apply };
})();
