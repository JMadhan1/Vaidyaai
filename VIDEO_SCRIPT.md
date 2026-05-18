# VaidyaAI — 3-Minute Demo Video Script

> **Total runtime: ~2:50. Upload to YouTube as unlisted (or public). Link in Kaggle writeup.**

---

## SHOT LIST & NARRATION

---

### [0:00 – 0:18] EMOTIONAL HOOK — Black screen, voice over

**Narration (serious, quiet):**
> "600,000 Indian villages. No doctor. No clinic within reach.
> When a child gets a fever at 3am in rural Telangana…
> a mother has one question she cannot answer alone:
> *Is this serious? Do I need to go now?*"

**Visual:** Text on black screen — "600,000 villages. 0 nearby doctors."
Cut to: photo of a rural Indian village, dusty road, night sky.

---

### [0:18 – 0:32] INTRODUCE VAIDYAAI

**Narration:**
> "VaidyaAI is an offline AI medical triage assistant, powered by Gemma 4.
> No internet. No cloud. No subscription.
> Running entirely on your device."

**Visual:** Show the app opening on phone/laptop.
Logo animation on onboarding screen. Stats: 800M, 600K, 1M ASHA, 0 doctors.

---

### [0:32 – 1:05] DEMO — PATIENT MODE (Hindi voice input)

**Action:** Switch language to Hindi (हिंदी). Select Patient mode.
**Narration:**
> "A patient speaks their symptoms — in Hindi, Telugu, Tamil, or English."

**Show on screen:** Click mic button → speak (or type):
> *"मुझे तीन दिनों से तेज़ बुखार है, सिरदर्द हो रहा है और उल्टी आ रही है।"*
> *(English: "I have had a high fever for three days, headache, and vomiting.")*

**Narration:**
> "Gemma 4 reasons through the case locally — no data ever leaves this device."

**Show:** Streaming response appearing token by token.
**Show:** CLINIC-level triage card appearing. Yellow. Actions list.

**Then switch scenario:** Type "severe chest pain, left arm numb, sweating"
**Show:** EMERGENCY red banner flashing. "CALL 108" button pulsing.

**Narration:**
> "For life-threatening cases — an immediate emergency alert. One tap to call 108."

---

### [1:05 – 1:35] DEMO — ASHA WORKER MODE

**Action:** Go back to onboarding → select ASHA Worker mode.
**Narration:**
> "India's 1.3 million ASHA workers conduct field visits in remote villages.
> VaidyaAI gives them an AI-powered patient assessment tool."

**Show:** Fill the ASHA form: Age 8, Male, Chief complaint "difficulty breathing", has fever 103°F, consciousness Alert.
**Click "Get Decision".**
**Show:** ASHA decision card — triage level, which kit medicines to give, whether to refer to PHC.

**Narration:**
> "Gemma 4 tells the ASHA worker exactly what to do with the medicine kit they carry —
> and whether to refer the child to the Primary Health Centre."

**Show:** Click "WhatsApp PHC" button → pre-filled WhatsApp report.

---

### [1:35 – 1:55] OFFLINE PROOF

**Action:** Open terminal (split screen or brief cut). Show Ollama running:
```
ollama serve
```
> Model: gemma3:4b · Status: running locally

**Narration:**
> "Here's proof: Gemma 4 runs entirely through Ollama — locally.
> No API key. No cloud. Turn off WiFi — it still works."

**Show:** Enable airplane mode on device. Use app again — still responds.

**Narration:**
> "Works in villages with zero signal. Works in disaster zones. Works on a $50 phone."

---

### [1:55 – 2:15] IMAGE ANALYSIS

**Action:** In patient mode, click the camera icon. Upload a photo of a wound or rash.
**Narration:**
> "Patients can also upload a photo — a wound, a rash, a swollen area.
> Gemma 4's vision model analyzes it alongside the symptoms."

**Show:** "🔬 Gemma 4 Visual Analysis" section appearing with image description.

---

### [2:15 – 2:30] REASONING TRANSPARENCY

**Action:** Scroll to "🧠 Gemma 4 Reasoning" section in triage result. Click to expand.
**Narration:**
> "Every decision is explainable. The AI shows its reasoning — building trust
> with patients who need to understand why they're being told to go to hospital."

---

### [2:30 – 2:50] CLOSING — IMPACT

**Narration:**
> "VaidyaAI doesn't replace doctors.
> It answers the one question that saves lives:
> *Is this serious right now?*"

**Visual:** Stats counter: "Potential reach: 1.3 billion people · 0 internet required"

**Show:** App logo. Text fades in:
> **VaidyaAI**
> *Powered by Gemma 4 + Ollama · Fully Offline · Open Source*

**Narration:**
> "Built with Gemma 4. For the people who need it most."

**Fade to black.**

---

## RECORDING TIPS

1. **Screen record** the app running (OBS, QuickTime, or phone screen record)
2. **Show Ollama in terminal** briefly — judges need to see it's truly local
3. **Use a real phone** if possible for ASHA mode — more authentic
4. **Add subtitles** for the Hindi voice demo section
5. **Background music:** Soft, hopeful instrumental (Pixabay/YouTube Audio Library)
6. **Keep energy high** — this is a pitch, not a tutorial

## YOUTUBE UPLOAD SETTINGS
- Title: `VaidyaAI — Offline AI Medical Triage for Rural India | Gemma 4 Hackathon`
- Description: Include GitHub repo link + "Powered by Gemma 4 via Ollama"
- Visibility: **Public** (judges must access without login)
- Thumbnail: Use the logo icon on dark background
