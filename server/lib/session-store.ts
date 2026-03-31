import { mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"

export type SessionRole = "user" | "assistant"

export interface SessionMessage {
  id: string
  role: SessionRole
  content: string
  createdAt: string
}

export interface StoredSession {
  id: string
  title: string
  createdAt: string
  updatedAt: string
  messages: SessionMessage[]
}

interface SessionStoreData {
  nextSessionNumber: number
  sessions: StoredSession[]
}

const dataDir = path.resolve(process.cwd(), "data")
const sessionFile = path.join(dataDir, "sessions.json")

function createInitialStore(): SessionStoreData {
  return {
    nextSessionNumber: 1,
    sessions: [],
  }
}

async function ensureStoreFile() {
  await mkdir(dataDir, { recursive: true })
  try {
    await readFile(sessionFile, "utf8")
  } catch {
    await writeFile(
      sessionFile,
      JSON.stringify(createInitialStore(), null, 2),
      "utf8",
    )
  }
}

async function readStore(): Promise<SessionStoreData> {
  await ensureStoreFile()
  const raw = await readFile(sessionFile, "utf8")
  return JSON.parse(raw) as SessionStoreData
}

async function writeStore(store: SessionStoreData) {
  await ensureStoreFile()
  await writeFile(sessionFile, JSON.stringify(store, null, 2), "utf8")
}

function summarizeTitle(input: string) {
  const compact = input.replace(/\s+/g, " ").trim()
  return compact.slice(0, 24) || "新会话"
}

export async function listSessions() {
  const store = await readStore()
  return store.sessions
    .slice()
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .map((session) => ({
      id: session.id,
      title: session.title,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      messageCount: session.messages.length,
    }))
}

export async function getSession(sessionId: string) {
  const store = await readStore()
  return store.sessions.find((session) => session.id === sessionId) ?? null
}

export async function createSession(title = "新会话") {
  const store = await readStore()
  const now = new Date().toISOString()
  const id = `session-${String(store.nextSessionNumber).padStart(3, "0")}`
  store.nextSessionNumber += 1

  const session: StoredSession = {
    id,
    title,
    createdAt: now,
    updatedAt: now,
    messages: [],
  }

  store.sessions.unshift(session)
  await writeStore(store)
  return session
}

export async function appendMessage(
  sessionId: string,
  role: SessionRole,
  content: string,
) {
  const store = await readStore()
  const session = store.sessions.find((item) => item.id === sessionId)
  if (!session) return null

  const now = new Date().toISOString()
  session.messages.push({
    id: `${session.id}-msg-${session.messages.length + 1}`,
    role,
    content,
    createdAt: now,
  })
  session.updatedAt = now

  if (session.messages.length === 1 && role === "user") {
    session.title = summarizeTitle(content)
  }

  await writeStore(store)
  return session
}
