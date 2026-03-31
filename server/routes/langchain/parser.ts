import { Router } from "express"
import { ChatPromptTemplate } from "@langchain/core/prompts"
import {
  CommaSeparatedListOutputParser,
  JsonOutputParser,
  StringOutputParser,
} from "@langchain/core/output_parsers"
import { z } from "zod"
import { createModel } from "../../lib/runtime.js"

const parserRouter = Router()

const parserSchema = z.object({
  model: z.string().min(1),
  type: z.enum(["string", "json", "list"]),
  input: z.string().min(1),
})

parserRouter.post("/parser", async (req, res) => {
  try {
    const body = parserSchema.parse(req.body)
    console.warn('[parser] body', body)
    const model = createModel(body.model, 0)

    if (body.type === "string") {
      const chain = ChatPromptTemplate.fromTemplate(
        "请分析以下产品评价，给出简洁的总体评价：\n\n{input}",
      )
        .pipe(model)
        .pipe(new StringOutputParser())
      const output = await chain.invoke({ input: body.input })
      res.json({ raw: output, parsed: output })
      return
    }

    if (body.type === "json") {
      const parser = new JsonOutputParser()
      const chain = ChatPromptTemplate.fromTemplate(
        "分析以下内容。{formatInstructions}\n\n{input}",
      ).pipe(model)
      const raw = await chain.pipe(new StringOutputParser()).invoke({
        input: body.input,
        formatInstructions:
          '只返回 JSON，不要 markdown 代码块，格式：{"sentiment":"positive/negative/neutral","score":0.0,"keywords":["词1","词2"],"summary":"一句话总结"}',
      })
      const parsed = await parser.parse(raw)
      res.json({ raw, parsed: JSON.stringify(parsed, null, 2) })
      return
    }

    const parser = new CommaSeparatedListOutputParser()
    const chain = ChatPromptTemplate.fromTemplate(
      "从以下内容中提取 5 个关键词，只返回逗号分隔的词语，不要其他任何文字：\n\n{input}",
    )
      .pipe(model)
      .pipe(new StringOutputParser())
    const raw = await chain.invoke({ input: body.input })
    const parsed = await parser.parse(raw)
    res.json({
      raw,
      parsed: parsed.map((item, index) => `[${index}] "${item}"`).join("\n"),
    })
  } catch (error) {
    res.status(400).json({
      error: error instanceof Error ? error.message : String(error),
    })
  }
})

export default parserRouter
