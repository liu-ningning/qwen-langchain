import { Router } from "express"
import { assertApiKey, qwenApiKey, qwenBaseUrl } from "../../lib/runtime.js"

const completionsRouter = Router()

completionsRouter.post("/completions", async (req, res) => {
  try {
    assertApiKey()
    const upstream = await fetch(`${qwenBaseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${qwenApiKey}`,
      },
      body: JSON.stringify(req.body),
    })

    const text = await upstream.text()
    res.status(upstream.status)
    res.type("application/json")
    res.send(text)
  } catch (error) {
    res.status(500).json({
      error: {
        message: error instanceof Error ? error.message : String(error),
      },
    })
  }
})

export default completionsRouter
