const DEFAULT_CEREBRAS_MODEL = import.meta.env.VITE_CEREBRAS_MODEL || 'llama-3.3-70b'

export async function generateWithCerebras(prompt: string, model = DEFAULT_CEREBRAS_MODEL, maxTokens = 4096) {
  const body = {
    model,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.2,
    max_tokens: maxTokens,
  }

  try {
    const res = await fetch('/api/cerebras', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}))
      const message = errorData.error?.message || res.statusText || `Status ${res.status}`
      throw new Error(`Cerebras API Error: ${message}`)
    }

    const data = await res.json()
    return data.choices?.[0]?.message?.content || JSON.stringify(data)
  } catch (err) {
    if (err instanceof Error && err.message.includes('Cerebras API Error')) throw err
    throw new Error(`Cerebras request failed: ${err instanceof Error ? err.message : String(err)}`)
  }
}
