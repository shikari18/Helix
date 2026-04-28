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
print(f"Gemini Response: {resp.text}")
