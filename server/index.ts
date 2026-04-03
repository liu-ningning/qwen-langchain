import "dotenv/config"
import cors from "cors"
import express from "express"
import { createServer as createHttpServer } from "node:http"
import path from "node:path"
import pino from "pino"
import apiRouter from "./routes/api.js"
import { isDev, port } from "./lib/runtime.js"

const logger = pino({
  transport: isDev
    ? {
      target: "pino-pretty",
      options: { colorize: true, ignore: "pid,hostname" },
    }
    : undefined,
})

const app = express()
const rootDir = process.cwd()
const clientDistDir = path.resolve(rootDir, "dist")
const httpServer = createHttpServer(app)

app.use(cors())
app.use(express.json({ limit: "1mb" }))

app.use((req, res, next) => {
  const start = Date.now()
  let logged = false

  const logRequest = () => {
    if (logged) return
    logged = true

    const duration = Date.now() - start
    const methodColors: Record<string, string> = {
      GET: "\x1b[32m",
      POST: "\x1b[34m",
      PUT: "\x1b[33m",
      DELETE: "\x1b[31m",
    }
    const color = methodColors[req.method] || "\x1b[0m"
    setImmediate(() => {
      const sanitizedUrl = req.originalUrl.replace(/[?&](token|password|secret)=[^&]*/g, '***')
      if (sanitizedUrl.includes('/api/')) {
        logger.info(
          { method: req.method, url: sanitizedUrl, durationMs: `${duration}ms` },
          `${color}[${req.method}]\x1b[0m ${sanitizedUrl} - ${duration}ms`
        )
      }
    })

    res.removeListener("finish", logRequest)
    res.removeListener("close", logRequest)
    res.removeListener("error", logRequest)
  }

  res.on("finish", logRequest)
  res.on("close", logRequest)
  res.on("error", logRequest)

  next()
})

app.use("/api", apiRouter)

async function start() {
  if (isDev) {
    const { createServer } = await import("vite")
    const vite = await createServer({
      server: {
        middlewareMode: true,
        hmr: {
          server: httpServer,
        },
      },
      appType: "spa",
      root: rootDir,
    })
    app.use(vite.middlewares)
  } else {
    app.use(express.static(clientDistDir))
    app.get("*", (_req, res) => {
      res.sendFile(path.join(clientDistDir, "index.html"))
    })
  }

  httpServer.listen(port, () => {
    console.log(
      `${isDev ? "Dev" : "Prod"} server listening on http://localhost:${port}`,
    )
  })
}

void start()
