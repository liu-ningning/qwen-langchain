import { Router } from "express"
import healthRouter from "./health.js"
import chatRouter from "./chat.js"
import langchainRouter from "./langchain.js"
import sessionsRouter from "./sessions.js"

const apiRouter = Router()

apiRouter.use(healthRouter)
apiRouter.use(chatRouter)
apiRouter.use(langchainRouter)
apiRouter.use(sessionsRouter)

export default apiRouter
