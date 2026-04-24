"""
HELIX Model Abstraction
-----------------------
This is the single file you change when swapping from the external
testing API to your own trained model.

Current mode: CLOUDFLARE (testing)
Future mode:  YOUR_MODEL (production)

To switch to your own model:
1. Set USE_OWN_MODEL = True
2. Fill in load_own_model() with your model loading code
3. Fill in run_own_model() with your inference code
4. That's it — the rest of the server stays the same
"""

import os
import requests

# ─────────────────────────────────────────────────────────────────────
# TOGGLE: Set to True when your model is ready
# ─────────────────────────────────────────────────────────────────────
USE_OWN_MODEL = False

# ─────────────────────────────────────────────────────────────────────
# GEMINI CONFIG (primary — free with generous limits)
# Uses Gemma models which are more permissive than Gemini Flash
# ─────────────────────────────────────────────────────────────────────
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

GEMMA_MODELS = [
    "gemma-3-27b-it",
    "gemma-3-12b-it",
    "gemma-3-4b-it",
    "gemma-3-2b-it",
]

# ─────────────────────────────────────────────────────────────────────
# OPENROUTER CONFIG (secondary)
# ─────────────────────────────────────────────────────────────────────
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
OPENROUTER_MODEL = "meta-llama/llama-3.1-8b-instruct"

# ─────────────────────────────────────────────────────────────────────
# CLOUDFLARE CONFIG (fallback)
# ─────────────────────────────────────────────────────────────────────
CF_ACCOUNT_ID = os.getenv("CF_ACCOUNT_ID")
CF_API_TOKEN = os.getenv("CF_API_TOKEN")
CF_MODEL = "@cf/meta/llama-3.3-70b-instruct-fp8-fast"
CF_VISION_MODEL = "@cf/llava-hf/llava-1.5-7b-hf"
CF_URL = f"https://api.cloudflare.com/client/v4/accounts/{CF_ACCOUNT_ID}/ai/run/{CF_MODEL}"
CF_VISION_URL = f"https://api.cloudflare.com/client/v4/accounts/{CF_ACCOUNT_ID}/ai/run/{CF_VISION_MODEL}"


# ─────────────────────────────────────────────────────────────────────
# YOUR OWN MODEL (fill this in when ready)
# ─────────────────────────────────────────────────────────────────────
_own_model = None
_own_tokenizer = None

def load_own_model():
    """
    Load your trained model here.
    Called once at server startup when USE_OWN_MODEL = True.
    
    Example with Hugging Face:
        from transformers import AutoModelForCausalLM, AutoTokenizer
        global _own_model, _own_tokenizer
        _own_tokenizer = AutoTokenizer.from_pretrained("./helix-model")
        _own_model = AutoModelForCausalLM.from_pretrained("./helix-model")
        _own_model.eval()
    
    Example with llama.cpp:
        from llama_cpp import Llama
        global _own_model
        _own_model = Llama(model_path="./helix-model.gguf", n_ctx=4096)
    """
    pass  # TODO: implement when model is ready


def run_own_model(system_prompt: str, messages: list, max_tokens: int = 2048) -> str:
    """
    Run inference on your own model.
    
    Args:
        system_prompt: The HELIX system prompt
        messages: List of {"role": "user"/"assistant", "content": "..."}
        max_tokens: Maximum tokens to generate
    
    Returns:
        The model's response as a string
    
    Example with Hugging Face chat template:
        chat = [{"role": "system", "content": system_prompt}] + messages
        input_ids = _own_tokenizer.apply_chat_template(chat, return_tensors="pt")
        output = _own_model.generate(input_ids, max_new_tokens=max_tokens)
        return _own_tokenizer.decode(output[0][input_ids.shape[-1]:], skip_special_tokens=True)
    
    Example with llama.cpp:
        chat = [{"role": "system", "content": system_prompt}] + messages
        response = _own_model.create_chat_completion(messages=chat, max_tokens=max_tokens)
        return response["choices"][0]["message"]["content"]
    """
    raise NotImplementedError("Own model not implemented yet")


# ─────────────────────────────────────────────────────────────────────
# UNIFIED INFERENCE FUNCTION
# This is what the server calls — it routes to the right backend
# ─────────────────────────────────────────────────────────────────────
def generate(system_prompt: str, messages: list, max_tokens: int = 2048) -> str:
    """
    Main inference entry point.
    Uses Gemma models only — no Cloudflare fallback (Cloudflare has hardcoded safety filters).
    """
    if USE_OWN_MODEL:
        return run_own_model(system_prompt, messages, max_tokens)
    
    # Try Gemma (primary)
    gemma_err = "Not attempted"
    if GEMINI_API_KEY:
        try:
            return _call_gemini(system_prompt, messages, max_tokens)
        except Exception as e:
            gemma_err = str(e)
            print(f"[Gemma] Failed: {e}, trying OpenRouter")
    
    # Try OpenRouter (secondary)
    or_err = "Not attempted"
    if OPENROUTER_API_KEY:
        try:
            return _call_openrouter(system_prompt, messages, max_tokens)
        except Exception as e:
            or_err = str(e)
            print(f"[OpenRouter] Failed: {e}")
    
    # Final fallback if both fail
    error_msg = f"Inference failed. Gemma Error: {gemma_err}. OpenRouter Error: {or_err}."
    print(f"[Fatal] {error_msg}")
    raise Exception(error_msg)


def generate_vision(system_prompt: str, user_text: str, image_bytes: list, max_tokens: int = 1024) -> str:
    """
    Vision inference entry point.
    """
    if USE_OWN_MODEL:
        # TODO: implement vision for your own model
        raise NotImplementedError("Own model vision not implemented yet")
    else:
        return _call_cloudflare_vision(user_text, image_bytes, max_tokens)


# ─────────────────────────────────────────────────────────────────────
# GEMINI IMPLEMENTATION
# ─────────────────────────────────────────────────────────────────────
def _call_gemini(system_prompt: str, messages: list, max_tokens: int) -> str:
    trimmed = messages[-40:] if len(messages) > 40 else messages

    # Build contents — Gemma doesn't support system_instruction, inject as first turn
    contents = []
    contents.append({"role": "user", "parts": [{"text": f"[SYSTEM INSTRUCTIONS]\n{system_prompt}"}]})
    contents.append({"role": "model", "parts": [{"text": "ok"}]})

    for m in trimmed:
        role = "model" if m.get("role") == "assistant" else "user"
        contents.append({"role": role, "parts": [{"text": m.get("content", "")}]})

    import time
    for model in GEMMA_MODELS:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={GEMINI_API_KEY}"
        try:
            resp = requests.post(
                url,
                json={
                    "contents": contents,
                    "generationConfig": {"maxOutputTokens": max_tokens}
                },
                headers={"Content-Type": "application/json"},
                timeout=60
            )
            if resp.status_code == 429:
                print(f"[Gemma] Rate limited on {model}, trying next...")
                time.sleep(1)
                continue
            resp.raise_for_status()
            reply = resp.json()["candidates"][0]["content"]["parts"][0]["text"]
            if reply:
                print(f"[Gemma] Responded with model: {model}")
                return reply
        except Exception as e:
            print(f"[Gemma] {model} failed: {e}")
            continue

    raise Exception("All Gemma models failed")


# ─────────────────────────────────────────────────────────────────────
# OPENROUTER IMPLEMENTATION
# ─────────────────────────────────────────────────────────────────────
def _call_openrouter(system_prompt: str, messages: list, max_tokens: int) -> str:
    trimmed = messages[-40:] if len(messages) > 40 else messages
    
    or_messages = [{"role": "system", "content": system_prompt}]
    for m in trimmed:
        role = "assistant" if m.get("role") == "assistant" else "user"
        or_messages.append({"role": role, "content": m.get("content", "")})
    
    resp = requests.post(
        "https://openrouter.ai/api/v1/chat/completions",
        json={
            "model": OPENROUTER_MODEL,
            "messages": or_messages,
            "max_tokens": max_tokens,
        },
        headers={
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json",
            "HTTP-Referer": "http://localhost:3001",
            "X-Title": "HELIX AI",
        },
        timeout=60
    )
    if resp.status_code == 404:
        raise Exception(f"Model not found: {OPENROUTER_MODEL}")
    resp.raise_for_status()
    data = resp.json()
    if "error" in data:
        raise Exception(data["error"].get("message", "OpenRouter error"))
    return data["choices"][0]["message"]["content"]


# ─────────────────────────────────────────────────────────────────────
# CLOUDFLARE IMPLEMENTATION (fallback)
# ─────────────────────────────────────────────────────────────────────
def _cf_headers():
    return {
        "Authorization": f"Bearer {CF_API_TOKEN}",
        "Content-Type": "application/json"
    }


def _call_cloudflare(system_prompt: str, messages: list, max_tokens: int) -> str:
    # Keep full history but trim if too long (keep system + last 40 messages)
    trimmed = messages[-40:] if len(messages) > 40 else messages
    
    cf_messages = [{"role": "system", "content": system_prompt}]
    for m in trimmed:
        role = "assistant" if m.get("role") == "assistant" else "user"
        cf_messages.append({"role": role, "content": m.get("content", "")})
    
    # Try primary model, fall back to smaller model on rate limit
    models = [
        "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
        "@cf/meta/llama-3.1-8b-instruct",
        "@cf/mistral/mistral-7b-instruct-v0.1",
    ]
    
    last_error = None
    for model in models:
        url = f"https://api.cloudflare.com/client/v4/accounts/{CF_ACCOUNT_ID}/ai/run/{model}"
        try:
            resp = requests.post(
                url,
                json={"messages": cf_messages, "max_tokens": max_tokens},
                headers=_cf_headers(),
                timeout=60
            )
            if resp.status_code == 429:
                last_error = f"Rate limited on {model}"
                import time
                time.sleep(1)
                continue
            resp.raise_for_status()
            return resp.json()["result"]["response"]
        except Exception as e:
            last_error = str(e)
            if "429" in str(e):
                import time
                time.sleep(1)
                continue
            raise
    
    raise Exception(f"All models rate limited: {last_error}")


def _call_cloudflare_vision(user_text: str, image_bytes: list, max_tokens: int) -> str:
    prompt = f"{user_text}\n\nLook at this image and help the user." if user_text else "Describe and analyze this image."
    resp = requests.post(
        CF_VISION_URL,
        json={"image": image_bytes, "prompt": prompt, "max_tokens": max_tokens},
        headers=_cf_headers(),
        timeout=30
    )
    resp.raise_for_status()
    result = resp.json().get("result", {})
    return result.get("description") or result.get("response") or "Could not analyze image."


# ─────────────────────────────────────────────────────────────────────
# STARTUP
# ─────────────────────────────────────────────────────────────────────
if USE_OWN_MODEL:
    print("Loading HELIX model...")
    load_own_model()
    print("HELIX model loaded")
else:
    print("Using Cloudflare AI (testing mode)")
