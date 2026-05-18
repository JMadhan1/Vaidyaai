import React from 'react'
import { LANGUAGES } from '../utils/languages'

export default function LanguageSelector({ selected, onChange }) {
  return (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
      {Object.values(LANGUAGES).map(lang => {
        const isSelected = selected === lang.code
        return (
          <button
            key={lang.code}
            onClick={() => onChange(lang.code)}
            style={{
              padding: '6px 14px',
              borderRadius: '100px',
              border: `1.5px solid ${isSelected ? '#00D4AA' : 'rgba(255,255,255,0.12)'}`,
              background: isSelected ? 'rgba(0,212,170,0.15)' : 'transparent',
              color: isSelected ? '#00D4AA' : '#9999BB',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.18s ease',
              fontFamily: 'DM Sans, sans-serif',
            }}
          >
            {lang.native}
          </button>
        )
      })}
    </div>
  )
}
