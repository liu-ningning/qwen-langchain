import { useState } from "react"
import { QWEN_MODELS } from "./lib/qwen"
import LCELPanel from "./components/LCELPanel"
import ParsersPanel from "./components/ParsersPanel"
import AgentPanel from "./components/AgentPanel"
import StateGraphPanel from "./components/StateGraphPanel"
import MemoryPanel from "./components/MemoryPanel"
import RAGPanel from "./components/RAGPanel"
import HITLPanel from "./components/HITLPanel"
import FallbackPanel from "./components/FallbackPanel"
import StreamPanel from "./components/StreamPanel"

// ── Nav config ────────────────────────────────────────────
type PanelId =
  | "lcel"
  | "parsers"
  | "agent"
  | "stategraph"
  | "memory"
  | "rag"
  | "hitl"
  | "fallback"
  | "stream"

interface NavItem {
  id: PanelId
  icon: string
  label: string
  badge: string
  section: string
}

const NAV: NavItem[] = [
  { id: "lcel", icon: "⛓", label: "LCEL 管道链", badge: "A", section: "基础" },
  {
    id: "parsers",
    icon: "🔧",
    label: "Output Parsers",
    badge: "B",
    section: "基础",
  },
  {
    id: "agent",
    icon: "🤖",
    label: "createAgent",
    badge: "C",
    section: "Agent",
  },
  {
    id: "stategraph",
    icon: "🕸",
    label: "StateGraph",
    badge: "D",
    section: "Agent",
  },
  {
    id: "memory",
    icon: "💬",
    label: "短期记忆",
    badge: "E",
    section: "记忆 & 检索",
  },
  {
    id: "rag",
    icon: "📚",
    label: "RAG 检索",
    badge: "F",
    section: "记忆 & 检索",
  },
  {
    id: "hitl",
    icon: "✋",
    label: "Human-in-Loop",
    badge: "G",
    section: "高级",
  },
  { id: "fallback", icon: "🛡", label: "容错链", badge: "H", section: "高级" },
  {
    id: "stream",
    icon: "⚡",
    label: "流式输出 SSE",
    badge: "I",
    section: "高级",
  },
]

const SECTIONS = [...new Set(NAV.map((n) => n.section))]

export default function App() {
  const [apiKey, setApiKey] = useState("")
  const [model, setModel] = useState("qwen-plus-latest")
  const [active, setActive] = useState<PanelId>("lcel")

  const keyOk = apiKey.trim().length > 10

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      {/* ── HEADER ── */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          padding: "12px 22px",
          borderBottom: "1px solid var(--border)",
          background: "var(--surface)",
          position: "sticky",
          top: 0,
          zIndex: 100,
          flexShrink: 0,
        }}
      >
        {/* Logo */}
        <div>
          <div
            style={{
              fontFamily: "var(--sans)",
              fontWeight: 800,
              fontSize: 16,
              letterSpacing: "-0.3px",
              background: "linear-gradient(135deg, #5b7fff, #8b5cf6)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            千问 · LangChain Demo
          </div>
          <div
            style={{
              color: "var(--text3)",
              fontSize: 11,
              fontFamily: "var(--mono)",
            }}
          >
            Qwen API · OpenAI-Compatible · React + TypeScript
          </div>
        </div>

        <div
          style={{
            marginLeft: "auto",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          {/* Model selector */}
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            style={{
              background: "var(--surface2)",
              border: "1px solid var(--border2)",
              borderRadius: 7,
              padding: "6px 10px",
              color: "var(--text)",
              fontSize: 12,
              fontFamily: "var(--mono)",
              outline: "none",
              cursor: "pointer",
            }}
          >
            {QWEN_MODELS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label} — {m.desc}
              </option>
            ))}
          </select>

          {/* Status dot */}
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              flexShrink: 0,
              background: keyOk ? "var(--green)" : "var(--text3)",
              boxShadow: keyOk ? "0 0 8px var(--green)" : "none",
              transition: "all .3s",
            }}
          />

          {/* API Key input */}
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="输入阿里云 DashScope API Key (sk-...)"
            style={{
              background: "var(--surface2)",
              border: `1px solid ${keyOk ? "var(--green)" : "var(--border2)"}`,
              borderRadius: 7,
              padding: "6px 12px",
              color: "var(--text)",
              fontFamily: "var(--mono)",
              fontSize: 12,
              width: 290,
              outline: "none",
              transition: "border-color .2s",
            }}
          />
        </div>
      </header>

      {/* ── BODY ── */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* ── SIDEBAR ── */}
        <nav
          style={{
            width: 210,
            minWidth: 210,
            borderRight: "1px solid var(--border)",
            background: "var(--surface)",
            padding: "12px 0",
            display: "flex",
            flexDirection: "column",
            gap: 2,
            overflowY: "auto",
            flexShrink: 0,
          }}
        >
          {SECTIONS.map((section) => (
            <div key={section}>
              <div
                style={{
                  padding: "10px 16px 4px",
                  fontSize: 10,
                  fontFamily: "var(--mono)",
                  color: "var(--text3)",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                }}
              >
                {section}
              </div>
              {NAV.filter((n) => n.section === section).map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActive(item.id)}
                  style={
                    {
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      width: "100%",
                      padding: "8px 16px",
                      cursor: "pointer",
                      border: "none",
                      borderLeft: `2px solid ${active === item.id ? "var(--accent)" : "transparent"}`,
                      background:
                        active === item.id
                          ? "var(--accent-dim)"
                          : "transparent",
                      color:
                        active === item.id ? "var(--accent)" : "var(--text2)",
                      fontSize: 13,
                      textAlign: "left",
                      transition: "all .15s",
                    } as React.CSSProperties
                  }
                  onMouseEnter={(e) => {
                    if (active !== item.id)
                      (e.currentTarget as HTMLButtonElement).style.background =
                        "var(--surface2)"
                  }}
                  onMouseLeave={(e) => {
                    if (active !== item.id)
                      (e.currentTarget as HTMLButtonElement).style.background =
                        "transparent"
                  }}
                >
                  <span
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 5,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 12,
                      background:
                        active === item.id
                          ? "rgba(91,127,255,.2)"
                          : "var(--surface2)",
                      flexShrink: 0,
                    }}
                  >
                    {item.icon}
                  </span>
                  <span
                    style={{
                      flex: 1,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {item.label}
                  </span>
                  <span
                    style={{
                      fontSize: 10,
                      fontFamily: "var(--mono)",
                      padding: "1px 6px",
                      borderRadius: 4,
                      flexShrink: 0,
                      background: "rgba(91,127,255,.12)",
                      color: "var(--accent)",
                    }}
                  >
                    {item.badge}
                  </span>
                </button>
              ))}
            </div>
          ))}
        </nav>

        {/* ── PANEL AREA ── */}
        <main
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            minWidth: 0,
          }}
        >
          {/* API key prompt */}
          {!keyOk && (
            <div
              style={{
                padding: "10px 20px",
                background: "rgba(245,158,11,.08)",
                borderBottom: "1px solid rgba(245,158,11,.2)",
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 12,
                color: "var(--amber)",
                flexShrink: 0,
              }}
            >
              <span>⚠</span>
              请在右上角输入阿里云 DashScope API Key，访问
              <a
                href="https://dashscope.console.aliyun.com/apiKey"
                target="_blank"
                rel="noreferrer"
                style={{ color: "var(--accent)", textDecoration: "underline" }}
              >
                dashscope.console.aliyun.com
              </a>
              获取。
            </div>
          )}

          {active === "lcel" && <LCELPanel apiKey={apiKey} model={model} />}
          {active === "parsers" && (
            <ParsersPanel apiKey={apiKey} model={model} />
          )}
          {active === "agent" && <AgentPanel apiKey={apiKey} model={model} />}
          {active === "stategraph" && (
            <StateGraphPanel apiKey={apiKey} model={model} />
          )}
          {active === "memory" && <MemoryPanel apiKey={apiKey} model={model} />}
          {active === "rag" && <RAGPanel apiKey={apiKey} model={model} />}
          {active === "hitl" && <HITLPanel apiKey={apiKey} model={model} />}
          {active === "fallback" && (
            <FallbackPanel apiKey={apiKey} model={model} />
          )}
          {active === "stream" && <StreamPanel apiKey={apiKey} model={model} />}
        </main>
      </div>
    </div>
  )
}
