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

type NodeId = "start" | "llm" | "tools" | "end" | null

const NODE_COLORS: Record<
  string,
  { bg: string; border: string; text: string }
> = {
  start: {
    bg: "var(--green-dim)",
    border: "var(--green)",
    text: "var(--green)",
  },
  llm: { bg: "var(--accent-dim)", border: "var(--accent)", text: "#7fa8ff" },
  tools: {
    bg: "var(--amber-dim)",
    border: "var(--amber)",
    text: "var(--amber)",
  },
  end: { bg: "var(--red-dim)", border: "var(--red)", text: "var(--red)" },
}

function GraphNode({
  id,
  label,
  active,
}: {
  id: string
  label: string
  active: boolean
}) {
  const c = NODE_COLORS[id]
  return (
    <div
      style={{
        padding: "7px 18px",
        borderRadius: 7,
        fontSize: 11,
        fontFamily: "var(--mono)",
        fontWeight: 600,
        textAlign: "center",
        minWidth: 90,
        border: `1.5px solid ${c.border}`,
        background: c.bg,
        color: c.text,
        transform: active ? "scale(1.1)" : "scale(1)",
        boxShadow: active ? `0 0 16px ${c.border}88` : "none",
        transition: "all .3s",
      }}
    >
      {label}
    </div>
  )
}

export default function StateGraphPanel({
  apiKey,
  model,
}: {
  apiKey: string
  model: string
}) {
  const [input, setInput] = useState(
    "帮我算一下 1024 除以 16 等于多少，再告诉我现在几点了，今天天气如何",
  )
  const [activeNode, setActiveNode] = useState<NodeId>(null)
  const [stateSnap, setStateSnap] = useState("")
  const [logs, setLogs] = useState<React.ReactNode[]>([])
  const [loading, setLoading] = useState(false)

  function addLog(node: React.ReactNode) {
    setLogs((prev) => [...prev, node])
  }

  function activate(id: NodeId) {
    setActiveNode(id)
  }

  function snap(obj: Record<string, unknown>) {
    setStateSnap(JSON.stringify(obj, null, 2))
  }

  async function run() {
    if (!apiKey) {
      alert("请先输入 API Key")
      return
    }
    setLogs([])
    setActiveNode(null)
    setStateSnap("")
    setLoading(true)

    addLog(
      <span style={{ color: "var(--text3)", fontStyle: "italic" }}>
        // StateGraph 编译完成
      </span>,
    )
    addLog(
      <span style={{ color: "var(--text3)", fontStyle: "italic" }}>
        // State: {"{ messages: BaseMessage[] }"}
      </span>,
    )
    addLog(
      <span style={{ color: "var(--text3)", fontStyle: "italic" }}>
        // Nodes: llm, tools | Edges: START→llm, llm→[tools|END], tools→llm
      </span>,
    )
    addLog(<br />)

    let state: { messages: Message[] } = {
      messages: [{ role: "user", content: input }],
    }
    snap({
      messages_count: 1,
      last_msg: input.slice(0, 50) + (input.length > 50 ? "..." : ""),
    })

    await new Promise((r) => setTimeout(r, 300))
    activate("start")
    addLog(
      <span style={{ color: "var(--green)" }}>▶ [START] → 进入 llm 节点</span>,
    )
    await new Promise((r) => setTimeout(r, 500))

    let stepCount = 0
    try {
      while (stepCount < 6) {
        stepCount++
        activate("llm")
        addLog(
          <span style={{ color: "var(--accent2)" }}>
            ── [llm node] Step {stepCount}: 调用 LLM ──
          </span>,
        )
        snap({
          step: stepCount,
          node: "llm",
          messages_count: state.messages.length,
        })

        const res = await callQwen(apiKey, {
          messages: state.messages,
          model,
          tools: AGENT_TOOLS,
          maxTokens: 400,
          temperature: 0.1,
        })
        const msg = res.choices[0].message
        const toolCalls: ToolCall[] = msg.tool_calls ?? []

        if (!toolCalls.length) {
          addLog(
            <span style={{ color: "var(--accent)" }}>
              {" "}
              LLM 输出: {msg.content.slice(0, 80)}
              {msg.content.length > 80 ? "..." : ""}
            </span>,
          )
          addLog(
            <span style={{ color: "var(--accent2)" }}>
              ↓ 条件路由: 无 tool_calls → END
            </span>,
          )
          await new Promise((r) => setTimeout(r, 400))
          activate("end")
          addLog(<span style={{ color: "var(--red)" }}>■ [END]</span>)
          addLog(<br />)
          addLog(<span style={{ color: "var(--green)" }}>✅ 最终答案:</span>)
          addLog(<span style={{ color: "var(--green)" }}>{msg.content}</span>)
          snap({
            step: stepCount,
            node: "END",
            messages_count: state.messages.length + 1,
            result: msg.content.slice(0, 60) + "...",
          })
          break
        }

        const names = toolCalls.map((c) => c.function.name).join(", ")
        addLog(
          <span style={{ color: "var(--accent2)" }}>
            ↓ 条件路由: tool_calls=[{names}] → tools
          </span>,
        )
        await new Promise((r) => setTimeout(r, 400))
        activate("tools")
        addLog(
          <span style={{ color: "var(--accent2)" }}>
            ── [tools node] 执行工具 ──
          </span>,
        )

        const toolResults: Message[] = []
        for (const call of toolCalls) {
          let args: Record<string, unknown> = {}
          try {
            args = JSON.parse(call.function.arguments)
          } catch {
            /* ignore */
          }
          await new Promise((r) => setTimeout(r, 300))
          const result = await executeTool(call.function.name, args)
          addLog(
            <span>
              <span style={{ color: "var(--amber)" }}>
                {" "}
                {call.function.name}({call.function.arguments})
              </span>
              <span style={{ color: "var(--text3)" }}> → </span>
              <span style={{ color: "var(--accent)" }}>{result}</span>
            </span>,
          )
          toolResults.push({
            role: "tool",
            content: result,
            tool_call_id: call.id,
          })
        }

        state = {
          messages: [
            ...state.messages,
            {
              role: "assistant",
              content: msg.content || "",
              tool_calls: toolCalls,
            },
            ...toolResults,
          ],
        }
        snap({
          step: stepCount,
          node: "tools",
          messages_count: state.messages.length,
        })
        addLog(
          <span style={{ color: "var(--accent2)" }}>
            ↺ tools → llm（循环）
          </span>,
        )
        await new Promise((r) => setTimeout(r, 300))
      }
    } catch (e) {
      addLog(
        <span style={{ color: "var(--red)" }}>
          错误: {e instanceof Error ? e.message : String(e)}
        </span>,
      )
    }

    activate(null)
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
        title="StateGraph · 底层图 API"
        desc="手动定义 State / Node / Edge，可视化执行流。展示 ReactFlow JSON → StateGraph 的核心原理。"
      >
        <Tag color="purple">补充C</Tag>
      </PanelHeader>

      <SplitLayout
        leftWidth={280}
        left={
          <>
            <Card>
              <CardHead>
                <CardTitle>图结构可视化</CardTitle>
              </CardHead>
              <CardBody>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 6,
                    padding: "8px 0",
                  }}
                >
                  <GraphNode
                    id="start"
                    label="START"
                    active={activeNode === "start"}
                  />
                  <div style={{ color: "var(--text3)", fontSize: 18 }}>↓</div>
                  <GraphNode
                    id="llm"
                    label="LLM Node"
                    active={activeNode === "llm"}
                  />
                  <div style={{ color: "var(--text3)", fontSize: 18 }}>↓</div>
                  <div
                    style={{
                      fontSize: 10,
                      color: "var(--text3)",
                      padding: "3px 10px",
                      border: "1px dashed var(--border2)",
                      borderRadius: 5,
                      fontFamily: "var(--mono)",
                    }}
                  >
                    tool_calls?
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: 40,
                      alignItems: "flex-start",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <div style={{ color: "var(--text3)", fontSize: 13 }}>
                        ↓ yes
                      </div>
                      <GraphNode
                        id="tools"
                        label="Tools Node"
                        active={activeNode === "tools"}
                      />
                      <div style={{ color: "var(--text3)", fontSize: 13 }}>
                        ↺ loop
                      </div>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <div style={{ color: "var(--text3)", fontSize: 13 }}>
                        ↓ no
                      </div>
                      <GraphNode
                        id="end"
                        label="END"
                        active={activeNode === "end"}
                      />
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHead>
                <CardTitle>State 快照</CardTitle>
              </CardHead>
              <CardBody>
                <pre
                  style={{
                    fontSize: 11,
                    fontFamily: "var(--mono)",
                    color: "var(--text2)",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-all",
                    lineHeight: 1.6,
                    minHeight: 60,
                  }}
                >
                  {stateSnap || "-"}
                </pre>
              </CardBody>
            </Card>
          </>
        }
        right={
          <Card style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <CardHead>
              <CardTitle>执行日志</CardTitle>
            </CardHead>
            <CardBody
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              <div>
                <FieldLabel>输入消息</FieldLabel>
                <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                  <Textarea
                    value={input}
                    onChange={setInput}
                    rows={2}
                    style={{ flex: 1 }}
                  />
                  <Btn
                    onClick={run}
                    disabled={loading}
                    style={{ alignSelf: "flex-start" }}
                  >
                    {loading ? <Spinner /> : "▶"} 编译并执行
                  </Btn>
                </div>
              </div>
              <OutputBox
                style={{
                  flex: 1,
                  minHeight: 180,
                  background: "transparent",
                  border: "none",
                  padding: 0,
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
