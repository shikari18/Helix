import os
import requests
from dotenv import load_dotenv

load_dotenv()

key = os.getenv("OPENROUTER_API_KEY")
print(f"Testing key: {key[:10]}...")

url = "https://openrouter.ai/api/v1/chat/completions"
headers = {
    "Authorization": f"Bearer {key}",
    "Content-Type": "application/json"
}
payload = {
    "model": "meta-llama/llama-3.1-8b-instruct",
    "messages": [{"role": "user", "content": "hi"}]
}

try:
    resp = requests.post(url, headers=headers, json=payload, timeout=10)
    print(f"Status: {resp.status_code}")
    print(f"Response: {resp.text}")
except Exception as e:
    print(f"Error: {e}")
