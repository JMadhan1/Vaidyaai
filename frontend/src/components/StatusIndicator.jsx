import React, { useState, useEffect } from 'react'
import { checkHealth } from '../utils/api'

export default function StatusIndicator() {
  const [status, setStatus] = useState(null)

  const check = async () => {
    try {
      setStatus(await checkHealth())
    } catch {
      setStatus({ ollama_connected: false, model_available: false })
    }
  }

  useEffect(() => {
    check()
    const t = setInterval(check, 10000)
    return () => clearInterval(t)
  }, [])

  if (!status) return (
    <div style={{
      height: '30px',
      width: '120px',
      borderRadius: '50px',
      background: 'var(--surface)',
      border: '1px solid var(--border-subtle)',
      animation: 'shimmer 1.5s infinite',
      backgroundImage: 'linear-gradient(90deg, #1F2937 25%, #243044 50%, #1F2937 75%)',
      backgroundSize: '400px 100%',
    }} />
  )

  const ok = status.ollama_connected && status.model_available

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '7px',
      padding: '6px 14px',
      borderRadius: 'var(--radius-pill)',
      background: ok
        ? 'rgba(16,185,129,0.10)'
        : 'rgba(239,68,68,0.10)',
      border: `1px solid ${ok ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`,
      fontSize: '12px',
      fontWeight: '700',
      color: ok ? 'var(--emerald)' : 'var(--emergency)',
      whiteSpace: 'nowrap',
      transition: 'all 0.3s ease',
    }}>
      <div style={{
        width: '7px',
        height: '7px',
        borderRadius: '50%',
        background: ok ? 'var(--emerald)' : 'var(--emergency)',
        animation: ok ? 'pulse 2s ease infinite' : 'none',
        flexShrink: 0,
      }} />
      {ok
        ? 'Gemma 4 · Offline Ready'
        : status.ollama_connected
          ? 'Model not pulled'
          : 'Ollama offline'}
    </div>
  )
}
