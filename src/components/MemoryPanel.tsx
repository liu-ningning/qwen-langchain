import { useCallback, useEffect, useRef, useState } from "react"
import {
  createStoredSession,
  getStoredSession,
  listStoredSessions,
  replyToStoredSession,
} from "../lib/qwen"
import type {
  SessionMessage,
  SessionSummary,
  StoredSession,
} from "../lib/qwen"
import { Btn, Input, PanelHeader, Spinner, Tag } from "./ui"

export default function MemoryPanel({
  apiKey,
  model,
}: {
  apiKey: string
  model: string
}) {
  const [sessions, setSessions] = useState<SessionSummary[]>([])
  const [currentId, setCurrentId] = useState<string | null>(null)
  const [current, setCurrent] = useState<StoredSession | null>(null)
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [booting, setBooting] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)

  const updateSessionSummary = useCallback((session: StoredSession) => {
    setSessions((prev) => {
      const next = prev.some((item) => item.id === session.id)
        ? prev.map((item) =>
            item.id === session.id
              ? {
                  ...item,
                  title: session.title,
                  updatedAt: session.updatedAt,
                  messageCount: session.messages.length,
                }
              : item,
          )
        : [
            {
              id: session.id,
              title: session.title,
              createdAt: session.createdAt,
              updatedAt: session.updatedAt,
              messageCount: session.messages.length,
            },
            ...prev,
          ]

      return next.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    })
  }, [])

  const loadSessions = useCallback(async () => {
    setBooting(true)
    try {
      const data = await listStoredSessions()
      setSessions(data)
      setCurrentId((prev) => prev ?? data[0]?.id ?? null)
    } finally {
      setBooting(false)
    }
  }, [])

  const loadSession = useCallback(async (sessionId: string) => {
    const session = await getStoredSession(sessionId)
    setCurrent(session)
    updateSessionSummary(session)
  }, [updateSessionSummary])

  useEffect(() => {
    void loadSessions()
  }, [loadSessions])

  useEffect(() => {
    if (!currentId) {
      setCurrent(null)
      return
    }
    void loadSession(currentId)
  }, [currentId, loadSession])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [current, currentId, loading])

  async function newThread() {
    const session = await createStoredSession()
    updateSessionSummary(session)
    setCurrentId(session.id)
    setCurrent(session)
  }

  function switchThread() {
    const ids = sessions.map((session) => session.id)
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

    const message = input.trim()
    const optimisticMessage: SessionMessage = {
      id: `temp-${Date.now()}`,
      role: "user",
      content: message,
      createdAt: new Date().toISOString(),
    }

    setCurrent((prev) =>
      prev
        ? {
            ...prev,
            messages: [...prev.messages, optimisticMessage],
          }
        : prev,
    )
    setInput("")
    setLoading(true)

    try {
      const session = await replyToStoredSession({
        sessionId: currentId,
        message,
        model,
      })
      setCurrent(session)
      updateSessionSummary(session)
    } catch {
      await loadSession(currentId)
    }
    setLoading(false)
  }

  const allIds = sessions.map((session) => session.id)

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
          {sessions.map((session) => (
            <button
              key={session.id}
              onClick={() => setCurrentId(session.id)}
              style={{
                padding: "3px 10px",
                borderRadius: 5,
                fontSize: 11,
                fontFamily: "var(--mono)",
                border: `1px solid ${session.id === currentId ? "var(--accent)" : "var(--border2)"}`,
                background:
                  session.id === currentId
                    ? "var(--accent-dim)"
                    : "var(--surface2)",
                color:
                  session.id === currentId ? "var(--accent)" : "var(--text2)",
                cursor: "pointer",
              }}
              title={session.title}
            >
              {session.id}
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
        {booting ? (
          <div
            style={{
              textAlign: "center",
              color: "var(--text3)",
              fontSize: 13,
              marginTop: 40,
            }}
          >
            正在加载会话...
          </div>
        ) : !current ? (
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
            开始对话，消息会持久化保存到本地会话存储
          </div>
        ) : (
          current.messages.map((m, i) => (
            <div
              key={m.id ?? i}
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
              void send()
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
