import "dotenv/config"
import cors from "cors"
import express from "express"
import { createServer as createHttpServer } from "node:http"
import path from "node:path"
import apiRouter from "./routes/api.js"
import { isDev, port } from "./lib/runtime.js"

const app = express()
const rootDir = process.cwd()
const clientDistDir = path.resolve(rootDir, "dist")
const httpServer = createHttpServer(app)

app.use(cors())
app.use(express.json({ limit: "1mb" }))
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
