import { useState } from "react"
import { callQwen } from "../lib/qwen"
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

type ParserType = "string" | "json" | "list"

const PARSER_INFO: Record<
  ParserType,
  { label: string; desc: string; color: string }
> = {
  string: {
    label: "StringOutputParser",
    desc: "直接提取 .content 文本，最常用",
    color: "var(--accent)",
  },
  json: {
    label: "JsonOutputParser",
    desc: "解析 JSON 字符串为 JS 对象",
    color: "var(--green)",
  },
  list: {
    label: "CommaSeparatedListOutputParser",
    desc: "解析逗号分隔的列表为数组",
    color: "var(--amber)",
  },
}

function buildPrompt(type: ParserType, input: string): string {
  if (type === "string")
    return `请分析以下产品评价，给出简洁的总体评价：\n\n${input}`
  if (type === "json")
    return `分析以下内容，只返回 JSON（不要 markdown 代码块），格式：{"sentiment":"positive/negative/neutral","score":0.0,"keywords":["词1","词2"],"summary":"一句话总结"}\n\n${input}`
  return `从以下内容中提取 5 个关键词，只返回逗号分隔的词语，不要其他任何文字：\n\n${input}`
}

function parseOutput(
  type: ParserType,
  raw: string,
): { result: string; error?: string } {
  if (type === "string") return { result: raw }
  if (type === "json") {
    try {
      const clean = raw.replace(/```json|```/g, "").trim()
      const obj = JSON.parse(clean)
      return { result: JSON.stringify(obj, null, 2) }
    } catch (e) {
      return {
        result: raw,
        error: `JSON.parse 失败: ${e instanceof Error ? e.message : String(e)}`,
      }
    }
  }
  // list
  const items = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
  return { result: items.map((w, i) => `[${i}] "${w}"`).join("\n") }
}

export default function ParsersPanel({
  apiKey,
  model,
}: {
  apiKey: string
  model: string
}) {
  const [type, setType] = useState<ParserType>("string")
  const [input, setInput] = useState(
    "「这款耳机音质真的太棒了，佩戴也很舒适，就是价格稍贵了一点，总体来说非常值得购买！」",
  )
  const [rawOutput, setRawOutput] = useState("")
  const [parsed, setParsed] = useState("")
  const [parseError, setParseError] = useState("")
  const [loading, setLoading] = useState(false)

  async function run() {
    if (!apiKey) {
      alert("请先输入 API Key")
      return
    }
    setLoading(true)
    setRawOutput("")
    setParsed("")
    setParseError("")

    const prompt = buildPrompt(type, input)
    try {
      const res = await callQwen(apiKey, {
        messages: [{ role: "user", content: prompt }],
        model,
        maxTokens: 400,
        temperature: 0,
      })
      const raw = res.choices[0].message.content
      setRawOutput(raw)
      const { result, error } = parseOutput(type, raw)
      setParsed(result)
      if (error) setParseError(error)
    } catch (e) {
      setRawOutput(`错误: ${e instanceof Error ? e.message : String(e)}`)
    }
    setLoading(false)
  }

  const info = PARSER_INFO[type]

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
        title="Output Parsers · 输出解析器"
        desc="StringOutputParser 提取纯文本；JsonOutputParser 解析 JSON；CommaSeparated 解析列表。"
      >
        <Tag color="green">补充B</Tag>
      </PanelHeader>

      <SplitLayout
        leftWidth={340}
        left={
          <Card>
            <CardHead>
              <CardTitle>解析器配置</CardTitle>
            </CardHead>
            <CardBody>
              <Col>
                <div>
                  <FieldLabel>Parser 类型</FieldLabel>
                  <Select
                    value={type}
                    onChange={(v) => setType(v as ParserType)}
                    options={[
                      { value: "string", label: "StringOutputParser — 纯文本" },
                      { value: "json", label: "JsonOutputParser — JSON 对象" },
                      { value: "list", label: "CommaSeparated — 数组列表" },
                    ]}
                  />
                </div>

                {/* Parser info card */}
                <div
                  style={{
                    padding: "10px 12px",
                    borderRadius: 7,
                    fontSize: 12,
                    lineHeight: 1.6,
                    border: `1px solid ${info.color}33`,
                    background: `${info.color}11`,
                  }}
                >
                  <div
                    style={{
                      color: info.color,
                      fontFamily: "var(--mono)",
                      fontWeight: 600,
                      marginBottom: 4,
                      fontSize: 11,
                    }}
                  >
                    {info.label}
                  </div>
                  <div style={{ color: "var(--text2)" }}>{info.desc}</div>
                </div>

                <div>
                  <FieldLabel>输入文本</FieldLabel>
                  <Textarea value={input} onChange={setInput} rows={4} />
                </div>

                <div
                  style={{
                    padding: "9px 11px",
                    borderRadius: 6,
                    fontSize: 12,
                    background: "var(--bg)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <div
                    style={{
                      fontSize: 10,
                      color: "var(--text3)",
                      fontFamily: "var(--mono)",
                      marginBottom: 5,
                    }}
                  >
                    生成的 Prompt（传给 LLM）
                  </div>
                  <div
                    style={{
                      color: "var(--text2)",
                      fontSize: 12,
                      lineHeight: 1.5,
                    }}
                  >
                    {buildPrompt(type, input).slice(0, 120)}...
                  </div>
                </div>

                <Btn onClick={run} disabled={loading}>
                  {loading ? <Spinner /> : "▶"} 运行解析
                </Btn>
              </Col>
            </CardBody>
          </Card>
        }
        right={
          <Card style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <CardHead>
              <CardTitle>原始输出 → 解析结果</CardTitle>
            </CardHead>
            <CardBody
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              <div>
                <FieldLabel>模型原始输出（AIMessage.content）</FieldLabel>
                <OutputBox style={{ minHeight: 80 }}>
                  {loading ? (
                    <Spinner />
                  ) : (
                    rawOutput || (
                      <span style={{ color: "var(--text3)" }}>-</span>
                    )
                  )}
                </OutputBox>
              </div>

              <Sep />

              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <FieldLabel>{info.label} 处理后</FieldLabel>
                  {parseError && (
                    <span
                      style={{
                        fontSize: 10,
                        color: "var(--red)",
                        fontFamily: "var(--mono)",
                      }}
                    >
                      ⚠ {parseError}
                    </span>
                  )}
                </div>
                <OutputBox style={{ flex: 1, minHeight: 100 }}>
                  {parsed ? (
                    <span style={{ color: info.color }}>{parsed}</span>
                  ) : (
                    <span style={{ color: "var(--text3)" }}>-</span>
                  )}
                </OutputBox>
              </div>

              <div
                style={{
                  padding: "10px 12px",
                  borderRadius: 6,
                  fontSize: 12,
                  lineHeight: 1.7,
                  background: "var(--surface2)",
                  border: "1px solid var(--border)",
                }}
              >
                <span style={{ color: "var(--text2)" }}>LCEL 三件套口诀：</span>{" "}
                <code style={{ color: "var(--accent2)" }}>Prompt</code>
                {" → "}
                <code style={{ color: "var(--accent)" }}>Model</code>
                {" → "}
                <code style={{ color: info.color }}>Parser</code>
              </div>
            </CardBody>
          </Card>
        }
      />
    </div>
  )
}
