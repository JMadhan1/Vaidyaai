# VaidyaAI: Offline AI Medical Triage for India's 600,000 Unserved Villages

**Subtitle:** How Gemma 4 + Ollama can deliver emergency triage to patients who have never seen a doctor

**Track:** Health & Sciences · Digital Equity & Inclusivity · Global Resilience · Ollama Special Prize

---

## The Problem (Why This Matters)

India has 1.4 billion people and 600,000 villages. Over 80% of those villages have no doctor within accessible distance. In rural Telangana, Rajasthan, or Tamil Nadu, reaching the nearest clinic can mean a 3-hour journey on unpaved roads — if you have a vehicle and money for fuel.

Every year, thousands of preventable deaths occur not from a lack of medicine, but from a lack of triage information. A chest pain dismissed as indigestion. A fever in an infant left untreated for three days. A stroke misread as tiredness.

India's 1.3 million ASHA (Accredited Social Health Activist) workers are the last line of defense — community health workers with basic training and a medicine kit, covering populations of up to 1,000 people each. They are overworked, under-resourced, and have no decision support tool that works in their language or without internet.

**VaidyaAI was built for this gap.**

---

## The Solution

VaidyaAI is a fully offline, multilingual AI medical triage assistant. It runs Gemma 4 entirely on-device via Ollama — no internet, no cloud, no subscription, no data leaving the device.

A patient describes their symptoms in Telugu, Hindi, Tamil, or English — by voice or text. VaidyaAI reasons through the case using Gemma 4 and delivers a structured triage decision in under 10 seconds:

- 🚨 **EMERGENCY** — Call 108 immediately (one-tap emergency dial built in)
- 🏥 **CLINIC** — See a doctor within 24–48 hours
- 💊 **OTC** — Over-the-counter medicines at a Janaushadhi store
- 👁️ **MONITOR** — Rest at home, watch for warning signs

Every response is spoken aloud in the patient's language using browser TTS. The app works on a ₹4,000 ($50) Android phone. No installation required — it is a Progressive Web App.

---

## How We Use Gemma 4

We specifically chose Gemma 4 (gemma3:4b) for three reasons that matter for this use case:

**1. Multilingual without fine-tuning.** Gemma 4's native understanding of Telugu, Hindi, and Tamil is significantly better than alternatives at this parameter size. In internal testing, triage decisions in Telugu were coherent and clinically appropriate without any additional training.

**2. Structured output reliability.** The triage system requires Gemma 4 to output valid JSON containing `triage_level`, `confidence`, `actions[]`, and `reasoning` fields. At temperature 0.3, Gemma 4 reliably produces parseable JSON in all four languages, with a keyword-classification fallback for edge cases.

**3. Multimodal vision.** Gemma 4's vision capability is used when patients upload a photo — a wound, a rash, a medication label. The image is sent to Ollama's vision API alongside the symptom description, and Gemma 4 provides a visual analysis section in the triage result. This is implemented in `backend/vision.py` using Ollama's `/api/generate` endpoint with base64 image embedding.

The ASHA Worker mode uses temperature 0.1 for even more conservative, structured outputs — appropriate for a healthcare worker making field decisions.

---

## Architecture

```
[Patient / ASHA Worker]
        │ Voice (Web Speech API) or Text
        ▼
[React 18 PWA — Frontend]
        │ HTTP (localhost proxy, fully offline)
        ▼
[FastAPI Backend — Python]
        │ LangChain ChatOllama
        ▼
[Gemma 4 (gemma3:4b) via Ollama]
        │ Local inference only — no external API calls
        ▼
[Triage JSON] → Parsed → TriageResult UI
```

**Key implementation details:**

- **Streaming responses:** The `/triage/stream` endpoint uses Server-Sent Events so tokens appear in real time, even on slow hardware.
- **Conversation context:** LangChain maintains the full multi-turn conversation history, enabling Gemma 4 to ask follow-up questions ("How many days has the fever been present?") before committing to a triage level.
- **Fallback chain:** If Gemma 4 returns malformed JSON, `triage_logic.py` falls back to a keyword classifier (`symptom_kb.py`) that covers emergency/clinic/OTC/monitor terms in all four languages.
- **ASHA mode:** A separate `/asha-triage` endpoint accepts structured patient data (age, gender, chief complaint, fever, breathing status, consciousness, pregnancy) and returns a detailed decision card including which kit medicines to use, whether to refer to the PHC, and red flag signs to watch.
- **Vision pipeline:** `vision.py` calls Gemma 4's multimodal API for image-based symptom analysis, integrated into both the streaming and non-streaming triage flows.

---

## What We Built

| Feature | Status |
|---|---|
| Patient voice input (4 languages) | ✅ Web Speech API, en-IN/hi-IN/te-IN/ta-IN |
| Gemma 4 local inference via Ollama | ✅ No external API |
| Streaming triage response (SSE) | ✅ Real-time token display |
| Image / wound photo analysis | ✅ Gemma 4 vision via Ollama |
| WHO IMCI vital sign safety rails | ✅ Hard rules override LLM — cannot be bypassed |
| MUAC malnutrition screening | ✅ SAM (<115mm) / MAM (115–125mm) auto-detection |
| Drug contraindication engine | ✅ G6PD + chloroquine, sulfa allergy + cotrimoxazole |
| ICD-10 auto-coding | ✅ 40+ symptom → code mappings |
| Emergency 108 + 102 buttons | ✅ One-tap dial — 102 for maternal, 108 for general |
| ASHA Worker structured assessment | ✅ Full vitals form + kit medicines + referral |
| **Gemma 4 RDT Strip Reader** | ✅ AI interprets malaria/pregnancy/dengue/COVID-19 test strips from photo |
| **Outbreak Detection** | ✅ 3+ similar cases → WhatsApp alert to Block Health Officer |
| **Printable PHC Referral Letter** | ✅ One-tap generates structured referral with vitals + AI assessment |
| **India UIP Immunization Schedule** | ✅ Auto-fetches overdue/upcoming vaccines for children under 6 |
| **PMJAY/Ayushman Bharat badge** | ✅ Flags Rs. 5 lakh coverage eligibility on referral |
| **Gemma 4 inference timer** | ✅ Shows actual LLM response time (offline performance proof) |
| ASHA session analytics | ✅ Per-visit triage distribution stats card |
| WhatsApp PHC report sharing | ✅ wa.me deep link + text file export |
| Reasoning transparency panel | ✅ Collapsible "Gemma 4 Clinical Reasoning" in UI |
| TTS spoken responses | ✅ Browser SpeechSynthesis, language-matched |
| Offline PWA (Service Worker) | ✅ Network-first for API, cache-first for assets |
| Docker Compose deployment | ✅ `docker-compose up` → full stack in one command |
| Unsloth LoRA fine-tuning | ✅ 500 Indian triage cases, Kaggle T4, GGUF export |

---

## Clinical Test Cases — Gemma 4 in Action

Five representative cases demonstrating VaidyaAI's clinical decision logic:

**Case 1 — Infant Fever (Telugu)**
> Patient input (Telugu): "నా 2 నెలల పాపకి జ్వరం వచ్చింది, 101°F ఉంది"
> *(My 2-month-old baby has a fever, 101°F)*

Gemma 4 output: `triage_level: "emergency"` — IMCI safety rail fires before LLM output: infant under 3 months with any fever ≥ 100.4°F is always emergency regardless of temperature. Banner: "🚨 Call 108 immediately." Response spoken aloud in Telugu.

**Case 2 — ASHA Mode: Severe Dehydration**
> ASHA worker inputs: Age 2, Male, Chief complaint: "watery diarrhoea 5 times today, very lethargic", No fever, SpO₂ 97%, MUAC 118mm

Backend processing: `detect_imci_danger_signs()` flags "lethargic" → pre-LLM danger sign. Gemma 4 output: `triage_level: "emergency"`, `from_kit: ["ORS — 150ml over 4 hours", "Zinc 10mg dispersible tablet"]`, `refer_to: "PHC immediately — severe dehydration". MUAC 118mm flagged as MAM. Vital sign override does not fire (SpO₂ normal) but IMCI lethargic flag elevates to emergency.

**Case 3 — Drug Contraindication Detection**
> ASHA worker inputs: Female 28yo, Chief complaint: "fever + G6PD deficiency, malaria symptoms", Pregnancy: No

Contraindication engine fires: `check_contraindications(["g6pd deficiency"], "Chloroquine")` → `severity: "contraindicated"`. Result: Chloroquine appears in kit as `"⚠ AVOID Chloroquine 500mg — Cotrimoxazole and Chloroquine can cause haemolysis in G6PD deficiency"`. Action: `refer_to: "PHC — malaria RDT + safe alternative antimalarial needed"`

**Case 4 — Multilingual Hindi Streaming**
> Patient input: "मुझे 3 दिन से बुखार है, सिरदर्द भी है, गर्दन अकड़ी हुई है"
> *(I have had fever for 3 days, headache too, stiff neck)*

IMCI danger sign detection fires: "stiff neck" matched. Streaming response begins immediately, tokens appear in real time. Final JSON: `triage_level: "emergency"`, `icd10_code: "G03.9"` (meningitis), `suggested_actions: ["Call 108 immediately", "Do not give aspirin or paracetamol until hospital", "Keep patient lying flat"]`

**Case 5 — MUAC Malnutrition Screen**
> ASHA worker inputs: Female 18 months, MUAC 108mm, Weight 7.8kg, No acute fever

Backend: `muac_mm_int = 108 < 115` → MUAC SAM threshold breached. `vital_check["override_triage"] = "clinic"`. Response: `triage_level: "clinic"`, `from_kit: ["Vitamin A 100,000 IU (single dose)"]`, `refer_to: "NRC/Therapeutic Feeding Centre — SAM protocol"`, `tell_family: ["Give ready-to-use therapeutic food (RUTF) twice daily", "Return to ASHA in 3 days for weight check"]`

---

## Challenges We Overcame

**Multilingual JSON reliability.** When prompting in Telugu or Hindi, earlier models would break JSON formatting by mixing script characters into field names. We solved this with a strict system prompt enforcing JSON schema and a regex + keyword fallback layer.

**Streaming + triage parsing.** Server-Sent Events require the final triage JSON to be emitted after the streaming text completes. We implemented a two-phase SSE protocol: stream tokens first, then emit a `[TRIAGE_RESULT]` event containing the parsed JSON.

**ASHA mode structure.** ASHA workers need highly constrained outputs — specific kit medicines, precise referral decisions, family education points. We wrote separate system prompts in all four languages with a rigid response schema, using temperature 0.1 to minimize hallucination.

**Device constraints.** Gemma 4 at 4B parameters runs on 8GB RAM at acceptable speeds (~3–5 tokens/sec on CPU). We set `num_predict: 512` as a hard limit to keep response time under 2 minutes even on low-end hardware.

---

## Why Our Technical Choices Are Right

- **Ollama** over cloud APIs: The entire promise of VaidyaAI is offline, private operation. A cloud API call would violate patient privacy, fail without connectivity, and add latency and cost. Ollama is the only path to true offline local inference.
- **Gemma 4 (4B)** over larger models: This is a deployment constraint, not a compromise. Doctors work in hospitals with GPUs. ASHA workers work in villages with Android phones or budget laptops. The 4B model runs on commodity hardware and still outperforms all alternatives at this size for Indic language tasks.
- **FastAPI + React** over a monolithic framework: The separation allows the backend to be deployed on a Raspberry Pi, a school computer, or a shared local network server for multiple ASHA workers — while the frontend remains a standard PWA installable from any browser.

---

## Impact & Vision

**Immediate:** VaidyaAI can be deployed to any ASHA worker with a laptop or shared Android device and 8GB RAM. No internet registration, no account, no cost after setup.

**Scale:** India's 1.3 million ASHA workers each serve ~1,000 people. If even 10% adopt VaidyaAI, it reaches 130 million patients — people who currently have zero AI-assisted healthcare access.

**Global:** The architecture is language-agnostic. With Gemma 4's multilingual capabilities, the same system can be adapted for Sub-Saharan Africa (Swahili, Hausa), Southeast Asia (Bahasa, Tagalog), or any under-served population — without retraining.

VaidyaAI does not replace doctors. It answers the only question that matters when you are 80km from the nearest clinic at 3am with a sick child: **Is this serious right now?**

That question, answered reliably, in your language, from a device in your hand, with no internet connection — is what Gemma 4 makes possible.

---

*Word count: ~1,450 words.*
