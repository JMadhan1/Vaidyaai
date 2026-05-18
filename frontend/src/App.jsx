import React, { useState } from 'react'
import LandingPage from './pages/LandingPage'
import OnboardingScreen from './components/OnboardingScreen'
import ChatInterface from './components/ChatInterface'
import StatusIndicator from './components/StatusIndicator'
import EmergencyBanner from './components/EmergencyBanner'
import ASHAMode from './modes/ASHAMode'
import TranslatorMode from './modes/TranslatorMode'
import { LANGUAGES } from './utils/languages'
import { getLanguage } from './utils/languages'

export default function App() {
  const [screen, setScreen] = useState('landing')        // 'landing' | 'onboarding' | 'app'
  const [showOnboarding, setShowOnboarding] = useState(true)
  const [selectedLanguage, setSelectedLanguage] = useState('en')
  const [mode, setMode] = useState('patient')            // 'patient' | 'asha' | 'translator'
  const [triageResult, setTriageResult] = useState(null)
  const [ashaEmergency, setAshaEmergency] = useState(false)

  const handleStart = (lang, selectedMode) => {
    setSelectedLanguage(lang)
    setMode(selectedMode)
    setShowOnboarding(false)
    setScreen('app')
  }

  if (screen === 'landing') {
    return <LandingPage onEnterApp={() => setScreen('onboarding')} />
  }

  const handleLanguageChange = (lang) => {
    setSelectedLanguage(lang)
    setTriageResult(null)
  }

  if (showOnboarding || screen === 'onboarding') {
    return <OnboardingScreen onStart={handleStart} />
  }

  // ── Shared header pieces ─────────────────────────────────────────────────
  const isASHA = mode === 'asha'
  const isTranslator = mode === 'translator'
  const accentColor = isASHA ? 'var(--asha-amber)' : isTranslator ? '#007AFF' : 'var(--emerald)'

  const Header = () => (
    <header style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '11px 16px',
      background: 'rgba(10,15,30,0.97)',
      backdropFilter: 'blur(20px)',
      borderBottom: `1px solid ${isASHA ? 'rgba(245,158,11,0.18)' : isTranslator ? 'rgba(0,122,255,0.18)' : 'var(--border-subtle)'}`,
      flexShrink: 0,
      gap: '10px',
      flexWrap: 'wrap',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '10px',
          background: `linear-gradient(135deg, ${accentColor}, ${isASHA ? '#D97706' : 'var(--emerald-dark)'})`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '18px',
          boxShadow: `0 4px 14px ${isASHA ? 'rgba(245,158,11,0.30)' : 'rgba(16,185,129,0.30)'}`,
        }}>
          {isASHA ? '🏥' : '🏥'}
        </div>
        <div>
          <div style={{
            fontWeight: '900',
            fontSize: '15px',
            color: 'var(--text-primary)',
            lineHeight: 1,
          }}>
            VaidyaAI
          </div>
          <div style={{
            fontSize: '11px',
            color: isASHA ? 'var(--asha-amber)' : isTranslator ? '#007AFF' : 'var(--text-muted)',
            fontWeight: '700',
            lineHeight: 1,
            marginTop: '2px',
          }}>
            {isASHA ? 'ASHA Worker Mode' : isTranslator ? 'Medical Translator Mode' : 'Healthcare for Every Village'}
          </div>
        </div>
      </div>

      {/* Language pills — compact in header */}
      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
        {Object.values(LANGUAGES).map(lang => {
          const active = selectedLanguage === lang.code
          return (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              style={{
                padding: '5px 12px',
                borderRadius: 'var(--radius-pill)',
                border: `1px solid ${active ? accentColor : 'transparent'}`,
                background: active
                  ? (isASHA ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.15)')
                  : 'transparent',
                color: active ? accentColor : 'var(--text-muted)',
                fontSize: '13px',
                fontWeight: '700',
                transition: 'all 0.18s ease',
                minHeight: '32px',
              }}
            >
              {lang.native}
            </button>
          )
        })}
      </div>

      {/* Right side: switch mode + status */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <button
          onClick={() => setShowOnboarding(true)}
          style={{
            padding: '5px 12px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)',
            background: 'transparent',
            color: 'var(--text-muted)',
            fontSize: '12px',
            fontWeight: '700',
          }}
        >
          ← Mode
        </button>
        <StatusIndicator />
      </div>
    </header>
  )

  // ── Translator Mode ──────────────────────────────────────────────────────
  if (isTranslator) {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)', overflow: 'hidden' }}>
        <Header />
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <TranslatorMode language={selectedLanguage} />
        </div>
      </div>
    )
  }

  // ── ASHA Worker Mode ─────────────────────────────────────────────────────
  if (isASHA) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg)',
        overflow: 'hidden',
      }}>
        <Header />
        {ashaEmergency && (
          <EmergencyBanner emergencyText="🚨 EMERGENCY PATIENT — Call 108 Immediately" />
        )}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <ASHAMode language={selectedLanguage} onEmergency={setAshaEmergency} />
        </div>
      </div>
    )
  }

  // ── Patient Mode ─────────────────────────────────────────────────────────
  const currentLang = getLanguage(selectedLanguage)
  const isEmergency = triageResult?.level === 'emergency'

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--bg)',
      overflow: 'hidden',
    }}>
      <Header />

      {/* Emergency banner — only when triage = emergency */}
      {isEmergency && (
        <EmergencyBanner emergencyText={currentLang.emergency_text} />
      )}

      {/* Chat takes the remaining height */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <ChatInterface
          language={selectedLanguage}
          onTriageUpdate={setTriageResult}
        />
      </div>
    </div>
  )
}
