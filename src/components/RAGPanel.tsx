import { useState } from "react"
import { callQwen } from "../lib/qwen"
import { KB_DOCS, searchKB } from "../lib/rag"
import type { KBDoc } from "../lib/rag"
import {
  Card,
  CardHead,
  CardTitle,
  CardBody,
  OutputBox,
  Btn,
  FieldLabel,
  Input,
  Select,
  Tag,
  PanelHeader,
  SplitLayout,
  Col,
  Row,
  Spinner,
} from "./ui"

export default function RAGPanel({
  apiKey,
  model,
}: {
  apiKey: string
  model: string
}) {
  const [query, setQuery] = useState("LangChain 如何进行流式输出？")
  const [topK, setTopK] = useState("2")
  const [retrieved, setRetrieved] = useState<KBDoc[]>([])
  const [answer, setAnswer] = useState("")
  const [mode, setMode] = useState("")
  const [loading, setLoading] = useState(false)
  const [matchedIds, setMatchedIds] = useState<Set<number>>(new Set())

  async function run(withRAG: boolean) {
    if (!apiKey) {
      alert("请先输入 API Key")
      return
    }
    setLoading(true)
    setAnswer("")
    setRetrieved([])
    setMatchedIds(new Set())
    setMode(withRAG ? "✦ RAG 模式" : "✧ 无 RAG 对比")

    let prompt = query
    if (withRAG) {
      const docs = searchKB(query, parseInt(topK))
      setRetrieved(docs)
      setMatchedIds(new Set(docs.map((d) => d.id)))
      const ctx = docs.map((d) => `[来源: ${d.source}]\n${d.text}`).join("\n\n")
      prompt = `基于以下知识库内容回答用户问题。只使用知识库中的信息，不要编造。\n\n知识库内容：\n${ctx}\n\n用户问题：${query}`
    }

    try {
      const res = await callQwen(apiKey, {
        messages: [{ role: "user", content: prompt }],
        model,
        maxTokens: 500,
      })
      setAnswer(res.choices[0].message.content)
    } catch (e) {
      setAnswer(`错误: ${e instanceof Error ? e.message : String(e)}`)
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
        title="RAG · 知识库检索"
        desc="模拟向量检索：相似度搜索 → 拼入 Prompt → LLM 回答。对比有/无 RAG 的效果差异。"
      >
        <Tag color="blue">阶段三</Tag>
      </PanelHeader>

      <SplitLayout
        leftWidth={340}
        left={
          <>
            <Card>
              <CardHead>
                <CardTitle>知识库文档（{KB_DOCS.length} 条）</CardTitle>
              </CardHead>
              <CardBody
                style={{
                  maxHeight: 280,
                  overflowY: "auto",
                  padding: "10px 12px",
                }}
              >
                <Col gap={6}>
                  {KB_DOCS.map((doc) => {
                    const matched = matchedIds.has(doc.id)
                    const score = retrieved.find((d) => d.id === doc.id)?.score
                    return (
                      <div
                        key={doc.id}
                        style={{
                          padding: "9px 11px",
                          borderRadius: 7,
                          fontSize: 12,
                          lineHeight: 1.5,
                          border: `1px solid ${matched ? "var(--green)" : "var(--border)"}`,
                          background: matched
                            ? "var(--green-dim)"
                            : "var(--surface2)",
                          transition: "all .3s",
                        }}
                      >
                        {doc.text}
                        <div
                          style={{
                            fontSize: 10,
                            color: "var(--text3)",
                            marginTop: 4,
                            fontFamily: "var(--mono)",
                          }}
                        >
                          {doc.source}
                          {score !== undefined && (
                            <span
                              style={{ color: "var(--green)", marginLeft: 8 }}
                            >
                              相似度 {(score * 100).toFixed(0)}%
                            </span>
                          )}
                        </div>
                        {score !== undefined && (
                          <div
                            style={{
                              height: 2,
                              borderRadius: 1,
                              background: "var(--border)",
                              marginTop: 5,
                              overflow: "hidden",
                            }}
                          >
                            <div
                              style={{
                                height: "100%",
                                width: `${score * 100}%`,
                                background: "var(--green)",
                                transition: "width .6s",
                              }}
                            />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </Col>
              </CardBody>
            </Card>

            <Card>
              <CardHead>
                <CardTitle>查询配置</CardTitle>
              </CardHead>
              <CardBody>
                <Col>
                  <div>
                    <FieldLabel>用户问题</FieldLabel>
                    <Input value={query} onChange={setQuery} />
                  </div>
                  <Row gap={10}>
                    <div style={{ flex: 1 }}>
                      <FieldLabel>Top-K 检索数量</FieldLabel>
                      <Select
                        value={topK}
                        onChange={setTopK}
                        options={[
                          { value: "1", label: "Top-1" },
                          { value: "2", label: "Top-2" },
                          { value: "3", label: "Top-3" },
                        ]}
                      />
                    </div>
                  </Row>
                  <Row gap={8}>
                    <Btn
                      onClick={() => run(true)}
                      disabled={loading}
                      style={{ flex: 1 }}
                    >
                      {loading ? <Spinner /> : "▶"} 有 RAG
                    </Btn>
                    <Btn
                      onClick={() => run(false)}
                      disabled={loading}
                      variant="secondary"
                      style={{ flex: 1 }}
                    >
                      无 RAG 对比
                    </Btn>
                  </Row>
                </Col>
              </CardBody>
            </Card>
          </>
        }
        right={
          <Col gap={12} style={{ flex: 1, overflow: "hidden" }}>
            {retrieved.length > 0 && (
              <Card>
                <CardHead>
                  <CardTitle>检索到的文档</CardTitle>
                </CardHead>
                <CardBody>
                  <Col gap={8}>
                    {retrieved.map((doc) => (
                      <div
                        key={doc.id}
                        style={{
                          padding: "9px 11px",
                          borderRadius: 7,
                          fontSize: 12,
                          border: "1px solid var(--green)",
                          background: "var(--green-dim)",
                        }}
                      >
                        <div
                          style={{
                            fontSize: 10,
                            color: "var(--green)",
                            marginBottom: 4,
                            fontFamily: "var(--mono)",
                          }}
                        >
                          相似度 {((doc.score ?? 0) * 100).toFixed(0)}% ·{" "}
                          {doc.source}
                        </div>
                        {doc.text}
                      </div>
                    ))}
                  </Col>
                </CardBody>
              </Card>
            )}

            <Card style={{ flex: 1, display: "flex", flexDirection: "column" }}>
              <CardHead>
                <CardTitle>LLM 回答</CardTitle>
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
              <CardBody style={{ flex: 1 }}>
                <OutputBox style={{ minHeight: 120 }}>
                  {loading ? (
                    <Spinner />
                  ) : (
                    answer || (
                      <span style={{ color: "var(--text3)" }}>等待执行...</span>
                    )
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
