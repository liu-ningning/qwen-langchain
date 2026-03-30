import { Router } from "express"
import { qwenApiKey } from "../lib/runtime.js"

const healthRouter = Router()

healthRouter.get("/health", (_req, res) => {
  res.json({
    ok: true,
    provider: "qwen",
    modelSource: "server-env",
    hasApiKey: Boolean(qwenApiKey),
  })
})

export default healthRouter
