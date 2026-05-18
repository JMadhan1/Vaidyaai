"""
VaidyaAI Symptom Knowledge Base
Keyword fallback classifier — runs when Gemma 4 JSON parsing fails.
Covers English, Telugu (native + transliterated), Hindi, Tamil for all 4 triage levels.
"""
import re

SYMPTOM_KEYWORDS = {
    "emergency": [
        # English — cardiac
        "chest pain", "chest tightness", "heart attack", "heart pain",
        "left arm pain", "jaw pain", "cannot breathe", "can't breathe",
        "difficulty breathing", "shortness of breath", "not breathing",
        "stopped breathing", "choking", "blue lips", "blue fingernails",
        # English — neurological
        "stroke", "face drooping", "arm weakness", "slurred speech",
        "sudden headache", "worst headache", "thunderclap",
        "seizure", "convulsion", "fitting", "epilepsy attack",
        "unconscious", "unresponsive", "passed out", "fainted",
        "cannot wake", "not responding",
        # English — bleeding / trauma
        "severe bleeding", "heavy bleeding", "spurting blood",
        "bleeding won't stop", "coughing blood", "blood in vomit",
        "blood in stool", "black stool",
        # English — poisoning / envenomation
        "poisoning", "overdose", "snakebite", "snake bite", "snake bit",
        "scorpion sting", "spider bite",
        # English — allergic
        "allergic reaction", "anaphylaxis", "throat swelling",
        "cannot swallow", "swollen throat", "hives difficulty breathing",
        # English — paediatric IMCI danger signs
        "infant fever", "baby fever", "newborn fever",
        "high fever infant", "baby not breathing", "baby unconscious",
        "baby seizure", "baby convulsion", "child not drinking",
        "vomiting everything", "lethargic child", "floppy baby",
        "chest indrawing", "fast breathing child", "stiff neck",
        "bulging fontanelle",
        # English — obstetric
        "heavy vaginal bleeding", "pregnancy bleeding", "eclampsia",
        "pregnancy seizure", "baby not moving", "no fetal movement",
        # English — general severe
        "severe dehydration", "sunken eyes", "skin pinch",
        "meningitis", "sepsis",
        # Telugu native
        "ఛాతీ నొప్పి", "శ్వాస తీసుకోవడం కష్టం", "స్ట్రోక్", "మూర్ఛ",
        "స్పృహ కోల్పోవడం", "తీవ్రమైన రక్తస్రావం", "పాము కాటు", "శిశువు జ్వరం",
        # Telugu transliterated
        "rantham", "gadya", "murchha", "spruha", "gunde nooppi", "usiru",
        "swaasa", "padipoyindi", "mogam vaangindi", "cha ti noppi",
        "pamu kaatu", "pillaniki jwaram",
        # Hindi native
        "सीने में दर्द", "सांस नहीं आना", "बेहोशी", "दौरा", "खून बहना",
        "पाम के काटने", "शिशु को बुखार", "गंभीर रक्तस्राव",
        # Hindi transliterated
        "seene mein dard", "sans nahi", "behoshi", "daura", "khoon",
        "zeher", "ulti khoon", "chat mein dard", "haath kamzor",
        "saanp ne kaata", "baby ko bukhar", "bachche ko daura",
        # Tamil native
        "மார்பு வலி", "சுவாசிக்க சிரமம்", "மயக்கம்", "வலிப்பு",
        "இரத்தப்போக்கு", "பாம்பு கடி", "குழந்தை காய்ச்சல்",
        # Tamil transliterated
        "maarphu vali", "moochu", "mayakkam", "valipu", "iratha pokku",
        "nanju", "marbhil vali", "paambu kadi", "kulanthai kaichal",
    ],

    "clinic": [
        # English — fever
        "fever 3 days", "fever three days", "fever 2 days", "fever two days",
        "fever 103", "high fever", "fever not going", "fever not improving",
        "fever and rash", "dengue", "malaria", "typhoid",
        # English — vomiting / GI
        "persistent vomiting", "vomiting repeatedly", "cannot keep water down",
        "vomiting 24 hours", "blood in stool", "mucus in stool",
        # English — pain
        "abdominal pain", "stomach pain", "severe stomach", "right lower pain",
        "appendix", "ear pain", "ear discharge", "ear infection",
        # English — infection
        "eye infection", "pink eye", "eye discharge", "swollen eye",
        "urinary pain", "burning urination", "urinary tract", "uti",
        "pus", "yellow discharge", "wound infection", "cellulitis",
        "swollen lymph", "lymph node", "rash spreading",
        # English — TB / chronic
        "cough 2 weeks", "cough two weeks", "cough 3 weeks", "cough month",
        "weight loss cough", "night sweats", "blood sputum",
        # English — paediatric
        "child ear", "baby ear", "child fever high", "child not eating",
        "child not gaining weight", "malnutrition", "wasting", "muac",
        # English — obstetric
        "pregnancy fever", "swollen feet pregnancy", "ankles swollen pregnant",
        "facial swelling pregnant", "reduced fetal", "less movement baby",
        # Telugu native
        "జ్వరం మూడు రోజులు", "నిరంతర వాంతులు", "కడుపు నొప్పి", "చెవి నొప్పి",
        "కంటి సంక్రమణ", "మూత్ర నొప్పి",
        # Telugu transliterated
        "jwaram rendu rojulu", "jwaram moodu", "kadu nooppi", "chevi nooppi",
        "kannu infection", "mootra nooppi", "dengue", "malaria",
        # Hindi native
        "तीन दिन बुखार", "दो दिन बुखार", "पेट दर्द", "कान दर्द",
        "आँखों में संक्रमण", "मूत्र में जलन", "खांसी 2 हफ्ते",
        # Hindi transliterated
        "teen din bukhar", "do din bukhar", "pet dard", "kaan dard",
        "aankhon mein infection", "mootne mein jalan", "khansi hafte",
        # Tamil native
        "மூன்று நாள் காய்ச்சல்", "இரண்டு நாள் காய்ச்சல்", "வயிற்று வலி",
        "காது வலி", "கண் தொற்று", "சிறுநீர் எரிச்சல்",
        # Tamil transliterated
        "moondru naal kaichal", "irantu naal kaichal", "vayiru vali",
        "kavi vali", "kann infection", "siru neer vali", "dengue", "malaria",
    ],

    "otc": [
        # English
        "mild cold", "runny nose", "sneezing", "nasal congestion",
        "mild cough", "sore throat", "mild fever", "low grade fever",
        "mild headache", "headache", "tension headache",
        "indigestion", "acidity", "heartburn", "gas", "bloating",
        "body ache", "muscle pain", "mild pain", "aches",
        "constipation", "mild diarrhea", "loose motion", "mild loose stool",
        "cold symptoms", "common cold", "flu symptoms", "mild flu",
        "minor rash", "mild skin irritation", "dry skin",
        # Telugu native
        "జలుబు", "తేలికపాటి జ్వరం", "తలనొప్పి", "విరేచనాలు",
        "పొట్ట మంట", "కండరాల నొప్పి",
        # Telugu transliterated
        "jalubu", "talachunna", "netti nooppi", "viraja", "potta manta",
        "kandara noppi", "telikaga unnadi", "mandutinali",
        # Hindi native
        "नज़ला", "जुकाम", "हल्की खांसी", "सिर दर्द", "हल्का बुखार",
        "पेट की गैस", "दस्त", "कब्ज", "गला दर्द", "शरीर दर्द",
        # Hindi transliterated
        "nazla", "zukam", "khasi", "sir dard", "halka bukhar",
        "pet ki gas", "dast", "kabz", "gala dard", "badan dard",
        # Tamil native
        "சளி", "இருமல்", "தலைவலி", "லேசான காய்ச்சல்",
        "வயிற்று உப்புசம்", "மலச்சிக்கல்", "தொண்டை வலி",
        # Tamil transliterated
        "sariyidam", "thummal", "ithazhal", "thalai vali", "ila kaichal",
        "vayiru uppusam", "malam kathinal", "thondai vali",
    ],

    "monitor": [
        # English
        "mild fatigue", "tiredness", "mild stress", "anxiety", "mild anxiety",
        "minor rash no fever", "mild muscle ache", "slight headache",
        "feeling unwell", "not feeling well", "mild discomfort",
        # Telugu
        "alasata", "stress", "telikaga unnadi",
        # Hindi
        "thakaan", "halki thakaan", "halki takleef",
        # Tamil
        "otangu", "ila sokku",
    ],
}


def quick_classify(text: str) -> str | None:
    """
    Keyword-based fallback triage classifier.
    Runs when Gemma 4 JSON output cannot be parsed.
    Priority: emergency > clinic > otc > monitor
    """
    text_lower = text.lower()
    text_lower = re.sub(r'[^\w\s]', ' ', text_lower)

    for level in ("emergency", "clinic", "otc", "monitor"):
        for keyword in SYMPTOM_KEYWORDS[level]:
            clean_kw = re.sub(r'[^\w\s]', ' ', keyword.lower())
            if clean_kw in text_lower:
                return level

    return None
