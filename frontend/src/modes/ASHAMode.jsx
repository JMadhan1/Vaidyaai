import React, { useState, useEffect, useRef } from 'react'
import { Camera, X, ChevronDown, ChevronUp, Share2, Plus, AlertTriangle, CheckCircle, Printer, Zap } from 'lucide-react'
import { getASHALabels } from './ASHAPrompts'
import { ASHASession } from './ASHASession'
import { sendASHATriage, readRDTStrip, getImmunizationSchedule, identifySnakebite, readVVM, getPregnancyPlan, getHealthBulletin } from '../utils/api'

// ─── Pill button group ────────────────────────────────────────────────────────
function PillGroup({ options, value, onChange, color = '#00D4AA' }) {
  return (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
      {options.map(opt => {
        const selected = value === opt
        return (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            style={{
              padding: '8px 16px',
              borderRadius: '100px',
              border: `1.5px solid ${selected ? color : 'rgba(255,255,255,0.12)'}`,
              background: selected ? `${color}22` : 'rgba(255,255,255,0.04)',
              color: selected ? color : '#9999BB',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              fontFamily: 'DM Sans, sans-serif',
            }}
          >
            {opt}
          </button>
        )
      })}
    </div>
  )
}

// ─── Form field wrapper ───────────────────────────────────────────────────────
function Field({ label, children }) {
  return (
    <div style={{ marginBottom: '18px' }}>
      <div style={{ color: '#9999BB', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px', fontWeight: '600' }}>
        {label}
      </div>
      {children}
    </div>
  )
}

// ─── Triage urgency color ─────────────────────────────────────────────────────
const URGENCY_COLOR = {
  immediate: '#FF2D55',
  today: '#FF9500',
  '3days': '#34C759',
  '1week': '#007AFF',
}

// ─── Printable PHC Referral Letter ───────────────────────────────────────────
function printReferral({ form, decision, villageName, ashaName }) {
  const date = new Date().toLocaleDateString('en-IN', { year:'numeric', month:'long', day:'numeric' })
  const html = `<!DOCTYPE html><html><head><title>VaidyaAI Referral Letter</title>
<style>
  body { font-family: Arial, sans-serif; max-width: 700px; margin: 40px auto; color: #111; font-size: 14px; }
  h1 { font-size: 20px; border-bottom: 2px solid #333; padding-bottom: 8px; }
  .header { display: flex; justify-content: space-between; margin-bottom: 20px; }
  .section { margin: 16px 0; padding: 12px; border: 1px solid #ddd; border-radius: 6px; }
  .label { font-weight: bold; color: #555; font-size: 12px; text-transform: uppercase; }
  .value { font-size: 15px; margin-top: 2px; }
  .triage { font-size: 20px; font-weight: bold; color: ${
    decision.triage_level === 'emergency' ? '#CC0000' :
    decision.triage_level === 'clinic'    ? '#CC6600' : '#006600'
  }; }
  .actions { margin-top: 8px; }
  .action-item { margin: 4px 0; }
  .footer { margin-top: 30px; font-size: 12px; color: #888; border-top: 1px solid #ddd; padding-top: 10px; }
  .vitals { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .vital { background: #f5f5f5; padding: 6px 10px; border-radius: 4px; }
  @media print { body { margin: 20px; } }
</style></head><body>
<h1>PHC Referral Letter — VaidyaAI</h1>
<div class="header">
  <div><strong>Date:</strong> ${date}</div>
  <div><strong>Village:</strong> ${villageName || 'Not specified'}</div>
  <div><strong>ASHA Worker:</strong> ${ashaName || 'Not specified'}</div>
</div>

<div class="section">
  <div class="label">Patient Details</div>
  <div class="value">Age: ${form.age} years (${form.age_group}) · Gender: ${form.gender}</div>
  <div class="value">Chief Complaint: <strong>${form.chief_complaint}</strong></div>
  <div class="value">Duration: ${form.duration_days} days · Fever: ${form.has_fever ? (form.temperature ? form.temperature+'°F' : 'Yes') : 'No'}</div>
</div>

${(form.weight_kg || form.pulse || form.respiratory_rate || form.spo2 || form.muac_mm) ? `
<div class="section">
  <div class="label">Vital Signs</div>
  <div class="vitals">
    ${form.weight_kg ? `<div class="vital">Weight: ${form.weight_kg} kg</div>` : ''}
    ${form.pulse ? `<div class="vital">Pulse: ${form.pulse} bpm</div>` : ''}
    ${form.respiratory_rate ? `<div class="vital">Resp Rate: ${form.respiratory_rate}/min</div>` : ''}
    ${form.spo2 ? `<div class="vital">SpO₂: ${form.spo2}%${parseInt(form.spo2)<94?' ⚠':''}  </div>` : ''}
    ${form.muac_mm ? `<div class="vital">MUAC: ${form.muac_mm}mm${parseInt(form.muac_mm)<115?' 🚨 SAM':parseInt(form.muac_mm)<125?' ⚠ MAM':''}</div>` : ''}
  </div>
</div>` : ''}

<div class="section">
  <div class="label">VaidyaAI Triage Assessment (Gemma 4 AI)</div>
  <div class="triage">${(decision.triage_level||'').toUpperCase()} — ${decision.triage_label || ''}</div>
  ${decision.primary_concern ? `<div class="value" style="margin-top:8px">${decision.primary_concern}</div>` : ''}
  ${decision.icd10_code && decision.icd10_code !== 'R69' ? `<div style="color:#555;font-size:12px;margin-top:4px">ICD-10: ${decision.icd10_code} · AI Confidence: ${decision.confidence || 'N/A'}</div>` : ''}
</div>

${decision.vital_sign_flags?.length ? `
<div class="section" style="border-color:#CC0000">
  <div class="label" style="color:#CC0000">⚠ IMCI Vital Sign Red Flags</div>
  ${decision.vital_sign_flags.map(f=>`<div class="action-item">• ${f}</div>`).join('')}
</div>` : ''}

${decision.from_kit?.length ? `
<div class="section">
  <div class="label">Medicines Given from ASHA Kit</div>
  ${decision.from_kit.map(m=>`<div class="action-item">• ${m}</div>`).join('')}
</div>` : ''}

${decision.tell_family?.length ? `
<div class="section">
  <div class="label">Family Instructions Provided</div>
  ${decision.tell_family.map(i=>`<div class="action-item">✓ ${i}</div>`).join('')}
</div>` : ''}

${decision.red_flags_to_watch?.length ? `
<div class="section" style="border-color:#FF9500">
  <div class="label">Return Immediately If</div>
  ${decision.red_flags_to_watch.map(f=>`<div class="action-item">• ${f}</div>`).join('')}
</div>` : ''}

<div class="footer">
  Generated by VaidyaAI v2.0 · WHO IMCI protocols · Gemma 4 by Google DeepMind · Running offline via Ollama<br/>
  This is an AI-assisted triage decision, not a medical diagnosis. Clinical judgment of qualified health personnel is required.
</div>
</body></html>`

  const w = window.open('', '_blank')
  w.document.write(html)
  w.document.close()
  w.print()
}

// ─── Health Bulletin Component ────────────────────────────────────────────────
function HealthBulletin({ language }) {
  const [bulletin, setBulletin] = useState(null)
  const [loading, setLoading]   = useState(false)
  const [speaking, setSpeaking] = useState(false)

  const fetchBulletin = async () => {
    setLoading(true)
    try {
      const data = await getHealthBulletin(language)
      setBulletin(data)
    } catch {
      /* non-critical */
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchBulletin() }, [language])

  const speakBulletin = () => {
    if (!bulletin || !window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const SPEECH_CODES = { en: 'en-IN', te: 'te-IN', hi: 'hi-IN', ta: 'ta-IN' }
    const text = `${bulletin.title}. ${bulletin.tips.join('. ')}. Did you know: ${bulletin.did_you_know}`
    const utt = new SpeechSynthesisUtterance(text)
    utt.lang = SPEECH_CODES[language] || 'en-IN'
    utt.rate = 0.9
    utt.onend = () => setSpeaking(false)
    setSpeaking(true)
    window.speechSynthesis.speak(utt)
  }

  if (!bulletin && !loading) return null

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(0,212,170,0.08), rgba(0,122,255,0.06))',
      border: '1.5px solid rgba(0,212,170,0.2)',
      borderRadius: '14px',
      padding: '16px',
      marginBottom: '16px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{ color: '#00D4AA', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
          📻 Today's Health Bulletin
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={speakBulletin}
            disabled={!bulletin || speaking}
            style={{
              padding: '4px 10px', borderRadius: '100px', fontSize: '11px', fontWeight: '700',
              border: '1px solid rgba(0,212,170,0.3)', background: speaking ? 'rgba(0,212,170,0.2)' : 'rgba(0,212,170,0.08)',
              color: '#00D4AA', cursor: bulletin ? 'pointer' : 'default',
              fontFamily: 'DM Sans, sans-serif',
              animation: speaking ? 'pulse 1.5s ease infinite' : 'none',
            }}
          >
            {speaking ? '🔊 Playing...' : '🔊 Play'}
          </button>
          <button
            onClick={fetchBulletin}
            disabled={loading}
            style={{
              padding: '4px 10px', borderRadius: '100px', fontSize: '11px', fontWeight: '700',
              border: '1px solid rgba(255,255,255,0.1)', background: 'transparent',
              color: '#555577', cursor: loading ? 'default' : 'pointer',
              fontFamily: 'DM Sans, sans-serif',
            }}
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#555577', fontSize: '12px', padding: '8px 0' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', border: '2px solid #00D4AA', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
          Generating today's health tip with Gemma 4...
        </div>
      )}

      {bulletin && (
        <>
          <div style={{ color: '#E8E8F8', fontSize: '15px', fontWeight: '700', lineHeight: 1.4, marginBottom: '12px' }}>
            {bulletin.title}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
            {bulletin.tips.map((tip, i) => (
              <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                <span style={{ color: '#00D4AA', fontSize: '14px', flexShrink: 0 }}>✓</span>
                <span style={{ color: '#C0C0D8', fontSize: '13px', lineHeight: 1.55 }}>{tip}</span>
              </div>
            ))}
          </div>
          {bulletin.did_you_know && (
            <div style={{
              padding: '10px 12px', borderRadius: '8px',
              background: 'rgba(0,122,255,0.08)', border: '1px solid rgba(0,122,255,0.15)',
            }}>
              <span style={{ color: '#60A5FA', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                💡 Did you know?{' '}
              </span>
              <span style={{ color: '#9999BB', fontSize: '12px', lineHeight: 1.5 }}>{bulletin.did_you_know}</span>
            </div>
          )}
          <div style={{ color: '#444466', fontSize: '10px', marginTop: '8px' }}>
            {bulletin.date} · Gemma 4 offline · {bulletin.inference_seconds}s
          </div>
        </>
      )}
    </div>
  )
}

// ─── Snakebite Identifier Component ─────────────────────────────────────────
function SnakebiteIdentifier({ language }) {
  const [image, setImage]         = useState(null)
  const [imagePreview, setPreview] = useState(null)
  const [result, setResult]       = useState(null)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState(null)
  const fileRef                   = useRef()

  const URGENCY_COLOR = { emergency: '#FF2D55', monitor: '#FF9500' }

  const handleImage = (file) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => {
      setImage(e.target.result.split(',')[1])
      setPreview(e.target.result)
      setResult(null)
    }
    reader.readAsDataURL(file)
  }

  const handleIdentify = async () => {
    if (!image) { setError('Please take a photo of the snake first.'); return }
    setLoading(true); setError(null); setResult(null)
    try {
      const res = await identifySnakebite(image, language)
      setResult(res)
    } catch {
      setError('Gemma 4 vision unavailable. Is Ollama running?')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      background: '#0F0F28',
      border: '1.5px solid rgba(255,149,0,0.2)',
      borderRadius: '14px',
      padding: '16px',
      marginBottom: '16px',
    }}>
      <div style={{ color: '#FF9500', fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '14px' }}>
        🐍 Snakebite Identifier — Big 4
      </div>

      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '12px' }}>
        <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={e => handleImage(e.target.files[0])} />
        {imagePreview ? (
          <div style={{ position: 'relative' }}>
            <img src={imagePreview} alt="snake" style={{ width: '80px', height: '60px', borderRadius: '8px', objectFit: 'cover', border: '2px solid rgba(255,149,0,0.5)' }} />
            <button onClick={() => { setImage(null); setPreview(null); setResult(null) }}
              style={{ position: 'absolute', top: '-6px', right: '-6px', width: '18px', height: '18px', borderRadius: '50%', background: '#FF2D55', border: 'none', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X size={10} />
            </button>
          </div>
        ) : (
          <button onClick={() => fileRef.current.click()} style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '10px 16px', borderRadius: '10px',
            border: '1.5px dashed rgba(255,149,0,0.35)',
            background: 'rgba(255,149,0,0.05)',
            color: '#FF9500', fontSize: '13px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
          }}>
            <Camera size={16} /> Photo Snake
          </button>
        )}
        <button onClick={handleIdentify} disabled={!image || loading} style={{
          flex: 1, padding: '10px 14px', borderRadius: '10px', border: 'none',
          background: !image || loading ? 'rgba(255,149,0,0.2)' : 'linear-gradient(135deg, #CC6A00, #FF9500)',
          color: !image || loading ? '#FF9500' : '#0A0A1A',
          fontWeight: '700', fontSize: '13px', cursor: image && !loading ? 'pointer' : 'default',
          fontFamily: 'DM Sans, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
        }}>
          {loading ? (
            <><div style={{ width: '14px', height: '14px', borderRadius: '50%', border: '2px solid #FF9500', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />Identifying...</>
          ) : '🐍 Identify Snake'}
        </button>
      </div>

      {error && <div style={{ color: '#FF9500', fontSize: '12px', marginBottom: '8px' }}>{error}</div>}

      {result && (
        <div style={{
          padding: '14px', borderRadius: '10px',
          background: result.urgency === 'emergency' ? 'rgba(255,45,85,0.08)' : 'rgba(255,149,0,0.08)',
          border: `1.5px solid ${result.urgency === 'emergency' ? 'rgba(255,45,85,0.3)' : 'rgba(255,149,0,0.3)'}`,
        }}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', marginBottom: '12px' }}>
            <div>
              <div style={{ color: URGENCY_COLOR[result.urgency] || '#FF9500', fontSize: '16px', fontWeight: '800' }}>
                {result.identified_species}
              </div>
              <div style={{ color: '#9999BB', fontSize: '11px', marginTop: '2px' }}>
                {result.venom_type} · AI confidence: {result.confidence} · {result.inference_seconds}s
              </div>
              {result.urgency === 'emergency' && (
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                  <a href="tel:108" style={{
                    padding: '6px 14px', borderRadius: '8px', background: '#FF2D55',
                    color: '#FFF', fontWeight: '700', fontSize: '12px', textDecoration: 'none', display: 'inline-block',
                  }}>🚨 CALL 108</a>
                </div>
              )}
            </div>
          </div>

          {result.reasoning && (
            <div style={{ color: '#9999BB', fontSize: '12px', lineHeight: 1.5, marginBottom: '12px', fontStyle: 'italic' }}>
              {result.reasoning}
            </div>
          )}

          {result.first_aid?.length > 0 && (
            <div style={{ marginBottom: '10px' }}>
              <div style={{ color: '#34C759', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                ✓ First Aid
              </div>
              {result.first_aid.map((step, i) => (
                <div key={i} style={{ color: '#C0C0D8', fontSize: '12px', lineHeight: 1.6, display: 'flex', gap: '6px' }}>
                  <span style={{ color: '#34C759', fontWeight: '700' }}>{i + 1}.</span>{step}
                </div>
              ))}
            </div>
          )}

          {result.do_not?.length > 0 && (
            <div style={{
              padding: '10px 12px', borderRadius: '8px',
              background: 'rgba(255,45,85,0.08)', border: '1px solid rgba(255,45,85,0.2)',
            }}>
              <div style={{ color: '#FF2D55', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                ✗ Do NOT
              </div>
              {result.do_not.map((d, i) => (
                <div key={i} style={{ color: '#FCA5A5', fontSize: '12px', lineHeight: 1.6 }}>• {d}</div>
              ))}
            </div>
          )}

          {result.antivenom_note && (
            <div style={{ color: '#555577', fontSize: '11px', marginTop: '8px', lineHeight: 1.5 }}>
              💉 {result.antivenom_note}
            </div>
          )}
        </div>
      )}

      {!result && !loading && (
        <div style={{ color: '#444466', fontSize: '12px', fontStyle: 'italic' }}>
          Photo a snake after a bite. Gemma 4 identifies Big 4 Indian species and gives WHO first aid.
        </div>
      )}
    </div>
  )
}

// ─── Vaccine Vial Monitor Reader ─────────────────────────────────────────────
function VVMReader({ language }) {
  const [image, setImage]         = useState(null)
  const [imagePreview, setPreview] = useState(null)
  const [result, setResult]       = useState(null)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState(null)
  const fileRef                   = useRef()

  const handleImage = (file) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => {
      setImage(e.target.result.split(',')[1])
      setPreview(e.target.result)
      setResult(null)
    }
    reader.readAsDataURL(file)
  }

  const handleRead = async () => {
    if (!image) { setError('Please take a photo of the vaccine vial VVM first.'); return }
    setLoading(true); setError(null); setResult(null)
    try {
      const res = await readVVM(image, language)
      setResult(res)
    } catch {
      setError('Gemma 4 vision unavailable. Is Ollama running?')
    } finally {
      setLoading(false)
    }
  }

  const usable = result?.usable === true
  const resultColor = result ? (usable ? '#34C759' : '#FF2D55') : '#8E8E93'

  return (
    <div style={{
      background: '#0F0F28',
      border: '1.5px solid rgba(0,122,255,0.2)',
      borderRadius: '14px',
      padding: '16px',
      marginBottom: '16px',
    }}>
      <div style={{ color: '#60A5FA', fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '14px' }}>
        💉 Vaccine Vial Monitor (VVM) Reader
      </div>

      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '12px' }}>
        <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={e => handleImage(e.target.files[0])} />
        {imagePreview ? (
          <div style={{ position: 'relative' }}>
            <img src={imagePreview} alt="vvm" style={{ width: '80px', height: '60px', borderRadius: '8px', objectFit: 'cover', border: '2px solid rgba(0,122,255,0.5)' }} />
            <button onClick={() => { setImage(null); setPreview(null); setResult(null) }}
              style={{ position: 'absolute', top: '-6px', right: '-6px', width: '18px', height: '18px', borderRadius: '50%', background: '#FF2D55', border: 'none', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X size={10} />
            </button>
          </div>
        ) : (
          <button onClick={() => fileRef.current.click()} style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '10px 16px', borderRadius: '10px',
            border: '1.5px dashed rgba(0,122,255,0.35)',
            background: 'rgba(0,122,255,0.05)',
            color: '#60A5FA', fontSize: '13px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
          }}>
            <Camera size={16} /> Photo Vaccine Label
          </button>
        )}
        <button onClick={handleRead} disabled={!image || loading} style={{
          flex: 1, padding: '10px 14px', borderRadius: '10px', border: 'none',
          background: !image || loading ? 'rgba(0,122,255,0.2)' : 'linear-gradient(135deg, #0055CC, #007AFF)',
          color: !image || loading ? '#60A5FA' : '#FFF',
          fontWeight: '700', fontSize: '13px', cursor: image && !loading ? 'pointer' : 'default',
          fontFamily: 'DM Sans, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
        }}>
          {loading ? (
            <><div style={{ width: '14px', height: '14px', borderRadius: '50%', border: '2px solid #007AFF', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />Reading VVM...</>
          ) : '💉 Read VVM'}
        </button>
      </div>

      {error && <div style={{ color: '#60A5FA', fontSize: '12px', marginBottom: '8px' }}>{error}</div>}

      {result && (
        <div style={{
          padding: '14px', borderRadius: '10px',
          background: `${resultColor}12`,
          border: `1.5px solid ${resultColor}44`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <span style={{ fontSize: '28px' }}>
              {result.usable === true ? '✅' : result.usable === false ? '🚫' : '❓'}
            </span>
            <div>
              <div style={{ color: resultColor, fontSize: '18px', fontWeight: '800' }}>
                {result.usable === true ? 'SAFE TO USE' : result.usable === false ? 'DISCARD' : 'CANNOT READ'}
                {result.vvm_stage ? ` — Stage ${result.vvm_stage}` : ''}
              </div>
              <div style={{ color: '#9999BB', fontSize: '11px' }}>
                Inner square: {result.inner_square} · AI confidence: {result.confidence} · {result.inference_seconds}s
              </div>
            </div>
          </div>
          <div style={{
            padding: '10px 12px', borderRadius: '8px',
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
            marginBottom: '8px',
          }}>
            <div style={{ color: resultColor, fontSize: '13px', fontWeight: '700', marginBottom: '4px' }}>
              {result.action}
            </div>
          </div>
          {result.reasoning && (
            <div style={{ color: '#9999BB', fontSize: '12px', lineHeight: 1.5, fontStyle: 'italic', marginBottom: '6px' }}>
              {result.reasoning}
            </div>
          )}
          {result.cold_chain_note && (
            <div style={{ color: '#555577', fontSize: '11px', lineHeight: 1.5 }}>
              ❄️ {result.cold_chain_note}
            </div>
          )}
        </div>
      )}

      {!result && !loading && (
        <div style={{ color: '#444466', fontSize: '12px', fontStyle: 'italic' }}>
          Photo the VVM circle on a vaccine vial. Gemma 4 reads inner square vs outer circle darkness to check cold chain integrity.
        </div>
      )}
    </div>
  )
}

// ─── Pregnancy Tracker Component ─────────────────────────────────────────────
function PregnancyTracker({ language }) {
  const [lmpDate, setLmpDate]   = useState('')
  const [age, setAge]           = useState('')
  const [gravida, setGravida]   = useState(1)
  const [para, setPara]         = useState(0)
  const [result, setResult]     = useState(null)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState(null)
  const [expanded, setExpanded] = useState(true)

  const handleTrack = async () => {
    if (!lmpDate) { setError('Please enter the last menstrual period date.'); return }
    setLoading(true); setError(null); setResult(null)
    try {
      const res = await getPregnancyPlan(lmpDate, age, gravida, para, language)
      setResult(res)
    } catch {
      setError('Failed to generate pregnancy plan. Is Ollama running?')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    background: '#12122A', border: '1.5px solid rgba(255,255,255,0.1)', borderRadius: '10px',
    padding: '8px 12px', color: '#E8E8F8', fontSize: '13px', fontFamily: 'DM Sans, sans-serif',
    outline: 'none', boxSizing: 'border-box',
  }

  return (
    <div style={{
      background: '#0F0F28', border: '1.5px solid rgba(255,45,85,0.2)',
      borderRadius: '14px', padding: '16px', marginBottom: '16px',
    }}>
      <button
        onClick={() => setExpanded(e => !e)}
        style={{
          width: '100%', background: 'none', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 0,
        }}
      >
        <div style={{ color: '#FDA4AF', fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
          🤰 Pregnancy Tracker (JSSK)
        </div>
        {expanded ? <ChevronUp size={14} color="#9999BB" /> : <ChevronDown size={14} color="#9999BB" />}
      </button>

      {expanded && (
        <div style={{ marginTop: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
            <div>
              <div style={{ color: '#9999BB', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px', fontWeight: '600' }}>Last Period (LMP)</div>
              <input
                type="date"
                value={lmpDate}
                onChange={e => setLmpDate(e.target.value)}
                style={{ ...inputStyle, width: '100%' }}
              />
            </div>
            <div>
              <div style={{ color: '#9999BB', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px', fontWeight: '600' }}>Mother's Age</div>
              <input
                type="number"
                min="12"
                max="60"
                placeholder="e.g. 24"
                value={age}
                onChange={e => setAge(e.target.value)}
                style={{ ...inputStyle, width: '100%' }}
              />
            </div>
            <div>
              <div style={{ color: '#9999BB', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px', fontWeight: '600' }}>Gravida (total pregnancies)</div>
              <input
                type="number"
                min="1"
                max="20"
                value={gravida}
                onChange={e => setGravida(parseInt(e.target.value) || 1)}
                style={{ ...inputStyle, width: '100%' }}
              />
            </div>
            <div>
              <div style={{ color: '#9999BB', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px', fontWeight: '600' }}>Para (previous deliveries)</div>
              <input
                type="number"
                min="0"
                max="20"
                value={para}
                onChange={e => setPara(parseInt(e.target.value) || 0)}
                style={{ ...inputStyle, width: '100%' }}
              />
            </div>
          </div>

          {error && <div style={{ color: '#FDA4AF', fontSize: '12px', marginBottom: '10px' }}>{error}</div>}

          <button onClick={handleTrack} disabled={loading} style={{
            width: '100%', padding: '12px', borderRadius: '10px', border: 'none',
            background: loading ? 'rgba(255,45,85,0.2)' : 'linear-gradient(135deg, #CC0044, #FF2D55)',
            color: loading ? '#FDA4AF' : '#FFF',
            fontWeight: '700', fontSize: '13px', cursor: loading ? 'default' : 'pointer',
            fontFamily: 'DM Sans, sans-serif', marginBottom: '12px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          }}>
            {loading ? (
              <><div style={{ width: '14px', height: '14px', borderRadius: '50%', border: '2px solid #FF2D55', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />Calculating...</>
            ) : '🤰 Generate ANC Plan'}
          </button>

          {result && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Gestational summary */}
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {result.weeks_pregnant !== null && result.weeks_pregnant !== undefined && (
                  <span style={{ padding: '6px 12px', borderRadius: '100px', background: 'rgba(255,45,85,0.12)', border: '1px solid rgba(255,45,85,0.3)', color: '#FDA4AF', fontSize: '12px', fontWeight: '700' }}>
                    {result.weeks_pregnant} weeks pregnant
                  </span>
                )}
                {result.trimester && (
                  <span style={{ padding: '6px 12px', borderRadius: '100px', background: 'rgba(255,149,0,0.1)', border: '1px solid rgba(255,149,0,0.25)', color: '#FF9500', fontSize: '12px', fontWeight: '600' }}>
                    {result.trimester}
                  </span>
                )}
                {result.edd && (
                  <span style={{ padding: '6px 12px', borderRadius: '100px', background: 'rgba(52,199,89,0.1)', border: '1px solid rgba(52,199,89,0.25)', color: '#34C759', fontSize: '12px', fontWeight: '600' }}>
                    EDD: {result.edd}
                  </span>
                )}
              </div>

              {/* IFA schedule */}
              {result.ifa_schedule && (
                <div style={{ padding: '12px', borderRadius: '10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ color: '#FF9500', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>💊 IFA Tablets</div>
                  <div style={{ color: '#E8E8F8', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>{result.ifa_schedule.dose} — {result.ifa_schedule.frequency}</div>
                  <div style={{ color: '#9999BB', fontSize: '12px', lineHeight: 1.5 }}>{result.ifa_schedule.tip}</div>
                </div>
              )}

              {/* ANC visits overdue */}
              {result.anc_overdue?.length > 0 && (
                <div style={{ padding: '12px', borderRadius: '10px', background: 'rgba(255,149,0,0.06)', border: '1px solid rgba(255,149,0,0.2)' }}>
                  <div style={{ color: '#FF9500', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>⚠ ANC Visits — Recent</div>
                  {result.anc_overdue.map((v, i) => (
                    <div key={i} style={{ marginBottom: '8px' }}>
                      <div style={{ color: '#E8C070', fontSize: '13px', fontWeight: '600' }}>{v.visit} — {v.timing}</div>
                      {v.key_tasks?.slice(0, 3).map((t, j) => (
                        <div key={j} style={{ color: '#9999BB', fontSize: '12px', lineHeight: 1.6 }}>• {t}</div>
                      ))}
                    </div>
                  ))}
                </div>
              )}

              {/* ANC visits upcoming */}
              {result.anc_upcoming?.length > 0 && (
                <div style={{ padding: '12px', borderRadius: '10px', background: 'rgba(52,199,89,0.06)', border: '1px solid rgba(52,199,89,0.2)' }}>
                  <div style={{ color: '#34C759', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>✓ Next ANC Visits</div>
                  {result.anc_upcoming.map((v, i) => (
                    <div key={i} style={{ marginBottom: '8px' }}>
                      <div style={{ color: '#6EE7B7', fontSize: '13px', fontWeight: '600' }}>{v.visit} — {v.timing}</div>
                      {v.key_tasks?.slice(0, 2).map((t, j) => (
                        <div key={j} style={{ color: '#9999BB', fontSize: '12px', lineHeight: 1.6 }}>• {t}</div>
                      ))}
                    </div>
                  ))}
                </div>
              )}

              {/* Warning signs */}
              {result.warning_signs?.length > 0 && (
                <div style={{ padding: '12px', borderRadius: '10px', background: 'rgba(255,45,85,0.06)', border: '1px solid rgba(255,45,85,0.2)' }}>
                  <div style={{ color: '#FF2D55', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>🚨 Warning Signs</div>
                  {result.warning_signs.slice(0, 5).map((s, i) => (
                    <div key={i} style={{ color: '#FCA5A5', fontSize: '12px', lineHeight: 1.6 }}>• {s}</div>
                  ))}
                </div>
              )}

              {/* JSSK entitlements */}
              {result.jssk_entitlements?.length > 0 && (
                <div style={{ padding: '12px', borderRadius: '10px', background: 'rgba(0,122,255,0.06)', border: '1px solid rgba(0,122,255,0.2)' }}>
                  <div style={{ color: '#60A5FA', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>🏥 JSSK Free Entitlements</div>
                  {result.jssk_entitlements.slice(0, 5).map((e, i) => (
                    <div key={i} style={{ color: '#93C5FD', fontSize: '12px', lineHeight: 1.6 }}>✓ {e}</div>
                  ))}
                  <div style={{ color: '#60A5FA', fontSize: '12px', marginTop: '8px', fontWeight: '600' }}>
                    📱 Call 102 for free ambulance to PHC/Hospital
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── RDT Strip Reader Component ───────────────────────────────────────────────
function RDTReader({ language }) {
  const [testType, setTestType]     = useState('malaria')
  const [image, setImage]           = useState(null)
  const [imagePreview, setPreview]  = useState(null)
  const [result, setResult]         = useState(null)
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState(null)
  const fileRef                     = useRef()

  const TEST_TYPES = [
    { id: 'malaria',    label: '🦟 Malaria RDT',    color: '#FF2D55' },
    { id: 'pregnancy',  label: '🤰 Pregnancy Test',  color: '#FF9500' },
    { id: 'dengue',     label: '🌡️ Dengue NS1',     color: '#FF6B00' },
    { id: 'covid',      label: '😷 COVID-19',        color: '#007AFF' },
  ]

  const handleImage = (file) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => {
      setImage(e.target.result.split(',')[1])
      setPreview(e.target.result)
      setResult(null)
    }
    reader.readAsDataURL(file)
  }

  const handleRead = async () => {
    if (!image) { setError('Please take a photo of the RDT strip first.'); return }
    setLoading(true); setError(null); setResult(null)
    try {
      const res = await readRDTStrip(image, testType, language)
      setResult(res)
    } catch {
      setError('Gemma 4 vision unavailable. Is Ollama running?')
    } finally {
      setLoading(false)
    }
  }

  const resultColor = {
    positive: '#FF2D55',
    negative: '#34C759',
    invalid:  '#FF9500',
    uncertain: '#8E8E93',
  }

  const inputStyle = {
    display: 'none',
  }

  return (
    <div style={{
      background: '#0F0F28',
      border: '1.5px solid rgba(255,45,85,0.25)',
      borderRadius: '14px',
      padding: '16px',
      marginBottom: '16px',
    }}>
      <div style={{ color: '#FF6B88', fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '14px' }}>
        🔬 Gemma 4 RDT Strip Reader
      </div>

      {/* Test type selector */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '14px' }}>
        {TEST_TYPES.map(t => (
          <button key={t.id} onClick={() => { setTestType(t.id); setResult(null) }} style={{
            padding: '6px 12px', borderRadius: '100px', cursor: 'pointer',
            border: `1.5px solid ${testType === t.id ? t.color : 'rgba(255,255,255,0.1)'}`,
            background: testType === t.id ? `${t.color}22` : 'rgba(255,255,255,0.03)',
            color: testType === t.id ? t.color : '#9999BB',
            fontSize: '12px', fontWeight: '700', fontFamily: 'DM Sans, sans-serif',
          }}>{t.label}</button>
        ))}
      </div>

      {/* Photo capture */}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '12px' }}>
        <input ref={fileRef} type="file" accept="image/*" capture="environment" style={inputStyle} onChange={e => handleImage(e.target.files[0])} />
        {imagePreview ? (
          <div style={{ position: 'relative' }}>
            <img src={imagePreview} alt="rdt" style={{ width: '80px', height: '60px', borderRadius: '8px', objectFit: 'cover', border: '2px solid rgba(255,45,85,0.5)' }} />
            <button onClick={() => { setImage(null); setPreview(null); setResult(null) }}
              style={{ position: 'absolute', top: '-6px', right: '-6px', width: '18px', height: '18px', borderRadius: '50%', background: '#FF2D55', border: 'none', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X size={10} />
            </button>
          </div>
        ) : (
          <button onClick={() => fileRef.current.click()} style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '10px 16px', borderRadius: '10px',
            border: '1.5px dashed rgba(255,45,85,0.35)',
            background: 'rgba(255,45,85,0.05)',
            color: '#FF6B88', fontSize: '13px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
          }}>
            <Camera size={16} /> Photo RDT Strip
          </button>
        )}

        <button onClick={handleRead} disabled={!image || loading} style={{
          flex: 1, padding: '10px 14px', borderRadius: '10px', border: 'none',
          background: !image || loading ? 'rgba(255,45,85,0.2)' : 'linear-gradient(135deg, #CC0033, #FF2D55)',
          color: !image || loading ? '#FF6B88' : '#FFF',
          fontWeight: '700', fontSize: '13px', cursor: image && !loading ? 'pointer' : 'default',
          fontFamily: 'DM Sans, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
        }}>
          {loading ? (
            <><div style={{ width: '14px', height: '14px', borderRadius: '50%', border: '2px solid #FF2D55', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />Reading...</>
          ) : '🔬 Read Strip'}
        </button>
      </div>

      {error && <div style={{ color: '#FF6B88', fontSize: '12px', marginBottom: '8px' }}>{error}</div>}

      {/* Result */}
      {result && (
        <div style={{
          padding: '14px', borderRadius: '10px',
          background: `${resultColor[result.result] || '#8E8E93'}15`,
          border: `1.5px solid ${resultColor[result.result] || '#8E8E93'}44`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <span style={{ fontSize: '28px' }}>
              {result.result === 'positive' ? '🔴' : result.result === 'negative' ? '🟢' : result.result === 'invalid' ? '🟡' : '⚪'}
            </span>
            <div>
              <div style={{ color: resultColor[result.result] || '#8E8E93', fontSize: '20px', fontWeight: '800' }}>
                {(result.result || '').toUpperCase()}
              </div>
              <div style={{ color: '#9999BB', fontSize: '11px' }}>
                AI confidence: {result.confidence} · {result.inference_seconds}s response
              </div>
            </div>
          </div>
          <div style={{ color: '#C0C0D8', fontSize: '13px', lineHeight: 1.55, marginBottom: '10px' }}>
            {result.interpretation}
          </div>
          <div style={{
            padding: '10px 12px', borderRadius: '8px',
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
          }}>
            <div style={{ color: '#9999BB', fontSize: '11px', marginBottom: '4px', textTransform: 'uppercase', fontWeight: '700' }}>ASHA Action</div>
            <div style={{ color: '#E8E8F8', fontSize: '13px', lineHeight: 1.5 }}>{result.action}</div>
          </div>
          <div style={{ color: '#555577', fontSize: '11px', marginTop: '8px' }}>
            Band read: C={result.c_band} · T={result.t_band}
          </div>
        </div>
      )}

      {!result && !loading && (
        <div style={{ color: '#555577', fontSize: '12px', fontStyle: 'italic' }}>
          Take a clear photo of the RDT strip in good lighting. Gemma 4 will identify bands and classify the result.
        </div>
      )}
    </div>
  )
}

// ─── Outbreak Detection ───────────────────────────────────────────────────────
function checkOutbreak(patients) {
  if (!patients || patients.length < 3) return null

  // Check if 3+ patients in current session have emergency/clinic with similar keywords
  const recent = patients.slice(-10)
  const keywords = ['fever', 'diarrhoea', 'diarrhea', 'vomiting', 'rash', 'cough', 'jaundice', 'malaria', 'dengue', 'cholera']

  for (const kw of keywords) {
    const matching = recent.filter(p =>
      (p.chief_complaint || '').toLowerCase().includes(kw) &&
      ['emergency', 'clinic'].includes(p.triage?.triage_level)
    )
    if (matching.length >= 3) {
      return { keyword: kw, count: matching.length }
    }
  }

  // Also flag if 3+ emergency cases in session regardless of keyword
  const emergencies = recent.filter(p => p.triage?.triage_level === 'emergency')
  if (emergencies.length >= 3) return { keyword: 'multiple emergencies', count: emergencies.length }

  return null
}

// ─── Patient log card ─────────────────────────────────────────────────────────
function PatientLogCard({ patient, index, labels }) {
  const [expanded, setExpanded] = useState(false)
  const level = patient.triage?.triage_level || 'unknown'
  const color = patient.triage?.triage_color || '#8E8E93'

  const levelEmoji = { emergency: '🚨', clinic: '🏥', otc: '💊', monitor: '👁️', unknown: '❓' }

  return (
    <div style={{
      background: '#1A1A35',
      border: `1px solid ${color}33`,
      borderLeft: `3px solid ${color}`,
      borderRadius: '10px',
      overflow: 'hidden',
      transition: 'all 0.2s ease',
    }}>
      <button
        onClick={() => setExpanded(e => !e)}
        style={{
          width: '100%',
          padding: '12px 14px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: '16px' }}>{levelEmoji[level]}</span>
          <div style={{ textAlign: 'left', minWidth: 0 }}>
            <div style={{ color: '#E8E8F8', fontSize: '13px', fontWeight: '600' }}>
              {labels.patientOf} {index + 1} · {patient.gender} {patient.age}yr
            </div>
            <div style={{ color: '#9999BB', fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {patient.chief_complaint}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <span style={{
            padding: '3px 10px', borderRadius: '100px',
            background: `${color}22`, color, fontSize: '11px', fontWeight: '700',
          }}>
            {level.toUpperCase()}
          </span>
          {expanded ? <ChevronUp size={14} color="#9999BB" /> : <ChevronDown size={14} color="#9999BB" />}
        </div>
      </button>

      {expanded && (
        <div style={{ padding: '0 14px 14px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {patient.triage?.primary_concern && (
              <div style={{ color: '#C0C0D8', fontSize: '13px', lineHeight: 1.5 }}>
                {patient.triage.primary_concern}
              </div>
            )}
            {patient.triage?.refer_to && (
              <div style={{ color: '#9999BB', fontSize: '12px' }}>
                → <strong style={{ color: '#E8E8F8' }}>{labels.referTo}:</strong> {patient.triage.refer_to}
              </div>
            )}
            {patient.triage?.from_kit?.length > 0 && (
              <div style={{ color: '#9999BB', fontSize: '12px' }}>
                <strong style={{ color: '#E8E8F8' }}>{labels.fromKit}:</strong>{' '}
                {patient.triage.from_kit.join(' · ')}
              </div>
            )}
            <div style={{ color: '#666688', fontSize: '11px' }}>{patient.time}</div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Decision card ────────────────────────────────────────────────────────────
function DecisionCard({ decision, labels, onLog, onNext, form, villageName, ashaName, pmjay }) {
  const level = decision.triage_level || 'unknown'
  const color = decision.triage_color || '#8E8E93'
  const urgency = decision.triage_urgency || '1week'
  const urgencyColor = URGENCY_COLOR[urgency] || '#007AFF'
  const isEmergency = level === 'emergency'
  const needsReferral = level === 'emergency' || level === 'clinic'

  return (
    <div style={{
      borderRadius: '16px',
      border: `2px solid ${color}`,
      background: `${color}0D`,
      overflow: 'hidden',
      animation: isEmergency ? 'emergencyFlash 0.8s ease infinite' : 'fadeIn 0.4s ease',
    }}>
      {/* Triage header */}
      <div style={{
        background: `${color}22`,
        padding: '20px 24px',
        textAlign: 'center',
        borderBottom: `1px solid ${color}33`,
      }}>
        <div style={{ fontSize: '40px', lineHeight: 1, marginBottom: '8px' }}>
          {level === 'emergency' ? '🚨' : level === 'clinic' ? '🏥' : level === 'otc' ? '💊' : '👁️'}
        </div>
        <div style={{ color, fontSize: '28px', fontWeight: '800', letterSpacing: '1px' }}>
          {level.toUpperCase()}
        </div>
        <div style={{
          display: 'inline-block',
          marginTop: '8px',
          padding: '4px 14px',
          borderRadius: '100px',
          background: `${urgencyColor}22`,
          color: urgencyColor,
          fontSize: '12px',
          fontWeight: '700',
          border: `1px solid ${urgencyColor}44`,
        }}>
          {urgency.toUpperCase().replace('3DAYS', '3 DAYS').replace('1WEEK', '1 WEEK')}
        </div>
      </div>

      <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Emergency call button */}
        {isEmergency && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <a href="tel:108" style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              background: '#FF2D55', color: '#FFF', textDecoration: 'none',
              borderRadius: '12px', padding: '14px', fontWeight: '800', fontSize: '16px',
              boxShadow: '0 4px 20px rgba(255,45,85,0.5)',
            }}>
              <AlertTriangle size={20} /> {labels.emergencyCall}
            </a>
            <a href="tel:102" style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              background: 'rgba(255,45,85,0.15)', color: '#FDA4AF', textDecoration: 'none',
              borderRadius: '12px', padding: '10px', fontWeight: '700', fontSize: '13px',
              border: '1px solid rgba(255,45,85,0.3)',
            }}>
              🚐 CALL 102 — Free Maternal Ambulance (if pregnant)
            </a>
          </div>
        )}

        {/* Vital sign flags — IMCI safety override alert */}
        {decision.vital_sign_flags?.length > 0 && (
          <div style={{
            padding: '12px 16px', borderRadius: '10px',
            background: 'rgba(255,45,85,0.12)', border: '1.5px solid rgba(255,45,85,0.4)',
          }}>
            <div style={{ color: '#FF2D55', fontSize: '11px', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: '800' }}>
              🚨 IMCI Vital Sign Red Flags
            </div>
            {decision.vital_sign_flags.map((flag, i) => (
              <div key={i} style={{ color: '#FCA5A5', fontSize: '13px', lineHeight: 1.6, display: 'flex', gap: '6px' }}>
                <span>⚡</span><span>{flag}</span>
              </div>
            ))}
          </div>
        )}

        {/* ICD-10 + confidence + inference time badges */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {decision.icd10_code && decision.icd10_code !== 'R69' && (
            <span style={{
              padding: '4px 12px', borderRadius: '100px',
              background: 'rgba(255,255,255,0.06)', color: '#9999BB',
              fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px',
            }}>
              ICD-10: {decision.icd10_code}
            </span>
          )}
          {decision.confidence && (
            <span style={{
              padding: '4px 12px', borderRadius: '100px',
              background: 'rgba(255,255,255,0.06)',
              color: decision.confidence === 'high' ? '#34C759' : decision.confidence === 'medium' ? '#FF9500' : '#FF2D55',
              fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px',
            }}>
              AI: {decision.confidence} confidence
            </span>
          )}
          {decision.inference_seconds && (
            <span style={{
              padding: '4px 12px', borderRadius: '100px',
              background: 'rgba(0,212,170,0.1)', color: '#00D4AA',
              fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px',
              display: 'flex', alignItems: 'center', gap: '4px',
            }}>
              <Zap size={10} /> {decision.inference_seconds}s · Gemma 4 offline
            </span>
          )}
        </div>

        {/* PMJAY beneficiary referral coverage banner */}
        {needsReferral && pmjay && (
          <div style={{
            padding: '10px 14px', borderRadius: '10px',
            background: 'rgba(52,199,89,0.1)', border: '1px solid rgba(52,199,89,0.3)',
            display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            <span style={{ fontSize: '18px' }}>🏥</span>
            <div>
              <div style={{ color: '#34C759', fontSize: '12px', fontWeight: '700' }}>PMJAY / Ayushman Bharat covers this referral</div>
              <div style={{ color: '#9999BB', fontSize: '11px' }}>Patient should carry PMJAY card to hospital. Rs. 5 lakh annual coverage.</div>
            </div>
          </div>
        )}

        {/* Primary concern */}
        {decision.primary_concern && (
          <div style={{
            padding: '12px 16px', borderRadius: '10px',
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
          }}>
            <div style={{ color: '#9999BB', fontSize: '11px', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Assessment</div>
            <div style={{ color: '#E8E8F8', fontSize: '14px', lineHeight: 1.55 }}>{decision.primary_concern}</div>
          </div>
        )}

        {/* From kit */}
        {decision.from_kit?.length > 0 && (
          <div>
            <div style={{ color: '#9999BB', fontSize: '11px', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              💊 {labels.fromKit}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {decision.from_kit.map((med, i) => (
                <span key={i} style={{
                  padding: '6px 12px', borderRadius: '8px',
                  background: 'rgba(52,199,89,0.12)', border: '1px solid rgba(52,199,89,0.25)',
                  color: '#34C759', fontSize: '13px', fontWeight: '500',
                }}>
                  {med}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Refer to */}
        {decision.refer_to && (
          <div style={{
            padding: '12px 16px', borderRadius: '10px',
            background: `${color}11`, border: `1px solid ${color}33`,
          }}>
            <div style={{ color: '#9999BB', fontSize: '11px', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              🏥 {labels.referTo}
            </div>
            <div style={{ color, fontSize: '16px', fontWeight: '700' }}>{decision.refer_to}</div>
          </div>
        )}

        {/* Tell the family */}
        {decision.tell_family?.length > 0 && (
          <div>
            <div style={{ color: '#9999BB', fontSize: '11px', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              🗣️ {labels.tellFamily}
            </div>
            {decision.tell_family.map((inst, i) => (
              <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'flex-start' }}>
                <CheckCircle size={14} color="#00D4AA" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span style={{ color: '#C0C0D8', fontSize: '13px', lineHeight: 1.5 }}>{inst}</span>
              </div>
            ))}
          </div>
        )}

        {/* Red flags */}
        {decision.red_flags_to_watch?.length > 0 && (
          <div style={{
            padding: '12px 16px', borderRadius: '10px',
            background: 'rgba(255,149,0,0.08)', border: '1px solid rgba(255,149,0,0.25)',
          }}>
            <div style={{ color: '#FF9500', fontSize: '11px', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: '700' }}>
              ⚠️ {labels.redFlags}
            </div>
            {decision.red_flags_to_watch.map((flag, i) => (
              <div key={i} style={{ color: '#E8C070', fontSize: '13px', lineHeight: 1.6 }}>• {flag}</div>
            ))}
          </div>
        )}

        {/* Follow-up + confidence row */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <span style={{
            padding: '6px 12px', borderRadius: '8px',
            background: 'rgba(255,255,255,0.06)', color: '#9999BB', fontSize: '12px',
          }}>
            {labels.followUp}: {decision.follow_up_days} {labels.followUpDays}
          </span>
          {decision.confidence && (
            <span style={{
              padding: '6px 12px', borderRadius: '8px',
              background: 'rgba(255,255,255,0.06)', color: '#9999BB', fontSize: '12px',
            }}>
              {labels.confidence}: {decision.confidence.toUpperCase()}
            </span>
          )}
        </div>

        {/* Reasoning */}
        {decision.reasoning && (
          <div style={{ color: '#555577', fontSize: '12px', fontStyle: 'italic', lineHeight: 1.5 }}>
            🤖 {labels.reasoning}: {decision.reasoning}
          </div>
        )}

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '10px', paddingTop: '4px', flexWrap: 'wrap' }}>
          <button onClick={onLog} style={{
            flex: 1, minWidth: '120px', padding: '14px', borderRadius: '12px', border: 'none',
            background: 'linear-gradient(135deg, #00B890, #00D4AA)',
            color: '#0A0A1A', fontWeight: '700', fontSize: '14px', cursor: 'pointer',
            fontFamily: 'DM Sans, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
          }}>
            <CheckCircle size={16} /> {labels.btnLog}
          </button>
          {needsReferral && (
            <button onClick={() => printReferral({ form, decision, villageName, ashaName })} style={{
              padding: '14px 16px', borderRadius: '12px',
              border: '1.5px solid rgba(255,149,0,0.4)',
              background: 'rgba(255,149,0,0.1)', color: '#FF9500', fontWeight: '600', fontSize: '13px', cursor: 'pointer',
              fontFamily: 'DM Sans, sans-serif', display: 'flex', alignItems: 'center', gap: '6px',
            }}>
              <Printer size={15} /> PHC Referral
            </button>
          )}
          <button onClick={onNext} style={{
            padding: '14px 18px', borderRadius: '12px',
            border: '1.5px solid rgba(255,255,255,0.15)',
            background: 'transparent', color: '#9999BB', fontWeight: '600', fontSize: '14px', cursor: 'pointer',
            fontFamily: 'DM Sans, sans-serif', display: 'flex', alignItems: 'center', gap: '6px',
          }}>
            <Plus size={16} /> {labels.btnNext}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main ASHA Mode component ─────────────────────────────────────────────────
export default function ASHAMode({ language, onEmergency }) {
  const labels = getASHALabels(language)

  const emptyForm = {
    age: '',
    age_group: '',
    gender: '',
    chief_complaint: '',
    duration_days: '',
    has_fever: false,
    temperature: '',
    breathing: 'None',
    consciousness: 'Alert',
    pregnancy: 'N/A',
    weight_kg: '',
    pulse: '',
    respiratory_rate: '',
    spo2: '',
    muac_mm: '',
    image_base64: null,
    image_preview: null,
  }

  const [villageName, setVillageName] = useState('')
  const [ashaName, setAshaName]       = useState('')
  const [session, setSession] = useState(() => ASHASession.getSession())
  const [form, setForm] = useState(emptyForm)
  const [decision, setDecision] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showLog, setShowLog] = useState(false)
  const [activeTab, setActiveTab] = useState('triage')
  const [pmjay, setPmjay] = useState(false)
  const [immunizationData, setImmunizationData] = useState(null)
  const imageInputRef = useRef()

  const patientCount = session?.patients?.length || 0

  // Start or resume session
  useEffect(() => {
    if (!session && villageName.trim()) {
      setSession(ASHASession.startSession(villageName.trim()))
    }
  }, [villageName])

  const setField = (key, val) => setForm(prev => ({ ...prev, [key]: val }))

  const handleImage = (file) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => {
      const base64 = e.target.result.split(',')[1]
      setField('image_base64', base64)
      setField('image_preview', e.target.result)
    }
    reader.readAsDataURL(file)
  }

  const handleGetDecision = async () => {
    if (!form.age || !form.gender || !form.chief_complaint) {
      setError('Please fill in age, gender, and chief complaint.')
      return
    }
    setError(null)
    setIsLoading(true)
    setDecision(null)
    setImmunizationData(null)

    const t0 = performance.now()
    try {
      const payload = {
        language,
        age: form.age,
        age_group: form.age_group || labels.ageGroups[2],
        gender: form.gender,
        chief_complaint: form.chief_complaint,
        duration_days: form.duration_days || '1',
        has_fever: form.has_fever,
        temperature: form.temperature || null,
        breathing: form.breathing,
        consciousness: form.consciousness,
        pregnancy: form.pregnancy,
        weight_kg: form.weight_kg ? parseFloat(form.weight_kg) : null,
        pulse: form.pulse ? parseInt(form.pulse) : null,
        respiratory_rate: form.respiratory_rate ? parseInt(form.respiratory_rate) : null,
        spo2: form.spo2 ? parseInt(form.spo2) : null,
        muac_mm: form.muac_mm ? parseInt(form.muac_mm) : null,
        image_base64: form.image_base64 || null,
      }
      const result = await sendASHATriage(payload)
      const elapsed = ((performance.now() - t0) / 1000).toFixed(1)
      result.inference_seconds = elapsed

      setDecision(result)
      if (result?.triage_level === 'emergency') onEmergency?.(true)

      // Fetch immunization schedule for children under 5
      const ageYrs = parseFloat(form.age)
      if (!isNaN(ageYrs) && ageYrs < 6) {
        try {
          const ageMonths = Math.round(ageYrs * 12)
          const immData = await getImmunizationSchedule(ageMonths)
          setImmunizationData(immData)
        } catch { /* non-critical */ }
      }
    } catch (e) {
      setError('Failed to get AI decision. Is Ollama running?')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogPatient = () => {
    if (!decision) return
    const updated = ASHASession.addPatient(
      {
        age: form.age,
        age_group: form.age_group,
        gender: form.gender,
        chief_complaint: form.chief_complaint,
        duration_days: form.duration_days,
      },
      decision,
    )
    if (updated) setSession({ ...updated })
    handleNextPatient()
    setShowLog(true)
  }

  const handleNextPatient = () => {
    setForm(emptyForm)
    setDecision(null)
    setError(null)
    setPmjay(false)
    setImmunizationData(null)
    onEmergency?.(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleExport = () => {
    const text = ASHASession.exportReport(session)
    if (navigator.share) {
      navigator.share({ title: 'VaidyaAI Field Visit Report', text }).catch(() => {})
    } else {
      const blob = new Blob([text], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `vaidyaai-report-${session?.villageName || 'village'}-${new Date().toLocaleDateString('en-IN').replace(/\//g, '-')}.txt`
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  const handleWhatsApp = () => {
    const text = ASHASession.exportReport(session)
    const encoded = encodeURIComponent(text.slice(0, 1500))
    window.open(`https://wa.me/?text=${encoded}`, '_blank')
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
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0A0A1A',
      overflowY: 'auto',
    }}>
      {/* Session header */}
      <div style={{
        background: '#0D0D22',
        borderBottom: '1px solid rgba(255,149,0,0.2)',
        padding: '14px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        flexWrap: 'wrap',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            background: 'rgba(255,149,0,0.15)',
            border: '1px solid rgba(255,149,0,0.3)',
            borderRadius: '10px',
            padding: '6px 12px',
            color: '#FF9500',
            fontSize: '13px',
            fontWeight: '700',
          }}>
            🏥 {labels.title}
          </div>
          <div style={{ color: '#9999BB', fontSize: '13px' }}>
            {labels.patientOf} <strong style={{ color: '#FF9500' }}>{patientCount + 1}</strong> {labels.ofToday}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <input
            value={villageName}
            onChange={e => setVillageName(e.target.value)}
            onBlur={() => {
              if (villageName.trim() && !session) {
                setSession(ASHASession.startSession(villageName.trim()))
              } else if (session) {
                session.villageName = villageName.trim()
                localStorage.setItem('vaidyaai_asha_session', JSON.stringify(session))
              }
            }}
            placeholder={labels.villagePlaceholder}
            style={{
              ...inputStyle,
              width: '140px',
              padding: '8px 12px',
              fontSize: '13px',
            }}
          />
          <input
            value={ashaName}
            onChange={e => setAshaName(e.target.value)}
            placeholder="ASHA name"
            style={{
              ...inputStyle,
              width: '130px',
              padding: '8px 12px',
              fontSize: '13px',
            }}
          />
          {session?.patients?.length > 0 && (
            <>
              <button
                onClick={handleExport}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '8px 14px', borderRadius: '8px',
                  background: 'rgba(255,149,0,0.15)', border: '1px solid rgba(255,149,0,0.3)',
                  color: '#FF9500', fontSize: '12px', fontWeight: '700', cursor: 'pointer',
                  fontFamily: 'DM Sans, sans-serif',
                }}
              >
                <Share2 size={13} /> {labels.exportReport}
              </button>
              <button
                onClick={handleWhatsApp}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '8px 14px', borderRadius: '8px',
                  background: 'rgba(37,211,102,0.15)', border: '1px solid rgba(37,211,102,0.35)',
                  color: '#25D366', fontSize: '12px', fontWeight: '700', cursor: 'pointer',
                  fontFamily: 'DM Sans, sans-serif',
                }}
              >
                📲 WhatsApp PHC
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Tab bar ── */}
      <div style={{
        display: 'flex', gap: '6px', padding: '10px 16px',
        background: '#0D0D22',
        borderBottom: '1px solid rgba(255,149,0,0.15)',
        overflowX: 'auto', scrollbarWidth: 'none',
      }}>
        {[
          { id: 'triage',    icon: '🧑', label: 'Triage'    },
          { id: 'rdt',       icon: '🔬', label: 'RDT Test'  },
          { id: 'snakebite', icon: '🐍', label: 'Snakebite' },
          { id: 'vvm',       icon: '💉', label: 'Vaccine'   },
          { id: 'pregnancy', icon: '🤰', label: 'Pregnancy' },
          { id: 'bulletin',  icon: '📻', label: 'Bulletin'  },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '8px 16px', borderRadius: '100px', flexShrink: 0,
              border: `1.5px solid ${activeTab === tab.id ? '#FF9500' : 'rgba(255,255,255,0.1)'}`,
              background: activeTab === tab.id ? 'rgba(255,149,0,0.18)' : 'transparent',
              color: activeTab === tab.id ? '#FF9500' : '#666688',
              fontSize: '13px', fontWeight: '700', cursor: 'pointer',
              whiteSpace: 'nowrap', transition: 'all 0.18s ease',
              fontFamily: 'DM Sans, sans-serif',
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* ── Triage Tab ── */}
      {activeTab === 'triage' && (
      <div style={{ padding: '20px', maxWidth: '640px', margin: '0 auto' }}>

        {/* Patient details section */}
        <div style={{
          background: '#12122A',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: '16px',
          padding: '20px',
          marginBottom: '16px',
        }}>
          <div style={{ color: '#FF9500', fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '20px' }}>
            {labels.sectionPatient}
          </div>

          {/* Age + Age Group */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '18px' }}>
            <div style={{ flex: '0 0 90px' }}>
              <div style={{ color: '#9999BB', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px', fontWeight: '600' }}>
                {labels.labelAge}
              </div>
              <input
                type="number"
                min="0"
                max="120"
                value={form.age}
                onChange={e => {
                  const val = e.target.value
                  setField('age', val)
                  const n = parseInt(val)
                  if (n < 1) setField('age_group', labels.ageGroups[0])
                  else if (n <= 12) setField('age_group', labels.ageGroups[1])
                  else if (n <= 59) setField('age_group', labels.ageGroups[2])
                  else setField('age_group', labels.ageGroups[3])
                }}
                style={{ ...inputStyle, width: '100%' }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <Field label={labels.labelAgeGroup}>
                <PillGroup
                  options={labels.ageGroups}
                  value={form.age_group}
                  onChange={val => setField('age_group', val)}
                  color="#FF9500"
                />
              </Field>
            </div>
          </div>

          {/* Gender */}
          <Field label={labels.labelGender}>
            <PillGroup
              options={labels.genders}
              value={form.gender}
              onChange={val => {
                setField('gender', val)
                if (val !== labels.genders[1]) setField('pregnancy', 'N/A')
              }}
              color="#FF9500"
            />
          </Field>

          {/* Chief complaint */}
          <Field label={labels.labelComplaint}>
            <textarea
              value={form.chief_complaint}
              onChange={e => setField('chief_complaint', e.target.value)}
              placeholder={labels.complaintPlaceholder}
              rows={3}
              style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.55 }}
            />
          </Field>

          {/* Duration */}
          <Field label={labels.labelDuration}>
            <PillGroup
              options={labels.durations}
              value={form.duration_days}
              onChange={val => setField('duration_days', val)}
              color="#FF9500"
            />
          </Field>
        </div>

        {/* Clinical signs section */}
        <div style={{
          background: '#12122A',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: '16px',
          padding: '20px',
          marginBottom: '16px',
        }}>
          <div style={{ color: '#FF9500', fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '20px' }}>
            Clinical Signs
          </div>

          {/* Fever toggle */}
          <Field label={labels.labelFever}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={() => setField('has_fever', !form.has_fever)}
                style={{
                  padding: '8px 20px', borderRadius: '100px',
                  border: `1.5px solid ${form.has_fever ? '#FF2D55' : 'rgba(255,255,255,0.12)'}`,
                  background: form.has_fever ? 'rgba(255,45,85,0.15)' : 'rgba(255,255,255,0.04)',
                  color: form.has_fever ? '#FF2D55' : '#9999BB',
                  fontSize: '13px', fontWeight: '600', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
                }}
              >
                {form.has_fever ? '🌡️ Yes' : 'No'}
              </button>
              {form.has_fever && (
                <input
                  type="number"
                  placeholder="e.g. 102"
                  value={form.temperature}
                  onChange={e => setField('temperature', e.target.value)}
                  style={{ ...inputStyle, width: '120px' }}
                />
              )}
              {form.has_fever && (
                <span style={{ color: '#9999BB', fontSize: '12px' }}>°F</span>
              )}
            </div>
          </Field>

          {/* Breathing */}
          <Field label={labels.labelBreathing}>
            <PillGroup
              options={labels.breathings}
              value={form.breathing}
              onChange={val => setField('breathing', val)}
              color={form.breathing === labels.breathings[2] ? '#FF2D55' : '#FF9500'}
            />
          </Field>

          {/* Consciousness */}
          <Field label={labels.labelConsciousness}>
            <PillGroup
              options={labels.consciousnesses}
              value={form.consciousness}
              onChange={val => setField('consciousness', val)}
              color={form.consciousness === labels.consciousnesses[2] ? '#FF2D55' : '#FF9500'}
            />
          </Field>

          {/* Vitals row — weight, pulse, RR, SpO₂ */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '18px' }}>
            <div>
              <div style={{ color: '#9999BB', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px', fontWeight: '600' }}>
                ⚖️ Weight (kg)
              </div>
              <input
                type="number"
                min="1"
                max="150"
                placeholder="e.g. 12"
                value={form.weight_kg}
                onChange={e => setField('weight_kg', e.target.value)}
                style={{ ...inputStyle, width: '100%' }}
              />
            </div>
            <div>
              <div style={{ color: '#9999BB', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px', fontWeight: '600' }}>
                ❤️ Pulse (bpm)
              </div>
              <input
                type="number"
                min="20"
                max="300"
                placeholder="e.g. 90"
                value={form.pulse}
                onChange={e => setField('pulse', e.target.value)}
                style={{ ...inputStyle, width: '100%' }}
              />
            </div>
            <div>
              <div style={{ color: '#9999BB', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px', fontWeight: '600' }}>
                🫁 Resp. Rate (/min)
              </div>
              <input
                type="number"
                min="5"
                max="80"
                placeholder="e.g. 22"
                value={form.respiratory_rate}
                onChange={e => setField('respiratory_rate', e.target.value)}
                style={{ ...inputStyle, width: '100%' }}
              />
            </div>
            <div>
              <div style={{
                color: form.spo2 && parseInt(form.spo2) < 94 ? '#FF2D55' : '#9999BB',
                fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px', fontWeight: '600',
              }}>
                🩺 SpO₂ (%)
              </div>
              <input
                type="number"
                min="50"
                max="100"
                placeholder="e.g. 98"
                value={form.spo2}
                onChange={e => setField('spo2', e.target.value)}
                style={{
                  ...inputStyle, width: '100%',
                  borderColor: form.spo2 && parseInt(form.spo2) < 94 ? 'rgba(255,45,85,0.6)' : 'rgba(255,255,255,0.1)',
                }}
              />
              {form.spo2 && parseInt(form.spo2) < 94 && (
                <div style={{ color: '#FF6B88', fontSize: '11px', marginTop: '4px', fontWeight: '600' }}>
                  ⚠ Low SpO₂ — IMCI red flag
                </div>
              )}
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <div style={{
                color: form.muac_mm && parseInt(form.muac_mm) < 115 ? '#FF2D55' : '#9999BB',
                fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px', fontWeight: '600',
              }}>
                📏 MUAC (mm) — Mid-Upper Arm Circumference
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                <input
                  type="number"
                  min="80"
                  max="200"
                  placeholder="e.g. 125"
                  value={form.muac_mm}
                  onChange={e => setField('muac_mm', e.target.value)}
                  style={{
                    ...inputStyle, width: '120px',
                    borderColor: form.muac_mm && parseInt(form.muac_mm) < 115 ? 'rgba(255,45,85,0.6)' : 'rgba(255,255,255,0.1)',
                  }}
                />
                {form.muac_mm && (
                  <span style={{
                    fontSize: '12px', fontWeight: '700',
                    color: parseInt(form.muac_mm) < 115 ? '#FF2D55' : parseInt(form.muac_mm) < 125 ? '#FF9500' : '#34C759',
                  }}>
                    {parseInt(form.muac_mm) < 115
                      ? '🚨 SAM — Severe Acute Malnutrition (< 115mm)'
                      : parseInt(form.muac_mm) < 125
                      ? '⚠ MAM — Moderate Malnutrition (115–125mm)'
                      : '✓ Normal (≥ 125mm)'}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Pregnancy — only for female adults */}
          {(form.gender === labels.genders[1]) && (form.age_group === labels.ageGroups[2] || form.age_group === labels.ageGroups[3]) && (
            <Field label={labels.labelPregnancy}>
              <PillGroup
                options={labels.pregnancies}
                value={form.pregnancy}
                onChange={val => setField('pregnancy', val)}
                color="#FF9500"
              />
            </Field>
          )}

          {/* Photo */}
          <Field label={labels.labelPhoto}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                style={{ display: 'none' }}
                onChange={e => handleImage(e.target.files[0])}
              />
              {form.image_preview ? (
                <div style={{ position: 'relative' }}>
                  <img
                    src={form.image_preview}
                    alt="symptom"
                    style={{ width: '64px', height: '64px', borderRadius: '10px', objectFit: 'cover', border: '2px solid #FF9500' }}
                  />
                  <button
                    onClick={() => { setField('image_base64', null); setField('image_preview', null) }}
                    style={{
                      position: 'absolute', top: '-6px', right: '-6px',
                      width: '20px', height: '20px', borderRadius: '50%',
                      background: '#FF2D55', border: 'none', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
                    }}
                  >
                    <X size={11} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => imageInputRef.current.click()}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '10px 18px', borderRadius: '10px',
                    border: '1.5px dashed rgba(255,255,255,0.15)',
                    background: 'rgba(255,255,255,0.03)',
                    color: '#666688', fontSize: '13px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
                  }}
                >
                  <Camera size={16} /> {labels.labelPhoto}
                </button>
              )}
            </div>
          </Field>

          {/* PMJAY / Ayushman Bharat beneficiary */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '10px 14px', borderRadius: '10px',
            background: pmjay ? 'rgba(52,199,89,0.08)' : 'rgba(255,255,255,0.03)',
            border: `1px solid ${pmjay ? 'rgba(52,199,89,0.3)' : 'rgba(255,255,255,0.08)'}`,
            cursor: 'pointer',
          }} onClick={() => setPmjay(p => !p)}>
            <div style={{
              width: '18px', height: '18px', borderRadius: '4px', flexShrink: 0,
              border: `2px solid ${pmjay ? '#34C759' : 'rgba(255,255,255,0.2)'}`,
              background: pmjay ? '#34C759' : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {pmjay && <span style={{ color: '#000', fontSize: '12px', fontWeight: '800' }}>✓</span>}
            </div>
            <div>
              <div style={{ color: pmjay ? '#34C759' : '#9999BB', fontSize: '13px', fontWeight: '600' }}>
                PMJAY / Ayushman Bharat beneficiary
              </div>
              <div style={{ color: '#555577', fontSize: '11px' }}>
                Rs. 5 lakh annual hospital coverage — show card at referral
              </div>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: 'rgba(255,45,85,0.1)', border: '1px solid rgba(255,45,85,0.3)',
            borderRadius: '10px', padding: '12px 16px', marginBottom: '16px',
            display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            <AlertTriangle size={16} color="#FF2D55" />
            <span style={{ color: '#FF6B88', fontSize: '13px' }}>{error}</span>
          </div>
        )}

        {/* Get Decision button */}
        {!decision && (
          <button
            onClick={handleGetDecision}
            disabled={isLoading}
            style={{
              width: '100%', padding: '18px',
              borderRadius: '14px', border: 'none',
              background: isLoading ? 'rgba(255,149,0,0.3)' : 'linear-gradient(135deg, #E07000, #FF9500)',
              color: isLoading ? '#FF9500' : '#0A0A1A',
              fontSize: '16px', fontWeight: '800', cursor: isLoading ? 'wait' : 'pointer',
              fontFamily: 'DM Sans, sans-serif', marginBottom: '20px',
              boxShadow: isLoading ? 'none' : '0 6px 24px rgba(255,149,0,0.35)',
              transition: 'all 0.2s ease',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
            }}
          >
            {isLoading ? (
              <>
                <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: '2px solid #FF9500', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
                Gemma 4 is analyzing...
              </>
            ) : (
              `🧠 ${labels.btnDecision}`
            )}
          </button>
        )}

        {/* Decision card */}
        {decision && (
          <div style={{ marginBottom: '20px', animation: 'fadeIn 0.4s ease' }}>
            <DecisionCard
              decision={decision}
              labels={labels}
              onLog={handleLogPatient}
              onNext={handleNextPatient}
              form={form}
              villageName={villageName}
              ashaName={ashaName}
              pmjay={pmjay}
            />

            {/* Immunization schedule — children under 6 */}
            {immunizationData && (
              <div style={{
                background: '#0F0F28', border: '1px solid rgba(0,122,255,0.25)',
                borderRadius: '12px', padding: '14px 16px', marginTop: '12px',
              }}>
                <div style={{ color: '#007AFF', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '10px' }}>
                  💉 Universal Immunization Programme — Age {immunizationData.age_months}mo
                </div>
                {immunizationData.overdue?.length > 0 && (
                  <div style={{ marginBottom: '8px' }}>
                    <div style={{ color: '#FF9500', fontSize: '11px', fontWeight: '700', marginBottom: '6px' }}>⚠ Recent/Overdue Vaccines</div>
                    {immunizationData.overdue.map((v, i) => (
                      <div key={i} style={{ color: '#E8C070', fontSize: '12px', lineHeight: 1.6 }}>
                        • <strong>{v.vaccine}</strong> — {v.description}
                      </div>
                    ))}
                  </div>
                )}
                {immunizationData.upcoming?.length > 0 && (
                  <div>
                    <div style={{ color: '#34C759', fontSize: '11px', fontWeight: '700', marginBottom: '6px' }}>✓ Upcoming Vaccines</div>
                    {immunizationData.upcoming.map((v, i) => (
                      <div key={i} style={{ color: '#9999BB', fontSize: '12px', lineHeight: 1.6 }}>
                        • {v.vaccine} at {v.at_months}mo — {v.description}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Session analytics stats */}
        {patientCount > 0 && (() => {
          const patients = session?.patients || []
          const counts = { emergency: 0, clinic: 0, otc: 0, monitor: 0, unknown: 0 }
          patients.forEach(p => { counts[p.triage?.triage_level || 'unknown']++ })
          const statItems = [
            { level: 'emergency', color: '#FF2D55', emoji: '🚨', label: 'Emergency' },
            { level: 'clinic',    color: '#FF9500', emoji: '🏥', label: 'Clinic' },
            { level: 'otc',       color: '#34C759', emoji: '💊', label: 'OTC' },
            { level: 'monitor',   color: '#007AFF', emoji: '👁', label: 'Monitor' },
          ].filter(s => counts[s.level] > 0)
          return (
            <div style={{
              background: '#12122A', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '14px', padding: '14px 16px', marginBottom: '12px',
            }}>
              <div style={{ color: '#9999BB', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '12px', fontWeight: '700' }}>
                📊 Today's Field Visit — {patientCount} Patient{patientCount > 1 ? 's' : ''}
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {statItems.map(s => (
                  <div key={s.level} style={{
                    padding: '8px 14px', borderRadius: '10px',
                    background: `${s.color}18`, border: `1px solid ${s.color}33`,
                    display: 'flex', alignItems: 'center', gap: '6px',
                  }}>
                    <span style={{ fontSize: '16px' }}>{s.emoji}</span>
                    <span style={{ color: s.color, fontWeight: '800', fontSize: '18px' }}>{counts[s.level]}</span>
                    <span style={{ color: '#9999BB', fontSize: '11px', fontWeight: '600' }}>{s.label}</span>
                  </div>
                ))}
              </div>
              {counts.emergency > 0 && (
                <div style={{ marginTop: '10px', color: '#FF6B88', fontSize: '12px', fontWeight: '600' }}>
                  ⚡ {counts.emergency} emergency patient{counts.emergency > 1 ? 's' : ''} — ensure 108 was called
                </div>
              )}

              {/* Outbreak detection */}
              {(() => {
                const outbreak = checkOutbreak(session?.patients || [])
                if (!outbreak) return null
                const bhoMsg = encodeURIComponent(
                  `VaidyaAI OUTBREAK ALERT 🚨\nVillage: ${villageName || 'Not specified'}\nDate: ${new Date().toLocaleDateString('en-IN')}\n${outbreak.count} patients with "${outbreak.keyword}" symptoms in this visit.\nPlease investigate. — ASHA: ${ashaName || 'not specified'}`
                )
                return (
                  <div style={{
                    marginTop: '12px', padding: '12px 14px', borderRadius: '10px',
                    background: 'rgba(255,45,85,0.1)', border: '1.5px solid rgba(255,45,85,0.4)',
                  }}>
                    <div style={{ color: '#FF2D55', fontSize: '12px', fontWeight: '800', marginBottom: '6px' }}>
                      🚨 POSSIBLE OUTBREAK DETECTED
                    </div>
                    <div style={{ color: '#FCA5A5', fontSize: '12px', lineHeight: 1.5, marginBottom: '8px' }}>
                      {outbreak.count} patients with "{outbreak.keyword}" symptoms in this village visit. Consider reporting to Block Health Officer.
                    </div>
                    <a
                      href={`https://wa.me/?text=${bhoMsg}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: '6px',
                        padding: '7px 14px', borderRadius: '8px',
                        background: 'rgba(37,211,102,0.15)', border: '1px solid rgba(37,211,102,0.35)',
                        color: '#25D366', fontSize: '12px', fontWeight: '700', textDecoration: 'none',
                      }}
                    >
                      📲 Report Outbreak to BHO via WhatsApp
                    </a>
                  </div>
                )
              })()}
            </div>
          )
        })()}

        {/* Patient log */}
        {patientCount > 0 && (
          <div style={{ marginBottom: '32px' }}>
            <button
              onClick={() => setShowLog(s => !s)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '14px 16px', borderRadius: '12px',
                background: '#12122A', border: '1px solid rgba(255,255,255,0.07)',
                color: '#9999BB', fontWeight: '600', fontSize: '13px', cursor: 'pointer',
                fontFamily: 'DM Sans, sans-serif', marginBottom: showLog ? '12px' : 0,
              }}
            >
              <span>📋 {labels.patientsLogged} ({patientCount})</span>
              {showLog ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {showLog && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {(session?.patients || []).map((p, i) => (
                  <PatientLogCard key={p.id} patient={p} index={i} labels={labels} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      )}

      {/* ── RDT Test Tab ── */}
      {activeTab === 'rdt' && (
        <div style={{ padding: '20px', maxWidth: '640px', margin: '0 auto' }}>
          <RDTReader language={language} />
        </div>
      )}

      {/* ── Snakebite Tab ── */}
      {activeTab === 'snakebite' && (
        <div style={{ padding: '20px', maxWidth: '640px', margin: '0 auto' }}>
          <SnakebiteIdentifier language={language} />
        </div>
      )}

      {/* ── Vaccine / VVM Tab ── */}
      {activeTab === 'vvm' && (
        <div style={{ padding: '20px', maxWidth: '640px', margin: '0 auto' }}>
          <VVMReader language={language} />
        </div>
      )}

      {/* ── Pregnancy Tab ── */}
      {activeTab === 'pregnancy' && (
        <div style={{ padding: '20px', maxWidth: '640px', margin: '0 auto' }}>
          <PregnancyTracker language={language} />
        </div>
      )}

      {/* ── Bulletin Tab ── */}
      {activeTab === 'bulletin' && (
        <div style={{ padding: '20px', maxWidth: '640px', margin: '0 auto' }}>
          <HealthBulletin language={language} />
        </div>
      )}
    </div>
  )
}
