import { Router } from "express"
import { ChatPromptTemplate } from "@langchain/core/prompts"
import { StringOutputParser } from "@langchain/core/output_parsers"
import { RunnableParallel } from "@langchain/core/runnables"
import { z } from "zod"
import { createModel } from "../../lib/runtime.js"

const lcelRouter = Router()

const lcelSchema = z.object({
  model: z.string().min(1),
  template: z.string().min(1),
  role: z.string().min(1),
  style: z.string().min(1),
  topic: z.string().min(1),
  mode: z.enum(["string", "parallel"]),
})

lcelRouter.post("/lcel", async (req, res) => {
  try {
    const input = lcelSchema.parse(req.body)
    console.warn('[lcel] input', input)
    const t0 = Date.now()

    if (input.mode === "parallel") {
      const model = createModel(input.model, 0.4)
      const chain = RunnableParallel.from({
        casual: ChatPromptTemplate.fromTemplate("用一句轻松幽默的话介绍：{topic}")
          .pipe(model)
          .pipe(new StringOutputParser()),
        formal: ChatPromptTemplate.fromTemplate("用一句严肃专业的话介绍：{topic}")
          .pipe(model)
          .pipe(new StringOutputParser()),
      })

      const result = await chain.invoke({ topic: input.topic })
      res.json({
        mode: "RunnableParallel",
        output:
          `▸ 分支1（幽默风格）:\n${result.casual}\n\n` +
          `▸ 分支2（专业风格）:\n${result.formal}`,
        elapsedMs: Date.now() - t0,
      })
      return
    }

    const prompt = ChatPromptTemplate.fromTemplate(input.template)
    const model = createModel(input.model, 0.7)
    const chain = prompt.pipe(model).pipe(new StringOutputParser())
    const output = await chain.invoke({
      role: input.role,
      style: input.style,
      topic: input.topic,
    })

    res.json({
      mode: "StringOutputParser",
      output,
      elapsedMs: Date.now() - t0,
    })
  } catch (error) {
    res.status(400).json({
      error: error instanceof Error ? error.message : String(error),
    })
  }
})

export default lcelRouter
