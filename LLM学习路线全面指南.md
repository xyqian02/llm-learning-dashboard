# 🧠 大模型（LLM）学习路线全面指南

> 基于知乎高赞文章 [BugBuster喵的回答](https://www.zhihu.com/question/1909694922581321658/answer/2047663213890770071) 及全网高赞/高收藏资源整合而成，覆盖从入门到精通的完整学习路径。

---

## 📌 全文思维导图

```
🚀 大模型（LLM）学习路线
│
├── 一、🧭 认知脱盲期（基础层）
│   ├── 1. Transformer 架构（绝对底座）
│   │   ├── Self-Attention 机制（Q/K/V 矩阵维度推导）
│   │   ├── 多头注意力（MHA → MQA → GQA）
│   │   ├── 位置编码（RoPE 旋转位置编码）
│   │   ├── 前馈网络（FFN / SwiGLU）
│   │   └── 层归一化（LayerNorm → RMSNorm）
│   │
│   ├── 2. Tokenization（分词）
│   │   ├── BPE 算法原理
│   │   └── SentencePiece / Tiktoken
│   │
│   ├── 3. 主流模型演进脉络
│   │   ├── GPT 系列（GPT-1 → GPT-2 → GPT-3 → GPT-4）
│   │   ├── Llama 系列（Llama 1 → 2 → 3 → 4）
│   │   ├── 国产模型（Qwen / DeepSeek / ChatGLM）
│   │   └── MoE 架构（Mixtral / DeepSeek-V2/V3）
│   │
│   └── 4. 基础工具
│       ├── Python / PyTorch
│       ├── Hugging Face Transformers
│       └── 数学基础（线性代数 / 概率论 / 微积分）
│
├── 二、🏗️ 预训练（Pre-training）
│   ├── 1. 分布式训练技术
│   │   ├── 数据并行（DP）
│   │   ├── 张量并行（TP）
│   │   ├── 流水线并行（PP）
│   │   └── 3D 并行（DP + TP + PP）
│   │
│   ├── 2. 核心框架
│   │   ├── DeepSpeed（ZeRO-1/2/3）
│   │   └── Megatron-LM
│   │
│   ├── 3. 训练优化
│   │   ├── 混合精度训练（FP16/BF16）
│   │   ├── 梯度检查点（Gradient Checkpointing）
│   │   └── FlashAttention
│   │
│   └── 4. 数据处理
│       ├── 数据清洗（去重 / 质量过滤）
│       ├── 数据配比
│       └── 数据去毒
│
├── 三、🎯 微调（Fine-tuning）
│   ├── 1. 全参数微调（Full Fine-tuning）
│   │
│   ├── 2. 参数高效微调（PEFT）
│   │   ├── LoRA / QLoRA（核心必学）
│   │   ├── Adapter
│   │   ├── Prefix-tuning / P-tuning
│   │   └── DoRA
│   │
│   ├── 3. 指令微调（SFT）
│   │   ├── 数据构造（高质量 QA 对）
│   │   ├── 系统提示词设计
│   │   ├── 多轮对话格式
│   │   └── ⚠️ 数据质量 > 模型调参
│   │
│   ├── 4. 微调框架
│   │   ├── LLaMA-Factory（强烈推荐）
│   │   ├── Hugging Face PEFT
│   │   └── Unsloth（微调加速）
│   │
│   └── 5. 对齐技术（Alignment）
│       ├── RLHF（PPO 流程）
│       ├── DPO（直接偏好优化，工业界主流）
│       └── GRPO / DAPO（前沿方向）
│
├── 四、⚡ 推理部署（Inference & Deployment）
│   ├── 1. KV Cache 原理
│   │   ├── 自回归生成瓶颈分析
│   │   └── Cache 命中与淘汰策略
│   │
│   ├── 2. PagedAttention
│   │   └── 虚拟内存分页 → 显存管理
│   │
│   ├── 3. 推理框架
│   │   ├── vLLM（PagedAttention + Continuous Batching）
│   │   ├── TensorRT-LLM（NVIDIA 终极优化）
│   │   ├── SGLang
│   │   └── Ollama / llama.cpp（本地部署）
│   │
│   ├── 4. 量化技术
│   │   ├── PTQ（训练后量化）
│   │   ├── AWQ / GPTQ
│   │   ├── GGUF（llama.cpp）
│   │   └── FP16 → INT8 → INT4
│   │
│   └── 5. 其他加速技术
│       ├── 投机采样（Speculative Decoding）
│       └── 知识蒸馏
│
├── 五、🔧 应用层
│   ├── 1. RAG（检索增强生成）
│   │   ├── 文档解析 & 切片策略
│   │   ├── 向量化 & 向量数据库（FAISS/Milvus）
│   │   ├── 检索优化（混合检索 / 重排序）
│   │   ├── 多路召回 & 融合
│   │   └── Agentic RAG / GraphRAG
│   │
│   ├── 2. Agent（智能体）
│   │   ├── ReAct 范式
│   │   ├── Function Call / Tool Use
│   │   ├── MCP 协议（Anthropic 2024）
│   │   └── 多 Agent 协作
│   │
│   └── 3. Prompt Engineering
│       ├── CoT（思维链）/ ToT（思维树）
│       ├── ICL（上下文学习）
│       └── 解码参数调控
│
└── 六、📈 持续学习 & 职业发展
    ├── 信息源：Twitter/X / GitHub Trending / arXiv
    ├── 方法论：每周精读 1-2 篇论文 / 写技术博客
    ├── 工程能力：OOP / 设计模式 / 并发处理
    └── 业务思维：降本增效 / 产品体验 / 贴近业务
```

---

## 一、🧭 第一阶段：认知脱盲期（2-4 周）

### 1.1 核心目标

> 大模型的绝对底座是 **Transformer**。这个阶段要彻底搞明白：Token 怎么切、Attention 矩阵维度怎么变、Llama 架构里的每个细节。

### 1.2 Transformer 架构 —— 重中之重

#### 🔑 必须搞懂的核心概念

| 概念 | 要点 | 要求 |
|------|------|------|
| **Self-Attention** | Q/K/V 的物理含义、矩阵维度推导 | 能在纸上默写 Q·K^T·V 的维度变化 |
| **多头注意力（MHA）** | 为什么要多头、MHA vs MQA vs GQA 的区别 | 理解计算量和显存差异 |
| **位置编码（RoPE）** | 旋转位置编码的数学原理 | 知道为什么 Llama 用 RoPE 而非正弦编码 |
| **前馈网络（FFN）** | SwiGLU 激活函数 | 对比 ReLU/GELU 的优势 |
| **层归一化** | RMSNorm vs LayerNorm、Pre-Norm vs Post-Norm | 理解训练稳定性的影响 |

#### 🔑 Tokenization（分词）

- **BPE（Byte Pair Encoding）**：GPT 系列使用的子词分词算法
- **SentencePiece / Tiktoken**：实际使用的分词工具
- ⚠️ 传统的结巴分词在大模型时代已完全废弃，不要混用

### 1.3 主流模型演进脉络

```
2017 ─→ Transformer 提出
2018 ─→ BERT（双向编码）、GPT-1（自回归解码）
2019 ─→ GPT-2（zero-shot 能力初显）
2020 ─→ GPT-3（175B, In-Context Learning）
2022 ─→ InstructGPT / ChatGPT（RLHF）
2023 ─→ Llama 1 / Llama 2（开源浪潮）
2024 ─→ Llama 3 / Qwen2 / DeepSeek-V2（MoE）
2025 ─→ DeepSeek-V3 / Llama 4 / Qwen3
```

> 📌 **重点**：不要背论文，重点看 **Llama 系列**的技术报告。Meta 开源的 Llama 1/2/3 是工业界的"活菩萨"，把结构里的 RoPE、SwiGLU、RMSNorm 这些细节看懂。

### 1.4 🎬 神级资源推荐

| 资源 | 说明 | 链接/位置 |
|------|------|-----------|
| **Andrej Karpathy "Let's build GPT"** | OpenAI 前创始成员手搓 GPT，约 2 小时 | [YouTube](https://www.youtube.com/watch?v=kCc8FmEb1nY) / B站搜「Let's build GPT 精译」 |
| **Karpathy 中文路线图** | 完整中文注释 + 代码解读 | [GitHub: karpathy-gpt-roadmap](https://github.com/wushanchi/karpathy-gpt-roadmap) |
| **nanoGPT** | Karpathy 的教学用 GPT 实现 | [GitHub: karpathy/nanoGPT](https://github.com/karpathy/nanoGPT) |
| **李沐 "Transformer 论文精读"** | 深入理解论文细节 | B站搜「李沐 Transformer」 |
| **李宏毅 "注意力机制"** | 中文讲解，通俗易懂 | B站/YouTube |
| **3Blue1Brown "线性代数本质"** | 数学基础补充 | B站/YouTube |
| **HuggingFace Llama 源码** | 千把行代码，啃下来底气就大了一半 | [HuggingFace Transformers](https://github.com/huggingface/transformers) |

> 💡 **学习方法**：不要光看视频！要一行一行跟着敲代码。Karpathy 用的 Tiny Shakespeare 数据集只有 1MB，非常适合边看边练。

---

## 二、🏗️ 第二阶段：预训练基础（了解层面）

> 预训练是纯粹的烧钱游戏 — 几千张 H800 连跑几个月。虽然你大概率碰不到，但不能不懂。

### 2.1 分布式训练三大并行策略

| 并行策略 | 原理 | 适用场景 |
|----------|------|----------|
| **数据并行（DP）** | 每张卡持有完整模型副本，数据切分 | 模型能放入单卡时 |
| **张量并行（TP）** | 将单层权重切分到多卡 | 单层参数过大时 |
| **流水线并行（PP）** | 将不同层放到不同卡上 | 模型深度过大时 |
| **3D 并行** | DP + TP + PP 组合 | 千亿/万亿参数模型 |

### 2.2 核心框架

- **DeepSpeed（微软开源）**：ZeRO 策略是精髓
  - **ZeRO-1**：切分优化器状态
  - **ZeRO-2**：切分优化器状态 + 梯度
  - **ZeRO-3**：切分优化器状态 + 梯度 + 参数
- **Megatron-LM（NVIDIA）**：张量并行 + 流水线并行的参考实现

### 2.3 数据清洗

> 💬 "做预训练就是个高级数据清洗工加上集群运维工"

- 去重（MinHash / SimHash）
- 质量过滤（困惑度 / 分类器 / 规则）
- 数据配比（不同来源的比例分配）
- 数据去毒（去除有害/偏见内容）

### 2.4 📚 推荐资源

| 资源 | 说明 |
|------|------|
| **DeepSpeed ZeRO 论文** | `ZeRO: Memory Optimizations Toward Training Trillion Parameter Models` |
| **Megatron-LM 论文** | `Megatron-LM: Training Multi-Billion Parameter Language Models Using Model Parallelism` |
| **Scaling Laws 论文** | `Scaling Laws for Neural Language Models` (2020, OpenAI) |
| **Chinchilla 论文** | `Training Compute-Optimal Large Language Models` (2022, DeepMind) |

---

## 三、🎯 第三阶段：微调与对齐（最可能接手的工作）

### 3.1 参数高效微调（PEFT）

#### LoRA（核心必学）

- **本质**：用两个低秩矩阵 A·B 模拟全量参数更新 ΔW
- **注入位置**：通常注入到 Attention 层的 Q/K/V 投影矩阵
- **关键参数**：秩 r（通常 8-64）、alpha（缩放因子）
- **QLoRA**：LoRA + 4-bit 量化，单张 48GB GPU 可微调 65B 模型

#### 其他 PEFT 方法

| 方法 | 原理 | 特点 |
|------|------|------|
| **Adapter** | 在层间插入小型可训练模块 | 最早期的 PEFT |
| **Prefix-tuning** | 在输入前添加可学习的虚拟 Token | 适合生成任务 |
| **P-tuning** | 在 Embedding 层添加可学习参数 | 适合 NLU 任务 |
| **DoRA** | Weight-Decomposed Low-Rank Adaptation | 2024 年新方法 |

### 3.2 指令微调（SFT）实战要点

```
⚠️ 核心原则：数据质量 >>>> 模型调参

花 100 小时洗 1000 条高质量 QA 对 >> 拿 10 万条垃圾数据跑一周
```

#### SFT 数据构造要点

1. **格式规范**：统一的系统提示词 + 多轮对话结构
2. **多样性**：覆盖不同任务类型（问答/摘要/代码/推理）
3. **质量把控**：人工审查 + 自动化规则 + 模型打分
4. **常见坑**：格式错乱的脏数据混入 → 模型满嘴跑火车

### 3.3 对齐技术（Alignment）

| 方法 | 复杂度 | 当前地位 |
|------|--------|----------|
| **RLHF（PPO）** | 极高（4 个模型协同） | 理论基础，大厂在用 |
| **DPO** | 低（直接微调） | 工业界主流，中小厂首选 |
| **GRPO** | 中 | DeepSeek 采用，2025 热门 |
| **DAPO** | 中 | GRPO 改进版，2025 新方向 |

> 📌 **DPO 必读**：Stanford 2023 年论文 `Direct Preference Optimization`，把复杂的 RL 问题转化成了二分类问题，是目前工业界对齐的主流方案。

### 3.4 微调框架

| 框架 | 特点 | 推荐度 |
|------|------|--------|
| **[LLaMA-Factory](https://github.com/hiyouga/LLaMA-Factory)** | 零代码 WebUI、支持 100+ 模型、内置 vLLM | ⭐⭐⭐⭐⭐ |
| **Hugging Face PEFT** | 官方库，LoRA/QLoRA/Adapter 等完整实现 | ⭐⭐⭐⭐⭐ |
| **[Unsloth](https://github.com/unslothai/unsloth)** | 微调加速 2-5x，显存减半 | ⭐⭐⭐⭐ |
| **TRL（Transformer Reinforcement Learning）** | DPO/PPO 等对齐方法 | ⭐⭐⭐⭐ |

### 3.5 📚 推荐资源

| 资源 | 说明 |
|------|------|
| **LoRA 论文** | `LoRA: Low-Rank Adaptation of Large Language Models` (2021) |
| **QLoRA 论文** | `QLoRA: Efficient Finetuning of Quantized Language Models` (2023) |
| **DPO 论文** | `Direct Preference Optimization` (2023, Stanford) |
| **LLaMA-Factory** | [GitHub](https://github.com/hiyouga/LLaMA-Factory) — 目前最热门的中文微调框架 |
| **字节内部大模型微调实践手册** | 文中提到的内部文档，结合抖音/飞书/电商真实业务场景 |

---

## 四、⚡ 第四阶段：推理部署（工程师必备）

> 大模型推理吃资源，生成速度慢。算法工程师必须懂推理加速，不能再把部署推给工程团队。

### 4.1 KV Cache —— 推理加速的基石

- **核心问题**：自回归生成时，每个新 Token 都要重新计算所有历史 Token 的 Attention
- **KV Cache 解法**：缓存已计算过的 Key/Value 矩阵，每次只计算新 Token
- **效果**：将 O(n²) 的时间复杂度变为 O(n)

### 4.2 PagedAttention & vLLM

```
KV Cache 的显存浪费问题 → PagedAttention（虚拟内存分页管理）
                        → vLLM（PagedAttention + Continuous Batching）
```

- **PagedAttention**：把 KV Cache 分成固定大小的 "Page"，不连续存储，按需分配
- **vLLM**：当前生产环境部署的首选框架
  - Continuous Batching：动态合并请求，吞吐量提升 10x+
  - 已内置集成到 LLaMA-Factory

### 4.3 量化技术

| 方法 | 类型 | 特点 |
|------|------|------|
| **GPTQ** | PTQ | 基于 OBQ（Optimal Brain Quantization），精度高 |
| **AWQ** | PTQ | 激活感知量化，保护重要通道 |
| **GGUF** | PTQ | llama.cpp 使用，CPU/Apple Silicon 友好 |
| **BitsAndBytes** | PTQ | Hugging Face 集成，QLoRA 基础 |

> 📌 推荐使用 **AutoAWQ** 库，代码写得很清晰。

### 4.4 推理框架对比

| 框架 | 核心技术 | 适用场景 |
|------|----------|----------|
| **vLLM** | PagedAttention + Continuous Batching | 生产级在线推理，高吞吐 |
| **TensorRT-LLM** | NVIDIA 官方编译优化 | 极致性能，NVIDIA 卡专属 |
| **SGLang** | RadixAttention + 结构化生成 | 复杂 LLM 程序 |
| **llama.cpp** | GGUF 量化 + CPU 推理 | 本地部署，消费级硬件 |
| **Ollama** | llama.cpp 封装 | 一键本地运行 |

### 4.5 📚 推荐资源

| 资源 | 说明 |
|------|------|
| **vLLM 论文** | `Efficient Memory Management for Large Language Model Serving with PagedAttention` (2023) |
| **FlashAttention 论文** | `FlashAttention: Fast and Memory-Efficient Exact Attention` (2022) |
| **TensorRT-LLM** | [GitHub](https://github.com/NVIDIA/TensorRT-LLM) |
| **AutoAWQ** | [GitHub](https://github.com/casper-hansen/AutoAWQ) |
| **GGUF / llama.cpp** | [GitHub](https://github.com/ggerganov/llama.cpp) |

---

## 五、🔧 第五阶段：应用层（RAG + Agent）

> 现在纯做模型本身的机会越来越少，业务落地的核心变成了应用层。

### 5.1 RAG（检索增强生成）

RAG 是目前大模型落地 **最成熟的方案**。

#### RAG 核心流程

```
文档加载 → 文本切片 → 向量化 → 存入向量数据库
                                   ↓
用户提问 → 检索相关片段 → 重排序 → 拼接 Prompt → LLM 生成
```

#### 关键设计决策

| 环节 | 关键问题 | 推荐方案 |
|------|----------|----------|
| **切片策略** | 大小？重叠？语义切分？ | 512-1024 tokens + 10% 重叠 |
| **向量模型** | 选什么 Embedding 模型？ | BGE / M3E / text-embedding-3 |
| **向量数据库** | FAISS vs Milvus vs Chroma？ | 小规模 FAISS，中大规模 Milvus |
| **检索策略** | 怎么提升召回率？ | 混合检索（向量 + BM25）+ Reranker |
| **多路召回** | 多个知识源怎么办？ | 分别检索 + 融合排序 |

#### ⚠️ 作者建议：不要上来就用 LangChain

> "LangChain 封装得太重了，很多底层逻辑被藏起来了。自己用 Python 手写一套检索和调用的代码，其实就几百行，但你能彻底弄懂里面的每个环节。"

先手写理解原理，再考虑用 LlamaIndex / Dify 等框架提效。

#### RAG 进阶方向

- **Agentic RAG**：Agent 自主决定何时检索、检索什么、如何整合
- **GraphRAG**：基于知识图谱的检索增强
- **多模态 RAG**：文本 + 图片 + 表格混合检索

### 5.2 Agent（智能体）

> "纯基于大模型自主规划的 Agent 大部分在演示阶段惊艳，一上线就各种崩溃。"

#### 核心概念

| 概念 | 说明 |
|------|------|
| **ReAct** | Reasoning + Acting：思考→行动→观察→思考 循环 |
| **Function Call** | 模型输出特定 JSON 格式调用外部 API |
| **MCP 协议** | Anthropic 2024 发布，"AI 的 USB-C 接口" |
| **多 Agent** | 主从模式 / 对等模式 / 委员会模式 |

#### 主流 Agent 框架

| 框架 | 特点 |
|------|------|
| **LangGraph** | 有状态图编排，适合复杂 Agent 工作流 |
| **CrewAI** | 多 Agent 协作 |
| **Dify** | 低代码 AI 应用平台 |
| **Coze** | 字节跳动推出的 Agent 搭建平台 |

### 5.3 Prompt Engineering

| 技术 | 说明 |
|------|------|
| **CoT（思维链）** | "Let's think step by step" 激发推理 |
| **ToT（思维树）** | 多路径推理 + 回溯 |
| **ICL（上下文学习）** | 通过少量示例驱动模型行为 |
| **Self-Consistency** | 多次采样 + 投票，提升准确性 |

### 5.4 📚 推荐资源

| 资源 | 说明 |
|------|------|
| **RAG 原始论文** | `Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks` (2020, Meta) |
| **RAG-Book** | [GitHub](https://github.com/Nipi64310/RAG-Book) — 《大模型RAG实战》配套代码 |
| **微软 Generative AI for Beginners** | [GitHub](https://github.com/microsoft/generative-ai-for-beginners) (~87K ⭐) |
| **Datawhale LLM Cookbook** | [GitHub](https://github.com/datawhalechina/llm-cookbook) — 吴恩达课程中文实践版 |
| **Datawhale Self-LLM** | [GitHub](https://github.com/datawhalechina/self-llm) — 中国开发者专属微调教程 |
| **LLM-Action** | [GitHub](https://github.com/liguodongiot/llm-action) — 工程落地实战（vLLM + 推理优化 + 量化） |
| **AI Engineering Hub** | [GitHub](https://github.com/patchy631/ai-engineering-hub) — 500+ 页 PDF，RAG/Agent/DeepSeek 实战 |

---

## 六、📖 核心论文清单

> 💡 **阅读方法论（Three-Pass 法）**：
> 1. 第一遍：标题 → 摘要 → 引言 → 结论 → 扫参考文献（5-10 分钟）
> 2. 第二遍：细看图表 + 实验（~1 小时）
> 3. 第三遍：尝试复现，识别创新点和隐藏缺陷（数小时）

### 基石论文（必读）

| 序号 | 论文 | 年份 | 核心贡献 |
|------|------|------|----------|
| 1 | **Attention Is All You Need** | 2017 | Transformer 架构，一切 LLM 的基石 |
| 2 | **BERT** | 2018 | 双向预训练，"预训练+微调"范式 |
| 3 | **GPT-1** | 2018 | 自回归生成式预训练 |
| 4 | **GPT-2** | 2019 | 无监督多任务学习，zero-shot |
| 5 | **GPT-3** | 2020 | 175B 参数，In-Context Learning |
| 6 | **Scaling Laws** | 2020 | 模型/数据/算力的幂律关系 |
| 7 | **InstructGPT** | 2022 | RLHF 三阶段流程，ChatGPT 技术基础 |

### 架构与方法论文

| 序号 | 论文 | 年份 | 核心贡献 |
|------|------|------|----------|
| 8 | **LoRA** | 2021 | 低秩适配，高效微调标准 |
| 9 | **Chinchilla** | 2022 | 计算最优：模型大小和数据量应同步增长 |
| 10 | **Chain-of-Thought** | 2022 | 思维链，激发推理能力 |
| 11 | **FlashAttention** | 2022 | IO 感知精确注意力，长序列加速 |
| 12 | **Llama 1** | 2023 | 纯公开数据训练，开源浪潮起点 |
| 13 | **Llama 2** | 2023 | 开放商用许可 + 对话微调详细披露 |
| 14 | **QLoRA** | 2023 | 4-bit 量化微调，单卡微调 65B 模型 |
| 15 | **DPO** | 2023 | 直接偏好优化，RLHF 简化方案 |
| 16 | **PagedAttention / vLLM** | 2023 | KV Cache 分页管理，推理吞吐量革命 |
| 17 | **Llama 3** | 2024 | 405B 密集架构，128K 上下文 |

### 应用与前沿论文

| 序号 | 论文 | 年份 | 核心贡献 |
|------|------|------|----------|
| 18 | **RAG** | 2020 | 检索增强生成，知识密集任务方案 |
| 19 | **Tree of Thoughts** | 2023 | 多路径推理，比 CoT 更深度的决策框架 |
| 20 | **Emergent Abilities** | 2022 | 证明大模型能力的"涌现"现象 |
| 21 | **MoE (Sparsely-Gated)** | 2017 | 稀疏专家混合，千倍参数扩容 |

---

## 七、🛠️ 推荐 GitHub 项目汇总

| 项目 | ⭐ Star | 定位 | 链接 |
|------|---------|------|------|
| **LLM-Course** | 60K+ | 最全保姆级课程（科学家+工程师双路线） | [GitHub](https://github.com/mlabonne/llm-course) |
| **微软 Generative AI for Beginners** | 87K | 21 课零基础入门，RAG/Agent | [GitHub](https://github.com/microsoft/generative-ai-for-beginners) |
| **MiniMind** | 23K | 3 小时从零训练 26MB 微型 GPT | [GitHub](https://github.com/jingyaogong/minimind) |
| **LLaMA-Factory** | 40K+ | 低代码微调，100+ 模型支持 | [GitHub](https://github.com/hiyouga/LLaMA-Factory) |
| **LLM-Cookbook (Datawhale)** | 20K | 吴恩达课程中文实践版 | [GitHub](https://github.com/datawhalechina/llm-cookbook) |
| **Self-LLM (Datawhale)** | 20K | 中国开发者专属微调教程 | [GitHub](https://github.com/datawhalechina/self-llm) |
| **LLM-Action** | 19K | 工程落地：vLLM/量化/推理优化 | [GitHub](https://github.com/liguodongiot/llm-action) |
| **AI Engineering Hub** | 13K | 500+ 页 PDF 实战全覆盖 | [GitHub](https://github.com/patchy631/ai-engineering-hub) |
| **LLM-Universe (Datawhale)** | 9K | 小白友好，阿里云知识库助手 | [GitHub](https://github.com/datawhalechina/llm-universe) |
| **Awesome-LLM** | - | LLM 资源精选清单 | [GitHub](https://github.com/Hannibal046/Awesome-LLM) |
| **karpathy-gpt-roadmap** | - | Karpathy 视频中文学习路线 | [GitHub](https://github.com/wushanchi/karpathy-gpt-roadmap) |

---

## 八、📅 推荐时间规划

| 阶段 | 时间 | 目标 | 核心任务 |
|------|------|------|----------|
| **基础入门** | 第 1-2 周 | 建立整体认知 | 看 Karpathy 视频 + 跟敲代码，跑通 nanoGPT |
| **核心技术** | 第 3-6 周 | 掌握 Transformer + 微调 | 读 Llama 源码，用 LLaMA-Factory 跑一次 LoRA 微调 |
| **推理部署** | 第 7-8 周 | 会部署，会优化 | 用 vLLM 部署 Qwen-7B，压测并分析吞吐/延迟 |
| **应用实战** | 第 9-12 周 | 构建完整项目 | 手写 RAG 系统 + 搭建 Agent Demo |
| **进阶深入** | 第 3-6 个月 | 形成专长方向 | 根据组内方向深入（训练/推理/应用/Infra） |
| **持续学习** | 长期 | 跟进行业动态 | 每周精读 1-2 篇论文，关注开源动态 |

---

## 九、🔍 信息获取渠道

| 渠道 | 用途 | 建议 |
|------|------|------|
| **Twitter/X** | 跟踪前沿讨论 | 关注 AI 领域大牛（Karpathy、Jim Fan 等） |
| **ArXiv** | 最新论文 | 每天扫一眼 cs.CL / cs.AI |
| **Hugging Face** | 模型/数据集/社区 | 国内可用魔搭社区（ModelScope）替代 |
| **GitHub Trending** | 开源项目动态 | 每周至少看一次 |
| **知乎** | 中文深度讨论 | 关注陈旸、端阳老师等 |
| **B站** | 视频教程 | 李沐、李宏毅、跟李沐学 AI |

---

## 十、⚠️ 避坑指南 & 核心建议

### 来自原文作者的关键提醒

1. **数据质量 > 模型调参**：花 100 小时洗 1000 条高质量 QA 对，优于 10 万条垃圾数据跑一周。很多微调失败的根因是脏数据而非参数问题。

2. **先手写，再用框架**：不要上来就用 LangChain 等重量级框架。自己手写几百行 RAG 代码，把每个环节彻底弄懂。

3. **不要不好意思问**：开会听不懂是常态，记下不懂的词，会后自己去查去弄懂。

4. **主动扒代码仓库**：顺着入口函数往下看，核心逻辑往往就在那几个关键的类和函数里。

5. **算法工程师的尽头是工程能力**：Python 不能只停留在写脚本的水平。面向对象编程、设计模式、并发处理，这些是走得长远的基础设施。

6. **贴近业务，不要总想搞大新闻**：大模型范式可能过几年就变了，但扎实的工程底子和对业务的敏锐度永远不会过时。

### 来自社区补充的建议

7. **先跑通再深挖**：用 Hugging Face 快速跑起模型，建立体感后再研究源码。

8. **问题驱动学习**：从项目需求反向补足理论，而非单向啃书。

9. **同一知识多角度学习**：视频 → 论文 → 代码，每一遍都有新收获。

10. **不要执着于「学完所有内容」**：大模型领域过于广阔，结合自身方向（训练/推理/应用/Infra）有重点地深入。

11. **有后端/工程经验是巨大优势**：模型部署、性能优化、成本控制正是工程能力的用武之地。

12. **GLM 博硕士如考虑转行，务必先读顶会论文评估兴趣**：大模型工程化程度极高，算法和工程的边界已彻底模糊，纯理论研究空间在缩小。

---

## 十一、🏁 学习路径速查（3 条路线）

### 🧑‍🔬 路线 A：想做模型训练/微调（"炼丹师"）

```
Karpathy 视频 → Happy-LLM / MiniMind → Llama 源码 → LLaMA-Factory 微调实战 
→ DeepSpeed ZeRO → DPO 对齐 → LoRA/QLoRA 原理深入
```

### 👷 路线 B：想做工程落地/推理部署（"工程师"）

```
Karpathy 视频 → LLM-Course 工程师模块 → vLLM 部署实战 → TensorRT-LLM 
→ 量化（AWQ/GPTQ）→ LLM-Action 项目 → Docker/K8s 生产部署
```

### 🚀 路线 C：想做应用开发（RAG/Agent）

```
微软 GenAI 入门 → LLM-Universe → 手写 RAG → FAISS/Milvus → LlamaIndex 
→ LangGraph Agent → Agentic RAG → MCP 协议 → Dify/Coze 平台
```

---

## 📚 附录：推荐书籍

| 书名 | 说明 |
|------|------|
| **《GPT 图解》** | 图解式入门，从概念到代码 |
| **《大语言模型：基础与前沿》** | 熊涛著，系统全面的中文教材 |
| **《动手构建大模型》** | 动手实践导向 |
| **Build a Large Language Model (From Scratch)** | Sebastian Raschka 著，2024 年新书，从零实现 LLM |
| **《大模型RAG实战》** | RAG 方向专著，配套代码在 GitHub |

---

> 📝 **文档说明**：本文档整合了知乎高赞回答 + 全网高收藏 LLM 学习资源的精华内容。文中提到的视频、论文、GitHub 仓库均附有链接。建议收藏后按阶段逐步推进，**动手实践永远比纯看资料有效 10 倍**。

> 🕐 **更新日期**：2025 年 7 月 — 大模型领域变化极快，建议每 3 个月回顾一次学习计划，根据行业动态调整优先级。
