import React from 'react'
import { Volume2, VolumeX } from 'lucide-react'
import { useTTS } from '../hooks/useTTS'
import { getLanguage } from '../utils/languages'

export default function VoiceOutput({ text, language }) {
  const { isSpeaking, speak, stop } = useTTS()
  const lang = getLanguage(language)

  const toggle = () => {
    if (isSpeaking) {
      stop()
    } else {
      speak(text, lang.speech_synthesis_lang)
    }
  }

  if (!text) return null

  return (
    <button
      onClick={toggle}
      title={isSpeaking ? 'Stop speaking' : 'Listen to response'}
      style={{
        width: '28px',
        height: '28px',
        borderRadius: '6px',
        border: 'none',
        background: isSpeaking ? 'rgba(0,212,170,0.2)' : 'rgba(255,255,255,0.06)',
        color: isSpeaking ? '#00D4AA' : '#666688',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        flexShrink: 0,
        animation: isSpeaking ? 'pulse 1.5s ease infinite' : 'none',
      }}
    >
      {isSpeaking ? <VolumeX size={14} /> : <Volume2 size={14} />}
    </button>
  )
}
