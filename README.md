# VaidyaAI — Offline AI Medical Triage for Rural India

> **Gemma 4 Good Hackathon 2026 · Kaggle × Google DeepMind**

[![Demo](https://img.shields.io/badge/Demo-YouTube-red?style=for-the-badge&logo=youtube)](https://www.youtube.com/watch?v=7XnBZXaWK5I)
[![Kaggle](https://img.shields.io/badge/Writeup-Kaggle-20BEFF?style=for-the-badge&logo=kaggle)](https://www.kaggle.com/competitions/gemma-4-good-hackathon/writeups/vaidyaai-offline-ai-medical-triage-for-rural-ind)
[![GitHub](https://img.shields.io/badge/Repo-GitHub-181717?style=for-the-badge&logo=github)](https://github.com/JMadhan1/Vaidyaai)
[![Model](https://img.shields.io/badge/Model-Gemma%204-4285F4?style=for-the-badge&logo=google)](https://ollama.com/library/gemma3)
[![Ollama](https://img.shields.io/badge/Runtime-Ollama-brightgreen?style=for-the-badge)](https://ollama.ai)
[![License](https://img.shields.io/badge/License-CC%20BY%204.0-lightgrey?style=for-the-badge)](LICENSE)

---

## The Problem

India has **600,000 villages**. Most have never seen a doctor.
**1.3 million ASHA workers** serve these villages with zero AI decision support and no internet.
**800 million rural Indians** have no access to AI-assisted healthcare.

Patients describe symptoms in Telugu, Hindi, or Tamil. Doctors write prescriptions in English. Snakebites go misidentified. Vaccines get administered from heat-damaged vials. Pregnant women miss ANC visits because no one calculated their schedule.

**VaidyaAI solves all of this — 100% offline, powered by Gemma 4.**

---

## Demo Video

[![VaidyaAI Demo](https://img.youtube.com/vi/7XnBZXaWK5I/maxresdefault.jpg)](https://www.youtube.com/watch?v=7XnBZXaWK5I)

**Watch the full demo:** https://www.youtube.com/watch?v=7XnBZXaWK5I

---

## Kaggle Writeup

https://www.kaggle.com/competitions/gemma-4-good-hackathon/writeups/vaidyaai-offline-ai-medical-triage-for-rural-ind

---

## Quick Start

```bash
# 1. Pull Gemma 4
ollama pull gemma3:4b

# 2. Backend
cd backend
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000

# 3. Frontend
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

### Docker (one command)
```bash
docker-compose up
```

---

## 3 Modes

### 🧑 Patient Mode
- Describe symptoms in Telugu, Hindi, Tamil, or English via voice or text
- Gemma 4 streams a structured triage response in real time via SSE
- WHO IMCI safety rails hard-coded in the backend override AI output if vitals are dangerous
- Emergency banner + one-tap 108 dial on critical cases
- Upload wound/rash photo — Gemma 4 multimodal vision integrates findings
- Pediatric weight-based dosing for 16 ASHA kit medicines

### 👩‍⚕️ ASHA Worker Mode — Tab Interface

| Tab | Tool |
|-----|------|
| 🧑 Triage | Vitals form → AI decision → PHC referral letter with ICD-10 |
| 🔬 RDT Test | Malaria / Pregnancy / Dengue / COVID strip reader |
| 🐍 Snakebite | India's Big 4 identifier + venom type + first aid |
| 💉 Vaccine | VVM cold chain reader — Stage 1–4 → USE or DISCARD |
| 🤰 Pregnancy | JSSK entitlements + ANC schedule + IFA dosing + EDD |
| 📻 Bulletin | Date-seeded Gemma 4 daily health tip with TTS playback |

### 🌐 Translator Mode
- Doctor speaks English → Gemma 4 translates → TTS reads in patient's language
- Patient speaks local language → Doctor reads English instantly
- Medical vocabulary aware — not word-for-word

---

## 22 Features — Zero Cloud Calls

| Feature | Description |
|---------|-------------|
| 🛡️ WHO IMCI Triage | Hard-coded safety rails override Gemma 4 on dangerous vitals |
| 🎙️ Voice Input | Web Speech API — en-IN · hi-IN · te-IN · ta-IN |
| 📡 Streaming Response | SSE streams Gemma 4 tokens in real time |
| 👁️ Wound Analysis | Gemma 4 multimodal vision on uploaded photos |
| 🔬 RDT Strip Reader | Malaria · Pregnancy · Dengue · COVID-19 |
| 🐍 Snakebite Identifier | Cobra · Krait · Russell's Viper · Saw-Scaled Viper |
| 💉 VVM Cold Chain Reader | Stage 1–4 → USE or DISCARD |
| 🌐 Medical Translator | Doctor ↔ Patient across 4 languages |
| 🤰 Pregnancy Tracker | JSSK · ANC · IFA · EDD · warning signs |
| 💊 Pediatric Dosing | Weight-based dosing for 16 ASHA kit medicines |
| 📏 MUAC Screening | SAM / MAM / Normal with WHO thresholds |
| ⚠️ Drug Contraindications | G6PD · sulfa allergy · pregnancy — auto-blocked |
| 🦠 Outbreak Detection | 3+ same-symptom patients → WhatsApp BHO alert |
| 🖨️ PHC Referral Letter | ICD-10 auto-coded · printable HTML |
| 📻 Daily Health Bulletin | Date-seeded Gemma 4 tip · TTS playback |
| 💉 UIP Immunization | India UIP schedule for children under 6 |
| 🔒 Privacy Audit Panel | Every API call logged — cloud calls always 0 |
| 📊 ASHA Analytics | Emergency/Clinic/OTC/Monitor stats + patient log |
| 🏥 PMJAY Flag | Rs. 5 lakh Ayushman Bharat coverage banner |
| 🧬 ICD-10 Auto-Coding | 40+ symptom → code mappings |
| 🦙 Unsloth Fine-Tune | 500 Indian cases · Kaggle T4 · 45 min · GGUF |
| 🐳 Docker Compose | Full stack in one command |

---

## Why Gemma 4

| Requirement | Why Gemma 4 |
|-------------|-------------|
| Runs on ₹4,000 phone | 4B params · 4GB RAM · no GPU needed |
| Indian languages | Native Telugu/Hindi/Tamil without fine-tuning |
| Photo analysis | Multimodal vision for RDT/VVM/snakebite/wounds |
| Structured output | Reliable JSON triage at temperature 0.3 |
| Local deployment | `ollama pull gemma3:4b` — one command |
| Fine-tunable | LoRA via Unsloth in 45 min on Kaggle T4 |

No other model at this parameter size delivers all six.

---

## Architecture

```
Patient / ASHA Worker
        ↓
React 18 PWA  (Voice · Camera · SSE · Offline)
        ↓
FastAPI Backend  (WHO IMCI rails · ICD-10 · Dosing)
        ↓
Gemma 4 via Ollama  (gemma3:4b · localhost:11434)
        ↓
Triage Result + Action  (JSON · TTS · Emergency dial)

☁️  0 external API calls — localhost only
```

---

## WHO IMCI Safety Rails

The backend hard-codes 12 vital sign thresholds. If Gemma 4 returns "Monitor" but SpO₂ is 87%, the backend **overrides to EMERGENCY**. These rules run before the AI response is returned.

| Condition | Threshold | Action |
|-----------|-----------|--------|
| Infant + fever | Any temp if < 3 months | EMERGENCY |
| SpO₂ critical | < 90% | EMERGENCY |
| SpO₂ borderline | 90–94% | CLINIC |
| Infant tachycardia | HR > 180 bpm | EMERGENCY |
| Fast breathing | RR > 60/min (< 2 months) | EMERGENCY |
| Malnutrition | MUAC < 115mm | EMERGENCY — SAM |
| Stiff neck | Any age | EMERGENCY — meningitis |

---

## Unsloth Fine-Tuning

Custom LoRA adapter trained on **500 Indian triage cases** using Unsloth on a Kaggle T4 GPU in **45 minutes**.

- Dataset covers: malaria · dengue · TB · snakebite · SAM · obstetric emergencies · pediatric fever
- Export: GGUF → loaded into Ollama as custom `vaidyaai` Modelfile
- Temperature presets optimized for ASHA field conditions

---

## Privacy

Every API call is interceptor-logged and shown in the Privacy Audit Panel (click the status badge in-app).

All requests target `localhost:8000 → localhost:11434`.
**Cloud calls: always 0. Patient data never leaves the device.**

---

## Project Structure

```
vaidya-ai/
├── backend/
│   ├── main.py              # FastAPI, WHO IMCI override, all endpoints
│   ├── medical_rules.py     # IMCI rules, dosing, ICD-10, ASHA kit
│   ├── prompts.py           # System prompts — 4 languages
│   └── requirements.txt
├── frontend/
│   ├── public/
│   │   ├── icon.svg
│   │   └── manifest.json
│   └── src/
│       ├── components/      # ChatInterface, StatusIndicator, EmergencyBanner
│       ├── modes/           # ASHAMode (tab-based), TranslatorMode
│       ├── pages/           # LandingPage (glassmorphism)
│       └── utils/           # api.js (axios interceptors), languages.js
├── kaggle_notebook/
│   └── vaidyaai_unsloth_finetune.ipynb
├── Modelfile                # ollama create vaidyaai -f Modelfile
├── docker-compose.yml
└── README.md
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| LLM | Gemma 4 (gemma3:4b) via Ollama |
| Backend | FastAPI + Python |
| Frontend | React 18 PWA + Vite |
| Voice | Web Speech API (4 Indian languages) |
| Streaming | Server-Sent Events (SSE) |
| Fine-tuning | Unsloth LoRA on Kaggle T4 |
| Deployment | Docker Compose |
| Protocols | WHO IMCI · UIP · JSSK · PMJAY |

---

## Prize Tracks Targeted

| Track | Prize |
|-------|-------|
| 🏥 Health & Sciences | $10,000 |
| 🤝 Digital Equity | $10,000 |
| 🌍 Global Resilience | $10,000 |
| 🦙 Ollama Special Prize | $10,000 |
| 🔬 Unsloth Special Prize | $10,000 |
| 🥇 Main Track | $50,000 |

---

## Impact

- 1.3M ASHA workers × ~1,000 patients each
- 10% adoption = **130 million people** with AI-assisted triage
- Zero recurring cost after setup
- Deployable on Raspberry Pi for clinic use
- Works during power outages and network blackouts

---

## Links

- 🎥 Demo Video: https://www.youtube.com/watch?v=7XnBZXaWK5I
- 📋 Kaggle Writeup: https://www.kaggle.com/competitions/gemma-4-good-hackathon/writeups/vaidyaai-offline-ai-medical-triage-for-rural-ind
- 💻 GitHub: https://github.com/JMadhan1/Vaidyaai

---

## License

CC BY 4.0 — Built for Gemma 4 Good Hackathon · Kaggle × Google DeepMind · 2026

*"Healthcare equity is not a luxury. It is infrastructure."*
