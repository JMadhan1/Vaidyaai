import React, { useState, useEffect, useRef } from 'react'

// ─── Animated counter ─────────────────────────────────────────────────────────
function AnimatedNumber({ target, prefix = '', suffix = '' }) {
  const [val, setVal] = useState(0)
  const ref = useRef()
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return
      obs.disconnect()
      let n = 0; const steps = 55
      const inc = target / steps
      const t = setInterval(() => {
        n += inc
        if (n >= target) { setVal(target); clearInterval(t) }
        else setVal(Math.floor(n))
      }, 22)
    }, { threshold: 0.1 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [target])
  const fmt = val >= 1e9 ? `${(val/1e9).toFixed(0)}B`
    : val >= 1e6 ? `${(val/1e6).toFixed(0)}M`
    : val >= 1e3 ? `${(val/1e3).toFixed(0)}K`
    : String(val)
  return <span ref={ref}>{prefix}{fmt}{suffix}</span>
}

// ─── Glass card ───────────────────────────────────────────────────────────────
function Glass({ children, style = {}, glow, hover = true, onClick }) {
  const [hovered, setHovered] = useState(false)
  const base = {
    position: 'relative',
    background: hovered && hover ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.04)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: `1px solid ${hovered && hover ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.09)'}`,
    borderRadius: '20px',
    transition: 'all 0.3s ease',
    transform: hovered && hover ? 'translateY(-4px)' : 'none',
    boxShadow: glow && hovered ? `0 24px 60px ${glow}30` : hovered && hover ? '0 16px 40px rgba(0,0,0,0.4)' : '0 4px 20px rgba(0,0,0,0.2)',
    cursor: onClick ? 'pointer' : 'default',
    ...style,
  }
  return (
    <div
      style={base}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
    >
      {children}
    </div>
  )
}

// ─── Feature pill ─────────────────────────────────────────────────────────────
function Pill({ icon, label, color }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: '6px',
      padding: '6px 14px', borderRadius: '100px',
      background: `${color}12`,
      border: `1px solid ${color}35`,
      color, fontSize: '12px', fontWeight: '700',
      backdropFilter: 'blur(10px)',
    }}>
      <span>{icon}</span><span>{label}</span>
    </div>
  )
}

// ─── Triage badge ─────────────────────────────────────────────────────────────
function TriageBadge({ icon, level, color, trigger, action }) {
  return (
    <Glass glow={color} style={{ padding: '18px 20px', overflow: 'hidden', position: 'relative' }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
        background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
      }} />
      <div style={{ fontSize: '28px', marginBottom: '10px' }}>{icon}</div>
      <div style={{ color, fontSize: '14px', fontWeight: '800', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '6px' }}>{level}</div>
      <div style={{ color: '#CCCCEE', fontSize: '12px', lineHeight: 1.5, marginBottom: '8px' }}>{trigger}</div>
      <div style={{ color: '#555577', fontSize: '11px', lineHeight: 1.5 }}>{action}</div>
    </Glass>
  )
}

// ─── Feature card ─────────────────────────────────────────────────────────────
function FeatureCard({ icon, title, desc, color = '#00D4AA', tag, isNew }) {
  const [hov, setHov] = useState(false)
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? `${color}09` : 'rgba(255,255,255,0.025)',
        backdropFilter: 'blur(14px)',
        border: `1px solid ${hov ? color + '45' : 'rgba(255,255,255,0.07)'}`,
        borderTop: `2px solid ${hov ? color : color + '60'}`,
        borderRadius: '18px', padding: '22px 20px',
        transition: 'all 0.25s ease',
        transform: hov ? 'translateY(-3px)' : 'none',
        boxShadow: hov ? `0 16px 40px ${color}12` : 'none',
        position: 'relative', overflow: 'hidden',
      }}
    >
      {isNew && (
        <div style={{
          position: 'absolute', top: '12px', right: '12px',
          padding: '2px 8px', borderRadius: '100px', fontSize: '9px', fontWeight: '800',
          background: 'rgba(0,212,170,0.2)', border: '1px solid rgba(0,212,170,0.4)',
          color: '#00D4AA', textTransform: 'uppercase', letterSpacing: '1px',
        }}>NEW</div>
      )}
      <div style={{ fontSize: '30px', marginBottom: '12px', lineHeight: 1 }}>{icon}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '7px', flexWrap: 'wrap' }}>
        <div style={{ color: '#F0F0FF', fontSize: '14px', fontWeight: '700' }}>{title}</div>
        {tag && (
          <span style={{
            padding: '2px 7px', borderRadius: '100px', fontSize: '9px', fontWeight: '800',
            background: `${color}20`, color, border: `1px solid ${color}40`,
            textTransform: 'uppercase', letterSpacing: '0.5px',
          }}>{tag}</span>
        )}
      </div>
      <div style={{ color: '#6666AA', fontSize: '12px', lineHeight: 1.7 }}>{desc}</div>
    </div>
  )
}

// ─── Architecture flow node ───────────────────────────────────────────────────
function FlowNode({ icon, title, sub, color }) {
  return (
    <div style={{
      flex: 1, minWidth: '110px',
      background: `${color}08`,
      backdropFilter: 'blur(12px)',
      border: `1px solid ${color}30`,
      borderRadius: '14px', padding: '16px 12px', textAlign: 'center',
    }}>
      <div style={{ fontSize: '26px', marginBottom: '8px' }}>{icon}</div>
      <div style={{ color, fontSize: '12px', fontWeight: '700', marginBottom: '4px', lineHeight: 1.3 }}>{title}</div>
      <div style={{ color: '#444466', fontSize: '10px', lineHeight: 1.5 }}>{sub}</div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function LandingPage({ onEnterApp }) {
  const [scrollY, setScrollY] = useState(0)
  const containerRef = useRef()

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const fn = () => setScrollY(el.scrollTop)
    el.addEventListener('scroll', fn, { passive: true })
    return () => el.removeEventListener('scroll', fn)
  }, [])

  return (
    <div ref={containerRef} style={{
      height: '100vh',
      overflowY: 'auto',
      overflowX: 'hidden',
      background: '#060612',
      color: '#E8E8F8',
      fontFamily: 'DM Sans, system-ui, sans-serif',
    }}>

      {/* ── Global background blobs ─────────────────────────────────────────── */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: '-200px', left: '10%', width: '700px', height: '700px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,212,170,0.07) 0%, transparent 65%)', filter: 'blur(60px)' }} />
        <div style={{ position: 'absolute', top: '40%', right: '-100px', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(167,139,250,0.06) 0%, transparent 70%)', filter: 'blur(60px)' }} />
        <div style={{ position: 'absolute', bottom: '10%', left: '20%', width: '600px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,122,255,0.05) 0%, transparent 70%)', filter: 'blur(60px)' }} />
      </div>

      {/* ── Sticky Nav ─────────────────────────────────────────────────────── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
        padding: '12px 40px',
        background: scrollY > 50 ? 'rgba(6,6,18,0.85)' : 'transparent',
        backdropFilter: scrollY > 50 ? 'blur(24px)' : 'none',
        borderBottom: scrollY > 50 ? '1px solid rgba(255,255,255,0.06)' : 'none',
        transition: 'all 0.4s ease',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px',
            background: 'linear-gradient(135deg, #00D4AA, #00A87A)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '18px', boxShadow: '0 4px 16px rgba(0,212,170,0.40)',
          }}>🩺</div>
          <span style={{ fontWeight: '900', fontSize: '18px', color: '#F8F8FF', letterSpacing: '-0.3px' }}>VaidyaAI</span>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {[['Features', 'features'], ['How It Works', 'how-it-works'], ['Protocols', 'protocols']].map(([label, id]) => (
            <button key={id} onClick={() => {
              const el = document.getElementById(id)
              if (el && containerRef.current) containerRef.current.scrollTo({ top: el.offsetTop - 70, behavior: 'smooth' })
            }} style={{
              color: '#666688', fontSize: '13px', fontWeight: '600', background: 'none',
              border: 'none', padding: '6px 12px', borderRadius: '8px', transition: 'color 0.2s', cursor: 'pointer',
              fontFamily: 'DM Sans, sans-serif',
            }}
              onMouseEnter={e => e.currentTarget.style.color = '#E8E8F8'}
              onMouseLeave={e => e.currentTarget.style.color = '#666688'}
            >{label}</button>
          ))}
          <button onClick={onEnterApp} style={{
            padding: '9px 22px', borderRadius: '100px', border: 'none',
            background: 'linear-gradient(135deg, #00B890, #00D4AA)',
            color: '#040410', fontWeight: '800', fontSize: '13px', cursor: 'pointer',
            fontFamily: 'DM Sans, sans-serif',
            boxShadow: '0 4px 20px rgba(0,212,170,0.35)',
          }}>Try Demo →</button>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '130px 32px 80px', textAlign: 'center', position: 'relative', zIndex: 1,
      }}>
        {/* Hackathon tag */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          padding: '6px 18px', borderRadius: '100px', marginBottom: '32px',
          background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.12)',
          color: '#AAAACC', fontSize: '12px', fontWeight: '700',
          animation: 'fadeIn 1s ease',
        }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00D4AA', animation: 'pulse 2s ease infinite', flexShrink: 0 }} />
          Gemma 4 Good Hackathon · Kaggle × Google DeepMind · 2026
        </div>

        {/* Main headline */}
        <h1 style={{
          fontSize: 'clamp(38px, 7.5vw, 80px)',
          fontWeight: '900', lineHeight: 1.05, letterSpacing: '-2px',
          marginBottom: '28px', maxWidth: '900px',
          animation: 'fadeUp 0.8s ease 0.1s both',
        }}>
          <span style={{
            background: 'linear-gradient(135deg, #FFFFFF 0%, #C0FFE8 50%, #00D4AA 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>The AI Doctor<br />for 800 Million Indians</span>
          <br />
          <span style={{
            background: 'linear-gradient(135deg, #AAAACC 0%, #888899 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            fontSize: 'clamp(22px, 4vw, 44px)', fontWeight: '700', letterSpacing: '-0.5px',
          }}>Who Have Never Seen One</span>
        </h1>

        <p style={{
          fontSize: 'clamp(15px, 2vw, 19px)', color: '#7777AA', maxWidth: '600px',
          lineHeight: 1.75, marginBottom: '44px',
          animation: 'fadeUp 0.8s ease 0.2s both',
        }}>
          Gemma 4 · 100% offline via Ollama · WHO IMCI clinical safety rails ·
          Telugu · Hindi · Tamil · English · Works on a ₹4,000 phone with zero internet
        </p>

        {/* CTA buttons */}
        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '56px', animation: 'fadeUp 0.8s ease 0.3s both' }}>
          <button onClick={onEnterApp} style={{
            padding: '17px 40px', borderRadius: '100px', border: 'none',
            background: 'linear-gradient(135deg, #00B890, #00D4AA 60%, #00FFB8)',
            color: '#030310', fontWeight: '900', fontSize: '16px', cursor: 'pointer',
            fontFamily: 'DM Sans, sans-serif',
            boxShadow: '0 8px 40px rgba(0,212,170,0.45), 0 0 0 1px rgba(0,212,170,0.2)',
            transition: 'all 0.25s ease',
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px) scale(1.03)'; e.currentTarget.style.boxShadow = '0 16px 60px rgba(0,212,170,0.60), 0 0 0 1px rgba(0,212,170,0.3)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 8px 40px rgba(0,212,170,0.45), 0 0 0 1px rgba(0,212,170,0.2)' }}
          >
            🩺 Start Consultation — Free
          </button>
          <button onClick={() => {
            const el = document.getElementById('how-it-works')
            if (el && containerRef.current) containerRef.current.scrollTo({ top: el.offsetTop - 70, behavior: 'smooth' })
          }} style={{
            padding: '17px 32px', borderRadius: '100px',
            background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.14)',
            color: '#CCCCEE', fontWeight: '700', fontSize: '15px',
            fontFamily: 'DM Sans, sans-serif', transition: 'all 0.25s ease',
            display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.10)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.22)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.14)' }}
          >See How It Works ↓</button>
        </div>

        {/* Feature pills */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center', animation: 'fadeUp 0.8s ease 0.4s both' }}>
          {[
            ['☁️', '0 Cloud Calls', '#00D4AA'], ['🛡️', 'WHO IMCI Safety', '#FF2D55'],
            ['🗣️', '4 Indian Languages', '#FF9500'], ['📱', '₹4,000 Phone', '#34C759'],
            ['👁️', 'Gemma 4 Vision', '#A78BFA'], ['🔬', 'Unsloth Fine-tuned', '#F97316'],
          ].map(([icon, label, color]) => <Pill key={label} icon={icon} label={label} color={color} />)}
        </div>

        {/* Scroll indicator */}
        <div style={{ position: 'absolute', bottom: '40px', left: '50%', transform: 'translateX(-50%)', animation: 'bounce 2s ease infinite', color: '#333355', fontSize: '22px' }}>↓</div>
      </section>

      {/* ── Crisis stats ─────────────────────────────────────────────────────── */}
      <section style={{ padding: '0 32px 100px', maxWidth: '1100px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <Glass style={{ padding: '52px 48px' }}>
          {/* Inner glow line */}
          <div style={{ position: 'absolute', top: 0, left: '10%', right: '10%', height: '1px', background: 'linear-gradient(90deg, transparent, rgba(255,45,85,0.6), transparent)' }} />
          <div style={{ textAlign: 'center', marginBottom: '42px' }}>
            <div style={{
              display: 'inline-block', padding: '4px 16px', borderRadius: '100px',
              background: 'rgba(255,45,85,0.12)', border: '1px solid rgba(255,45,85,0.30)',
              color: '#FF6B88', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '16px',
            }}>The Crisis in Numbers</div>
            <h2 style={{ fontSize: 'clamp(20px, 3vw, 32px)', fontWeight: '800', color: '#F0F0FF', lineHeight: 1.3 }}>
              Thousands die yearly — not from lack of medicine,<br />
              <span style={{ color: '#FF6B88' }}>but lack of triage knowledge</span>
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '20px' }}>
            {[
              { target: 600000, label: 'Villages in India', sub: 'No doctor within reach', color: '#FF2D55', prefix: '' },
              { target: 800000000, label: 'Rural Indians', sub: 'No AI healthcare', color: '#FF9500', prefix: '' },
              { target: 1300000, label: 'ASHA Workers', sub: 'No decision tool', color: '#FF9500', prefix: '' },
              { target: 0, label: 'Monthly Cost', sub: 'After setup', color: '#34C759', prefix: '₹' },
            ].map(s => (
              <div key={s.label} style={{
                textAlign: 'center', padding: '24px 16px',
                background: `${s.color}08`, border: `1px solid ${s.color}20`,
                borderRadius: '14px',
              }}>
                <div style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: '900', color: s.color, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                  <AnimatedNumber target={s.target} prefix={s.prefix} />
                </div>
                <div style={{ color: '#CCCCEE', fontSize: '14px', fontWeight: '700', marginTop: '8px' }}>{s.label}</div>
                <div style={{ color: '#444466', fontSize: '11px', marginTop: '4px' }}>{s.sub}</div>
              </div>
            ))}
          </div>
        </Glass>
      </section>

      {/* ── Triage decisions ─────────────────────────────────────────────────── */}
      <section style={{ padding: '100px 32px', maxWidth: '1100px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: '52px' }}>
          <div style={{ display: 'inline-block', padding: '4px 16px', borderRadius: '100px', marginBottom: '16px', background: 'rgba(0,212,170,0.12)', border: '1px solid rgba(0,212,170,0.30)', color: '#00D4AA', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Triage System</div>
          <h2 style={{ fontSize: 'clamp(24px, 4vw, 40px)', fontWeight: '900', color: '#F0F0FF', letterSpacing: '-0.5px', lineHeight: 1.2 }}>
            4 Life-Critical Decisions in Under 10 Seconds
          </h2>
          <p style={{ color: '#666688', fontSize: '16px', marginTop: '14px', maxWidth: '520px', margin: '14px auto 0', lineHeight: 1.65 }}>
            WHO IMCI safety rails override Gemma 4 if vital signs are dangerous. The AI cannot be overruled by a bad day.
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '16px' }}>
          <TriageBadge icon="🚨" level="Emergency" color="#FF2D55"
            trigger="Infant fever · Stiff neck · SpO₂ < 90% · Snakebite · Seizures · Chest pain"
            action="One-tap 108 dial. 102 for obstetric. IMCI overrides AI output." />
          <TriageBadge icon="🏥" level="Clinic" color="#FF9500"
            trigger="Fever 103°F+ · Malaria · TB suspect · MUAC < 115mm · SpO₂ 90–94%"
            action="PHC referral letter generated. ICD-10 auto-coded. PMJAY flag." />
          <TriageBadge icon="💊" level="OTC" color="#34C759"
            trigger="Mild cold · Mild diarrhoea · Minor headache · Simple wound"
            action="Janaushadhi store medicine. Weight-based pediatric dosing." />
          <TriageBadge icon="👁️" level="Monitor" color="#007AFF"
            trigger="Mild fatigue · Minor aches · Post-recovery · Stable chronic"
            action="Rest at home. Red flag signs listed. Return if worsening." />
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────────── */}
      <section id="how-it-works" style={{ padding: '100px 32px', position: 'relative', zIndex: 1, borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '52px' }}>
            <div style={{ display: 'inline-block', padding: '4px 16px', borderRadius: '100px', marginBottom: '16px', background: 'rgba(0,122,255,0.12)', border: '1px solid rgba(0,122,255,0.30)', color: '#60A5FA', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Architecture</div>
            <h2 style={{ fontSize: 'clamp(24px, 4vw, 40px)', fontWeight: '900', color: '#F0F0FF', letterSpacing: '-0.5px' }}>How VaidyaAI Works</h2>
            <p style={{ color: '#666688', fontSize: '16px', marginTop: '14px', maxWidth: '500px', margin: '14px auto 0', lineHeight: 1.65 }}>
              Every component is local. Nothing leaves the device. Ever.
            </p>
          </div>

          {/* Architecture flow */}
          <Glass style={{ padding: '36px', marginBottom: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
              <FlowNode icon="🗣️" title="Patient / ASHA" sub="Voice or text · 4 languages" color="#FF9500" />
              <div style={{ color: '#222244', fontSize: '20px', flexShrink: 0 }}>→</div>
              <FlowNode icon="📱" title="React 18 PWA" sub="Web Speech API · Camera · Offline" color="#007AFF" />
              <div style={{ color: '#222244', fontSize: '20px', flexShrink: 0 }}>→</div>
              <FlowNode icon="⚡" title="FastAPI Backend" sub="IMCI rails · Dosing · ICD-10" color="#00D4AA" />
              <div style={{ color: '#222244', fontSize: '20px', flexShrink: 0 }}>→</div>
              <FlowNode icon="🤖" title="Gemma 4 · Ollama" sub="gemma3:4b · 100% local CPU" color="#A78BFA" />
              <div style={{ color: '#222244', fontSize: '20px', flexShrink: 0 }}>→</div>
              <FlowNode icon="🩺" title="Triage + Action" sub="JSON · TTS · Emergency dial" color="#34C759" />
            </div>
            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <span style={{
                padding: '6px 18px', borderRadius: '100px', fontSize: '11px', fontWeight: '700',
                background: 'rgba(0,212,170,0.10)', border: '1px solid rgba(0,212,170,0.25)', color: '#00D4AA',
              }}>☁️ 0 external API calls · localhost:8000 → localhost:11434 only</span>
            </div>
          </Glass>

          {/* WHO IMCI override callout */}
          <Glass glow="#FF2D55" style={{ padding: '32px', display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, transparent, #FF2D55, transparent)' }} />
            <div style={{ fontSize: '44px', flexShrink: 0, lineHeight: 1 }}>🛡️</div>
            <div style={{ flex: 1, minWidth: '280px' }}>
              <div style={{ color: '#FF6B88', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>WHO IMCI Safety Rails — Gemma 4 Can Be Overridden</div>
              <div style={{ color: '#E8E8F8', fontSize: '16px', fontWeight: '700', marginBottom: '14px', lineHeight: 1.45 }}>
                If Gemma 4 returns "Monitor" but the patient's SpO₂ is 87% — the backend overrides it to EMERGENCY. Hard-coded. Unfoolable.
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {[
                  'Infant < 3mo + fever ≥ 100.4°F', 'SpO₂ < 90%',
                  'HR > 180 bpm (infant)', 'RR > 60/min (< 2mo)',
                  'MUAC < 115mm → SAM', 'Stiff neck = meningitis red flag',
                ].map(r => (
                  <span key={r} style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '11px', background: 'rgba(255,45,85,0.10)', border: '1px solid rgba(255,45,85,0.22)', color: '#FCA5A5' }}>{r}</span>
                ))}
              </div>
            </div>
          </Glass>
        </div>
      </section>

      {/* ── 3 Modes ──────────────────────────────────────────────────────────── */}
      <section style={{ padding: '100px 32px', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '52px' }}>
            <div style={{ display: 'inline-block', padding: '4px 16px', borderRadius: '100px', marginBottom: '16px', background: 'rgba(255,149,0,0.12)', border: '1px solid rgba(255,149,0,0.30)', color: '#FF9500', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1.5px' }}>3 Modes</div>
            <h2 style={{ fontSize: 'clamp(24px, 4vw, 40px)', fontWeight: '900', color: '#F0F0FF', letterSpacing: '-0.5px' }}>One App — Three Distinct Roles</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            {[
              {
                icon: '🧑', mode: 'Patient Mode', color: '#00D4AA',
                sub: 'For the patient or family member',
                features: ['Describe symptoms in any Indian language', 'Streaming AI response with live tokens', 'Voice input + TTS spoken result', 'Emergency banner + one-tap 108 dial', 'Image upload for wound analysis', 'Inference timer shows 0 cloud calls'],
              },
              {
                icon: '👩‍⚕️', mode: 'ASHA Worker Mode', color: '#FF9500',
                sub: 'For India\'s 1.3M community health workers',
                features: ['Structured vitals form (weight, SpO₂, pulse, RR)', 'Malaria / Pregnancy / Dengue RDT strip reader', 'Snakebite identifier — Big 4 Indian species', 'VVM cold chain reader for vaccine vials', 'Pregnancy tracker with JSSK entitlements', 'PHC referral letter · Outbreak detection · Analytics'],
              },
              {
                icon: '🌐', mode: 'Translator Mode', color: '#007AFF',
                sub: 'For doctor-patient language barriers',
                features: ['Doctor speaks English → patient hears Telugu', 'Patient speaks Hindi → doctor reads English', 'Voice input + Gemma 4 medical translation', 'TTS playback in target language', 'Medical vocabulary aware (not Google Translate)', '100% local — zero cloud API'],
              },
            ].map(m => (
              <Glass key={m.mode} glow={m.color} style={{ padding: '32px 28px', position: 'relative' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: `linear-gradient(90deg, transparent, ${m.color}, transparent)` }} />
                <div style={{ fontSize: '44px', marginBottom: '14px' }}>{m.icon}</div>
                <div style={{ color: m.color, fontSize: '16px', fontWeight: '800', marginBottom: '6px' }}>{m.mode}</div>
                <div style={{ color: '#666688', fontSize: '13px', marginBottom: '20px' }}>{m.sub}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {m.features.map(f => (
                    <div key={f} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                      <span style={{ color: m.color, fontSize: '12px', flexShrink: 0, marginTop: '2px' }}>✓</span>
                      <span style={{ color: '#AAAACC', fontSize: '13px', lineHeight: 1.45 }}>{f}</span>
                    </div>
                  ))}
                </div>
                <button onClick={onEnterApp} style={{
                  marginTop: '22px', width: '100%', padding: '12px', borderRadius: '12px', border: `1px solid ${m.color}40`,
                  background: `${m.color}12`, color: m.color, fontWeight: '700', fontSize: '13px', cursor: 'pointer',
                  fontFamily: 'DM Sans, sans-serif', transition: 'all 0.2s ease',
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = `${m.color}22` }}
                  onMouseLeave={e => { e.currentTarget.style.background = `${m.color}12` }}
                >Try {m.mode} →</button>
              </Glass>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features grid ────────────────────────────────────────────────────── */}
      <section id="features" style={{ padding: '100px 32px', position: 'relative', zIndex: 1, borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '52px' }}>
            <div style={{ display: 'inline-block', padding: '4px 16px', borderRadius: '100px', marginBottom: '16px', background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.30)', color: '#A78BFA', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Full Feature Set</div>
            <h2 style={{ fontSize: 'clamp(24px, 4vw, 40px)', fontWeight: '900', color: '#F0F0FF', letterSpacing: '-0.5px' }}>Everything Offline. Nothing Compromised.</h2>
            <p style={{ color: '#666688', fontSize: '16px', marginTop: '14px', maxWidth: '520px', margin: '14px auto 0', lineHeight: 1.65 }}>22 features. Zero cloud calls. Every Gemma 4 inference is local.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '14px' }}>
            <FeatureCard icon="🎙️" title="Voice Input — 4 Languages" color="#00D4AA" desc="Web Speech API: en-IN, hi-IN, te-IN, ta-IN. Native Gemma 4 multilingual understanding. No transcription service." />
            <FeatureCard icon="🛡️" title="WHO IMCI Triage" color="#FF2D55" tag="Safety Rail" desc="Hard-coded vital sign rules override AI output. Emergency → Clinic → OTC → Monitor. Cannot be bypassed." />
            <FeatureCard icon="📡" title="Live Streaming Response" color="#007AFF" desc="Server-Sent Events stream Gemma 4 tokens in real time. Inference timer proves offline speed." />
            <FeatureCard icon="👁️" title="Wound / Rash Analysis" color="#A78BFA" tag="Vision AI" desc="Upload a photo. Gemma 4 multimodal vision integrates visual findings into the triage decision." />
            <FeatureCard icon="🔬" title="RDT Strip Reader" color="#FF2D55" tag="Vision AI" desc="Malaria · Pregnancy · Dengue · COVID-19. Gemma 4 reads C/T bands. POSITIVE / NEGATIVE / INVALID." isNew />
            <FeatureCard icon="🐍" title="Snakebite Identifier" color="#FF9500" tag="Vision AI" desc="India's Big 4: Cobra, Krait, Russell's Viper, Saw-Scaled Viper. Photo → species + venom type + first aid." isNew />
            <FeatureCard icon="💉" title="VVM Cold Chain Reader" color="#60A5FA" tag="Vision AI" desc="Gemma 4 reads Vaccine Vial Monitor. Stage 1–4 classification. USE or DISCARD decision for ASHA workers." isNew />
            <FeatureCard icon="🌐" title="Medical Translator" color="#007AFF" desc="Doctor speaks English → patient hears Telugu. Medical vocabulary aware. Voice + text. TTS playback." isNew />
            <FeatureCard icon="🤰" title="Pregnancy Tracker (JSSK)" color="#FDA4AF" desc="LMP → gestational age, EDD, ANC schedule, JSSK entitlements, IFA dosing, warning signs, 102 ambulance." isNew />
            <FeatureCard icon="💊" title="Pediatric Dosing" color="#34C759" desc="16 ASHA government kit medicines. Weight-based: Paracetamol, ORS, Zinc, Albendazole, IFA, Vitamin A." />
            <FeatureCard icon="📏" title="MUAC Malnutrition Screen" color="#FF9500" desc="SAM < 115mm → NRC referral. MAM 115–125mm → nutrition support. WHO IMCI thresholds enforced." />
            <FeatureCard icon="⚠️" title="Drug Contraindications" color="#FF2D55" desc="G6PD + Chloroquine, Sulfa allergy + Cotrimoxazole, Pregnancy + Misoprostol — auto-blocked." />
            <FeatureCard icon="🦠" title="Outbreak Detection" color="#FF9500" tag="Auto-Alert" desc="3+ same-symptom patients → WhatsApp alert to Block Health Officer. One tap cluster reporting." />
            <FeatureCard icon="🖨️" title="PHC Referral Letter" color="#00D4AA" desc="One-tap printable HTML referral: vitals + AI assessment + ICD-10 + ASHA name. Ready for PHC doctor." />
            <FeatureCard icon="📻" title="Daily Health Bulletin" color="#A78BFA" desc="Date-seeded Gemma 4 health tip. Seasonal context. 16 rotating topics. Spoken aloud by TTS." isNew />
            <FeatureCard icon="💉" title="UIP Immunization" color="#34C759" desc="India UIP schedule. Overdue and upcoming vaccines for children under 6. NHM-aligned." />
            <FeatureCard icon="🔒" title="Privacy Audit Panel" color="#00D4AA" tag="Proof" desc="Click the status badge. Every API call logged — endpoint, target, response time. Cloud calls: always 0." isNew />
            <FeatureCard icon="📊" title="ASHA Session Analytics" color="#FF9500" desc="Emergency/Clinic/OTC/Monitor stats. Patient log. Text export. WhatsApp share to PHC." />
            <FeatureCard icon="🏥" title="PMJAY Coverage Flag" color="#34C759" desc="Checkbox marks PMJAY beneficiary. Rs. 5 lakh Ayushman Bharat banner on all referrals." />
            <FeatureCard icon="🧬" title="ICD-10 Auto-Coding" color="#7777FF" desc="40+ symptom → code mappings. G03.9 meningitis, A90 dengue, J18 pneumonia. PMJAY compatible." />
            <FeatureCard icon="🦙" title="Unsloth LoRA Fine-Tune" color="#F97316" tag="Kaggle" desc="500 Indian triage cases. Kaggle T4 GPU. 45 minutes. GGUF → Ollama. Custom vaidyaai model." />
            <FeatureCard icon="🐳" title="Docker Compose" color="#60A5FA" desc="docker-compose up — full stack in one command. Nginx + FastAPI + React. Raspberry Pi deployable." />
          </div>
        </div>
      </section>

      {/* ── Why Gemma 4 ─────────────────────────────────────────────────────── */}
      <section style={{ padding: '100px 32px', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '52px' }}>
            <div style={{ display: 'inline-block', padding: '4px 16px', borderRadius: '100px', marginBottom: '16px', background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.30)', color: '#A78BFA', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Model Choice</div>
            <h2 style={{ fontSize: 'clamp(24px, 4vw, 40px)', fontWeight: '900', color: '#F0F0FF', letterSpacing: '-0.5px' }}>Why Gemma 4 — And Why Nothing Else Works</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
            {[
              { n: '01', t: '4B params · 4GB RAM', d: 'Runs on a ₹4,000 Android phone or budget laptop. No GPU needed. No other model at this size matches its multilingual medical reasoning.', c: '#A78BFA' },
              { n: '02', t: 'Native Indian Languages', d: 'Telugu, Hindi, Tamil, English — coherent and clinically appropriate without fine-tuning. Critical when patients describe pain in their mother tongue.', c: '#A78BFA' },
              { n: '03', t: 'Multimodal Vision', d: 'Wound photos, RDT strips, VVM circles, snake photos — all analyzed locally. Previously required GPT-4V + cloud connectivity.', c: '#A78BFA' },
              { n: '04', t: 'Structured JSON Output', d: 'At temperature 0.3, Gemma 4 reliably emits valid triage JSON in all 4 languages. Makes medical-grade extraction practical.', c: '#A78BFA' },
              { n: '05', t: 'Ollama Integration', d: 'One command: ollama pull gemma3:4b. Custom Modelfile bakes VaidyaAI persona with ASHA temperature presets.', c: '#A78BFA' },
              { n: '06', t: 'Fine-Tunable via Unsloth', d: '500 Indian triage cases. LoRA on Kaggle T4. 45 minutes. GGUF export loads directly into Ollama. No cloud infrastructure.', c: '#A78BFA' },
            ].map(item => (
              <Glass key={item.n} style={{ padding: '24px 22px' }}>
                <div style={{ color: '#333355', fontSize: '11px', fontWeight: '800', fontVariantNumeric: 'tabular-nums', marginBottom: '12px', letterSpacing: '1px' }}>{item.n}</div>
                <div style={{ color: '#E8E8F8', fontSize: '15px', fontWeight: '700', marginBottom: '8px' }}>{item.t}</div>
                <div style={{ color: '#555577', fontSize: '13px', lineHeight: 1.65 }}>{item.d}</div>
              </Glass>
            ))}
          </div>
        </div>
      </section>

      {/* ── Prize tracks ─────────────────────────────────────────────────────── */}
      <section id="protocols" style={{ padding: '100px 32px', position: 'relative', zIndex: 1, borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <div style={{ display: 'inline-block', padding: '4px 16px', borderRadius: '100px', marginBottom: '16px', background: 'rgba(249,115,22,0.12)', border: '1px solid rgba(249,115,22,0.30)', color: '#F97316', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Prize Tracks</div>
            <h2 style={{ fontSize: 'clamp(24px, 4vw, 40px)', fontWeight: '900', color: '#F0F0FF', letterSpacing: '-0.5px' }}>Targeting All 6 Tracks — $100,000 Total</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
            {[
              { i: '🏥', t: 'Health & Sciences', p: '$10,000', d: 'WHO IMCI · ICD-10 · Vital sign rails · Pediatric dosing · Drug contraindications', c: '#FF2D55' },
              { i: '🤝', t: 'Digital Equity', p: '$10,000', d: '4 Indian languages · Offline-first · ₹4,000 phone · Zero infrastructure cost', c: '#007AFF' },
              { i: '🌍', t: 'Global Resilience', p: '$10,000', d: 'Zero dependencies · Works in power outages · Raspberry Pi deployable', c: '#34C759' },
              { i: '🦙', t: 'Ollama Special', p: '$10,000', d: '100% local Ollama · Custom vaidyaai Modelfile · All 15 endpoints via Ollama only', c: '#F97316' },
              { i: '🔬', t: 'Unsloth Special', p: '$10,000', d: 'LoRA fine-tune · 500 Indian cases · Kaggle T4 · GGUF → Ollama', c: '#A78BFA' },
              { i: '🥇', t: 'Main Track', p: '$50,000', d: 'All of the above — complete, working, real-world deployable solution', c: '#FFD700' },
            ].map(t => (
              <Glass key={t.t} glow={t.c} style={{ padding: '22px' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: `linear-gradient(90deg, transparent, ${t.c}, transparent)` }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <span style={{ fontSize: '28px' }}>{t.i}</span>
                  <span style={{ padding: '4px 12px', borderRadius: '100px', fontSize: '14px', fontWeight: '800', background: `${t.c}15`, border: `1px solid ${t.c}40`, color: t.c }}>{t.p}</span>
                </div>
                <div style={{ color: '#E8E8F8', fontSize: '14px', fontWeight: '700', marginBottom: '8px' }}>{t.t}</div>
                <div style={{ color: '#555577', fontSize: '12px', lineHeight: 1.6 }}>{t.d}</div>
              </Glass>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────────────────── */}
      <section style={{ padding: '120px 32px', textAlign: 'center', position: 'relative', zIndex: 1 }}>
        {/* Big glow under CTA */}
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '800px', height: '400px', background: 'radial-gradient(ellipse, rgba(0,212,170,0.08) 0%, transparent 70%)', pointerEvents: 'none', filter: 'blur(40px)' }} />

        <div style={{ maxWidth: '700px', margin: '0 auto', position: 'relative' }}>
          <div style={{ fontSize: '64px', marginBottom: '28px', filter: 'drop-shadow(0 8px 32px rgba(0,212,170,0.4))' }}>🩺</div>
          <h2 style={{
            fontSize: 'clamp(28px, 5vw, 52px)', fontWeight: '900', letterSpacing: '-0.8px',
            lineHeight: 1.12, marginBottom: '22px',
            background: 'linear-gradient(135deg, #FFFFFF 0%, #B0FFE8 50%, #00D4AA 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>
            Healthcare equity is not a luxury.<br />It is infrastructure.
          </h2>
          <p style={{ color: '#555577', fontSize: '17px', lineHeight: 1.75, marginBottom: '44px' }}>
            1.3 million ASHA workers · Each serves 1,000 patients<br />
            10% adoption = <strong style={{ color: '#00D4AA', fontWeight: '800' }}>130 million people</strong> with AI-assisted triage for the first time
          </p>
          <button onClick={onEnterApp} style={{
            padding: '20px 52px', borderRadius: '100px', border: 'none',
            background: 'linear-gradient(135deg, #00B890, #00D4AA 60%, #00FFB8)',
            color: '#030310', fontWeight: '900', fontSize: '18px', cursor: 'pointer',
            fontFamily: 'DM Sans, sans-serif',
            boxShadow: '0 12px 60px rgba(0,212,170,0.50)',
            transition: 'all 0.3s ease',
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px) scale(1.03)'; e.currentTarget.style.boxShadow = '0 20px 80px rgba(0,212,170,0.65)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 12px 60px rgba(0,212,170,0.50)' }}
          >
            🩺 Start Consultation — Free, Offline, Now →
          </button>
          <div style={{ marginTop: '24px', color: '#2A2A44', fontSize: '13px' }}>
            Powered by Gemma 4 · Google DeepMind · Ollama · WHO IMCI
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────────── */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '28px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'linear-gradient(135deg, #00D4AA, #00A87A)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>🩺</div>
          <span style={{ fontWeight: '800', color: '#E8E8F8', fontSize: '14px' }}>VaidyaAI</span>
          <span style={{ color: '#2A2A44', fontSize: '12px' }}>v2.0 · CC BY 4.0</span>
        </div>
        <div style={{ color: '#2A2A44', fontSize: '12px' }}>Built for Gemma 4 Good Hackathon · Kaggle × Google DeepMind · 2026</div>
      </footer>

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(24px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes pulse { 0%,100% { opacity: 1; transform: scale(1) } 50% { opacity: 0.6; transform: scale(1.15) } }
        @keyframes bounce { 0%,100% { transform: translateX(-50%) translateY(0) } 50% { transform: translateX(-50%) translateY(-8px) } }
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 6px } ::-webkit-scrollbar-track { background: #060612 } ::-webkit-scrollbar-thumb { background: #1A1A30; border-radius: 3px }
      `}</style>
    </div>
  )
}
