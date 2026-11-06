/* 论文原文 + 逐段拆解 · 第一部分：摘要 ~ §3.2.1 */
window.PAPER = {
  title: 'Attention Is All You Need',
  authors: 'Ashish Vaswani · Noam Shazeer · Niki Parmar · Jakob Uszkoreit · Llion Jones · Aidan N. Gomez · Łukasz Kaiser · Illia Polosukhin',
  affil: 'Google Brain · Google Research · University of Toronto',
  words: '约 8,000 词',
  sections: [

  /* ══════════ 摘要 ══════════ */
  {
    id: 'abstract', level: 2, no: '', en: 'Abstract', zh: '摘要',
    gist: '摘要只做三件事：<b>指出旧方案的结构性依赖</b>（编码器-解码器 + 循环/卷积 + 注意力）、<b>宣布去掉循环和卷积</b>、<b>给出两个任务的数字</b>。注意它没有解释为什么可行——那是正文的事。',
    items: [
      {
        en: 'The dominant sequence transduction models are based on complex recurrent or convolutional neural networks that include an encoder and a decoder. The best performing models also connect the encoder and decoder through an attention mechanism.',
        zh: '开头两句不是背景铺垫，是在<b>划定靶子</b>。它先承认现状：主流做序列转换的模型，都是"编码器 + 解码器"结构，中间夹着循环网络或卷积网络。然后补一句"表现最好的那些，还在编码器和解码器之间接了注意力"。\n\n这句话的功能是：<b>注意力在 2017 年已经是标配，不是新东西</b>。所以后面论文能主张的，只剩"把它之外的部件全部拆掉"。'
      },
      {
        en: 'We propose a new simple network architecture, the Transformer, based solely on attention mechanisms, dispensing with recurrence and convolutions entirely.',
        zh: '整篇论文的主张压缩在这一个句子里。三个关键词值得逐一看：<b>simple</b>（结构简单，只有注意力和前馈两件东西）、<b>solely</b>（只靠注意力）、<b>dispensing with</b>（彻底舍弃）。\n\n注意它舍弃的是<b>两样</b>：recurrence 和 convolution。前者是当时序列建模的默认选择，后者是当时另一条主流路线（ByteNet、ConvS2S）。一次否掉两条路线，这是这篇文章最大的赌注。'
      },
      {
        en: 'Experiments on two machine translation tasks show these models to be superior in quality while being more parallelizable and requiring significantly less time to train.',
        zh: '三个优点并列：质量更高、更可并行、训练时间显著更短。\n\n这里要留意<b>顺序</b>——"质量更高"放在最前，因为这是学术界认的硬指标；"更可并行"和"更省时间"是工程指标，放在后面作为加成。但事后看，真正改变行业的是后两个。'
      },
      {
        en: 'Our model achieves 28.4 BLEU on the WMT 2014 English-to-German translation task, improving over the existing best results, including ensembles, by over 2 BLEU.',
        zh: '28.4 BLEU，比当时最好结果（<b>包括集成模型</b>）高 2 个点以上。\n\n"including ensembles" 这半句是关键：集成模型是把多个模型的结果投票合并，通常能白拿 1～2 个点。一个单模型打赢一堆集成模型，才叫真的跨了一档。'
      },
      {
        en: 'On the WMT 2014 English-to-French translation task, our model establishes a new single-model state-of-the-art BLEU score of 41.8 after training for 3.5 days on eight GPUs, a small fraction of the training costs of the best models from the literature.',
        zh: '英法任务 41.8 BLEU，单模型新 SOTA，训练用 8 块 GPU 跑 3.5 天。\n\n"a small fraction of the training costs" 是个模糊表述，正文 Table 2 才给出具体数字：$2.3\\times10^{19}$ FLOPs，而此前的集成模型是 $1.2\\times10^{21}$，差不多是<b>五十分之一</b>。摘要里不写这个数，是因为摘要要短，也因为"五十分之一"这种话留给表格更有说服力。'
      },
      {
        en: 'We show that the Transformer generalizes well to other tasks by applying it successfully to English constituency parsing both with large and limited training data.',
        zh: '最后一句是<b>防守</b>。审稿人会问：你是不是只对翻译有效？所以补一个完全不同的任务——英语成分句法分析（把句子拆成语法树），并且强调"大数据和少数据两种情况都试了"。\n\n这是论文写作的常规动作：主战场给硬数字，顺手再打一个副战场证明通用性。'
      }
    ]
  },

  /* ══════════ 1 Introduction ══════════ */
  {
    id: 's1', level: 2, no: '1', en: 'Introduction', zh: '引言',
    gist: '引言要证明一件事：<b>循环结构本身就是瓶颈</b>，不是实现问题。四段构成一条推理链——现状是什么、瓶颈在哪、别人试过什么、我们怎么做。',
    items: [
      {
        en: 'Recurrent neural networks, long short-term memory [13] and gated recurrent [7] neural networks in particular, have been firmly established as state of the art approaches in sequence modeling and transduction problems such as language modeling and machine translation [35, 2, 5]. Numerous efforts have since continued to push the boundaries of recurrent language models and encoder-decoder architectures [38, 24, 15].',
        zh: '第一段先把对手抬到最高：RNN、LSTM、GRU 在语言建模和机器翻译上"已经牢固确立为最优方法"。\n\n这不是客套。<b>先把对手描述成最强状态，后面指出它的缺陷才有分量</b>；如果一开始就说 RNN 不行，读者会认为你在打稻草人。'
      },
      {
        en: 'Recurrent models typically factor computation along the symbol positions of the input and output sequences. Aligning the positions to steps in computation time, they generate a sequence of hidden states $h_{t}$, as a function of the previous hidden state $h_{t-1}$ and the input for position $t$. This inherently sequential nature precludes parallelization within training examples, which becomes critical at longer sequence lengths, as memory constraints limit batching across examples.',
        zh: '这是全文的技术核心批评，值得逐句拆。\n\nRNN 把计算<b>沿着位置切开</b>：算第 $t$ 个隐藏状态 $h_t$，必须等 $h_{t-1}$ 算完。这个依赖是<b>数学上的</b>，不是代码写得不好——所以叫 "inherently sequential nature"。\n\n后果有两层：一是<b>一个样本内部无法并行</b>；二是当序列变长，显存装不下那么多中间状态，连<b>跨样本的批处理</b>都受限制。第二层经常被忽略：很多人以为 RNN 慢只是慢在串行，其实慢在"连 batch 都开不大"。'
      },
      {
        en: 'Recent work has achieved significant improvements in computational efficiency through factorization tricks [21] and conditional computation [32], while also improving model performance in case of the latter. The fundamental constraint of sequential computation, however, remains.',
        zh: '这里提前挡掉一个反驳："已经有人把 RNN 加速了"。论文承认这些工作（分解技巧、条件计算）确实提升了效率，甚至提升了效果，然后一句话收掉：<b>但顺序计算这个根本约束还在</b>。\n\n这种写法在论文里叫"承认局部改进、坚持结构性问题"。它把战场从"谁更快"拉回到"结构能不能换"。'
      },
      {
        en: 'Attention mechanisms have become an integral part of compelling sequence modeling and transduction models in various tasks, allowing modeling of dependencies without regard to their distance in the input or output sequences [2, 19]. In all but a few cases [27], however, such attention mechanisms are used in conjunction with a recurrent network.',
        zh: '注意力在 2017 年已经很普遍，而且它有个天然优点：<b>不管两个词隔多远，建模依赖的代价一样</b>。\n\n但紧接着的转折才是重点：<b>几乎所有用法都是"注意力 + 循环网络"</b>，注意力只当配菜。这句话为下一段铺路——既然注意力本身不受距离影响，那为什么还要留着那个受距离影响的循环结构？'
      },
      {
        en: 'In this work we propose the Transformer, a model architecture eschewing recurrence and instead relying entirely on an attention mechanism to draw global dependencies between input and output. The Transformer allows for significantly more parallelization and can reach a new state of the art in translation quality after being trained for as little as twelve hours on eight P100 GPUs.',
        zh: '落点。三个信息：<b>去掉循环</b>、<b>完全靠注意力建立全局依赖</b>、<b>12 小时 8 块 P100 达到新 SOTA</b>。\n\n"twelve hours" 这个数字在 2017 年是震撼的——同期最好的翻译模型要训练几天到几周。它同时暗示了并行化的实际收益：不是理论上的"更可并行"，是账面上少了两个数量级的时间。'
      }
    ]
  },

  /* ══════════ 2 Background ══════════ */
  {
    id: 's2', level: 2, no: '2', en: 'Background', zh: '背景',
    gist: '这一节在划清界限：<b>别人也想过减少顺序计算，但用的是卷积</b>。差别在于"任意两个位置之间要走多远"——卷积随距离增长，自注意力是常数。',
    items: [
      {
        en: 'The goal of reducing sequential computation also forms the foundation of the Extended Neural GPU [16], ByteNet [18] and ConvS2S [9], all of which use convolutional neural networks as basic building block, computing hidden representations in parallel for all input and output positions. In these models, the number of operations required to relate signals from two arbitrary input or output positions grows in the distance between positions, linearly for ConvS2S and logarithmically for ByteNet. This makes it more difficult to learn dependencies between distant positions [12]. In the Transformer this is reduced to a constant number of operations, albeit at the cost of reduced effective resolution due to averaging attention-weighted positions, an effect we counteract with Multi-Head Attention as described in section 3.2.',
        zh: '这段信息密度很高，是整个 Background 的骨架。\n\n先承认：想减少顺序计算的不止我们，Extended Neural GPU、ByteNet、ConvS2S 都用<b>卷积</b>做基本单元，因此可以并行算所有位置。\n\n但卷积有个结构性代价：<b>要让两个位置产生联系，得靠层数堆过去</b>。ConvS2S 是线性增长，ByteNet 用膨胀卷积做到对数增长。无论哪种，距离越远越难学——这就是 "path length" 问题，第 4 节会用一张表把它量化。\n\nTransformer 把这个代价压到<b>常数</b>：任意两个位置一步可达。但它也诚实交代了代价——把注意力权重做加权平均，等于<b>降低了有效分辨率</b>（多个位置被糊在一起）。解法是多头：让不同的头各自关注不同的模式，再拼起来。'
      },
      {
        en: 'Self-attention, sometimes called intra-attention is an attention mechanism relating different positions of a single sequence in order to compute a representation of the sequence. Self-attention has been used successfully in a variety of tasks including reading comprehension, abstractive summarization, textual entailment and learning task-independent sentence representations [4, 27, 28, 22].',
        zh: '定义 self-attention：<b>在同一个序列内部</b>，让不同位置互相建立关系。区别于 encoder-decoder attention——那里 query 来自解码器、key/value 来自编码器，是"跨序列"的。\n\n然后列举它已经被用在哪些任务上。这段的作用是表明：自注意力不是我们发明的，它已有实证基础，我们只是第一次把它当成<b>唯一的</b>构件。'
      },
      {
        en: 'End-to-end memory networks are based on a recurrent attention mechanism instead of sequence-aligned recurrence and have been shown to perform well on simple-language question answering and language modeling tasks [34].',
        zh: '补一个旁支：端到端记忆网络用"循环式注意力"替代"按位置循环"，在简单语言问答上效果不错。\n\n这段看着像凑数，其实是在说：<b>"用注意力替代循环"这个念头此前已经出现过</b>，只是局限在问答任务，没有扩展到通用的序列转换。论文把自己的工作定位成这条路线的延伸，而不是凭空跳出来的发明。'
      },
      {
        en: 'To the best of our knowledge, however, the Transformer is the first transduction model relying entirely on self-attention to compute representations of its input and output without using sequence-aligned RNNs or convolution. In the following sections, we will describe the Transformer, motivate self-attention and discuss its advantages over models such as [17, 18] and [9].',
        zh: '这一句是 Background 的真正结论，也是全文的"新颖性声明"：<b>第一个完全依赖自注意力的序列转换模型</b>。措辞很小心——"to the best of our knowledge"，学术惯例，避免绝对化。\n\n注意它主张的不是"我们发明了注意力"，而是"我们是第一个把循环和卷积都拿掉的"。<b>新颖性在组合方式，不在零件</b>。这一点在第 6 节的消融实验里还要再证一次。'
      }
    ]
  },

  /* ══════════ 3 Model Architecture ══════════ */
  {
    id: 's3', level: 2, no: '3', en: 'Model Architecture', zh: '模型架构',
    gist: '整节的结构是：先给一个总体框架（编码器-解码器、自回归），然后按"一个零件一节"的顺序拆开讲。§3.1 讲堆叠方式，§3.2–3.5 讲四种零件。',
    items: [
      {
        fig: {
          src: 'fig1-architecture.png',
          alt: 'Transformer 模型架构图：左侧编码器，右侧解码器',
          cap: '<b>Figure 1（原文插图）</b>　左边是编码器：输入嵌入 + 位置编码 → 6 层（多头自注意力 + 前馈网络，每层都有残差与归一化）。右边是解码器：多一层「编码器-解码器注意力」，且自注意力带掩码（Masked）。最后经 Linear + Softmax 输出下一个词的概率。'
        }
      },
      {
        en: 'Most competitive neural sequence transduction models have an encoder-decoder structure [5, 2, 35]. Here, the encoder maps an input sequence of symbol representations $(x_{1},...,x_{n})$ to a sequence of continuous representations $\\mathbf{z}=(z_{1},...,z_{n})$. Given $\\mathbf{z}$, the decoder then generates an output sequence $(y_{1},...,y_{m})$ of symbols one element at a time. At each step the model is auto-regressive [10], consuming the previously generated symbols as additional input when generating the next.',
        zh: '先把框架定下来：<b>编码器-解码器</b>。输入是 $n$ 个符号，编码器把它们变成 $n$ 个连续向量 $\\mathbf{z}$；解码器拿着 $\\mathbf{z}$，一个一个吐出 $m$ 个符号。\n\n关键词是 <b>auto-regressive</b>（自回归）：生成第 $i$ 个词时，把前面已经生成的词也当作输入喂回去。这意味着训练时可以用"教师强制"（把正确答案喂进去，一次并行算完所有位置），但推理时必须逐个来。\n\n一个容易忽略的点：输入长度 $n$ 和输出长度 $m$ <b>可以不等</b>。翻译就是这样——中文 10 个字可能对应英文 15 个词。'
      },
      {
        en: 'The Transformer follows this overall architecture using stacked self-attention and point-wise, fully connected layers for both the encoder and decoder, shown in the left and right halves of Figure 1, respectively.',
        zh: '一句话交代：框架没变，<b>变的只是里面的零件</b>——用堆叠的自注意力和逐位置全连接层，替代原来的循环层。\n\n这也是理解全文的关键姿势：Transformer 不是一个全新物种，它是<b>把编码器-解码器里最贵的那块（循环）换掉</b>的结果。所以读后面每一节，都应该问同一个问题：这个零件替掉了原来循环层的哪项功能？'
      }
    ]
  },

  /* ══════════ 3.1 ══════════ */
  {
    id: 's3-1', level: 3, no: '3.1', en: 'Encoder and Decoder Stacks', zh: '编码器与解码器堆叠',
    gist: '编码器和解码器都是 <b>6 层堆叠</b>。每层里，每个子层外面套一个"残差 + LayerNorm"。解码器多一个子层（对编码器输出做注意力），并且多一个掩码（不能看后面）。',
    items: [
      {
        en: 'Encoder: The encoder is composed of a stack of $N=6$ identical layers. Each layer has two sub-layers. The first is a multi-head self-attention mechanism, and the second is a simple, position-wise fully connected feed-forward network. We employ a residual connection [11] around each of the two sub-layers, followed by layer normalization [1]. That is, the output of each sub-layer is $\\mathrm{LayerNorm}(x+\\mathrm{Sublayer}(x))$, where $\\mathrm{Sublayer}(x)$ is the function implemented by the sub-layer itself. To facilitate these residual connections, all sub-layers in the model, as well as the embedding layers, produce outputs of dimension $d_{\\text{model}}=512$.',
        zh: '编码器 = 6 层完全相同的结构。每层只有两个子层：<b>多头自注意力</b>（让词与词交换信息）、<b>逐位置前馈网络</b>（每个词自己加工）。\n\n每个子层外面统一套一层 <b>LayerNorm(x + Sublayer(x))</b>。这个写法可以拆成两件事：\n\n一是<b>残差</b>（$x+\\cdot$）。如果没有它，6 层叠下来，梯度在反向传播时要穿过十几层非线性变换，很容易消失。残差等于给梯度开了一条直通路。\n\n二是<b>LayerNorm</b> 放在残差<b>之后</b>。这个顺序后来被称为 Post-LN，训练时对初始化很敏感，现在的主流做法（Pre-LN）把归一化放到子层之前——这是原论文与今天实践的一个实际差异。\n\n最后一句解释为什么所有输出都是 512 维：<b>因为要相加</b>。残差要求 $x$ 和 $\\mathrm{Sublayer}(x)$ 形状一致，所以从嵌入层到每个子层，输出维度必须统一为 $d_{\\text{model}}=512$。'
      },
      {
        en: 'Decoder: The decoder is also composed of a stack of $N=6$ identical layers. In addition to the two sub-layers in each encoder layer, the decoder inserts a third sub-layer, which performs multi-head attention over the output of the encoder stack. Similar to the encoder, we employ residual connections around each of the sub-layers, followed by layer normalization. We also modify the self-attention sub-layer in the decoder stack to prevent positions from attending to subsequent positions. This masking, combined with fact that the output embeddings are offset by one position, ensures that the predictions for position $i$ can depend only on the known outputs at positions less than $i$.',
        zh: '解码器同样是 6 层，但每层有<b>三个</b>子层：自注意力、对编码器输出的交叉注意力、前馈网络。中间那个就是"读原文"的通道——query 来自解码器自己，key 和 value 来自编码器，所以每写一个词都要回头看一眼输入序列。\n\n然后是关键的 <b>masking</b>：解码器的自注意力<b>不许看后面的位置</b>。原因在训练方式——训练时整句话一次性喂进去，如果不遮挡，模型就能直接看到"下一个词是什么"，等于抄答案。\n\n实现方式是把非法位置的分数设成 $-\\infty$，softmax 之后这些位置权重变成 0。\n\n最后那个"输出嵌入偏移一位"（offset by one position）容易被漏掉：它保证位置 $i$ 的预测只能依赖 $i$ 之前<b>已经生成</b>的输出。这两件事合起来，才让训练时的并行和推理时的逐词生成在数学上等价。'
      }
    ]
  },

  /* ══════════ 3.2 ══════════ */
  {
    id: 's3-2', level: 3, no: '3.2', en: 'Attention', zh: '注意力',
    gist: '先用一句话给出注意力的抽象定义：<b>query 和一组 key-value 对，输出是 value 的加权和，权重由 query 与 key 的匹配度决定</b>。后面三小节都是这句话的具体实现。',
    items: [
      {
        en: 'An attention function can be described as mapping a query and a set of key-value pairs to an output, where the query, keys, values, and output are all vectors. The output is computed as a weighted sum of the values, where the weight assigned to each value is computed by a compatibility function of the query with the corresponding key.',
        zh: '这是全篇最重要的定义，值得逐词对应到一个具体场景。\n\n设想你在查资料：<b>query</b> 是你想找的东西（"这个词指代谁"）；<b>key</b> 是每份资料的标签；<b>value</b> 是资料内容。你先拿 query 和每个 key 比一遍相似度，得到一组分数；把分数归一化成权重；再按权重把各份 value 混起来。\n\n三个要点：<b>key 和 value 是成对的</b>（同一份资料的两个属性）；<b>权重之和为 1</b>（所以是"加权平均"而不是"加权求和"）；<b>权重来自 query 与 key 的兼容函数</b>，不是人为指定的。\n\n所谓的"兼容函数"（compatibility function）就是后面公式里的点积。整个 §3.2 就是在选这个函数、并解释为什么这么选。'
      }
    ]
  },

  /* ══════════ 3.2.1 ══════════ */
  {
    id: 's3-2-1', level: 4, no: '3.2.1', en: 'Scaled Dot-Product Attention', zh: '缩放点积注意力',
    gist: '核心公式只有一行：<b>softmax(QKᵀ/√d_k)V</b>。这一小节要回答两个"为什么"——为什么用点积而不是加性注意力，为什么要除以 √d_k。',
    items: [
      {
        fig: {
          src: 'fig2-sdpa.png',
          alt: '缩放点积注意力的计算流程',
          cap: '<b>Figure 2 左（原文插图）</b>　缩放点积注意力的数据流：MatMul（Q 与 K 点积）→ Scale（除以 $\\sqrt{d_k}$）→ Mask（可选）→ SoftMax → MatMul（乘 V）。掩码只在解码器自注意力里使用。'
        }
      },
      {
        en: 'We call our particular attention "Scaled Dot-Product Attention" (Figure 2). The input consists of queries and keys of dimension $d_{k}$, and values of dimension $d_{v}$. We compute the dot products of the query with all keys, divide each by $\\sqrt{d_{k}}$, and apply a softmax function to obtain the weights on the values.',
        zh: '把上一节的定义落到具体运算：query 和每个 key 做<b>点积</b>（得到一个标量分数），除以 $\\sqrt{d_k}$，softmax 归一化，最后对 value 加权求和。\n\n维度上有个不对称要留意：query 和 key 都是 $d_k$ 维（因为要做点积，必须同维），而 value 是 $d_v$ 维（不参与点积，可以不同）。这个区分在后面多头注意力里会用到——那里 $d_k=d_v=64$，但概念上它们是两个独立的选择。'
      },
      {
        en: 'In practice, we compute the attention function on a set of queries simultaneously, packed together into a matrix $Q$. The keys and values are also packed together into matrices $K$ and $V$. We compute the matrix of outputs as:',
        zh: '实际实现不会一个 query 一个 query 算，而是<b>打包成矩阵一次算完</b>。这一句是在说明：公式里的向量运算，落地时都是矩阵乘法——这也是它能跑得快的根本原因，因为 GPU 最擅长的就是矩阵乘法。'
      },
      {
        eq: {
          tex: '\\mathrm{Attention}(Q,K,V)=\\mathrm{softmax}\\left(\\frac{QK^{T}}{\\sqrt{d_{k}}}\\right)V',
          no: '(1)',
          cap: '公式 (1)。$QK^T$ 的形状是"序列长度 × 序列长度"，每一格是第 $i$ 个位置对第 $j$ 个位置的原始分数；除以 $\\sqrt{d_k}$ 后按<b>行</b>做 softmax（每一行加起来为 1）；再乘 $V$，得到每个位置的新表示。'
        }
      },
      {
        en: 'The two most commonly used attention functions are additive attention [2], and dot-product (multiplicative) attention. Dot-product attention is identical to our algorithm, except for the scaling factor of $\\frac{1}{\\sqrt{d_{k}}}$. Additive attention computes the compatibility function using a feed-forward network with a single hidden layer. While the two are similar in theoretical complexity, dot-product attention is much faster and more space-efficient in practice, since it can be implemented using highly optimized matrix multiplication code.',
        zh: '第一个"为什么"：<b>为什么用点积，不用加性注意力</b>。\n\n加性注意力的做法是把 query 和 key 拼起来，过一个单隐层前馈网络算分数。理论上两者复杂度同阶，但点积可以直接写成一次矩阵乘法，而矩阵乘法有几十年优化的 BLAS 库和专门的硬件。\n\n这句话的分量在于它承认：<b>选点积不是因为数学上更优，而是因为工程上更快</b>。这是深度学习论文里很典型的一种论证——理论打平的时候，实现效率决定选择。'
      },
      {
        en: 'While for small values of $d_{k}$ the two mechanisms perform similarly, additive attention outperforms dot product attention without scaling for larger values of $d_{k}$ [3]. We suspect that for large values of $d_{k}$, the dot products grow large in magnitude, pushing the softmax function into regions where it has extremely small gradients. To counteract this effect, we scale the dot products by $\\frac{1}{\\sqrt{d_{k}}}$.',
        zh: '第二个"为什么"：<b>为什么除以 $\\sqrt{d_k}$</b>。这是全文最常被问的一个细节。\n\n推理链是这样的：假设 query 和 key 的每个分量都是均值 0、方差 1 的独立随机变量，那么它们的点积（$d_k$ 项相加）方差就是 $d_k$。$d_k=64$ 时，标准差是 8——分数动不动就相差几十。\n\n而 softmax 在输入幅度很大时会<b>饱和</b>：最大的那个接近 1，其余接近 0，此时梯度几乎为零，参数学不动。除以 $\\sqrt{d_k}$ 正好把方差拉回 1。\n\n注意原文用的是 "We suspect"——它没有做严格的方差推导，只是怀疑。后来这个推导被补全了，成了标准解释。读论文时要分清：<b>哪句是证明，哪句是猜测</b>。'
      }
    ]
  }

]};
