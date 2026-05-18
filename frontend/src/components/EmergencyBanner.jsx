import React from 'react'

export default function EmergencyBanner({ emergencyText }) {
  return (
    <div style={{
      background: 'linear-gradient(135deg, #7F1D1D, #991B1B)',
      borderBottom: '2px solid var(--emergency)',
      padding: '14px 20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '12px',
      flexShrink: 0,
      animation: 'emergencyPulse 2s ease infinite',
    }}>
      <div>
        <div style={{
          fontWeight: '900',
          fontSize: '15px',
          color: '#FEF2F2',
          lineHeight: 1.2,
        }}>
          🚨 EMERGENCY DETECTED
        </div>
        <div style={{
          fontSize: '12px',
          color: '#FCA5A5',
          fontWeight: '600',
          marginTop: '3px',
        }}>
          {emergencyText || 'Seek immediate medical help — Call 108'}
        </div>
      </div>
      <a
        href="tel:108"
        style={{
          padding: '11px 22px',
          borderRadius: 'var(--radius-pill)',
          background: 'var(--emergency)',
          color: 'white',
          fontWeight: '900',
          fontSize: '15px',
          flexShrink: 0,
          boxShadow: '0 4px 18px rgba(239,68,68,0.5)',
          animation: 'pulse 1s ease infinite',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          letterSpacing: '0.3px',
        }}
      >
        📞 CALL 108
      </a>
    </div>
  )
}
