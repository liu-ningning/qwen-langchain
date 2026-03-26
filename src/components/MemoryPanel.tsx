import { useState, useRef, useEffect } from "react"
import { callQwen } from "../lib/qwen"
import type { Message } from "../lib/qwen"
import { Btn, FieldLabel, Input, Tag, PanelHeader, Spinner } from "./ui"

interface ChatMsg {
  role: "user" | "assistant"
  content: string
}
interface Session {
  id: string
  messages: ChatMsg[]
}

let sessionCounter = 0

export default function MemoryPanel({
  apiKey,
  model,
}: {
  apiKey: string
  model: string
}) {
  const [sessions, setSessions] = useState<Record<string, Session>>({})
  const [currentId, setCurrentId] = useState<string | null>(null)
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [sessions, currentId])

  function newThread() {
    sessionCounter++
    const id = `session-${String(sessionCounter).padStart(3, "0")}`
    setSessions((prev) => ({ ...prev, [id]: { id, messages: [] } }))
    setCurrentId(id)
  }

  function switchThread() {
    const ids = Object.keys(sessions)
    if (ids.length < 2) {
      alert("请先创建多个会话再切换")
      return
    }
    const idx = ids.indexOf(currentId ?? "")
    setCurrentId(ids[(idx + 1) % ids.length])
  }

  async function send() {
    if (!apiKey) {
      alert("请先输入 API Key")
      return
    }
    if (!input.trim()) return
    if (!currentId) {
      alert("请先创建会话")
      return
    }

    const userMsg: ChatMsg = { role: "user", content: input }
    setSessions((prev) => ({
      ...prev,
      [currentId]: {
        ...prev[currentId],
        messages: [...prev[currentId].messages, userMsg],
      },
    }))
    setInput("")
    setLoading(true)

    try {
      const history = sessions[currentId]?.messages ?? []
      const apiMsgs: Message[] = [
        ...history.map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
        { role: "user", content: input },
      ]
      const res = await callQwen(apiKey, {
        messages: apiMsgs,
        model,
        system:
          "你是一个有记忆的助手。请记住用户告诉你的所有信息，并在回答中自然地体现你记住了这些内容。",
        maxTokens: 400,
      })
      const reply = res.choices[0].message.content
      setSessions((prev) => ({
        ...prev,
        [currentId]: {
          ...prev[currentId],
          messages: [
            ...prev[currentId].messages,
            { role: "assistant", content: reply },
          ],
        },
      }))
    } catch (e) {
      const err = e instanceof Error ? e.message : String(e)
      setSessions((prev) => ({
        ...prev,
        [currentId]: {
          ...prev[currentId],
          messages: [
            ...prev[currentId].messages,
            { role: "assistant", content: `⚠ 错误: ${err}` },
          ],
        },
      }))
    }
    setLoading(false)
  }

  const current = currentId ? sessions[currentId] : null
  const allIds = Object.keys(sessions)

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
        title="短期记忆 · Thread 会话"
        desc="同一 thread_id 保持上下文；切换会话完全隔离。演示 Checkpointer 跨轮次记忆。"
      >
        <Tag color="green">阶段二</Tag>
      </PanelHeader>

      {/* Thread bar */}
      <div
        style={{
          padding: "8px 20px",
          background: "rgba(91,127,255,.06)",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          gap: 10,
          flexWrap: "wrap",
        }}
      >
        <span
          style={{
            fontSize: 11,
            color: "var(--text3)",
            fontFamily: "var(--mono)",
          }}
        >
          Thread:
        </span>
        <span
          style={{
            fontSize: 12,
            color: "var(--accent)",
            fontFamily: "var(--mono)",
          }}
        >
          {currentId ?? "—"}
        </span>
        <div style={{ display: "flex", gap: 6, marginLeft: 4 }}>
          {allIds.map((id) => (
            <button
              key={id}
              onClick={() => setCurrentId(id)}
              style={{
                padding: "3px 10px",
                borderRadius: 5,
                fontSize: 11,
                fontFamily: "var(--mono)",
                border: `1px solid ${id === currentId ? "var(--accent)" : "var(--border2)"}`,
                background:
                  id === currentId ? "var(--accent-dim)" : "var(--surface2)",
                color: id === currentId ? "var(--accent)" : "var(--text2)",
                cursor: "pointer",
              }}
            >
              {id}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 6, marginLeft: "auto" }}>
          <Btn
            variant="secondary"
            onClick={newThread}
            style={{ padding: "3px 10px", fontSize: 11 }}
          >
            + 新会话
          </Btn>
          <Btn
            variant="secondary"
            onClick={switchThread}
            style={{ padding: "3px 10px", fontSize: 11 }}
          >
            ↔ 切换
          </Btn>
        </div>
        <span
          style={{
            fontSize: 11,
            color: "var(--text3)",
            fontFamily: "var(--mono)",
          }}
        >
          共 {allIds.length} 个会话
        </span>
      </div>

      {/* Chat area */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "16px 24px",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {!current ? (
          <div
            style={{
              textAlign: "center",
              color: "var(--text3)",
              fontSize: 13,
              marginTop: 40,
            }}
          >
            点击「+ 新会话」开始对话
          </div>
        ) : current.messages.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              color: "var(--text3)",
              fontSize: 13,
              marginTop: 40,
            }}
          >
            开始对话，Agent 会记住本会话中的所有信息
          </div>
        ) : (
          current.messages.map((m, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                gap: 10,
                maxWidth: "78%",
                alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                flexDirection: m.role === "user" ? "row-reverse" : "row",
                animation: "slide-up .2s ease",
              }}
            >
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 8,
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 14,
                  background:
                    m.role === "user" ? "var(--accent)" : "var(--surface2)",
                  border: "1px solid var(--border)",
                }}
              >
                {m.role === "user" ? "👤" : "🤖"}
              </div>
              <div
                style={{
                  padding: "10px 14px",
                  fontSize: 13.5,
                  lineHeight: 1.6,
                  background:
                    m.role === "user" ? "var(--accent)" : "var(--surface2)",
                  border:
                    m.role === "user" ? "none" : "1px solid var(--border)",
                  color: m.role === "user" ? "#fff" : "var(--text)",
                  borderRadius:
                    m.role === "user"
                      ? "10px 2px 10px 10px"
                      : "2px 10px 10px 10px",
                }}
              >
                {m.content}
              </div>
            </div>
          ))
        )}
        {loading && (
          <div
            style={{
              display: "flex",
              gap: 10,
              alignSelf: "flex-start",
              animation: "slide-up .2s ease",
            }}
          >
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                background: "var(--surface2)",
                border: "1px solid var(--border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 14,
              }}
            >
              🤖
            </div>
            <div
              style={{
                padding: "10px 14px",
                borderRadius: "2px 10px 10px 10px",
                background: "var(--surface2)",
                border: "1px solid var(--border)",
              }}
            >
              <Spinner />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div
        style={{
          padding: "12px 20px",
          borderTop: "1px solid var(--border)",
          background: "var(--surface)",
          display: "flex",
          gap: 10,
        }}
      >
        <Input
          value={input}
          onChange={setInput}
          placeholder="输入消息（如：我叫张三，我喜欢 Python）"
          style={{ flex: 1 }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              send()
            }
          }}
        />
        <Btn onClick={send} disabled={loading || !input.trim()}>
          {loading ? <Spinner /> : "发送"}
        </Btn>
      </div>
    </div>
  )
}
