import requests

key = "AIzaSyBCi67G44ApToRAUAC1LNJD21j0ciz7A9g"
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
print(f"Response: {resp.text[:200]}...")
