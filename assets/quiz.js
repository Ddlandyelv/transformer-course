/* ===== 自测追踪：注入题库 / 记录对错 / 掌握度统计 ===== */
(function(){
  'use strict';
  const KEY='tfc-quiz-v2';
  const PAGE=document.documentElement.dataset.page||'';
  const DOC=document.getElementById('doc');

  /* ---------- 存储 ---------- */
  let store={v:2,items:{}};
  try{
    const raw=localStorage.getItem(KEY);
    if(raw){ const o=JSON.parse(raw); if(o&&o.items) store=o; }
  }catch(e){}
  const save=()=>{ try{localStorage.setItem(KEY,JSON.stringify(store))}catch(e){} };

  const qhash=s=>{ let h=5381; for(let i=0;i<s.length;i++) h=((h<<5)+h+s.charCodeAt(i))|0; return (h>>>0).toString(36); };
  const qText=qz=>{
    const q=qz.querySelector('.q');
    return (q?q.textContent:'').replace(/^Q\s*\d+\s*/,'').replace(/\s+/g,' ').trim();
  };
  const qid=qz=>qz.dataset.qid|| (PAGE+':'+qhash(qText(qz)));
  const opts=qz=>[...qz.querySelectorAll('.opt')];

  /* ---------- 注入题库 ---------- */
  function build(item,num){
    const letters='ABCD';
    return '<div class="qz" data-qid="'+PAGE+':b'+item.id+'">'+
      '<div class="q"><i>Q'+num+'</i>'+item.q+'</div>'+
      '<div class="opts">'+item.o.map((t,i)=>
        '<button class="opt"'+(i===item.k?' data-ok="1"':'')+'><i>'+letters[i]+'</i><span>'+t+'</span></button>'
      ).join('')+'</div>'+
      '<div class="ex">'+item.e+'</div></div>';
  }
  function inject(){
    const box=DOC&&DOC.querySelector('.quiz');
    if(!box) return null;
    const mine=(window.QUIZ_BANK||[]).filter(x=>x.p===PAGE);
    let n=box.querySelectorAll('.qz').length;
    if(mine.length){
      const frag=document.createElement('div');
      frag.innerHTML=mine.map(it=>build(it,++n)).join('');
      while(frag.firstChild) box.appendChild(frag.firstChild);
    }
    return box;
  }

  /* ---------- 渲染已答状态 ---------- */
  function applyRec(qz,rec){
    qz.dataset.done='1';
    opts(qz).forEach((o,i)=>{
      o.disabled=true;
      if(i===rec.k) o.classList.add('ok');
      if(i===rec.pick && !rec.ok) o.classList.add('no');
    });
    const ex=qz.querySelector('.ex');
    if(ex) ex.classList.add('on');
    if(!qz.querySelector('.redo')){
      const b=document.createElement('button');
      b.className='redo';
      b.textContent='重做本题';
      b.onclick=()=>redo(qz);
      (ex||qz).appendChild(b);
    }
  }
  function redo(qz){
    delete store.items[qid(qz)];
    save();
    qz.removeAttribute('data-done');
    opts(qz).forEach(o=>{ o.disabled=false; o.classList.remove('ok','no'); });
    const ex=qz.querySelector('.ex');
    if(ex) ex.classList.remove('on');
    const b=qz.querySelector('.redo');
    if(b) b.remove();
    render();
  }

  /* ---------- 记录 ---------- */
  function record(qz,pick){
    const os=opts(qz);
    const k=os.findIndex(o=>o.dataset.ok==='1');
    if(k<0) return;
    store.items[qid(qz)]={
      p:PAGE,
      q:qText(qz),
      o:os.map(o=>o.textContent.replace(/^[A-D]\s*/,'').trim()),
      k:k,
      pick:pick,
      ok:pick===k,
      e:(qz.querySelector('.ex')||{textContent:''}).textContent.replace('重做本题','').trim(),
      ts:Date.now()
    };
    save();
    applyRec(qz, store.items[qid(qz)]);   // 立刻挂上「重做」，不必刷新
    render();
  }
  document.addEventListener('quiz:answered',e=>{
    const d=e.detail||{};
    if(!d.qz||!d.opt) return;
    const idx=opts(d.qz).indexOf(d.opt);
    if(idx>=0) record(d.qz,idx);
  });

  /* ---------- 页面进度 ---------- */
  function pageStat(){
    const all=DOC?[...DOC.querySelectorAll('.qz')]:[];
    let done=0,ok=0;
    all.forEach(qz=>{ const r=store.items[qid(qz)]; if(r){done++; if(r.ok)ok++;} });
    return {done,ok,total:all.length};
  }
  function render(){
    const box=DOC&&DOC.querySelector('.quiz');
    if(box){
      let qp=document.getElementById('qp');
      if(!qp){
        qp=document.createElement('div');
        qp.id='qp'; qp.className='qp';
        box.parentNode.insertBefore(qp,box);
      }
      const s=pageStat();
      const pct=s.total?Math.round(s.done/s.total*100):0;
      const rate=s.done?Math.round(s.ok/s.done*100):0;
      qp.innerHTML=
        '<div class="qp-head"><b>本页自测进度</b>'+
        '<span>已答 '+s.done+' / '+s.total+(s.done?' · 正确 '+s.ok+'（'+rate+'%）':'')+'</span></div>'+
        '<div class="qp-bar"><i style="width:'+pct+'%"></i></div>'+
        '<div class="qp-foot"><a href="p18-progress.html">查看掌握度总览 →</a></div>';
    }
    renderSide();
  }
  function globalStat(){
    const items=Object.values(store.items);
    const total=(window.QUIZ_TOTAL?(window.QUIZ_TOTAL.bank+window.QUIZ_TOTAL.authored):0);
    const ok=items.filter(x=>x.ok).length;
    return {answered:items.length,total,ok,rate:items.length?Math.round(ok/items.length*100):0};
  }
  function renderSide(){
    const host=document.querySelector('.side-prog');
    if(!host) return;
    let a=document.getElementById('sideQuiz');
    if(!a){
      a=document.createElement('a');
      a.id='sideQuiz'; a.className='side-quiz';
      a.href='p18-progress.html';
      host.parentNode.insertBefore(a,host.nextSibling);
    }
    const g=globalStat();
    a.innerHTML='<span>自测</span><b>'+g.answered+' / '+g.total+'</b><em>'+(g.answered?'正确 '+g.rate+'%':'未开始')+'</em>';
  }

  /* ---------- 恢复已答 ---------- */
  function restore(){
    if(!DOC) return;
    DOC.querySelectorAll('.qz').forEach(qz=>{
      const rec=store.items[qid(qz)];
      if(rec) applyRec(qz,rec);
    });
  }

  /* ---------- 对外 API（供掌握度页使用） ---------- */
  window.QuizStore={
    items:()=>store.items,
    clear(){ store={v:2,items:{}}; save(); },
    totals(){
      const t=window.QUIZ_TOTAL||{byPage:{},bank:0,authored:0};
      return t;
    },
    stats(){
      const items=Object.values(store.items);
      const t=window.QUIZ_TOTAL||{byPage:{},bank:0,authored:0};
      const total=t.bank+t.authored;
      const ok=items.filter(x=>x.ok).length;
      const pages=[];
      let donePages=0;
      (window.COURSE||[]).forEach(g=>{
        g.items.forEach(it=>{
          if(it.id==='index'||it.id==='progress') return;
          const pageItems=items.filter(x=>x.p===it.id);
          const tot=t.byPage[it.id]||0;
          const corr=pageItems.filter(x=>x.ok).length;
          if(pageItems.length) donePages++;
          pages.push({
            id:it.id, f:it.f, n:it.n, t:it.t,
            answered:pageItems.length, total:tot,
            correct:corr,
            rate:pageItems.length?Math.round(corr/pageItems.length*100):0
          });
        });
      });
      return {
        answered:items.length, total, correct:ok,
        wrong:items.length-ok,
        rate:items.length?Math.round(ok/items.length*100):0,
        cover:total?Math.round(items.length/total*100):0,
        pages
      };
    }
  };

  /* ---------- 启动 ---------- */
  inject();
  restore();
  render();
})();
