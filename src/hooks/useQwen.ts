import { useState, useCallback } from 'react'
import { callQwen, callQwenStream, parseStream } from '../lib/qwen'
import type { ChatOptions } from '../lib/qwen'

export type Status = 'idle' | 'loading' | 'ok' | 'error'

export function useQwen(apiKey: string, model: string) {
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState<string | null>(null)

  const run = useCallback(async (opts: Omit<ChatOptions, 'model'>): Promise<import('../lib/qwen').ChatResponse | null> => {
    if (!apiKey) { setError('请先输入 API Key'); return null }
    setStatus('loading')
    setError(null)
    try {
      const res = await callQwen(apiKey, { ...opts, model })
      setStatus('ok')
      return res
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      setError(msg)
      setStatus('error')
      return null
    }
  }, [apiKey, model])

  const stream = useCallback(async (
    opts: Omit<ChatOptions, 'model'>,
    onToken: (token: string) => void,
    onDone?: () => void,
  ) => {
    if (!apiKey) { setError('请先输入 API Key'); return }
    setStatus('loading')
    setError(null)
    try {
      const resp = await callQwenStream(apiKey, { ...opts, model })
      for await (const token of parseStream(resp)) {
        onToken(token)
      }
      setStatus('ok')
      onDone?.()
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      setError(msg)
      setStatus('error')
    }
  }, [apiKey, model])

  return { status, error, run, stream }
}
