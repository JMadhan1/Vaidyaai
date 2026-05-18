import { useState, useCallback, useRef } from 'react'

export function useTTS() {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const utteranceRef = useRef(null)

  // speak(text, languageCode, onEnd?)
  const speak = useCallback((text, languageCode, onEnd) => {
    if (!window.speechSynthesis || !text) return

    window.speechSynthesis.cancel()
    setIsSpeaking(false)

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = languageCode || 'en-IN'
    utterance.rate = 0.9
    utterance.pitch = 1.0

    // Try to match a voice for this language
    const voices = window.speechSynthesis.getVoices()
    const langPrefix = (languageCode || 'en').split('-')[0]
    const match = voices.find(v => v.lang.startsWith(langPrefix))
    if (match) utterance.voice = match

    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => {
      setIsSpeaking(false)
      onEnd?.()
    }
    utterance.onerror = () => {
      setIsSpeaking(false)
      onEnd?.()
    }

    utteranceRef.current = utterance
    window.speechSynthesis.speak(utterance)
  }, [])

  const stop = useCallback(() => {
    window.speechSynthesis?.cancel()
    setIsSpeaking(false)
  }, [])

  return { isSpeaking, speak, stop }
}
