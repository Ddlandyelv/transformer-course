/* ===== 云端同步（WorkBuddy 账号登录） =====
   只能在同源域名下工作（transformer-reading.app.workbuddy.host）。
   GitHub Pages 版本跨域会被拦截，自动降级为「仅同步码」。
   数据表 course_state：一用户一行，state 为 {v, items, done} 的 JSONB。
*/
(function () {
  'use strict';
  const CFG = {
    endpoint: 'https://transformer-reading.app.workbuddy.host',
    oauthRelayBaseUrl: 'https://www.workbuddy.cn/v2/as/genie-baas/oauth',
    publishableKey: 'wbpk_5n4T678LT0ELMaUDF2yzYW_KwYMnDx600N0YfbJqqk1SScX6ysZoOip'
  };
  const TABLE = 'course_state';
  const QKEY = 'tfc-quiz-v2', DKEY = 'tfc-done', DIRTY = 'tfc-dirty';
  const SAME_ORIGIN = location.origin === new URL(CFG.endpoint).origin;
  const SDK_URL = 'https://cdn.jsdelivr.net/npm/@tencent-ai/workbuddy-cloud-sdk@dev/lib/index.global.js';

  let cloud = null, session = null, sdkPromise = null, syncing = false;
  let lastSync = 0, lastError = '';

  const listeners = [];
  const emit = () => listeners.forEach(f => { try { f(); } catch (e) {} });

  /* ---------- 本地读写 ---------- */
  const readLocal = () => {
    let items = {}, done = [];
    try { items = (JSON.parse(localStorage.getItem(QKEY) || '{}').items) || {}; } catch (e) {}
    try { done = JSON.parse(localStorage.getItem(DKEY) || '[]') || []; } catch (e) {}
    return { v: 2, items, done };
  };
  const writeLocal = (st) => {
    try { localStorage.setItem(QKEY, JSON.stringify({ v: 2, items: st.items || {} })); } catch (e) {}
    try { localStorage.setItem(DKEY, JSON.stringify(st.done || [])); } catch (e) {}
  };
  const isDirty = () => localStorage.getItem(DIRTY) === '1';
  const setDirty = (v) => { try { v ? localStorage.setItem(DIRTY, '1') : localStorage.removeItem(DIRTY); } catch (e) {} };

  /* ---------- 合并：同题取 ts 新的，学习标记取并集 ---------- */
  function merge(local, remote) {
    const out = { v: 2, items: {}, done: [] };
    const li = local.items || {}, ri = remote.items || {};
    const keys = Object.keys(li).concat(Object.keys(ri));
    const seen = new Set();
    keys.forEach(k => {
      if (seen.has(k)) return;
      seen.add(k);
      const a = li[k], b = ri[k];
      if (!a) { out.items[k] = b; return; }
      if (!b) { out.items[k] = a; return; }
      out.items[k] = (a.ts || 0) >= (b.ts || 0) ? a : b;
    });
    out.done = Array.from(new Set((local.done || []).concat(remote.done || [])));
    return out;
  }

  /* ---------- SDK ---------- */
  function loadSDK() {
    if (window.WorkBuddyCloud) return Promise.resolve();
    if (sdkPromise) return sdkPromise;
    sdkPromise = new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = SDK_URL;
      s.async = true;
      s.onload = () => window.WorkBuddyCloud ? res() : rej(new Error('SDK 未挂载'));
      s.onerror = () => rej(new Error('SDK 加载失败，检查网络'));
      document.head.appendChild(s);
    });
    return sdkPromise;
  }

  async function ensureCloud() {
    if (cloud) return cloud;
    await loadSDK();
    cloud = window.WorkBuddyCloud.createWorkBuddyCloud({
      endpoint: CFG.endpoint,
      oauthRelayBaseUrl: CFG.oauthRelayBaseUrl,
      publishableKey: CFG.publishableKey
    });
    return cloud;
  }

  /* ---------- 登录回调（必须在任何守卫之前） ---------- */
  function cleanUrl() {
    const u = new URL(location.href);
    ['code', 'state', 'provider', 'error'].forEach(k => u.searchParams.delete(k));
    history.replaceState(null, '', u.pathname + u.search + u.hash);
  }

  async function handleCallback() {
    const u = new URL(location.href);
    if (!u.searchParams.has('code') && !u.searchParams.has('error')) return false;
    const provider = u.searchParams.get('provider');
    if (provider && provider !== 'workbuddy') { cleanUrl(); return false; }
    try {
      await ensureCloud();
      const fn = cloud.auth.handleWorkBuddyCallback;
      if (typeof fn !== 'function') { lastError = '当前 SDK 不支持该登录方式'; cleanUrl(); return false; }
      const r = await fn.call(cloud.auth);
      cleanUrl();
      if (r && r.error) { lastError = r.error.message || '登录失败'; return false; }
      const ret = u.searchParams.get('ret');
      if (ret && ret !== 'index.html' && ret !== 'index' && r && r.data) {
        const back = new URL(location.origin + '/' + ret);
        if (back.href !== location.href) { location.replace(back.href); return true; }
      }
      return !!(r && r.data);
    } catch (e) {
      lastError = e.message || '登录失败';
      cleanUrl();
      return false;
    }
  }

  /* ---------- 会话 ---------- */
  async function refreshSession() {
    if (!SAME_ORIGIN) return null;
    try {
      await ensureCloud();
      const { data } = await cloud.auth.getSession();
      session = data || null;
    } catch (e) {
      lastError = e.message || '';
      session = null;
    }
    emit();
    return session;
  }

  /* ---------- 拉取 / 推送 ---------- */
  async function pull() {
    const { data, error } = await cloud.database.from(TABLE).select('state').maybeSingle();
    if (error) throw error;
    return (data && data.state) || { v: 2, items: {}, done: [] };
  }

  async function push(st) {
    const body = { state: st };
    const cur = await cloud.database.from(TABLE).select('id').maybeSingle();
    if (cur.error) throw cur.error;
    if (cur.data && cur.data.id != null) {
      const r = await cloud.database.from(TABLE).update(body).eq('id', cur.data.id).select('id');
      if (r.error) throw r.error;
      if (!Array.isArray(r.data) || r.data.length === 0) throw new Error('写入被拒绝（可能是权限问题）');
    } else {
      const r = await cloud.database.from(TABLE).insert(body).select('id');
      if (r.error) throw r.error;
      if (!Array.isArray(r.data) || r.data.length === 0) throw new Error('写入被拒绝（可能是权限问题）');
    }
    setDirty(false);
  }

  async function syncNow(opts) {
    if (!SAME_ORIGIN || syncing) return { ok: false, reason: !SAME_ORIGIN ? 'cross-origin' : 'busy' };
    syncing = true; lastError = '';
    try {
      await ensureCloud();
      if (!session) await refreshSession();
      if (!session) { syncing = false; return { ok: false, reason: 'no-session' }; }

      const local = readLocal();
      const remote = opts && opts.pushOnly ? { v: 2, items: {}, done: [] } : await pull();
      const merged = opts && opts.pushOnly ? local : merge(local, remote);

      writeLocal(merged);
      await push(merged);

      lastSync = Date.now();
      syncing = false;
      emit();
      return { ok: true, pulled: Object.keys(remote.items || {}).length, total: Object.keys(merged.items).length };
    } catch (e) {
      lastError = (e && (e.message || e.error_description)) || '同步失败';
      syncing = false;
      emit();
      return { ok: false, reason: 'error', message: lastError };
    }
  }

  /* ---------- 登录 / 登出 ---------- */
  async function login() {
    if (!SAME_ORIGIN) { lastError = '此版本不支持云端同步'; emit(); return; }
    try {
      await ensureCloud();
      const cur = location.pathname.split('/').pop() || 'index.html';
      const back = new URL(location.origin + '/?ret=' + encodeURIComponent(cur));
      const { data, error } = await cloud.auth.signInWithOAuth({ provider: 'workbuddy', redirectTo: back.toString() });
      if (error) { lastError = error.message || '无法发起登录'; emit(); return; }
      location.assign(data.url);
    } catch (e) {
      lastError = e.message || '无法发起登录';
      emit();
    }
  }

  async function logout() {
    try { await ensureCloud(); await cloud.auth.signOut(); } catch (e) {}
    session = null;
    emit();
  }

  /* ---------- 自动推送（答题后防抖） ---------- */
  let timer = null;
  function schedulePush() {
    setDirty(true);
    if (!SAME_ORIGIN || !session) { emit(); return; }
    clearTimeout(timer);
    timer = setTimeout(() => { syncNow({ pushOnly: true }); }, 4000);
  }

  /* ---------- 启动 ---------- */
  async function boot() {
    if (!SAME_ORIGIN) { emit(); return; }
    const wasCallback = await handleCallback();
    await refreshSession();
    if (wasCallback || session) await syncNow({});
    else emit();
  }

  document.addEventListener('quiz:answered', schedulePush);
  window.addEventListener('online', () => { if (session) schedulePush(); });

  window.CourseCloud = {
    get supported() { return SAME_ORIGIN; },
    get session() { return session; },
    get syncing() { return syncing; },
    get lastSync() { return lastSync; },
    get error() { return lastError; },
    login, logout, syncNow, refreshSession,
    onChange(f) { listeners.push(f); return () => { const i = listeners.indexOf(f); if (i >= 0) listeners.splice(i, 1); }; },
    ready: null
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.CourseCloud.ready = boot(); });
  } else {
    window.CourseCloud.ready = boot();
  }
})();
