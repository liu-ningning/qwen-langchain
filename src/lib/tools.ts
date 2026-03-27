import type { Tool } from './qwen'

// ── Tool Definitions (LLM-visible schemas) ─────────────────
export const AGENT_TOOLS: Tool[] = [
  {
    type: 'function',
    function: {
      name: 'calculator',
      description: '安全的数学计算器，支持加减乘除、幂运算、括号。当用户需要精确数学计算时使用（LLM 自身算数不可靠）。',
      parameters: {
        type: 'object',
        properties: {
          expression: { type: 'string', description: '数学表达式，如 "256 * 3.14" 或 "(100 + 50) * 2"' },
        },
        required: ['expression'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_time',
      description: '获取当前北京时间和日期。',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_weather',
      description: '查询指定城市的实时天气信息。',
      parameters: {
        type: 'object',
        properties: {
          city: { type: 'string', description: '城市名称，如 "北京"' },
        },
        required: ['city'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_knowledge',
      description: '从 LangChain 内置知识库搜索技术文档。当用户询问 LangChain、LCEL、RAG、Agent、StateGraph 等技术问题时使用。',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: '搜索关键词' },
        },
        required: ['query'],
      },
    },
  },
]

// HITL tools - split into safe and risky
export const HITL_TOOLS: Tool[] = [
  {
    type: 'function',
    function: {
      name: 'query_data',
      description: '查询数据库中的用户数据（只读，安全操作，无需审批）。',
      parameters: {
        type: 'object',
        properties: { query: { type: 'string', description: '查询描述' } },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'delete_data',
      description: '永久删除数据（高风险操作，不可逆，需要人工审批）。',
      parameters: {
        type: 'object',
        properties: {
          target: { type: 'string', description: '要删除的目标（如用户ID、数据范围）' },
        },
        required: ['target'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'send_email',
      description: '发送电子邮件通知（需要人工审批后才能执行）。',
      parameters: {
        type: 'object',
        properties: {
          to: { type: 'string', description: '收件人' },
          subject: { type: 'string', description: '邮件主题' },
          body: { type: 'string', description: '邮件内容' },
        },
        required: ['to', 'subject', 'body'],
      },
    },
  },
]

export const HIGH_RISK_TOOLS = new Set(['delete_data', 'send_email'])

// ── Tool Executors (local simulation) ──────────────────────
type ToolInput = Record<string, unknown>

export async function executeTool(name: string, input: ToolInput): Promise<string> {
  switch (name) {
    case 'calculator': {
      try {
        // Safe eval: only allow math chars
        const expr = String(input.expression).replace(/[^0-9+\-*/().\s]/g, '')
        const result = new Function(`"use strict"; return (${expr})`)() as number
        return `${input.expression} = ${result}`
      } catch {
        return '计算失败：表达式无效'
      }
    }
    case 'get_time': {
      return `当前北京时间：${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`
    }
    case 'get_weather': {
      const city = String(input.city)
      const WMO_CODES: Record<number, string> = {
        0: '晴朗', 1: '多云', 2: '多云', 3: '阴天',
        45: '雾', 48: '雾', 51: '毛毛雨', 53: '毛毛雨', 55: '毛毛雨',
        61: '小雨', 63: '中雨', 65: '大雨', 71: '小雪', 73: '中雪', 75: '大雪',
        80: '阵雨', 81: '阵雨', 82: '阵雨', 95: '雷雨', 96: '雷雨', 99: '雷雨',
      }

      let coords: { latitude: number; longitude: number } | null = null

      try {
        // 获取城市经纬度
        // 第一次尝试原地名搜索
        let resp = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=zh`)
        if (resp.ok) {
          const data = await resp.json()
          if (data.results && data.results.length > 0) {
            coords = data.results[0]
          }
        }

        // 针对中文地名优化：如果是不带后缀的城市名，补充“市”以提高精准度
        let searchCity = city
        if (!/市|省|区|县|州|岛/.test(searchCity)) {
          searchCity += '市'
        }

        if (!coords) {
          resp = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(searchCity)}&count=1&language=zh`)
          if (resp.ok) {
            const data = await resp.json()
            if (data.results && data.results.length > 0) {
              coords = data.results[0]
            }
          }
        }

        if (!coords || !coords.latitude || !coords.longitude) {
          return `无法获取「${city}」的实时天气，未找到该城市的地理位置。`
        }

        // 获取天气信息
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${coords.latitude}&longitude=${coords.longitude}&current_weather=true`)
        if (res.ok) {
          const data = await res.json()
          const current = data.current_weather
          const units = data.current_weather_units
          if (current) {
            const condition = WMO_CODES[current.weathercode] || '未知'
            return `「${city}」实时天气：${condition}，温度 ${current.temperature}${units.temperature}，风速 ${current.windspeed}${units.windspeed}，风向 ${current.winddirection}${units.winddirection}`
          }
        }
        throw new Error('API请求失败')
      } catch {
        return `无法获取「${city}」的实时天气，接口暂不可用。`
      }
    }
    case 'search_knowledge': {
      const q = String(input.query).toLowerCase()
      if (q.includes('lcel') || q.includes('pipe') || q.includes('管道'))
        return 'LCEL（LangChain 表达式语言）：用 .pipe() 将 PromptTemplate → Model → OutputParser 串联成链。所有组件实现 Runnable 接口，支持 invoke / stream / batch。示例：chain = prompt.pipe(model).pipe(new StringOutputParser())'
      if (q.includes('rag') || q.includes('检索') || q.includes('向量'))
        return 'RAG（检索增强生成）：索引阶段——文档 → Loader → Splitter → Embedding → VectorStore；检索阶段——用户问题 → Embedding → 相似搜索 Top-K → 拼入 Prompt → LLM 回答。推荐 chunkSize=800, overlap=100。'
      if (q.includes('stategraph') || q.includes('状态图') || q.includes('graph'))
        return 'StateGraph 三要素：State（用 Annotation.Root 定义共享数据结构）、Node（普通函数，接收 State 返回更新部分）、Edge（固定边用 addEdge，条件路由用 addConditionalEdges）。必须调用 .compile() 后才能执行。'
      if (q.includes('stream') || q.includes('流式'))
        return '流式输出：三种 streamMode —— messages（纯消息流，聊天推荐）、updates（节点变更差量）、values（完整 State 快照）。调用方式：agent.stream(input, { streamMode: "updates" })'
      if (q.includes('memory') || q.includes('记忆') || q.includes('thread'))
        return '短期记忆：通过 Checkpointer + thread_id 实现。开发用 MemorySaver，生产用 PostgresSaver（需先调用 setup()）。createAgent({ ..., checkpointer: true }) 自动启用内置 MemorySaver。'
      return `关于「${input.query}」：LangChain 是基于 LLM 的应用开发框架，核心组件包括：Models（统一模型接口）、Tools（工具调用）、Memory（会话记忆）、Retrievers（文档检索）、Agents（自主推理）。`
    }
    case 'query_data':
      return `查询结果：用户 u001（张三）共有 5 个应用，其中 2 个已过期（app-003 创建于 2024-01-10，app-007 创建于 2024-03-05）`
    case 'delete_data':
      return `已删除目标: ${input.target}，操作完成，共清理 2 条记录`
    case 'send_email':
      return `邮件已发送至 ${input.to}，主题：${input.subject}`
    default:
      return `未知工具: ${name}`
  }
}
