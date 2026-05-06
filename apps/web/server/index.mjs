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
      headless: "new", // Use 'new' headless mode
      args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    })
    
    const page = await browser.newPage()
    
    // Set a realistic viewport and User-Agent
    await page.setViewport({ width: 1280, height: 800 })
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
    
    // Wait for DOM content and then a bit longer for JS content
    // 'networkidle0' is too strict for some academic portals (like IEEE) that have persistent background requests
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 })
    
    // Give some time for JS to render the content
    await new Promise(r => setTimeout(r, 5000))

    // Extract content specifically designed for research papers
    const data = await page.evaluate(() => {
      const getMetadata = (name) => {
        return document.querySelector(`meta[name="${name}"]`)?.content || 
               document.querySelector(`meta[property="${name}"]`)?.content || 
               document.querySelector(`meta[property="og:${name}"]`)?.content || 
               document.querySelector(`meta[name="citation_${name}"]`)?.content || "";
      };

      // 1. Try to find the title from meta or h1
      const title = getMetadata('title') || 
                    getMetadata('citation_title') ||
                    document.querySelector('h1')?.innerText || 
                    document.querySelector('title')?.innerText || 
                    'Academic Paper';

      // 2. Select common academic content areas (Abstract, Content, etc.)
      const selectors = [
        '[data-selenium="abstract"]',
        '.abstract', 
        '#abstract', 
        '.article-content', 
        '#article-content',
        'section.abstract',
        '.sv-abstract-text', // Elsevier/ScienceDirect
        '.abstract-content',
        '#eng-abstract',     // PubMed
        '.abstract-text',
        '.abstract p',
        '.c-article-section__content', // Nature
        '.article__teaser',            // Nature
        '.article__body',
        '.article-section__content',
        'article',
        'main',
        '#main-content',
        '.main-content',
        '#content'
      ]
      
      let textContent = "";
      
      // Try to find the largest content block among selectors
      let bestContent = "";
      for (const s of selectors) {
        const elements = document.querySelectorAll(s);
        for (const el of elements) {
          const text = el.innerText.trim();
          if (text.length > bestContent.length) {
            bestContent = text;
          }
        }
        // If we found something substantial, we can stop if it's one of the specific ones
        if (bestContent.length > 500 && s !== 'article' && s !== 'main') {
          break;
        }
      }
      textContent = bestContent;

      // 3. Fallback: If nothing found, try to get all paragraphs
      if (textContent.length < 200) {
        const paragraphs = Array.from(document.querySelectorAll('p'))
          .map(p => p.innerText.trim())
          .filter(txt => txt.length > 40)
          .join('\n\n');
        
        if (paragraphs.length > textContent.length) {
          textContent = paragraphs;
        }
      }

      // 4. Sibling Check: If we have a header "Abstract", maybe the content is next
      if (textContent.length < 200) {
        const headers = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, strong'));
        for (const h of headers) {
          if (h.innerText.toLowerCase().includes('abstract') && h.innerText.length < 20) {
            const parent = h.parentElement;
            if (parent && parent.innerText.length > 200) {
              textContent = parent.innerText;
              break;
            }
            const next = h.nextElementSibling;
            if (next && next.innerText.length > 100) {
              textContent = next.innerText;
              break;
            }
          }
        }
      }

      // 5. Meta Fallback (Last resort)
      if (textContent.length < 100) {
        textContent = getMetadata('description') || getMetadata('citation_abstract') || textContent;
      }

      const cleanText = textContent
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 15000);

      return { title, text: cleanText }
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

  const MAX_RETRIES = 2
  let attempt = 0

  while (attempt <= MAX_RETRIES) {
    try {
      console.log(`[PROXY] Calling Groq model: ${req.body.model} (Attempt ${attempt + 1})`)
      const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key}`
        },
        body: JSON.stringify(req.body),
      })

      console.log(`[PROXY] Groq Response status: ${r.status}`)
      
      if (r.status === 429 && attempt < MAX_RETRIES) {
        console.warn(`[PROXY] Groq rate limited (429). Retrying in 2s...`)
        attempt++
        await new Promise(resolve => setTimeout(resolve, 2000))
        continue
      }

      const data = await r.json()
      return res.status(r.status).json(data)
    } catch (err) {
      console.error('[PROXY] Groq Error:', err)
      if (attempt < MAX_RETRIES) {
        attempt++
        await new Promise(resolve => setTimeout(resolve, 2000))
        continue
      }
      return res.status(500).json({ error: String(err.message) })
    }
  }
})

// health
app.get('/health', (_req, res) => res.json({ ok: true }))

const PORT = process.env.PORT || 3001
app.listen(PORT, () => console.log(`Proxy listening on http://localhost:${PORT}`))
