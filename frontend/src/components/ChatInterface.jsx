import React, { useState, useRef, useEffect } from 'react'
import { Send, Mic, MicOff, Camera, Volume2, VolumeX, RefreshCw, AlertTriangle } from 'lucide-react'
import TriageResult from './TriageResult'
import { useChat } from '../hooks/useChat'
import { useVoice } from '../hooks/useVoice'
import { useTTS } from '../hooks/useTTS'
import { LANGUAGES } from '../utils/languages'
import { cleanAIResponse } from '../utils/textCleaner'

// ── Skeleton loader shown while AI is thinking ────────────────────────────────
function MessageSkeleton({ loadingText }) {
  return (
    <div style={{
      display: 'flex',
      gap: '12px',
      alignItems: 'flex-start',
      animation: 'fadeIn 0.3s ease',
    }}>
      {/* AI avatar */}
      <div style={{
        width: '36px',
        height: '36px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, var(--emerald), var(--emerald-dark))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '16px',
        flexShrink: 0,
        boxShadow: '0 2px 10px rgba(16,185,129,0.3)',
      }}>🏥</div>

      {/* Bubble with bouncing dots */}
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '4px 18px 18px 18px',
        padding: '14px 18px',
        minWidth: '180px',
      }}>
        <div style={{ display: 'flex', gap: '7px', alignItems: 'center', marginBottom: '8px' }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: 'var(--emerald)',
              animation: `bounce 1.1s ease ${i * 0.16}s infinite`,
            }} />
          ))}
        </div>
        <div style={{ color: 'var(--text-muted)', fontSize: '13px', fontWeight: '600' }}>
          {loadingText}
        </div>
        {/* Skeleton lines */}
        <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '7px' }}>
          {[85, 70, 50].map((w, i) => (
            <div key={i} style={{
              height: '11px',
              width: `${w}%`,
              borderRadius: '6px',
              backgroundImage: 'linear-gradient(90deg, #1F2937 25%, #2D3748 50%, #1F2937 75%)',
              backgroundSize: '400px 100%',
              animation: `shimmer 1.6s ease ${i * 0.12}s infinite`,
            }} />
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Streaming cursor ──────────────────────────────────────────────────────────
function Cursor() {
  return (
    <span style={{
      display: 'inline-block',
      width: '2px',
      height: '17px',
      background: 'var(--emerald)',
      marginLeft: '3px',
      borderRadius: '1px',
      animation: 'blink 1s step-end infinite',
      verticalAlign: 'text-bottom',
    }} />
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ChatInterface({ language, onTriageUpdate }) {
  const [input, setInput]             = useState('')
  const [pendingImage, setPendingImage] = useState(null)
  const [speakingId, setSpeakingId]   = useState(null)
  const bottomRef   = useRef(null)
  const textareaRef = useRef(null)
  const fileRef     = useRef(null)

  const { messages, isLoading, triageResult, error, sendMessage, resetChat } = useChat(language)
  const { isSpeaking, speak, stop } = useTTS()
  const { isListening, startListening, stopListening } = useVoice()
  const lang = LANGUAGES[language] || LANGUAGES.en

  // Propagate latest triage result upward (for emergency banner)
  useEffect(() => {
    if (triageResult) onTriageUpdate?.(triageResult)
  }, [triageResult])

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  const handleSend = () => {
    const text = input.trim()
    if (!text && !pendingImage) return
    sendMessage({ text: text || '(image attached)', imageBase64: pendingImage?.base64 })
    setInput('')
    setPendingImage(null)
    textareaRef.current?.focus()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleSpeak = (msg) => {
    if (speakingId === msg.id) {
      stop()
      setSpeakingId(null)
      return
    }
    setSpeakingId(msg.id)
    const textToSpeak = msg.triage?.speakText || cleanAIResponse(msg.content)
    speak(textToSpeak, lang.speech_synthesis_lang, () => setSpeakingId(null))
  }

  const handleVoiceToggle = () => {
    if (isListening) {
      stopListening()
    } else {
      startListening(lang.speech_recognition_code, (transcript) => {
        setInput(prev => prev ? `${prev} ${transcript}` : transcript)
      })
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const base64 = ev.target.result.split(',')[1]
      setPendingImage({ base64, preview: ev.target.result })
    }
    reader.readAsDataURL(file)
  }

  const canSend = (input.trim() || pendingImage) && !isLoading

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: 'var(--bg)',
    }}>
      {/* ── Messages list ──────────────────────────────────── */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '20px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
      }}>

        {/* Empty state */}
        {messages.length === 0 && !isLoading && (
          <div style={{
            textAlign: 'center',
            padding: '52px 24px',
            animation: 'fadeUp 0.5s ease both',
          }}>
            <div style={{ fontSize: '52px', marginBottom: '18px', lineHeight: 1 }}>🩺</div>
            <p style={{
              color: 'var(--text-muted)',
              fontSize: '16px',
              lineHeight: '1.65',
              maxWidth: '300px',
              margin: '0 auto',
              fontWeight: '600',
            }}>
              {lang.greeting}
            </p>
          </div>
        )}

        {/* Messages */}
        {messages.map((msg) => (
          <div key={msg.id} style={{ animation: 'fadeUp 0.3s ease both' }}>

            {/* ── User message ── */}
            {msg.role === 'user' && (
              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '10px',
                alignItems: 'flex-end',
              }}>
                <div style={{ maxWidth: '78%' }}>
                  {/* Image preview in bubble */}
                  {msg.imageBase64 && (
                    <div style={{ marginBottom: '6px', display: 'flex', justifyContent: 'flex-end' }}>
                      <img
                        src={`data:image/jpeg;base64,${msg.imageBase64}`}
                        alt="attached symptom"
                        style={{
                          width: '140px',
                          borderRadius: '16px 16px 4px 16px',
                          border: '2px solid var(--border)',
                          display: 'block',
                        }}
                      />
                    </div>
                  )}
                  <div style={{
                    padding: '13px 18px',
                    borderRadius: '20px 20px 4px 20px',
                    background: 'linear-gradient(135deg, var(--emerald), var(--emerald-dark))',
                    color: 'white',
                    fontSize: '15px',
                    lineHeight: '1.6',
                    fontWeight: '600',
                    boxShadow: '0 4px 18px rgba(16,185,129,0.28)',
                    wordBreak: 'break-word',
                  }}>
                    {msg.content}
                  </div>
                </div>
                {/* User avatar */}
                <div style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  background: 'var(--card)',
                  border: '2px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '15px',
                  flexShrink: 0,
                  marginBottom: '2px',
                }}>👤</div>
              </div>
            )}

            {/* ── Assistant message ── */}
            {msg.role === 'assistant' && (
              <div style={{
                display: 'flex',
                gap: '12px',
                alignItems: 'flex-start',
              }}>
                {/* AI avatar */}
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--emerald), var(--emerald-dark))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '17px',
                  flexShrink: 0,
                  boxShadow: '0 2px 10px rgba(16,185,129,0.30)',
                  marginTop: '2px',
                }}>🏥</div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* Text bubble — JSON is stripped by cleanAIResponse */}
                  <div style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '4px 18px 18px 18px',
                    padding: '14px 16px',
                    fontSize: '15px',
                    lineHeight: '1.7',
                    color: '#E5E7EB',
                    fontWeight: '500',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.32)',
                    position: 'relative',
                    wordBreak: 'break-word',
                    whiteSpace: 'pre-wrap',
                  }}>
                    {cleanAIResponse(msg.content)}
                    {msg.streaming && <Cursor />}

                    {/* TTS button */}
                    {!msg.streaming && msg.content && (
                      <button
                        onClick={() => handleSpeak(msg)}
                        title={speakingId === msg.id ? 'Stop speaking' : 'Read aloud'}
                        style={{
                          position: 'absolute',
                          top: '10px',
                          right: '10px',
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          background: speakingId === msg.id
                            ? 'rgba(16,185,129,0.2)'
                            : 'transparent',
                          color: speakingId === msg.id
                            ? 'var(--emerald)'
                            : '#4B5563',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s ease',
                          animation: speakingId === msg.id ? 'pulse 1.5s ease infinite' : 'none',
                        }}
                      >
                        {speakingId === msg.id
                          ? <VolumeX size={14} />
                          : <Volume2 size={14} />}
                      </button>
                    )}
                  </div>

                  {/* Triage result card — only after streaming ends and level is known */}
                  {!msg.streaming && msg.triage && msg.triage.level !== 'unknown' && (
                    <div style={{ marginTop: '10px' }}>
                      <TriageResult
                        triage={msg.triage}
                        imageAnalysis={msg.imageAnalysis}
                        responseMs={msg.responseMs}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}

        {/* ── Skeleton loading ────────────────────── */}
        {isLoading && !messages.some(m => m.streaming) && (
          <MessageSkeleton loadingText={lang.loading_text || 'Analyzing your symptoms...'} />
        )}

        {/* ── Error ──────────────────────────────── */}
        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.10)',
            border: '1px solid rgba(239,68,68,0.28)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            animation: 'fadeIn 0.3s ease',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={16} color="var(--emergency)" />
              <span style={{ color: '#FCA5A5', fontSize: '14px', fontWeight: '600' }}>
                {error}
              </span>
            </div>
            <button
              onClick={() => {
                const lastUser = [...messages].reverse().find(m => m.role === 'user')
                if (lastUser) sendMessage({ text: lastUser.content })
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(239,68,68,0.20)',
                color: '#FCA5A5',
                fontSize: '13px',
                fontWeight: '700',
              }}
            >
              <RefreshCw size={12} /> Retry
            </button>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Input area ──────────────────────────────────── */}
      <div style={{
        padding: '10px 14px 14px',
        borderTop: '1px solid var(--border-subtle)',
        background: 'rgba(10,15,30,0.98)',
        backdropFilter: 'blur(12px)',
      }}>
        {/* Pending image preview */}
        {pendingImage && (
          <div style={{
            marginBottom: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            animation: 'slideDown 0.25s ease',
          }}>
            <img
              src={pendingImage.preview}
              alt="symptom"
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '12px',
                objectFit: 'cover',
                border: '2px solid var(--emerald)',
              }}
            />
            <button
              onClick={() => setPendingImage(null)}
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: 'var(--emergency)',
                color: 'white',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >✕</button>
            <span style={{ color: 'var(--text-muted)', fontSize: '13px', fontWeight: '600' }}>
              Photo attached · Gemma 4 will analyze it
            </span>
          </div>
        )}

        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
          {/* Camera */}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          <button
            onClick={() => fileRef.current?.click()}
            title="Attach symptom photo"
            style={{
              width: '48px',
              height: '48px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--surface)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--emerald)'; e.currentTarget.style.borderColor = 'rgba(16,185,129,0.4)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border-subtle)' }}
          >
            <Camera size={20} />
          </button>

          {/* Text area */}
          <div style={{ flex: 1 }}>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={lang.placeholder}
              rows={1}
              style={{
                width: '100%',
                background: 'var(--surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-primary)',
                fontSize: '15px',
                fontWeight: '500',
                padding: '13px 16px',
                resize: 'none',
                lineHeight: '1.5',
                minHeight: '48px',
                maxHeight: '120px',
                overflowY: 'auto',
                transition: 'border-color 0.2s ease',
                caretColor: 'var(--emerald)',
              }}
              onFocus={e => { e.target.style.borderColor = 'var(--emerald)' }}
              onBlur={e => { e.target.style.borderColor = 'var(--border-subtle)' }}
              onInput={e => {
                e.target.style.height = 'auto'
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
              }}
            />
          </div>

          {/* Microphone */}
          <button
            onClick={handleVoiceToggle}
            title={isListening ? 'Stop listening' : 'Speak your symptoms'}
            style={{
              width: '48px',
              height: '48px',
              borderRadius: 'var(--radius-md)',
              background: isListening ? 'rgba(239,68,68,0.15)' : 'var(--surface)',
              border: `1px solid ${isListening ? 'rgba(239,68,68,0.5)' : 'var(--border-subtle)'}`,
              color: isListening ? 'var(--emergency)' : 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              transition: 'all 0.2s ease',
              animation: isListening ? 'pulse 1.5s ease infinite' : 'none',
            }}
          >
            {isListening ? <MicOff size={20} /> : <Mic size={20} />}
          </button>

          {/* Send */}
          <button
            onClick={handleSend}
            disabled={!canSend}
            title="Send message"
            style={{
              width: '48px',
              height: '48px',
              borderRadius: 'var(--radius-md)',
              background: canSend
                ? 'linear-gradient(135deg, var(--emerald), var(--emerald-dark))'
                : 'var(--card)',
              color: canSend ? 'white' : '#4B5563',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              transition: 'all 0.2s ease',
              boxShadow: canSend ? '0 4px 18px rgba(16,185,129,0.32)' : 'none',
            }}
          >
            <Send size={18} />
          </button>
        </div>

        {/* Reset link */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
          <button
            onClick={resetChat}
            style={{
              background: 'none',
              color: 'var(--text-muted)',
              fontSize: '12px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <RefreshCw size={12} /> New Consultation
          </button>
        </div>
      </div>
    </div>
  )
}
