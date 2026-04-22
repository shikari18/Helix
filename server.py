"""
HELIX Backend — FastAPI
-----------------------
Async API server for the HELIX AI platform.

To run:
    pip install fastapi uvicorn python-dotenv requests
    python server.py

Endpoints:
    POST /api/chat      — Main chat
    POST /api/search    — Web search + chat
    POST /api/tts       — Text to speech
    POST /api/execute   — Code execution
    POST /api/title     — Generate chat title
"""

import os
import re
import time
import json
import base64
import subprocess
from pathlib import Path
from datetime import datetime, timedelta, timezone

import requests
import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel
from typing import Optional

# ─────────────────────────────────────────────────────────────────────
# LOAD ENV & CONFIG
# ─────────────────────────────────────────────────────────────────────
load_dotenv()

from config.system_prompt import SYSTEM_PROMPT
from config.model import generate, generate_vision

PORT = int(os.getenv("PORT", 8000))
HELIX_WORKSPACE = Path(os.getenv("HELIX_WORKSPACE", "./helix_workspace"))
HELIX_WORKSPACE.mkdir(parents=True, exist_ok=True)

# ─────────────────────────────────────────────────────────────────────
# USER REGISTRY
# ─────────────────────────────────────────────────────────────────────
USERS_FILE = Path(__file__).parent / "users.json"

# Module-level in-memory registry
_users_registry: list = []


def load_users() -> list:
    """Load users from users.json into memory."""
    global _users_registry
    try:
        if USERS_FILE.exists():
            with open(USERS_FILE, "r", encoding="utf-8") as f:
                _users_registry = json.load(f)
        else:
            _users_registry = []
            save_users()
    except Exception as e:
        print(f"[ERROR] Failed to load users.json: {e}")
        _users_registry = []
    return _users_registry


def save_users() -> None:
    """Persist the in-memory registry to users.json."""
    try:
        with open(USERS_FILE, "w", encoding="utf-8") as f:
            json.dump(_users_registry, f, indent=2)
    except Exception as e:
        print(f"[ERROR] Failed to save users.json: {e}")
        raise


def register_or_update_user(email: str, name: str, picture: Optional[str] = None) -> dict:
    """
    Create a new UserRecord on first login, or update lastActiveAt / loginCount
    on subsequent logins. Persists to disk after every mutation.
    """
    now = datetime.now(timezone.utc).isoformat()
    existing = next((u for u in _users_registry if u["email"] == email), None)

    if existing is None:
        new_user = {
            "email": email,
            "name": name,
            "plan": "free",
            "signedUpAt": now,
            "lastActiveAt": now,
            "messageCount": 0,
            "loginCount": 1,
            "blocked": False,
            "picture": picture,
        }
        _users_registry.append(new_user)
        save_users()
        return new_user
    else:
        existing["lastActiveAt"] = now
        existing["loginCount"] = existing.get("loginCount", 0) + 1
        if picture is not None:
            existing["picture"] = picture
        save_users()
        return existing


# Load registry on startup
load_users()

ADMIN_SECRET = os.getenv("ADMIN_SECRET", "")

# ─────────────────────────────────────────────────────────────────────
# APP SETUP
# ─────────────────────────────────────────────────────────────────────
app = FastAPI(title="HELIX API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─────────────────────────────────────────────────────────────────────
# REQUEST MODELS
# ─────────────────────────────────────────────────────────────────────
class ChatRequest(BaseModel):
    message: str
    history: list = []
    deepThink: bool = False
    images: list = []
    groupChat: bool = False
    groupContext: Optional[str] = None
    participantCount: int = 0
    isOnlyCreator: bool = False
    participantNames: list = []
    email: Optional[str] = None

class SearchRequest(BaseModel):
    message: str
    history: list = []

class TTSRequest(BaseModel):
    text: str

class ExecuteRequest(BaseModel):
    code: str
    language: str

class TitleRequest(BaseModel):
    message: str
    greetingOnly: bool = False

# ─────────────────────────────────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────────────────────────────────
WEB_SEARCH_RE = re.compile(
    r"\b(latest|breaking|news|weather|temperature|forecast|price|stock|score|"
    r"trending|right now|this week|2025|2026|who won|what happened|current|"
    r"today|tonight|yesterday|match|game|vs|versus|standings|results|election|"
    r"vote|winner|champion|title|record|streak)\b",
    re.IGNORECASE
)

CASUAL_RE = re.compile(
    r"^(hey|hi|hello|sup|yo|hiya|howdy|what'?s up|how are you|how r u|"
    r"good morning|good night|good evening|thanks|thank you|ok|okay|cool|"
    r"nice|lol|haha|bye|goodbye|see you|cya)[!?.]*$",
    re.IGNORECASE
)

SUMMARY_RE = re.compile(
    r"^(summarize|summary|tldr|tl;dr|quick summary|give me the key|key points|"
    r"explain this|what does this|rewrite|simplify|break down)",
    re.IGNORECASE
)

URL_RE = re.compile(r"https?://[^\s]+")

LOC_RE = re.compile(
    r"\b(restaurant|hotel|place|location|where is|directions to|address of|map of|near me)\b",
    re.IGNORECASE
)


def is_casual(message: str) -> bool:
    stripped = message.strip()
    if CASUAL_RE.match(stripped):
        return True
    words = stripped.split()
    if len(words) <= 3 and not re.search(r"\b(weather|news|score|price|stock|forecast)\b", message, re.IGNORECASE):
        return True
    return False


def needs_web_search(message: str, deep_think: bool) -> bool:
    is_pasted = len(message) > 300 or bool(SUMMARY_RE.match(message.strip()))
    return (
        bool(WEB_SEARCH_RE.search(message))
        and not deep_think
        and len(message) > 15
        and not is_pasted
        and not is_casual(message)
    )


def duckduckgo_search(query: str) -> tuple[list, str]:
    """Returns (sources, context_string)"""
    try:
        ddg = requests.get(
            "https://api.duckduckgo.com/",
            params={"q": query, "format": "json", "no_html": 1, "skip_disambig": 1},
            timeout=8
        ).json()
        sources = []
        for t in (ddg.get("RelatedTopics") or [])[:5]:
            if t.get("FirstURL") and t.get("Text"):
                sources.append({"url": t["FirstURL"], "title": t["Text"][:80]})
        ctx = ""
        if ddg.get("AbstractText"):
            ctx += f"Summary: {ddg['AbstractText']}\n\n"
        if ddg.get("Answer"):
            ctx += f"Answer: {ddg['Answer']}\n\n"
        for s in sources:
            ctx += f"- {s['title']} ({s['url']})\n"
        return sources, ctx
    except Exception:
        return [], ""


def fetch_page(url: str) -> str:
    try:
        page = requests.get(url, timeout=8, headers={"User-Agent": "Mozilla/5.0"})
        text = re.sub(r"<(script|style)[\s\S]*?</\1>", "", page.text, flags=re.IGNORECASE)
        text = re.sub(r"<[^>]+>", " ", text)
        return re.sub(r"\s+", " ", text).strip()[:4000]
    except Exception:
        return ""


# ─────────────────────────────────────────────────────────────────────
# ROUTES
# ─────────────────────────────────────────────────────────────────────

@app.post("/api/chat")
async def api_chat(req: ChatRequest):
    # Block check — must happen before any processing
    if req.email:
        user = next((u for u in _users_registry if u["email"] == req.email), None)
        if user and user.get("blocked"):
            raise HTTPException(status_code=403, detail="Your account has been suspended.")

    message = req.message
    history = req.history
    deep_think = req.deepThink
    images = req.images

    # Same system prompt for both — just append participant info for group chat
    if req.groupChat and req.participantNames:
        names_str = ", ".join(req.participantNames)
        system_prompt = SYSTEM_PROMPT + f"\n\n---\n\nYou are in a group chat with {len(req.participantNames)} people: {names_str}. Address them by name when relevant."
    else:
        system_prompt = SYSTEM_PROMPT

    # Vision request
    if images:
        try:
            raw = re.sub(r"^data:image/\w+;base64,", "", images[0])
            image_bytes = list(base64.b64decode(raw))
            reply = generate_vision(system_prompt, message, image_bytes)
            return {"reply": reply, "webSearched": False, "sources": [], "locationQuery": None}
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Vision error: {e}")

    # Location detection
    location_query = None
    if LOC_RE.search(message):
        try:
            extracted = generate(
                "Extract place names from messages. Reply with ONLY the place name. If none, reply 'none'.",
                [{"role": "user", "content": f'Extract place name from: "{message}"'}],
                30
            )
            clean = extracted.strip()
            if clean and clean.lower() != "none" and len(clean) < 100:
                location_query = clean
        except Exception:
            pass

    try:
        chat_history = [{"role": m["role"], "content": m["content"]} for m in history]
        sources = []

        if needs_web_search(message, deep_think):
            sources, ctx = duckduckgo_search(message)
            chat_history.append({
                "role": "user",
                "content": f"User question: {message}\n\nWeb search results:\n{ctx or 'No results.'}\n\nAnswer using the search results."
            })
        else:
            user_msg = (
                f"[DEEP THINK MODE]\nReason inside <think>...</think> tags first, then give your response.\n\nUser message: {message}"
                if deep_think else message
            )
            chat_history.append({"role": "user", "content": user_msg})

        reply = generate(system_prompt, chat_history, 4096)
        return {"reply": reply, "webSearched": bool(sources), "sources": sources, "locationQuery": location_query}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference error: {e}")


@app.post("/api/search")
async def api_search(req: SearchRequest):
    message = req.message
    history = req.history
    chat_history = [{"role": m["role"], "content": m["content"]} for m in history]
    urls = URL_RE.findall(message)

    # Casual — no search needed
    if is_casual(message) and not urls:
        try:
            chat_history.append({"role": "user", "content": message})
            return {"reply": generate(SYSTEM_PROMPT, chat_history), "sources": [], "webSearched": False}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    # URL provided — fetch page content
    if urls:
        try:
            sources, ctx = [], ""
            for url in urls[:2]:
                text = fetch_page(url)
                ctx += f"\n\n--- Content from {url} ---\n{text or 'Could not fetch.'}"
                sources.append({"url": url, "title": url})
            user_prompt = URL_RE.sub("", message).strip() or "Summarize this page."
            chat_history.append({
                "role": "user",
                "content": f"User request: {user_prompt}\n\nPage content:{ctx}\n\nAnswer based on the page content."
            })
            return {"reply": generate(SYSTEM_PROMPT, chat_history), "sources": sources, "webSearched": True}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    # Regular web search
    try:
        sources, ctx = duckduckgo_search(message)
        chat_history.append({
            "role": "user",
            "content": f"User question: {message}\n\nSearch results:\n{ctx or 'No results.'}\n\nAnswer using the results."
        })
        reply = generate(SYSTEM_PROMPT, chat_history)
        return {"reply": reply, "sources": sources, "webSearched": True}
    except Exception as e:
        # Fallback to regular chat
        try:
            chat_history.append({"role": "user", "content": message})
            return {"reply": generate(SYSTEM_PROMPT, chat_history), "sources": []}
        except Exception:
            raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/tts")
async def api_tts(req: TTSRequest):
    try:
        from gtts import gTTS
        import io
        clean = re.sub(r"[*#_`<>'\"\\[\\]()]", "", req.text)[:2000]
        tts = gTTS(text=clean, lang="en")
        buf = io.BytesIO()
        tts.write_to_fp(buf)
        buf.seek(0)
        return Response(content=buf.read(), media_type="audio/mpeg")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"TTS error: {e}")


@app.post("/api/execute")
async def api_execute(req: ExecuteRequest):
    ext_map = {"python": "py", "javascript": "js", "js": "js"}
    ext = ext_map.get(req.language)
    if not ext:
        raise HTTPException(status_code=400, detail="Unsupported language")

    filepath = HELIX_WORKSPACE / f"temp_{int(time.time() * 1000)}.{ext}"
    try:
        filepath.write_text(req.code, encoding="utf-8")
        cmd = ["python", str(filepath)] if req.language == "python" else ["node", str(filepath)]
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=15)
        if result.returncode != 0:
            return {"success": False, "output": result.stderr or "Error"}
        return {"success": True, "output": result.stdout}
    except subprocess.TimeoutExpired:
        return {"success": False, "output": "Execution timed out (15s limit)"}
    except Exception as e:
        return {"success": False, "output": str(e)}
    finally:
        try:
            filepath.unlink()
        except Exception:
            pass


@app.post("/api/agent/wifi-scan")
async def agent_wifi_scan():
    """Scan for nearby WiFi networks using system tools."""
    try:
        import platform
        system = platform.system()
        networks = []

        if system == "Windows":
            result = subprocess.run(
                ["netsh", "wlan", "show", "networks", "mode=bssid"],
                capture_output=True, text=True, timeout=15
            )
            output = result.stdout
            current = {}
            for line in output.splitlines():
                line = line.strip()
                if line.startswith("SSID") and "BSSID" not in line:
                    if current:
                        networks.append(current)
                    ssid = line.split(":", 1)[-1].strip()
                    current = {"ssid": ssid, "signal": "", "security": "", "bssid": ""}
                elif "Signal" in line:
                    current["signal"] = line.split(":", 1)[-1].strip()
                elif "Authentication" in line:
                    current["security"] = line.split(":", 1)[-1].strip()
                elif "BSSID 1" in line:
                    current["bssid"] = line.split(":", 1)[-1].strip()
            if current:
                networks.append(current)

        elif system == "Linux":
            result = subprocess.run(
                ["nmcli", "-t", "-f", "SSID,SIGNAL,SECURITY,BSSID", "dev", "wifi", "list"],
                capture_output=True, text=True, timeout=15
            )
            for line in result.stdout.splitlines():
                parts = line.split(":")
                if len(parts) >= 3:
                    networks.append({
                        "ssid": parts[0] or "(Hidden)",
                        "signal": parts[1] + "%",
                        "security": parts[2],
                        "bssid": parts[3] if len(parts) > 3 else ""
                    })

        elif system == "Darwin":
            result = subprocess.run(
                ["/System/Library/PrivateFrameworks/Apple80211.framework/Versions/Current/Resources/airport", "-s"],
                capture_output=True, text=True, timeout=15
            )
            lines = result.stdout.splitlines()[1:]
            for line in lines:
                parts = line.split()
                if len(parts) >= 3:
                    networks.append({
                        "ssid": parts[0],
                        "signal": parts[2],
                        "security": parts[-1] if len(parts) > 3 else "Unknown",
                        "bssid": parts[1]
                    })

        if not networks:
            return {"success": False, "error": "No networks found or scan failed", "networks": []}

        return {"success": True, "networks": networks[:20], "count": len(networks)}

    except subprocess.TimeoutExpired:
        return {"success": False, "error": "Scan timed out", "networks": []}
    except Exception as e:
        return {"success": False, "error": str(e), "networks": []}


@app.post("/api/title")
async def api_title(req: TitleRequest):
    try:
        prompt = (
            "Generate a short casual chat title. Max 3 words. No quotes. No punctuation at end."
            if req.greetingOnly else
            "Generate a short specific chat title based on the topic. Never use generic titles like 'New Chat'. Max 5 words. No quotes. No punctuation at end."
        )
        title = generate(prompt, [{"role": "user", "content": f"Conversation:\n{req.message[:400]}"}], 25)
        return {"title": title.strip().strip("\"'")}
    except Exception:
        return {"title": req.message[:30]}


import smtplib
import random
import string
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

# ─────────────────────────────────────────────────────────────────────
# EMAIL AUTH
# ─────────────────────────────────────────────────────────────────────
GMAIL_USER = os.getenv("GMAIL_USER", "")
GMAIL_APP_PASSWORD = os.getenv("GMAIL_APP_PASSWORD", "")

# In-memory OTP store: { email: { code, expires } }
otp_store: dict = {}

class SendOTPRequest(BaseModel):
    email: str

class VerifyOTPRequest(BaseModel):
    email: str
    code: str

class WelcomeEmailRequest(BaseModel):
    email: str
    name: str

class LoginAlertRequest(BaseModel):
    email: str
    name: str
    ip: str = "Unknown"
    browser: str = "Unknown"
    location: str = "Unknown"

def send_email(to: str, subject: str, html: str):
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"HELIX AI <{GMAIL_USER}>"
    msg["To"] = to
    msg.attach(MIMEText(html, "html"))
    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
        server.login(GMAIL_USER, GMAIL_APP_PASSWORD)
        server.sendmail(GMAIL_USER, to, msg.as_string())

@app.post("/api/auth/send-otp")
async def send_otp(req: SendOTPRequest):
    code = "".join(random.choices(string.digits, k=6))
    otp_store[req.email] = {
        "code": code,
        "expires": datetime.utcnow() + timedelta(minutes=10)
    }
    # Preheader text floods the preview so the code doesn't show in notification
    preheader = "\u200c\u00a0" * 80
    html = f"""<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>body,html{{margin:0;padding:0;background:#000000!important;background-color:#000000!important;}}
div[style*="margin: 16px 0"]{{margin:0!important;}}
</style></head>
<body bgcolor="#000000" style="margin:0;padding:0;background:#000000!important;background-color:#000000!important;">
  <div style="display:none;font-size:1px;color:#000000;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">{preheader}</div>
  <div style="background:#000000;background-color:#000000;padding:40px 16px;min-height:100vh;">
    <div style="max-width:440px;margin:0 auto;">
      <p style="font-size:22px;font-weight:700;color:#ffffff;margin:0 0 24px;letter-spacing:-0.5px;">HELIX</p>
      <div style="background:#0d0d0d;border:1px solid #1e1e1e;border-radius:14px;padding:28px;">
        <p style="margin:0 0 4px;font-size:17px;font-weight:600;color:#ffffff;">Your sign-in code</p>
        <p style="margin:0 0 20px;font-size:13px;color:#666;line-height:1.6;">A sign-in was requested for your HELIX account. Use the code below — it expires in 10 minutes.</p>
        <div style="background:#111;border:1px solid #222;border-radius:10px;padding:20px;text-align:center;margin-bottom:20px;">
          <span style="font-size:38px;font-weight:800;color:#ffffff;letter-spacing:12px;">{code}</span>
        </div>
        <p style="margin:0;font-size:12px;color:#333;line-height:1.6;">Never share this. HELIX will never ask for it. If you didn't request this, ignore this email.</p>
      </div>
      <p style="margin:16px 0 0;font-size:11px;color:#222;text-align:center;">© 2026 HELIX AI</p>
    </div>
  </div>
</body></html>"""
    try:
        send_email(req.email, "Your HELIX sign-in code", html)
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send email: {e}")

@app.post("/api/auth/verify-otp")
async def verify_otp(req: VerifyOTPRequest):
    entry = otp_store.get(req.email)
    if not entry:
        raise HTTPException(status_code=400, detail="No code found for this email")
    if datetime.utcnow() > entry["expires"]:
        del otp_store[req.email]
        raise HTTPException(status_code=400, detail="Code expired")
    if entry["code"] != req.code:
        raise HTTPException(status_code=400, detail="Invalid code")
    del otp_store[req.email]
    # Extract name from email
    name = req.email.split("@")[0].replace(".", " ").replace("_", " ").title()
    register_or_update_user(req.email, name)
    return {"success": True, "name": name, "email": req.email}

@app.post("/api/auth/welcome")
async def send_welcome(req: WelcomeEmailRequest):
    html = f"""<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>body,html{{margin:0;padding:0;background:#000000!important;background-color:#000000!important;}}
div[style*="margin: 16px 0"]{{margin:0!important;}}
</style></head>
<body bgcolor="#000000" style="margin:0;padding:0;background:#000000!important;background-color:#000000!important;">
  <div style="background:#000000;background-color:#000000;padding:40px 16px;min-height:100vh;">
    <div style="max-width:460px;margin:0 auto;">
      <p style="font-size:22px;font-weight:700;color:#ffffff;margin:0 0 24px;letter-spacing:-0.5px;">HELIX</p>
      <div style="background:#0d0d0d;border:1px solid #1e1e1e;border-radius:14px;padding:28px;">
        <p style="margin:0 0 6px;font-size:20px;font-weight:700;color:#ffffff;">Hey {req.name} ⚡</p>
        <p style="margin:0 0 20px;font-size:13px;color:#555;">You're in. Welcome to HELIX.</p>
        <p style="margin:0 0 16px;font-size:14px;color:#999;line-height:1.8;">I'm your AI for cybersecurity, CTFs, bug bounty, and hacking. Sharp, direct, always on.</p>
        <p style="margin:0 0 20px;font-size:14px;color:#777;line-height:1.8;">Whether you're cracking CTF challenges, running recon, writing exploit scripts, or studying for OSCP — I've got you. Ask me anything, anytime.</p>
        <p style="margin:0;font-size:13px;color:#3a3a3a;font-style:italic;">"Break it to understand it."</p>
      </div>
      <p style="margin:16px 0 0;font-size:11px;color:#222;text-align:center;">© 2026 HELIX AI</p>
    </div>
  </div>
</body></html>"""
    try:
        send_email(req.email, f"Hey {req.name}, you're in ⚡", html)
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send welcome email: {e}")


@app.post("/api/auth/login-alert")
async def send_login_alert(req: LoginAlertRequest):
    from datetime import timezone
    now = datetime.now(timezone.utc).strftime("%a, %d %b %Y %H:%M:%S +0000")
    html = f"""<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>body,html{{margin:0;padding:0;background:#000000!important;background-color:#000000!important;}}
div[style*="margin: 16px 0"]{{margin:0!important;}}
</style></head>
<body bgcolor="#000000" style="margin:0;padding:0;background:#000000!important;background-color:#000000!important;">
  <div style="display:none;font-size:1px;color:#000000;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">New sign-in to your HELIX account detected.{"&#8203;&nbsp;" * 60}</div>
  <div style="background:#000000;background-color:#000000;padding:40px 16px;min-height:100vh;">
    <div style="max-width:440px;margin:0 auto;">
      <p style="font-size:22px;font-weight:700;color:#ffffff;margin:0 0 24px;letter-spacing:-0.5px;">HELIX</p>
      <div style="background:#0d0d0d;border:1px solid #1e1e1e;border-radius:14px;padding:28px;">
        <p style="margin:0 0 4px;font-size:17px;font-weight:600;color:#ffffff;">New sign-in detected 🔐</p>
        <p style="margin:0 0 24px;font-size:13px;color:#666;line-height:1.6;">Hi {req.name}, we noticed a new sign-in to your HELIX account.</p>
        <div style="border-top:1px solid #1a1a1a;padding-top:16px;margin-bottom:16px;">
          <p style="margin:0 0 2px;font-size:11px;color:#444;text-transform:uppercase;letter-spacing:0.08em;">Time</p>
          <p style="margin:0 0 14px;font-size:13px;color:#ccc;">{now}</p>
          <p style="margin:0 0 2px;font-size:11px;color:#444;text-transform:uppercase;letter-spacing:0.08em;">IP Address</p>
          <p style="margin:0 0 14px;font-size:13px;color:#ccc;">{req.ip}</p>
          <p style="margin:0 0 2px;font-size:11px;color:#444;text-transform:uppercase;letter-spacing:0.08em;">Location</p>
          <p style="margin:0 0 14px;font-size:13px;color:#ccc;">{req.location}</p>
          <p style="margin:0 0 2px;font-size:11px;color:#444;text-transform:uppercase;letter-spacing:0.08em;">Browser</p>
          <p style="margin:0;font-size:13px;color:#ccc;">{req.browser[:80]}</p>
        </div>
        <div style="background:#111;border:1px solid #1e1e1e;border-radius:8px;padding:14px;margin-top:16px;">
          <p style="margin:0;font-size:13px;color:#666;line-height:1.6;">If this was you, no action needed. If not, your account may be at risk.</p>
        </div>
      </div>
      <p style="margin:16px 0 0;font-size:11px;color:#222;text-align:center;">© 2026 HELIX AI</p>
    </div>
  </div>
</body></html>"""
    try:
        send_email(req.email, "New sign-in to your HELIX account", html)
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send login alert: {e}")


# ─────────────────────────────────────────────────────────────────────
# ADMIN ENDPOINTS
# ─────────────────────────────────────────────────────────────────────

VALID_PLANS = {"free", "pro", "proplus", "ultra"}


def _require_admin(request: Request):
    """Raise HTTP 401 if X-Admin-Secret header is missing or wrong."""
    secret = request.headers.get("x-admin-secret", "")
    if not ADMIN_SECRET or secret != ADMIN_SECRET:
        raise HTTPException(status_code=401, detail="Unauthorized")


class AdminBlockRequest(BaseModel):
    email: str

class AdminUnblockRequest(BaseModel):
    email: str

class AdminUpdatePlanRequest(BaseModel):
    email: str
    plan: str

class AdminSendEmailRequest(BaseModel):
    to: str
    subject: str
    body: str


@app.get("/api/admin/users")
async def admin_get_users(request: Request):
    _require_admin(request)
    return {"users": _users_registry}


@app.post("/api/admin/block")
async def admin_block(req: AdminBlockRequest, request: Request):
    _require_admin(request)
    user = next((u for u in _users_registry if u["email"] == req.email), None)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    user["blocked"] = True
    try:
        save_users()
    except Exception as e:
        print(f"[ERROR] admin_block save failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to save user data")
    return {"success": True, "user": user}


@app.post("/api/admin/unblock")
async def admin_unblock(req: AdminUnblockRequest, request: Request):
    _require_admin(request)
    user = next((u for u in _users_registry if u["email"] == req.email), None)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    user["blocked"] = False
    try:
        save_users()
    except Exception as e:
        print(f"[ERROR] admin_unblock save failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to save user data")
    return {"success": True, "user": user}


@app.post("/api/admin/update-plan")
async def admin_update_plan(req: AdminUpdatePlanRequest, request: Request):
    _require_admin(request)
    if req.plan not in VALID_PLANS:
        raise HTTPException(status_code=400, detail=f"Invalid plan. Must be one of: {', '.join(sorted(VALID_PLANS))}")
    user = next((u for u in _users_registry if u["email"] == req.email), None)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    user["plan"] = req.plan
    try:
        save_users()
    except Exception as e:
        print(f"[ERROR] admin_update_plan save failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to save user data")
    return {"success": True, "user": user}


@app.post("/api/admin/send-email")
async def admin_send_email(req: AdminSendEmailRequest, request: Request):
    _require_admin(request)
    try:
        send_email(req.to, req.subject, req.body)
        return {"success": True}
    except Exception as e:
        print(f"[ERROR] admin_send_email failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to send email")


# ─────────────────────────────────────────────────────────────────────
# STARTUP
# ─────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    print(f"\n🚀 HELIX Backend running at http://localhost:{PORT}")
    print(f"📁 Workspace: {HELIX_WORKSPACE}")
    print(f"📖 API docs:  http://localhost:{PORT}/docs\n")
    uvicorn.run("server:app", host="0.0.0.0", port=PORT, reload=False)