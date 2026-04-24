import os
import requests
from dotenv import load_dotenv

load_dotenv()

def test_gemini():
    key = os.getenv("GEMINI_API_KEY")
    if not key:
        print("Gemini Key Missing")
        return
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemma-3-27b-it:generateContent?key={key}"
    try:
        resp = requests.post(url, json={"contents": [{"parts": [{"text": "hi"}]}]}, timeout=10)
        print(f"Gemini Status: {resp.status_code}")
        if resp.status_code != 200:
            print(f"Gemini Error: {resp.text}")
    except Exception as e:
        print(f"Gemini Exception: {e}")

def test_openrouter():
    key = os.getenv("OPENROUTER_API_KEY")
    if not key:
        print("OpenRouter Key Missing")
        return
    url = "https://openrouter.ai/api/v1/chat/completions"
    try:
        resp = requests.post(
            url, 
            json={"model": "meta-llama/llama-3.1-8b-instruct", "messages": [{"role": "user", "content": "hi"}]},
            headers={"Authorization": f"Bearer {key}"},
            timeout=10
        )
        print(f"OpenRouter Status: {resp.status_code}")
        if resp.status_code != 200:
            print(f"OpenRouter Error: {resp.text}")
    except Exception as e:
        print(f"OpenRouter Exception: {e}")

print("--- Testing API Keys ---")
test_gemini()
test_openrouter()
