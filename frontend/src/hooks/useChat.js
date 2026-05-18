import { useState, useCallback, useEffect, useRef } from 'react'
import { streamTriage } from '../utils/api'

const SESSION_KEY = 'vaidyaai_session'

export function useChat(language) {
  const [messages,     setMessages]     = useState([])
  const [isLoading,    setIsLoading]    = useState(false)
  const [triageResult, setTriageResult] = useState(null)
  const [error,        setError]        = useState(null)
  const [lastResponseMs, setLastResponseMs] = useState(null)
  const assistantIdRef = useRef(null)
  const startTimeRef   = useRef(null)

  // Restore session on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SESSION_KEY)
      if (saved) {
        const { messages: savedMsgs, triageResult: savedTriage } = JSON.parse(saved)
        if (Array.isArray(savedMsgs) && savedMsgs.length > 0) {
          setMessages(savedMsgs)
          if (savedTriage?.level) setTriageResult(savedTriage)
        }
      }
    } catch { /* corrupted storage */ }
  }, [])

  // Persist session whenever messages change
  useEffect(() => {
    if (messages.length === 0) return
    try {
      const stable = messages.map(m => ({ ...m, streaming: false }))
      localStorage.setItem(SESSION_KEY, JSON.stringify({ messages: stable, triageResult }))
    } catch { /* quota exceeded */ }
  }, [messages, triageResult])

  const sendMessage = useCallback(async ({ text, imageBase64 } = {}) => {
    if (!text?.trim() || isLoading) return

    startTimeRef.current = Date.now()

    const userMsg = {
      role: 'user', content: text, id: Date.now(), imageBase64: imageBase64 || null,
    }
    setMessages(prev => [...prev, userMsg])
    setIsLoading(true)
    setError(null)

    const assistantId = Date.now() + 1
    assistantIdRef.current = assistantId
    setMessages(prev => [
      ...prev,
      { role: 'assistant', content: '', id: assistantId, triage: null,
        streaming: true, imageAnalysis: null, responseMs: null },
    ])

    const history = messages.map(m => ({ role: m.role, content: m.content }))

    await streamTriage(
      { message: text, language, conversationHistory: history, imageBase64 },

      // onToken
      (token) => {
        setMessages(prev =>
          prev.map(m => m.id === assistantIdRef.current
            ? { ...m, content: m.content + token }
            : m
          )
        )
      },

      // onImageAnalysis
      (analysis) => {
        setMessages(prev =>
          prev.map(m => m.id === assistantIdRef.current
            ? { ...m, imageAnalysis: analysis }
            : m
          )
        )
      },

      // onTriage
      (triage) => {
        const elapsed = Date.now() - (startTimeRef.current || Date.now())
        setLastResponseMs(elapsed)

        const triageData = {
          level:        triage.triage_level,
          label:        triage.triage_label,
          color:        triage.triage_color,
          confidence:   triage.confidence,
          actions:      triage.suggested_actions || [],
          speakText:    triage.speak_text || '',
          icd10_code:   triage.icd10_code || '',
          warning_signs: triage.warning_signs || [],
          reasoning:    triage.reasoning || '',
        }
        setMessages(prev =>
          prev.map(m => m.id === assistantIdRef.current
            ? { ...m, streaming: false, triage: triageData, responseMs: elapsed }
            : m
          )
        )
        if (triage.triage_level !== 'unknown') setTriageResult(triageData)
        setIsLoading(false)
      },

      // onError
      (_err) => {
        setError('Connection lost. Is Ollama running? Try: ollama serve')
        setMessages(prev => prev.filter(m => m.id !== assistantIdRef.current))
        setIsLoading(false)
      },
    )
  }, [messages, language, isLoading])

  const resetChat = useCallback(() => {
    setMessages([])
    setTriageResult(null)
    setError(null)
    setIsLoading(false)
    setLastResponseMs(null)
    localStorage.removeItem(SESSION_KEY)
  }, [])

  return { messages, isLoading, triageResult, error, sendMessage, resetChat, lastResponseMs }
}
