import { useState } from "react"
import { callQwen } from "../lib/qwen"
import { QWEN_MODELS } from "../lib/qwen"
import {
  Card,
  CardHead,
  CardTitle,
  CardBody,
  OutputBox,
  Btn,
  FieldLabel,
  Select,
  Input,
  Tag,
  PanelHeader,
  SplitLayout,
  Col,
  Sep,
  Spinner,
} from "./ui"

type ModelStatus = "idle" | "trying" | "ok" | "fail"

interface ModelRow {
  id: string
  name: string
  modelId: string
  status: ModelStatus
}

const STATUS_STYLE: Record<
  ModelStatus,
  { text: string; bg: string; color: string; rowBg: string; rowBorder: string }
> = {
  idle: {
    text: "待机",
    bg: "var(--surface)",
    color: "var(--text3)",
    rowBg: "var(--surface2)",
    rowBorder: "var(--border)",
  },
  trying: {
    text: "尝试中…",
    bg: "var(--amber-dim)",
    color: "var(--amber)",
    rowBg: "var(--amber-dim)",
    rowBorder: "var(--amber)",
  },
  ok: {
    text: "成功 ✓",
    bg: "var(--green-dim)",
    color: "var(--green)",
    rowBg: "var(--green-dim)",
    rowBorder: "var(--green)",
  },
  fail: {
    text: "失败 ✗",
    bg: "var(--red-dim)",
    color: "var(--red)",
    rowBg: "var(--red-dim)",
    rowBorder: "var(--red)",
  },
}

export default function FallbackPanel({
  apiKey,
  model,
}: {
  apiKey: string
  model: string
}) {
  const [scenario, setScenario] = useState("ok")
  const [question, setQuestion] = useState("用一句话解释什么是 RAG")
  const [models, setModels] = useState<ModelRow[]>([
    {
      id: "primary",
      name: "主模型",
      modelId: "qwen-max-latest",
      status: "idle",
    },
    { id: "fb1", name: "备用 #1", modelId: "qwen-plus-latest", status: "idle" },
    {
      id: "fb2",
      name: "备用 #2",
      modelId: "qwen-turbo-latest",
      status: "idle",
    },
  ])
  const [logs, setLogs] = useState<React.ReactNode[]>([])
  const [answer, setAnswer] = useState("")
  const [loading, setLoading] = useState(false)

  function addLog(node: React.ReactNode) {
    setLogs((prev) => [...prev, node])
  }

  function setModelStatus(id: string, status: ModelStatus) {
    setModels((prev) => prev.map((m) => (m.id === id ? { ...m, status } : m)))
  }

  async function run() {
    if (!apiKey) {
      alert("请先输入 API Key")
      return
    }
    setLogs([])
    setAnswer("")
    setModels((prev) => prev.map((m) => ({ ...m, status: "idle" })))
    setLoading(true)

    const scenarioLabel = {
      ok: "主模型正常响应",
      fail1: "主模型超时 → 切换备用#1",
      fail2: "主 + 备用#1 均失败 → 切换备用#2",
    }[scenario]

    addLog(
      <span style={{ color: "var(--text3)", fontStyle: "italic" }}>
        场景：{scenarioLabel}
      </span>,
    )
    addLog(
      <span style={{ color: "var(--text3)", fontStyle: "italic" }}>
        问题："{question}"
      </span>,
    )
    addLog(<br />)

    const failMap: Record<string, boolean> = {
      primary: scenario !== "ok",
      fb1: scenario === "fail2",
      fb2: false,
    }

    try {
      for (const m of models) {
        setModelStatus(m.id, "trying")
        addLog(
          <span style={{ color: "var(--accent2)" }}>
            ⟶ 尝试：{m.name}（{m.modelId}）
          </span>,
        )
        await new Promise((r) => setTimeout(r, 700))

        if (failMap[m.id]) {
          setModelStatus(m.id, "fail")
          addLog(
            <span style={{ color: "var(--red)" }}>
              {" "}
              ✗ 失败（模拟：服务限流 429）— 切换备用
            </span>,
          )
          await new Promise((r) => setTimeout(r, 300))
          continue
        }

        // Real API call
        const res = await callQwen(apiKey, {
          messages: [{ role: "user", content: question }],
          model: m.modelId,
          maxTokens: 200,
        })
        const text = res.choices[0].message.content
        setModelStatus(m.id, "ok")
        addLog(
          <span style={{ color: "var(--green)" }}>
            {" "}
            ✓ 成功（{res.usage.completion_tokens} tokens）— 由 {m.modelId} 回答
          </span>,
        )
        setAnswer(text)
        break
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
        title="RunnableWithFallbacks · 容错链"
        desc="主模型失败时自动切换备用。演示 withFallbacks + withRetry，保障生产环境高可用。"
      >
        <Tag color="purple">补充E</Tag>
      </PanelHeader>

      <SplitLayout
        leftWidth={310}
        left={
          <Card>
            <CardHead>
              <CardTitle>容错链配置</CardTitle>
            </CardHead>
            <CardBody>
              <Col>
                <FieldLabel>模型优先级队列</FieldLabel>
                <Col gap={6}>
                  {models.map((m, i) => {
                    const s = STATUS_STYLE[m.status]
                    return (
                      <div
                        key={m.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          padding: "9px 12px",
                          borderRadius: 7,
                          border: `1px solid ${s.rowBorder}`,
                          background: s.rowBg,
                          transition: "all .3s",
                        }}
                      >
                        <div
                          style={{
                            width: 20,
                            height: 20,
                            borderRadius: 4,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background: "var(--surface2)",
                            fontSize: 11,
                            color: "var(--text3)",
                            fontFamily: "var(--mono)",
                          }}
                        >
                          {i + 1}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div
                            style={{
                              fontSize: 12,
                              color: "var(--text)",
                              fontFamily: "var(--mono)",
                            }}
                          >
                            {m.name}
                          </div>
                          <div style={{ fontSize: 10, color: "var(--text3)" }}>
                            {m.modelId}
                          </div>
                        </div>
                        <span
                          style={{
                            fontSize: 10,
                            padding: "2px 8px",
                            borderRadius: 4,
                            background: s.bg,
                            color: s.color,
                          }}
                        >
                          {m.status === "trying" ? (
                            <>
                              <Spinner /> {s.text}
                            </>
                          ) : (
                            s.text
                          )}
                        </span>
                      </div>
                    )
                  })}
                </Col>

                <Sep />

                <div>
                  <FieldLabel>模拟场景</FieldLabel>
                  <Select
                    value={scenario}
                    onChange={setScenario}
                    options={[
                      { value: "ok", label: "主模型正常响应" },
                      { value: "fail1", label: "主模型失败 → 切换备用#1" },
                      {
                        value: "fail2",
                        label: "主 + 备用#1 失败 → 切换备用#2",
                      },
                    ]}
                  />
                </div>
                <div>
                  <FieldLabel>问题</FieldLabel>
                  <Input value={question} onChange={setQuestion} />
                </div>
                <Btn onClick={run} disabled={loading}>
                  {loading ? <Spinner /> : "▶"} 执行容错链
                </Btn>

                <div
                  style={{
                    padding: "10px 12px",
                    borderRadius: 6,
                    background: "var(--surface2)",
                    border: "1px solid var(--border)",
                    fontSize: 12,
                    color: "var(--text3)",
                    lineHeight: 1.7,
                  }}
                >
                  <div style={{ color: "var(--text2)", marginBottom: 4 }}>
                    代码原理
                  </div>
                  <code style={{ color: "var(--accent)" }}>
                    primary.withFallbacks([fb1, fb2])
                  </code>
                  <br />
                  主模型失败 → 依次尝试备用
                </div>
              </Col>
            </CardBody>
          </Card>
        }
        right={
          <Col gap={12} style={{ flex: 1 }}>
            <Card style={{ flex: 1, display: "flex", flexDirection: "column" }}>
              <CardHead>
                <CardTitle>切换过程</CardTitle>
              </CardHead>
              <CardBody style={{ flex: 1, overflow: "auto" }}>
                <OutputBox
                  style={{
                    background: "transparent",
                    border: "none",
                    padding: 0,
                    minHeight: 120,
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

            <Card>
              <CardHead>
                <CardTitle>最终回答（由成功模型生成）</CardTitle>
              </CardHead>
              <CardBody>
                <OutputBox style={{ minHeight: 60 }}>
                  {answer ? (
                    <span style={{ color: "var(--green)" }}>{answer}</span>
                  ) : (
                    <span style={{ color: "var(--text3)" }}>-</span>
                  )}
                </OutputBox>
              </CardBody>
            </Card>
          </Col>
        }
      />
    </div>
  )
}
