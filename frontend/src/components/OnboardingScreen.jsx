import React, { useState, useEffect } from 'react'
import { LANGUAGES } from '../utils/languages'

const STATS = [
  { value: '800M', label: 'Indians',       color: 'var(--emerald)' },
  { value: '600K', label: 'Villages',      color: 'var(--emerald)' },
  { value: '1M',   label: 'ASHA Workers',  color: 'var(--clinic)'  },
  { value: '0',    label: 'Nearby Doctors',color: 'var(--emergency)'},
]

const MODE_LABELS = {
  patient: {
    en: { title: 'Patient',       sub: 'Describe my symptoms' },
    te: { title: 'రోగి',          sub: 'లక్షణాలు వివరించండి' },
    hi: { title: 'मरीज़',         sub: 'लक्षण बताएं' },
    ta: { title: 'நோயாளி',       sub: 'அறிகுறிகளை விவரிக்கவும்' },
  },
  asha: {
    en: { title: 'ASHA Worker',   sub: 'Village field visit mode' },
    te: { title: 'ఆశా కార్యకర్త', sub: 'గ్రామ పర్యటన మోడ్' },
    hi: { title: 'आशा कार्यकर्ता', sub: 'गाँव दौरा मोड' },
    ta: { title: 'ஆஷா பணியாளர்', sub: 'கிராம வருகை முறை' },
  },
}

const CTA_TEXT = {
  en: 'Start Consultation →',
  te: 'సంప్రదింపు ప్రారంభించండి →',
  hi: 'परामर्श शुरू करें →',
  ta: 'ஆலோசனை தொடங்கு →',
}

export default function OnboardingScreen({ onStart }) {
  const [language, setLanguage] = useState('en')
  const [mode, setMode]         = useState('patient')
  const [visible, setVisible]   = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80)
    return () => clearTimeout(t)
  }, [])

  const modes = [
    { id: 'patient', icon: '🧑', color: 'var(--emerald)', rgb: '16,185,129' },
    { id: 'asha',    icon: '👩‍⚕️', color: 'var(--clinic)',  rgb: '245,158,11' },
  ]

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(ellipse 90% 60% at 50% 0%, #0D2137 0%, var(--bg) 70%)',
      padding: '28px 24px',
      overflowY: 'auto',
      opacity: visible ? 1 : 0,
      transition: 'opacity 0.55s ease',
    }}>

      {/* Logo */}
      <div style={{
        textAlign: 'center',
        marginBottom: '32px',
        animation: 'fadeUp 0.6s ease both',
      }}>
        <div style={{
          width: '88px',
          height: '88px',
          margin: '0 auto 16px',
          animation: 'glow 3s ease infinite',
          filter: 'drop-shadow(0 8px 32px rgba(16,185,129,0.45))',
        }}>
          <img src="/icon.svg" alt="VaidyaAI" width="88" height="88" style={{ borderRadius: '22px' }} />
        </div>
        <h1 style={{
          fontSize: '34px',
          fontWeight: '900',
          color: 'var(--text-primary)',
          letterSpacing: '-0.5px',
          margin: 0,
          lineHeight: 1.1,
        }}>VaidyaAI</h1>
        <p style={{
          color: 'var(--text-secondary)',
          fontSize: '15px',
          marginTop: '6px',
          fontWeight: '600',
        }}>
          Healthcare for Every Village
        </p>
      </div>

      {/* Stats grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '10px',
        width: '100%',
        maxWidth: '460px',
        marginBottom: '28px',
        animation: 'fadeUp 0.6s ease 0.08s both',
      }}>
        {STATS.map((s, i) => (
          <div key={i} style={{
            background: 'var(--surface)',
            borderRadius: 'var(--radius-md)',
            padding: '14px 8px',
            textAlign: 'center',
            border: '1px solid var(--border-subtle)',
          }}>
            <div style={{ fontSize: '20px', fontWeight: '900', color: s.color, lineHeight: 1 }}>
              {s.value}
            </div>
            <div style={{
              fontSize: '10px',
              color: 'var(--text-muted)',
              marginTop: '5px',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Language selector */}
      <div style={{
        width: '100%',
        maxWidth: '460px',
        marginBottom: '22px',
        animation: 'fadeUp 0.6s ease 0.16s both',
      }}>
        <p style={{
          color: 'var(--text-muted)',
          fontSize: '11px',
          fontWeight: '700',
          textTransform: 'uppercase',
          letterSpacing: '1.5px',
          marginBottom: '10px',
          textAlign: 'center',
        }}>
          Choose your language
        </p>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
          {Object.values(LANGUAGES).map(lang => {
            const active = language === lang.code
            return (
              <button
                key={lang.code}
                onClick={() => setLanguage(lang.code)}
                style={{
                  padding: '10px 20px',
                  borderRadius: 'var(--radius-pill)',
                  border: `2px solid ${active ? 'var(--emerald)' : 'var(--border-subtle)'}`,
                  background: active ? 'rgba(16,185,129,0.12)' : 'var(--surface)',
                  color: active ? 'var(--emerald)' : 'var(--text-secondary)',
                  fontSize: '15px',
                  fontWeight: active ? '800' : '600',
                  transition: 'all 0.18s ease',
                  minHeight: '44px',
                }}
              >
                {lang.flag} {lang.native}
              </button>
            )
          })}
        </div>
      </div>

      {/* Mode selector */}
      <div style={{
        width: '100%',
        maxWidth: '460px',
        marginBottom: '24px',
        animation: 'fadeUp 0.6s ease 0.24s both',
      }}>
        <p style={{
          color: 'var(--text-muted)',
          fontSize: '11px',
          fontWeight: '700',
          textTransform: 'uppercase',
          letterSpacing: '1.5px',
          marginBottom: '10px',
          textAlign: 'center',
        }}>
          Who are you?
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {modes.map(m => {
            const active = mode === m.id
            const labels = MODE_LABELS[m.id][language] || MODE_LABELS[m.id].en
            return (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                style={{
                  padding: '20px 14px',
                  borderRadius: '20px',
                  border: `2px solid ${active ? m.color : 'var(--border-subtle)'}`,
                  background: active
                    ? `rgba(${m.rgb}, 0.10)`
                    : 'var(--surface)',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.2s ease',
                  boxShadow: active
                    ? `0 0 28px rgba(${m.rgb}, 0.18)`
                    : 'none',
                  minHeight: '120px',
                }}
              >
                <div style={{ fontSize: '34px', marginBottom: '10px', lineHeight: 1 }}>
                  {m.icon}
                </div>
                <div style={{
                  fontWeight: '800',
                  fontSize: '15px',
                  color: active ? m.color : 'var(--text-primary)',
                  marginBottom: '5px',
                  lineHeight: 1.2,
                }}>
                  {labels.title}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: 'var(--text-muted)',
                  fontWeight: '600',
                  lineHeight: 1.4,
                }}>
                  {labels.sub}
                </div>
              </button>
            )
          })}
        </div>

        {/* ASHA mode info pill */}
        {mode === 'asha' && (
          <div style={{
            marginTop: '12px',
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(245,158,11,0.07)',
            border: '1px solid rgba(245,158,11,0.2)',
            color: '#D97706',
            fontSize: '13px',
            lineHeight: 1.6,
            fontWeight: '600',
            animation: 'slideDown 0.3s ease',
          }}>
            🏥 Rapid structured patient assessment · Kit medicines · PHC referral · WhatsApp field report
          </div>
        )}
      </div>

      {/* CTA */}
      <div style={{
        width: '100%',
        maxWidth: '460px',
        animation: 'fadeUp 0.6s ease 0.32s both',
      }}>
        <button
          onClick={() => onStart(language, mode)}
          style={{
            width: '100%',
            padding: '18px',
            borderRadius: 'var(--radius-pill)',
            background: mode === 'asha'
              ? 'linear-gradient(135deg, #D97706, var(--clinic))'
              : 'linear-gradient(135deg, var(--emerald), var(--emerald-dark))',
            color: 'white',
            fontSize: '17px',
            fontWeight: '900',
            boxShadow: mode === 'asha'
              ? '0 8px 32px rgba(245,158,11,0.35)'
              : '0 8px 32px rgba(16,185,129,0.35)',
            transition: 'all 0.2s ease',
            minHeight: '58px',
            letterSpacing: '0.3px',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)' }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)' }}
        >
          {CTA_TEXT[language] || CTA_TEXT.en}
        </button>
        <p style={{
          textAlign: 'center',
          color: '#4B5563',
          fontSize: '12px',
          marginTop: '14px',
          fontWeight: '600',
        }}>
          🔒 Powered by Gemma 4 · Fully Offline · No data leaves your device
        </p>
      </div>
    </div>
  )
}
