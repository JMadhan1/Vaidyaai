from pydantic import BaseModel
from typing import Literal, List, Optional


class ConversationMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class TriageRequest(BaseModel):
    message: str
    language: Literal["en", "te", "hi", "ta"] = "en"
    conversation_history: List[ConversationMessage] = []
    image_base64: Optional[str] = None
    image_mime_type: Optional[str] = "image/jpeg"


class TriageResponse(BaseModel):
    response: str
    triage_level: Literal["emergency", "clinic", "otc", "monitor", "unknown"] = "unknown"
    triage_label: str = "❓ More Information Needed"
    triage_color: str = "#8E8E93"
    confidence: Literal["high", "medium", "low"] = "low"
    suggested_actions: List[str] = []
    speak_text: str = ""
    image_analysis: Optional[str] = None
    tool_used: Optional[str] = "gemma4-text"
    icd10_code: Optional[str] = "R69"
    warning_signs: Optional[List[str]] = []
    reasoning: Optional[str] = ""
    imci_danger_signs: Optional[List[str]] = []


class HealthCheckResponse(BaseModel):
    status: str
    ollama_connected: bool
    model_available: bool
    model_name: str
