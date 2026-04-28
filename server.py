"""
HELIX Backend — FastAPI
-----------------------
Async API server for the HELIX AI platform.

To run:
    pip install fastapi uvicorn python-dotenv requests python-socketio
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
import asyncio
import socketio
import pyautogui
from pathlib import Path
from datetime import datetime, timedelta, timezone

import requests
import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel
from typing import Optional, List

# Services
from services.room_manager import room_manager
from services.message_handler import message_handler

# ─────────────────────────────────────────────────────────────────────
# LOAD ENV & CONFIG
# ─────────────────────────────────────────────────────────────────────
load_dotenv()

# Identity & Model logic
# Note: config.system_prompt and config.model are expected to exist in the directory
# If they don't, manually define them or ensure they are present.
try:
    from config.system_prompt import SYSTEM_PROMPT
    from config.model import generate, generate_vision
except ImportError:
    # Use environment fallback for SYSTEM_MESSAGE if config module fails
    SYSTEM_PROMPT = os.getenv("SYSTEM_MESSAGE", "## IDENTITY\nYou are HELIX, a sharp and friendly hacking AI.")
    def generate(prompt, history, max_tokens=2048):
        # This is a placeholder since the actual model integration depends on config/model.py
        return "[Error: config/model.py not found or generate function missing]"
    def generate_vision(prompt, message, image_bytes):
        return "[Error: vision logic missing]"

PORT = int(os.getenv("PORT", 8000))
HELIX_WORKSPACE = Path(os.getenv("HELIX_WORKSPACE", "./helix_workspace"))
HELIX_WORKSPACE.mkdir(parents=True, exist_ok=True)

# ─────────────────────────────────────────────────────────────────────
# USER REGISTRY
# ─────────────────────────────────────────────────────────────────────
USERS_FILE = Path(__file__).parent / "users.json"
_users_registry: list = []

def load_users() -> list:
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
    try:
        with open(USERS_FILE, "w", encoding="utf-8") as f:
            json.dump(_users_registry, f, indent=2)
    except Exception as e:
        print(f"[ERROR] Failed to save users.json: {e}")
        raise

def register_or_update_user(email: str, name: str, picture: Optional[str] = None) -> dict:
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

# Socket.io Integration
sio = socketio.AsyncServer(
    async_mode='asgi', 
    cors_allowed_origins="*",
    max_http_buffer_size=50 * 1024 * 1024 # 50MB for image sharing
)
sio_app = socketio.ASGIApp(sio, app)

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
    userName: str = "there"
    agentMode: bool = False
    ghostMode: bool = False

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
# SOCKET EVENTS
# ─────────────────────────────────────────────────────────────────────

@sio.event
async def connect(sid, environ):
    print(f"[WebSocket] Client connected: {sid}")

@sio.event
async def disconnect(sid):
    async with sio.session(sid) as session:
        room_id = session.get('roomId')
        participant_id = session.get('participantId')
        
        if room_id and participant_id:
            room_manager.mark_participant_offline(room_id, participant_id)
            print(f"[WebSocket] Participant {participant_id} disconnected from room {room_id}")
            
            await asyncio.sleep(8)
            room = room_manager.get_room(room_id)
            if room:
                participant = room["participants"].get(participant_id)
                if participant and not participant.get("isOnline"):
                    room_manager.remove_participant(room_id, participant_id)
                    await sio.emit('participant_left', participant_id, room=room_id)
                    
                    if len(room["participants"]) == 0:
                        room_manager.delete_room(room_id)

@sio.on('typing_start')
async def on_typing_start(sid, data):
    room_id = data.get('roomId')
    participant_name = data.get('participantName')
    if room_id and participant_name:
        await sio.emit('user_typing', {"participantName": participant_name}, room=room_id, skip_sid=sid)

@sio.on('typing_stop')
async def on_typing_stop(sid, data):
    room_id = data.get('roomId')
    participant_name = data.get('participantName')
    if room_id and participant_name:
        await sio.emit('user_stop_typing', {"participantName": participant_name}, room=room_id, skip_sid=sid)

@sio.on('create_room')
async def on_create_room(sid, data=None):
    room = room_manager.create_room()
    base_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
    invite_link = f"{base_url}/group/{room['id']}"
    print(f"[WebSocket] Room created: {room['id']}")
    return {"roomId": room["id"], "invite_link": invite_link}

@sio.on('join_room')
async def on_join_room(sid, data):
    room_id = data.get('roomId')
    participant = data.get('participant')
    
    room = room_manager.get_room(room_id)
    if not room:
        print(f"[WebSocket] Room {room_id} not found.")
        return {"error": "Room not found"}

    is_rejoin = participant.get("id") in room["participants"]
    participant_data = room_manager.add_participant(room_id, participant)
    
    if not participant_data:
        return {"error": "Failed to join room"}
    
    await sio.enter_room(sid, room_id)
    async with sio.session(sid) as session:
        session['roomId'] = room_id
        session['participantId'] = participant_data["id"]

    print(f"[WebSocket] Participant {participant_data['id']} joined room {room_id}")

    if not is_rejoin:
        await sio.emit('participant_joined', participant_data, room=room_id, skip_sid=sid)

    return {
        "success": True,
        "messages": room_manager.get_room_messages(room_id),
        "participants": room_manager.get_room_participants(room_id)
    }

@sio.on('send_message')
async def on_send_message(sid, data):
    room_id = data.get('roomId')
    message = data.get('message')
    
    async with sio.session(sid) as session:
        participant_id = session.get('participantId')
    
    if not room_id or not participant_id:
        return {"error": "Session error"}

    result = message_handler.process_message(message, participant_id)
    if not result["success"]:
        return {"error": result["error"]}

    processed_msg = room_manager.add_message(room_id, result["message"])
    if not processed_msg:
        return {"error": "Failed to save message"}

    await sio.emit('message_broadcast', processed_msg, room=room_id)
    
    room = room_manager.get_room(room_id)
    p_count = len(room["participants"])
    
    # Proactive response: 1on1, explicit mention, or 88% chance in group active talk
    mention = message_handler.detect_helix_mention(processed_msg["content"])
    should_respond = p_count == 1 or mention or (random.random() < 0.88 and len(processed_msg["content"]) > 3)

    if should_respond:
        try:
            await sio.emit('helix_typing', True, room=room_id)
            history = room_manager.get_room_messages(room_id)
            names = [p["name"] for p in room["participants"].values() if p.get("name") != "Helix AI"]
            
            ai_reply = await message_handler.forward_to_helix(processed_msg, history, p_count, names)
            
            # Match energy - strip formal prefixes if energy is casual
            if any(n.lower() in ["dark", "bro", "yo"] for n in names) and len(ai_reply) > 10:
                # Slight energy matching if the group is casual
                pass

            helix_msg = {
                "roomId": room_id,
                "senderId": "helix",
                "senderName": "Helix AI",
                "content": ai_reply,
                "isHelixResponse": True
            }
            
            full_helix_msg = room_manager.add_message(room_id, helix_msg)
            await sio.emit('helix_typing', False, room=room_id)
            await sio.emit('message_broadcast', full_helix_msg, room=room_id)
        except Exception as e:
            await sio.emit('helix_typing', False, room=room_id)
            err_msg = room_manager.add_message(room_id, {
                "roomId": room_id, "senderId": "helix", "senderName": "Helix AI",
                "content": str(e), "isHelixResponse": True
            })
            await sio.emit('message_broadcast', err_msg, room=room_id)

    return {"success": True, "messageId": processed_msg["id"]}

# ─────────────────────────────────────────────────────────────────────
# REST ROUTES
# ─────────────────────────────────────────────────────────────────────

@app.get("/")
async def root():
    return {"message": "HELIX Backend API is running"}

@app.get("/api/rooms/{room_id}/exists")
async def check_room_exists(room_id: str):
    room = room_manager.get_room(room_id)
    return {"exists": room is not None}

@app.post("/api/chat")
async def api_chat(req: ChatRequest):
    if req.email:
        user = next((u for u in _users_registry if u["email"] == req.email), None)
        if user and user.get("blocked"):
            raise HTTPException(status_code=403, detail="Your account has been suspended.")

    message = req.message
    history = req.history
    deep_think = req.deepThink
    images = req.images

    user_identity = (
        "\n\n## GHOST MODE ACTIVE\nThe user is in Ghost Mode. You have NO information about their identity, username, or any personal details. If they ask \"what is my name?\" or similar questions, respond that you don't have that information in Ghost Mode — no traces, no identity data." 
        if req.ghostMode 
        else f"\n\n## CURRENT USER\nThe user's name is **{req.userName}**. Only use their name in the three situations defined above."
    )
    
    group_chat_context = ""
    if req.groupChat:
        part_str = "s" if req.participantCount != 1 else ""
        name_list = ", ".join(req.participantNames) if req.participantNames else "the group"
        group_chat_context = (
            f"\n\n## GROUP CHAT MODE\n"
            f"You are in a group chat with {req.participantCount} participant{part_str}: {name_list}. "
            "Address people by their names. Match the group's energy—if they joke, joke back. "
            "Keep responses SNAPPY and SHORT. Match the emoji density of the group strictly—if others don't use emojis, you MUST NOT use them either. "
            "Only use emojis if the group is actively using them. If someone is wrong, point it out jokingly. "
            "You are a member of the conversation, not just a tool."
        )
    agent_context = (
        "\n\n## CURRENT MODE\nThe user is in **Agent Mode**. When they ask for a native action (WiFi scan, opening folders/files, launching apps, system info), you MUST respond with ONLY the raw JSON object — no markdown, no explanation. Just the JSON.\n\n"
        "Supported actions:\n"
        "- `wifi_scan`: Scan networks\n"
        "- `open_folder`: params `{\"folder_name\": \"...\"}`\n"
        "- `open_app`: params `{\"app_name\": \"...\"}`\n"
        "- `screenshot`: Take a screenshot\n"
        "- `get_system_info`: CPU/RAM info\n\n"
        "Example: `{\"agent_action\": true, \"action_type\": \"open_folder\", \"params\": {\"folder_name\": \"screenshots\"}, \"message\": \"Opening your screenshots folder...\"}`\n"
        "DO NOT ask for permission for these simple tasks. Just output the JSON."
        if req.agentMode 
        else "\n\n## CURRENT MODE\nThe user is in **Chat Mode**. Respond normally. Do NOT output any JSON."
    )

    system_prompt = f"{SYSTEM_PROMPT}{user_identity}{group_chat_context}{agent_context}"

    if images:
        try:
            raw = re.sub(r"^data:image/\w+;base64,", "", images[0])
            image_bytes = list(base64.b64decode(raw))
            reply = generate_vision(system_prompt, message, image_bytes)
            return {"reply": reply, "webSearched": False, "sources": [], "locationQuery": None}
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Vision error: {e}")

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
        print(f"[API] Generated reply ({len(reply)} chars)")
        return {"reply": reply, "webSearched": bool(sources), "sources": sources, "locationQuery": location_query}
    except Exception as e:
        print(f"[ERROR] Inference failed: {e}")
        raise HTTPException(status_code=500, detail=f"Inference error: {e}")

@app.post("/api/search")
async def api_search(req: SearchRequest):
    message = req.message
    history = req.history
    chat_history = [{"role": m["role"], "content": m["content"]} for m in history]
    urls = URL_RE.findall(message)

    if is_casual(message) and not urls:
        try:
            chat_history.append({"role": "user", "content": message})
            return {"reply": generate(SYSTEM_PROMPT, chat_history), "sources": [], "webSearched": False}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    if urls:
        try:
            sources, ctx = [], ""
            for url in urls[:2]:
                text = fetch_page(url)
                ctx += f"\n\n--- Content from ${url} ---\n${text or 'Could not fetch.'}"
                sources.append({"url": url, "title": url})
            user_prompt = URL_RE.sub("", message).strip() or "Summarize this page."
            chat_history.append({
                "role": "user",
                "content": f"User request: {user_prompt}\n\nPage content:{ctx}\n\nAnswer based on the page content."
            })
            return {"reply": generate(SYSTEM_PROMPT, chat_history), "sources": sources, "webSearched": True}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    try:
        sources, ctx = duckduckgo_search(message)
        chat_history.append({
            "role": "user",
            "content": f"User question: {message}\n\nSearch results:\n{ctx or 'No results.'}\n\nAnswer using the results."
        })
        reply = generate(SYSTEM_PROMPT, chat_history)
        return {"reply": reply, "sources": sources, "webSearched": True}
    except Exception as e:
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

# ── EMAIL & AUTH ROUTES ──
# (These paths follow the standard production structure)

@app.get("/api/admin/users")
async def admin_get_users(request: Request):
    if not ADMIN_SECRET or request.headers.get("x-admin-secret") != ADMIN_SECRET:
        raise HTTPException(status_code=401, detail="Unauthorized")
    return {"users": _users_registry}

@app.post("/api/admin/update-plan")
async def api_update_plan(request: Request):
    if not ADMIN_SECRET or request.headers.get("x-admin-secret") != ADMIN_SECRET:
        raise HTTPException(status_code=401, detail="Unauthorized")
    req = await request.json()
    email = req.get("email")
    plan = req.get("plan")
    if not email or not plan:
        raise HTTPException(status_code=400, detail="Email and Plan required")
    
    user = next((u for u in _users_registry if u["email"] == email), None)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user["plan"] = plan
    save_users()
    return user

@app.post("/api/admin/register-user")
async def api_register_user(req: dict):
    email = req.get("email")
    name = req.get("name")
    picture = req.get("picture")
    if not email:
        raise HTTPException(status_code=400, detail="Email required")
    user = register_or_update_user(email, name, picture)
    return user

@app.post("/api/agent/open-folder")
async def api_open_folder(req: dict):
    folder = req.get("folder_name", "").lower()
    try:
        if folder == "screenshots":
            path = Path.home() / "Pictures" / "Screenshots"
        elif folder == "downloads":
            path = Path.home() / "Downloads"
        elif folder == "documents":
            path = Path.home() / "Documents"
        else:
            # Default to explorer or specific path if provided
            subprocess.Popen(["explorer.exe"])
            return {"success": True}
            
        if path.exists():
            subprocess.Popen(["explorer.exe", str(path)])
        else:
            subprocess.Popen(["explorer.exe"])
        return {"success": True}
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.post("/api/agent/open-app")
async def api_open_app(req: dict):
    app_name = req.get("app_name", "").lower()
    try:
        apps = {
            "chrome": "chrome.exe",
            "notepad": "notepad.exe",
            "calc": "calc.exe",
            "calculator": "calc.exe",
            "explorer": "explorer.exe",
            "cmd": "cmd.exe",
            "powershell": "powershell.exe"
        }
        target = apps.get(app_name, app_name)
        subprocess.Popen(f"start {target}", shell=True)
        return {"success": True}
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.post("/api/agent/wifi-scan")
async def api_wifi_scan():
    try:
        # Simple windows wifi scan simulation/call
        result = subprocess.run(["netsh", "wlan", "show", "networks"], capture_output=True, text=True)
        return {"success": True, "output": result.stdout}
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.post("/api/agent/mouse-move")
async def api_mouse_move(req: dict):
    x = req.get("x", 0)
    y = req.get("y", 0)
    try:
        pyautogui.moveTo(x, y, duration=0.5)
        return {"success": True}
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.post("/api/agent/click")
async def api_click():
    try:
        pyautogui.click()
        return {"success": True}
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.post("/api/agent/type")
async def api_type(req: dict):
    text = req.get("text", "")
    try:
        pyautogui.write(text, interval=0.1)
        return {"success": True}
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.post("/api/auth/check-blocked")
async def api_check_blocked(req: dict):
    email = req.get("email")
    user = next((u for u in _users_registry if u["email"] == email), None)
    return {"blocked": user.get("blocked", False) if user else False}

@app.post("/api/auth/login-alert")
async def api_login_alert(req: dict):
    return {"status": "sent"}

@app.post("/api/auth/welcome")
async def api_welcome(req: dict):
    return {"status": "sent"}

@app.post("/api/auth/check-session")
async def api_check_session(req: dict):
    return {"valid": True}

@app.post("/api/auth/heartbeat")
async def api_heartbeat(req: dict):
    email = req.get("email")
    if not email:
        return {"success": False}
    
    user = next((u for u in _users_registry if u["email"] == email), None)
    if user:
        user["lastActiveAt"] = datetime.now(timezone.utc).isoformat()
        save_users()
        return {"success": True}
    return {"success": False}

# ── OTP STORE (in-memory) ──
import random as _random
import smtplib
from email.mime.text import MIMEText

_otp_store: dict = {}  # email -> {code, expires_at, name}

SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASS = os.getenv("SMTP_PASS", "")
FROM_EMAIL = os.getenv("FROM_EMAIL", SMTP_USER)

def send_otp_email(to_email: str, code: str) -> bool:
    if not SMTP_USER or not SMTP_PASS:
        print(f"[OTP] Code for {to_email}: {code}")
        return True
    try:
        from email.mime.multipart import MIMEMultipart

        html = f"""<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <meta name="color-scheme" content="dark" />
  <meta name="supported-color-schemes" content="dark" />
  <title>HELIX Verification</title>
  <style>
    :root {{ color-scheme: dark; }}
    body {{
      margin: 0 !important;
      padding: 0 !important;
      background-color: #141414 !important;
      -webkit-text-size-adjust: 100%;
    }}
    table {{ border-collapse: collapse; }}
    .outer-bg {{ background-color: #141414 !important; }}
    .card-bg {{ background-color: #1a1a1a !important; }}
    .code-bg {{ background-color: #111111 !important; }}
    .footer-bg {{ background-color: #161616 !important; }}
    @media (prefers-color-scheme: dark) {{
      body, .outer-bg {{ background-color: #141414 !important; }}
      .card-bg {{ background-color: #1a1a1a !important; }}
      .code-bg {{ background-color: #111111 !important; }}
    }}
  </style>
</head>
<body bgcolor="#141414" style="margin:0;padding:0;background-color:#141414 !important;">

  <!-- Preheader (hidden) -->
  <span style="display:none;max-height:0;overflow:hidden;">Your HELIX verification code &#847;</span>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#141414" class="outer-bg"
    style="background-color:#141414 !important;padding:48px 16px;">
    <tr>
      <td align="center">

        <!-- Card -->
        <table role="presentation" width="480" cellpadding="0" cellspacing="0" bgcolor="#1a1a1a" class="card-bg"
          style="background-color:#1a1a1a !important;border:1px solid #2a2a2a;border-radius:16px;overflow:hidden;max-width:480px;width:100%;">

          <!-- Header -->
          <tr>
            <td bgcolor="#1a1a1a" class="card-bg"
              style="background-color:#1a1a1a !important;padding:28px 36px 20px;border-bottom:1px solid #252525;">
              <span style="font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">Helix</span>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td bgcolor="#1a1a1a" class="card-bg"
              style="background-color:#1a1a1a !important;padding:36px 36px 28px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
              <p style="margin:0 0 6px;font-size:11px;color:#555555;text-transform:uppercase;letter-spacing:2px;font-weight:700;">Verification Code</p>
              <h1 style="margin:0 0 16px;font-size:26px;font-weight:500;color:#e8e8e8;line-height:1.25;">Confirm your email</h1>
              <p style="margin:0 0 28px;font-size:14px;color:#666666;line-height:1.75;">
                Use the code below to verify your identity and sign in to your HELIX account.
              </p>

              <!-- Code Box -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td align="center" bgcolor="#111111" class="code-bg"
                    style="background-color:#111111 !important;border:1px solid #2a2a2a;border-radius:12px;padding:26px 16px;">
                    <span style="font-size:42px;font-weight:700;letter-spacing:16px;color:#ffffff !important;font-family:'Courier New',Courier,monospace;">{code}</span>
                  </td>
                </tr>
              </table>

              <p style="margin:0;font-size:12px;color:#444444;line-height:1.75;">
                If you didn't request this, you can safely ignore this email. Someone may have entered your address by mistake.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td bgcolor="#161616" class="footer-bg"
              style="background-color:#161616 !important;padding:16px 36px 20px;border-top:1px solid #212121;">
              <p style="margin:0;font-size:11px;color:#333333;line-height:1.6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
                &copy; 2025 Helix Core &middot; All rights reserved
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>"""

        msg = MIMEMultipart("alternative")
        msg["Subject"] = "Your HELIX verification code"
        msg["From"] = f"Helix <{FROM_EMAIL}>"
        msg["To"] = to_email
        msg.attach(MIMEText(f"Your HELIX verification code is: {code}", "plain"))
        msg.attach(MIMEText(html, "html"))

        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASS)
            server.sendmail(FROM_EMAIL, [to_email], msg.as_string())
        return True
    except Exception as e:
        print(f"[OTP] Email send failed: {e}")
        return False

@app.post("/api/auth/send-otp")
async def api_send_otp(req: dict):
    email = req.get("email", "").strip().lower()
    if not email or "@" not in email:
        raise HTTPException(status_code=400, detail="Invalid email")

    code = str(_random.randint(100000, 999999))
    expires = datetime.now(timezone.utc) + timedelta(minutes=10)
    _otp_store[email] = {"code": code, "expires_at": expires}
    
    print(f"\n{'='*40}")
    print(f"  [OTP GENERATED] {code} for {email}")
    print(f"{'='*40}\n")
    
    success = send_otp_email(email, code)
    if not success:
        # We don't throw 500 here yet, just log it. 
        # Actually, let's throw it so the user knows.
        raise HTTPException(status_code=500, detail="Email delivery failed. Check SMTP credentials.")
    
    return {"status": "sent"}

    ok = send_otp_email(email, code)
    if not ok:
        raise HTTPException(status_code=500, detail="Failed to send email")

    return {"status": "sent"}

@app.post("/api/auth/verify-otp")
async def api_verify_otp(req: dict):
    email = req.get("email", "").strip().lower()
    code = req.get("code", "").strip()

    entry = _otp_store.get(email)
    if not entry:
        raise HTTPException(status_code=400, detail="No OTP found for this email. Request a new one.")

    if datetime.now(timezone.utc) > entry["expires_at"]:
        del _otp_store[email]
        raise HTTPException(status_code=400, detail="Code expired. Request a new one.")

    if entry["code"] != code:
        raise HTTPException(status_code=400, detail="Invalid code")

    del _otp_store[email]

    # Register or update user
    name = email.split("@")[0].capitalize()
    user = register_or_update_user(email, name)

    return {"email": user["email"], "name": user["name"], "plan": user.get("plan", "free")}

@app.post("/api/agent/execute")
async def api_agent_execute(req: dict):
    from services.agent_core import agent_core
    result = agent_core.execute_command(req)
    return result

if __name__ == "__main__":
    print(f"\n HELIX Backend running at http://localhost:{PORT}")
    print(f" Workspace: {HELIX_WORKSPACE}")
    print(f" API docs:  http://localhost:{PORT}/docs\n")
    uvicorn.run(sio_app, host="0.0.0.0", port=PORT, reload=False)