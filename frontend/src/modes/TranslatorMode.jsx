import React, { useState, useRef, useEffect } from 'react'
import { translateText } from '../utils/api'

const LANGUAGES = [
  { code: 'en', name: 'English',  native: 'English', flag: '🇬🇧' },
  { code: 'te', name: 'Telugu',   native: 'తెలుగు',  flag: '🇮🇳' },
  { code: 'hi', name: 'Hindi',    native: 'हिंदी',   flag: '🇮🇳' },
  { code: 'ta', name: 'Tamil',    native: 'தமிழ்',   flag: '🇮🇳' },
]

function speak(text, lang) {
  if (!window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const utt = new SpeechSynthesisUtterance(text)
  const SPEECH_CODES = { en: 'en-IN', te: 'te-IN', hi: 'hi-IN', ta: 'ta-IN' }
  utt.lang = SPEECH_CODES[lang] || 'en-IN'
  utt.rate = 0.9
  window.speechSynthesis.speak(utt)
}

function TranslationCard({ entry }) {
  const isDoctor = entry.mode === 'doctor_to_patient'
  const color = isDoctor ? '#007AFF' : '#FF9500'
  const label = isDoctor ? '👨‍⚕️ Doctor → Patient' : '🧑 Patient → Doctor'

  return (
    <div style={{
      background: '#0D1426',
      border: `1.5px solid ${color}33`,
      borderLeft: `3px solid ${color}`,
      borderRadius: '12px',
      padding: '14px 16px',
      marginBottom: '10px',
      animation: 'fadeIn 0.3s ease',
    }}>
      <div style={{ color, fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' }}>
        {label}
      </div>
      <div style={{ color: '#9999BB', fontSize: '13px', lineHeight: 1.55, marginBottom: '10px' }}>
        {entry.original}
      </div>
      <div style={{
        padding: '10px 12px', borderRadius: '8px',
        background: `${color}10`, border: `1px solid ${color}22`,
      }}>
        <div style={{ color: '#555577', fontSize: '10px', marginBottom: '4px', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.5px' }}>
          Translation
        </div>
        <div style={{ color: '#E8E8F8', fontSize: '14px', lineHeight: 1.6 }}>
          {entry.translated}
        </div>
      </div>
      <div style={{ display: 'flex', gap: '8px', marginTop: '8px', alignItems: 'center' }}>
        <button
          onClick={() => speak(entry.translated, entry.to_lang)}
          style={{
            padding: '4px 12px', borderRadius: '100px', fontSize: '11px', fontWeight: '700',
            border: `1px solid ${color}44`, background: `${color}15`, color,
            cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
          }}
        >
          🔊 Speak
        </button>
        <span style={{ color: '#444466', fontSize: '10px' }}>
          {entry.inference_seconds}s · Gemma 4 offline
        </span>
      </div>
    </div>
  )
}

export default function TranslatorMode({ language: defaultLang }) {
  const [doctorLang, setDoctorLang]   = useState('en')
  const [patientLang, setPatientLang] = useState(defaultLang || 'te')
  const [activeMode, setActiveMode]   = useState(null)  // 'doctor' | 'patient'
  const [inputText, setInputText]     = useState('')
  const [history, setHistory]         = useState([])
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState(null)
  const [isListening, setIsListening] = useState(false)
  const recognitionRef                = useRef(null)
  const bottomRef                     = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [history])

  const startListening = (mode) => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) { setError('Voice input not supported in this browser'); return }

    setActiveMode(mode)
    setInputText('')
    const langCode = mode === 'doctor'
      ? ({ en: 'en-IN', te: 'te-IN', hi: 'hi-IN', ta: 'ta-IN' }[doctorLang] || 'en-IN')
      : ({ en: 'en-IN', te: 'te-IN', hi: 'hi-IN', ta: 'ta-IN' }[patientLang] || 'en-IN')

    const rec = new SpeechRecognition()
    rec.lang = langCode
    rec.continuous = false
    rec.interimResults = true

    rec.onresult = (e) => {
      const transcript = Array.from(e.results).map(r => r[0].transcript).join('')
      setInputText(transcript)
    }
    rec.onend = () => setIsListening(false)
    rec.onerror = () => setIsListening(false)

    recognitionRef.current = rec
    rec.start()
    setIsListening(true)
  }

  const handleTranslate = async (mode, text) => {
    const trimmed = (text || inputText).trim()
    if (!trimmed) return
    setLoading(true)
    setError(null)
    setInputText('')

    const fromLang = mode === 'doctor' ? doctorLang : patientLang
    const toLang   = mode === 'doctor' ? patientLang : doctorLang

    try {
      const result = await translateText(trimmed, fromLang, toLang, mode === 'doctor' ? 'doctor_to_patient' : 'patient_to_doctor')
      setHistory(prev => [...prev, result])
      speak(result.translated, toLang)
    } catch {
      setError('Translation failed. Is Ollama running?')
    } finally {
      setLoading(false)
      setActiveMode(null)
    }
  }

  const inputStyle = {
    width: '100%',
    background: '#12122A',
    border: '1.5px solid rgba(255,255,255,0.1)',
    borderRadius: '10px',
    padding: '10px 14px',
    color: '#E8E8F8',
    fontSize: '14px',
    fontFamily: 'DM Sans, sans-serif',
    outline: 'none',
    boxSizing: 'border-box',
    resize: 'vertical',
    lineHeight: 1.55,
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0A0A1A', padding: '0 0 80px' }}>
      {/* Header panel */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(0,122,255,0.12), rgba(255,149,0,0.08))',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        padding: '16px 20px',
      }}>
        <div style={{ maxWidth: '640px', margin: '0 auto' }}>
          <div style={{ color: 'var(--text-primary)', fontSize: '18px', fontWeight: '800', marginBottom: '4px' }}>
            🌐 Medical Translator
          </div>
          <div style={{ color: '#9999BB', fontSize: '13px' }}>
            Powered by Gemma 4 · Offline · Medical vocabulary aware
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '20px' }}>
        {/* Language selector */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr auto 1fr',
          gap: '12px', alignItems: 'center', marginBottom: '20px',
        }}>
          <div>
            <div style={{ color: '#007AFF', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '6px' }}>
              👨‍⚕️ Doctor
            </div>
            <select
              value={doctorLang}
              onChange={e => setDoctorLang(e.target.value)}
              style={{
                ...inputStyle, resize: 'none', padding: '8px 12px',
                border: '1.5px solid rgba(0,122,255,0.3)',
                background: 'rgba(0,122,255,0.08)',
                color: '#007AFF', fontWeight: '700',
              }}
            >
              {LANGUAGES.map(l => (
                <option key={l.code} value={l.code}>{l.flag} {l.native}</option>
              ))}
            </select>
          </div>

          <div style={{ textAlign: 'center', color: '#555577', fontSize: '20px', marginTop: '20px' }}>
            ⇄
          </div>

          <div>
            <div style={{ color: '#FF9500', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '6px' }}>
              🧑 Patient
            </div>
            <select
              value={patientLang}
              onChange={e => setPatientLang(e.target.value)}
              style={{
                ...inputStyle, resize: 'none', padding: '8px 12px',
                border: '1.5px solid rgba(255,149,0,0.3)',
                background: 'rgba(255,149,0,0.08)',
                color: '#FF9500', fontWeight: '700',
              }}
            >
              {LANGUAGES.map(l => (
                <option key={l.code} value={l.code}>{l.flag} {l.native}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Input area */}
        <div style={{
          background: '#12122A', border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: '16px', padding: '16px', marginBottom: '16px',
        }}>
          <textarea
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            placeholder={activeMode === 'patient'
              ? 'Patient is speaking… or type their symptoms here'
              : 'Doctor is speaking… or type instructions here'}
            rows={3}
            style={{ ...inputStyle, width: '100%', marginBottom: '12px' }}
          />

          {error && (
            <div style={{ color: '#FF6B88', fontSize: '12px', marginBottom: '10px' }}>{error}</div>
          )}

          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#9999BB', fontSize: '13px', marginBottom: '10px' }}>
              <div style={{ width: '14px', height: '14px', borderRadius: '50%', border: '2px solid #007AFF', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
              Translating with Gemma 4...
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {/* Doctor → Patient */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ color: '#007AFF', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Doctor → Patient
              </div>
              <button
                onClick={() => handleTranslate('doctor', inputText)}
                disabled={loading || !inputText.trim()}
                style={{
                  padding: '10px', borderRadius: '10px', border: 'none',
                  background: loading || !inputText.trim() ? 'rgba(0,122,255,0.2)' : 'linear-gradient(135deg, #0055CC, #007AFF)',
                  color: loading || !inputText.trim() ? '#007AFF' : '#FFF',
                  fontWeight: '700', fontSize: '13px', cursor: loading || !inputText.trim() ? 'default' : 'pointer',
                  fontFamily: 'DM Sans, sans-serif',
                }}
              >
                ⌨️ Translate Text
              </button>
              <button
                onClick={() => startListening('doctor')}
                disabled={loading || isListening}
                style={{
                  padding: '10px', borderRadius: '10px',
                  border: `1.5px solid ${isListening && activeMode === 'doctor' ? '#007AFF' : 'rgba(0,122,255,0.3)'}`,
                  background: isListening && activeMode === 'doctor' ? 'rgba(0,122,255,0.2)' : 'rgba(0,122,255,0.06)',
                  color: '#007AFF', fontWeight: '700', fontSize: '12px',
                  cursor: loading || isListening ? 'default' : 'pointer',
                  fontFamily: 'DM Sans, sans-serif',
                  animation: isListening && activeMode === 'doctor' ? 'pulse 1.5s ease infinite' : 'none',
                }}
              >
                {isListening && activeMode === 'doctor' ? '🔴 Listening...' : '🎙️ Speak (Doctor)'}
              </button>
              {isListening && activeMode === 'doctor' && inputText && (
                <button
                  onClick={() => {
                    recognitionRef.current?.stop()
                    handleTranslate('doctor', inputText)
                  }}
                  style={{
                    padding: '8px', borderRadius: '8px', border: 'none',
                    background: '#007AFF', color: '#FFF', fontWeight: '700', fontSize: '12px', cursor: 'pointer',
                    fontFamily: 'DM Sans, sans-serif',
                  }}
                >
                  ✓ Translate
                </button>
              )}
            </div>

            {/* Patient → Doctor */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ color: '#FF9500', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Patient → Doctor
              </div>
              <button
                onClick={() => handleTranslate('patient', inputText)}
                disabled={loading || !inputText.trim()}
                style={{
                  padding: '10px', borderRadius: '10px', border: 'none',
                  background: loading || !inputText.trim() ? 'rgba(255,149,0,0.2)' : 'linear-gradient(135deg, #CC6A00, #FF9500)',
                  color: loading || !inputText.trim() ? '#FF9500' : '#0A0A1A',
                  fontWeight: '700', fontSize: '13px', cursor: loading || !inputText.trim() ? 'default' : 'pointer',
                  fontFamily: 'DM Sans, sans-serif',
                }}
              >
                ⌨️ Translate Text
              </button>
              <button
                onClick={() => startListening('patient')}
                disabled={loading || isListening}
                style={{
                  padding: '10px', borderRadius: '10px',
                  border: `1.5px solid ${isListening && activeMode === 'patient' ? '#FF9500' : 'rgba(255,149,0,0.3)'}`,
                  background: isListening && activeMode === 'patient' ? 'rgba(255,149,0,0.2)' : 'rgba(255,149,0,0.06)',
                  color: '#FF9500', fontWeight: '700', fontSize: '12px',
                  cursor: loading || isListening ? 'default' : 'pointer',
                  fontFamily: 'DM Sans, sans-serif',
                  animation: isListening && activeMode === 'patient' ? 'pulse 1.5s ease infinite' : 'none',
                }}
              >
                {isListening && activeMode === 'patient' ? '🔴 Listening...' : '🎙️ Speak (Patient)'}
              </button>
              {isListening && activeMode === 'patient' && inputText && (
                <button
                  onClick={() => {
                    recognitionRef.current?.stop()
                    handleTranslate('patient', inputText)
                  }}
                  style={{
                    padding: '8px', borderRadius: '8px', border: 'none',
                    background: '#FF9500', color: '#0A0A1A', fontWeight: '700', fontSize: '12px', cursor: 'pointer',
                    fontFamily: 'DM Sans, sans-serif',
                  }}
                >
                  ✓ Translate
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Translation history */}
        {history.length > 0 && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ color: '#9999BB', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                Translation History
              </div>
              <button
                onClick={() => setHistory([])}
                style={{
                  padding: '4px 10px', borderRadius: '8px', background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.1)', color: '#555577', fontSize: '11px',
                  cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
                }}
              >
                Clear
              </button>
            </div>
            {history.map((entry, i) => (
              <TranslationCard key={i} entry={entry} />
            ))}
            <div ref={bottomRef} />
          </div>
        )}

        {history.length === 0 && (
          <div style={{
            textAlign: 'center', padding: '40px 20px',
            color: '#333355', fontSize: '13px', lineHeight: 1.7,
          }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>🌐</div>
            <strong style={{ color: '#555577' }}>How to use:</strong><br />
            1. Select doctor and patient languages<br />
            2. Type or speak a message<br />
            3. Press the direction button to translate<br />
            4. Gemma 4 translates offline with medical vocabulary
          </div>
        )}
      </div>
    </div>
  )
}
