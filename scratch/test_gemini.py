import os
import requests
from dotenv import load_dotenv

load_dotenv()

key = os.getenv("GEMINI_API_KEY")
print(f"Key found: {key is not None}")
if key:
    print(f"Key starts with: {key[:5]}...")

model = "gemini-1.5-flash"
url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key}"

resp = requests.post(
    url,
    json={
        "contents": [{"role": "user", "parts": [{"text": "Hello"}]}]
    },
    headers={"Content-Type": "application/json"}
)

print(f"Status: {resp.status_code}")
print(f"Response: {resp.text}")
