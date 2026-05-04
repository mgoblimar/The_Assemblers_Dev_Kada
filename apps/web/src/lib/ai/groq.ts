const DEFAULT_GROQ_MODEL = import.meta.env.VITE_GROQ_MODEL || 'llama-3.3-70b-versatile'

export async function generateWithGroq(prompt: string, model = DEFAULT_GROQ_MODEL) {
  const url = `/api/groq`

  const body = {
    model,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.2,
    max_tokens: 512,
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
      throw new Error(`Groq API Error: ${message}`)
    }

    const data = await res.json()
    return data.choices?.[0]?.message?.content || JSON.stringify(data)
  } catch (err) {
    if (err instanceof Error && err.message.includes('Groq API Error')) {
      throw err
    }
    console.warn('Groq Proxy unavailable, using mock fallback', err)
    return `MOCK_GROQ_SUMMARY: ${prompt.slice(0, 200)}…`
  }
}
