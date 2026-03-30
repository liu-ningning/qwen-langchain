import { useState } from "react"
import { runLCELChain } from "../lib/qwen"
import {
  Card,
  CardHead,
  CardTitle,
  CardBody,
  OutputBox,
  Btn,
  FieldLabel,
  Input,
  Textarea,
  Tag,
  PanelHeader,
  SplitLayout,
  Col,
  Row,
  Sep,
  Spinner,
} from "./ui"

// Pipeline step node
function PipeNode({
  label,
  sub,
  color,
  active,
  done,
}: {
  label: string
  sub: string
  color: string
  active?: boolean
  done?: boolean
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 4,
        minWidth: 90,
      }}
    >
      <div
        style={{
          padding: "7px 12px",
          borderRadius: 7,
          fontSize: 11,
          fontFamily: "var(--mono)",
          fontWeight: 600,
          textAlign: "center",
          border: `1px solid ${color}44`,
          background: active
            ? `${color}22`
            : done
              ? `${color}0d`
              : `${color}11`,
          color: done ? `${color}88` : color,
          opacity: done ? 0.5 : 1,
          transform: active ? "scale(1.06)" : "scale(1)",
          boxShadow: active ? `0 0 14px ${color}66` : "none",
          transition: "all .3s",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 10,
          color: "var(--text3)",
          fontFamily: "var(--mono)",
        }}
      >
        {sub}
      </div>
    </div>
  )
}

export default function LCELPanel({
  model,
}: {
  apiKey: string
  model: string
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [template, setTemplate] = useState(
    "你是一个{role}，请用{style}风格，用一句话介绍：{topic}",
  )
  const [role, setRole] = useState("技术博主")
  const [style, setStyle] = useState("幽默")
  const [topic, setTopic] = useState("LangChain")
  const [output, setOutput] = useState("")
  const [meta, setMeta] = useState("")
  const [mode, setMode] = useState("")
  const [step, setStep] = useState(-1) // -1=idle 0=prompt 1=model 2=parser

  const animate = async (fn: () => Promise<void>) => {
    for (let i = 0; i <= 2; i++) {
      setStep(i)
      await new Promise((r) => setTimeout(r, 600))
    }
    await fn()
    setStep(-1)
  }

  const runChain = async () => {
    setLoading(true)
    setError(null)
    setOutput("")
    setMeta("")

    await animate(async () => {
      try {
        const res = await runLCELChain({
          model,
          template,
          role,
          style,
          topic,
          mode: "string",
        })
        setMode(res.mode)
        setOutput(res.output)
        setMeta(`⏱ ${res.elapsedMs}ms  ·  服务端 LangChain 链执行完成`)
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e))
      }
    })
    setLoading(false)
  }

  const runParallel = async () => {
    setLoading(true)
    setError(null)
    setOutput("⇉ 并行执行两条链...\n")
    setMeta("")
    setStep(1)

    try {
      const res = await runLCELChain({
        model,
        template,
        role,
        style,
        topic,
        mode: "parallel",
      })
      setMode(res.mode)
      setOutput(res.output)
      setMeta(`⏱ ${res.elapsedMs}ms  ·  服务端并行链执行完成`)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
    setStep(-1)
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
        title="LCEL · 管道链"
        desc="通过 .pipe() 将 Prompt → Model → Parser 串联。演示三段式链、多变量模板、并行链。"
      >
        <Tag color="blue">补充A</Tag>
      </PanelHeader>

      <SplitLayout
        leftWidth={340}
        left={
          <>
            <Card>
              <CardHead>
                <CardTitle>PIPELINE 结构</CardTitle>
              </CardHead>
              <CardBody>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0,
                    padding: "8px 0",
                    flexWrap: "wrap",
                  }}
                >
                  <PipeNode
                    label="PromptTemplate"
                    sub="格式化输入"
                    color="#8b5cf6"
                    active={step === 0}
                    done={step > 0}
                  />
                  <div
                    style={{
                      color: "var(--text3)",
                      fontSize: 16,
                      padding: "0 4px",
                      marginBottom: 16,
                    }}
                  >
                    →
                  </div>
                  <PipeNode
                    label={`${model}`}
                    sub="LLM 推理"
                    color="#5b7fff"
                    active={step === 1}
                    done={step > 1}
                  />
                  <div
                    style={{
                      color: "var(--text3)",
                      fontSize: 16,
                      padding: "0 4px",
                      marginBottom: 16,
                    }}
                  >
                    →
                  </div>
                  <PipeNode
                    label="StrOutputParser"
                    sub="提取文本"
                    color="#10d9a0"
                    active={step === 2}
                    done={step > 2}
                  />
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHead>
                <CardTitle>配置</CardTitle>
              </CardHead>
              <CardBody>
                <Col>
                  <div>
                    <FieldLabel>
                      模板（用 {"{"} 变量名 {"}"} 作占位符）
                    </FieldLabel>
                    <Textarea
                      value={template}
                      onChange={setTemplate}
                      rows={3}
                    />
                  </div>
                  <Row gap={10}>
                    <div style={{ flex: 1 }}>
                      <FieldLabel>role</FieldLabel>
                      <Input value={role} onChange={setRole} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <FieldLabel>style</FieldLabel>
                      <Input value={style} onChange={setStyle} />
                    </div>
                  </Row>
                  <div>
                    <FieldLabel>topic</FieldLabel>
                    <Input value={topic} onChange={setTopic} />
                  </div>
                  <Row gap={8}>
                    <Btn
                      onClick={runChain}
                      disabled={loading}
                      style={{ flex: 1 }}
                    >
                      {loading ? <Spinner /> : "▶"} 运行链
                    </Btn>
                    <Btn
                      onClick={runParallel}
                      disabled={loading}
                      variant="secondary"
                    >
                      ⇉ 并行链
                    </Btn>
                  </Row>
                </Col>
              </CardBody>
            </Card>
          </>
        }
        right={
          <Card style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <CardHead>
              <CardTitle>输出</CardTitle>
              {mode && (
                <span
                  style={{
                    marginLeft: "auto",
                    fontSize: 11,
                    color: "var(--accent)",
                    fontFamily: "var(--mono)",
                  }}
                >
                  {mode}
                </span>
              )}
            </CardHead>
            <CardBody
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              <OutputBox style={{ flex: 1, minHeight: 160 }}>
                {error ? (
                  <span style={{ color: "var(--red)" }}>错误: {error}</span>
                ) : (
                  output || (
                    <span style={{ color: "var(--text3)" }}>等待执行...</span>
                  )
                )}
              </OutputBox>
              {meta && (
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--text3)",
                    fontFamily: "var(--mono)",
                  }}
                >
                  {meta}
                </div>
              )}
              <Sep />
              <div
                style={{ fontSize: 12, color: "var(--text3)", lineHeight: 1.7 }}
              >
                <span style={{ color: "var(--text2)" }}>原理：</span>
                <code style={{ color: "var(--accent)" }}>
                  chain = prompt.pipe(model).pipe(new StringOutputParser())
                </code>
                <br />
                所有组件实现{" "}
                <code style={{ color: "var(--green)" }}>Runnable</code>{" "}
                接口，支持 invoke / stream / batch
              </div>
            </CardBody>
          </Card>
        }
      />
    </div>
  )
}
