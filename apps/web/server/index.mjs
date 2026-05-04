import express from 'express'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })
const DEFAULT_GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash-lite'

const app = express()
app.use(express.json())

app.post('/api/gemini', async (req, res) => {
  const key = process.env.GEMINI_API_KEY
  if (!key) {
    console.error('[PROXY] Missing GEMINI_API_KEY')
    return res.status(500).json({ error: 'Missing API key' })
  }

  try {
    const model = req.query.model || DEFAULT_GEMINI_MODEL
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`
    console.log(`[PROXY] Calling Gemini model: ${model}`)
    const r = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
    })
    console.log(`[PROXY] Response status: ${r.status}`)
    const text = await r.text()
    try {
      const data = JSON.parse(text)
      return res.status(r.status).json(data)
    } catch {
      return res.status(r.status).send(text)
    }
  } catch (err) {
    console.error('[PROXY] Error:', err)
    return res.status(500).json({ error: String(err.message) })
  }
})

app.post('/api/groq', async (req, res) => {
  const key = process.env.GROQ_API_KEY
  if (!key) {
    console.error('[PROXY] Missing GROQ_API_KEY')
    return res.status(500).json({ error: 'Missing GROQ_API_KEY' })
  }

  try {
    console.log(`[PROXY] Calling Groq model: ${req.body.model}`)
    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`
      },
      body: JSON.stringify(req.body),
    })
    console.log(`[PROXY] Groq Response status: ${r.status}`)
    const data = await r.json()
    return res.status(r.status).json(data)
  } catch (err) {
    console.error('[PROXY] Groq Error:', err)
    return res.status(500).json({ error: String(err.message) })
  }
})

// health
app.get('/health', (_req, res) => res.json({ ok: true }))

const PORT = process.env.PORT || 3001
app.listen(PORT, () => console.log(`Proxy listening on http://localhost:${PORT}`))
