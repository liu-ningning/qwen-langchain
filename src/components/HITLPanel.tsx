import { useState } from "react"
import { callQwen } from "../lib/qwen"
import { HITL_TOOLS, HIGH_RISK_TOOLS, executeTool } from "../lib/tools"
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

interface PendingCall {
  id: string
  name: string
  args: Record<string, unknown>
  display: string
}

export default function HITLPanel({
  apiKey,
  model,
}: {
  apiKey: string
  model: string
}) {
  const [input, setInput] = useState(
    "删除用户 u001 的所有过期应用，并发送通知邮件给他",
  )
  const [logs, setLogs] = useState<React.ReactNode[]>([])
  const [pending, setPending] = useState<PendingCall[]>([])
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])

  function addLog(node: React.ReactNode) {
    setLogs((prev) => [...prev, node])
  }

  async function run() {
    if (!apiKey) {
      alert("请先输入 API Key")
      return
    }
    setLogs([])
    setPending([])
    setLoading(true)

    const initMsgs: Message[] = [{ role: "user", content: input }]
    setMessages(initMsgs)

    addLog(
      <span style={{ color: "var(--text3)", fontStyle: "italic" }}>
        ═══ Human-in-the-Loop 开始 ═══
      </span>,
    )
    addLog(
      <span style={{ color: "var(--text3)", fontStyle: "italic" }}>
        配置：delete_data / send_email 需人工审批，其他工具自动执行
      </span>,
    )
    addLog(<br />)

    await step(initMsgs)
  }

  async function step(msgs: Message[]) {
    try {
      addLog(<span style={{ color: "var(--accent2)" }}>── LLM 推理 ──</span>)
      const res = await callQwen(apiKey, {
        messages: msgs,
        model,
        tools: HITL_TOOLS,
        maxTokens: 500,
        temperature: 0.1,
      })

      const msg = res.choices[0].message
      const toolCalls: ToolCall[] = msg.tool_calls ?? []

      if (!toolCalls.length) {
        addLog(<span style={{ color: "var(--green)" }}>✅ 执行完成:</span>)
        addLog(<span style={{ color: "var(--green)" }}>{msg.content}</span>)
        setLoading(false)
        return
      }

      const updatedMsgs: Message[] = [
        ...msgs,
        {
          role: "assistant",
          content: msg.content || "",
          tool_calls: toolCalls,
        },
      ]

      const safeResults: Message[] = []
      const riskyQueue: PendingCall[] = []

      for (const call of toolCalls) {
        let args: Record<string, unknown> = {}
        try {
          args = JSON.parse(call.function.arguments)
        } catch {
          /* ignore */
        }

        if (HIGH_RISK_TOOLS.has(call.function.name)) {
          riskyQueue.push({
            id: call.id,
            name: call.function.name,
            args,
            display: JSON.stringify(args, null, 2),
          })
          addLog(
            <span style={{ color: "var(--amber)" }}>
              ⚠ 高风险操作: {call.function.name}({call.function.arguments}) —
              等待审批
            </span>,
          )
        } else {
          const result = await executeTool(call.function.name, args)
          addLog(
            <span style={{ color: "var(--accent)" }}>
              ✅ 自动执行: {call.function.name} → {result}
            </span>,
          )
          safeResults.push({
            role: "tool",
            content: result,
            tool_call_id: call.id,
          })
        }
      }

      const nextMsgs =
        safeResults.length > 0 ? [...updatedMsgs, ...safeResults] : updatedMsgs
      setMessages(nextMsgs)

      if (riskyQueue.length > 0) {
        setPending(riskyQueue)
      } else {
        await step(nextMsgs)
      }
    } catch (e) {
      addLog(
        <span style={{ color: "var(--red)" }}>
          错误: {e instanceof Error ? e.message : String(e)}
        </span>,
      )
      setLoading(false)
    }
  }

  async function decide(callId: string, approved: boolean) {
    const call = pending.find((c) => c.id === callId)
    if (!call) return

    const remaining = pending.filter((c) => c.id !== callId)
    setPending(remaining)

    let result: string
    if (approved) {
      result = await executeTool(call.name, call.args)
      addLog(
        <span style={{ color: "var(--green)" }}>
          ✅ 已批准: {call.name} → {result}
        </span>,
      )
    } else {
      result = "操作被用户拒绝"
      addLog(<span style={{ color: "var(--red)" }}>✗ 已拒绝: {call.name}</span>)
    }

    const toolMsg: Message = {
      role: "tool",
      content: result,
      tool_call_id: callId,
    }
    const nextMsgs = [...messages, toolMsg]
    setMessages(nextMsgs)

    if (remaining.length === 0) {
      await step(nextMsgs)
    }
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
        title="Human-in-the-Loop · 人工审批"
        desc="高风险操作自动暂停，等待人工确认后继续执行。演示 interruptBefore 静态断点机制。"
      >
        <Tag color="amber">阶段三</Tag>
      </PanelHeader>

      <SplitLayout
        leftWidth={320}
        left={
          <>
            <Card>
              <CardHead>
                <CardTitle>执行指令</CardTitle>
              </CardHead>
              <CardBody>
                <Col>
                  <FieldLabel>指令（包含高风险操作时自动暂停）</FieldLabel>
                  <Textarea value={input} onChange={setInput} rows={3} />
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--text3)",
                      lineHeight: 1.6,
                      padding: "6px 10px",
                      background: "var(--surface2)",
                      borderRadius: 6,
                    }}
                  >
                    <span style={{ color: "var(--red)" }}>⚡ 需审批：</span>
                    delete_data、send_email
                    <br />
                    <span style={{ color: "var(--green)" }}>✅ 自动执行：</span>
                    query_data、get_info
                  </div>
                  <Btn onClick={run} disabled={loading}>
                    {loading ? <Spinner /> : "▶"} 执行（遇高风险暂停）
                  </Btn>
                </Col>
              </CardBody>
            </Card>

            <Card>
              <CardHead>
                <CardTitle>审批队列</CardTitle>
                {pending.length > 0 && (
                  <span
                    style={{
                      marginLeft: "auto",
                      fontSize: 11,
                      background: "var(--amber-dim)",
                      color: "var(--amber)",
                      padding: "2px 8px",
                      borderRadius: 4,
                      fontFamily: "var(--mono)",
                    }}
                  >
                    {pending.length} 待审批
                  </span>
                )}
              </CardHead>
              <CardBody>
                {pending.length === 0 ? (
                  <div style={{ fontSize: 12, color: "var(--text3)" }}>
                    暂无待审批操作
                  </div>
                ) : (
                  <Col gap={10}>
                    {pending.map((call) => (
                      <div
                        key={call.id}
                        style={{
                          background: "var(--amber-dim)",
                          border: "1px solid rgba(245,158,11,.3)",
                          borderRadius: 8,
                          padding: 14,
                          animation: "slide-up .3s ease",
                        }}
                      >
                        <div
                          style={{
                            color: "var(--amber)",
                            fontWeight: 600,
                            fontSize: 13,
                            marginBottom: 8,
                          }}
                        >
                          ⚠ 待审批：{call.name}
                        </div>
                        <pre
                          style={{
                            background: "var(--bg)",
                            borderRadius: 6,
                            padding: "8px 10px",
                            fontSize: 11,
                            fontFamily: "var(--mono)",
                            color: "var(--text2)",
                            marginBottom: 10,
                            whiteSpace: "pre-wrap",
                            wordBreak: "break-all",
                          }}
                        >
                          {call.display}
                        </pre>
                        <div style={{ display: "flex", gap: 8 }}>
                          <Btn
                            variant="green"
                            onClick={() => decide(call.id, true)}
                            style={{ flex: 1 }}
                          >
                            ✓ 批准
                          </Btn>
                          <Btn
                            variant="danger"
                            onClick={() => decide(call.id, false)}
                            style={{ flex: 1 }}
                          >
                            ✗ 拒绝
                          </Btn>
                        </div>
                      </div>
                    ))}
                  </Col>
                )}
              </CardBody>
            </Card>
          </>
        }
        right={
          <Card style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <CardHead>
              <CardTitle>执行日志</CardTitle>
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
