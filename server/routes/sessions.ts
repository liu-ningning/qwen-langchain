import { Router } from "express"
import {
  appendMessage,
  createSession,
  getSession,
  listSessions,
} from "../lib/session-store.js"
import { assertApiKey, qwenApiKey, qwenBaseUrl } from "../lib/runtime.js"

const sessionsRouter = Router()

sessionsRouter.get("/sessions", async (_req, res) => {
  const sessions = await listSessions()
  res.json({ sessions })
})

sessionsRouter.post("/sessions", async (req, res) => {
  const title =
    typeof req.body?.title === "string" && req.body.title.trim()
      ? req.body.title.trim()
      : "新会话"
  const session = await createSession(title)
  res.status(201).json({ session })
})

sessionsRouter.get("/sessions/:sessionId", async (req, res) => {
  const session = await getSession(req.params.sessionId)
  if (!session) {
    res.status(404).json({ error: "会话不存在" })
    return
  }
  res.json({ session })
})

sessionsRouter.post("/sessions/:sessionId/reply", async (req, res) => {
  const { sessionId } = req.params
  const input =
    typeof req.body?.input === "string" ? req.body.input.trim() : ""
  const model =
    typeof req.body?.model === "string" && req.body.model.trim()
      ? req.body.model.trim()
      : "qwen-plus-latest"

  if (!input) {
    res.status(400).json({ error: "input is required" })
    return
  }

  const existing = await getSession(sessionId)
  if (!existing) {
    res.status(404).json({ error: "会话不存在" })
    return
  }

  const sessionWithUser = await appendMessage(sessionId, "user", input)
  if (!sessionWithUser) {
    res.status(404).json({ error: "会话不存在" })
    return
  }

  try {
    assertApiKey()
    const messages = [
      {
        role: "system",
        content:
          "你是一个有记忆的助手。请记住用户告诉你的所有信息，并在回答中自然地体现你记住了这些内容。",
      },
      ...sessionWithUser.messages.map((message) => ({
        role: message.role,
        content: message.content,
      })),
    ]

    const upstream = await fetch(`${qwenBaseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${qwenApiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: 400,
      }),
    })

    const json = (await upstream.json().catch(() => ({}))) as {
      choices?: Array<{ message?: { content?: string } }>
      error?: { message?: string }
    }

    if (!upstream.ok) {
      throw new Error(json.error?.message ?? `HTTP ${upstream.status}`)
    }

    const reply = json.choices?.[0]?.message?.content ?? "模型未返回内容"
    const session = await appendMessage(sessionId, "assistant", reply)
    res.json({ session })
  } catch (error) {
    const session = await appendMessage(
      sessionId,
      "assistant",
      `⚠ 错误: ${error instanceof Error ? error.message : String(error)}`,
    )
    res.status(500).json({
      error: error instanceof Error ? error.message : String(error),
      session,
    })
  }
})

export default sessionsRouter
