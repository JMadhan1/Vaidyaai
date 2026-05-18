import os
import httpx

LANG_INSTRUCTIONS = {
    "en": "Respond in English.",
    "te": "తెలుగులో సమాధానం ఇవ్వండి.",
    "hi": "हिंदी में जवाब दें।",
    "ta": "தமிழில் பதிலளியுங்கள்.",
}

VISION_PROMPT_TEMPLATE = """You are a medical AI vision assistant supporting an ASHA worker in rural India.
Analyze the image provided alongside the patient's reported symptoms.

Patient reports: "{symptom_text}"

{lang_instruction}

Provide a structured visual assessment covering:
1. Body part / condition visible in the image
2. Observed clinical signs (redness, swelling, pus, rash type, wound depth, jaundice, pallor, dehydration signs)
3. Estimated severity (mild / moderate / severe) based on visual alone
4. Any urgent visual red flags (e.g. spreading cellulitis, necrotising tissue, eye opacity, severe pallor)
5. How visual findings relate to the reported symptoms

Be clinical but use simple language. Keep response under 120 words. Do not diagnose — describe what you see."""


async def analyze_image_with_gemma4(
    image_base64: str,
    symptom_text: str,
    language: str = "en",
) -> str:
    lang_instruction = LANG_INSTRUCTIONS.get(language, LANG_INSTRUCTIONS["en"])
    prompt = VISION_PROMPT_TEMPLATE.format(
        symptom_text=symptom_text,
        lang_instruction=lang_instruction,
    )

    payload = {
        "model": os.getenv("OLLAMA_MODEL", "gemma3:4b"),
        "prompt": prompt,
        "images": [image_base64],
        "stream": False,
        "options": {
            "temperature": 0.15,
            "num_predict": 400,   # was 150 — increased for thorough analysis
            "top_p": 0.9,
        },
    }

    base_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    async with httpx.AsyncClient(timeout=45.0) as client:
        try:
            r = await client.post(f"{base_url}/api/generate", json=payload)
            r.raise_for_status()
            return r.json().get("response", "").strip() or "Image analysis unavailable."
        except httpx.TimeoutException:
            return "Image analysis timed out — please describe the condition in words."
        except Exception:
            return "Image analysis unavailable — Gemma 4 vision endpoint unreachable."
