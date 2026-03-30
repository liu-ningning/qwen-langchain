// ── Qwen API Client ──────────────────────────────────────────
// 前端统一调用本地 API 服务，再由服务端持有 Qwen 凭据并访问 DashScope。

export const QWEN_BASE_URL = '/api'

export const QWEN_MODELS = [
  { id: 'qwen-plus-latest', label: 'Qwen Plus', desc: '均衡性价比' },
  { id: 'qwen-turbo-latest', label: 'Qwen Turbo', desc: '极速响应' },
  { id: 'qwen-max-latest', label: 'Qwen Max', desc: '最强能力' },
  { id: 'qwen-long', label: 'Qwen Long', desc: '超长上下文' },
]

export type QwenModel = typeof QWEN_MODELS[number]['id']

export interface Message {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string | ContentPart[]
  tool_calls?: ToolCall[]
  tool_call_id?: string
  name?: string
}

export interface ContentPart {
  type: 'text'
  text: string
}

export interface ToolCall {
  id: string
  type: 'function'
  function: { name: string; arguments: string }
}

export interface Tool {
  type: 'function'
  function: {
    name: string
    description: string
    parameters: Record<string, unknown>
  }
}

export interface ChatOptions {
  messages: Message[]
  model?: string
  system?: string
  maxTokens?: number
  temperature?: number
  stream?: boolean
  tools?: Tool[]
}

export interface ChatResponse {
  id: string
  choices: Array<{
    message: { role: string; content: string; tool_calls?: ToolCall[] }
    finish_reason: string
  }>
  usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number }
}

// Non-streaming call
export async function callQwen(_apiKey: string, opts: ChatOptions): Promise<ChatResponse> {
  const messages: Message[] = []
  if (opts.system) {
    messages.push({ role: 'system', content: opts.system })
  }
  messages.push(...opts.messages)

  const body: Record<string, unknown> = {
    model: opts.model ?? 'qwen-plus-latest',
    messages,
    max_tokens: opts.maxTokens ?? 800,
    temperature: opts.temperature ?? 0.7,
  }
  if (opts.tools?.length) body.tools = opts.tools
  if (opts.stream) body.stream = true

  const res = await fetch(`${QWEN_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: { message?: string } }
    throw new Error(err.error?.message ?? `HTTP ${res.status}`)
  }

  // return res.json() as Promise<ChatResponse>

  const json: any = (await res.json()) as ChatResponse

  if (json?.usage) {
    console.warn('#####'.repeat(10))
    console.warn(`***** 模型: ${json?.model || opts.model}`)
    console.warn(`***** 总耗: ${json?.usage.total_tokens} tokens`)
    console.warn(`***** 输入: ${json?.usage.prompt_tokens} tokens`)
    console.warn(`***** 输出: ${json?.usage.completion_tokens} tokens`)
    console.warn('#####'.repeat(10))
  }

  return json
}

// Streaming call — returns raw Response for SSE parsing
export async function callQwenStream(_apiKey: string, opts: ChatOptions): Promise<Response> {
  const messages: Message[] = []
  if (opts.system) messages.push({ role: 'system', content: opts.system })
  messages.push(...opts.messages)

  const res = await fetch(`${QWEN_BASE_URL}/chat/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: opts.model ?? 'qwen-plus-latest',
      messages,
      max_tokens: opts.maxTokens ?? 800,
      temperature: opts.temperature ?? 0.7,
      stream: true,
      ...(opts.tools?.length ? { tools: opts.tools } : {}),
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: { message?: string } }
    throw new Error(err.error?.message ?? `HTTP ${res.status}`)
  }
  return res
}

export async function runLCELChain(input: {
  model: string
  template: string
  role: string
  style: string
  topic: string
  mode: 'string' | 'parallel'
}): Promise<{ mode: string; output: string; elapsedMs: number }> {
  const res = await fetch(`${QWEN_BASE_URL}/langchain/lcel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string }
    throw new Error(err.error ?? `HTTP ${res.status}`)
  }
  return res.json() as Promise<{ mode: string; output: string; elapsedMs: number }>
}

export async function runParserChain(input: {
  model: string
  type: 'string' | 'json' | 'list'
  input: string
}): Promise<{ raw: string; parsed: string }> {
  const res = await fetch(`${QWEN_BASE_URL}/langchain/parser`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string }
    throw new Error(err.error ?? `HTTP ${res.status}`)
  }
  return res.json() as Promise<{ raw: string; parsed: string }>
}

// Parse a streaming response — yields text chunks
export async function* parseStream(response: Response): AsyncGenerator<string> {
  const reader = response.body!.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      const data = line.slice(6).trim()
      if (data === '[DONE]') return
      try {
        const ev = JSON.parse(data) as {
          choices?: Array<{ delta?: { content?: string }; finish_reason?: string }>
        }
        const token = ev.choices?.[0]?.delta?.content
        if (token) yield token
      } catch { /* skip malformed */ }
    }
  }
}
