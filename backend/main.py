import json
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from models import TriageRequest, TriageResponse, HealthCheckResponse
from agent import run_triage_agent, stream_triage_agent, check_ollama_health, get_llm
from vision import analyze_image_with_gemma4
from medical_rules import (
    check_vital_sign_red_flags,
    calculate_pediatric_dose,
    detect_imci_danger_signs,
    get_icd10,
    check_contraindications,
    ASHA_KIT_MEDICINES,
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s — %(levelname)s — %(message)s")
logger = logging.getLogger(__name__)

LANGUAGES = [
    {"code": "en", "name": "English", "native": "English",  "flag": "🇬🇧", "speech_code": "en-IN"},
    {"code": "te", "name": "Telugu",  "native": "తెలుగు",   "flag": "🇮🇳", "speech_code": "te-IN"},
    {"code": "hi", "name": "Hindi",   "native": "हिंदी",    "flag": "🇮🇳", "speech_code": "hi-IN"},
    {"code": "ta", "name": "Tamil",   "native": "தமிழ்",    "flag": "🇮🇳", "speech_code": "ta-IN"},
]


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("VaidyaAI starting — WHO IMCI protocols loaded")
    health = await check_ollama_health()
    if health["ollama_connected"]:
        logger.info(f"✅ Ollama | model={health['model_name']} | available={health['model_available']}")
    else:
        logger.warning("⚠️  Ollama offline — run: ollama serve && ollama pull gemma3:4b")
    yield
    logger.info("VaidyaAI shutdown.")


app = FastAPI(
    title="VaidyaAI",
    description=(
        "Offline multilingual AI medical triage for rural India. "
        "Powered by Gemma 4 via Ollama. WHO IMCI protocols. "
        "Languages: English, Telugu, Hindi, Tamil."
    ),
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

async def _enrich_with_image(request: TriageRequest) -> tuple[str, str | None]:
    if not request.image_base64:
        return request.message, None
    try:
        analysis = await analyze_image_with_gemma4(
            request.image_base64, request.message, request.language
        )
        enriched = f"{request.message}\n\n[Gemma 4 Visual Analysis: {analysis}]"
        return enriched, analysis
    except Exception as exc:
        logger.warning(f"Vision analysis failed: {exc}")
        return request.message, None


def _apply_vital_sign_override(triage_result: dict, vital_flags: dict) -> dict:
    """
    Hard-coded IMCI safety rail: vital sign red flags override LLM triage decision.
    This ensures Gemma 4 cannot accidentally give a 'monitor' verdict for
    a child with 106°F fever or an infant with any fever.
    """
    override = vital_flags.get("override_triage")
    if override == "emergency" and triage_result.get("triage_level") not in ("emergency",):
        from prompts import TRIAGE_LABELS
        triage_result["triage_level"]  = "emergency"
        triage_result["triage_label"]  = TRIAGE_LABELS["emergency"]["label"]
        triage_result["triage_color"]  = TRIAGE_LABELS["emergency"]["color"]
        triage_result["confidence"]    = "high"
        flags_str = "; ".join(vital_flags.get("flags", []))
        triage_result["reasoning"] = f"[VITAL SIGN OVERRIDE] {flags_str}"
        if "Call 108 immediately" not in str(triage_result.get("suggested_actions", [])):
            triage_result["suggested_actions"] = (
                ["Call 108 immediately — vital sign red flag detected"] +
                triage_result.get("suggested_actions", [])
            )[:3]
    elif override == "clinic" and triage_result.get("triage_level") in ("otc", "monitor", "unknown"):
        from prompts import TRIAGE_LABELS
        triage_result["triage_level"] = "clinic"
        triage_result["triage_label"] = TRIAGE_LABELS["clinic"]["label"]
        triage_result["triage_color"] = TRIAGE_LABELS["clinic"]["color"]
    return triage_result


# ─────────────────────────────────────────────────────────────────────────────
# Routes
# ─────────────────────────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {
        "name": "VaidyaAI",
        "version": "2.0.0",
        "description": "Offline AI medical triage for rural India — Gemma 4 + Ollama",
        "protocols": ["WHO IMCI", "NHM", "JSSK", "NIKSHAY"],
        "languages": ["English", "Telugu (తెలుగు)", "Hindi (हिंदी)", "Tamil (தமிழ்)"],
        "offline": True,
        "cloud_calls": 0,
    }


@app.get("/health", response_model=HealthCheckResponse)
async def health_check():
    health = await check_ollama_health()
    return HealthCheckResponse(
        status="ok" if health["ollama_connected"] else "degraded",
        ollama_connected=health["ollama_connected"],
        model_available=health["model_available"],
        model_name=health["model_name"],
    )


@app.post("/triage", response_model=TriageResponse)
async def triage(request: TriageRequest):
    if not request.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    # IMCI danger sign detection (fast, pre-LLM)
    danger_signs = detect_imci_danger_signs(request.message)
    if danger_signs:
        logger.info(f"IMCI danger signs detected: {danger_signs}")

    enriched_message, image_analysis = await _enrich_with_image(request)
    history = [{"role": m.role, "content": m.content} for m in request.conversation_history]

    try:
        result = run_triage_agent(
            user_message=enriched_message,
            language=request.language,
            conversation_history=history,
        )
        result["image_analysis"] = image_analysis
        result["tool_used"] = "gemma4-multimodal" if image_analysis else "gemma4-text"
        result["imci_danger_signs"] = danger_signs
        return TriageResponse(**result)
    except Exception as e:
        logger.error(f"Triage error: {e}")
        raise HTTPException(status_code=503, detail="AI model unavailable. Ensure Ollama is running with: ollama serve")


@app.post("/triage/stream")
async def triage_stream(request: TriageRequest):
    if not request.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    danger_signs = detect_imci_danger_signs(request.message)
    enriched_message, image_analysis = await _enrich_with_image(request)
    history = [{"role": m.role, "content": m.content} for m in request.conversation_history]

    async def generate():
        if image_analysis:
            yield f"data: {json.dumps({'type': 'image_analysis', 'content': image_analysis})}\n\n"
        if danger_signs:
            yield f"data: {json.dumps({'type': 'danger_signs', 'signs': danger_signs})}\n\n"
        try:
            async for chunk in stream_triage_agent(enriched_message, request.language, history):
                yield f"data: {json.dumps(chunk)}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'error': str(e)})}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@app.post("/asha-triage")
async def asha_triage(request: dict):
    from prompts import ASHA_SYSTEM_PROMPTS, TRIAGE_LABELS
    from langchain_core.messages import SystemMessage, HumanMessage
    import re as _re, json as _json, time as _time

    language = request.get("language", "en")
    _t0 = _time.monotonic()

    # ── Parse vitals ─────────────────────────────────────────────────────────
    age_years = None
    try:
        age_val = request.get("age", "")
        age_years = float(str(age_val).strip()) if age_val else None
    except ValueError:
        pass

    temp_f = None
    if request.get("temperature"):
        try:
            temp_f = float(str(request["temperature"]).replace("°F", "").strip())
        except ValueError:
            pass

    weight_kg = None
    if request.get("weight_kg"):
        try:
            weight_kg = float(str(request["weight_kg"]).strip())
        except ValueError:
            pass

    hr      = request.get("pulse")
    rr      = request.get("respiratory_rate")
    spo2    = request.get("spo2")
    muac_mm = request.get("muac_mm")

    # ── Vital sign hard rules (IMCI safety rail) ──────────────────────────────
    vital_check = check_vital_sign_red_flags(
        temp_f=temp_f,
        hr=int(hr) if hr else None,
        rr=int(rr) if rr else None,
        spo2=int(spo2) if spo2 else None,
        age_years=age_years,
    )

    # ── Build patient summary for Gemma 4 ────────────────────────────────────
    has_fever = request.get("has_fever", False)
    temp_str = (f" — {temp_f}°F") if temp_f else ""
    fever_str = f"Yes{temp_str}" if has_fever else "No"

    vitals_parts = []
    if weight_kg:     vitals_parts.append(f"Weight: {weight_kg} kg")
    if hr:            vitals_parts.append(f"Pulse: {hr}/min")
    if rr:            vitals_parts.append(f"Respiratory Rate: {rr}/min")
    if spo2:          vitals_parts.append(f"SpO2: {spo2}%")
    vitals_section = ("VITALS:\n" + "\n".join(vitals_parts) + "\n") if vitals_parts else ""

    # MUAC malnutrition screening
    muac_alert = ""
    if muac_mm:
        muac_mm_int = int(muac_mm)
        if muac_mm_int < 115:
            muac_alert = f"\n🚨 MUAC {muac_mm_int}mm — SEVERE ACUTE MALNUTRITION (SAM). Refer NRC/TFC urgently."
            # SAM overrides triage to at least clinic
            if not vital_check.get("override_triage"):
                vital_check["override_triage"] = "clinic"
            vital_check["flags"].append(f"MUAC {muac_mm_int}mm — SAM (< 115mm IMCI threshold)")
        elif muac_mm_int < 125:
            muac_alert = f"\n⚠️ MUAC {muac_mm_int}mm — Moderate Acute Malnutrition (MAM). Refer for nutritional support."

    vital_flags_str = ""
    if vital_check["flags"]:
        vital_flags_str = f"\n⚠️ VITAL SIGN ALERTS (auto-detected): {'; '.join(vital_check['flags'])}"

    # ── Dosing suggestion ──────────────────────────────────────────────────────
    dosing_note = ""
    if weight_kg and age_years is not None:
        age_months = int(age_years * 12)
        dose_info = calculate_pediatric_dose("paracetamol", weight_kg, age_months)
        if "error" not in dose_info:
            dosing_note = f"\nPEDIATRIC PARACETAMOL DOSE for {weight_kg}kg: {dose_info['dose']} {dose_info['frequency']}"

    imci_signs = detect_imci_danger_signs(request.get("chief_complaint", ""))

    patient_summary = (
        f"PATIENT ASSESSMENT:\n"
        f"Age: {request.get('age')} years ({request.get('age_group', '')})\n"
        f"Gender: {request.get('gender')}\n"
        f"Chief Complaint: {request.get('chief_complaint')}\n"
        f"Duration: {request.get('duration_days')} days\n"
        f"Fever: {fever_str}\n"
        f"Breathing Difficulty: {request.get('breathing', 'None')}\n"
        f"Consciousness: {request.get('consciousness', 'Alert')}\n"
        f"Pregnancy: {request.get('pregnancy', 'N/A')}\n"
        f"{vitals_section}"
        f"Image Analysis: {request.get('image_analysis', 'None')}\n"
        f"{vital_flags_str}"
        f"{muac_alert}"
        f"{dosing_note}"
        f"\nIMCI Danger Signs Detected: {', '.join(imci_signs) if imci_signs else 'None'}"
    )

    llm = get_llm(temperature=0.1, num_predict=768)
    messages = [
        SystemMessage(content=ASHA_SYSTEM_PROMPTS.get(language, ASHA_SYSTEM_PROMPTS["en"])),
        HumanMessage(content=patient_summary),
    ]

    try:
        response = llm.invoke(messages)
        text = response.content

        # Try JSON block, then bare object
        json_match = _re.search(r'```json\s*(.*?)\s*```', text, _re.DOTALL)
        if json_match:
            result = _json.loads(json_match.group(1))
        else:
            bare = _re.search(r'\{.*\}', text, _re.DOTALL)
            result = _json.loads(bare.group()) if bare else {}

        level = result.get("triage_level", "unknown")
        label_data = TRIAGE_LABELS.get(level, TRIAGE_LABELS["unknown"])
        result["triage_label"] = label_data["label"]
        result["triage_color"] = label_data["color"]

        # Apply vital sign override AFTER LLM decision
        result = _apply_vital_sign_override(result, vital_check)

        # Enrich ICD-10 if missing
        if not result.get("icd10_code"):
            result["icd10_code"] = get_icd10(
                request.get("chief_complaint", ""),
                result.get("primary_concern", ""),
            )

        # Add dosing to from_kit if weight available and not already there
        if dosing_note and weight_kg:
            age_months = int((age_years or 0) * 12)
            dose = calculate_pediatric_dose("paracetamol", weight_kg, age_months)
            if "error" not in dose:
                kit = result.get("from_kit", [])
                if not any("paracetamol" in str(x).lower() for x in kit):
                    kit.insert(0, f"Paracetamol {dose['dose']} — {dose['frequency']}")
                result["from_kit"] = kit

        result["vital_sign_flags"] = vital_check["flags"]
        result["imci_danger_signs"] = imci_signs
        result["inference_seconds"] = round(_time.monotonic() - _t0, 1)

        # Check drug contraindications against known patient conditions
        patient_conditions = []
        if request.get("pregnancy") and request["pregnancy"] not in ("N/A", "No", ""):
            patient_conditions.append("pregnancy")
        chief = (request.get("chief_complaint") or "").lower()
        if "g6pd" in chief or "g6 pd" in chief:
            patient_conditions.append("g6pd deficiency")
        if "sulfa allerg" in chief or "sulfonamide" in chief:
            patient_conditions.append("sulfa allergy")

        if patient_conditions:
            contraindication_warnings = []
            for med in result.get("from_kit", []):
                warnings = check_contraindications(patient_conditions, med)
                contraindication_warnings.extend(warnings)
            if contraindication_warnings:
                result["contraindication_warnings"] = contraindication_warnings
                # Remove the dangerous drug from from_kit
                safe_kit = []
                for med in result.get("from_kit", []):
                    med_warnings = check_contraindications(patient_conditions, med)
                    if not any(w["severity"] == "contraindicated" for w in med_warnings):
                        safe_kit.append(med)
                    else:
                        safe_kit.append(f"⚠ AVOID {med} — {med_warnings[0]['warning']}")
                result["from_kit"] = safe_kit

        return result

    except Exception as e:
        logger.error(f"ASHA triage error: {e}")

    fallback = {
        "triage_level":      "unknown",
        "triage_label":      TRIAGE_LABELS["unknown"]["label"],
        "triage_color":      "#8E8E93",
        "primary_concern":   "Could not process assessment — please retry.",
        "icd10_code":        "R69",
        "from_kit":          [],
        "refer_to":          "PHC",
        "tell_family":       ["Visit the nearest Primary Health Centre"],
        "red_flags_to_watch": ["Any worsening of symptoms"],
        "follow_up_days":    1,
        "confidence":        "low",
        "reasoning":         "Model response parsing failed.",
        "vital_sign_flags":  vital_check["flags"],
        "imci_danger_signs": [],
    }
    # Still apply vital sign override even on fallback
    return _apply_vital_sign_override(fallback, vital_check)


@app.post("/dosing")
def dosing_calculator(body: dict):
    """
    Pediatric drug dosing calculator (WHO/IMCI/NHM).
    Returns weight-based doses from the ASHA government kit.
    """
    drug       = body.get("drug", "paracetamol")
    weight_kg  = body.get("weight_kg")
    age_months = body.get("age_months", 0)

    if not weight_kg:
        raise HTTPException(status_code=400, detail="weight_kg is required")

    try:
        weight_kg  = float(weight_kg)
        age_months = int(age_months)
    except (ValueError, TypeError):
        raise HTTPException(status_code=400, detail="Invalid weight_kg or age_months")

    result = calculate_pediatric_dose(drug, weight_kg, age_months)
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result


@app.get("/asha-kit")
def asha_kit():
    """Returns the complete official ASHA government medicine kit list."""
    return {"medicines": ASHA_KIT_MEDICINES, "source": "Government of India / NHM"}


@app.get("/languages")
def get_languages():
    return LANGUAGES


@app.post("/asha-rdt")
async def asha_rdt_reader(request: dict):
    """
    Gemma 4 multimodal RDT strip interpreter.
    Accepts a photo of a rapid diagnostic test (malaria, pregnancy, dengue, COVID-19)
    and returns a structured clinical interpretation.
    """
    import time as _time
    t0 = _time.monotonic()

    image_base64 = request.get("image_base64")
    test_type    = request.get("test_type", "malaria").lower()  # malaria|pregnancy|dengue|covid
    language     = request.get("language", "en")

    if not image_base64:
        raise HTTPException(status_code=400, detail="image_base64 is required")

    LANG_INSTR = {
        "en": "Respond in English.",
        "te": "తెలుగులో సమాధానం ఇవ్వండి.",
        "hi": "हिंदी में जवाब दें।",
        "ta": "தமிழில் பதிலளியுங்கள்.",
    }

    TEST_CONTEXT = {
        "malaria": {
            "bands": "Control band (C) always appears if test is valid. Test band (T) appears if POSITIVE. PF band = Plasmodium falciparum. PV band = Plasmodium vivax.",
            "action_pos": "MALARIA POSITIVE — refer to PHC for blood smear confirmation and artemisinin-based combination therapy (ACT). Do NOT give chloroquine without species confirmation.",
            "action_neg": "Malaria negative. If fever continues, check for dengue or typhoid at PHC.",
            "action_invalid": "Invalid test (no C band). Repeat with a fresh RDT strip from the kit.",
        },
        "pregnancy": {
            "bands": "Control band (C) always appears. Test band (T) appears if POSITIVE (pregnant). Two bands = pregnant.",
            "action_pos": "PREGNANCY POSITIVE — register under JSSK scheme. Schedule first ante-natal check at PHC within 1 week. Give IFA tablets from kit.",
            "action_neg": "Pregnancy negative. If period is late, retest in 1 week.",
            "action_invalid": "Invalid test. Repeat with clean hands and fresh morning urine sample.",
        },
        "dengue": {
            "bands": "NS1 band appears within 24–48h of fever onset. IgM/IgG bands appear after day 5. Any test band = suspect dengue.",
            "action_pos": "DENGUE SUSPECT — refer to PHC immediately. No aspirin or ibuprofen (bleeding risk). Paracetamol only for fever. Watch for bleeding, severe abdominal pain.",
            "action_neg": "Dengue NS1/antibody negative. If fever + severe body ache + retro-orbital pain continues, send to PHC.",
            "action_invalid": "Invalid test. Ensure sample volume is correct (3 drops blood or serum).",
        },
        "covid": {
            "bands": "Control band (C) confirms test validity. Test band (T) appears if COVID-19 POSITIVE.",
            "action_pos": "COVID-19 POSITIVE — Isolate patient for 5 days. Paracetamol for fever. Monitor SpO₂. If SpO₂ drops below 94%, refer to hospital immediately.",
            "action_neg": "COVID-19 negative. Consider other respiratory infections if symptoms persist.",
            "action_invalid": "Invalid test. Ensure nasal swab is properly inserted and buffer added.",
        },
    }

    ctx = TEST_CONTEXT.get(test_type, TEST_CONTEXT["malaria"])
    lang_instr = LANG_INSTR.get(language, LANG_INSTR["en"])

    prompt = f"""You are a trained medical laboratory technician reviewing a photo of a {test_type.upper()} rapid diagnostic test (RDT) strip submitted by an ASHA worker in rural India.

RDT BAND INTERPRETATION GUIDE:
{ctx["bands"]}

VISUAL ASSESSMENT TASK:
1. Identify whether the Control band (C) is visible — if NO C band, the test is INVALID
2. Identify whether any Test band(s) (T, PF, PV, NS1, IgM, IgG) are visible
3. Classify the result as: POSITIVE / NEGATIVE / INVALID / UNCERTAIN
4. Note band intensity: strong/faint/absent for each band
5. State confidence in your reading: high/medium/low

Respond ONLY with valid JSON:
{{
  "result": "positive|negative|invalid|uncertain",
  "confidence": "high|medium|low",
  "c_band": "visible|absent",
  "t_band": "visible|faint|absent",
  "interpretation": "1-2 sentence plain language explanation of what you see",
  "action": "What the ASHA worker should do next"
}}

{lang_instr}
Do not add any text outside the JSON object."""

    import os, httpx as _httpx, json as _json, re as _re
    base_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    model    = os.getenv("OLLAMA_MODEL", "gemma3:4b")

    payload = {
        "model": model,
        "prompt": prompt,
        "images": [image_base64],
        "stream": False,
        "options": {"temperature": 0.05, "num_predict": 350},
    }

    try:
        async with _httpx.AsyncClient(timeout=45.0) as client:
            r = await client.post(f"{base_url}/api/generate", json=payload)
            r.raise_for_status()
            raw = r.json().get("response", "").strip()

        # Parse JSON from response
        json_match = _re.search(r'\{.*\}', raw, _re.DOTALL)
        if json_match:
            parsed = _json.loads(json_match.group())
        else:
            parsed = {
                "result": "uncertain",
                "confidence": "low",
                "c_band": "unknown",
                "t_band": "unknown",
                "interpretation": raw[:200] if raw else "Could not interpret image.",
                "action": "Please show the RDT strip to a trained health worker or PHC lab technician.",
            }

        # Inject correct next-step action based on result
        result_key = parsed.get("result", "uncertain")
        if result_key == "positive":
            parsed["action"] = ctx["action_pos"]
        elif result_key == "negative":
            parsed["action"] = ctx["action_neg"]
        elif result_key == "invalid":
            parsed["action"] = ctx["action_invalid"]

        elapsed = round(_time.monotonic() - t0, 2)
        parsed["test_type"] = test_type
        parsed["inference_seconds"] = elapsed
        return parsed

    except Exception as exc:
        logger.error(f"RDT reader error: {exc}")
        raise HTTPException(status_code=503, detail="Gemma 4 vision unavailable. Ensure Ollama is running.")


@app.get("/immunization-schedule")
def immunization_schedule(age_months: int):
    """
    India Universal Immunization Programme (UIP) schedule.
    Returns overdue and upcoming vaccines for a child of given age (months).
    """
    SCHEDULE = [
        {"vaccine": "BCG",              "at_months": 0,   "description": "TB protection — given at birth"},
        {"vaccine": "OPV-0",            "at_months": 0,   "description": "Oral Polio — birth dose"},
        {"vaccine": "Hepatitis B (HepB-0)", "at_months": 0, "description": "Hepatitis B — birth dose"},
        {"vaccine": "OPV-1 + Penta-1", "at_months": 1.5, "description": "Polio + DPT + Hep B + Hib"},
        {"vaccine": "OPV-2 + Penta-2", "at_months": 2.5, "description": "Polio + DPT + Hep B + Hib"},
        {"vaccine": "OPV-3 + Penta-3 + IPV", "at_months": 3.5, "description": "Polio + DPT + Hep B + Hib + Injectable Polio"},
        {"vaccine": "Vitamin A (1st)",  "at_months": 9,   "description": "Vitamin A dose 1 — 100,000 IU"},
        {"vaccine": "Measles-Rubella 1 + JE", "at_months": 9, "description": "MR vaccine + Japanese Encephalitis (endemic districts)"},
        {"vaccine": "DPT Booster-1 + OPV Booster + MR-2", "at_months": 16, "description": "Booster doses"},
        {"vaccine": "Vitamin A (2nd–9th)", "at_months": 15, "description": "Vitamin A every 6 months until 5 years"},
        {"vaccine": "DPT Booster-2",   "at_months": 60,  "description": "Age 5 — pre-school booster"},
        {"vaccine": "TT (Tetanus)",     "at_months": 120, "description": "Age 10 — school booster"},
    ]

    overdue  = [v for v in SCHEDULE if v["at_months"] <= age_months]
    upcoming = [v for v in SCHEDULE if v["at_months"] > age_months][:3]

    return {
        "age_months": age_months,
        "overdue_count": len(overdue),
        "overdue": overdue[-3:],   # most recent 3 that should have been given
        "upcoming": upcoming,
        "source": "India Universal Immunization Programme (UIP) / NHM",
    }


@app.post("/asha-snakebite")
async def asha_snakebite(request: dict):
    """
    Gemma 4 multimodal snakebite identifier.
    Identifies India's Big 4 venomous snakes from a photo and gives WHO-aligned first aid.
    """
    import time as _time, os, httpx as _httpx, json as _json, re as _re
    t0 = _time.monotonic()

    image_base64 = request.get("image_base64")
    language     = request.get("language", "en")

    if not image_base64:
        raise HTTPException(status_code=400, detail="image_base64 is required")

    LANG_INSTR = {
        "en": "Respond in English.",
        "te": "తెలుగులో సమాధానం ఇవ్వండి.",
        "hi": "हिंदी में जवाब दें।",
        "ta": "தமிழில் பதிலளியுங்கள்.",
    }

    prompt = f"""You are an expert herpetologist and emergency medicine physician reviewing a photo submitted by an ASHA worker after a reported snakebite in rural India.

INDIA'S BIG 4 VENOMOUS SNAKES:
1. Spectacled Cobra (Naja naja) — hood with spectacle marking, neurotoxic venom
2. Common Krait (Bungarus caeruleus) — black/dark with white bands, potently neurotoxic, nocturnal
3. Russell's Viper (Daboia russelii) — brown with dark oval chain pattern, hemotoxic + cytotoxic
4. Saw-Scaled Viper (Echis carinatus) — small, pear-shaped head, rough zigzag scales, hemotoxic

ASSESSMENT TASK:
1. Identify the snake species if visible (or classify as unknown/non-venomous)
2. Assess venom type: neurotoxic / hemotoxic / cytotoxic / unknown / non-venomous
3. State urgency: emergency / monitor

Respond ONLY with valid JSON:
{{
  "identified_species": "Species name or 'Unknown' or 'Non-venomous/unclear'",
  "confidence": "high|medium|low",
  "venom_type": "neurotoxic|hemotoxic|cytotoxic|unknown|non-venomous",
  "urgency": "emergency|monitor",
  "first_aid": ["Step 1", "Step 2", "Step 3"],
  "do_not": ["Do not do X", "Do not do Y"],
  "antivenom_note": "Brief note about polyvalent antivenom availability",
  "reasoning": "1-2 sentences on identifying features you observed"
}}

CRITICAL FIRST AID RULES (always include):
- Immobilize the bitten limb below heart level
- Remove rings/tight clothing from the affected area
- Do NOT cut, suck, tourniquet, or apply ice
- Call 108 and transport to government hospital with antivenom stock
- Polyvalent antivenom covers all Big 4 — available free at government hospitals

{LANG_INSTR.get(language, LANG_INSTR["en"])}
Do not add any text outside the JSON object."""

    base_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    model    = os.getenv("OLLAMA_MODEL", "gemma3:4b")

    payload = {
        "model": model,
        "prompt": prompt,
        "images": [image_base64],
        "stream": False,
        "options": {"temperature": 0.05, "num_predict": 500},
    }

    try:
        async with _httpx.AsyncClient(timeout=45.0) as client:
            r = await client.post(f"{base_url}/api/generate", json=payload)
            r.raise_for_status()
            raw = r.json().get("response", "").strip()

        json_match = _re.search(r'\{.*\}', raw, _re.DOTALL)
        if json_match:
            parsed = _json.loads(json_match.group())
        else:
            parsed = {
                "identified_species": "Unknown",
                "confidence": "low",
                "venom_type": "unknown",
                "urgency": "emergency",
                "first_aid": [
                    "Immobilize the bitten limb below heart level",
                    "Remove rings and tight clothing",
                    "Call 108 immediately and go to government hospital",
                ],
                "do_not": [
                    "Do NOT cut or suck the wound",
                    "Do NOT apply tourniquet or ice",
                    "Do NOT give aspirin or alcohol",
                ],
                "antivenom_note": "Polyvalent antivenom covers Big 4 — available free at government hospitals",
                "reasoning": raw[:200] if raw else "Could not analyze image.",
            }

        parsed["inference_seconds"] = round(_time.monotonic() - t0, 2)
        return parsed

    except Exception as exc:
        logger.error(f"Snakebite identifier error: {exc}")
        raise HTTPException(status_code=503, detail="Gemma 4 vision unavailable. Ensure Ollama is running.")


@app.post("/asha-vvm")
async def asha_vvm_reader(request: dict):
    """
    Gemma 4 multimodal Vaccine Vial Monitor (VVM) reader.
    VVM is a WHO heat-damage indicator: inner square vs outer circle relative darkness.
    """
    import time as _time, os, httpx as _httpx, json as _json, re as _re
    t0 = _time.monotonic()

    image_base64 = request.get("image_base64")
    language     = request.get("language", "en")

    if not image_base64:
        raise HTTPException(status_code=400, detail="image_base64 is required")

    LANG_INSTR = {
        "en": "Respond in English.",
        "te": "తెలుగులో సమాధానం ఇవ్వండి.",
        "hi": "हिंदी में जवाब दें।",
        "ta": "தமிழில் பதிலளியுங்கள்.",
    }

    prompt = f"""You are a WHO-trained cold chain officer reviewing a photo of a vaccine vial label with a Vaccine Vial Monitor (VVM) submitted by an ASHA worker in rural India.

VVM READING GUIDE:
The VVM is a small circle on the vaccine label. Inside it is a smaller square (inner square).
- STAGE 1 (USABLE): Inner square is LIGHTER than outer circle → Vaccine is safe to use
- STAGE 2 (USABLE): Inner square color matches outer circle → Use immediately, end of life
- STAGE 3 (DISCARD): Inner square is DARKER than outer circle → Discard, heat damaged
- STAGE 4 (DISCARD): Inner square is much darker, almost black → Discard immediately

TASK:
1. Locate the VVM circle on the vaccine vial label
2. Compare inner square vs outer circle darkness
3. Classify into Stage 1, 2, 3, or 4
4. State whether vaccine should be used or discarded

Respond ONLY with valid JSON:
{{
  "vvm_stage": 1,
  "usable": true,
  "inner_square": "lighter|same|darker|much_darker",
  "action": "USE — vaccine is safe" or "DISCARD — heat damage detected",
  "confidence": "high|medium|low",
  "cold_chain_note": "Brief note for ASHA worker",
  "reasoning": "1-2 sentences describing what you see"
}}

{LANG_INSTR.get(language, LANG_INSTR["en"])}
Do not add any text outside the JSON object."""

    base_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    model    = os.getenv("OLLAMA_MODEL", "gemma3:4b")

    payload = {
        "model": model,
        "prompt": prompt,
        "images": [image_base64],
        "stream": False,
        "options": {"temperature": 0.05, "num_predict": 300},
    }

    try:
        async with _httpx.AsyncClient(timeout=40.0) as client:
            r = await client.post(f"{base_url}/api/generate", json=payload)
            r.raise_for_status()
            raw = r.json().get("response", "").strip()

        json_match = _re.search(r'\{.*\}', raw, _re.DOTALL)
        if json_match:
            parsed = _json.loads(json_match.group())
        else:
            parsed = {
                "vvm_stage": None,
                "usable": None,
                "inner_square": "unknown",
                "action": "Cannot read VVM — show to PHC cold chain officer",
                "confidence": "low",
                "cold_chain_note": "Take a clearer photo in good lighting with the VVM circle visible.",
                "reasoning": raw[:200] if raw else "Could not analyze VVM.",
            }

        parsed["inference_seconds"] = round(_time.monotonic() - t0, 2)
        return parsed

    except Exception as exc:
        logger.error(f"VVM reader error: {exc}")
        raise HTTPException(status_code=503, detail="Gemma 4 vision unavailable. Ensure Ollama is running.")


@app.post("/translate")
async def translate_text(request: dict):
    """
    Gemma 4 medical translation between English and Indian languages.
    Used for Doctor ↔ Patient real-time translation mode.
    """
    import time as _time
    from langchain_core.messages import SystemMessage, HumanMessage
    t0 = _time.monotonic()

    text      = request.get("text", "").strip()
    from_lang = request.get("from_lang", "en")
    to_lang   = request.get("to_lang", "te")
    mode      = request.get("mode", "doctor_to_patient")  # or patient_to_doctor

    if not text:
        raise HTTPException(status_code=400, detail="text is required")

    LANG_NAMES = {
        "en": "English",
        "te": "Telugu (తెలుగు)",
        "hi": "Hindi (हिंदी)",
        "ta": "Tamil (தமிழ்)",
    }

    from_name = LANG_NAMES.get(from_lang, "English")
    to_name   = LANG_NAMES.get(to_lang, "Telugu")

    if mode == "doctor_to_patient":
        system = f"""You are a medical interpreter specializing in translating doctor's instructions to patients in rural India.
Translate the following medical text from {from_name} to {to_name}.
Rules:
1. Use simple, everyday vocabulary that a patient with no medical education can understand
2. Keep the medical meaning accurate — do not simplify to the point of losing clinical meaning
3. Translate completely — do not leave any part in the original language
4. Output ONLY the translated text, nothing else. No explanation, no labels."""
    else:
        system = f"""You are a medical interpreter translating a rural patient's description of symptoms to a doctor.
Translate the following from {from_name} to {to_name}.
Rules:
1. Preserve all symptom details accurately
2. If the patient uses colloquial terms for body parts or symptoms, translate to correct medical English
3. Output ONLY the translated text, nothing else. No explanation, no labels."""

    llm = get_llm(temperature=0.1, num_predict=512)
    messages = [SystemMessage(content=system), HumanMessage(content=text)]

    try:
        response = llm.invoke(messages)
        translated = response.content.strip()
        return {
            "original": text,
            "translated": translated,
            "from_lang": from_lang,
            "to_lang": to_lang,
            "mode": mode,
            "inference_seconds": round(_time.monotonic() - t0, 2),
        }
    except Exception as e:
        logger.error(f"Translation error: {e}")
        raise HTTPException(status_code=503, detail="AI model unavailable. Ensure Ollama is running.")


@app.post("/pregnancy-tracker")
async def pregnancy_tracker(request: dict):
    """
    JSSK-aligned pregnancy tracker.
    Returns ANC schedule, JSSK entitlements, warning signs, and IFA dosing.
    """
    import time as _time, datetime as _dt, re as _re, json as _json
    from langchain_core.messages import SystemMessage, HumanMessage
    t0 = _time.monotonic()

    language = request.get("language", "en")
    lmp_str  = request.get("lmp_date", "")   # "YYYY-MM-DD"
    age      = request.get("age", "")
    gravida  = request.get("gravida", 1)      # total pregnancies
    para     = request.get("para", 0)         # previous deliveries

    # Calculate gestational age
    weeks_pregnant = None
    edd_str = None
    trimester = None
    try:
        lmp = _dt.date.fromisoformat(lmp_str)
        today = _dt.date.today()
        days_pregnant = (today - lmp).days
        weeks_pregnant = days_pregnant // 7
        edd = lmp + _dt.timedelta(days=280)
        edd_str = f"{edd.day} {edd.strftime('%B %Y')}" if hasattr(edd, 'strftime') else str(edd)
        if weeks_pregnant <= 12:
            trimester = "First trimester (0–12 weeks)"
        elif weeks_pregnant <= 28:
            trimester = "Second trimester (13–28 weeks)"
        else:
            trimester = "Third trimester (29–40 weeks)"
    except Exception:
        weeks_pregnant = None

    # Build ANC visit schedule
    ANC_VISITS = [
        {"visit": "ANC-1", "timing": "Before 12 weeks", "weeks_target": 12,
         "key_tasks": ["Register pregnancy at PHC/Sub-centre", "Blood tests: Hb, blood group, blood sugar, HIV, VDRL", "Urine protein + sugar", "Weight + BP", "Start IFA 1 tablet daily", "Folic acid 5mg daily", "TT-1 injection"]},
        {"visit": "ANC-2", "timing": "14–26 weeks", "weeks_target": 26,
         "key_tasks": ["BP + weight + fetal heart sounds", "Hb test", "Urine test", "TT-2 injection (4 weeks after TT-1)", "Ultrasound if not done", "IFA compliance check"]},
        {"visit": "ANC-3", "timing": "28–34 weeks", "weeks_target": 34,
         "key_tasks": ["BP + weight + fetal position", "Hb recheck", "Urine protein", "Calcium 500mg twice daily", "Danger signs counselling", "Birth preparedness plan"]},
        {"visit": "ANC-4", "timing": "36 weeks onward", "weeks_target": 40,
         "key_tasks": ["Fetal presentation check", "BP monitoring", "JSSK delivery plan — facility birth", "Register for 102 ambulance", "Postpartum care counselling"]},
    ]

    # Calculate which ANC visits are overdue
    overdue_anc = []
    upcoming_anc = []
    if weeks_pregnant is not None:
        for v in ANC_VISITS:
            if weeks_pregnant >= v["weeks_target"]:
                overdue_anc.append(v)
            else:
                upcoming_anc.append(v)

    JSSK_ENTITLEMENTS = [
        "Free ANC checkups at Government health facility",
        "Free institutional delivery (Normal and C-Section)",
        "Free drugs and consumables during delivery",
        "Free diet during stay (3 days normal, 7 days C-Section)",
        "Free blood if required",
        "Free transport via 102 ambulance (call 102)",
        "Free post-natal care for mother and newborn",
        "Janani Suraksha Yojana (JSY) cash incentive after delivery",
        "Newborn care and immunization at facility",
    ]

    WARNING_SIGNS = [
        "Severe headache or blurred vision → EMERGENCY — Call 108",
        "Swelling of face, hands, or feet → Go to PHC today",
        "Vaginal bleeding at any time → EMERGENCY — Call 102",
        "Fever > 100°F → PHC same day",
        "Reduced or absent fetal movements (after 28 weeks) → PHC immediately",
        "Severe abdominal pain → EMERGENCY — Call 102",
        "Fitting/convulsions → EMERGENCY — Call 108 (eclampsia)",
        "Difficulty breathing → EMERGENCY",
    ]

    IFA_SCHEDULE = {
        "dose": "1 IFA tablet (100mg iron + 0.5mg folic acid)",
        "frequency": "Once daily at night with food",
        "duration": "180 days minimum during pregnancy + 180 days postpartum",
        "tip": "Take at night to reduce nausea. Eat citrus fruit or amla to boost iron absorption. Stools will turn dark — this is normal.",
    }

    summary = (
        f"Pregnancy assessment for G{gravida}P{para} woman, age {age}.\n"
        f"{'LMP: ' + lmp_str + f' — {weeks_pregnant} weeks pregnant, {trimester}. EDD: {edd_str}' if weeks_pregnant is not None else 'LMP not provided.'}\n"
        f"Overdue ANC visits: {len(overdue_anc)}. Upcoming: {len(upcoming_anc)}."
    )

    return {
        "weeks_pregnant": weeks_pregnant,
        "trimester": trimester,
        "edd": edd_str,
        "anc_overdue": overdue_anc,
        "anc_upcoming": upcoming_anc[:2],
        "jssk_entitlements": JSSK_ENTITLEMENTS,
        "warning_signs": WARNING_SIGNS,
        "ifa_schedule": IFA_SCHEDULE,
        "gravida": gravida,
        "para": para,
        "summary": summary,
        "inference_seconds": round(_time.monotonic() - t0, 3),
    }


@app.get("/health-bulletin")
async def health_bulletin(language: str = "en"):
    """
    Daily health bulletin — date-seeded tip from Gemma 4 relevant to rural India.
    Changes each day. Covers seasonal, maternal, child, and preventive health.
    """
    import time as _time, datetime as _dt
    from langchain_core.messages import SystemMessage, HumanMessage
    t0 = _time.monotonic()

    today = _dt.date.today()
    month = today.month
    day_of_year = today.timetuple().tm_yday

    LANG_NAMES = {
        "en": "English",
        "te": "Telugu (తెలుగు)",
        "hi": "Hindi (हिंदी)",
        "ta": "Tamil (தமிழ்)",
    }

    SEASONAL_TOPICS = {
        (12, 1, 2): "cold weather health — hypothermia prevention in infants, keeping newborns warm, mustard oil massage",
        (3, 4, 5): "summer heat health — heat stroke prevention, ORS, keeping children hydrated, hand-washing",
        (6, 7, 8, 9): "monsoon health — malaria prevention, water purification, dengue awareness, diarrhoea in children",
        (10, 11): "post-monsoon — mosquito control, typhoid prevention, vitamin A supplementation",
    }

    current_season_topics = "general rural health"
    for months, topic in SEASONAL_TOPICS.items():
        if month in months:
            current_season_topics = topic
            break

    TOPIC_ROTATION = [
        "handwashing with soap — when and how, preventing diarrhoea deaths in children",
        "exclusive breastfeeding for 6 months — benefits, positioning, problems",
        "malaria prevention — mosquito nets, repellent, early fever reporting",
        "TB awareness — 2-week cough, NIKSHAY free treatment",
        "maternal nutrition — iron-rich foods, IFA tablets, importance of institutional delivery",
        "ORS preparation — the correct 1 litre water + 6 teaspoon sugar + 1 teaspoon salt recipe",
        "child growth monitoring — weight-for-age, MUAC screening, SAM/MAM",
        "immunization — UIP schedule, why it matters, addressing vaccine hesitancy",
        "snakebite first aid — immobilize, no tourniquet, go to government hospital",
        "clean cooking — reducing smoke in kitchen, LPG PMUY, eye and lung disease prevention",
        "menstrual health — hygiene, pain, anaemia in adolescent girls",
        "safe delivery — danger signs, 102 ambulance, JSSK free delivery",
        "diabetes and hypertension — symptoms, free testing at NPHCE, lifestyle",
        "eye health — trachoma, childhood blindness, free surgery schemes",
        "mental health — depression, anxiety, NIMHANS helpline 080-46110007",
        "water purification — boiling, chlorine tablets, ORS for diarrhoea",
    ]

    topic_index = day_of_year % len(TOPIC_ROTATION)
    todays_topic = TOPIC_ROTATION[topic_index]
    lang_name = LANG_NAMES.get(language, "English")

    system = f"""You are a rural health educator creating a daily health tip for ASHA workers and patients in India.
Today's topic: {todays_topic}
Season context: {current_season_topics}

Create a health bulletin with:
1. A clear, actionable title (under 10 words)
2. Three practical bullet points (1-2 sentences each) that a villager can act on today
3. One "Did you know?" fact specific to rural India

Write entirely in {lang_name}. Use simple language. Be warm and encouraging, not preachy.
Format as valid JSON only:
{{
  "title": "Bulletin title",
  "date": "{today.day} {today.strftime('%B %Y')}",
  "topic": "{todays_topic[:50]}",
  "tips": ["Tip 1", "Tip 2", "Tip 3"],
  "did_you_know": "Interesting fact"
}}"""

    llm = get_llm(temperature=0.7, num_predict=400)
    messages = [SystemMessage(content=system), HumanMessage(content="Generate today's health bulletin.")]

    import re as _re, json as _json
    try:
        response = llm.invoke(messages)
        raw = response.content.strip()
        json_match = _re.search(r'\{.*\}', raw, _re.DOTALL)
        if json_match:
            parsed = _json.loads(json_match.group())
        else:
            parsed = {
                "title": "Daily Health Tip",
                "date": f"{today.day} {today.strftime('%B %Y')}",
                "topic": todays_topic[:50],
                "tips": [raw[:300] if raw else "Stay hydrated. Wash hands before meals. Give children ORS for diarrhoea."],
                "did_you_know": "India provides free treatment for TB through NIKSHAY. If you cough for 2+ weeks, visit your nearest PHC.",
            }
        parsed["inference_seconds"] = round(_time.monotonic() - t0, 2)
        parsed["language"] = language
        return parsed
    except Exception as e:
        logger.error(f"Health bulletin error: {e}")
        return {
            "title": "Daily Health Tip",
            "date": f"{today.day} {today.strftime('%B %Y')}",
            "topic": todays_topic[:50],
            "tips": [
                "Wash hands with soap before eating and after using the toilet.",
                "Give children ORS immediately when diarrhoea starts — do not wait.",
                "If fever lasts more than 3 days, visit the PHC — do not self-medicate.",
            ],
            "did_you_know": "India provides free malaria testing at all PHCs. Early treatment prevents severe disease.",
            "inference_seconds": round(_time.monotonic() - t0, 2),
            "language": language,
        }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
