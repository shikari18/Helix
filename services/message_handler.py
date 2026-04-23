import time
import uuid
import re
import html
import requests
from typing import Dict, List, Optional

class MessageHandler:
    def __init__(self):
        # Rate limiting: track message counts per participant
        # participantId -> { count, resetTime }
        self.rate_limits: Dict[str, dict] = {}
        self.MAX_MESSAGES_PER_WINDOW = 10
        self.RATE_LIMIT_WINDOW = 10 * 1000 # 10 seconds
        self.MAX_MESSAGE_LENGTH = 4000

    def validate_message(self, content: str) -> dict:
        """Validate message content."""
        if not content or not content.strip():
            return {"valid": False, "error": "Message cannot be empty"}

        if len(content) > self.MAX_MESSAGE_LENGTH:
            return {"valid": False, "error": f"Message exceeds maximum length of {self.MAX_MESSAGE_LENGTH} characters"}

        return {"valid": True, "error": None}

    def sanitize_message(self, content: str) -> str:
        """Sanitize message content to prevent XSS."""
        # Escape HTML special characters
        sanitized = html.escape(content)
        
        # Remove any script tags (extra safety)
        sanitized = re.sub(r'<script\b[^<]*(?:(?!</script>)<[^<]*)*</script>', '', sanitized, flags=re.IGNORECASE)
        
        return sanitized

    def check_rate_limit(self, participant_id: str) -> dict:
        """Check rate limit for participant."""
        now = int(time.time() * 1000)
        limit = self.rate_limits.get(participant_id)

        if not limit or now > limit["resetTime"]:
            # Reset or initialize rate limit
            self.rate_limits[participant_id] = {
                "count": 1,
                "resetTime": now + self.RATE_LIMIT_WINDOW
            }
            return {"allowed": True, "error": None}

        if limit["count"] >= self.MAX_MESSAGES_PER_WINDOW:
            return {
                "allowed": False,
                "error": f"Rate limit exceeded. Please wait {max(1, int((limit['resetTime'] - now) / 1000))} seconds."
            }

        # Increment count
        limit["count"] += 1
        return {"allowed": True, "error": None}

    def process_message(self, message: dict, participant_id: str) -> dict:
        """Process and validate message before broadcasting."""
        content = message.get("content", "")
        
        # Validate content
        validation = self.validate_message(content)
        if not validation["valid"]:
            return {"success": False, "message": None, "error": validation["error"]}

        # Check rate limit
        rate_check = self.check_rate_limit(participant_id)
        if not rate_check["allowed"]:
            return {"success": False, "message": None, "error": rate_check["error"]}

        # Sanitize content
        sanitized_content = self.sanitize_message(content)

        # Create processed message
        processed_message = {
            "id": message.get("id") or str(uuid.uuid4()),
            "roomId": message.get("roomId"),
            "senderId": message.get("senderId"),
            "senderName": html.escape(message.get("senderName", "Anonymous")),
            "senderAvatar": message.get("senderAvatar", ""),
            "content": sanitized_content,
            "images": message.get("images", []),
            "timestamp": int(time.time() * 1000),
            "isHelixResponse": message.get("isHelixResponse", False)
        }

        return {"success": True, "message": processed_message, "error": None}

    def cleanup_rate_limits(self) -> int:
        """Clean up old rate limit entries."""
        now = int(time.time() * 1000)
        cleaned_count = 0

        ids_to_delete = []
        for participant_id, limit in self.rate_limits.items():
            if now > limit["resetTime"] + (60 * 1000): # Clean up entries older than 1 minute past reset
                ids_to_delete.append(participant_id)

        for p_id in ids_to_delete:
            del self.rate_limits[p_id]
            cleaned_count += 1

        if cleaned_count > 0:
            print(f"[MessageHandler] Cleaned up {cleaned_count} old rate limit entries")

        return cleaned_count

    def detect_helix_mention(self, content: str) -> bool:
        """Detect if message mentions Helix AI."""
        if not content:
            return False
        
        # Check for "helix" or "@helix" patterns
        return bool(re.search(r'\bhelix\b|^helix|@helix', content, re.IGNORECASE))

    async def forward_to_helix(self, message: dict, room_history: List[dict], participant_count: int, participant_names: List[str] = []) -> str:
        """Forward message to Helix AI backend (non-blocking)."""
        import os
        import asyncio
        
        PORT = os.getenv("PORT", "8000")
        
        def _call_api():
            try:
                # Prepare history
                history = []
                for msg in room_history[-15:]:
                    is_helix = msg.get("isHelixResponse")
                    role = "assistant" if is_helix else "user"
                    # Assistant role doesn't need its name prefixed in history
                    content = msg.get('content') if is_helix else f"{msg.get('senderName')}: {msg.get('content')}"
                    history.append({
                        "role": role,
                        "content": content
                    })

                payload = {
                    "message": message.get("content"),
                    "history": history,
                    "images": message.get("images") if message.get("images") else [],
                    "groupChat": True,
                    "participantNames": participant_names,
                    "participantCount": participant_count
                }

                # Use 127.0.0.1 instead of localhost for more reliable binding resolution
                response = requests.post(f"http://127.0.0.1:{PORT}/api/chat", json=payload, timeout=40)
                response.raise_for_status()
                return response.json().get("reply", "Helix is silent.")
            except Exception as e:
                print(f"[MessageHandler] Threaded API error: {e}")
                return "Helix is temporarily unavailable."

        # Run the blocking requests code in a separate thread
        return await asyncio.to_thread(_call_api)

# Singleton instance
message_handler = MessageHandler()
