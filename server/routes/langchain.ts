import { Router } from "express"
import lcelRouter from "./langchain/lcel.js"
import parserRouter from "./langchain/parser.js"

const langchainRouter = Router()

langchainRouter.use("/langchain", lcelRouter)
langchainRouter.use("/langchain", parserRouter)

export default langchainRouter
