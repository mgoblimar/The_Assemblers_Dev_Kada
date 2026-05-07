/**
 * Shared utilities for AI prompt parsing.
 * extractJSON is the canonical implementation used by all chapter prompt files.
 */

/**
 * Sanitizes literal control characters inside JSON string values.
 * llama3.1-8b often emits raw newlines inside JSON strings which breaks JSON.parse.
 */
function sanitizeJsonLiterals(s: string): string {
  let out = ''
  let inString = false
  let escaped = false

  for (let i = 0; i < s.length; i++) {
    const ch = s[i]

    if (escaped) {
      out += ch
      escaped = false
      continue
    }
    if (ch === '\\') { out += ch; escaped = true; continue }
    if (ch === '"') { inString = !inString; out += ch; continue }

    if (inString) {
      if (ch === '\n') { out += '\\n'; continue }
      if (ch === '\r') { out += '\\r'; continue }
      if (ch === '\t') { out += '\\t'; continue }
      const code = ch.charCodeAt(0)
      if (code < 0x20) { out += `\\u${code.toString(16).padStart(4, '0')}`; continue }
    }

    out += ch
  }
  return out
}

export function extractJSON(raw: string): unknown {
  let s = raw.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim()

  const arrStart = s.indexOf('[')
  const objStart = s.indexOf('{')

  if (arrStart !== -1 && (objStart === -1 || arrStart < objStart)) {
    const arrEnd = s.lastIndexOf(']')
    if (arrEnd > arrStart) {
      const slice = s.slice(arrStart, arrEnd + 1)
      try { return JSON.parse(slice) } catch { /* fall through */ }
      try { return JSON.parse(sanitizeJsonLiterals(slice)) } catch { /* fall through */ }
    }
  }

  const objEnd = s.lastIndexOf('}')
  if (objStart !== -1 && objEnd > objStart) {
    const slice = s.slice(objStart, objEnd + 1)
    try { return JSON.parse(slice) } catch { /* fall through */ }
    try { return JSON.parse(sanitizeJsonLiterals(slice)) } catch { /* fall through */ }
  }

  try { return JSON.parse(sanitizeJsonLiterals(s)) } catch { /* fall through */ }
  return JSON.parse(s)
}

/**
 * Converts escaped \\n sequences back to real newlines for display.
 * The AI stores paragraph breaks as literal \\n in the JSON text value;
 * this restores them so the rendered markdown has actual line breaks.
 */
export function sanitizeText(text: string): string {
  return text
    .replace(/\\n/g, '\n')
    .replace(/\\t/g, '\t')
    .trim()
}
