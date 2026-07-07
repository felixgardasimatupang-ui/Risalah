import os
import json
import httpx
from typing import Optional, AsyncGenerator

NINE_ROUTER_BASE = os.getenv("NINE_ROUTER_BASE", "http://localhost:20128/v1")
NINE_ROUTER_TOKEN = os.getenv("NINE_ROUTER_TOKEN", "9W0WDFlAgMu00OUP0d46BeE5AfFb4e2380A34b6bB9123014")

NINE_ROUTER_MODELS = {
    "groq-llama4": "groq/llama-4-maverick",
    "groq-llama": "groq/llama-3.3-70b-versatile",
    "groq-qwen": "groq/qwen-32b",
    "cerebras-zai": "cerebras/zai-glm-4.7",
    "cerebras-qwen": "cerebras/qwen-3-235b",
    "gemini-flash": "gemini/gemini-3-flash-preview",
    "gemini-pro": "gemini/gemini-3.1-pro-preview",
    "free-developer": "groq/llama-3.3-70b-versatile",
}


def get_model_name(model_key: str) -> str:
    return NINE_ROUTER_MODELS.get(model_key, NINE_ROUTER_MODELS["free-developer"])


SYSTEM_PROMPT = """Anda adalah asisten AI untuk SEKNEG AI, platform kecerdasan rapat pemerintahan Indonesia.
Anda membantu menganalisis transkrip rapat, merangkum notula, dan menjawab pertanyaan seputar dokumen rapat.

Gunakan bahasa Indonesia yang baik dan benar. Jawab secara faktual berdasarkan konteks yang diberikan.
Jika tidak tahu, katakan tidak tahu. Jangan membuat informasi."""


def build_prompt(message: str, context: Optional[str] = None) -> list[dict]:
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    if context:
        messages.append({
            "role": "user",
            "content": f"Konteks rapat:\n{context}\n\nPertanyaan: {message}"
        })
    else:
        messages.append({"role": "user", "content": message})
    return messages


async def ask_llm(
    message: str,
    context: Optional[str] = None,
    model_key: str = "free-developer",
    temperature: float = 0.3,
    max_tokens: int = 1024,
) -> str:
    model = get_model_name(model_key)
    messages = build_prompt(message, context)

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(
                f"{NINE_ROUTER_BASE}/chat/completions",
                headers={"Authorization": f"Bearer {NINE_ROUTER_TOKEN}"},
                json={
                    "model": model,
                    "stream": False,
                    "messages": messages,
                    "temperature": temperature,
                    "max_tokens": max_tokens,
                },
            )
            resp.raise_for_status()
            data = resp.json()
            return data["choices"][0]["message"]["content"]
    except Exception as e:
        raise RuntimeError(f"9router LLM call failed: {e}")


async def ask_llm_stream(
    message: str,
    context: Optional[str] = None,
    model_key: str = "free-developer",
    temperature: float = 0.3,
    max_tokens: int = 1024,
) -> AsyncGenerator[str, None]:
    model = get_model_name(model_key)
    messages = build_prompt(message, context)

    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            async with client.stream(
                "POST",
                f"{NINE_ROUTER_BASE}/chat/completions",
                headers={"Authorization": f"Bearer {NINE_ROUTER_TOKEN}"},
                json={
                    "model": model,
                    "stream": True,
                    "messages": messages,
                    "temperature": temperature,
                    "max_tokens": max_tokens,
                },
            ) as resp:
                resp.raise_for_status()
                async for line in resp.aiter_lines():
                    if not line.startswith("data: "):
                        continue
                    payload = line[6:].strip()
                    if payload == "[DONE]":
                        break
                    try:
                        chunk = json.loads(payload)
                        delta = chunk.get("choices", [{}])[0].get("delta", {})
                        token = delta.get("content", "")
                        if token:
                            yield token
                    except json.JSONDecodeError:
                        continue
    except Exception as e:
        yield f"\n\n_[Error: {e}]_"
