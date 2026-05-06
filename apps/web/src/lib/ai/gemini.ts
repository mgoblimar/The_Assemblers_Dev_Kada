const DEFAULT_GEMINI_MODEL = import.meta.env.VITE_GEMINI_MODEL || 'gemini-2.0-flash-lite'

export async function generateWithGemini(prompt: string, model = DEFAULT_GEMINI_MODEL, maxTokens = 4096) {
  // Prefer calling a same-origin proxy at `/api/gemini` (Vite proxy -> localhost:3001)
  const url = `/api/gemini?model=${encodeURIComponent(model)}`

  const body = {
    contents: [
      {
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: maxTokens,
    },
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}))
      const message = errorData.error?.message || res.statusText || `Status ${res.status}`
      throw new Error(`Gemini API Error: ${message}`)
    }

    const data = await res.json()
    if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
      return data.candidates[0].content.parts[0].text
    }
    if (data.candidates?.[0]) return JSON.stringify(data.candidates[0])
    return JSON.stringify(data)
  } catch (err) {
    if (err instanceof Error && err.message.includes('Gemini API Error')) {
      throw err
    }
    console.warn('AI Proxy unavailable, using mock fallback', err)
    return `MOCK_SUMMARY: ${prompt.slice(0, 200)}${prompt.length > 200 ? '…' : ''}`
  }
}
