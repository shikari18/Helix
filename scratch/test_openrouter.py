import os
import requests
from dotenv import load_dotenv

load_dotenv()

key = os.getenv("OPENROUTER_API_KEY")
print(f"Key found: {key is not None}")

url = "https://openrouter.ai/api/v1/chat/completions"
resp = requests.post(
    url,
    json={
        "model": "meta-llama/llama-3.1-8b-instruct",
        "messages": [{"role": "user", "content": "Hello"}]
    },
    headers={
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json"
    }
)

print(f"Status: {resp.status_code}")
print(f"Response: {resp.text[:200]}...")
