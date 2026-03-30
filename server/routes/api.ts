import { Router } from "express"
import healthRouter from "./health.js"
import chatRouter from "./chat.js"
import langchainRouter from "./langchain.js"

const apiRouter = Router()

apiRouter.use(healthRouter)
apiRouter.use(chatRouter)
apiRouter.use(langchainRouter)

export default apiRouter
