import { useState } from "react"
import { callQwen } from "../lib/qwen"
import { AGENT_TOOLS, executeTool } from "../lib/tools"
import type { Message, ToolCall } from "../lib/qwen"
import {
  Card,
  CardHead,
  CardTitle,
  CardBody,
  OutputBox,
  Btn,
  FieldLabel,
  Textarea,
  Tag,
  PanelHeader,
  SplitLayout,
  Col,
  Spinner,
} from "./ui"

type ToolStatus = "idle" | "running" | "done"
interface ToolState {
  id: string
  name: string
  status: ToolStatus
  result?: string
}

const TOOL_ICONS: Record<string, string> = {
  calculator: "🧮",
  get_time: "🕐",
  get_weather: "🌤",
  search_knowledge: "🔍",
}

export default function AgentPanel({
  apiKey,
  model,
}: {
  apiKey: string
  model: string
}) {
  const [question, setQuestion] = useState(
    "现在几点了？今天天气怎么样？另外帮我算一下 256 * 3.14 等于多少？",
  )
  const [logs, setLogs] = useState<React.ReactNode[]>([])
  const [tools, setTools] = useState<ToolState[]>(
    AGENT_TOOLS.map((t) => ({
      id: t.function.name,
      name: t.function.name,
      status: "idle",
    })),
  )
  const [loading, setLoading] = useState(false)

  function addLog(node: React.ReactNode) {
    setLogs((prev) => [...prev, node])
  }

  function setToolStatus(name: string, status: ToolStatus, result?: string) {
    setTools((prev) =>
      prev.map((t) => (t.id === name ? { ...t, status, result } : t)),
    )
  }

  async function run() {
    if (!apiKey) {
      alert("请先输入 API Key")
      return
    }
    setLogs([])
    setTools((prev) =>
      prev.map((t) => ({ ...t, status: "idle", result: undefined })),
    )
    setLoading(true)

    addLog(
      <span style={{ color: "var(--text3)", fontStyle: "italic" }}>
        ═══ ReAct 循环开始 ═══
      </span>,
    )
    addLog(
      <span style={{ color: "var(--text3)", fontStyle: "italic" }}>
        用户: {question}
      </span>,
    )
    addLog(<br />)

    let messages: Message[] = [{ role: "user", content: question }]
    let step = 0

    try {
      while (step < 8) {
        step++
        addLog(
          <span style={{ color: "var(--accent2)" }}>
            ── Step {step}: LLM 推理 ──
          </span>,
        )

        const res = await callQwen(apiKey, {
          messages,
          model,
          tools: AGENT_TOOLS,
          maxTokens: 600,
          temperature: 0.1,
        })

        const msg = res.choices[0].message
        const hasTools = msg.tool_calls && msg.tool_calls.length > 0

        if (!hasTools) {
          addLog(<span style={{ color: "var(--green)" }}>✅ 最终回答:</span>)
          addLog(<span style={{ color: "var(--green)" }}>{msg.content}</span>)
          break
        }

        // Process tool calls
        const toolResults: Message[] = []
        for (const call of msg.tool_calls as ToolCall[]) {
          let args: Record<string, unknown>
          try {
            args = JSON.parse(call.function.arguments)
          } catch {
            args = {}
          }

          setToolStatus(call.function.name, "running")
          addLog(
            <span style={{ color: "var(--amber)" }}>
              🔧 调用工具: {call.function.name}({call.function.arguments})
            </span>,
          )

          await new Promise((r) => setTimeout(r, 350))
          const result = await executeTool(call.function.name, args)
          setToolStatus(call.function.name, "done", result)

          addLog(
            <span style={{ color: "var(--accent)" }}>
              📦 工具返回: {result}
            </span>,
          )
          toolResults.push({
            role: "tool",
            content: result,
            tool_call_id: call.id,
          })
        }

        messages = [
          ...messages,
          {
            role: "assistant",
            content: msg.content || "",
            tool_calls: msg.tool_calls,
          },
          ...toolResults,
        ]
      }
    } catch (e) {
      addLog(
        <span style={{ color: "var(--red)" }}>
          错误: {e instanceof Error ? e.message : String(e)}
        </span>,
      )
    }
    setLoading(false)
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        overflow: "hidden",
      }}
    >
      <PanelHeader
        title="createAgent · 工具调用"
        desc="演示 ReAct 循环：LLM 推理 → 选择工具 → 执行 → 观察结果 → 最终回答。"
      >
        <Tag color="blue">阶段一/二</Tag>
      </PanelHeader>

      <SplitLayout
        leftWidth={300}
        left={
          <>
            <Card>
              <CardHead>
                <CardTitle>可用工具</CardTitle>
              </CardHead>
              <CardBody>
                <Col gap={6}>
                  {tools.map((t) => (
                    <div
                      key={t.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "8px 12px",
                        borderRadius: 7,
                        border: `1px solid ${t.status === "running" ? "var(--amber)" : t.status === "done" ? "var(--green)" : "var(--border)"}`,
                        background:
                          t.status === "running"
                            ? "var(--amber-dim)"
                            : t.status === "done"
                              ? "var(--green-dim)"
                              : "var(--surface2)",
                        transition: "all .3s",
                        fontSize: 12,
                      }}
                    >
                      <span>{TOOL_ICONS[t.id] ?? "🔧"}</span>
                      <span
                        style={{
                          flex: 1,
                          fontFamily: "var(--mono)",
                          color: "var(--text)",
                        }}
                      >
                        {t.name}
                      </span>
                      <span
                        style={{
                          fontSize: 10,
                          padding: "2px 7px",
                          borderRadius: 4,
                          background:
                            t.status === "running"
                              ? "var(--amber-dim)"
                              : t.status === "done"
                                ? "var(--green-dim)"
                                : "var(--surface)",
                          color:
                            t.status === "running"
                              ? "var(--amber)"
                              : t.status === "done"
                                ? "var(--green)"
                                : "var(--text3)",
                        }}
                      >
                        {t.status === "running"
                          ? "执行中"
                          : t.status === "done"
                            ? "完成 ✓"
                            : "待机"}
                      </span>
                    </div>
                  ))}
                </Col>
              </CardBody>
            </Card>

            <Card>
              <CardHead>
                <CardTitle>问题</CardTitle>
              </CardHead>
              <CardBody>
                <Col>
                  <FieldLabel>向 Agent 提问（可包含多个工具需求）</FieldLabel>
                  <Textarea value={question} onChange={setQuestion} rows={4} />
                  <Btn onClick={run} disabled={loading}>
                    {loading ? <Spinner /> : "▶"} 执行 Agent
                  </Btn>
                </Col>
              </CardBody>
            </Card>
          </>
        }
        right={
          <Card style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <CardHead>
              <CardTitle>ReAct 执行日志</CardTitle>
            </CardHead>
            <CardBody style={{ flex: 1, overflow: "auto" }}>
              <OutputBox
                style={{
                  background: "transparent",
                  border: "none",
                  padding: 0,
                  minHeight: 200,
                }}
              >
                <Col gap={2}>
                  {logs.length === 0 ? (
                    <span style={{ color: "var(--text3)" }}>等待执行...</span>
                  ) : (
                    logs.map((l, i) => <div key={i}>{l}</div>)
                  )}
                </Col>
              </OutputBox>
            </CardBody>
          </Card>
        }
      />
    </div>
  )
}
