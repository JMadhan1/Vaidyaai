"""
VaidyaAI Medical Rules Engine
WHO IMCI-aligned clinical decision support for rural India
"""

# ── ASHA Official Government Drug Kit (NHM-issued) ──────────────────────────
ASHA_KIT_MEDICINES = [
    "ORS packets",
    "Zinc sulfate 20mg",
    "Paracetamol 500mg",
    "Cotrimoxazole 480mg",
    "Iron + Folic Acid (IFA)",
    "Vitamin A 200,000 IU",
    "Chloroquine 500mg",
    "Albendazole 400mg",
    "Misoprostol 600mcg",
    "Oral Contraceptive Pills",
    "Condoms",
    "Pregnancy test strips",
    "Gentian Violet",
    "Bandages + gauze",
    "Dettol antiseptic",
    "MUAC tape",
    "Digital thermometer",
]

# ── Pediatric Drug Dosing (WHO/IMCI + NHM guidelines) ───────────────────────
PEDIATRIC_DOSING = {
    "paracetamol": {
        "dose_mg_per_kg": 15,
        "frequency": "every 6 hours as needed (max 4 doses/day)",
        "max_dose_mg": 1000,
        "weight_bands": [
            {"min_kg": 3,  "max_kg": 6,   "dose_mg": 60,   "form": "syrup 2.5ml"},
            {"min_kg": 6,  "max_kg": 10,  "dose_mg": 120,  "form": "syrup 5ml"},
            {"min_kg": 10, "max_kg": 15,  "dose_mg": 180,  "form": "syrup 7.5ml"},
            {"min_kg": 15, "max_kg": 25,  "dose_mg": 250,  "form": "half tablet"},
            {"min_kg": 25, "max_kg": 40,  "dose_mg": 500,  "form": "1 tablet"},
            {"min_kg": 40, "max_kg": 999, "dose_mg": 1000, "form": "2 tablets"},
        ],
        "notes": "For fever >38.5°C. Do not give if child is vomiting everything — needs IV.",
    },
    "ors": {
        "formula": "weight_kg * 75",
        "unit": "ml over 4 hours",
        "frequency": "Reassess after 4 hours",
        "notes": "Mild-moderate dehydration. If severe (sunken eyes, skin pinch stays), go to hospital.",
    },
    "zinc": {
        "dose_by_age": {"under_6mo": 10, "6mo_plus": 20},
        "frequency": "once daily for 14 days",
        "form": "dispersible tablet dissolved in ORS",
        "notes": "Always give with ORS for diarrhoea in children under 5.",
    },
    "albendazole": {
        "dose_by_age": {"under_2yr": 200, "2yr_plus": 400},
        "frequency": "single dose",
        "notes": "Deworming every 6 months for all children 1-19 years (NHM programme).",
    },
    "cotrimoxazole": {
        "weight_bands": [
            {"min_kg": 5,  "max_kg": 10,  "dose_mg": 240, "form": "half tablet"},
            {"min_kg": 10, "max_kg": 20,  "dose_mg": 480, "form": "1 tablet"},
            {"min_kg": 20, "max_kg": 999, "dose_mg": 960, "form": "2 tablets"},
        ],
        "frequency": "twice daily for 5 days",
        "notes": "For ARI (mild pneumonia), UTI. CONTRAINDICATED if sulfa allergy.",
    },
    "vitamin_a": {
        "dose_by_age": {"under_12mo": 100000, "12mo_plus": 200000},
        "frequency": "Single dose — give immediately for measles or severe malnutrition",
        "notes": "Vitamin A every 6 months under NHM programme for children 6mo–5yr.",
    },
    "iron_folic_acid": {
        "adult_dose": "1 tablet daily",
        "pregnancy_dose": "1 tablet daily (180 tablets during pregnancy — JSSK scheme)",
        "adolescent_dose": "1 tablet weekly (WIFS programme)",
        "notes": "Take after food to reduce nausea. Stools may become dark — reassure patient.",
    },
}


def calculate_pediatric_dose(drug: str, weight_kg: float, age_months: int) -> dict:
    """
    Returns dosing instructions for ASHA kit medicines.
    Based on WHO IMCI and Indian NHM guidelines.
    """
    key = drug.lower().replace("-", "_").replace(" ", "_")

    if key not in PEDIATRIC_DOSING:
        return {"error": f"'{drug}' not in ASHA kit dosing database"}

    info = PEDIATRIC_DOSING[key]

    if key == "ors":
        vol = int(weight_kg * 75)
        return {"drug": "ORS", "dose": f"{vol} ml over 4 hours",
                "frequency": info["frequency"], "notes": info["notes"]}

    if key == "zinc":
        dose = info["dose_by_age"]["under_6mo"] if age_months < 6 else info["dose_by_age"]["6mo_plus"]
        return {"drug": "Zinc", "dose": f"{dose}mg dispersible tablet",
                "frequency": info["frequency"], "form": info["form"], "notes": info["notes"]}

    if key == "albendazole":
        dose = info["dose_by_age"]["under_2yr"] if age_months < 24 else info["dose_by_age"]["2yr_plus"]
        return {"drug": "Albendazole", "dose": f"{dose}mg",
                "frequency": info["frequency"], "notes": info["notes"]}

    if key == "vitamin_a":
        dose = info["dose_by_age"]["under_12mo"] if age_months < 12 else info["dose_by_age"]["12mo_plus"]
        return {"drug": "Vitamin A", "dose": f"{dose:,} IU",
                "frequency": info["frequency"], "notes": info["notes"]}

    if key == "iron_folic_acid":
        return {"drug": "Iron + Folic Acid", "dose": info["adult_dose"],
                "frequency": "daily", "notes": info["notes"]}

    if "weight_bands" in info:
        for band in info["weight_bands"]:
            if band["min_kg"] <= weight_kg < band["max_kg"]:
                return {
                    "drug": key.replace("_", " ").title(),
                    "dose": f"{band['dose_mg']}mg ({band['form']})",
                    "frequency": info.get("frequency", "as directed"),
                    "notes": info.get("notes", ""),
                }

    if "dose_mg_per_kg" in info:
        raw = weight_kg * info["dose_mg_per_kg"]
        dose = min(raw, info.get("max_dose_mg", raw))
        return {"drug": key.replace("_", " ").title(), "dose": f"{dose:.0f}mg",
                "frequency": info.get("frequency", "as directed"), "notes": info.get("notes", "")}

    return {"error": "Could not calculate dose for given weight/age"}


# ── Vital Sign Red Flag Engine ───────────────────────────────────────────────
def check_vital_sign_red_flags(
    temp_f: float = None,
    hr: int = None,
    rr: int = None,
    spo2: int = None,
    age_years: float = None,
) -> dict:
    """
    Hard clinical rules based on IMCI/WHO thresholds.
    Returns override_triage='emergency'|'clinic'|None plus flag list.
    These CANNOT be overridden by LLM output — they are safety rails.
    """
    flags = []
    is_emergency = False
    is_clinic = False

    is_infant = age_years is not None and age_years < 0.25   # under 3 months
    is_under5 = age_years is not None and age_years < 5

    # ── Temperature ──
    if temp_f is not None:
        if is_infant and temp_f >= 100.4:
            flags.append(f"Infant (<3mo) fever {temp_f}°F — ALWAYS emergency")
            is_emergency = True
        elif temp_f >= 104.0:
            flags.append(f"Very high fever {temp_f}°F — febrile seizure risk")
            is_emergency = True
        elif temp_f >= 103.0:
            flags.append(f"High fever {temp_f}°F — clinical assessment needed")
            is_clinic = True
        elif temp_f <= 96.0:
            flags.append(f"Hypothermia {temp_f}°F — possible sepsis")
            is_emergency = True

    # ── Respiratory Rate (IMCI age-specific thresholds) ──
    if rr is not None:
        if age_years is not None:
            if age_years < (2 / 12):      thresh = 60  # <2 months
            elif age_years < 1:           thresh = 50  # 2-12 months
            elif age_years < 5:           thresh = 40  # 1-5 years
            else:                         thresh = 30  # adult
            if rr >= thresh:
                flags.append(f"Fast breathing {rr}/min (IMCI threshold: {thresh}) — pneumonia")
                is_emergency = True if is_under5 else False
                is_clinic = True
        elif rr >= 30:
            flags.append(f"Elevated respiratory rate {rr}/min")
            is_clinic = True

    # ── SpO2 ──
    if spo2 is not None:
        if spo2 < 90:
            flags.append(f"CRITICAL: SpO2 {spo2}% — severe hypoxia")
            is_emergency = True
        elif spo2 < 94:
            flags.append(f"Low SpO2 {spo2}% — needs oxygen")
            is_clinic = True

    # ── Heart Rate ──
    if hr is not None:
        if is_under5 and (hr > 180 or hr < 60):
            flags.append(f"Abnormal HR {hr}/min in child")
            is_emergency = True
        elif not is_under5:
            if hr > 150 or hr < 40:
                flags.append(f"CRITICAL: HR {hr}/min — cardiac emergency")
                is_emergency = True
            elif hr > 120:
                flags.append(f"Tachycardia {hr}/min — investigate")
                is_clinic = True

    return {
        "is_emergency": is_emergency,
        "is_clinic": is_clinic,
        "flags": flags,
        "override_triage": "emergency" if is_emergency else ("clinic" if is_clinic else None),
    }


# ── IMCI Danger Sign Detection ───────────────────────────────────────────────
IMCI_DANGER_PHRASES = [
    "not able to drink", "cannot drink", "can't drink", "refuses to drink",
    "vomiting everything", "vomits everything", "vomiting all food",
    "convulsion", "seizure", "fits", "jerking",
    "unconscious", "unresponsive", "cannot wake",
    "lethargic", "very sleepy", "limp",
    "stiff neck", "neck stiffness", "cannot bend neck",
    "chest indrawing", "chest drawing in", "ribs showing when breathing",
    "stridor", "noisy breathing", "crowing sound",
    "sunken eyes", "dry mouth", "skin pinch",
    "bulging fontanelle",
]

def detect_imci_danger_signs(text: str) -> list[str]:
    """Detect WHO IMCI general danger signs in free-text."""
    lower = text.lower()
    return [phrase for phrase in IMCI_DANGER_PHRASES if phrase in lower]


# ── ICD-10 Quick Mapper ──────────────────────────────────────────────────────
ICD10_MAP = {
    "pneumonia": "J18.9", "chest infection": "J22",
    "dengue": "A90", "dengue fever": "A90",
    "malaria": "B54",
    "tuberculosis": "A15.0", "tb": "A15.0",
    "diarrhoea": "A09", "diarrhea": "A09", "gastroenteritis": "A09",
    "uti": "N39.0", "urinary infection": "N39.0", "burning urination": "N39.0",
    "hypertension": "I10", "high blood pressure": "I10",
    "fever": "R50.9",
    "chest pain": "R07.9",
    "snake bite": "T63.0", "snakebite": "T63.0",
    "eclampsia": "O15.9", "pre-eclampsia": "O14.1",
    "malnutrition": "E46", "severe malnutrition": "E40", "wasting": "E41",
    "anaemia": "D64.9", "anemia": "D64.9",
    "typhoid": "A01.0",
    "hepatitis": "B19.9",
    "diabetes": "E11.9",
    "appendicitis": "K35.9",
    "meningitis": "G03.9",
    "stroke": "I64",
    "heart attack": "I21.9", "myocardial infarction": "I21.9",
    "sepsis": "A41.9",
    "asthma": "J45.9",
    "otitis": "H66.9", "ear infection": "H66.9",
    "conjunctivitis": "H10.9", "pink eye": "H10.9",
    "skin infection": "L08.9", "cellulitis": "L03.9",
    "wound": "T14.1",
    "fracture": "T14.2",
    "acute respiratory infection": "J22",
    "ari": "J22",
    "cold": "J06.9", "upper respiratory": "J06.9",
    "urinary tract": "N39.0",
    "headache": "R51",
    "vomiting": "R11",
    "abdominal pain": "R10.9",
    "back pain": "M54.5",
    "joint pain": "M25.5",
}

def get_icd10(symptoms: str, chief_complaint: str = "") -> str:
    """Best-effort ICD-10 code from symptom keywords."""
    text = (symptoms + " " + chief_complaint).lower()
    for kw, code in ICD10_MAP.items():
        if kw in text:
            return code
    return "R69"  # Illness, unspecified


# ── Drug Interaction Checker ─────────────────────────────────────────────────
CONTRAINDICATIONS = [
    {
        "trigger": ["sulfa allergy", "sulfonamide allergy"],
        "avoid": ["cotrimoxazole", "septran"],
        "severity": "contraindicated",
        "note": "Cotrimoxazole is a sulfonamide — CONTRAINDICATED in sulfa allergy.",
    },
    {
        "trigger": ["pregnancy"],
        "avoid": ["misoprostol"],
        "severity": "caution",
        "note": "Misoprostol for PPH only — given after delivery, not during pregnancy.",
    },
    {
        "trigger": ["g6pd deficiency"],
        "avoid": ["cotrimoxazole", "chloroquine"],
        "severity": "contraindicated",
        "note": "Cotrimoxazole and Chloroquine can cause haemolysis in G6PD deficiency.",
    },
    {
        "trigger": ["aspirin", "ibuprofen"],
        "avoid": ["paracetamol overdose"],
        "severity": "mild",
        "note": "Do not combine multiple pain relievers — use one at a time.",
    },
]

def check_contraindications(patient_conditions: list, proposed_drug: str) -> list:
    """Return warnings for drug/condition contraindications."""
    warnings = []
    drug_lower = proposed_drug.lower()
    conditions_lower = [c.lower() for c in patient_conditions]
    for rule in CONTRAINDICATIONS:
        trigger_match = any(t in " ".join(conditions_lower) for t in rule["trigger"])
        avoid_match = any(a in drug_lower for a in rule["avoid"])
        if trigger_match and avoid_match:
            warnings.append({"severity": rule["severity"], "warning": rule["note"]})
    return warnings
