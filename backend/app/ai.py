import os
from typing import Any
from google import genai

GEMINI_MODEL = "gemini-3.8-flash"


def get_gemini_client() -> genai.Client:
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY no está configurada en el entorno.")
    return genai.Client(api_key=api_key)


def ask_gemini(prompt: str, client: Any | None = None) -> str:
    active_client = client if client is not None else get_gemini_client()
    interaction = active_client.interactions.create(
        model=GEMINI_MODEL,
        input=prompt,
    )
    return (interaction.output_text or "").strip()

