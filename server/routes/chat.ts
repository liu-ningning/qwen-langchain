import { Router } from "express"
import completionsRouter from "./chat/completions.js"
import streamRouter from "./chat/stream.js"

const chatRouter = Router()

chatRouter.use("/chat", completionsRouter)
chatRouter.use("/chat", streamRouter)

export default chatRouter
