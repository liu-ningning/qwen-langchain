import { useState, useRef } from "react"
import { useQwen } from "../hooks/useQwen"
import {
  Card,
  CardHead,
  CardTitle,
  CardBody,
  OutputBox,
  Btn,
  FieldLabel,
  Select,
  Textarea,
  Tag,
  PanelHeader,
  SplitLayout,
  Col,
  Sep,
  Spinner,
} from "./ui"

export default function StreamPanel({
  apiKey,
  model,
}: {
  apiKey: string
  model: string
}) {
  const { stream, status } = useQwen(apiKey, model)
  const [prompt, setPrompt] = useState(
    "用 3 个要点介绍 LangChain 的核心价值，每个要点一句话",
  )
  const [streamMode, setStreamMode] = useState("messages")
  const [output, setOutput] = useState("")
  const [tokenCount, setTokenCount] = useState(0)
  const [elapsed, setElapsed] = useState("-")
  const t0Ref = useRef(0)
  const loading = status === "loading"

  async function run() {
    setOutput("")
    setTokenCount(0)
    setElapsed("-")
    t0Ref.current = Date.now()
    let count = 0

    await stream(
      { messages: [{ role: "user", content: prompt }], maxTokens: 600 },
      (token) => {
        count++
        setOutput((prev) => prev + token)
        setTokenCount(count)
        setElapsed(((Date.now() - t0Ref.current) / 1000).toFixed(1) + "s")
      },
      () => {
        setElapsed(
          ((Date.now() - t0Ref.current) / 1000).toFixed(2) + "s (完成)",
        )
        if (streamMode === "updates") {
          setOutput(
            (prev) => prev + "\n\n[updates] ← 以上为 llm_node 输出的消息增量",
          )
        } else if (streamMode === "values") {
          setOutput(
            (prev) =>
              prev +
              "\n\n[values] ← 以上为完整 State.messages 中最新消息的内容",
          )
        }
      },
    )
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
        title="流式输出 · SSE"
        desc="逐 token 实时显示模型输出。演示 streamMode 三种模式：messages / updates / values。"
      >
        <Tag color="green">阶段二</Tag>
      </PanelHeader>

      <SplitLayout
        leftWidth={300}
        left={
          <Card>
            <CardHead>
              <CardTitle>配置</CardTitle>
            </CardHead>
            <CardBody>
              <Col>
                <div>
                  <FieldLabel>streamMode</FieldLabel>
                  <Select
                    value={streamMode}
                    onChange={setStreamMode}
                    options={[
                      {
                        value: "messages",
                        label: "messages — 纯消息流（聊天推荐）",
                      },
                      { value: "updates", label: "updates — 节点变更差量" },
                      { value: "values", label: "values — 完整 State 快照" },
                    ]}
                  />
                </div>
                <div>
                  <FieldLabel>提示词</FieldLabel>
                  <Textarea value={prompt} onChange={setPrompt} rows={4} />
                </div>
                <Btn onClick={run} disabled={loading}>
                  {loading ? <Spinner /> : "▶"} 开始流式
                </Btn>

                <Sep />
                <FieldLabel>实时统计</FieldLabel>
                <div style={{ display: "flex", gap: 20, marginTop: 4 }}>
                  <div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--text3)",
                        fontFamily: "var(--mono)",
                      }}
                    >
                      输出 tokens
                    </div>
                    <div
                      style={{
                        fontSize: 20,
                        fontWeight: 700,
                        color: "var(--green)",
                        fontFamily: "var(--mono)",
                      }}
                    >
                      {tokenCount}
                    </div>
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--text3)",
                        fontFamily: "var(--mono)",
                      }}
                    >
                      耗时
                    </div>
                    <div
                      style={{
                        fontSize: 16,
                        fontWeight: 600,
                        color: "var(--amber)",
                        fontFamily: "var(--mono)",
                      }}
                    >
                      {elapsed}
                    </div>
                  </div>
                </div>

                <Sep />
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--text3)",
                    lineHeight: 1.7,
                  }}
                >
                  <div style={{ color: "var(--text2)", marginBottom: 4 }}>
                    streamMode 说明
                  </div>
                  <div>
                    <span style={{ color: "var(--accent)" }}>messages</span> —
                    只输出消息内容，聊天场景推荐
                  </div>
                  <div>
                    <span style={{ color: "var(--accent)" }}>updates</span> —
                    输出每个节点执行后 State 的变更部分
                  </div>
                  <div>
                    <span style={{ color: "var(--accent)" }}>values</span> —
                    输出完整 State 快照，调试时用
                  </div>
                </div>
              </Col>
            </CardBody>
          </Card>
        }
        right={
          <Card style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <CardHead>
              <CardTitle>流式输出（打字机效果）</CardTitle>
              <span
                style={{
                  marginLeft: "auto",
                  fontSize: 11,
                  color: "var(--text3)",
                  fontFamily: "var(--mono)",
                }}
              >
                {streamMode}
              </span>
            </CardHead>
            <CardBody style={{ flex: 1 }}>
              <OutputBox style={{ flex: 1, minHeight: 200 }}>
                {output ? (
                  <span style={{ color: "var(--green)" }}>
                    {output}
                    {loading && (
                      <span
                        style={{
                          borderRight: "2px solid var(--accent)",
                          animation: "blink 1s infinite",
                        }}
                      >
                        &nbsp;
                      </span>
                    )}
                  </span>
                ) : (
                  <span style={{ color: "var(--text3)" }}>等待执行...</span>
                )}
              </OutputBox>
            </CardBody>
          </Card>
        }
      />
    </div>
  )
}
