import os
import requests
from dotenv import load_dotenv

load_dotenv()

key = os.getenv("GEMINI_API_KEY")
print(f"Testing key: {key[:10]}...")

model = "gemma-3-27b-it"
url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key}"
headers = {"Content-Type": "application/json"}
payload = {
    "contents": [{"role": "user", "parts": [{"text": "hi"}]}]
}

try:
    resp = requests.post(url, headers=headers, json=payload, timeout=10)
    print(f"Status: {resp.status_code}")
    print(f"Response: {resp.text}")
except Exception as e:
    print(f"Error: {e}")
