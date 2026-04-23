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
        "\n\n## CURRENT MODE\nThe user is currently in **Agent Mode**. When they ask you to perform an action (like scanning WiFi, running recon, etc.), you MUST respond with ONLY this raw JSON — no markdown, no code fences, no extra text whatsoever:\n{\"agent_action\": true, \"action_type\": \"wifi_scan\", \"message\": \"short one-line description\"}\nDo NOT wrap it in ```json``` or any other formatting. Output the raw JSON object and nothing else."
        if req.agentMode 
        else "\n\n## CURRENT MODE\nThe user is in **Chat Mode**. Respond normally with explanations and instructions. Do NOT output any JSON or agent action format under any circumstances."
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

if __name__ == "__main__":
    print(f"\n HELIX Backend running at http://localhost:{PORT}")
    print(f" Workspace: {HELIX_WORKSPACE}")
    print(f" API docs:  http://localhost:{PORT}/docs\n")
    uvicorn.run(sio_app, host="0.0.0.0", port=PORT, reload=False)