import json
import re
from prompts import TRIAGE_LABELS
from symptom_kb import quick_classify


def extract_triage_from_response(response_text: str, user_message: str = "") -> dict:
    default = {
        "triage_level": "unknown",
        "triage_label": TRIAGE_LABELS["unknown"]["label"],
        "triage_color": TRIAGE_LABELS["unknown"]["color"],
        "confidence": "low",
        "suggested_actions": [],
        "speak_text": "",
        "icd10_code": "R69",
        "warning_signs": [],
        "reasoning": "",
    }

    # Try JSON block first (```json ... ```)
    block_pattern = r'```json\s*(.*?)\s*```'
    matches = re.findall(block_pattern, response_text, re.DOTALL)

    # Fallback: bare JSON object anywhere in the response
    if not matches:
        bare = re.findall(r'\{[^{}]*"triage_level"[^{}]*\}', response_text, re.DOTALL)
        if bare:
            matches = [bare[-1]]

    if matches:
        try:
            data = json.loads(matches[-1])
            level = data.get("triage_level", "unknown")
            if level not in TRIAGE_LABELS:
                level = "unknown"
            label_info = TRIAGE_LABELS[level]
            return {
                "triage_level": level,
                "triage_label": label_info["label"],
                "triage_color": label_info["color"],
                "confidence": data.get("confidence", "medium"),
                "suggested_actions": data.get("suggested_actions", []),
                "speak_text": data.get("speak_text", ""),
                "icd10_code": data.get("icd10_code", "R69"),
                "warning_signs": data.get("warning_signs", []),
                "reasoning": data.get("reasoning", ""),
            }
        except (json.JSONDecodeError, KeyError):
            pass

    # Keyword-based fallback
    if user_message:
        level = quick_classify(user_message)
        if level and level in TRIAGE_LABELS:
            label_info = TRIAGE_LABELS[level]
            return {
                **default,
                "triage_level": level,
                "triage_label": label_info["label"],
                "triage_color": label_info["color"],
                "confidence": "low",
            }

    return default


def clean_response_text(text: str) -> str:
    cleaned = re.sub(r'```json\s*.*?\s*```', '', text, flags=re.DOTALL)
    cleaned = cleaned.strip()
    return cleaned
