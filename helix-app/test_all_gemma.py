import os
import requests
from dotenv import load_dotenv

load_dotenv()

key = os.getenv("GEMINI_API_KEY")
models = [
    "gemma-3-27b-it",
    "gemma-3-12b-it",
    "gemma-3-4b-it",
    "gemma-3-2b-it",
    "gemma-3-1b-it",
]

print(f"Testing Key: {key[:10]}...")

for model in models:
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key}"
    try:
        resp = requests.post(
            url, 
            json={"contents": [{"parts": [{"text": "hi"}]}]}, 
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        print(f"Model: {model} | Status: {resp.status_code}")
        if resp.status_code != 200:
            print(f"  Error: {resp.text}")
    except Exception as e:
        print(f"Model: {model} | Exception: {e}")
