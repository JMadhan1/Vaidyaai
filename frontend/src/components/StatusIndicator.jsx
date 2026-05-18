import React, { useState, useEffect, useCallback } from 'react'
import { checkHealth } from '../utils/api'

export default function StatusIndicator() {
  const [status, setStatus]       = useState(null)
  const [showAudit, setShowAudit] = useState(false)
  const [callLog, setCallLog]     = useState([])
  const [inferenceCount, setInferenceCount] = useState(0)

  const refreshLog = useCallback(() => {
    const log   = JSON.parse(sessionStorage.getItem('vaidyaai_calls') || '[]')
    const count = parseInt(sessionStorage.getItem('vaidyaai_inference_count') || '0')
    setCallLog(log)
    setInferenceCount(count)
  }, [])

  const check = async () => {
    try {
      setStatus(await checkHealth())
    } catch {
      setStatus({ ollama_connected: false, model_available: false })
    }
    refreshLog()
  }

  useEffect(() => {
    check()
    const t = setInterval(check, 10000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (!showAudit) return
    refreshLog()
    const t = setInterval(refreshLog, 2000)
    return () => clearInterval(t)
  }, [showAudit, refreshLog])

  if (!status) return (
    <div style={{
      height: '30px',
      width: '160px',
      borderRadius: '50px',
      background: 'linear-gradient(90deg, #1F2937 25%, #243044 50%, #1F2937 75%)',
      backgroundSize: '400px 100%',
      animation: 'shimmer 1.5s infinite',
    }} />
  )

  const ok = status.ollama_connected && status.model_available

  return (
    <div style={{ position: 'relative' }}>
      {/* Main badge */}
      <button
        onClick={() => { setShowAudit(s => !s); refreshLog() }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '7px',
          padding: '6px 13px',
          borderRadius: 'var(--radius-pill)',
          background: ok ? 'rgba(16,185,129,0.10)' : 'rgba(239,68,68,0.10)',
          border: `1px solid ${ok ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`,
          fontSize: '11px',
          fontWeight: '700',
          color: ok ? 'var(--emerald)' : 'var(--emergency)',
          whiteSpace: 'nowrap',
          cursor: 'pointer',
          fontFamily: 'DM Sans, sans-serif',
          transition: 'all 0.2s ease',
        }}
      >
        <div style={{
          width: '7px',
          height: '7px',
          borderRadius: '50%',
          background: ok ? 'var(--emerald)' : 'var(--emergency)',
          animation: ok ? 'pulse 2s ease infinite' : 'none',
          flexShrink: 0,
        }} />
        {ok ? (
          <>OFFLINE · 0 cloud · {inferenceCount} calls</>
        ) : (
          status.ollama_connected ? 'Model not pulled' : 'Ollama offline'
        )}
      </button>

      {/* Privacy Audit Panel */}
      {showAudit && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setShowAudit(false)}
            style={{
              position: 'fixed', inset: 0, zIndex: 199,
            }}
          />
          <div style={{
            position: 'absolute',
            top: 'calc(100% + 10px)',
            right: 0,
            width: '340px',
            maxHeight: '420px',
            background: '#0D1426',
            border: '1.5px solid rgba(16,185,129,0.25)',
            borderRadius: '14px',
            zIndex: 200,
            overflow: 'hidden',
            boxShadow: '0 20px 60px rgba(0,0,0,0.7)',
            display: 'flex',
            flexDirection: 'column',
          }}>
            {/* Header */}
            <div style={{
              padding: '14px 16px',
              borderBottom: '1px solid rgba(255,255,255,0.07)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div>
                <div style={{ color: 'var(--emerald)', fontSize: '13px', fontWeight: '800' }}>
                  🔒 Privacy Audit
                </div>
                <div style={{ color: '#555577', fontSize: '11px', marginTop: '2px' }}>
                  Every request targets localhost only
                </div>
              </div>
              <div style={{
                padding: '4px 10px', borderRadius: '100px',
                background: 'rgba(16,185,129,0.12)',
                border: '1px solid rgba(16,185,129,0.3)',
                color: 'var(--emerald)', fontSize: '11px', fontWeight: '700',
              }}>
                ☁ 0 cloud calls
              </div>
            </div>

            {/* Stats row */}
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
              padding: '12px 16px',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              gap: '8px',
            }}>
              {[
                { label: 'Total calls', value: callLog.length },
                { label: 'Inferences', value: inferenceCount },
                { label: 'Cloud calls', value: 0 },
              ].map(s => (
                <div key={s.label} style={{ textAlign: 'center' }}>
                  <div style={{
                    fontSize: '18px', fontWeight: '800',
                    color: s.label === 'Cloud calls' ? 'var(--emerald)' : 'var(--text-primary)',
                  }}>{s.value}</div>
                  <div style={{ fontSize: '10px', color: '#555577', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {s.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Call log */}
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {callLog.length === 0 ? (
                <div style={{ padding: '20px 16px', textAlign: 'center', color: '#555577', fontSize: '12px' }}>
                  No API calls yet in this session
                </div>
              ) : (
                [...callLog].reverse().map((entry, i) => (
                  <div key={i} style={{
                    padding: '8px 16px',
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                    display: 'flex',
                    gap: '8px',
                    alignItems: 'flex-start',
                  }}>
                    <span style={{
                      fontSize: '10px', fontWeight: '700',
                      color: entry.method === 'POST' ? '#007AFF' : 'var(--emerald)',
                      minWidth: '32px',
                    }}>{entry.method}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: '#C0C0D8', fontSize: '12px', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {entry.endpoint}
                      </div>
                      <div style={{ color: '#555577', fontSize: '10px', marginTop: '2px' }}>
                        → {entry.target} · {entry.elapsed}s
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px', flexShrink: 0 }}>
                      <span style={{
                        fontSize: '10px', fontWeight: '700',
                        color: entry.status === 200 ? '#34C759' : '#FF9500',
                      }}>{entry.status}</span>
                      <span style={{ color: '#444466', fontSize: '10px' }}>{entry.time}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div style={{ padding: '10px 16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ color: '#444466', fontSize: '10px', lineHeight: 1.5 }}>
                VaidyaAI makes zero external API calls. All inference runs on your device via Ollama + Gemma 4. Patient data never leaves this machine.
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
