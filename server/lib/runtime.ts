import { ChatOpenAI } from "@langchain/openai"

export const isDev = process.env.NODE_ENV !== "production"
export const port = Number(process.env.PORT ?? 5173)
export const qwenApiKey = process.env.QWEN_API_KEY ?? ""
export const qwenBaseUrl =
  process.env.QWEN_BASE_URL ??
  "https://dashscope.aliyuncs.com/compatible-mode/v1"

export function assertApiKey() {
  if (!qwenApiKey) {
    throw new Error("QWEN_API_KEY is not configured on the server")
  }
}

export function createModel(modelName?: string, temperature = 0.7) {
  assertApiKey()
  return new ChatOpenAI({
    apiKey: qwenApiKey,
    modelName: modelName ?? "qwen-plus-latest",
    configuration: {
      baseURL: qwenBaseUrl,
    },
    temperature,
  })
}
