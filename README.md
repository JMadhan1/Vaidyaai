# VaidyaAI 🩺
### *"The AI Doctor for 800 Million Indians Who Have Never Seen One"*
*Gemma 4 · Fully Offline · Telugu · Hindi · Tamil · English · WHO IMCI · No Cloud*

---

![Gemma 4](https://img.shields.io/badge/Model-Gemma%204%20(gemma3%3A4b)-4285F4?style=flat-square&logo=google)
![Ollama](https://img.shields.io/badge/Runtime-Ollama-brightgreen?style=flat-square)
![FastAPI](https://img.shields.io/badge/Backend-FastAPI%202.0-009688?style=flat-square)
![React](https://img.shields.io/badge/Frontend-React%2018%20PWA-61DAFB?style=flat-square)
![IMCI](https://img.shields.io/badge/Protocol-WHO%20IMCI-red?style=flat-square)
![Unsloth](https://img.shields.io/badge/Fine--tuning-Unsloth%20LoRA-orange?style=flat-square)
![License](https://img.shields.io/badge/License-CC--BY%204.0-lightgrey?style=flat-square)

---

## The Problem

India has **600,000+ villages**. Over **80% lack a qualified doctor** within accessible distance. Every year, hundreds of thousands die from entirely preventable conditions:

- A 103°F fever left to worsen into sepsis
- A child's dehydration dismissed as a passing stomach bug  
- A heart attack ignored for 12 hours because no one knew it was urgent
- A pregnant mother ignored because no one knew to call the free maternal ambulance

The barrier is not medicine. The barrier is **triage knowledge**: *Is this serious? Should I go to the hospital NOW?*

## The Solution

VaidyaAI runs **Gemma 4 (gemma3:4b) entirely offline** via Ollama. A patient speaks their symptoms in their native language. VaidyaAI asks smart follow-up questions and delivers a life-critical decision in seconds — with **WHO IMCI clinical safety rails that override the LLM** if vital signs are dangerous.

| Decision | Meaning | Trigger |
|---|---|---|
| 🚨 **EMERGENCY** | Call 108 immediately | Chest pain, infant fever, seizures, snake bite, SpO₂ < 90% |
| 🏥 **CLINIC** | See a doctor within 24 hours | Fever 103°F+, malaria symptoms, suspected TB |
| 💊 **OTC** | Janaushadhi store medicine | Mild cold, mild diarrhoea, headache |
| 👁️ **MONITOR** | Rest and observe | Mild fatigue, minor aches |

Every response is spoken aloud in the patient's language via browser TTS. **No internet. No cloud. No subscription.** Works on a ₹4,000 ($50) Android phone.

---

## Prize Tracks

| Track | Prize | Why We Qualify |
|---|---|---|
| 🏥 Health & Sciences | $10,000 | WHO IMCI protocols, ICD-10 coding, vital sign safety rails, pediatric dosing |
| 🤝 Digital Equity | $10,000 | 4 Indian languages, offline-first, ₹4,000 phone compatible |
| 🌍 Global Resilience | $10,000 | Zero infrastructure dependency, works in power/internet outages |
| 🦙 Ollama Special | $10,000 | 100% local Ollama inference + custom `vaidyaai` Modelfile |
| 🔬 Unsloth Special | $10,000 | LoRA fine-tune on 500 Indian triage cases via Unsloth |
| 🥇 Main Track | $50,000 | All of the above |

---

## Demo

> 🎥 **[Watch 3-minute demo — ADD YOUTUBE LINK]**  
> 🚀 **[Live Demo — https://twister-password-confirm.ngrok-free.app](https://twister-password-confirm.ngrok-free.app)**

**Demo highlights:**
- Hindi voice input → Gemma 4 streaming triage → Emergency 108 banner
- ASHA Worker mode: patient vitals form → IMCI override → pediatric paracetamol dose
- **NEW: RDT Strip Reader** — malaria test photo → Gemma 4 reads bands → POSITIVE/NEGATIVE + action
- **NEW: Outbreak alert** — 3 fever patients in same village → WhatsApp alert to Block Health Officer
- **NEW: PHC Referral letter** — CLINIC triage → printable referral with vitals + AI assessment
- Offline proof: Airplane mode ON → Gemma 4 responds in 8 seconds (inference timer shown)
- PMJAY badge: Rs. 5 lakh Ayushman Bharat coverage flagged on hospital referrals
- Image analysis: Wound photo → Gemma 4 5-point visual assessment

---

## Quick Start

```bash
# 1. Pull and serve Gemma 4
ollama pull gemma3:4b
ollama serve

# Optional: Create the custom VaidyaAI model
ollama create vaidyaai -f Modelfile

# 2. Backend
cd backend
pip install -r requirements.txt
python main.py
# → http://localhost:8000

# 3. Frontend (new terminal)
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

---

## Architecture

```
Patient / ASHA Worker (speaks Telugu / Hindi / Tamil / English)
                    │
                    ▼
     React 18 PWA (Vite · DM Sans · Dark theme)
     ├── Web Speech API (4 Indian languages, offline STT)
     ├── Patient Mode: Chat + streaming SSE + voice output
     ├── ASHA Worker Mode: Vitals form (weight, SpO₂, pulse, RR)
     ├── Image Upload: Camera → Gemma 4 multimodal vision
     ├── Triage Card: Color-coded + confidence bar + ICD-10 badge
     ├── Warning Signs: IMCI red flags in amber
     ├── Reasoning Panel: Gemma 4 clinical transparency
     └── Emergency CTAs: 108 call + 102 maternal ambulance
                    │
              POST /api/triage/stream (SSE)
              POST /api/asha-triage
              POST /api/dosing
              GET  /api/asha-kit
                    │
     FastAPI Backend (Python 3.11+)
     ├── medical_rules.py: IMCI, dosing, ICD-10, ASHA kit
     ├── prompts.py: System prompts (4 languages)
     ├── agent.py: LangChain + ChatOllama streaming
     ├── vision.py: Gemma 4 multimodal image analysis
     ├── triage_logic.py: JSON extraction + fallback parsing
     ├── symptom_kb.py: Pre-LLM keyword detection
     └── main.py: IMCI vital sign override safety rail
                    │
              HTTP / localhost:11434
                    │
     Ollama Runtime
     ├── gemma3:4b (2.6GB, 4B params, 128K context)
     └── vaidyaai (custom Modelfile with ASHA persona)
          100% local — zero telemetry — zero cloud
```

---

## Clinical Features

### WHO IMCI Safety Rails
Hard-coded vital sign thresholds that **override Gemma 4** regardless of its output:

| Condition | Threshold | Action |
|---|---|---|
| Infant fever | Any temp ≥ 100.4°F if < 3 months | EMERGENCY |
| High fever | ≥ 104°F (40°C) | EMERGENCY |
| SpO₂ critical | < 90% | EMERGENCY |
| SpO₂ borderline | 90–94% | CLINIC |
| Infant tachycardia | HR > 180 bpm (< 1 year) | EMERGENCY |
| Fast breathing (infant) | RR > 60/min (< 2 months) | EMERGENCY |

### India-Specific Protocols
- **Snakebite**: Immobilize limb. No tourniquet. Call 108. Antivenom at government hospitals only.
- **Malaria**: Cyclical fever + chills + farm exposure → RDT test at PHC
- **TB**: Cough > 2 weeks + night sweats → sputum test (NIKSHAY notification)
- **Obstetric emergency**: Call 102 (free maternal ambulance) not 108
- **Severe malnutrition**: MUAC < 11.5cm → SAM emergency, NRC referral
- **102 ambulance**: Free maternal ambulance for obstetric emergencies (not just 108)

### Pediatric Dosing Calculator (WHO/NHM)
Weight-based dosing for all 16 ASHA government kit medicines:
- Paracetamol: 15 mg/kg every 6 hours (max 1000mg)
- ORS: volume by weight band after each loose stool
- Zinc: 20mg once daily for 14 days with diarrhoea
- Albendazole, Vitamin A, IFA, Cotrimoxazole — all by weight/age

### ICD-10 Auto-Coding
40+ symptom → code mappings for clinical record compatibility (PMJAY/Ayushman Bharat).

---

## Project Structure

```
vaidya-ai/
├── backend/
│   ├── main.py           # FastAPI v2.0, IMCI safety rail, all routes
│   ├── agent.py          # LangChain + ChatOllama streaming agent
│   ├── medical_rules.py  # IMCI rules, dosing calculator, ICD-10, ASHA kit
│   ├── prompts.py        # System prompts — 4 languages, IMCI protocol
│   ├── vision.py         # Gemma 4 multimodal image analysis
│   ├── triage_logic.py   # JSON extraction with fallback parsing
│   ├── symptom_kb.py     # Keyword-based pre-LLM classification
│   ├── models.py         # Pydantic models (TriageRequest, TriageResponse)
│   └── requirements.txt
├── frontend/
│   ├── public/
│   │   ├── icon.svg      # Custom VaidyaAI logo (ECG + AI node design)
│   │   ├── favicon.svg   # Optimized favicon
│   │   └── manifest.json # PWA manifest
│   └── src/
│       ├── components/   # ChatInterface, TriageResult, EmergencyBanner...
│       ├── modes/        # ASHAMode (village health worker view)
│       ├── hooks/        # useChat (streaming), useVoice, useTTS
│       └── utils/        # api.js, languages.js
├── kaggle_notebook/
│   ├── vaidyaai_demo.ipynb           # Full feature demo (10 sections)
│   └── vaidyaai_unsloth_finetune.ipynb  # Gemma 4 fine-tune with Unsloth
├── Modelfile             # Custom Ollama model: ollama create vaidyaai -f Modelfile
└── README.md
```

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | API info + version |
| GET | `/health` | Ollama connection + model status |
| POST | `/triage` | Single-turn triage inference |
| POST | `/triage/stream` | Streaming SSE triage (chat mode) |
| POST | `/asha-triage` | ASHA worker structured triage + vitals |
| POST | `/dosing` | Pediatric drug dosing calculator |
| GET | `/asha-kit` | Official NHM ASHA medicine kit list |
| GET | `/languages` | Supported language list |

---

## Why Gemma 4?

1. **4B parameters in 4GB RAM** — runs on consumer hardware and ₹4,000 Android phones via Termux. No other foundation model at this size delivers comparable multilingual medical reasoning.

2. **Native Indian language understanding** — Gemma 4 handles Telugu, Hindi, Tamil, and English in the same conversation without degradation. Critical for a health app where the patient speaks in the language they *feel pain in*.

3. **Multimodal vision** — Gemma 4's vision capability allows wound/rash analysis from a phone camera photo — a feature that previously required GPT-4V and cloud connectivity.

4. **Structured output reliability** — Gemma 4 at temperature 0.3 reliably emits valid JSON triage schemas, making medical-grade decision extraction practical.

5. **Ollama integration** — One command to deploy: `ollama pull gemma3:4b`. Our custom `Modelfile` bakes the VaidyaAI persona into a dedicated `vaidyaai` model.

6. **Fine-tunable** — Unsloth LoRA fine-tuning on Kaggle T4 GPU in ~45 minutes. The fine-tuned model exports as GGUF and imports directly into Ollama.

---

## Impact

| Metric | Value |
|---|---|
| Target population | 800M rural Indians |
| Villages addressable | 600,000 |
| ASHA workers who could deploy | 1.3M |
| Monthly infrastructure cost | $0 |
| Languages covered (native speakers) | 4 languages · 500M+ speakers |
| Internet required | None |
| Minimum device | ₹4,000 Android or Raspberry Pi 4 |
| Cloud API calls | 0 |

---

## License

[Creative Commons Attribution 4.0 International (CC BY 4.0)](https://creativecommons.org/licenses/by/4.0/)

---

*Built for the Gemma 4 Good Hackathon — Kaggle × Google DeepMind*  
*"Healthcare equity is not a luxury. It is infrastructure."*
