import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 60000,
})

export const checkHealth = () => api.get('/health').then(r => r.data)

export const sendTriage = ({ message, language, conversationHistory }) =>
  api.post('/triage', {
    message,
    language,
    conversation_history: conversationHistory,
  }).then(r => r.data)

export const getLanguages = () => api.get('/languages').then(r => r.data)

export const sendASHATriage = (patientData) =>
  api.post('/asha-triage', patientData).then(r => r.data)

export const readRDTStrip = (image_base64, test_type, language) =>
  api.post('/asha-rdt', { image_base64, test_type, language }).then(r => r.data)

export const getImmunizationSchedule = (age_months) =>
  api.get(`/immunization-schedule?age_months=${age_months}`).then(r => r.data)

export const streamTriage = async (
  { message, language, conversationHistory, imageBase64 },
  onToken,
  onImageAnalysis,
  onTriage,
  onError,
) => {
  try {
    const response = await fetch('/api/triage/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        language,
        conversation_history: conversationHistory,
        image_base64: imageBase64 || null,
      }),
    })

    if (!response.ok) {
      const text = await response.text()
      onError(`Server error ${response.status}: ${text}`)
      return
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      const text = decoder.decode(value, { stream: true })
      const lines = text.split('\n').filter(l => l.startsWith('data: '))
      for (const line of lines) {
        const raw = line.slice(6).trim()
        if (raw === '[DONE]') return
        try {
          const parsed = JSON.parse(raw)
          if (parsed.type === 'token') onToken(parsed.content)
          else if (parsed.type === 'image_analysis') onImageAnalysis?.(parsed.content)
          else if (parsed.type === 'triage') onTriage(parsed)
          else if (parsed.type === 'error') onError(parsed.error)
        } catch {
          // partial chunk — skip
        }
      }
    }
  } catch (err) {
    onError(err.message)
  }
}
