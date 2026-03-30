import { Router } from "express"
import { assertApiKey, qwenApiKey, qwenBaseUrl } from "../../lib/runtime.js"

const streamRouter = Router()

streamRouter.post("/stream", async (req, res) => {
  try {
    assertApiKey()
    const upstream = await fetch(`${qwenBaseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${qwenApiKey}`,
      },
      body: JSON.stringify({ ...req.body, stream: true }),
    })

    if (!upstream.ok || !upstream.body) {
      const text = await upstream.text()
      res.status(upstream.status).send(text)
      return
    }

    res.status(200)
    res.setHeader("Content-Type", "text/event-stream; charset=utf-8")
    res.setHeader("Cache-Control", "no-cache, no-transform")
    res.setHeader("Connection", "keep-alive")

    const reader = upstream.body.getReader()
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      if (value) {
        res.write(Buffer.from(value))
      }
    }
    res.end()
  } catch (error) {
    res.status(500).json({
      error: {
        message: error instanceof Error ? error.message : String(error),
      },
    })
  }
})

export default streamRouter
