/**
 * CRITICAL: Strips all JSON blocks and structured data from AI response text
 * before displaying to users. Raw JSON must NEVER be visible in the chat UI.
 */
export function cleanAIResponse(text) {
  if (!text) return ''

  // Remove ```json ... ``` code blocks (multiline)
  let cleaned = text.replace(/```json[\s\S]*?```/gi, '')

  // Remove any other ``` ... ``` code blocks
  cleaned = cleaned.replace(/```[\s\S]*?```/g, '')

  // Remove raw JSON objects that contain triage_level key
  cleaned = cleaned.replace(/\{[\s\S]*?"triage_level"[\s\S]*?\}/g, '')

  // Remove orphaned opening/closing braces left over
  cleaned = cleaned.replace(/^\s*[\{\}]\s*$/gm, '')

  // Collapse 3+ consecutive newlines to 2
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n')

  // Remove trailing whitespace per line
  cleaned = cleaned.replace(/[ \t]+$/gm, '')

  return cleaned.trim()
}

export function extractJSONFromText(text) {
  if (!text) return null
  try {
    const blockMatch = text.match(/```json\s*([\s\S]*?)\s*```/i)
    if (blockMatch) return JSON.parse(blockMatch[1])

    const inlineMatch = text.match(/\{[\s\S]*?"triage_level"[\s\S]*?\}/)
    if (inlineMatch) return JSON.parse(inlineMatch[0])
  } catch {
    // malformed JSON — ignore
  }
  return null
}
