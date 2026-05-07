/**
 * Shared utilities for AI prompt parsing.
 * extractJSON is the canonical implementation used by all chapter prompt files.
 */

// Characters that form valid JSON escape sequences after a backslash
const VALID_JSON_ESCAPES = new Set(['"', '\\', '/', 'b', 'f', 'n', 'r', 't', 'u'])

/**
 * Sanitizes a raw AI response string so it can be passed to JSON.parse.
 *
 * Handles the two most common LLM JSON mistakes:
 *   1. Literal control characters (raw newline / tab) inside string values
 *   2. Invalid escape sequences like \p, \', \, (anything not in the JSON
 *      escape set) — the backslash is double-escaped so the value is preserved
 *      as a literal backslash instead of causing a parse error.
 *
 * Works character-by-character with a lookahead for backslashes so it can
 * distinguish valid escapes from invalid ones without regex edge-cases.
 */
function sanitizeJsonLiterals(s: string): string {
  let out = ''
  let inString = false
  let i = 0

  while (i < s.length) {
    const ch = s[i]

    // ── Outside a string ────────────────────────────────────────────────────
    if (!inString) {
      out += ch
      if (ch === '"') inString = true
      i++
      continue
    }

    // ── Inside a string value ────────────────────────────────────────────────

    // Close quote
    if (ch === '"') {
      inString = false
      out += ch
      i++
      continue
    }

    // Backslash — look ahead to decide if it starts a valid escape
    if (ch === '\\') {
      const next = i + 1 < s.length ? s[i + 1] : ''

      if (!next) {
        // Trailing backslash at end of input — drop it to avoid parse error
        i++
        continue
      }

      if (VALID_JSON_ESCAPES.has(next)) {
        if (next === 'u') {
          // \uXXXX requires exactly 4 hex digits
          const hex = s.slice(i + 2, i + 6)
          if (/^[0-9a-fA-F]{4}$/.test(hex)) {
            out += s.slice(i, i + 6)   // valid \uXXXX — pass through
            i += 6
          } else {
            // Malformed \uXXX — escape the backslash so it becomes a literal \\u
            out += '\\\\u'
            i += 2
          }
        } else {
          out += ch + next             // valid escape pair — pass through as-is
          i += 2
        }
      } else {
        // Invalid escape (e.g. \p, \', \,) — double-escape the backslash.
        // This converts \p → \\p which is valid JSON and preserves the text.
        out += '\\\\' + next
        i += 2
      }
      continue
    }

    // Raw control characters that must be escaped inside JSON strings
    if (ch === '\n') { out += '\\n';  i++; continue }
    if (ch === '\r') { out += '\\r';  i++; continue }
    if (ch === '\t') { out += '\\t';  i++; continue }
    const code = ch.charCodeAt(0)
    if (code < 0x20) {
      out += `\\u${code.toString(16).padStart(4, '0')}`
      i++
      continue
    }

    out += ch
    i++
  }

  return out
}

/**
 * Quick regex pre-pass: fix the most common single-character invalid escapes
 * (e.g. \' \, \: \; \! \?) before the full character-by-character sanitiser runs.
 * This is not context-aware of strings vs. non-strings, but invalid backslashes
 * outside strings are already a parse error — fixing them here is safe.
 */
function quickFixEscapes(s: string): string {
  // Replace \x where x is NOT a JSON-valid escape character
  return s.replace(/\\(?!["\\/bfnrtu0-9])/g, '\\\\')
}

export function extractJSON(raw: string): unknown {
  // Strip markdown code fences the model sometimes wraps around JSON
  let s = raw.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim()

  // Try all extraction strategies in order of least → most invasive
  const attempts: (() => unknown)[] = []

  function sliceAttempts(src: string) {
    const arrStart = src.indexOf('[')
    const objStart = src.indexOf('{')

    // Prefer array if it starts before the first object
    if (arrStart !== -1 && (objStart === -1 || arrStart < objStart)) {
      const arrEnd = src.lastIndexOf(']')
      if (arrEnd > arrStart) {
        const slice = src.slice(arrStart, arrEnd + 1)
        attempts.push(() => JSON.parse(slice))
        attempts.push(() => JSON.parse(sanitizeJsonLiterals(slice)))
        attempts.push(() => JSON.parse(quickFixEscapes(slice)))
        attempts.push(() => JSON.parse(sanitizeJsonLiterals(quickFixEscapes(slice))))
      }
    }

    const objEnd = src.lastIndexOf('}')
    if (objStart !== -1 && objEnd > objStart) {
      const slice = src.slice(objStart, objEnd + 1)
      attempts.push(() => JSON.parse(slice))
      attempts.push(() => JSON.parse(sanitizeJsonLiterals(slice)))
      attempts.push(() => JSON.parse(quickFixEscapes(slice)))
      attempts.push(() => JSON.parse(sanitizeJsonLiterals(quickFixEscapes(slice))))
    }
  }

  sliceAttempts(s)

  // Also try the full string (after stripping fences) in case slicing is wrong
  attempts.push(() => JSON.parse(s))
  attempts.push(() => JSON.parse(sanitizeJsonLiterals(s)))
  attempts.push(() => JSON.parse(quickFixEscapes(s)))
  attempts.push(() => JSON.parse(sanitizeJsonLiterals(quickFixEscapes(s))))

  for (const attempt of attempts) {
    try { return attempt() } catch { /* try next */ }
  }

  // Last resort — throw with context to surface in the error UI
  throw new SyntaxError(`extractJSON: could not parse AI response. Raw (first 300 chars): ${raw.slice(0, 300)}`)
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
