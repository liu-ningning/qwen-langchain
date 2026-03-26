export interface KBDoc {
  id: number
  text: string
  source: string
  score?: number
}

export const KB_DOCS: KBDoc[] = [
  {
    id: 0,
    text: 'LCEL（LangChain 表达式语言）通过 .pipe() 将组件串联。标准三段链：ChatPromptTemplate.fromTemplate().pipe(model).pipe(new StringOutputParser())。支持 RunnableParallel 并行执行多条链，RunnableLambda 包装自定义函数。',
    source: 'langchain-docs/lcel',
  },
  {
    id: 1,
    text: 'createAgent 使用 systemPrompt 参数（非 prompt）设置系统提示词，model 参数需要 "provider:model" 格式，如 "openai:gpt-4o-mini"。checkpointer 可传 true（自动使用 MemorySaver）或传入 PostgresSaver 实例（生产环境）。',
    source: 'langchain-docs/agent-api',
  },
  {
    id: 2,
    text: 'RAG 完整流程：索引阶段（离线）—— Loader 加载文档 → Splitter 分割（chunkSize=800, overlap=100） → Embedding 向量化 → VectorStore 存储；检索阶段（在线）—— 用户问题 Embedding → 相似度搜索 Top-K → 拼入 Prompt → LLM 生成回答。',
    source: 'langchain-docs/rag',
  },
  {
    id: 3,
    text: '流式输出三种 streamMode：messages 只输出消息内容（纯聊天场景推荐）；updates 输出每个节点执行后的 State 变更（生产推荐）；values 输出完整 State 快照（调试用）。调用方式：agent.stream(input, { streamMode: "updates" })',
    source: 'langchain-docs/streaming',
  },
  {
    id: 4,
    text: 'StateGraph 底层 API：用 Annotation.Root 定义 State schema，addNode 注册处理函数，addEdge 连接固定路由，addConditionalEdges 实现条件分支（如 ReAct 的 tool_calls 判断）。最后必须调用 .compile() 才能执行 invoke() 或 stream()。',
    source: 'langchain-docs/stategraph',
  },
  {
    id: 5,
    text: 'Human-in-the-Loop：interruptBefore: ["tools"] 在工具执行前暂停，interruptAfter 在工具执行后暂停。使用 interrupt(payload) 在节点内动态暂停，new Command({ resume: value }) 恢复执行。必须配合 checkpointer 使用。',
    source: 'langchain-docs/hitl',
  },
  {
    id: 6,
    text: '短期记忆基于 Checkpointer：MemorySaver 用于开发（内存存储，重启丢失），PostgresSaver 用于生产（需先调用 await checkpointer.setup() 创建表）。同一 thread_id 恢复历史；不同 thread_id 完全隔离。',
    source: 'langchain-docs/memory',
  },
]

// Simple keyword-based similarity (simulates vector cosine similarity)
export function searchKB(query: string, topK = 2): KBDoc[] {
  const q = query.toLowerCase()
  const keywords = q.split(/[\s，,。.？?！!]+/).filter(w => w.length > 0)

  const scored = KB_DOCS.map(doc => {
    const d = doc.text.toLowerCase() + ' ' + doc.source.toLowerCase()
    let score = 0.2 // baseline

    keywords.forEach(kw => {
      if (kw.length >= 2 && d.includes(kw)) score += 0.08
    })

    // Topic-specific boosts
    const topicBoosts: [string[], number][] = [
      [['lcel', 'pipe', '管道', '链式'], 0],
      [['rag', '检索', '向量', '知识库'], 2],
      [['stream', '流式', 'sse'], 3],
      [['stategraph', '状态图', 'graph', '底层'], 4],
      [['memory', '记忆', 'thread', 'checkpointer'], 6],
      [['hitl', '审批', '人机', 'interrupt'], 5],
      [['agent', '工具', 'react'], 1],
    ]
    topicBoosts.forEach(([terms, docId]) => {
      if (terms.some(t => q.includes(t)) && doc.id === docId) score += 0.5
    })

    return { ...doc, score: Math.min(0.99, score) }
  })

  return scored
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .slice(0, topK)
}
