/* 论文原文 + 逐段拆解 · 第二部分：§3.2.2 ~ §4 */
window.PAPER.sections.push(

  /* ══════════ 3.2.2 ══════════ */
  {
    id: 's3-2-2', level: 4, no: '3.2.2', en: 'Multi-Head Attention', zh: '多头注意力',
    gist: '一个头只能学一种"看谁"的模式。多头的做法是<b>把 512 维切成 8 份，每份 64 维各自做注意力，再拼回 512 维</b>。关键结论：总计算量和单头全维几乎一样，但表达能力强得多。',
    items: [
      {
        fig: {
          src: 'fig2-mha.png',
          alt: '多头注意力的结构：多个注意力层并行后拼接',
          cap: '<b>Figure 2 右（原文插图）</b>　多头注意力：V、K、Q 各自经过 $h$ 组线性投影，分别进入 $h$ 个注意力层并行计算，输出拼接（Concat）后再乘 $W^O$ 得到最终结果。'
        }
      },
      {
        en: 'Instead of performing a single attention function with $d_{\\text{model}}$ -dimensional keys, values and queries, we found it beneficial to linearly project the queries, keys and values $h$ times with different, learned linear projections to $d_{k}$, $d_{k}$ and $d_{v}$ dimensions, respectively. On each of these projected versions of queries, keys and values we then perform the attention function in parallel, yielding $d_{v}$ -dimensional output values. These are concatenated and once again projected, resulting in the final values, as depicted in Figure 2.',
        zh: '流程分四步，值得按顺序过一遍：\n\n<b>一、投影</b>。用 $h$ 组不同的可学习矩阵，把 Q、K、V 各自从 512 维降到 64 维。注意是"每组一个矩阵"，所以 8 组就有 8 个 $W^Q$、8 个 $W^K$、8 个 $W^V$。\n\n<b>二、各自做注意力</b>。8 组降维后的 Q/K/V 并行跑 8 次公式 (1)，得到 8 个 64 维输出。\n\n<b>三、拼接</b>。8 个 64 维拼回 512 维。\n\n<b>四、再投影</b>。乘 $W^O$ 混合这 8 个头的信息，输出仍是 512 维。\n\n最容易问的一点：<b>为什么降维不损失信息</b>？答案是它并不"保信息"——它是<b>主动切分</b>。原来一个 512 维的空间被分成 8 个 64 维的子空间，每个子空间学一种关系（指代、相邻、句法……），而不是让所有关系挤在同一个空间里互相平均。'
      },
      {
        en: 'Multi-head attention allows the model to jointly attend to information from different representation subspaces at different positions. With a single attention head, averaging inhibits this.',
        zh: '这句解释多头为什么必要，关键词是 <b>averaging inhibits</b>（平均会抑制）。\n\n单头的情况下，softmax 输出的权重必须"摊"在所有权重上——如果一句话里同时需要关注"主语在哪"和"修饰语在哪"，单头只能在两者之间折中，得到一个模糊的平均表示。\n\n多头把这件事拆开：有的头专门盯主语，有的头专门盯修饰语，最后拼接时它们的信息是<b>并存</b>的，不是被平均掉的。'
      },
      {
        eq: {
          tex: '\\mathrm{MultiHead}(Q,K,V)=\\mathrm{Concat}(\\mathrm{head}_{1},...,\\mathrm{head}_{h})W^{O}',
          no: '',
          cap: '多头注意力的组合方式。$\\mathrm{Concat}$ 是沿特征维拼接，$W^O$ 负责把拼接后的 $h\\cdot d_v$ 维映射回 $d_{\\text{model}}$。'
        }
      },
      {
        eq: {
          tex: '\\mathrm{head}_{i}=\\mathrm{Attention}(QW_{i}^{Q},KW_{i}^{K},VW_{i}^{V})',
          no: '',
          cap: '每个头用自己的投影矩阵。下标 $i$ 表示第 $i$ 个头，八个头之间<b>不共享</b>这三个矩阵。'
        }
      },
      {
        en: 'Where the projections are parameter matrices $W^{Q}_{i}\\in\\mathbb{R}^{d_{\\text{model}}\\times d_{k}}$, $W^{K}_{i}\\in\\mathbb{R}^{d_{\\text{model}}\\times d_{k}}$, $W^{V}_{i}\\in\\mathbb{R}^{d_{\\text{model}}\\times d_{v}}$ and $W^{O}\\in\\mathbb{R}^{hd_{v}\\times d_{\\text{model}}}$.',
        zh: '把矩阵形状写清楚，是判断"参数量有没有变多"的唯一办法。\n\n单个头的投影矩阵是 $512\\times64$，8 个头合计 $8\\times512\\times64$，正好等于一个 $512\\times512$ 矩阵的参数量。输出投影 $W^O$ 是 $512\\times512$。\n\n所以<b>多头并不比单头多花参数</b>——它只是把同一个大矩阵切成了 8 块，各自独立计算，最后再合起来。这是多头设计里最巧妙的一点：能力提升，参数不变。'
      },
      {
        en: 'In this work we employ $h=8$ parallel attention layers, or heads. For each of these we use $d_{k}=d_{v}=d_{\\text{model}}/h=64$. Due to the reduced dimension of each head, the total computational cost is similar to that of single-head attention with full dimensionality.',
        zh: '参数取值：8 个头，每个头 64 维，$512/8=64$。\n\n最后一句是成本核算：因为每个头的维度降到了 1/8，而注意力的计算量随维度线性增长，所以 8 个 64 维的头加起来，<b>和 1 个 512 维的头计算量相当</b>。\n\n不过要留意一个细节：真正的计算量还包含 $QK^T$ 这一步，它的规模是 $n^2\\cdot d$。8 个头各自算 $n^2\\cdot 64$，加起来也是 $n^2\\cdot 512$，确实打平。所以"多头等于免费"这个说法基本成立——代价主要在显存和实现复杂度上。'
      }
    ]
  },

  /* ══════════ 3.2.3 ══════════ */
  {
    id: 's3-2-3', level: 4, no: '3.2.3', en: 'Applications of Attention in our Model', zh: '注意力在本模型中的三种用法',
    gist: '同一个注意力模块，在模型里被接了三处。区别只在<b>Q、K、V 从哪来</b>：都来自编码器、都来自解码器、还是 Q 来自解码器而 K/V 来自编码器。',
    items: [
      {
        en: 'The Transformer uses multi-head attention in three different ways:',
        zh: '接下来三段就是这三种接法。读的时候只需要盯一个问题：<b>谁在问，谁在答</b>。'
      },
      {
        en: 'In "encoder-decoder attention" layers, the queries come from the previous decoder layer, and the memory keys and values come from the output of the encoder. This allows every position in the decoder to attend over all positions in the input sequence. This mimics the typical encoder-decoder attention mechanisms in sequence-to-sequence models such as [38, 2, 9].',
        zh: '第一种：<b>交叉注意力</b>。query 来自解码器上一层（"我现在要写什么"），key 和 value 来自编码器输出（"原文里有什么"）。\n\n这就是"翻译"这个动作在结构上的体现：解码器每写一个词，都要回头扫一遍整个输入序列，看当前该对齐到哪。\n\n原文特意说 "This mimics the typical..."——意思是这部分没有创新，沿用了 seq2seq 里已有的做法。作者在主动划清"哪些是新的、哪些是旧的"。'
      },
      {
        en: 'The encoder contains self-attention layers. In a self-attention layer all of the keys, values and queries come from the same place, in this case, the output of the previous layer in the encoder. Each position in the encoder can attend to all positions in the previous layer of the encoder.',
        zh: '第二种：<b>编码器自注意力</b>。Q、K、V 全部来自上一层编码器的输出，所以每个位置都能看到上一层的<b>所有</b>位置，没有任何限制。\n\n这是理解原文最彻底的地方：输入序列的每个词，在第一层只知道"我自己"，到第二层已经混入了全句信息，六层之后就带着整句的上下文。所谓"理解一句话"，在机制上就是这种反复混合。'
      },
      {
        en: 'Similarly, self-attention layers in the decoder allow each position in the decoder to attend to all positions in the decoder up to and including that position. We need to prevent leftward information flow in the decoder to preserve the auto-regressive property. We implement this inside of scaled dot-product attention by masking out (setting to $-\\infty$) all values in the input of the softmax which correspond to illegal connections. See Figure 2.',
        zh: '第三种：<b>解码器自注意力（带掩码）</b>。每个位置只能看到"自己和之前"，不能看后面。\n\n"leftward information flow" 这个说法指的是信息从右边（未来）往左边（过去）流——在自回归生成里这是作弊。\n\n实现方式很直接：在 softmax 之前，把非法位置的分数设成 $-\\infty$。$e^{-\\infty}=0$，所以这些位置在归一化后权重为零，<b>完全不参与</b>。这也是为什么 softmax 里要用指数——它天然能把 $-\\infty$ 变成 0。\n\n一个实践细节：真实实现里通常填一个很大的负数（如 $-10^{9}$）而不是真无穷，避免数值运算出 NaN。'
      }
    ]
  },

  /* ══════════ 3.3 ══════════ */
  {
    id: 's3-3', level: 3, no: '3.3', en: 'Position-wise Feed-Forward Networks', zh: '逐位置前馈网络',
    gist: '就是<b>两层全连接夹一个 ReLU</b>，对每个位置独立、且用同一套参数。维度 512 → 2048 → 512。它占了模型<b>约三分之二</b>的参数，但原文只用三段话交代。',
    items: [
      {
        en: 'In addition to attention sub-layers, each of the layers in our encoder and decoder contains a fully connected feed-forward network, which is applied to each position separately and identically. This consists of two linear transformations with a ReLU activation in between.',
        zh: '两个关键词：<b>separately</b> 和 <b>identically</b>。\n\nseparately 意思是这一层<b>不做跨词通信</b>——处理第 3 个词时，完全不知道第 4 个词是什么。跨词通信全部由注意力负责。\n\nidentically 意思是<b>所有位置共用同一组权重</b>。第 1 个词和第 100 个词用的是同一个 $W_1$、$W_2$。这一点和卷积的"权重共享"是同一个思想。\n\n所以分工很清楚：<b>注意力负责横向（词与词之间）交换信息，FFN 负责纵向（每个词自己）加工信息</b>。两者交替，缺一不可。'
      },
      {
        eq: {
          tex: '\\mathrm{FFN}(x)=\\max(0,xW_{1}+b_{1})W_{2}+b_{2}',
          no: '(2)',
          cap: '公式 (2)。$\\max(0,\\cdot)$ 就是 ReLU：负数归零，正数原样通过。这一下弯折是整个模型里唯一的非线性来源——没有它，堆再多层也等价于一次线性变换。'
        }
      },
      {
        en: 'While the linear transformations are the same across different positions, they use different parameters from layer to layer. Another way of describing this is as two convolutions with kernel size 1. The dimensionality of input and output is $d_{\\text{model}}=512$, and the inner-layer has dimensionality $d_{ff}=2048$.',
        zh: '三点补充，每一点都有实际含义：\n\n<b>层与层之间参数不同</b>。同一层内所有位置共享，但第 1 层和第 2 层的 FFN 是两套完全不同的参数。\n\n<b>等价于两个 kernel size 为 1 的卷积</b>。这是个很有用的视角转换：1×1 卷积就是在每个位置上独立做一次线性变换，不做任何空间混合——正是 FFN 做的事。所以"Transformer 完全没有卷积"这个说法，在实现层面并不绝对。\n\n<b>512 → 2048 → 512</b>。中间扩张 4 倍，是全文一个固定的比例。为什么要先扩后压？一个解释是：在更高维的空间里，特征更容易被线性分开（Cover 定理），ReLU 在这个宽空间里筛掉一部分，再压回原维度。\n\n参数量算一下：$512\\times2048 + 2048\\times512 \\approx 210$ 万，而一个注意力子层约 210 万（四个 512×512 矩阵）。六层各两个，FFN 确实占了参数的大头。'
      }
    ]
  },

  /* ══════════ 3.4 ══════════ */
  {
    id: 's3-4', level: 3, no: '3.4', en: 'Embeddings and Softmax', zh: '嵌入与 Softmax',
    gist: '一段话交代三件事：<b>词怎么变成向量</b>、<b>向量怎么变回词</b>、<b>三个矩阵共享权重</b>。最后那个"乘 √d_model"是个容易被忽略的缩放技巧。',
    items: [
      {
        en: 'Similarly to other sequence transduction models, we use learned embeddings to convert the input tokens and output tokens to vectors of dimension $d_{\\text{model}}$. We also use the usual learned linear transformation and softmax function to convert the decoder output to predicted next-token probabilities. In our model, we share the same weight matrix between the two embedding layers and the pre-softmax linear transformation, similar to [30]. In the embedding layers, we multiply those weights by $\\sqrt{d_{\\text{model}}}$.',
        zh: '三件事：\n\n<b>输入侧</b>：token → 512 维向量，靠一张可学习的查找表（词表大小 × 512）。\n\n<b>输出侧</b>：解码器输出 512 维 → 词表大小的分数 → softmax → 下一个词的概率。\n\n<b>共享权重</b>：输入嵌入、输出嵌入、softmax 前的线性层，用的是<b>同一个矩阵</b>。理由是这三处本质都在做"词 ↔ 向量"的映射，共享等于把词表的表示学得更充分，同时省下大量参数（词表 37000 × 512 ≈ 1900 万，约占 base 模型 6500 万参数的三成）。\n\n<b>乘 $\\sqrt{d_{\\text{model}}}$</b>：因为位置编码要直接加在嵌入上，而位置编码的数值范围大致在 $[-1,1]$，嵌入如果太小就会被淹没。乘 $\\sqrt{512}\\approx22.6$ 是把两者拉到同一量级。这个细节原文没解释，属于"照做就行"的实现约定。'
      }
    ]
  },

  /* ══════════ 3.5 ══════════ */
  {
    id: 's3-5', level: 3, no: '3.5', en: 'Positional Encoding', zh: '位置编码',
    gist: '模型里没有循环也没有卷积，<b>天生不知道词的顺序</b>。解法是给每个位置算一组固定的正弦、余弦值，直接加到词向量上。选正弦而非可学习，是为了能外推到比训练更长的序列。',
    items: [
      {
        en: 'Since our model contains no recurrence and no convolution, in order for the model to make use of the order of the sequence, we must inject some information about the relative or absolute position of the tokens in the sequence. To this end, we add "positional encodings" to the input embeddings at the bottoms of the encoder and decoder stacks. The positional encodings have the same dimension $d_{\\text{model}}$ as the embeddings, so that the two can be summed. There are many choices of positional encodings, learned and fixed [9].',
        zh: '这段在回答一个必然会被问的问题：<b>你把顺序结构全删了，模型怎么知道词的先后</b>？\n\n答案是把位置信息<b>加</b>到词向量上。注意是加（sum），不是拼接（concat）——因为维度相同，加起来还是 512 维，不增加任何计算量。\n\n代价也要看清：相加意味着<b>词义和位置被混在同一个向量里</b>，模型必须自己学会把它们分开。这是 Transformer 一个隐含的妥协，后来的研究（如把位置信息放到注意力分数的旋转位置编码 RoPE）就是在解这个问题。\n\n最后一句承认：位置编码有很多选择，可学习的、固定的都有。这是为后文"我们也试了可学习版"埋伏笔。'
      },
      {
        en: 'In this work, we use sine and cosine functions of different frequencies:',
        zh: '接下来是具体公式。核心思想：<b>用一组不同频率的波，给每个位置打上一组独一无二的"指纹"</b>。'
      },
      {
        eq: {
          tex: 'PE_{(pos,2i)}=\\sin\\left(pos/10000^{2i/d_{\\text{model}}}\\right)',
          no: '(3)',
          cap: '偶数维用 sin。$pos$ 是位置（第几个词），$i$ 是维度序号。'
        }
      },
      {
        eq: {
          tex: 'PE_{(pos,2i+1)}=\\cos\\left(pos/10000^{2i/d_{\\text{model}}}\\right)',
          no: '(4)',
          cap: '奇数维用 cos，频率与相邻的偶数维相同。所以每两维构成一对，共用同一个波长。'
        }
      },
      {
        en: 'where $pos$ is the position and $i$ is the dimension. That is, each dimension of the positional encoding corresponds to a sinusoid. The wavelengths form a geometric progression from $2\\pi$ to $10000\\cdot 2\\pi$. We chose this function because we hypothesized it would allow the model to easily learn to attend by relative positions, since for any fixed offset $k$, $PE_{pos+k}$ can be represented as a linear function of $PE_{pos}$.',
        zh: '三个要点：\n\n<b>每个维度对应一条正弦波</b>，波长从 $2\\pi$ 到 $10000\\cdot2\\pi$ 按等比数列排开。前几维变化极快（相邻位置就差很多），后几维变化极慢（几百个位置才走完一个周期）。合起来，每个位置在 512 维上得到一个独特的组合。\n\n<b>为什么用这个函数</b>：因为对任意固定偏移 $k$，$PE_{pos+k}$ 可以写成 $PE_{pos}$ 的<b>线性函数</b>。用三角恒等式能直接验证：$\\sin(a+k)=\\sin a\\cos k+\\cos a\\sin k$，这是一次线性组合。\n\n这个性质的实际意义是：模型只要学会一个"平移 $k$ 位"的线性变换，就能处理任意距离的相对位置，而不必为每个具体距离单独学一套。<b>绝对位置编码，却带来了相对位置的能力</b>——这是设计里最漂亮的一点。\n\n注意原文用 "we hypothesized"——这是假设，不是证明。'
      },
      {
        en: 'We also experimented with using learned positional embeddings [9] instead, and found that the two versions produced nearly identical results (see Table 3 row (E)). We chose the sinusoidal version because it may allow the model to extrapolate to sequence lengths longer than the ones encountered during training.',
        zh: '诚实地报告了消融结果：可学习的位置嵌入和正弦版<b>效果几乎一样</b>（Table 3 行 E：BLEU 25.7 对 25.8）。\n\n既然一样，为什么还选正弦？理由是<b>外推</b>——正弦函数在任意长度上都有定义，而可学习嵌入在训练时没见过更长的位置就没有对应参数。\n\n这里值得留意论文的诚实度：它没有夸大正弦版的优势，而是明确说"几乎相同"，把选择理由降级为"可能会"（may allow）。这种措辞在后来的实践中也被验证了——正弦外推的实际效果并不算好，多数现代模型仍用可学习或 RoPE。'
      }
    ]
  },

  /* ══════════ 4 ══════════ */
  {
    id: 's4', level: 2, no: '4', en: 'Why Self-Attention', zh: '为什么用自注意力',
    gist: '这是全文唯一的理论辩护章节。它不比较效果，而是比较<b>三个结构指标</b>：每层计算量、最少顺序操作数、任意两点间的最长路径。结论：自注意力在路径长度上是常数，在计算量上只要 n < d 就比 RNN 省。',
    items: [
      {
        en: 'In this section we compare various aspects of self-attention layers to the recurrent and convolutional layers commonly used for mapping one variable-length sequence of symbol representations $(x_{1},...,x_{n})$ to another sequence of equal length $(z_{1},...,z_{n})$, with $x_{i},z_{i}\\in\\mathbb{R}^{d}$, such as a hidden layer in a typical sequence transduction encoder or decoder. Motivating our use of self-attention we consider three desiderata.',
        zh: '比较对象被严格限定：长度不变、维度为 $d$ 的序列到序列映射。这个限定很重要——它把"效果好不好"排除在外，只比结构性质。\n\ndesiderata 是"必要条件"的意思。作者列出三个，等于承认：<b>判断一个层好不好，就看这三条</b>。这是一种主动设定评价标准的行为，也是这一节能站住脚的原因。'
      },
      {
        en: 'One is the total computational complexity per layer. Another is the amount of computation that can be parallelized, as measured by the minimum number of sequential operations required.',
        zh: '第一条：<b>每层算多少</b>。第二条：<b>至少得串行几步</b>。\n\n第二条的度量方式很妙——它不问"能不能并行"，而问"最少需要几步串行"。一个操作如果能全并行，就是 $O(1)$；如果必须一个接一个，就是 $O(n)$。这比"是否可并行"这种二元判断精确得多。'
      },
      {
        en: 'The third is the path length between long-range dependencies in the network. Learning long-range dependencies is a key challenge in many sequence transduction tasks. One key factor affecting the ability to learn such dependencies is the length of the paths forward and backward signals have to traverse in the network. The shorter these paths between any combination of positions in the input and output sequences, the easier it is to learn long-range dependencies [12]. Hence we also compare the maximum path length between any two input and output positions in networks composed of the different layer types.',
        zh: '第三条最抽象，也确实最关键：<b>信号从位置 A 传到位置 B，要走多少步</b>。\n\n为什么路径长度重要？因为反向传播时梯度要沿着这条路走回来，每经过一次非线性变换、一次矩阵乘法，信号就衰减或失真一次。<b>路径越短，远距离依赖越容易学到</b>。\n\n这解释了 RNN 的长期困境：第 1 个词的信息要传到第 100 个词，中间要经过 99 次隐藏状态更新，梯度早就不成形了——这就是梯度消失的结构性根源，不是调参能解决的。'
      },
      {
        tbl: {
          title: 'Table 1 · 不同层的复杂度与路径长度',
          head: ['层类型', '每层复杂度', '最少顺序操作', '最长路径'],
          rows: [
            ['自注意力', 'O(n²·d)', 'O(1)', 'O(1)'],
            ['循环层', 'O(n·d²)', 'O(n)', 'O(n)'],
            ['卷积层', 'O(k·n·d²)', 'O(1)', 'O(log_k n)'],
            ['受限自注意力', 'O(r·n·d)', 'O(1)', 'O(n/r)']
          ],
          hl: [0],
          note: '$n$ 是序列长度，$d$ 是表示维度，$k$ 是卷积核大小，$r$ 是受限注意力的邻域大小。四行里只有第一行的后两列同时是常数——这就是全文的论点。'
        }
      },
      {
        en: 'As noted in Table 1, a self-attention layer connects all positions with a constant number of sequentially executed operations, whereas a recurrent layer requires $O(n)$ sequential operations. In terms of computational complexity, self-attention layers are faster than recurrent layers when the sequence length $n$ is smaller than the representation dimensionality $d$, which is most often the case with sentence representations used by state-of-the-art models in machine translations, such as word-piece [38] and byte-pair [31] representations. To improve computational performance for tasks involving very long sequences, self-attention could be restricted to considering only a neighborhood of size $r$ in the input sequence centered around the respective output position. This would increase the maximum path length to $O(n/r)$. We plan to investigate this approach further in future work.',
        zh: '这段给出一个明确的条件判断，非常值得记住：\n\n<b>自注意力比 RNN 快，当且仅当 $n < d$。</b>\n\n算一下就知道为什么：自注意力是 $O(n^2 d)$，RNN 是 $O(n d^2)$。两者相除得 $n/d$，所以 $n<d$ 时自注意力更省。\n\n代入实际数字：$d=512$，而 word-piece 一个句子通常几十到一两百个 token，$n<512$ 成立。所以对翻译任务，自注意力确实更便宜。\n\n但反过来看这条不等式也很有价值：<b>序列长度超过 512 之后，自注意力的开销开始反超</b>。这正是今天长上下文模型成本高的理论根源——也是各种稀疏注意力、线性注意力想解决的问题。\n\n最后提了受限自注意力（只看邻域 $r$）作为长序列的备选，代价是路径长度从 $O(1)$ 退到 $O(n/r)$。作者说"留待后续研究"。'
      },
      {
        en: 'A single convolutional layer with kernel width $k<n$ does not connect all pairs of input and output positions. Doing so requires a stack of $O(n/k)$ convolutional layers in the case of contiguous kernels, or $O(log_{k}(n))$ in the case of dilated convolutions [18], increasing the length of the longest paths between any two positions in the network. Convolutional layers are generally more expensive than recurrent layers, by a factor of $k$. Separable convolutions [6], however, decrease the complexity considerably, to $O(k\\cdot n\\cdot d+n\\cdot d^{2})$. Even with $k=n$, however, the complexity of a separable convolution is equal to the combination of a self-attention layer and a point-wise feed-forward layer, the approach we take in our model.',
        zh: '卷积这条线被完整算了一遍：\n\n<b>一层卷不完</b>。核宽 $k<n$ 时，两个相距很远的输入位置不被同一个输出位置看到。要连通必须堆层：连续卷积堆 $O(n/k)$ 层，膨胀卷积堆 $O(\\log_k n)$ 层。堆层又让路径变长。\n\n<b>卷积比 RNN 还贵 $k$ 倍</b>。这个结论反直觉——很多人以为卷积比循环便宜。原因是卷积要在每个位置对 $k$ 个邻域各做一次 $d\\times d$ 的乘法，所以是 $O(k\\cdot n\\cdot d^2)$，而 RNN 只有 $O(n\\cdot d^2)$。\n\n<b>可分离卷积能救回来</b>，降到 $O(knd + nd^2)$。但即便取 $k=n$，它也就等于"自注意力 + 逐位置前馈"的组合——<b>正好是本模型的结构</b>。这句话是全段的落点：卷积费尽力气优化的极限，就是这个模型的日常配置。'
      },
      {
        en: 'As side benefit, self-attention could yield more interpretable models. We inspect attention distributions from our models and present and discuss examples in the appendix. Not only do individual attention heads clearly learn to perform different tasks, many appear to exhibit behavior related to the syntactic and semantic structure of the sentences.',
        zh: '最后补一个"顺带的好处"：可解释性。\n\n注意力权重是一张"谁看谁"的矩阵，可以直接画出来。附录里的可视化显示，不同的头确实在做不同的事——有的跟踪长距离依赖（"making ... more difficult"），有的处理代词指代（"its" 指向谁）。\n\n不过这里要提醒：<b>注意力权重不等于解释</b>。后来的研究反复指出，高权重不代表该位置对输出贡献大（value 可能接近零，或者被后续层覆盖）。原文用词是 "could yield"、"appear to exhibit"，措辞相当谨慎。'
      }
    ]
  }

);
