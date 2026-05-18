import os
import httpx
from dotenv import load_dotenv
from langchain_ollama import ChatOllama
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from prompts import SYSTEM_PROMPTS
from triage_logic import extract_triage_from_response, clean_response_text

load_dotenv()

OLLAMA_MODEL    = os.getenv("OLLAMA_MODEL",    "gemma3:4b")
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")


def get_llm(temperature: float = 0.3, num_predict: int = 1024) -> ChatOllama:
    return ChatOllama(
        model=OLLAMA_MODEL,
        base_url=OLLAMA_BASE_URL,
        temperature=temperature,
        num_predict=num_predict,
    )


def _build_messages(language: str, conversation_history: list, user_message: str) -> list:
    msgs = [SystemMessage(content=SYSTEM_PROMPTS.get(language, SYSTEM_PROMPTS["en"]))]
    for msg in conversation_history:
        if msg["role"] == "user":
            msgs.append(HumanMessage(content=msg["content"]))
        elif msg["role"] == "assistant":
            msgs.append(AIMessage(content=msg["content"]))
    msgs.append(HumanMessage(content=user_message))
    return msgs


def run_triage_agent(
    user_message: str,
    language: str,
    conversation_history: list,
) -> dict:
    llm = get_llm()
    messages = _build_messages(language, conversation_history, user_message)
    result = llm.invoke(messages)
    raw = result.content

    triage = extract_triage_from_response(raw, user_message)
    display = clean_response_text(raw)

    if not triage.get("speak_text"):
        triage["speak_text"] = display[:200] if display else ""

    return {
        "response":          display,
        "triage_level":      triage["triage_level"],
        "triage_label":      triage["triage_label"],
        "triage_color":      triage["triage_color"],
        "confidence":        triage["confidence"],
        "suggested_actions": triage["suggested_actions"],
        "speak_text":        triage["speak_text"],
        "icd10_code":        triage.get("icd10_code", "R69"),
        "warning_signs":     triage.get("warning_signs", []),
        "reasoning":         triage.get("reasoning", ""),
    }


async def stream_triage_agent(
    user_message: str,
    language: str,
    conversation_history: list = [],
):
    llm = ChatOllama(
        model=OLLAMA_MODEL,
        base_url=OLLAMA_BASE_URL,
        temperature=0.3,
        streaming=True,
    )
    messages = _build_messages(language, conversation_history, user_message)

    full_text = ""
    async for chunk in llm.astream(messages):
        token = chunk.content
        if token:
            full_text += token
            yield {"type": "token", "content": token}

    triage = extract_triage_from_response(full_text, user_message)
    clean  = clean_response_text(full_text)

    yield {
        "type":              "triage",
        "triage_level":      triage["triage_level"],
        "triage_label":      triage["triage_label"],
        "triage_color":      triage["triage_color"],
        "confidence":        triage["confidence"],
        "suggested_actions": triage["suggested_actions"],
        "speak_text":        triage.get("speak_text") or clean[:150],
        "icd10_code":        triage.get("icd10_code", "R69"),
        "warning_signs":     triage.get("warning_signs", []),
        "reasoning":         triage.get("reasoning", ""),
    }


async def check_ollama_health() -> dict:
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(f"{OLLAMA_BASE_URL}/api/tags")
            if resp.status_code == 200:
                models = [m["name"] for m in resp.json().get("models", [])]
                return {
                    "ollama_connected": True,
                    "model_available":  any(OLLAMA_MODEL in m for m in models),
                    "model_name":       OLLAMA_MODEL,
                }
    except Exception:
        pass
    return {"ollama_connected": False, "model_available": False, "model_name": OLLAMA_MODEL}
