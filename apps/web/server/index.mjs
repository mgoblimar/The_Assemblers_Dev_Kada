import express from 'express'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import puppeteer from 'puppeteer-extra'
import StealthPlugin from 'puppeteer-extra-plugin-stealth'

puppeteer.use(StealthPlugin())

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const app = express()
app.use(express.json())

app.post('/api/scrape', async (req, res) => {
  const { url } = req.body
  if (!url) return res.status(400).json({ error: 'URL is required' })

  console.log(`[PROXY] Attempting deep scrape for: ${url}`)
  
  let browser = null
  try {
    browser = await puppeteer.launch({ 
      headless: "new",
      args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    })
    
    const page = await browser.newPage()
    
    // Set a realistic viewport
    await page.setViewport({ width: 1280, height: 800 })
    
    // Wait for network to be idle to catch JS-loaded content
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 })

    // Extract content specifically designed for research papers
    const data = await page.evaluate(() => {
      // 1. Try to find the title
      const title = document.querySelector('h1')?.innerText || 
                    document.querySelector('title')?.innerText || 
                    'Academic Paper';

      // 2. Select common academic content areas (Abstract, Content, etc.)
      const selectors = [
        '.abstract', '#abstract', '.article-content', '#article-content',
        'main', 'article', '.main-content'
      ]
      
      let contentElement = null
      for (const s of selectors) {
        contentElement = document.querySelector(s)
        if (contentElement) break
      }

      // If no specific container, use body but strip common junk
      const target = contentElement || document.body
      
      // Temporary removal of junk for cleaner extraction
      const junk = target.querySelectorAll('nav, footer, header, script, style, .sidebar, .ad, .menu')
      junk.forEach(j => j.style.display = 'none')

      const text = target.innerText
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 15000);

      return { title, text }
    })

    console.log(`[PROXY] Successfully scraped ${data.text.length} chars`)
    res.json(data)
  } catch (err) {
    console.error('[PROXY] Deep Scrape Error:', err.message)
    res.status(500).json({ error: `Academic fetch failed: ${err.message}` })
  } finally {
    if (browser) await browser.close()
  }
})

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
