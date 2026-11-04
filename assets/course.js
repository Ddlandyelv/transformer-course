/* ===== Transformer 精读课 · 全站脚本 ===== */

/* ---------- 课程结构 ---------- */
const COURSE=[
 {p:'开始',items:[
   {id:'index',f:'index.html',n:'00',t:'学习地图与使用说明'}
 ]},
 {p:'第零幕 · 从零开始',items:[
   {id:'why',f:'p00a-why.html',n:'0.1',t:'机器要学会一件事，难在哪'},
   {id:'neuron',f:'p00b-neuron.html',n:'0.2',t:'一个神经元：最小的零件'},
   {id:'exp',f:'p00c-exp.html',n:'0.3',t:'e 和 log：为什么老是出现'},
   {id:'howlearn',f:'p00d-training.html',n:'0.4',t:'模型怎么“学”：一次训练'},
   {id:'whyattn',f:'p00e-attention.html',n:'0.5',t:'为什么需要注意力'},
   {id:'cnn',f:'p00f-cnn.html',n:'0.6',t:'卷积网络：图像与语言'},
   {id:'hist',f:'p00g-history.html',n:'0.7',t:'神经网络发展史'}
 ]},
 {p:'第一部分 · 前置知识',items:[
   {id:'math',f:'p01-math.html',n:'01',t:'向量、矩阵与点积'},
   {id:'nn',f:'p02-nn.html',n:'02',t:'神经网络与训练'},
   {id:'seq',f:'p03-seq.html',n:'03',t:'序列建模与编码器-解码器'},
   {id:'lm',f:'p04-lm.html',n:'04',t:'语言模型、分词与评价指标'}
 ]},
 {p:'第二部分 · 论文正文',items:[
   {id:'intro',f:'p05-intro.html',n:'05',t:'摘要与引言（§Abstract·§1）'},
   {id:'bg',f:'p06-background.html',n:'06',t:'背景（§2）'},
   {id:'arch',f:'p07-stacks.html',n:'07',t:'编码器-解码器栈（§3.1）'},
   {id:'sdpa',f:'p08-attention.html',n:'08',t:'缩放点积注意力（§3.2.1）'},
   {id:'mha',f:'p09-multihead.html',n:'09',t:'多头注意力（§3.2.2）'},
   {id:'usage',f:'p10-usage.html',n:'10',t:'三种注意力用法与掩码（§3.2.3）'},
   {id:'ffn',f:'p11-ffn.html',n:'11',t:'前馈网络（§3.3）'},
   {id:'emb',f:'p12-embed.html',n:'12',t:'嵌入与 Softmax（§3.4）'},
   {id:'pe',f:'p13-posenc.html',n:'13',t:'位置编码（§3.5）'},
   {id:'why',f:'p14-why.html',n:'14',t:'为什么用自注意力（§4）'},
   {id:'train',f:'p15-training.html',n:'15',t:'训练（§5）'},
   {id:'result',f:'p16-results.html',n:'16',t:'结果、消融与结论（§6-§7）'}
 ]},
 {p:'附录',items:[
   {id:'gloss',f:'p17-glossary.html',n:'17',t:'术语总表与公式速查'},
   {id:'progress',f:'p18-progress.html',n:'18',t:'学习进度与掌握度'}
 ]}
];
const FLAT=COURSE.flatMap(g=>g.items);
window.COURSE=COURSE; window.COURSE_FLAT=FLAT;

/* ---------- 术语库（全站共享） ---------- */
/* n 中文名 · e 英文 · d 白话定义 · l 论文出现位置 */
const G={
 vector:{n:'向量',e:'vector',d:'一串有序的数，例如 [0.2, −1.3, 0.7]。在模型里，一个词的“意思”就用一个向量表示，向量的每一格是一个特征。',l:'§3.4 词向量维度 d_model=512'},
 matrix:{n:'矩阵',e:'matrix',d:'按行和列排成矩形的数表。一批向量竖着排就是矩阵：n 个词各 512 维，就是一个 n×512 的矩阵。',l:'§3.2.1 式(1) 中的 Q、K、V'},
 dim:{n:'维度',e:'dimension',d:'一个向量里数字的个数。512 维就是 512 个数。矩阵的维度写作“行×列”。',l:'§3.2.2 d_k=d_v=64'},
 dot:{n:'点积',e:'dot product',d:'两个等长向量对应位置相乘再相加，得到一个大小的分数。它衡量两个向量“方向有多一致”：同向为正、垂直约等于 0、反向为负。',l:'§3.2.1 “compute the dot products of the query with all keys”'},
 matmul:{n:'矩阵乘法',e:'matrix multiplication',d:'左矩阵的每一行与右矩阵的每一列做点积，结果填进新矩阵的对应格。形状规则：(n×k)·(k×m)=(n×m)，中间的 k 必须相同。',l:'§3.2.1 式(1) QK^T'},
 transpose:{n:'转置',e:'transpose',d:'把矩阵行和列对调，记作 K^T。n×d_k 的 K 转置后是 d_k×n，这样才能与 n×d_k 的 Q 相乘。',l:'§3.2.1 QK^T'},
 weight:{n:'权重',e:'weight',d:'模型自己学出来的数字。线性层就是“输入向量 × 权重矩阵”，它决定如何把输入变换成另一种表示。',l:'§3.2.2 W^Q、W^K、W^V、W^O'},
 bias:{n:'偏置',e:'bias',d:'线性变换里额外加上的一个向量，让变换不必穿过原点，表达更灵活。公式写作 xW+b。',l:'§3.3 式(2) 的 b1、b2'},
 linear:{n:'线性变换',e:'linear transformation',d:'只做乘法和加法、不做弯折的变换：y = xW + b。它只能拉伸、旋转、投影，不能制造新的非线性关系。',l:'§3.2.2 投影矩阵；§3.3 两次线性变换'},
 activation:{n:'激活函数',e:'activation function',d:'在线性变换之后加入的“弯折”，让网络能表达非线性关系。没有它，堆多少层都等价于一层。',l:'§3.3 ReLU'},
 relu:{n:'ReLU',e:'rectified linear unit',d:'最简单的激活函数：max(0, x)。负数变 0，正数原样保留。便宜、不饱和、训练稳定。',l:'§3.3 式(2)'},
 ffn:{n:'前馈网络',e:'position-wise feed-forward network',d:'两层全连接夹一个 ReLU，对每个位置独立、用同一套参数做变换。负责“每个词自己消化信息”。',l:'§3.3 式(2)'},
 dff:{n:'d_ff',e:'inner-layer dimension',d:'前馈网络中间层的维度，论文取 2048，是 d_model 的 4 倍。先升维再降维，给非线性留出空间。',l:'§3.3'},
 forward:{n:'前向传播',e:'forward pass',d:'输入从第一层流到最后一层、算出预测值的过程。只做计算，不改变参数。',l:'§5 训练流程'},
 loss:{n:'损失函数',e:'loss function',d:'衡量“预测与正确答案差多远”的一个数。训练的目标就是让它变小。',l:'§5.4 标签平滑影响的对象'},
 gradient:{n:'梯度',e:'gradient',d:'损失对每个参数的偏导数，指出“这个参数往哪个方向调、调多少能让损失下降”。',l:'§5.3 优化器'},
 backprop:{n:'反向传播',e:'backpropagation',d:'从损失出发，用链式法则把梯度一层层往回传。深网络里梯度容易变小（消失）或变大（爆炸）。',l:'§5 训练；§3.1 残差的作用'},
 lr:{n:'学习率',e:'learning rate',d:'每次按梯度更新参数时的步长。太大震荡、太小太慢。Transformer 用“先热身再衰减”的策略。',l:'§5.3 式(3)'},
 overfit:{n:'过拟合',e:'overfitting',d:'模型把训练数据背下来了，换新数据就变差。表现为训练损失继续降、验证效果变差。',l:'§5.4 正则化'},
 dropout:{n:'Dropout',e:'dropout',d:'训练时随机把一部分数值置零，强制网络不依赖某几个固定通道。推理时关闭。论文用 0.1。',l:'§5.4'},
 softmax:{n:'Softmax',e:'softmax',d:'把一组任意实数变成总和为 1 的正数：先取 e 的幂，再除以总和。它把“分数”变成“概率”。差距会被指数放大。',l:'§3.2.1 式(1)；§3.4 输出层'},
 logits:{n:'logits',e:'logits',d:'softmax 之前的原始分数，可正可负、没有上界。经过 softmax 才成为概率。',l:'§3.4 “linear transformation … to predicted next-token probabilities”'},
 xent:{n:'交叉熵',e:'cross-entropy',d:'衡量两个概率分布差异的损失。正确词的概率越高，损失越小；−log p(正确词)。',l:'§5 训练目标'},
 ppl:{n:'困惑度',e:'perplexity',d:'交叉熵的指数形式，可理解为“模型在每一步平均要在多少个词里犹豫”。越低越好。',l:'§6.2 表 3'},
 token:{n:'词元',e:'token',d:'文本被切分后的最小单位，可能是一个词、一个词根或一个字符。模型只处理词元的编号。',l:'§5.1 BPE 词表'},
 vocab:{n:'词表',e:'vocabulary',d:'所有词元的集合。模型输出层的维度就等于词表大小（论文约 37000）。',l:'§5.1；§3.4 输出线性层'},
 bpe:{n:'BPE',e:'byte-pair encoding',d:'一种子词切分法：从字符开始，反复把出现频率最高的相邻两段合并成一个新单位，直到达到预设词表大小。',l:'§5.1'},
 padding:{n:'填充',e:'padding',d:'一个批次里句子长短不一，短的补占位符凑齐长度。这些占位符必须被掩码掉，否则会污染注意力。',l:'§3.2.3 掩码相关'},
 mask:{n:'掩码',e:'masking',d:'把不允许关注的位置分数设为 −∞，softmax 之后这些位置权重变成 0。解码器用它阻止“看到未来”。',l:'§3.2.3；图 2'},
 embedding:{n:'嵌入',e:'embedding',d:'一张“编号 → 向量”的查找表。取第 k 行就是第 k 个词元的向量，这张表随训练一起更新。',l:'§3.4'},
 dmodel:{n:'d_model',e:'model dimension',d:'模型内部统一使用的向量宽度。base 取 512，big 取 1024。所有子层输入输出都保持这个宽度，才能做残差相加。',l:'§3.1；§3.3'},
 posenc:{n:'位置编码',e:'positional encoding',d:'一个只与位置有关的向量，加到词向量上，把“第几个词”这个信息注入模型。论文用不同频率的正弦余弦生成。',l:'§3.5 式(4)'},
 attn:{n:'注意力',e:'attention',d:'一种“按相关程度加权汇总”的操作：当前词给每个词打分，按分数把它们的 Value 混合成自己的新表示。',l:'§3.2'},
 qkv:{n:'Q / K / V',e:'query, key, value',d:'同一个词向量乘三个不同矩阵得到的三套表示。Q 是“我在找什么”，K 是“我是什么”，V 是“我能提供什么”。',l:'§3.2；§3.2.2'},
 scaled:{n:'缩放点积注意力',e:'scaled dot-product attention',d:'论文用的注意力算法：softmax(QK^T/√d_k)V。先算相似度，再缩放，再归一化，最后加权求和。',l:'§3.2.1 式(1)'},
 dk:{n:'d_k',e:'key dimension',d:'Q 和 K 的维度，决定点积的大小与缩放因子 √d_k。多头里 d_k=64。',l:'§3.2.1；§3.2.2'},
 multihead:{n:'多头注意力',e:'multi-head attention',d:'并行做 h 次注意力，每次用独立的投影矩阵，各自关注不同类型的关系，最后拼接并线性融合。',l:'§3.2.2 式(2)'},
 head:{n:'注意力头',e:'head',d:'多头中的一路。h=8 时每头只看 64 维子空间，总计算量与单个 512 维注意力相当。',l:'§3.2.2'},
 wo:{n:'W^O',e:'output projection',d:'多头拼接后再乘的矩阵，把 h×d_v 维重新混合回 d_model 维，让各头的信息真正融合。',l:'§3.2.2'},
 residual:{n:'残差连接',e:'residual connection',d:'把子层的输入直接加到输出上：x + Sublayer(x)。它给梯度开了一条直通路径，是深层网络能训起来的关键。',l:'§3.1'},
 layernorm:{n:'层归一化',e:'layer normalization',d:'对单个位置的全部特征做标准化（减均值、除标准差），再缩放平移。不依赖批大小，适合变长序列。',l:'§3.1 LayerNorm(x+Sublayer(x))'},
 encoder:{n:'编码器',e:'encoder',d:'把输入序列变成一串“理解了上下文”的向量。论文中是 6 层，每层含自注意力 + 前馈网络。',l:'§3.1'},
 decoder:{n:'解码器',e:'decoder',d:'根据编码器输出和已生成的词，逐个预测下一个词。6 层，每层比编码器多一个交叉注意力。',l:'§3.1'},
 cross:{n:'交叉注意力',e:'encoder-decoder attention',d:'Q 来自解码器、K 和 V 来自编码器输出的注意力。它让译文每个位置都能回看原文。',l:'§3.2.3 第一条'},
 causal:{n:'因果掩码',e:'causal mask',d:'把注意力矩阵右上角（未来位置）设为 −∞ 的掩码，保证第 i 个位置只能看到 ≤ i 的位置。',l:'§3.2.3 第三条'},
 autoregressive:{n:'自回归',e:'auto-regressive',d:'生成时把上一步的输出接回输入，一步一步往前推。每步只多生成一个词。',l:'§3 引言段；§3.2.3'},
 teacher:{n:'教师强制',e:'teacher forcing',d:'训练时把“正确的上一个词”喂给解码器，而不是模型自己猜的词。收敛快，但训练与推理存在落差。',l:'§3.1 输出右移一位'},
 greedy:{n:'贪心解码',e:'greedy decoding',d:'每一步都取概率最高的词。快，但局部最优不等于整句最优。',l:'与 §6.1 beam search 对照'},
 beam:{n:'束搜索',e:'beam search',d:'同时保留 k 条最优候选路径，每步扩展、打分、剪枝。论文用 k=4。',l:'§6.1'},
 lengthpen:{n:'长度惩罚',e:'length penalty',d:'beam search 的打分修正项，避免模型因为概率连乘而偏爱短句。论文 α=0.6。',l:'§6.1'},
 bleu:{n:'BLEU',e:'BLEU',d:'机器翻译的自动评价指标，比较译文与参考译文的 n-gram 重合度，0–100，越高越好。',l:'§6.1 表 2'},
 batch:{n:'批次',e:'batch',d:'一次并行处理的一组样本。论文每个批次约含 25000 个源词元和 25000 个目标词元。',l:'§5.1'},
 adam:{n:'Adam',e:'Adam optimizer',d:'一种自适应学习率的优化器，为每个参数单独维护梯度的一阶、二阶动量。论文用 β1=0.9、β2=0.98、ε=1e-9。',l:'§5.3'},
 warmup:{n:'预热',e:'warmup',d:'训练最初若干步把学习率从很小线性升高，避免参数还很乱时被大梯度带偏。论文 warmup_steps=4000。',l:'§5.3 式(3)'},
 labelsmooth:{n:'标签平滑',e:'label smoothing',d:'不要求模型对正确词输出 100% 概率，而是留一点给其他词（论文 ε=0.1）。困惑度变差，但准确率和 BLEU 变好。',l:'§5.4'},
 checkpoint:{n:'检查点平均',e:'checkpoint averaging',d:'把训练后期若干个保存点的参数取平均，相当于免费集成。base 取最后 5 个，big 取 20 个。',l:'§6.1'},
 params:{n:'参数量',e:'parameters',d:'模型里可学习的数字总数。base 约 6500 万，big 约 2.13 亿。',l:'表 3'},
 flops:{n:'FLOPs',e:'floating point operations',d:'浮点运算次数，用来比较训练成本。论文用“训练时间 × GPU 数 × 单卡算力”估算。',l:'表 2'},
 pathlength:{n:'路径长度',e:'maximum path length',d:'前向/反向信号在两个位置之间要经过的最少层数。越短越容易学长距离依赖。',l:'§4；表 1'},
 n2:{n:'O(n²) 复杂度',e:'quadratic complexity',d:'自注意力的计算量随序列长度平方增长：每个词都要和每个词算相似度。这是 Transformer 最著名的代价。',l:'表 1；§4'},
 rnn:{n:'RNN 循环神经网络',e:'recurrent neural network',d:'按时间步逐个处理序列的网络：第 t 步的隐藏状态由「上一步的隐藏状态」和「当前输入」共同算出，因此必须顺序执行，无法并行。',l:'§1 第一段；§4 表 1'},
 hidden:{n:'隐藏状态',e:'hidden state',d:'RNN 在每一步内部维护的向量，可以理解为“读到这里为止的摘要”。它随步数更新，并传递给下一步。',l:'§1 “generate a sequence of hidden states h_t”'},
 seq2seq:{n:'seq2seq 编码器-解码器',e:'sequence-to-sequence',d:'一种把变长输入转成变长输出的框架：编码器先把整句压成表示，解码器再逐步生成输出。Transformer 沿用这个骨架。',l:'§3 第一段'},
 selfattn:{n:'自注意力',e:'self-attention / intra-attention',d:'同一个序列内部的注意力：Q、K、V 都来自这一层自己的输入，让每个位置直接与同句所有位置建立联系。',l:'§2 第二段；§3.2.3'},
 subspace:{n:'子空间',e:'subspace',d:'高维空间里的一个低维“观察方向”。多头里每个头用自己的投影矩阵，把 512 维投到各自的 64 维子空间，因此看到的信息侧重不同。',l:'§3.2.2'},
 vanish:{n:'梯度消失',e:'vanishing gradient',d:'反向传播时梯度每经过一层就乘上一个小于 1 的因子，层数一多就衰减到接近 0，导致靠近输入的层学不动。',l:'§3.1 残差连接的动机'},
 ensemble:{n:'模型集成',e:'ensemble',d:'把多个独立训练模型的预测平均或投票，通常能稳定涨点。论文强调自己的单个模型超过了对手的集成模型。',l:'§6.1 表 2'},
 head2:{n:'',e:'',d:'',l:''}
};

/* ---------- 布局与导航 ---------- */
(function(){
  const html=document.documentElement;
  const pageId=html.dataset.page||'index';
  const idx=FLAT.findIndex(x=>x.id===pageId);
  const cur=FLAT[idx]||FLAT[0];

  /* 主题 */
  let theme='light';
  try{theme=localStorage.getItem('tfc-theme')||'light'}catch(e){}
  html.setAttribute('data-theme',theme);
  function setTheme(t){
    theme=t;html.setAttribute('data-theme',t);
    try{localStorage.setItem('tfc-theme',t)}catch(e){}
    const b=document.getElementById('themeTxt'); if(b) b.textContent=t==='dark'?'浅色':'深色';
    const ic=document.getElementById('themeIcon');
    if(ic) ic.innerHTML=t==='dark'
      ? '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'
      : '<path d="M20 14.5A8.5 8.5 0 019.5 4a8.5 8.5 0 1010.5 10.5z"/>';
    window.dispatchEvent(new CustomEvent('themechange'));
  }

  /* 已完成集合 */
  let done=new Set();
  try{done=new Set(JSON.parse(localStorage.getItem('tfc-done')||'[]'))}catch(e){}
  const saveDone=()=>{try{localStorage.setItem('tfc-done',JSON.stringify([...done]))}catch(e){}};

  const pct=Math.round(done.size/FLAT.length*100);

  /* 顶栏 */
  const bar=document.createElement('header');
  bar.className='topbar';
  bar.innerHTML=`<div class="topbar-in">
    <button class="tbtn menu-btn" id="menuBtn" aria-label="目录">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg></button>
    <div class="brand">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round">
        <circle cx="6" cy="18" r="2"/><circle cx="18" cy="18" r="2"/><circle cx="12" cy="6" r="2"/>
        <path d="M7.5 17L10.6 8M13.4 8L16.5 17M8 18h8"/></svg>
      <span>Transformer 精读</span><small>· Attention Is All You Need</small>
    </div>
    <div class="sp"></div>
    <span class="prog-mini">${done.size}/${FLAT.length} · ${pct}%</span>
    <button class="tbtn" id="themeBtn"><svg id="themeIcon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M20 14.5A8.5 8.5 0 019.5 4a8.5 8.5 0 1010.5 10.5z"/></svg><span id="themeTxt">深色</span></button>
  </div>`;
  document.body.prepend(bar);

  /* 侧栏 */
  const side=document.createElement('aside');
  side.className='side'; side.id='side';
  let navHTML='<div class="side-prog"><div class="bar"><i id="pbar" style="width:'+pct+'%"></i></div>'+
    '<div class="txt"><span>学习进度</span><span id="ptxt">'+done.size+' / '+FLAT.length+'</span></div></div>';
  COURSE.forEach(g=>{
    navHTML+='<div class="part">'+g.p+'</div><nav class="nav">';
    g.items.forEach(it=>{
      navHTML+='<a href="'+it.f+'" class="'+(it.id===pageId?'on':'')+(done.has(it.id)?' done':'')+'">'+
        '<em>'+it.n+'</em><span class="t">'+it.t+'</span><span class="dot"></span></a>';
    });
    navHTML+='</nav>';
  });
  side.innerHTML=navHTML;
  const scrim=document.createElement('div'); scrim.className='scrim'; scrim.id='scrim';

  /* 包裹 */
  const doc=document.getElementById('doc');
  const layout=document.createElement('div');
  layout.className='layout';
  doc.parentNode.insertBefore(layout,doc);
  layout.appendChild(side); layout.appendChild(doc);
  document.body.appendChild(scrim);

  document.getElementById('menuBtn').onclick=()=>{side.classList.toggle('open');scrim.classList.toggle('on')};
  scrim.onclick=()=>{side.classList.remove('open');scrim.classList.remove('on')};
  document.getElementById('themeBtn').onclick=()=>setTheme(theme==='dark'?'light':'dark');
  setTheme(theme);

  /* 上一页/下一页 + 完成按钮 */
  const prev=FLAT[idx-1], next=FLAT[idx+1];
  const pager=document.createElement('div');
  pager.className='pager';
  pager.innerHTML=
    (prev?'<a href="'+prev.f+'"><div class="k">← 上一页 · '+prev.n+'</div><div class="v">'+prev.t+'</div></a>':'')+
    (next?'<a href="'+next.f+'" class="next"><div class="k">下一页 · '+next.n+' →</div><div class="v">'+next.t+'</div></a>':'');
  const isDone=done.has(pageId);
  const donebar=document.createElement('div');
  donebar.className='donebar';
  donebar.innerHTML='<button class="ctl '+(isDone?'on':'')+'" id="doneBtn">'+(isDone?'✓ 已标记学完':'标记本页为学完')+'</button>'+
    '<span class="done-tip" id="doneTip">进度保存在本地浏览器</span>';
  doc.appendChild(donebar);
  doc.appendChild(pager);
  donebar.querySelector('#doneBtn').onclick=function(){
    if(done.has(pageId)){done.delete(pageId)}else{done.add(pageId)}
    saveDone();
    const on=done.has(pageId);
    this.classList.toggle('on',on);
    this.textContent=on?'✓ 已标记学完':'标记本页为学完';
    const p=Math.round(done.size/FLAT.length*100);
    const pb=document.getElementById('pbar'), pt=document.getElementById('ptxt');
    if(pb)pb.style.width=p+'%'; if(pt)pt.textContent=done.size+' / '+FLAT.length;
    const a=side.querySelector('a.on'); if(a)a.classList.toggle('done',on);
    const pm=document.querySelector('.prog-mini'); if(pm)pm.textContent=done.size+'/'+FLAT.length+' · '+p+'%';
    document.getElementById('doneTip').textContent=on?'已完成 · 进度已更新':'已取消标记';
  };

  /* 本页小节导航 */
  const h2s=[...doc.querySelectorAll('h2')];
  if(h2s.length>2){
    h2s.forEach((h,i)=>{ if(!h.id) h.id='s'+(i+1); });
    const toc=document.createElement('nav');
    toc.className='pagetoc';
    toc.style.cssText='display:flex;flex-wrap:wrap;gap:6px;margin-top:20px';
    toc.innerHTML=h2s.map(h=>'<a href="#'+h.id+'" style="border:1px solid var(--line);background:var(--surface);padding:4px 10px;border-radius:20px;font-size:11.5px;color:var(--ink-2);text-decoration:none;border-bottom:1px solid var(--line)">'+h.textContent.replace(/^\d+\s*/,'')+'</a>').join('');
    const head=doc.querySelector('.lesson-head');
    if(head) head.appendChild(toc);
  }
})();

/* ---------- 术语提示 + 自动内链 + 页末术语索引 ---------- */
/* 把正文里第一次出现的术语自动包成可悬停的 span，实现术语互链 */
function autoLinkTerms(){
  const SHORT_OK=['dot','mask','embed','token','vector','dim'];
  const cands=Object.keys(G)
    .filter(k=>G[k].n && (G[k].n.length>=3 || SHORT_OK.includes(k)))
    .filter(k=>/^[\u4e00-\u9fa5]+$/.test(G[k].n) || /^[A-Za-z][A-Za-z\- ]*$/.test(G[k].n))
    .map(k=>({k,t:G[k].n}))
    .sort((a,b)=>b.t.length-a.t.length);
  if(!cands.length) return;
  const SKIP='a,code,pre,.def,.demo,.cite,.q,.kicker,.pill,.opt,.ex,h1,h2,h3,h4,h5,.gloss,.tb,#tip,.term,.fm,.whybox,.summary,.qp';
  const used={};
  let count=0;
  const nodes=[];
  const walk=document.createTreeWalker(document.getElementById('doc'),NodeFilter.SHOW_TEXT,null);
  let n;
  while((n=walk.nextNode())){
    if(n.nodeValue.trim().length<2) continue;
    if(n.parentElement && n.parentElement.closest(SKIP)) continue;
    nodes.push(n);
  }
  nodes.forEach(node=>{
    const text=node.nodeValue;
    const hits=[];
    cands.forEach(c=>{
      if((used[c.k]||0)>=3) return;
      let i=text.indexOf(c.t);
      if(i<0) return;
      hits.push({s:i,e:i+c.t.length,k:c.k});
    });
    if(!hits.length) return;
    hits.sort((a,b)=>a.s-b.s||(b.e-b.s)-(a.e-a.s));
    const chosen=[];
    let last=-1;
    hits.forEach(h=>{
      if(h.s>=last && (used[h.k]||0)<3){chosen.push(h);last=h.e;used[h.k]=(used[h.k]||0)+1;}
    });
    if(!chosen.length) return;
    const frag=document.createDocumentFragment();
    let p=0;
    chosen.forEach(h=>{
      if(h.s>p) frag.appendChild(document.createTextNode(text.slice(p,h.s)));
      const sp=document.createElement('span');
      sp.className='term'; sp.dataset.t=h.k; sp.textContent=text.slice(h.s,h.e);
      frag.appendChild(sp);
      p=h.e; count++;
    });
    if(p<text.length) frag.appendChild(document.createTextNode(text.slice(p)));
    node.parentNode.replaceChild(frag,node);
  });
  return count;
}
(function(){
  try{ autoLinkTerms(); }catch(e){ console.warn('autolink',e); }
  const tip=document.createElement('div'); tip.id='tip'; document.body.appendChild(tip);
  let cur=null;
  function show(el){
    const g=G[el.dataset.t]; if(!g||!g.n) return;
    tip.innerHTML='<b>'+g.n+' · '+g.e+'</b>'+g.d+(g.l?'<span class="loc">出现位置：'+g.l+'</span>':'');
    tip.classList.add('on');
    const r=el.getBoundingClientRect();
    tip.style.left='0px';tip.style.top='0px';
    const tw=tip.offsetWidth,th=tip.offsetHeight;
    let x=Math.min(Math.max(10,r.left+r.width/2-tw/2),innerWidth-tw-10);
    let y=r.top-th-9; if(y<8) y=r.bottom+9;
    tip.style.left=x+'px';tip.style.top=y+'px';cur=el;
  }
  function hide(){tip.classList.remove('on');cur=null;}
  document.querySelectorAll('[data-t]').forEach(el=>{
    el.setAttribute('tabindex','0');
    el.addEventListener('mouseenter',()=>show(el));
    el.addEventListener('mouseleave',hide);
    el.addEventListener('focus',()=>show(el));
    el.addEventListener('blur',hide);
    el.addEventListener('click',e=>{
      if(e.metaKey||e.ctrlKey) return;
      e.preventDefault(); show(el);
    });
  });
  document.addEventListener('scroll',()=>{if(cur)hide()},{passive:true});
  // 触屏没有 hover：点术语展开后，点空白处要能收起来
  document.addEventListener('click',e=>{
    if(!cur) return;
    if(e.target.closest('.term')||e.target.closest('#tip')) return;
    hide();
  });

  /* 页末术语索引 */
  const host=document.getElementById('termIndex');
  if(host){
    const used=[]; const seen=new Set();
    document.querySelectorAll('#doc [data-t]').forEach(el=>{
      const k=el.dataset.t;
      if(!seen.has(k) && G[k] && G[k].n){seen.add(k);used.push(k);}
    });
    if(used.length){
      host.innerHTML='<h2><span class="n">✦</span>本页术语速查</h2>'+
        '<p style="font-size:13.5px;color:var(--ink-2)">以下按出现顺序列出本页涉及的全部术语，含白话定义与论文出处。点术语可跳到总表。</p>'+
        '<dl class="gloss">'+used.map(k=>{
          const g=G[k];
          return '<div><dt><a href="p17-glossary.html#'+k+'" style="border:0;color:inherit">'+g.n+'</a><span>'+g.e+'</span><em>'+k+'</em></dt><dd>'+g.d+'</dd></div>';
        }).join('')+'</dl>';
    }
  }
})();

/* ---------- 自测 ---------- */
document.addEventListener('click',e=>{
  const o=e.target.closest('.opt'); if(!o) return;
  const q=o.closest('.qz'); if(!q||q.dataset.done) return;
  q.dataset.done='1';
  q.querySelectorAll('.opt').forEach(x=>{
    x.disabled=true;
    if(x.dataset.ok==='1') x.classList.add('ok');
  });
  if(o.dataset.ok!=='1') o.classList.add('no');
  const ex=q.querySelector('.ex'); if(ex) ex.classList.add('on');
  document.dispatchEvent(new CustomEvent('quiz:answered',{detail:{qz:q,opt:o}}));
});

/* ---------- 演示组件 ---------- */
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const mk=(t,c,h)=>{const e=document.createElement(t);if(c)e.className=c;if(h!=null)e.innerHTML=h;return e};
const NS='http://www.w3.org/2000/svg';
const sv=(t,a)=>{const e=document.createElementNS(NS,t);for(const k in a)e.setAttribute(k,a[k]);return e};
function shell(el,title,hint,body,foot){
  el.innerHTML='<div class="demo-h"><div class="t">'+
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M12 3v3M12 18v3M3 12h3M18 12h3"/><circle cx="12" cy="12" r="4"/></svg>'+
    title+'</div><span class="hint">'+(hint||'')+'</span></div><div class="demo-b">'+body+'</div>'+
    (foot?'<div class="demo-f">'+foot+'</div>':'');
}
function matHTML(rows,rl,cl,opt){
  opt=opt||{};
  const fmt=opt.fmt||(v=>Number(v).toFixed(2));
  const mx=opt.max||Math.max(...rows.flat().map(v=>Math.abs(v)))||1;
  let h='<table class="mx"><thead><tr><th></th>';
  cl.forEach(c=>h+='<th>'+c+'</th>');
  h+='</tr></thead><tbody>';
  rows.forEach((r,ri)=>{
    h+='<tr'+(opt.hot===ri?' class="hot"':'')+'>';
    h+='<th class="rh">'+(rl?rl[ri]:'')+'</th>';
    r.forEach((v,ci)=>{
      const m=opt.masked&&ci>ri;
      const a=Math.min(1,Math.abs(v)/mx);
      const bg=m?'':'background:rgba(47,91,232,'+(0.04+a*0.5).toFixed(3)+')';
      h+='<td class="'+(m?'msk':'')+'" style="'+bg+'">'+(m?'−∞':fmt(v))+'</td>';
    });
    h+='</tr>';
  });
  return h+'</tbody></table>';
}

const W={};

/* 点积 */
W.dot=function(el){
  let a=[2,1,0,3], b=[1,3,0,2];
  shell(el,'点积是怎么算出来的','拖动数值，看逐项相乘再相加',
    '<div id="dotGrid" style="display:grid;gap:8px"></div>'+
    '<div style="margin-top:14px;padding:12px 14px;border:1px solid var(--line);border-radius:9px;background:var(--surface-2);font-family:var(--mono);font-size:13px;color:var(--ink-2)" id="dotOut"></div>',
    '<span style="font-size:11.5px">点积 = 对应位置相乘后求和。方向越一致，结果越大。</span>');
  const grid=el.querySelector('#dotGrid'), out=el.querySelector('#dotOut');
  function render(){
    grid.innerHTML='';
    for(let i=0;i<4;i++){
      const row=mk('div','',`<div style="display:grid;grid-template-columns:20px 1fr 44px 1fr 44px;gap:8px;align-items:center;font-size:12px">
        <span class="mono" style="color:var(--ink-3)">${i+1}</span>
        <input type="range" min="-3" max="3" step="1" value="${a[i]}" data-i="${i}" data-k="a" style="width:100%">
        <span class="mono" style="text-align:right;color:var(--ink-2)">${a[i]}</span>
        <input type="range" min="-3" max="3" step="1" value="${b[i]}" data-i="${i}" data-k="b" style="width:100%">
        <span class="mono" style="text-align:right;color:var(--ink-2)">${b[i]}</span></div>`);
      grid.appendChild(row);
    }
    grid.querySelectorAll('input').forEach(inp=>{
      inp.oninput=()=>{const i=+inp.dataset.i;if(inp.dataset.k==='a')a[i]=+inp.value;else b[i]=+inp.value;render();};
    });
    const prods=a.map((v,i)=>v*b[i]);
    const sum=prods.reduce((x,y)=>x+y,0);
    out.innerHTML=`[${a.join(', ')}] · [${b.join(', ')}] <span style="color:var(--ink-3)">=</span> `+
      prods.map(p=>'('+p+')').join(' + ')+' <span style="color:var(--ink-3)">=</span> '+
      '<b style="color:var(--accent)">'+sum+'</b>'+
      '<div style="margin-top:6px;font-size:11.5px;color:var(--ink-3);font-family:var(--sans)">'+
      (sum>0?'两个向量方向大体一致 → 注意力里表示“相关”':sum<0?'方向相反 → 表示“不相关甚至相反”':'几乎正交 → 表示“没什么关系”')+'</div>';
  }
  render();
};

/* softmax */
W.softmax=function(el){
  let z=[2,1,0.5,0];
  const names=['词 A','词 B','词 C','词 D'];
  shell(el,'Softmax：把分数变成概率','拖动四个分数，看概率如何被指数放大',
    '<div id="smGrid" style="display:grid;gap:9px"></div>'+
    '<div id="smBars" style="margin-top:14px;display:grid;gap:6px"></div>',
    '<span style="font-size:11.5px">所有概率之和恒为 1；最高分与最低分差距越大，分布越“尖”。</span>');
  const grid=el.querySelector('#smGrid'), bars=el.querySelector('#smBars');
  function render(){
    grid.innerHTML=names.map((n,i)=>`<div style="display:grid;grid-template-columns:52px 1fr 46px;gap:9px;align-items:center;font-size:12px">
      <span style="color:var(--ink-2)">${n}</span>
      <input type="range" min="-3" max="5" step="0.5" value="${z[i]}" data-i="${i}" style="width:100%">
      <span class="mono" style="text-align:right;color:var(--ink-2)">${z[i].toFixed(1)}</span></div>`).join('');
    grid.querySelectorAll('input').forEach(inp=>{inp.oninput=()=>{z[+inp.dataset.i]=+inp.value;render();};});
    const ex=z.map(v=>Math.exp(v)), s=ex.reduce((x,y)=>x+y,0), p=ex.map(v=>v/s);
    bars.innerHTML=p.map((v,i)=>`<div class="bar-row"><div class="nm">${names[i]}</div>
      <div class="tr2"><div class="fl" style="width:${(v*100).toFixed(1)}%"></div></div>
      <div class="pc">${(v*100).toFixed(1)}%</div></div>`).join('');
  }
  render();
};

/* 矩阵乘法 */
W.matmul=function(el){
  const A=[[2,0,1],[0,3,1]], B=[[1,0],[2,1],[0,2]];
  const C=[[0,0],[0,0]];
  for(let i=0;i<2;i++)for(let j=0;j<2;j++){
    let s=0;for(let k=0;k<3;k++)s+=A[i][k]*B[k][j];C[i][j]=s;
  }
  shell(el,'矩阵乘法：一行乘一列','点结果里的任意格子，看它是怎么来的',
    '<div class="mat-wrap">'+
      '<div class="matbox"><div class="mt2">A（2×3）</div>'+matHTML(A,['行1','行2'],['k1','k2','k3'],{fmt:v=>v.toFixed(0)})+'</div>'+
      '<div style="display:grid;place-items:center;color:var(--ink-3);font-size:18px">×</div>'+
      '<div class="matbox"><div class="mt2">B（3×2）</div>'+matHTML(B,['k1','k2','k3'],['列1','列2'],{fmt:v=>v.toFixed(0)})+'</div>'+
      '<div style="display:grid;place-items:center;color:var(--ink-3);font-size:18px">=</div>'+
      '<div class="matbox"><div class="mt2">C（2×2）</div><div id="cmx"></div></div>'+
    '</div><div class="steptext" id="mmOut">A 的行与 B 的列做点积，结果填进 C。</div>',
    '<span style="font-size:11.5px">形状规则：(2×3)·(3×2)=(2×2)，中间那个 3 必须相同。</span>');
  const cmx=el.querySelector('#cmx'), out=el.querySelector('#mmOut');
  function draw(sel){
    let h='<table class="mx"><tbody>';
    for(let i=0;i<2;i++){
      h+='<tr>';
      for(let j=0;j<2;j++){
        const on=sel&&sel[0]===i&&sel[1]===j;
        h+='<td data-i="'+i+'" data-j="'+j+'" style="cursor:pointer;'+(on?'background:var(--accent-soft);border-color:var(--accent);font-weight:600':'')+'">'+C[i][j]+'</td>';
      }
      h+='</tr>';
    }
    cmx.innerHTML=h+'</tbody></table>';
    cmx.querySelectorAll('td').forEach(td=>{
      td.onclick=()=>{
        const i=+td.dataset.i,j=+td.dataset.j;draw([i,j]);
        out.innerHTML='<b>C['+(i+1)+']['+(j+1)+']</b> = A 第 '+(i+1)+' 行 · B 第 '+(j+1)+' 列 = '+
          '<code>['+A[i].join(', ')+'] · ['+B.map(r=>r[j]).join(', ')+']</code> = '+
          A[i].map((v,k)=>'('+v+'×'+B[k][j]+')').join(' + ')+' = <b>'+C[i][j]+'</b>';
      };
    });
  }
  draw();
};

/* 注意力弧线 */
function attnCore(host,tokens,focus,rows,capText){
  host.innerHTML='<div class="attn-stage"><svg class="attn-svg"></svg><div class="attn-row"></div></div>'+
    '<div class="bars"></div>'+(capText?'<div style="font-size:12px;color:var(--ink-3);margin-top:10px;line-height:1.7">'+capText+'</div>':'');
  const stage=host.querySelector('.attn-stage'), svg=host.querySelector('.attn-svg'),
        row=host.querySelector('.attn-row'), bars=host.querySelector('.bars');
  const n=tokens.length;
  const Wm=tokens.map((_,i)=>{
    const a=new Array(n).fill(0.05);
    (rows[i]||[]).forEach(([j,w])=>a[j]=w);
    const s=a.reduce((x,y)=>x+y,0);return a.map(v=>v/s);
  });
  let cur=focus;
  const chips=tokens.map((t,i)=>{
    const c=mk('button','tk',t+'<sup>'+i+'</sup>');
    c.onclick=()=>{cur=i;paint();};
    row.appendChild(c);return c;
  });
  function paint(){
    chips.forEach((c,i)=>{c.classList.toggle('sel',i===cur);c.classList.toggle('hit',i!==cur&&Wm[cur][i]>0.12);});
    svg.innerHTML='';
    const sr=stage.getBoundingClientRect();
    const pt=chips.map(c=>{const r=c.getBoundingClientRect();return{x:r.left-sr.left+r.width/2,y:r.top-sr.top};});
    Wm[cur].map((w,i)=>({w,i})).filter(o=>o.i!==cur&&o.w>0.06).sort((a,b)=>a.w-b.w).forEach(o=>{
      const a=pt[cur],b=pt[o.i],dx=Math.abs(b.x-a.x);
      const cy=Math.max(4,Math.min(a.y,b.y)-(14+dx*0.24));
      svg.appendChild(sv('path',{d:'M'+a.x+' '+a.y+' Q'+((a.x+b.x)/2)+' '+cy+' '+b.x+' '+b.y,
        fill:'none',stroke:'var(--accent)','stroke-width':(1+o.w*9).toFixed(2),
        'stroke-opacity':Math.min(.95,.14+o.w*.85).toFixed(2),'stroke-linecap':'round'}));
      svg.appendChild(sv('circle',{cx:b.x,cy:b.y,r:2.1,fill:'var(--accent)',opacity:Math.min(1,.25+o.w*1.5)}));
    });
    bars.innerHTML=Wm[cur].map((w,i)=>({w,i})).sort((a,b)=>b.w-a.w).slice(0,5)
      .map(o=>'<div class="bar-row"><div class="nm">'+tokens[o.i]+(o.i===cur?'（自己）':'')+'</div>'+
        '<div class="tr2"><div class="fl" style="width:'+(o.w*100).toFixed(1)+'%"></div></div>'+
        '<div class="pc">'+(o.w*100).toFixed(1)+'%</div></div>').join('');
  }
  paint();
  window.addEventListener('resize',()=>{if(document.body.contains(host))paint();});
  return paint;
}
W.attn=function(el){
  shell(el,'注意力权重：谁在看谁','点任意一个词','<div class="host"></div>',
    '<span style="font-size:11.5px">线条越粗 = 权重越大。注意力权重是模型自己学出来的，不是人工规则。</span>');
  attnCore(el.querySelector('.host'),['小猫','坐在','垫子','上','，','它','很','困'],5,{
    0:[[5,.45],[7,.2]],1:[[2,.5],[3,.14]],2:[[3,.42],[1,.28]],3:[[2,.5]],
    4:[[5,.35],[7,.25]],5:[[0,.62],[2,.12]],6:[[7,.5],[5,.25]],7:[[6,.45],[0,.3],[5,.15]]
  });
};
W.attn2=function(el){
  shell(el,'自注意力：它到底在指谁','换几个词试试','<div class="host"></div>',
    '<span style="font-size:11.5px">示意图：权重为教学构造，非论文原始可视化。</span>');
  attnCore(el.querySelector('.host'),['这只','动物','没有','过','马路','因为','它','太','累','了'],6,{
    0:[[1,.55]],1:[[0,.5],[6,.12]],3:[[4,.5]],4:[[3,.45]],5:[[6,.35],[3,.2]],
    6:[[1,.55],[0,.14]],7:[[8,.5]],8:[[7,.55],[1,.2]],9:[[8,.5]]
  },'「它」把 55% 的权重给了「动物」——这就是指代消解。');
};
/* 多头切换 */
W.heads=function(el){
  const T=['这只','动物','没有','过','马路','因为','它','太','累','了'];
  const H=[
    {n:'头 1 · 指代',r:{0:[[1,.55]],1:[[0,.5],[6,.12]],3:[[4,.5]],4:[[3,.45]],5:[[6,.35],[3,.2]],
      6:[[1,.55],[0,.14]],7:[[8,.5]],8:[[7,.55],[1,.2]],9:[[8,.5]]}},
    {n:'头 2 · 相邻',r:(()=>{const o={};for(let i=1;i<10;i++)o[i]=[[i-1,.62],[i,.2]];o[0]=[[1,.4]];return o})()},
    {n:'头 3 · 句法',r:{0:[[1,.4]],1:[[3,.35],[0,.25]],2:[[3,.45],[1,.2]],3:[[4,.6],[2,.15]],
      4:[[3,.4]],5:[[3,.2],[6,.4]],6:[[1,.3]],7:[[8,.45]],8:[[1,.35],[9,.2]],9:[[8,.4]]}}
  ];
  shell(el,'同一个句子，三个头看到三种关系','切换头，观察“它”关注点怎么变','<div class="host"></div>',
    '<div class="ctl-group" id="hdBtns" style="display:flex;gap:6px;flex-wrap:wrap"></div>'+
    '<span style="margin-left:auto;font-size:11.5px">示意数据</span>');
  const host=el.querySelector('.host'),btns=el.querySelector('#hdBtns');
  // 平均头
  const norm=(rows,i)=>{const a=new Array(T.length).fill(.05);(rows[i]||[]).forEach(([j,w])=>a[j]=w);
    const s=a.reduce((x,y)=>x+y,0);return a.map(v=>v/s);};
  const avgRows={};
  T.forEach((_,i)=>{
    const acc=new Array(T.length).fill(0);
    H.forEach(h=>norm(h.r,i).forEach((v,k)=>acc[k]+=v));
    const s=acc.reduce((x,y)=>x+y,0);
    avgRows[i]=acc.map((v,k)=>[k,v/s]);
  });
  const ALL=H.concat([{n:'三个头平均',r:avgRows}]);
  const caps=['指代头：把 55% 给了「动物」，14% 给了「这只」。',
    '相邻头：几乎只和前一个词打交道，负责局部语序。',
    '句法头：动词「过」盯着宾语「马路」，「了」盯着「累」。',
    '平均之后各种关系被混在一起——这正是单个头会丢细节、需要多头的理由。'];
  ALL.forEach((h,i)=>{
    const b=mk('button','ctl'+(i===0?' on':''),h.n);
    b.onclick=()=>{
      [...btns.children].forEach((x,k)=>x.classList.toggle('on',k===i));
      attnCore(host,T,6,h.r,caps[i]);
    };
    btns.appendChild(b);
  });
  attnCore(host,T,6,ALL[0].r,caps[0]);
};

/* 位置编码热力图 */
W.pe=function(el){
  shell(el,'正弦位置编码矩阵','横轴=位置，纵轴=维度',
    '<div style="display:grid;grid-template-columns:1fr 120px;gap:12px"><div>'+
      '<div style="border:1px solid var(--line);border-radius:8px;overflow:hidden;background:var(--surface-2)">'+
      '<canvas id="peC" style="display:block;width:100%;height:210px;cursor:crosshair"></canvas></div>'+
      '<div style="display:flex;align-items:center;gap:7px;font-size:10.5px;color:var(--ink-3);margin-top:7px;font-family:var(--mono)">'+
      '<span>−1</span><span style="flex:1;height:6px;border-radius:3px;background:linear-gradient(90deg,#3a5fbf,#f7f7f4,#c8871f)"></span><span>+1</span></div>'+
    '</div><div style="border:1px solid var(--line);border-radius:8px;padding:10px;font-size:11px;background:var(--surface)">'+
      '<div style="color:var(--ink-3);font-family:var(--mono);font-size:10px">POSITION</div><div id="peP" style="font-family:var(--mono);font-size:15px;margin-top:1px">7</div>'+
      '<div style="color:var(--ink-3);font-family:var(--mono);font-size:10px;margin-top:8px;padding-top:8px;border-top:1px solid var(--line)">DIMENSION</div><div id="peD" style="font-family:var(--mono);font-size:15px">0</div>'+
      '<div style="color:var(--ink-3);font-family:var(--mono);font-size:10px;margin-top:8px;padding-top:8px;border-top:1px solid var(--line)">VALUE</div><div id="peV" style="font-family:var(--mono);font-size:15px">—</div>'+
    '</div></div>',
    '<span style="font-size:11.5px">低维（上）变化极快，高维（下）变化极慢，512 条不同频率的波构成每个位置的“指纹”。</span>');
  const cvs=el.querySelector('#peC'), ctx=cvs.getContext('2d');
  const POS=48,DIM=40;
  const pe=(p,i)=>{const a=p/Math.pow(10000,(2*Math.floor(i/2))/512);return i%2===0?Math.sin(a):Math.cos(a);};
  let hi={p:7,d:0};
  function draw(){
    const r=cvs.getBoundingClientRect(),dpr=devicePixelRatio||1;
    cvs.width=Math.max(1,r.width*dpr);cvs.height=210*dpr;
    ctx.setTransform(dpr,0,0,dpr,0,0);
    const w=r.width/POS,h=210/DIM;
    ctx.clearRect(0,0,r.width,210);
    for(let p=0;p<POS;p++)for(let d=0;d<DIM;d++){
      const v=pe(p,d),a=Math.min(1,Math.abs(v));
      ctx.fillStyle=v>=0?'rgba(200,135,31,'+(a*.9).toFixed(3)+')':'rgba(47,91,232,'+(a*.85).toFixed(3)+')';
      ctx.fillRect(p*w,d*h,Math.ceil(w)+.5,Math.ceil(h)+.5);
    }
    if(hi){
      ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.strokeRect(hi.p*w+.5,hi.d*h+.5,w,h);
      ctx.strokeStyle='rgba(0,0,0,.5)';ctx.lineWidth=1;ctx.strokeRect(hi.p*w+.5,hi.d*h+.5,w,h);
    }
  }
  cvs.onmousemove=e=>{
    const r=cvs.getBoundingClientRect();
    const p=Math.max(0,Math.min(POS-1,Math.floor((e.clientX-r.left)/(r.width/POS))));
    const d=Math.max(0,Math.min(DIM-1,Math.floor((e.clientY-r.top)/(210/DIM))));
    hi={p,d};
    el.querySelector('#peP').textContent=p;el.querySelector('#peD').textContent=d;
    el.querySelector('#peV').textContent=pe(p,d).toFixed(3);
    draw();
  };
  cvs.onmouseleave=()=>{hi=null;draw();};
  el.querySelector('#peV').textContent=pe(7,0).toFixed(3);
  draw();
  window.addEventListener('resize',()=>{if(document.body.contains(el))draw();});
  window.addEventListener('themechange',()=>setTimeout(draw,30));
};

/* 掩码 */
W.mask=function(el){
  const toks=['The','animal',"didn't",'cross','the','street'];
  const M=[[1,.12,.06,.03,.02,.01],[.34,1,.15,.05,.03,.02],[.12,.41,1,.18,.06,.03],
           [.08,.22,.38,1,.14,.05],[.05,.11,.2,.44,1,.09],[.04,.07,.13,.29,.37,1]];
  shell(el,'因果掩码矩阵','行=当前预测位置，列=可查看位置',
    '<div class="mat-wrap"><div class="matbox" id="mkStage" style="max-width:100%"></div></div>'+
    '<div class="steptext" id="mkTxt"></div>',
    '<button class="ctl on" id="mkBtn">掩码：开</button><span style="font-size:11.5px">关闭掩码 = 训练时偷看答案</span>');
  const st=el.querySelector('#mkStage'),tx=el.querySelector('#mkTxt'),btn=el.querySelector('#mkBtn');
  let on=true;
  function render(){
    let h='<table class="mx"><thead><tr><th></th>';
    toks.forEach(t=>h+='<th>'+t+'</th>');h+='</tr></thead><tbody>';
    M.forEach((row,i)=>{
      h+='<tr><th class="rh">'+toks[i]+'</th>';
      row.forEach((v,j)=>{
        const m=on&&j>i;
        const bg=m?'':'background:rgba(47,91,232,'+(0.04+v*0.5).toFixed(3)+')';
        h+='<td class="'+(m?'msk':'')+'" style="'+bg+'">'+(m?'−∞':v.toFixed(2))+'</td>';
      });
      h+='</tr>';
    });
    st.innerHTML=h+'</tbody></table>';
    tx.innerHTML=on
      ? '灰色格子被设为 <b>−∞</b>，softmax 后权重为 0。正在预测 <code>didn&apos;t</code> 的那一行，只能看到 The、animal 和自己。'
      : '关掉掩码，整张表都能被看到——训练时这是作弊：模型直接抄到后面的答案，推理时没有答案可抄，立刻失效。';
  }
  btn.onclick=()=>{on=!on;btn.textContent='掩码：'+(on?'开':'关');btn.classList.toggle('on',on);render();};
  render();
};

/* 学习率 */
W.lr=function(el){
  shell(el,'学习率随步数变化','warmup=4000，之后按平方根倒数衰减',
    '<svg id="lrS" viewBox="0 0 700 190" style="width:100%;height:auto;display:block"></svg>',
    '<span style="font-size:11.5px">前 4000 步线性升高（热身），之后缓慢下降——这是 Transformer 训练稳定的关键之一。</span>');
  const svg=el.querySelector('#lrS');
  const Wd=700,H=190,ml=46,mr=14,mt=14,mb=26;
  const lr=s=>Math.pow(512,-0.5)*Math.min(Math.pow(s,-.5),s*Math.pow(4000,-1.5));
  const peak=lr(4000),MAX=40000;
  const X=s=>ml+(s/MAX)*(Wd-ml-mr), Y=v=>H-mb-(v/peak*.9)*(H-mt-mb);
  let d='';
  for(let s=1;s<=MAX;s+=250)d+=(s===1?'M':'L')+X(s).toFixed(1)+' '+Y(lr(s)).toFixed(1)+' ';
  const g=[];
  for(let k=0;k<=4;k++){
    const s=MAX*k/4;
    g.push('<line x1="'+X(s)+'" y1="'+mt+'" x2="'+X(s)+'" y2="'+(H-mb)+'" stroke="var(--line)"/>');
    g.push('<text x="'+X(s)+'" y="'+(H-mb+15)+'" font-size="10" fill="var(--ink-3)" text-anchor="middle" font-family="monospace">'+(s/1000)+'k</text>');
  }
  g.push('<line x1="'+ml+'" y1="'+(H-mb)+'" x2="'+(Wd-mr)+'" y2="'+(H-mb)+'" stroke="var(--line-2)"/>');
  g.push('<path d="'+d+'" fill="none" stroke="var(--accent)" stroke-width="2"/>');
  g.push('<line x1="'+X(4000)+'" y1="'+mt+'" x2="'+X(4000)+'" y2="'+(H-mb)+'" stroke="var(--warm)" stroke-dasharray="3 3"/>');
  g.push('<circle cx="'+X(4000)+'" cy="'+Y(peak)+'" r="3.5" fill="var(--accent)"/>');
  g.push('<text x="'+(X(4000)+7)+'" y="'+(Y(peak)-7)+'" font-size="10" fill="var(--ink-2)" font-family="monospace">4000 步 · 7.0e-4</text>');
  svg.innerHTML=g.join('');
};

/* BPE */
W.bpe=function(el){
  const steps=[
    {s:['l','o','w','e','s','t'],note:'从字符开始，每个字母是一个词元。'},
    {s:['l','o','w','e','s','t'],merge:[4,5],note:'统计语料里相邻对，(e,s) 出现得最多 → 合并成 es。'},
    {s:['l','o','w','es','t'],merge:[3,4],note:'继续：(es,t) 高频 → 合并成 est。'},
    {s:['l','o','w','est'],merge:[0,1],note:'(l,o) 高频 → 合并成 lo。'},
    {s:['lo','w','est'],merge:[0,1],note:'(lo,w) → low。'},
    {s:['low','est'],merge:[0,1],note:'(low,est) → lowest。整个过程永远在“合并最高频的相邻片段”。'}
  ];
  shell(el,'BPE 是怎么把词切开的','以 lowest 为例，一步步合并',
    '<div id="bpeRow" style="display:flex;gap:6px;flex-wrap:wrap;min-height:52px;align-items:center"></div>'+
    '<div class="steptext" id="bpeTxt"></div>',
    '<button class="ctl" id="bpePrev">上一步</button><button class="ctl acc" id="bpeNext">下一步</button>'+
    '<span style="margin-left:auto;font-size:11.5px" id="bpeStep">1 / 6</span>');
  let i=0;
  const row=el.querySelector('#bpeRow'),txt=el.querySelector('#bpeTxt');
  function render(){
    const st=steps[i];
    row.innerHTML=st.s.map((t,k)=>{
      const hi=st.merge&&(k===st.merge[0]||k===st.merge[1]);
      return '<span style="padding:6px 11px;border-radius:7px;font-family:var(--mono);font-size:13px;'+
        'border:1px solid '+(hi?'var(--accent)':'var(--line)')+';'+
        'background:'+(hi?'var(--accent-soft)':'var(--surface)')+';color:'+(hi?'var(--accent-ink)':'var(--ink-2)')+'">'+t+'</span>';
    }).join('');
    txt.innerHTML=st.note;
    el.querySelector('#bpeStep').textContent=(i+1)+' / '+steps.length;
    el.querySelector('#bpePrev').disabled=i===0;
    el.querySelector('#bpeNext').disabled=i===steps.length-1;
  }
  el.querySelector('#bpePrev').onclick=()=>{if(i>0){i--;render();}};
  el.querySelector('#bpeNext').onclick=()=>{if(i<steps.length-1){i++;render();}};
  render();
};

/* 解码 */
W.decode=function(el){
  const DEC=[
    {c:[['The',.72],['A',.11],['This',.06]],pick:'The'},
    {c:[['animal',.61],['dog',.14],['creature',.08]],pick:'animal'},
    {c:[["didn't",.44],['did',.21],['was',.15]],pick:"didn't"},
    {c:[['cross',.58],['go',.12],['walk',.09]],pick:'cross'},
    {c:[['the',.66],['a',.14],['this',.07]],pick:'the'},
    {c:[['street',.81],['road',.09],['way',.05]],pick:'street'},
    {c:[['because',.52],['and',.18],[',',.12]],pick:'because'},
    {c:[['it',.63],['the',.14],['she',.08]],pick:'it'},
    {c:[['was',.71],['is',.09],['had',.06]],pick:'was'},
    {c:[['too',.48],['very',.21],['so',.17]],pick:'too'},
    {c:[['tired',.69],['sleepy',.12],['scared',.08]],pick:'tired'},
    {c:[['.',.90],['and',.04],[',',.03]],pick:'.'}
  ];
  shell(el,'自回归解码：一次只生成一个词','贪心策略，每次取概率最高的词',
    '<div id="dvOut" style="display:flex;flex-wrap:wrap;gap:5px;align-items:center;min-height:42px;padding:10px;border:1px solid var(--line);border-radius:8px;background:var(--surface-2)"></div>'+
    '<div id="dvC" class="bars" style="margin-top:12px"></div>',
    '<button class="ctl" id="dvPrev">上一步</button><button class="ctl acc" id="dvNext">下一步</button>'+
    '<button class="ctl" id="dvReset">重来</button><span style="margin-left:auto;font-size:11.5px" id="dvCap"></span>');
  let cur=0;
  const out=el.querySelector('#dvOut'),c=el.querySelector('#dvC'),cap=el.querySelector('#dvCap');
  const chip=(t,g)=>'<span style="padding:3px 8px;border-radius:5px;font-size:12.5px;font-family:'+(/^[a-z]/i.test(t)?'var(--mono)':'var(--sans)')+';'+
    (g?'background:transparent;border:1px dashed var(--line-2);color:var(--ink-3)':'background:var(--accent-soft);border:1px solid var(--accent-line);color:var(--accent-ink)')+'">'+t+'</span>';
  function render(){
    const gen=DEC.slice(0,cur).map(x=>x.pick);
    out.innerHTML=chip('&lt;sos&gt;',1)+gen.map(w=>chip(w)).join('')+(cur<DEC.length?chip('?',1):'');
    if(cur<DEC.length){
      c.innerHTML=DEC[cur].c.map(([w,p],i)=>'<div class="bar-row" style="grid-template-columns:80px 1fr 40px">'+
        '<div class="nm" style="font-family:var(--mono);color:'+(i===0?'var(--accent-ink)':'var(--ink-2)')+'">'+w+'</div>'+
        '<div class="tr2"><div class="fl" style="width:'+(p*100).toFixed(0)+'%;background:'+(i===0?'var(--accent)':'var(--line-2)')+'"></div></div>'+
        '<div class="pc">'+(p*100).toFixed(0)+'%</div></div>').join('');
      cap.textContent='第 '+(cur+1)+' 步 · 已生成 '+cur+' 个词';
    }else{
      c.innerHTML='';cap.textContent='生成结束';
    }
    el.querySelector('#dvPrev').disabled=cur===0;
    el.querySelector('#dvNext').disabled=cur===DEC.length;
  }
  el.querySelector('#dvNext').onclick=()=>{if(cur<DEC.length){cur++;render();}};
  el.querySelector('#dvPrev').onclick=()=>{if(cur>0){cur--;render();}};
  el.querySelector('#dvReset').onclick=()=>{cur=0;render();};
  render();
};

/* 缩放点积注意力分步 */
W.sdpa=function(el){
  const T=['这只','动物','它'];
  const Q=[[2,0,1,0],[0,2,0,1],[1,1,1,0]];
  const K=[[1,0,1,0],[1,3,0,0],[0,0,2,0]];
  const V=[[1,0,0,2],[0,3,1,0],[2,0,0,1]];
  const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
  const S=Q.map(q=>K.map(k=>dot(q,k)));
  const SC=S.map(r=>r.map(v=>v/2));
  const sm=r=>{const e=r.map(v=>Math.exp(v)),s=e.reduce((a,b)=>a+b,0);return e.map(v=>v/s);};
  const A=SC.map(sm);
  const O=A.map(r=>V[0].map((_,d)=>r.reduce((s,w,k)=>s+w*V[k][d],0)));
  const box=(t,h)=>'<div class="matbox"><div class="mt2">'+t+'</div>'+h+'</div>';
  const steps=[
    {h:()=>[box('Q 查询 3×4',matHTML(Q,T,['d1','d2','d3','d4'])),
            box('K 键 3×4',matHTML(K,T,['d1','d2','d3','d4'])),
            box('V 值 3×4',matHTML(V,T,['d1','d2','d3','d4']))],
     t:'三个词各自乘三个矩阵，得到 <b>Q</b>（提问）、<b>K</b>（标签）、<b>V</b>（内容）。此刻它们只是三张数表，还没有任何“注意力”。'},
    {h:()=>[box('① Q·Kᵀ 得分 3×3',matHTML(S,T,T,{hot:2,fmt:v=>v.toFixed(0)}))],
     t:'每个 Query 和每个 Key 做点积。第 3 行第 2 列 = <b>4</b>：表示「它」与「动物」的匹配度最高。注意这只是一个分数，不是概率。'},
    {h:()=>[box('② 除以 √d_k = 2',matHTML(SC,T,T,{hot:2}))],
     t:'所有分数统一除以 √d<sub>k</sub>。这里 d<sub>k</sub>=4，所以除以 2。目的是把数值拉回 softmax 的“舒适区”。'},
    {h:()=>[box('③ softmax（按行，和为 1）',matHTML(A,T,T,{hot:2,max:1,fmt:v=>(v*100).toFixed(0)+'%'}))],
     t:'对每一行单独做 softmax。「它」这一行变成 <b>21% / 58% / 21%</b>：一半以上的信息将从「动物」取。这就是注意力权重。'},
    {h:()=>[box('④ 权重 × V = 输出',matHTML([O[2]],['它 →'],['d1','d2','d3','d4'],{max:2})),
            box('参与混合的三个 V',matHTML(V,T,['d1','d2','d3','d4']))],
     t:'按权重把三个 Value 加权求和。结果里最大的分量 <b>1.73</b> 主要来自「动物」——「它」的新表示已经带上了“动物”的语义。'}
  ];
  shell(el,'缩放点积注意力：五步算完','d_k = 4，所以 √d_k = 2',
    '<div class="mat-wrap" id="sdStage"></div><div class="steptext" id="sdTxt"></div>',
    '<button class="ctl" id="sdPrev">上一步</button><button class="ctl acc" id="sdNext">下一步</button>'+
    '<div class="dots" id="sdDots"></div>');
  let i=0;
  const st=el.querySelector('#sdStage'),tx=el.querySelector('#sdTxt'),dots=el.querySelector('#sdDots');
  steps.forEach(()=>dots.appendChild(mk('i')));
  function render(){
    st.innerHTML='';steps[i].h().forEach(b=>st.insertAdjacentHTML('beforeend',b));
    tx.innerHTML='<b>第 '+(i+1)+' 步</b> · '+steps[i].t;
    [...dots.children].forEach((d,k)=>d.classList.toggle('on',k===i));
    el.querySelector('#sdPrev').disabled=i===0;
    el.querySelector('#sdNext').disabled=i===steps.length-1;
  }
  el.querySelector('#sdNext').onclick=()=>{if(i<steps.length-1){i++;render();}};
  el.querySelector('#sdPrev').onclick=()=>{if(i>0){i--;render();}};
  render();
};

/* RNN 逐步 */
W.rnn=function(el){
  const toks=['这只','动物','没有','过','马路'];
  shell(el,'RNN 必须一步等一步','点“下一步”，看信息如何接力传递',
    '<div id="rnRow" style="display:flex;align-items:center;gap:4px;flex-wrap:nowrap;overflow-x:auto;padding:6px 0"></div>'+
    '<div class="steptext" id="rnTxt"></div>',
    '<button class="ctl" id="rnPrev">上一步</button><button class="ctl acc" id="rnNext">下一步</button>'+
    '<span style="margin-left:auto;font-size:11.5px" id="rnCap">t = 0 / 5</span>');
  let s=0;
  const row=el.querySelector('#rnRow'),txt=el.querySelector('#rnTxt');
  function render(){
    row.innerHTML=toks.map((t,i)=>{
      const st=i<s?'dn':i===s?'on':'';
      return '<div class="fn '+st+'" style="min-width:58px"><b>'+t+'</b>h'+(i+1)+'</div>'+
        (i<toks.length-1?'<div class="fa">→</div>':'');
    }).join('');
    if(s===0){
      txt.innerHTML='序列有 5 个词。<b>第 1 步</b>只能从第一个词开始算 h₁。';
    }else if(s<=5){
      txt.innerHTML='<b>第 '+s+' 步</b>：h'+s+' = f( h'+(s-1||'0')+' , x'+s+' )。必须等第 '+(s-1||'0')+' 步算完，才能算这一步——'+
        '<b>这就是无法并行的根源</b>。此刻已用掉 '+s+' 个串行时间步。';
    }
    el.querySelector('#rnCap').textContent='t = '+s+' / 5';
    el.querySelector('#rnPrev').disabled=s===0;
    el.querySelector('#rnNext').disabled=s===5;
  }
  el.querySelector('#rnNext').onclick=()=>{if(s<5){s++;render();}};
  el.querySelector('#rnPrev').onclick=()=>{if(s>0){s--;render();}};
  render();
};

/* 复杂度曲线 */
W.dims=function(el){
  shell(el,'计算量随句子长度增长','自注意力 O(n²·d) vs 循环 O(n·d²)',
    '<svg id="nS" viewBox="0 0 700 200" style="width:100%;height:auto;display:block"></svg>'+
    '<div class="steptext" id="nTxt" style="min-height:auto"></div>',
    '<input type="range" id="nR" min="10" max="512" step="6" value="128" style="flex:1;min-width:120px">'+
    '<span class="mono" id="nVal" style="font-size:12px;color:var(--ink-2)">n = 128</span>');
  const svg=el.querySelector('#nS'),txt=el.querySelector('#nTxt'),rng=el.querySelector('#nR');
  const Wd=700,H=200,ml=46,mr=16,mt=16,mb=28,d=512;
  const MAXN=512;
  const att=n=>n*n*d, rec=n=>n*d*d;
  const maxY=att(MAXN);
  const X=n=>ml+(n/MAXN)*(Wd-ml-mr), Y=v=>H-mb-(v/maxY)*(H-mt-mb);
  let p1='',p2='';
  for(let n=1;n<=MAXN;n+=4){
    p1+=(n===1?'M':'L')+X(n).toFixed(1)+' '+Y(att(n)).toFixed(1)+' ';
    p2+=(n===1?'M':'L')+X(n).toFixed(1)+' '+Y(rec(n)).toFixed(1)+' ';
  }
  const g=[
    '<line x1="'+ml+'" y1="'+(H-mb)+'" x2="'+(Wd-mr)+'" y2="'+(H-mb)+'" stroke="var(--line-2)"/>',
    '<line x1="'+ml+'" y1="'+mt+'" x2="'+ml+'" y2="'+(H-mb)+'" stroke="var(--line-2)"/>',
    '<path d="'+p1+'" fill="none" stroke="var(--accent)" stroke-width="2"/>',
    '<path d="'+p2+'" fill="none" stroke="var(--warm)" stroke-width="2" stroke-dasharray="5 4"/>',
    '<text x="'+ml+'" y="'+(H-mb+15)+'" font-size="10" fill="var(--ink-3)" font-family="monospace">n=1</text>',
    '<text x="'+X(256)+'" y="'+(H-mb+15)+'" font-size="10" fill="var(--ink-3)" text-anchor="middle" font-family="monospace">256</text>',
    '<text x="'+X(512)+'" y="'+(H-mb+15)+'" font-size="10" fill="var(--ink-3)" text-anchor="middle" font-family="monospace">512</text>',
    '<line x1="'+(ml+10)+'" y1="'+(mt+8)+'" x2="'+(ml+32)+'" y2="'+(mt+8)+'" stroke="var(--accent)" stroke-width="2"/>',
    '<text x="'+(ml+38)+'" y="'+(mt+12)+'" font-size="10.5" fill="var(--accent)" font-family="monospace">自注意力 O(n²·d)</text>',
    '<line x1="'+(ml+10)+'" y1="'+(mt+26)+'" x2="'+(ml+32)+'" y2="'+(mt+26)+'" stroke="var(--warm)" stroke-width="2" stroke-dasharray="4 3"/>',
    '<text x="'+(ml+38)+'" y="'+(mt+30)+'" font-size="10.5" fill="var(--warm)" font-family="monospace">循环 O(n·d²)</text>',
    '<line id="nMark" x1="'+X(128)+'" y1="'+mt+'" x2="'+X(128)+'" y2="'+(H-mb)+'" stroke="var(--ink-3)" stroke-dasharray="2 3" opacity=".5"/>'
  ];
  svg.innerHTML=g.join('');
  function upd(n){
    svg.querySelector('#nMark').setAttribute('x1',X(n));
    svg.querySelector('#nMark').setAttribute('x2',X(n));
    const a=att(n),r=rec(n);
    txt.innerHTML='当 <b>n = '+n+'</b> 时：自注意力约 <b>'+a.toExponential(1)+'</b> 次运算，循环网络约 <b>'+r.toExponential(1)+'</b> 次。'+
      (a>r?' 此时注意力更贵——但注意它的<b>串行步数是 1</b>，而循环需要 '+n+' 步。':' 此时注意力反而更便宜。');
  }
  rng.oninput=()=>{upd(+rng.value);el.querySelector('#nVal').textContent='n = '+rng.value;};
  upd(128);
};

/* 挂载 */
document.querySelectorAll('[data-w]').forEach(el=>{
  const fn=W[el.dataset.w];
  if(fn){try{fn(el)}catch(e){el.innerHTML='<div class="demo-b" style="color:var(--warm)">组件加载失败：'+e.message+'</div>';console.error(e);}}
});

/* ===== 增强模块加载器（题库 / 自测追踪 / 知识库 / AI 面板） ===== */
(function(){
  if(window.__ENHANCED_LOADED__) return;
  window.__ENHANCED_LOADED__=true;
  var ASSET_V='?v=20261104c';
  function v(src){ return src + (src.indexOf('?')<0 ? ASSET_V : ''); }
  function load(src,next){
    var s=document.createElement('script');
    s.src=v(src); s.async=false;
    s.onload=next; s.onerror=next;
    document.body.appendChild(s);
  }
  function panel(){
    if(document.getElementById('aiRoot')) return;
    var l=document.createElement('link');
    l.rel='stylesheet'; l.href=v('assets/ai-panel.css');
    document.head.appendChild(l);
    load('assets/ai-panel.js',function(){});
  }
  // 并行加载：只有 quiz.js 依赖题库，其余互不依赖
  load('assets/quiz-bank.js',function(){
    load('assets/quiz.js',function(){});
  });
  load('assets/cloud-sync.js',function(){});
  load('assets/kb.js',function(){ panel(); });
})();
