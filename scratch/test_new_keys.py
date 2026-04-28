import requests

gemini_key = "AIzaSyBTzr1leb73HURmRxLDTs6jaTPd4BWRnFM"
model = "gemini-1.5-flash"
url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={gemini_key}"

resp = requests.post(
    url,
    json={"contents": [{"role": "user", "parts": [{"text": "test"}]}]},
    headers={"Content-Type": "application/json"}
)
print(f"Gemini Status: {resp.status_code}")

or_key = "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"
or_url = "https://openrouter.ai/api/v1/chat/completions"
or_resp = requests.post(
    or_url,
    json={"model": "meta-llama/llama-3.1-8b-instruct", "messages": [{"role": "user", "content": "test"}]},
    headers={"Authorization": f"Bearer {or_key}", "Content-Type": "application/json"}
)
print(f"OpenRouter Status: {or_resp.status_code}")
