import React, { useRef } from 'react'
import { Camera, X } from 'lucide-react'

export default function ImageUpload({ onImage, currentImage, onClear }) {
  const inputRef = useRef()

  const handleFile = (file) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => {
      const base64 = e.target.result.split(',')[1]
      onImage({ base64, mimeType: file.type, preview: e.target.result })
    }
    reader.readAsDataURL(file)
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={e => handleFile(e.target.files[0])}
      />
      {currentImage ? (
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <img
            src={currentImage.preview}
            alt="symptom"
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '8px',
              objectFit: 'cover',
              border: '2px solid #00D4AA',
              display: 'block',
            }}
          />
          <button
            onClick={onClear}
            style={{
              position: 'absolute',
              top: '-6px',
              right: '-6px',
              width: '18px',
              height: '18px',
              borderRadius: '50%',
              background: '#FF2D55',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              padding: 0,
            }}
          >
            <X size={10} />
          </button>
        </div>
      ) : (
        <button
          onClick={() => inputRef.current.click()}
          title="Upload symptom photo (uses Gemma 4 vision)"
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            border: '2px solid rgba(255,255,255,0.12)',
            background: 'rgba(255,255,255,0.04)',
            color: '#666688',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
            flexShrink: 0,
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = 'rgba(0,212,170,0.4)'
            e.currentTarget.style.color = '#00D4AA'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'
            e.currentTarget.style.color = '#666688'
          }}
        >
          <Camera size={18} />
        </button>
      )}
    </div>
  )
}
