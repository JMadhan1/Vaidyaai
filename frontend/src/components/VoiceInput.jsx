import React from 'react'
import { Mic, MicOff } from 'lucide-react'
import { useVoice } from '../hooks/useVoice'
import { getLanguage } from '../utils/languages'

export default function VoiceInput({ language, onResult }) {
  const { isListening, error, startListening, stopListening } = useVoice()
  const lang = getLanguage(language)

  const toggle = () => {
    if (isListening) {
      stopListening()
    } else {
      startListening(lang.speech_recognition_code, onResult)
    }
  }

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={toggle}
        title={isListening ? 'Stop listening' : 'Speak your symptoms'}
        style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          border: `2px solid ${isListening ? '#FF2D55' : 'rgba(255,255,255,0.15)'}`,
          background: isListening ? 'rgba(255,45,85,0.2)' : 'rgba(255,255,255,0.06)',
          color: isListening ? '#FF2D55' : '#9999BB',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          flexShrink: 0,
          animation: isListening ? 'pulse 1s ease infinite' : 'none',
          position: 'relative',
        }}
      >
        {isListening ? <MicOff size={20} /> : <Mic size={20} />}
        {isListening && (
          <span style={{
            position: 'absolute',
            inset: '-6px',
            borderRadius: '50%',
            border: '2px solid #FF2D55',
            animation: 'ripple 1.2s ease infinite',
            pointerEvents: 'none',
          }} />
        )}
      </button>
      {error && (
        <div style={{
          position: 'absolute',
          bottom: '56px',
          right: 0,
          background: '#1A1A35',
          border: '1px solid rgba(255,45,85,0.4)',
          borderRadius: '8px',
          padding: '8px 12px',
          fontSize: '12px',
          color: '#FF6B88',
          whiteSpace: 'nowrap',
          maxWidth: '240px',
          whiteSpace: 'normal',
          zIndex: 10,
        }}>
          {error}
        </div>
      )}
    </div>
  )
}
