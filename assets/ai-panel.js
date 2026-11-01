/* ===== AI 问答面板（备份版专用） =====
   支持：划词提问 / 粘贴截图 / 上传图片 / 自动附带当前章节 / 流式输出 / 本地知识库兜底
*/
(function(){
  'use strict';
  if(window.__AI_PANEL__) return;
  window.__AI_PANEL__=true;

  const LS='tfc-ai-cfg';
  const CFG_DEFAULT={baseUrl:'https://api.deepseek.com/v1',model:'deepseek-chat',key:'',stream:true,includePage:true,rag:true};
  let cfg=Object.assign({},CFG_DEFAULT);
  try{Object.assign(cfg,JSON.parse(localStorage.getItem(LS)||'{}'))}catch(e){}
  const saveCfg=()=>{try{localStorage.setItem(LS,JSON.stringify(cfg))}catch(e){}};

  const ICON={
    spark:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z"/></svg>',
    close:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    gear:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.3 1.9l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.9-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.9.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.9 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1A1.7 1.7 0 004.6 9a1.7 1.7 0 00-.3-1.9l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.9.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.9-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.9V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z"/></svg>',
    trash:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></svg>',
    img:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="1.6"/><path d="M4 18l5-4 4 3 3-2 4 3"/></svg>',
    send:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 12h13M12 5l7 7-7 7"/></svg>',
    stop:'<svg viewBox="0 0 24 24" fill="currentColor"><rect x="7" y="7" width="10" height="10" rx="1.6"/></svg>',
    page:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M6 3h9l4 4v14H6z"/><path d="M15 3v5h5"/></svg>',
    kb:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 5.5A2.5 2.5 0 016.5 3H20v15H6.5A2.5 2.5 0 004 20.5z"/><path d="M8 7h8M8 10.5h5"/></svg>'
  };

  /* ---------- DOM ---------- */
  const root=document.createElement('div');
  root.id='aiRoot';
  root.innerHTML=`
    <button class="ai-fab" id="aiFab" aria-label="打开 AI 问答">${ICON.spark}<span>问 AI</span></button>
    <div class="ai-scrim" id="aiScrim"></div>
    <aside class="ai-panel" id="aiPanel" aria-hidden="true" aria-label="AI 问答面板">
      <div class="ai-head">
        <div class="ttl"><span class="dot"></span><span>问 AI</span><span class="sub" id="aiCtx">当前页面</span></div>
        <div class="sp"></div>
        <button class="ai-ico" id="aiCfgBtn" title="设置模型">${ICON.gear}</button>
        <button class="ai-ico" id="aiClearBtn" title="清空对话">${ICON.trash}</button>
        <button class="ai-ico" id="aiCloseBtn" title="关闭">${ICON.close}</button>
      </div>
      <div class="ai-msgs" id="aiMsgs"></div>
      <div class="ai-composer">
        <div class="ai-attach" id="aiAttach"></div>
        <div class="ai-inputrow">
          <textarea id="aiInput" rows="1" placeholder="划词或贴图，直接问…"></textarea>
        </div>
        <div class="ai-tools">
          <button class="ai-tool" id="aiImgBtn" title="上传截图">${ICON.img}<span>图片</span></button>
          <button class="ai-tool on" id="aiCtxBtn" title="把当前小节原文一起发给 AI">${ICON.page}<span>本页</span></button>
          <button class="ai-tool on" id="aiRagBtn" title="检索全站 18 页课程，作为回答依据">${ICON.kb}<span>知识库</span></button>
          <span class="ai-hint">Enter 发送</span>
          <button class="ai-send" id="aiSendBtn">${ICON.send}<span>发送</span></button>
        </div>
      </div>
    </aside>
    <div class="ai-sel" id="aiSel">${ICON.spark}<span>问 AI</span></div>
    <div class="ai-sheet" id="aiSheet">
      <div class="ai-card">
        <header>连接模型<button class="x" id="aiSheetX">${ICON.close}</button></header>
        <div class="body">
          <div class="ai-presets" id="aiPresets"></div>
          <div class="ai-field"><label>接口地址 Base URL</label><input id="cfgBase" placeholder="https://api.deepseek.com/v1"></div>
          <div class="ai-field"><label>模型名</label><input id="cfgModel" placeholder="deepseek-chat"></div>
          <div class="ai-field"><label>API Key</label><input id="cfgKey" type="password" placeholder="sk-…（仅存本机 localStorage，公用设备勿填）"></div>
          <p class="ai-note"><b>填了 Key：</b>大模型 + 课程知识库联合作答——每次提问先检索本站 18 页课程（最多 4 段），连同当前小节一起交给模型，回答下方标出依据页码，可点开核对。<br>
            <b>不填 Key：</b>只在课程原文里检索片段给你看，不做改写、不联网。<br>
            浏览器直连接口可能被跨域（CORS）拦截：本地 Ollama 最稳；若报 CORS 错误，可改用支持浏览器调用的中转地址。</p>
          <div class="foot">
            <button class="ai-btn ghost" id="cfgReset">恢复默认</button>
            <div class="sp"></div>
            <button class="ai-btn" id="cfgCancel">取消</button>
            <button class="ai-btn primary" id="cfgSave">保存</button>
          </div>
        </div>
      </div>
    </div>`;
  document.body.appendChild(root);

  const $=(s)=>root.querySelector(s);
  const panel=$('#aiPanel'), msgs=$('#aiMsgs'), input=$('#aiInput'),
        sendBtn=$('#aiSendBtn'), ctxBtn=$('#aiCtxBtn'), ragBtn=$('#aiRagBtn'), attachBox=$('#aiAttach'),
        scrim=$('#aiScrim'), fab=$('#aiFab'), selBtn=$('#aiSel'), sheet=$('#aiSheet');

  /* ---------- 状态 ---------- */
  let history=[];          // [{role,text,images?}]
  const HS='tfc-ai-hist';
  function saveHist(){ try{ sessionStorage.setItem(HS,JSON.stringify(history.slice(-16))); }catch(e){} }
  function restoreHist(){
    try{
      const a=JSON.parse(sessionStorage.getItem(HS)||'[]');
      if(Array.isArray(a)&&a.length){ history=a.slice(-16); return true; }
    }catch(e){}
    return false;
  }
  let attachments=[];      // [dataUrl]
  let streaming=false;
  let controller=null;
  let lastUser=null;

  /* ---------- 工具 ---------- */
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function md(src){
    let s=esc(src);
    s=s.replace(/`([^`\n]+)`/g,'<code>$1</code>');
    s=s.replace(/\*\*([^*\n]+)\*\*/g,'<strong>$1</strong>');
    const blocks=s.split(/\n{2,}/);
    return blocks.map(b=>{
      const lines=b.split('\n').filter(l=>l.trim()!=='');
      if(lines.length && lines.every(l=>/^\s*[-*·]\s+/.test(l))){
        return '<ul>'+lines.map(l=>'<li>'+l.replace(/^\s*[-*·]\s+/,'')+'</li>').join('')+'</ul>';
      }
      return '<p>'+lines.join('<br>')+'</p>';
    }).join('');
  }

  function pageInfo(){
    const doc=document.getElementById('doc');
    const title=(document.title||'').split(' · ')[0].trim();
    let cur='';
    if(doc){
      const hs=[...doc.querySelectorAll('h2')];
      for(const h of hs){ if(h.getBoundingClientRect().top<130) cur=h.textContent.replace(/^\d+\s*/,'').trim(); }
    }
    return {title,section:cur,doc};
  }

  function sectionText(limit){
    const {doc}=pageInfo();
    if(!doc) return '';
    const hs=[...doc.querySelectorAll('h2')];
    let start=hs[0], end=null;
    for(const h of hs){ if(h.getBoundingClientRect().top<130){ start=h; } }
    for(let i=0;i<hs.length;i++){ if(hs[i]===start){ end=hs[i+2]||null; break; } }
    const host=document.createElement('div');
    let node=start;
    while(node && node!==end){
      if(node!==start) host.appendChild(node.cloneNode(true));
      node=node.nextElementSibling;
    }
    host.querySelectorAll('.q,.cite,.demo,.quiz,.summary').forEach(n=>n.remove());
    let t=(host.textContent||'').replace(/\s+/g,' ').trim();
    if(t.length<120){ // 兜底：整页
      t=(doc.textContent||'').replace(/\s+/g,' ').trim();
    }
    return t.slice(0,limit||2200);
  }

  function scrollBottom(force){
    if(!force){
      const near=msgs.scrollHeight-msgs.scrollTop-msgs.clientHeight<160;
      if(!near) return;
    }
    msgs.scrollTop=msgs.scrollHeight;
  }

  /* ---------- 消息渲染 ---------- */
  function addMsg(role,text,opt){
    opt=opt||{};
    const wrap=document.createElement('div');
    wrap.className='ai-msg '+(role==='user'?'user':'bot');
    const who=document.createElement('div');
    who.className='who'; who.textContent=role==='user'?'你':'AI';
    const bub=document.createElement('div');
    bub.className='ai-bubble';
    if(opt.tag) bub.innerHTML='<span class="tag">'+esc(opt.tag)+'</span>';
    bub.innerHTML+=md(text||'');
    if(opt.images&&opt.images.length){
      const box=document.createElement('div');
      box.style.cssText='display:flex;gap:6px;flex-wrap:wrap;margin-top:8px';
      opt.images.forEach(src=>{
        const im=document.createElement('img');
        im.src=src; im.style.cssText='width:64px;height:64px;object-fit:cover;border-radius:7px;border:1px solid rgba(255,255,255,.35)';
        box.appendChild(im);
      });
      bub.appendChild(box);
    }
    wrap.appendChild(who); wrap.appendChild(bub);
    msgs.appendChild(wrap);
    scrollBottom(opt.force);
    return bub;
  }

  function addActions(bub,rawText){
    const acts=document.createElement('div');
    acts.className='acts';
    const cp=document.createElement('button');
    cp.textContent='复制';
    cp.onclick=()=>{
      navigator.clipboard&&navigator.clipboard.writeText(rawText).then(()=>{
        cp.textContent='已复制'; setTimeout(()=>cp.textContent='复制',1200);
      });
    };
    const re=document.createElement('button');
    re.textContent='重答';
    re.onclick=()=>{ if(lastUser) send(lastUser.text,lastUser.images,true); };
    acts.appendChild(cp); acts.appendChild(re);
    bub.appendChild(acts);
  }

  function addSources(bub,hits){
    if(!hits||!hits.length) return;
    const box=document.createElement('div');
    box.className='ai-src';
    box.innerHTML='<span class="lbl">依据</span>';
    const seen=new Set();
    hits.forEach(h=>{
      if(seen.has(h.f)) return; seen.add(h.f);
      const a=document.createElement('a');
      a.href=h.f; a.textContent='第 '+h.p+' 页 · '+h.t;
      if(h.s) a.title=h.s;
      box.appendChild(a);
    });
    bub.appendChild(box);
  }

  function welcome(){
    msgs.innerHTML='';
    const box=document.createElement('div');
    box.className='ai-empty';
    const hasKey=!!cfg.key.trim();
    box.innerHTML='<h4>边看边问</h4><p>'+
      (hasKey
        ? '选中正文里的任意一句话，点「问 AI」；或直接问。我会先检索本站 18 页课程作依据，再结合当前小节回答，并在末尾标出出处。'
        : '未配置模型：我只会从 18 页课程里<b>检索原文片段</b>给你看，不做改写。<br>配置 API Key 后，改为「大模型 + 课程知识库」联合作答。')+
      '</p><div class="ai-chips" id="aiChips"></div>';
    msgs.appendChild(box);
    const chips=[
      ['什么是缩放点积注意力？',''],
      ['这一节讲了什么？',''],
      ['多头为什么是 8 个？',''],
      ['举个例子说明掩码','']
    ];
    const host=box.querySelector('#aiChips');
    chips.forEach(([q])=>{
      const b=document.createElement('button');
      b.className='ai-chip'; b.textContent=q;
      b.onclick=()=>{ input.value=q; send(); };
      host.appendChild(b);
    });
    if(!hasKey){
      const b=document.createElement('button');
      b.className='ai-chip'; b.textContent='⚙ 配置模型';
      b.onclick=openSheet;
      host.appendChild(b);
    }
  }

  /* ---------- 课程知识库（RAG） ---------- */
  let KB=null;
  const kbReady=()=>Array.isArray(window.COURSE_KB)&&window.COURSE_KB.length>0;
  function kbTokens(str){
    const out=[];
    const low=String(str||'').toLowerCase();
    (low.match(/[a-z][a-z0-9_\-]{1,}/g)||[]).forEach(w=>{ if(w.length>=2) out.push(w); });
    (low.match(/[\u4e00-\u9fa5]+/g)||[]).forEach(run=>{
      for(let i=0;i<run.length-1;i++) out.push(run.slice(i,i+2));
      if(run.length===1) out.push(run);
    });
    return out;
  }
  function kbBuild(){
    if(KB) return KB;
    const docs=(window.COURSE_KB||[]).map(c=>{
      const toks=kbTokens(c.x+' '+(c.s||''));
      const tf=Object.create(null);
      toks.forEach(t=>{tf[t]=(tf[t]||0)+1});
      return {c,tf,len:toks.length};
    });
    const df=Object.create(null);
    docs.forEach(d=>Object.keys(d.tf).forEach(t=>{df[t]=(df[t]||0)+1}));
    const N=docs.length||1, avg=(docs.reduce((a,d)=>a+d.len,0)/N)||1;
    // 已知词表：术语库名称 + 每页标题，用来判断查询里的「真词」和「跨词碎片」
    const KNOWN=new Set();
    try{
      Object.keys(G).forEach(k=>{const g=G[k];if(g&&g.n){kbTokens(g.n).forEach(t=>KNOWN.add(t));if(g.e)kbTokens(g.e).forEach(t=>KNOWN.add(t));}});
    }catch(e){}
    (window.COURSE_KB||[]).forEach(c=>kbTokens(c.t||'').forEach(t=>KNOWN.add(t)));
    KB={docs,df,N,avg,KNOWN};
    return KB;
  }
  function retrieve(q,k){
    if(!kbReady()) return [];
    const {docs,df,N,avg,KNOWN}=kbBuild();
    const STOP=new Set(['什么','么的','是什','为什','怎么','怎样','如何','一下','请问','讲讲','说说',
      '这个','那个','哪些','哪个','可以','能不','不能','需要','应该','就是','的是','是的','意思','区别','有什','么样']);
    // 少量同义扩展：只加最常见的几组，避免过度扩散
    const SYN={gpu:['p100','显卡'],显卡:['gpu','p100'],p100:['gpu'],参数量:['params'],批次:['batch'],
      优化器:['adam'],词表:['vocabulary'],损失:['loss'],学习率:['warmup','lr'],编码器:['encoder'],解码器:['decoder']};
    const raw=kbTokens(q).filter(t=>!STOP.has(t));
    const extra=[];
    raw.forEach(t=>{ if(SYN[t]) SYN[t].forEach(x=>extra.push(x)); });
    // 单字母 e 会被分词器过滤（要求英文>=2字符），但它在本课程里几乎总指自然常数
    if(/(^|[^a-z])e([^a-z]|$)/.test(String(q).toLowerCase())) ['指数','对数','softmax','自然常数'].forEach(x=>extra.push(x));
    const uniq=[...new Set(raw.concat(extra))];
    if(!uniq.length) return [];
    const cur=(location.pathname.split('/').pop()||'index.html');
    const K1=1.2,B=0.72;
    // 查询里最有区分度的词（IDF 最高），用于标题命中加权
    let rare=null, rareIdf=0;
    uniq.forEach(t=>{
      if(!df[t]) return;
      if(!(KNOWN.has(t)||/^[a-z]{2,}$/.test(t))) return;
      const idf=Math.log(1+(N-df[t]+0.5)/(df[t]+0.5));
      if(idf>rareIdf){ rareIdf=idf; rare=t; }
    });
    // 查询里最关键的 2 个词：不命中任何一个的块直接淘汰，避免「什么/怎么」这类虚词刷分
    // 优先用「真词」（术语库/标题里出现过的），避免「干什」这种跨词碎片霸占关键词
    const isKnown=t=>KNOWN.has(t)||/^[a-z]{2,}$/.test(t);
    const pool=uniq.filter(t=>df[t]&&isKnown(t));
    const base=pool.length?pool:uniq.filter(t=>df[t]);
    const keyed=base.map(t=>({t,idf:Math.log(1+(N-df[t]+0.5)/(df[t]+0.5))}))
      .sort((a,b)=>b.idf-a.idf).slice(0,2).map(x=>x.t);
    const scored=[];
    docs.forEach(d=>{
      const hitKeyed=keyed.some(t=>d.tf[t]);
      let sc=0;
      uniq.forEach(t=>{
        const f=d.tf[t]; if(!f) return;
        const idf=Math.log(1+(N-df[t]+0.5)/(df[t]+0.5));
        sc+=idf*(f*(K1+1))/(f+K1*(1-B+B*d.len/avg));
      });
      if(sc<=0) return;
      // 标题/小节命中加权：问「多头」时，标题为《多头注意力》的页应排前面
      const tt=new Set(kbTokens((d.c.t||'')+' '+(d.c.s||'')));
      let ov=0; uniq.forEach(t=>{ if(tt.has(t)) ov++; });
      sc*=1+0.7*(ov/uniq.length);
      // 标题含查询里最稀有的词 → 强加权（问「掩码」应优先命中《…与掩码》那一页）
      if(rare && ((d.c.t||'')+(d.c.s||'')).indexOf(rare)>=0) sc*=1.55;
      // 过短的碎片块略降权
      if(d.len<110) sc*=0.88;
      // 首页是目录，不是内容
      if(d.c.f==='index.html') sc*=0.7;
      if(d.c.f===cur) sc*=1.08;
      // 没命中任何「真词」的块大幅降权（而不是直接丢弃——有些答案段落不含问句里的动词）
      if(keyed.length && !hitKeyed) sc*=0.5;
      scored.push({c:d.c,s:sc});
    });
    if(!scored.length) return [];
    scored.sort((a,b)=>b.s-a.s);
    const top=scored[0].s;
    return scored.filter(x=>x.s>=top*0.34).slice(0,k||4).map(x=>Object.assign({score:x.s},x.c));
  }
  function kbContext(q,limit){
    const hits=retrieve(q,4);
    if(!hits.length) return {text:'',hits:[]};
    let out='';
    hits.forEach((h,i)=>{
      const body=h.x.length>720?h.x.slice(0,720)+'…':h.x;
      out+='【资料'+(i+1)+'｜第 '+h.p+' 页《'+h.t+'》· '+(h.s||'正文')+'】\n'+body+'\n\n';
    });
    return {text:out.trim().slice(0,limit||3000),hits};
  }

  /* ---------- 无 Key：本地检索作答 ---------- */
  function localAnswer(q){
    const hits=retrieve(q,3);
    const lower=q.toLowerCase();
    const gKeys=Object.keys(G).filter(k=>G[k]&&G[k].n);
    const gHits=gKeys.filter(k=>{
      const g=G[k];
      return q.includes(g.n)||(g.e&&g.e.length>2&&lower.includes(g.e.toLowerCase()));
    }).sort((a,b)=>G[b].n.length-G[a].n.length).slice(0,1);

    if(hits.length){
      const h=hits[0];
      const body=h.x.length>320?h.x.slice(0,320)+'…':h.x;
      let out='**第 '+h.p+' 页 · '+(h.s||h.t)+'**\n\n'+body;
      if(gHits.length){
        const g=G[gHits[0]];
        out='**'+g.n+'**（'+g.e+'）\n\n'+g.d+'\n\n'+out;
      }
      out+='\n\n> 以上为课程原文摘录，未经模型改写。配置 API Key 后，会由模型基于这些资料作答。';
      return {text:out,tag:'资料检索',hits};
    }
    return {text:'没有在课程里检索到相关内容。\n\n- 换个说法试试，例如「掩码是什么」「多头为什么是 8 个」\n- 或配置 API Key，让模型用通用知识回答',tag:'资料检索',hits:[]};
  }

  /* ---------- 组装请求：知识库 + 当前位置 ---------- */
  function buildMessages(q,images){
    const p=pageInfo();
    const sys='你是《Attention Is All You Need》的助教，正在陪用户读一份中文交互课程（共 18 页）。'+
      '回答要求：中文、准确、先给结论再解释，控制在 250 字内；涉及论文时标注章节号（如 §3.2.1）；不确定就说不确定，不要编造数字。';
    let ctx='【读者所在位置】《'+p.title+'》'+(p.section?' · '+p.section:'');
    if(cfg.includePage){
      const t=sectionText(1600);
      if(t) ctx+='\n\n【当前小节原文（节选）】\n'+t;
    }
    let hits=[];
    if(cfg.rag!==false){
      const kc=kbContext(q,3200);
      hits=kc.hits;
      if(kc.text) ctx+='\n\n【本站课程资料 · 按相关度检索】\n'+kc.text;
    }
    if(hits.length){
      ctx+='\n\n【资料使用规则】\n1) 资料能回答时，优先依据资料作答，不要与之矛盾；\n'+
        '2) 引用资料时在句末标注（第 X 页 · 小节），便于读者跳转核对；\n'+
        '3) 资料不足时，先说明「课程里没有细讲」，再用通用知识补充，不要假装资料里有；\n'+
        '4) 不要编造论文里没有的数字。';
    }
    const ms=[{role:'system',content:sys+'\n\n'+ctx}];
    history.slice(-6).forEach(m=>ms.push({role:m.role,content:m.text}));
    if(images&&images.length){
      ms.push({role:'user',content:[{type:'text',text:q}].concat(images.map(src=>({type:'image_url',image_url:{url:src}})))});
    }else{
      ms.push({role:'user',content:q});
    }
    return {ms,hits};
  }

  async function streamChat(ms,onDelta,signal){
    const base=cfg.baseUrl.replace(/\/+$/,'');
    const url=/\/chat\/completions$/.test(base)?base:base+'/chat/completions';
    const headers={'Content-Type':'application/json'};
    if(cfg.key.trim()) headers['Authorization']='Bearer '+cfg.key.trim();
    const res=await fetch(url,{method:'POST',headers,body:JSON.stringify({
      model:cfg.model,stream:cfg.stream!==false,temperature:0.3,messages:ms
    }),signal});
    if(!res.ok){
      const t=await res.text().catch(()=>'');
      throw new Error('HTTP '+res.status+'：'+(t||res.statusText).slice(0,240));
    }
    if(cfg.stream===false){
      const j=await res.json();
      const c=j.choices&&j.choices[0]&&j.choices[0].message&&j.choices[0].message.content;
      if(c) onDelta(c);
      return;
    }
    const reader=res.body.getReader();
    const dec=new TextDecoder();
    let buf='';
    while(true){
      const {done,value}=await reader.read();
      if(done) break;
      buf+=dec.decode(value,{stream:true});
      let i;
      while((i=buf.indexOf('\n'))>=0){
        const line=buf.slice(0,i).trim();
        buf=buf.slice(i+1);
        if(!line.startsWith('data:')) continue;
        const data=line.slice(5).trim();
        if(data==='[DONE]') return;
        try{
          const j=JSON.parse(data);
          const d=j.choices&&j.choices[0]&&j.choices[0].delta;
          if(d&&d.content) onDelta(d.content);
        }catch(e){}
      }
    }
  }

  /* ---------- 发送 ---------- */
  async function send(textOverride,imgsOverride,isRetry){
    if(streaming) return;
    const text=(textOverride!=null?textOverride:input.value).trim();
    const images=imgsOverride||attachments.slice();
    if(!text && !images.length) return;

    if(!isRetry){
      const empty=msgs.querySelector('.ai-empty');
      if(empty) empty.remove();
      addMsg('user',text,{images,force:true});
      history.push({role:'user',text:text||'（图片）'});
      input.value=''; input.style.height='auto'; input.scrollLeft=0;
      attachments=[]; renderAttach();
    }
    lastUser={text,images};

    const p=pageInfo();
    const bub=addMsg('bot','',{tag:cfg.key.trim()?'':'本地知识库',force:true});
    bub.innerHTML='<span class="tag">'+(cfg.key.trim()?'AI':'本地知识库')+'</span><span class="thinking">…</span>';

    if(!cfg.key.trim()){
      await new Promise(r=>setTimeout(r,320));
      const r=localAnswer(text);
      bub.innerHTML='<span class="tag">'+r.tag+'</span>'+md(r.text);
      addSources(bub,r.hits);
      addActions(bub,r.text);
      history.push({role:'assistant',text:r.text});
      saveHist();
      scrollBottom(true);
      return;
    }

    streaming=true;
    sendBtn.innerHTML=ICON.stop+'<span>停止</span>';
    sendBtn.classList.add('stop');
    controller=new AbortController();
    let acc='';
    let html='<span class="tag">'+(cfg.model||'AI')+'</span>';
    try{
      const built=buildMessages(text,images);
      const ms=built.ms, hits=built.hits;
      bub.innerHTML=html+'<span class="caret"></span>';
      await streamChat(ms,chunk=>{
        if(!acc) bub.innerHTML=html;
        acc+=chunk;
        bub.innerHTML=html+md(acc)+'<span class="caret"></span>';
        scrollBottom();
      },controller.signal);
      bub.innerHTML=html+md(acc||'（没有返回内容）');
      addSources(bub,hits);
      if(acc){
        history.push({role:'assistant',text:acc});
        saveHist();
        addActions(bub,acc);
      }
      scrollBottom(true);
    }catch(err){
      const m=String(err&&err.message||err);
      const cors=/Failed to fetch|NetworkError|load failed/i.test(m);
      bub.innerHTML=html+md(
        '**请求失败**\n\n`'+m+'`\n\n'+
        (cors?'如果是浏览器直连被跨域（CORS）拦截：可改用本地 Ollama（`http://localhost:11434/v1`，模型名 `llama3.1`），或换一个允许浏览器调用的接口地址。':'检查接口地址、模型名与 Key 是否正确。')
      );
      bub.innerHTML+='<div class="acts" style="opacity:1"><button id="aiRetry">重试</button><button id="aiToCfg">去设置</button></div>';
      const rt=bub.querySelector('#aiRetry'); if(rt) rt.onclick=()=>send(text,images,true);
      const tc=bub.querySelector('#aiToCfg'); if(tc) tc.onclick=openSheet;
      scrollBottom(true);
    }finally{
      streaming=false; controller=null;
      sendBtn.innerHTML=ICON.send+'<span>发送</span>';
      sendBtn.classList.remove('stop');
    }
  }

  /* ---------- 附件 ---------- */
  function renderAttach(){
    attachBox.innerHTML='';
    attachments.forEach((src,i)=>{
      const d=document.createElement('div');
      d.className='ai-thumb';
      d.innerHTML='<img src="'+src+'" alt="附件"><button aria-label="移除">×</button>';
      d.querySelector('button').onclick=()=>{attachments.splice(i,1);renderAttach();};
      attachBox.appendChild(d);
    });
  }
  function addImage(file){
    if(!file||!/^image\//.test(file.type)) return;
    const url=URL.createObjectURL(file);
    const im=new Image();
    im.onload=()=>{
      const max=1280;
      let w=im.width,h=im.height;
      if(Math.max(w,h)>max){ const k=max/Math.max(w,h); w=Math.round(w*k); h=Math.round(h*k); }
      const cv=document.createElement('canvas');
      cv.width=w; cv.height=h;
      cv.getContext('2d').drawImage(im,0,0,w,h);
      let data;
      try{ data=cv.toDataURL('image/jpeg',0.82); }catch(e){ data=cv.toDataURL(); }
      attachments.push(data);
      renderAttach();
      URL.revokeObjectURL(url);
    };
    im.onerror=()=>{ URL.revokeObjectURL(url); };
    im.src=url;
    openPanel();
  }

  const fileInput=document.createElement('input');
  fileInput.type='file'; fileInput.accept='image/*'; fileInput.multiple=true;
  fileInput.style.display='none';
  root.appendChild(fileInput);
  fileInput.onchange=()=>{ [...fileInput.files].forEach(addImage); fileInput.value=''; };

  /* ---------- 面板开关 ---------- */
  function openPanel(){
    document.body.classList.add('ai-open');
    panel.classList.add('open');
    panel.setAttribute('aria-hidden','false');
    fab.classList.add('hide');
    if(innerWidth<=1100) scrim.classList.add('on');
    if(!msgs.children.length) welcome();
    setTimeout(()=>{ if(innerWidth>1100) input.focus({preventScroll:true}); },260);
    updateCtxLabel();
  }
  function closePanel(){
    document.body.classList.remove('ai-open');
    panel.classList.remove('open');
    panel.setAttribute('aria-hidden','true');
    fab.classList.remove('hide');
    scrim.classList.remove('on');
    hideSel();
  }
  function updateCtxLabel(){
    const p=pageInfo();
    $('#aiCtx').textContent=p.title+(p.section?' · '+p.section:'');
  }

  fab.onclick=openPanel;
  $('#aiCloseBtn').onclick=closePanel;
  scrim.onclick=closePanel;
  $('#aiClearBtn').onclick=()=>{
    if(streaming&&controller) controller.abort();
    history=[]; try{sessionStorage.removeItem(HS)}catch(e){}
    welcome();
  };

  /* ---------- 输入 ---------- */
  input.addEventListener('input',()=>{
    input.style.height='auto';
    input.style.height=Math.min(input.scrollHeight,132)+'px';
  });
  input.addEventListener('keydown',e=>{
    if(e.key==='Enter'&&!e.shiftKey&&!e.isComposing){ e.preventDefault(); send(); }
  });
  sendBtn.onclick=()=>{ if(streaming&&controller){ controller.abort(); } else send(); };
  ctxBtn.onclick=()=>{
    cfg.includePage=!cfg.includePage;
    ctxBtn.classList.toggle('on',cfg.includePage);
    saveCfg();
  };
  ctxBtn.classList.toggle('on',cfg.includePage!==false);
  ragBtn.classList.toggle('on',cfg.rag!==false);
  ragBtn.onclick=()=>{
    cfg.rag=!(cfg.rag!==false);
    ragBtn.classList.toggle('on',cfg.rag);
    saveCfg();
  };
  $('#aiImgBtn').onclick=()=>fileInput.click();
  $('#aiCfgBtn').onclick=openSheet;

  /* 粘贴图片 */
  input.addEventListener('paste',e=>{
    const items=e.clipboardData&&e.clipboardData.items;
    if(!items) return;
    let got=false;
    for(const it of items){
      if(it.type&&it.type.indexOf('image')===0){
        const f=it.getAsFile(); if(f){ addImage(f); got=true; }
      }
    }
    if(got) e.preventDefault();
  });
  /* 拖拽图片 */
  panel.addEventListener('dragover',e=>{e.preventDefault();});
  panel.addEventListener('drop',e=>{
    if(!e.dataTransfer||!e.dataTransfer.files) return;
    e.preventDefault();
    [...e.dataTransfer.files].forEach(addImage);
  });

  /* ---------- 划词 ---------- */
  let selTimer=null;
  function hideSel(){ selBtn.classList.remove('on'); }
  document.addEventListener('mouseup',()=>{
    clearTimeout(selTimer);
    selTimer=setTimeout(()=>{
      const s=window.getSelection();
      if(!s||s.isCollapsed||!s.rangeCount){ hideSel(); return; }
      const text=s.toString().trim();
      if(text.length<2||text.length>1200){ hideSel(); return; }
      const node=s.anchorNode;
      const host=node&&(node.nodeType===1?node:node.parentElement);
      if(!host||!host.closest('#doc')){ hideSel(); return; }
      if(host.closest('.ai-panel')){ hideSel(); return; }
      const r=s.getRangeAt(0).getBoundingClientRect();
      selBtn.style.left=(r.left+r.width/2)+'px';
      selBtn.style.top=(r.top-8)+'px';
      selBtn.dataset.text=text;
      selBtn.classList.add('on');
    },12);
  });
  document.addEventListener('mousedown',e=>{
    if(!selBtn.contains(e.target)) hideSel();
  });
  document.addEventListener('scroll',hideSel,{passive:true});
  selBtn.onmousedown=e=>e.preventDefault();
  selBtn.onclick=()=>{
    const text=selBtn.dataset.text||'';
    openPanel();
    input.value='「'+text+'」\n\n';
    input.dispatchEvent(new Event('input'));
    setTimeout(()=>{ input.focus(); input.setSelectionRange(input.value.length,input.value.length); },260);
    hideSel();
  };

  /* ---------- 设置 ---------- */
  const PRESETS=[
    {n:'DeepSeek',base:'https://api.deepseek.com/v1',model:'deepseek-chat'},
    {n:'Kimi',base:'https://api.moonshot.cn/v1',model:'moonshot-v1-8k'},
    {n:'智谱 GLM',base:'https://open.bigmodel.cn/api/paas/v4',model:'glm-4-flash'},
    {n:'OpenAI',base:'https://api.openai.com/v1',model:'gpt-4o-mini'},
    {n:'本地 Ollama',base:'http://localhost:11434/v1',model:'llama3.1'}
  ];
  const presetBox=$('#aiPresets');
  PRESETS.forEach(p=>{
    const b=document.createElement('button');
    b.className='ai-preset'; b.textContent=p.n;
    b.onclick=()=>{ $('#cfgBase').value=p.base; $('#cfgModel').value=p.model; };
    presetBox.appendChild(b);
  });
  function openSheet(){
    $('#cfgBase').value=cfg.baseUrl||'';
    $('#cfgModel').value=cfg.model||'';
    $('#cfgKey').value=cfg.key||'';
    sheet.classList.add('on');
  }
  function closeSheet(){ sheet.classList.remove('on'); }
  $('#aiSheetX').onclick=closeSheet;
  $('#cfgCancel').onclick=closeSheet;
  sheet.addEventListener('click',e=>{ if(e.target===sheet) closeSheet(); });
  $('#cfgReset').onclick=()=>{
    $('#cfgBase').value=CFG_DEFAULT.baseUrl;
    $('#cfgModel').value=CFG_DEFAULT.model;
    $('#cfgKey').value='';
  };
  $('#cfgSave').onclick=()=>{
    cfg.baseUrl=$('#cfgBase').value.trim()||CFG_DEFAULT.baseUrl;
    cfg.model=$('#cfgModel').value.trim()||CFG_DEFAULT.model;
    cfg.key=$('#cfgKey').value.trim();
    saveCfg();
    closeSheet();
    welcome();
    addMsg('bot',cfg.key?'已连接 **'+cfg.model+'**。现在可以自由提问，也可以把截图拖进来。':'已切换回**本地知识库模式**。',{tag:'设置'});
  };

  /* ---------- 快捷键 ---------- */
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape'){
      if(sheet.classList.contains('on')) closeSheet();
      else if(panel.classList.contains('open')) closePanel();
    }
  });

  /* ---------- 初始化 ---------- */
  if(restoreHist()){
    history.forEach(m=>{
      const bub=addMsg(m.role==='user'?'user':'bot',m.text,{});
      if(m.role!=='user') addActions(bub,m.text);
    });
    scrollBottom(true);
  }
  updateCtxLabel();
  window.addEventListener('resize',()=>{
    if(innerWidth>1100) scrim.classList.remove('on');
    else if(panel.classList.contains('open')) scrim.classList.add('on');
  });

  window.AIPanel={open:openPanel,close:closePanel,cfg:()=>cfg,send,retrieve,localAnswer};
})();
