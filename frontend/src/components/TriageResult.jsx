import React, { useState } from 'react'

const CONFIDENCE_COLOR = { high: '#34C759', medium: '#FF9500', low: '#FF3B30' }
const CONFIDENCE_PCT   = { high: 90, medium: 60, low: 35 }

const CHECK = (color) => (
  <span style={{
    width: '22px', height: '22px', borderRadius: '50%',
    background: `${color}22`, display: 'inline-flex',
    alignItems: 'center', justifyContent: 'center',
    fontSize: '12px', flexShrink: 0, marginTop: '1px',
  }}>✓</span>
)

const WARN = () => (
  <span style={{
    width: '22px', height: '22px', borderRadius: '50%',
    background: 'rgba(245,158,11,0.2)', display: 'inline-flex',
    alignItems: 'center', justifyContent: 'center',
    fontSize: '11px', flexShrink: 0, marginTop: '1px',
  }}>⚠</span>
)

export default function TriageResult({ triage, imageAnalysis, responseMs }) {
  const [showReasoning, setShowReasoning] = useState(false)
  if (!triage || triage.level === 'unknown') return null

  const isEmergency = triage.level === 'emergency'
  const color       = triage.color || '#10B981'
  const confColor   = CONFIDENCE_COLOR[triage.confidence] || '#FF9500'
  const confPct     = CONFIDENCE_PCT[triage.confidence]   || 60

  return (
    <div style={{
      borderRadius: '20px',
      border: `2px solid ${color}44`,
      background: `linear-gradient(145deg, ${color}14, ${color}06)`,
      overflow: 'hidden',
      boxShadow: isEmergency
        ? '0 0 40px rgba(239,68,68,0.25)'
        : '0 4px 24px rgba(0,0,0,0.35)',
      animation: isEmergency
        ? 'emergencyPulse 2s ease infinite'
        : 'fadeUp 0.4s ease both',
    }}>

      {/* ── Header ─────────────────────────────────────── */}
      <div style={{
        padding: '16px 18px 14px',
        borderBottom: `1px solid ${color}22`,
        background: `${color}12`,
      }}>
        <div style={{
          fontSize: '18px', fontWeight: '900', color, lineHeight: 1.3, marginBottom: '10px',
        }}>
          {triage.label}
        </div>

        {/* Confidence meter */}
        <div style={{ marginBottom: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              AI Confidence
            </span>
            <span style={{ fontSize: '10px', color: confColor, fontWeight: '800' }}>
              {triage.confidence?.toUpperCase()}
            </span>
          </div>
          <div style={{ height: '5px', borderRadius: '3px', background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${confPct}%`, borderRadius: '3px',
              background: confColor,
              transition: 'width 0.8s ease',
            }}/>
          </div>
        </div>

        {/* Badges row */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{
            fontSize: '10px', fontWeight: '700', padding: '3px 10px', borderRadius: '20px',
            background: 'rgba(255,255,255,0.06)', color: 'var(--emerald)',
            textTransform: 'uppercase', letterSpacing: '0.5px',
          }}>
            ⚡ Gemma 4 · Local
          </span>
          {triage.icd10_code && triage.icd10_code !== 'R69' && (
            <span style={{
              fontSize: '10px', fontWeight: '700', padding: '3px 10px', borderRadius: '20px',
              background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)',
              textTransform: 'uppercase', letterSpacing: '0.5px',
            }}>
              ICD-10: {triage.icd10_code}
            </span>
          )}
          {responseMs && (
            <span style={{
              fontSize: '10px', fontWeight: '700', padding: '3px 10px', borderRadius: '20px',
              background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)',
              textTransform: 'uppercase', letterSpacing: '0.5px',
            }}>
              ⏱ {(responseMs / 1000).toFixed(1)}s offline
            </span>
          )}
        </div>
      </div>

      {/* ── Emergency CTA ──────────────────────────────── */}
      {isEmergency && (
        <div>
          <a href="tel:108" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
            padding: '16px', background: 'rgba(239,68,68,0.2)',
            borderBottom: '1px solid rgba(239,68,68,0.3)',
            color: '#FCA5A5', fontWeight: '900', fontSize: '17px',
            letterSpacing: '0.4px', animation: 'pulse 1.5s ease infinite',
          }}>
            📞 CALL 108 — Emergency NOW
          </a>
          <a href="tel:102" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            padding: '10px', background: 'rgba(239,68,68,0.1)',
            borderBottom: '1px solid rgba(239,68,68,0.15)',
            color: '#FDA4AF', fontWeight: '700', fontSize: '13px',
          }}>
            🚐 CALL 102 — Free Maternal Ambulance (if pregnant)
          </a>
        </div>
      )}

      {/* ── Gemma 4 visual analysis ────────────────────── */}
      {imageAnalysis && (
        <div style={{
          padding: '12px 18px', borderBottom: `1px solid ${color}14`,
          background: 'rgba(16,185,129,0.05)',
        }}>
          <div style={{
            fontSize: '11px', color: 'var(--emerald)', fontWeight: '700',
            textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px',
          }}>
            🔬 Gemma 4 Visual Analysis
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6', fontWeight: '500' }}>
            {imageAnalysis}
          </div>
        </div>
      )}

      {/* ── Recommended actions ────────────────────────── */}
      {triage.actions?.length > 0 && (
        <div style={{ padding: '14px 18px' }}>
          <div style={{
            fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700',
            textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px',
          }}>
            Recommended Steps
          </div>
          {triage.actions.map((action, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'flex-start', gap: '10px',
              padding: '9px 0',
              borderBottom: i < triage.actions.length - 1 ? '1px solid var(--border-subtle)' : 'none',
            }}>
              {CHECK(color)}
              <span style={{ fontSize: '14px', color: '#D1D5DB', fontWeight: '500', lineHeight: '1.55' }}>
                {action}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* ── Warning signs (watch for these) ───────────── */}
      {triage.warning_signs?.length > 0 && (
        <div style={{
          padding: '12px 18px', borderTop: '1px solid var(--border-subtle)',
          background: 'rgba(245,158,11,0.04)',
        }}>
          <div style={{
            fontSize: '11px', color: '#F59E0B', fontWeight: '700',
            textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px',
          }}>
            ⚠ Watch for These Signs — Go to Hospital Immediately
          </div>
          {triage.warning_signs.map((sign, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'flex-start', gap: '8px',
              padding: '5px 0',
              borderBottom: i < triage.warning_signs.length - 1 ? '1px solid rgba(245,158,11,0.1)' : 'none',
            }}>
              {WARN()}
              <span style={{ fontSize: '13px', color: '#FCD34D', fontWeight: '500', lineHeight: '1.5' }}>
                {sign}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* ── Gemma 4 Reasoning Transparency ────────────── */}
      {triage.reasoning && (
        <div style={{ borderTop: '1px solid var(--border-subtle)' }}>
          <button
            onClick={() => setShowReasoning(v => !v)}
            style={{
              width: '100%', background: 'none', border: 'none',
              padding: '10px 18px', display: 'flex',
              alignItems: 'center', justifyContent: 'space-between',
              cursor: 'pointer', color: 'var(--emerald)',
              fontSize: '11px', fontWeight: '700',
              textTransform: 'uppercase', letterSpacing: '1px',
            }}
          >
            <span>🧠 Gemma 4 Clinical Reasoning</span>
            <span style={{ fontSize: '14px', opacity: 0.7 }}>{showReasoning ? '▲' : '▼'}</span>
          </button>
          {showReasoning && (
            <div style={{
              padding: '4px 18px 14px', fontSize: '13px',
              color: 'var(--text-secondary)', lineHeight: '1.65',
              background: 'rgba(16,185,129,0.04)',
            }}>
              <em>{triage.reasoning}</em>
              <div style={{
                marginTop: '8px', fontSize: '10px',
                color: 'var(--text-muted)', fontWeight: '600',
                textTransform: 'uppercase', letterSpacing: '0.8px',
                display: 'flex', gap: '12px', flexWrap: 'wrap',
              }}>
                <span>Confidence: {triage.confidence || '—'}</span>
                {triage.icd10_code && <span>ICD-10: {triage.icd10_code}</span>}
                <span>Model: Gemma 4 · 100% Local · No cloud</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Disclaimer ─────────────────────────────────── */}
      <div style={{
        padding: '10px 18px', borderTop: '1px solid var(--border-subtle)',
        background: 'rgba(0,0,0,0.18)',
      }}>
        <p style={{ fontSize: '11px', color: '#4B5563', fontWeight: '500', fontStyle: 'italic', margin: 0 }}>
          ⚕️ AI triage guidance only · Not a medical diagnosis · Always consult a qualified doctor
        </p>
      </div>
    </div>
  )
}
