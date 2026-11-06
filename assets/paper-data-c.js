/* 论文原文 + 逐段拆解 · 第三部分：§5 ~ 附录 */
window.PAPER.sections.push(

  /* ══════════ 5 ══════════ */
  {
    id: 's5', level: 2, no: '5', en: 'Training', zh: '训练',
    gist: '这一节是复现的关键：<b>数据、硬件、优化器、正则化</b>四件事。全部数字都给得很具体，但也留了不少空白（比如为什么 warmup 是 4000 步）。',
    items: [
      {
        en: 'This section describes the training regime for our models.',
        zh: '一句话过渡。后面四小节按"喂什么数据 → 用什么机器 → 怎么更新参数 → 怎么防过拟合"排列。'
      }
    ]
  },

  {
    id: 's5-1', level: 3, no: '5.1', en: 'Training Data and Batching', zh: '训练数据与批处理',
    gist: '两套数据、两种分词。<b>英德 450 万句对、共享词表 3.7 万</b>；<b>英法 3600 万句、词表 3.2 万</b>。批处理按长度分桶，每批约 2.5 万源 token + 2.5 万目标 token。',
    items: [
      {
        en: 'We trained on the standard WMT 2014 English-German dataset consisting of about 4.5 million sentence pairs. Sentences were encoded using byte-pair encoding [3], which has a shared source-target vocabulary of about 37000 tokens. For English-French, we used the significantly larger WMT 2014 English-French dataset consisting of 36M sentences and split tokens into a 32000 word-piece vocabulary [38]. Sentence pairs were batched together by approximate sequence length. Each training batch contained a set of sentence pairs containing approximately 25000 source tokens and 25000 target tokens.',
        zh: '四个数字要记住：<b>450 万 / 3.7 万 / 3600 万 / 3.2 万</b>。\n\n英德用 BPE 且<b>源和目标共享词表</b>——两种语言共用一张表，等于让模型在嵌入空间里天然对齐一些同源词。英法数据量大 8 倍，用 word-piece，词表反而更小（3.2 万）。\n\n<b>按长度分桶</b>（batching by approximate sequence length）是个实际工程细节：如果一批里既有 5 个词的短句又有 200 个词的长句，padding 会浪费大量算力。把长度相近的句子放在一批，浪费就小。\n\n注意批大小是按 <b>token 数</b>而不是句子数定的：每批约 25000 个源 token。这样不同长度句子的批次计算量才稳定。'
      }
    ]
  },

  {
    id: 's5-2', level: 3, no: '5.2', en: 'Hardware and Schedule', zh: '硬件与训练计划',
    gist: '一台机器、<b>8 块 P100</b>。base 每步 0.4 秒、10 万步、12 小时；big 每步 1 秒、30 万步、3.5 天。',
    items: [
      {
        en: 'We trained our models on one machine with 8 NVIDIA P100 GPUs. For our base models using the hyperparameters described throughout the paper, each training step took about 0.4 seconds. We trained the base models for a total of 100,000 steps or 12 hours. For our big models,(described on the bottom line of table 3), step time was 1.0 seconds. The big models were trained for 300,000 steps (3.5 days).',
        zh: '这一段的每个数字都能互相验证：$0.4\\text{ s}\\times100000=40000\\text{ s}\\approx11.1$ 小时，原文说 12 小时，对得上；$1.0\\times300000=300000\\text{ s}\\approx3.5$ 天，也对得上。\n\n要注意 big 模型不只是"层数更多"：它的 $d_{\\text{model}}$ 从 512 涨到 1024，$d_{ff}$ 从 2048 涨到 4096，头数从 8 涨到 16。参数量从 6500 万涨到 2.13 亿，约 3.3 倍。所以每步慢 2.5 倍、步数多 3 倍，总成本约 8 倍。\n\n"one machine with 8 P100" 这个配置在当时算不上大——同期的大模型训练动辄几十上百块卡。这正好反衬了论文的主张：<b>不是靠算力堆出来的结果，是靠结构省出来的</b>。'
      }
    ]
  },

  {
    id: 's5-3', level: 3, no: '5.3', en: 'Optimizer', zh: '优化器',
    gist: 'Adam，$\\beta_2=0.98$（不是默认的 0.999），$\\epsilon=10^{-9}$。<b>学习率先线性升到峰值，再按步数平方根倒数衰减</b>，warmup 4000 步。',
    items: [
      {
        en: 'We used the Adam optimizer [20] with $\\beta_{1}=0.9$, $\\beta_{2}=0.98$ and $\\epsilon=10^{-9}$. We varied the learning rate over the course of training, according to the formula:',
        zh: '三个超参数，两个和默认值不同：\n\n$\\beta_1=0.9$ 是默认值。$\\beta_2$ 从默认的 0.999 改成 <b>0.98</b>——二阶矩估计的窗口变短，对梯度的近期变化更敏感。在 Transformer 这种梯度方差较大的模型上，响应快一点更稳。\n\n$\\epsilon=10^{-9}$ 比默认的 $10^{-8}$ 更小，说明作者不希望这个平滑项盖住真实的小梯度。'
      },
      {
        eq: {
          tex: 'lrate=d_{\\text{model}}^{-0.5}\\cdot\\min\\left(step\\_num^{-0.5},\\ step\\_num\\cdot warmup\\_steps^{-1.5}\\right)',
          no: '',
          cap: '学习率调度。min 的两个参数对应两个阶段：前一项随步数下降（衰减），后一项随步数上升（升温）。哪一项更小就用哪一项，所以曲线是"先升后降"。'
        }
      },
      {
        en: 'This corresponds to increasing the learning rate linearly for the first $warmup\\_steps$ training steps, and decreasing it thereafter proportionally to the inverse square root of the step number. We used $warmup\\_steps=4000$.',
        zh: '把公式翻成人话：<b>前 4000 步线性升温，之后按步数的平方根倒数衰减</b>。\n\n为什么要 warmup？因为在训练初期参数是随机的，梯度方向很不稳定。如果一上来就用大学习率，一次糟糕的更新可能把参数推到很难恢复的区域。先小步走，等统计量稳定了再加速。\n\n峰值出现在 4000 步，峰值大小是 $512^{-0.5}\\times4000^{-0.5}\\approx1.1\\times10^{-3}$。这是个偏小的学习率，符合 Transformer 对初始化敏感的特点。\n\n原文没有解释为什么是 4000 步——这是调出来的经验值，不是推导结果。'
      }
    ]
  },

  {
    id: 's5-4', level: 3, no: '5.4', en: 'Regularization', zh: '正则化',
    gist: '三种：<b>残差 dropout（0.1）</b>、<b>嵌入+位置编码的 dropout</b>、<b>标签平滑（0.1）</b>。最后一种最反直觉——它主动让模型"别太自信"，困惑度变差但 BLEU 变好。',
    items: [
      {
        en: 'We employ three types of regularization during training:',
        zh: '三种手法，下面两小节讲其中两种，第一种（残差 dropout）在 5.4.1。'
      }
    ]
  },

  {
    id: 's5-4-1', level: 5, no: '5.4.1', en: 'Residual Dropout', zh: '残差 Dropout',
    gist: '在每个子层的输出<b>加回残差之前</b>做 dropout，也在"嵌入 + 位置编码"的和上做。base 模型 $P_{drop}=0.1$。',
    items: [
      {
        en: 'We apply dropout [33] to the output of each sub-layer, before it is added to the sub-layer input and normalized. In addition, we apply dropout to the sums of the embeddings and the positional encodings in both the encoder and decoder stacks. For the base model, we use a rate of $P_{drop}=0.1$.',
        zh: '位置很关键：<b>在相加和归一化之前</b>。也就是说，dropout 施加在 $\\mathrm{Sublayer}(x)$ 上，然后才是 $x+\\mathrm{Sublayer}(x)$ 过 LayerNorm。\n\n这样残差主干始终是完整的，只有子层的贡献被随机丢弃——相当于每次随机"跳过"一部分子层，起到类似集成的作用。\n\n第二处施加在"嵌入 + 位置编码"的和上。这一处容易被漏掉，但它很重要：如果位置编码不加 dropout，模型可能过度依赖精确的位置数值，泛化变差。\n\n$P_{drop}=0.1$ 是 base 的设置。big 模型用到 0.3（见 Table 3 底行），因为参数更多、更容易过拟合。'
      }
    ]
  },

  {
    id: 's5-4-2', level: 5, no: '5.4.2', en: 'Label Smoothing', zh: '标签平滑',
    gist: '把"正确答案 = 1、其他 = 0"这种硬标签，改成"正确答案 = 0.9、其余平分 0.1"。<b>困惑度变差，但准确率和 BLEU 变好</b>。',
    items: [
      {
        en: 'During training, we employed label smoothing of value $\\epsilon_{ls}=0.1$ [36]. This hurts perplexity, as the model learns to be more unsure, but improves accuracy and BLEU score.',
        zh: '标准做法是 one-hot 标签：正确词概率目标为 1，其余为 0。这要求模型把正确词的分数推到无穷大，永远不够自信。\n\n标签平滑把它改成：正确词 $1-\\epsilon=0.9$，其余 $V$ 个词平分 0.1。模型不再被逼着输出 100% 的确定，学到的分布更"软"。\n\n那句"hurts perplexity but improves accuracy and BLEU"是全段最有信息量的地方，它揭示了一个反直觉的事实：\n\n<b>困惑度衡量的是"模型预测的概率分布有多贴近真实分布"，而 BLEU 衡量的是"最终生成的句子好不好"。</b>两个指标在这里方向相反。原因在于集束搜索——分布更软时，搜索空间更平滑，更容易找到整体更好的句子。\n\n也就是说：<b>训练目标（困惑度）和任务目标（BLEU）并不一致</b>，这是机器翻译里一个长期存在的问题。'
      }
    ]
  },

  /* ══════════ 6 ══════════ */
  {
    id: 's6', level: 2, no: '6', en: 'Results', zh: '结果',
    gist: '三块证据：<b>机器翻译（打赢所有模型，包括集成）</b>、<b>消融实验（每个零件的贡献）</b>、<b>句法分析（换个任务也成立）</b>。',
    items: []
  },

  {
    id: 's6-1', level: 3, no: '6.1', en: 'Machine Translation', zh: '机器翻译',
    gist: '英德 28.4（比之前最好高 2 点以上），英法 41.8（单模型新 SOTA），训练成本只有对手的几十分之一。',
    items: [
      {
        en: 'The Transformer achieves better BLEU scores than previous state-of-the-art models on the English-to-German and English-to-French newstest2014 tests at a fraction of the training cost.',
        zh: '一句话总结，然后直接上表。'
      },
      {
        tbl: {
          title: 'Table 2 · newstest2014 上的 BLEU 与训练成本',
          head: ['模型', 'BLEU EN-DE', 'BLEU EN-FR', '成本 EN-DE (FLOPs)', '成本 EN-FR (FLOPs)'],
          rows: [
            ['ByteNet', '23.75', '—', '—', '—'],
            ['Deep-Att + PosUnk', '—', '39.2', '—', '1.0×10²⁰'],
            ['GNMT + RL', '24.6', '39.92', '2.3×10¹⁹', '1.4×10²⁰'],
            ['ConvS2S', '25.16', '40.46', '9.6×10¹⁸', '1.5×10²⁰'],
            ['MoE', '26.03', '40.56', '2.0×10¹⁹', '1.2×10²⁰'],
            ['Deep-Att + PosUnk Ensemble', '—', '40.4', '—', '8.0×10²⁰'],
            ['GNMT + RL Ensemble', '26.30', '41.16', '1.8×10²⁰', '1.1×10²¹'],
            ['ConvS2S Ensemble', '26.36', '41.29', '7.7×10¹⁹', '1.2×10²¹'],
            ['Transformer (base)', '27.3', '38.1', '3.3×10¹⁸', '—'],
            ['Transformer (big)', '28.4', '41.8', '2.3×10¹⁹', '—']
          ],
          hl: [8, 9],
          note: '看两处：base 模型 27.3 就已经超过所有单模型；big 28.4 超过所有集成模型。成本那两列更刺眼——base 的 3.3×10¹⁸ 比最贵的集成模型（1.2×10²¹）低了近三个数量级。'
        }
      },
      {
        en: 'On the WMT 2014 English-to-German translation task, the big transformer model (Transformer (big) in Table 2) outperforms the best previously reported models (including ensembles) by more than $2.0$ BLEU, establishing a new state-of-the-art BLEU score of $28.4$. The configuration of this model is listed in the bottom line of Table 3. Training took $3.5$ days on $8$ P100 GPUs. Even our base model surpasses all previously published models and ensembles, at a fraction of the training cost of any of the competitive models.',
        zh: '这里把两个成就分开说，很重要：\n\n<b>big 模型</b>：28.4，超过所有已发表模型（含集成）2 点以上。\n\n<b>base 模型</b>：27.3，也已经超过所有已发表的单模型和集成模型，而成本只有对手的一小部分。\n\n第二句其实比第一句更有分量：它意味着<b>不需要更大的模型，光靠结构变化就已经赢了</b>。这也解释了为什么这个架构能迅速扩散——中小团队用得起。'
      },
      {
        en: 'On the WMT 2014 English-to-French translation task, our big model achieves a BLEU score of $41.0$, outperforming all of the previously published single models, at less than $1/4$ the training cost of the previous state-of-the-art model. The Transformer (big) model trained for English-to-French used dropout rate $P_{drop}=0.1$, instead of $0.3$.',
        zh: '这里有个原文自身的<b>不一致</b>，值得指出：正文写 41.0，而 Table 2 和摘要都是 <b>41.8</b>。\n\n这不是我们转述错了。论文正文与表格对不上，属于排印疏漏——后来 arXiv 的多个版本都没有修正这一点。以表格和摘要为准（41.8），因为表格是实验记录，摘要是对外声明，正文这一处孤例。\n\n另外注意 dropout 从 0.3 降到 0.1：英法数据量大 8 倍（3600 万句），过拟合风险小，所以正则化可以放松。这说明超参不是固定的，而是随数据规模调整的。'
      },
      {
        en: 'For the base models, we used a single model obtained by averaging the last 5 checkpoints, which were written at 10-minute intervals. For the big models, we averaged the last 20 checkpoints. We used beam search with a beam size of $4$ and length penalty $\\alpha=0.6$ [38]. These hyperparameters were chosen after experimentation on the development set. We set the maximum output length during inference to input length + $50$, but terminate early when possible [38].',
        zh: '推理阶段的四个设置：\n\n<b>检查点平均</b>：把训练最后几个时刻的权重取平均，相当于免费做了一次小集成，通常能涨 0.5～1 BLEU。base 用最后 5 个（间隔 10 分钟），big 用最后 20 个。\n\n<b>集束搜索</b>：beam size = 4。不是每步只选概率最高的一个词，而是保留 4 条候选路径同时推进，最后选总分最高的。\n\n<b>长度惩罚</b> $\\alpha=0.6$：集束搜索天然偏好短句（概率连乘，词越少分越高），所以要除以一个随长度增长的惩罚项来抵消。\n\n<b>最大长度</b>：输入长度 + 50，但能提前结束就提前结束。'
      },
      {
        en: 'Table 2 summarizes our results and compares our translation quality and training costs to other model architectures from the literature. We estimate the number of floating point operations used to train a model by multiplying the training time, the number of GPUs used, and an estimate of the sustained single-precision floating-point capacity of each GPU.',
        zh: '最后解释成本那一列是怎么算的：<b>训练时间 × GPU 数 × 每块 GPU 的持续浮点算力</b>。\n\n这个估算方式有粗糙之处：它假设所有模型都把 GPU 跑满了，而实际上不同实现的利用率差别很大。所以表里的成本数字只能做量级比较，不能当精确值。\n\n但即便打折扣，三个数量级的差距也不可能是估算误差造成的。'
      }
    ]
  },

  {
    id: 's6-2', level: 3, no: '6.2', en: 'Model Variations', zh: '模型变体',
    gist: '逐个拆零件看贡献：<b>头数 8 最好（1 头差 0.9 BLEU，太多也掉）</b>、<b>$d_k$ 变小会掉</b>、<b>模型越大越好</b>、<b>dropout 很有用</b>、<b>位置编码换成可学习的几乎没差</b>。',
    items: [
      {
        en: 'To evaluate the importance of different components of the Transformer, we varied our base model in different ways, measuring the change in performance on English-to-German translation on the development set, newstest2013. We used beam search as described in the previous section, but no checkpoint averaging. We present these results in Table 3.',
        zh: '消融实验的规矩：在开发集（newstest2013）上做，用集束搜索，但<b>不做检查点平均</b>——因为要隔离变量，任何"免费加分"的手段都要关掉。\n\n所以 Table 3 的数字普遍比 Table 2 低（base 25.8 对 27.3），差距主要就来自检查点平均和测试集的不同。这是正常的，不要拿来互相比较。'
      },
      {
        en: 'In Table 3 rows (A), we vary the number of attention heads and the attention key and value dimensions, keeping the amount of computation constant, as described in Section 3.2.2. While single-head attention is 0.9 BLEU worse than the best setting, quality also drops off with too many heads.',
        zh: '行 (A) 的变量是头数，<b>但保持总计算量不变</b>——头数从 8 减到 1 时，单个头的维度从 64 增到 512，所以总计算量一致。\n\n结果是：<b>单头比最好的设置差 0.9 BLEU</b>（24.9 对 25.8）；头数加到 32 也掉（25.4）。\n\n这条曲线很有意思：不是"越多越好"，而是<b>8 个头附近最合适</b>。太少，多个关系挤在一个空间里互相平均；太多，每个头只有 16 维，容量不够表达。\n\n0.9 BLEU 在翻译任务上是个不小的差距——通常 0.5 就值得写进论文了。'
      },
      {
        en: 'In Table 3 rows (B), we observe that reducing the attention key size $d_{k}$ hurts model quality. This suggests that determining compatibility is not easy and that a more sophisticated compatibility function than dot product may be beneficial. We further observe in rows (C) and (D) that, as expected, bigger models are better, and dropout is very helpful in avoiding over-fitting. In row (E) we replace our sinusoidal positional encoding with learned positional embeddings [9], and observe nearly identical results to the base model.',
        zh: '行 (B)：把 $d_k$ 从 64 降到 16，BLEU 从 25.8 掉到 25.1。<b>判断"两个词有多相关"这件事，需要足够的维度才做得准。</b>\n\n作者顺势推测：既然点积不够用，也许更复杂的兼容函数会更好。这是个开放的猜想，后来的工作确实沿着这条路走了（加性偏置、双线性形式等）。\n\n行 (C)(D)：模型越大越好（N 从 2 到 8，BLEU 从 23.7 升到 25.5）；dropout 从 0 到 0.2，BLEU 从 24.6 升到 25.5，<b>提升幅度接近一层模型</b>——正则化的价值在这里被量化了。\n\n行 (E)：位置编码换成可学习的，BLEU 25.7 对 25.8，<b>几乎无差</b>。这是全文最诚实的一处消融：它等于承认正弦位置编码并非必需。'
      },
      {
        tbl: {
          title: 'Table 3（节选）· 变体在 newstest2013 上的表现',
          head: ['行', '配置变化', 'PPL (dev)', 'BLEU (dev)', '参数量 ×10⁶'],
          rows: [
            ['base', '6 层 / 512 / 2048 / 8 头', '4.92', '25.8', '65'],
            ['(A)', '1 头（单头）', '5.29', '24.9', '—'],
            ['(A)', '32 头', '5.01', '25.4', '—'],
            ['(B)', 'd_k = 16', '5.16', '25.1', '58'],
            ['(B)', 'd_k = 32', '5.01', '25.4', '60'],
            ['(C)', 'N = 2 层', '6.11', '23.7', '36'],
            ['(C)', 'N = 4 层', '5.19', '25.3', '50'],
            ['(C)', 'N = 8 层', '4.88', '25.5', '80'],
            ['(D)', 'P_drop = 0.0', '5.77', '24.6', '—'],
            ['(D)', 'P_drop = 0.2', '4.95', '25.5', '—'],
            ['(E)', '可学习位置嵌入', '4.92', '25.7', '—'],
            ['big', '6 层 / 1024 / 4096 / 16 头', '4.33', '26.4', '213']
          ],
          hl: [0, 11],
          note: '节选关键行，完整表格见 PDF 表 3。加粗两行是基准：base（中等配置）与 big（大模型）。数字说明两件事：头数有最优值，模型规模与效果单调正相关。'
        }
      }
    ]
  },

  {
    id: 's6-3', level: 3, no: '6.3', en: 'English Constituency Parsing', zh: '英语成分句法分析',
    gist: '换一个任务验证通用性：<b>把句子解析成语法树</b>。这个任务输出结构强、比输入长，而且 RNN 在小数据上一直做不好。4 层 Transformer 在两个设置下都超过了 BerkeleyParser。',
    items: [
      {
        en: 'To evaluate if the Transformer can generalize to other tasks we performed experiments on English constituency parsing. This task presents specific challenges: the output is subject to strong structural constraints and is significantly longer than the input. Furthermore, RNN sequence-to-sequence models have not been able to attain state-of-the-art results in small-data regimes [37].',
        zh: '这个任务为什么值得选？三个难点都恰到好处地<b>针对 Transformer 的弱点</b>：\n\n<b>输出有强结构约束</b>——语法树必须合法，括号要配对，不能随便生成。而 Transformer 的自回归生成没有任何结构保证。\n\n<b>输出比输入长很多</b>——一句话解析成树，token 数可能翻几倍。而自注意力的成本随长度平方增长。\n\n<b>RNN 在小数据上一直不行</b>——这既是挑战也是机会：如果 Transformer 在小数据上也行，就说明它的归纳偏置更适合这类任务。\n\n换句话说，作者挑了一个"对自己不利"的任务来验证通用性，而不是挑一个好打的。'
      },
      {
        en: 'We trained a 4-layer transformer with $d_{model}=1024$ on the Wall Street Journal (WSJ) portion of the Penn Treebank [25], about 40K training sentences. We also trained it in a semi-supervised setting, using the larger high-confidence and BerkleyParser corpora from with approximately 17M sentences [37]. We used a vocabulary of 16K tokens for the WSJ only setting and a vocabulary of 32K tokens for the semi-supervised setting.',
        zh: '两个设置：\n\n<b>只用 WSJ</b>：4 万句，词表 1.6 万。这是"小数据"场景。\n\n<b>半监督</b>：加上高置信语料和 BerkeleyParser 语料，约 1700 万句，词表 3.2 万。数据量翻了 400 倍。\n\n层数只有 4 层、$d_{model}$ 却是 1024——比翻译任务的 base 模型（6 层 512）更"矮胖"。这是个有意思的调整：句法分析的输出序列长，需要更大的表示维度承载结构信息；但层数不必多，因为句法关系不涉及很深的语义推理。'
      },
      {
        en: 'We performed only a small number of experiments to select the dropout, both attention and residual (section 5.4), learning rates and beam size on the Section 22 development set, all other parameters remained unchanged from the English-to-German base translation model. During inference, we increased the maximum output length to input length + $300$. We used a beam size of $21$ and $\\alpha=0.3$ for both WSJ only and the semi-supervised setting.',
        zh: '关键的一句是 "all other parameters remained unchanged from the English-to-German base translation model"——<b>翻译任务的超参直接被搬过来了，没为句法分析重调</b>。\n\n这是强有力的证据：不是"我们为一堆任务各自精心调参所以效果好"，而是"同一套配置换个任务照样能用"。\n\n几个针对性调整也都能解释：最大输出长度放到输入 +300（因为树的 token 数远多于句子），beam size 从 4 提到 21（结构化输出更需要搜索），长度惩罚 $\\alpha$ 从 0.6 降到 0.3（因为输出本来就长，不需要额外鼓励长句）。'
      },
      {
        tbl: {
          title: 'Table 4 · WSJ 第 23 节的 F1 分数',
          head: ['解析器', '训练设置', 'WSJ 23 F1'],
          rows: [
            ['Vinyals & Kaiser et al. (2014)', '仅 WSJ，判别式', '88.3'],
            ['Petrov et al. (2006)', '仅 WSJ，判别式', '90.4'],
            ['Zhu et al. (2013)', '仅 WSJ，判别式', '90.4'],
            ['Dyer et al. (2016)', '仅 WSJ，判别式', '91.7'],
            ['Transformer (4 层)', '仅 WSJ，判别式', '91.3'],
            ['Zhu et al. (2013)', '半监督', '91.3'],
            ['Huang & Harper (2009)', '半监督', '91.3'],
            ['McClosky et al. (2006)', '半监督', '92.1'],
            ['Vinyals & Kaiser et al. (2014)', '半监督', '92.1'],
            ['Transformer (4 层)', '半监督', '92.7'],
            ['Luong et al. (2015)', '多任务', '93.0'],
            ['Dyer et al. (2016)', '生成式', '93.3']
          ],
          hl: [4, 9],
          note: '加粗两行是本模型。小数据下 91.3，输给 Dyer 的 91.7；半监督下 92.7，超过所有同设置对手，但仍低于 Dyer 的 93.3。原文对此没有掩饰。'
        }
      },
      {
        en: 'Our results in Table 4 show that despite the lack of task-specific tuning our model performs surprisingly well, yielding better results than all previously reported models with the exception of the Recurrent Neural Network Grammar [8].',
        zh: '这句话是全篇少见的<b>明确承认失败</b>：除了 RNN Grammar（Dyer 2016，93.3），其他都赢了。\n\n注意措辞的逻辑：先强调"没有做任务特定调优"（所以潜力还没挖尽），再承认"除了一个模型"。这是把不利结果放在有利框架里，但并没有隐瞒。\n\n从研究角度看，这个结果反而更可信：如果一个模型在所有任务上都第一，通常说明实验设置有问题。'
      },
      {
        en: 'In contrast to RNN sequence-to-sequence models [37], the Transformer outperforms the BerkeleyParser [29] even when training only on the WSJ training set of 40K sentences.',
        zh: '最后一句是这段真正的重点。<b>RNN seq2seq 在小数据下打不过 BerkeleyParser</b>（一个专门为句法设计的、非神经的解析器），而 Transformer 只用 4 万句就赢了。\n\n为什么？一个合理解释是归纳偏置：RNN 必须把整句话压进一个固定长度的隐状态，序列一长就丢信息；而自注意力让每个位置直接连到所有位置，结构与结构之间不需要经过"压缩-解压"。\n\n这也呼应了 §4 的路径长度论证——在那里它是理论，在这里它变成了可观测的实验结果。'
      }
    ]
  },

  /* ══════════ 7 ══════════ */
  {
    id: 's7', level: 2, no: '7', en: 'Conclusion', zh: '结论',
    gist: '回顾主张、重申结果、指向未来。<b>未来三件事：跨模态、受限注意力、让生成更不串行</b>——后两件至今仍是活跃方向。',
    items: [
      {
        en: 'In this work, we presented the Transformer, the first sequence transduction model based entirely on attention, replacing the recurrent layers most commonly used in encoder-decoder architectures with multi-headed self-attention.',
        zh: '把主张再说一遍，用词和摘要几乎一致：<b>第一个完全基于注意力的序列转换模型</b>，用多头自注意力替换了编码器-解码器里最常见的循环层。\n\n结论段重复核心主张是学术写作的惯例——让只读摘要和结论的人也能拿到完整信息。'
      },
      {
        en: 'For translation tasks, the Transformer can be trained significantly faster than architectures based on recurrent or convolutional layers. On both WMT 2014 English-to-German and WMT 2014 English-to-French translation tasks, we achieve a new state of the art. In the former task our best model outperforms even all previously reported ensembles.',
        zh: '"trained significantly faster" 是这一句的重点。注意它没有说"效果更好"排第一，而是先说<b>训练更快</b>。\n\n这个顺序值得玩味：在作者看来，速度可能是比 BLEU 更重要的贡献。事后看这个判断是对的——BLEU 提升 2 点在两年后就被各种改进淹没了，但"可并行"这件事直接催生了预训练时代。\n\n"outperforms even all previously reported ensembles" 又强调了一次"单挑集成"，因为这是最有说服力的比较方式。'
      },
      {
        en: 'We are excited about the future of attention-based models and plan to apply them to other tasks. We plan to extend the Transformer to problems involving input and output modalities other than text and to investigate local, restricted attention mechanisms to efficiently handle large inputs and outputs such as images, audio and video. Making generation less sequential is another research goals of ours.',
        zh: '三个未来方向，事后看命中率很高：\n\n<b>跨模态</b>——"other than text"、"images, audio and video"。两年后 ViT 把 Transformer 直接用在图像上，成了视觉领域的主干。\n\n<b>受限注意力</b>——为了处理长序列，只看局部邻域。这是今天所有长上下文方案（滑动窗口、稀疏注意力、FlashAttention）的共同祖先。\n\n<b>让生成更不串行</b>——推理时逐词生成是最后一个串行瓶颈。这个方向至今没有完全解决（扩散语言模型、并行解码仍在探索）。\n\n三条预测里两条已经实现、一条仍在攻坚，这在论文的 future work 里算相当准的。'
      },
      {
        en: 'The code we used to train and evaluate our models is available at https://github.com/tensorflow/tensor2tensor.',
        zh: '代码开放在 tensor2tensor。这一句的实际影响可能被低估了：<b>可复现</b>是这个架构能在一两年内席卷整个领域的直接原因之一。\n\n对比同期很多论文只给公式不给实现，这份代码让全世界的研究者能在一周内跑起来、改起来。'
      }
    ]
  },

  /* ══════════ 附录 ══════════ */
  {
    id: 'appendix', level: 2, no: '附录', en: 'Attention Visualizations', zh: '注意力可视化',
    gist: '原文附录是三组图（Figure 3–5），用来展示不同的注意力头在做什么。本页不收图片，下面转述图注内容。',
    items: [
      {
        en: 'An example of the attention mechanism following long-distance dependencies in the encoder self-attention in layer 5 of 6. Many of the attention heads attend to a distant dependency of the verb \u2018making\u2019, completing the phrase \u2018making...more difficult\u2019. Attentions here shown only for the word \u2018making\u2019. Different colors represent different heads.',
        zh: '<b>Figure 3</b>：第 5 层（共 6 层）的编码器自注意力。句子里的 "making" 与远处某个词有强关联，把 "making ... more difficult" 这个被拆开的结构补全。不同颜色代表不同的头，可以看到有些头专门负责抓这种长距离搭配。\n\n这张图的意义：<b>路径长度 $O(1)$ 在真实数据上确实起作用</b>——第 5 层就能直接连到几十个词之外，而 RNN 要走几十步。'
      },
      {
        en: 'Two attention heads, also in layer 5 of 6, apparently involved in anaphora resolution. Top: Full attentions for head 5. Bottom: Isolated attentions from just the word \u2018its\u2019 for attention heads 5 and 6. Note that the attentions are very sharp for this word.',
        zh: '<b>Figure 4</b>：同样在第 5 层，两个头在处理<b>代词指代</b>。图的下半部分单独画了 "its" 这个词的注意力分布——非常集中（very sharp），几乎全部指向它真正指代的那个名词。\n\n"very sharp" 这个词是在强调：不是模糊地关注一片区域，而是精确锁定一个词。这为"多头各自负责不同语言现象"提供了直观证据。'
      },
      {
        en: 'Many of the attention heads exhibit behaviour that seems related to the structure of the sentence. We give two such examples in Figures 3 and 4.',
        zh: '<b>Figure 5</b>（原文此处描述的是更多头的模式）：很多头的行为看起来与句子的句法结构相关，比如有的头专门连"动词—宾语"，有的连"介词—名词"。\n\n需要保留一句怀疑：这些可视化是<b>挑出来展示的</b>，不是全部头的平均表现。论文用 "many of"、"seems related to" 这类措辞，本身就在留余地。'
      }
    ]
  }

);
