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
        return bool(re.search(r'\bhelix\b|@helix', content, re.IGNORECASE))

    async def forward_to_helix(self, message: dict, room_history: List[dict], participant_count: int, participant_names: List[str] = []) -> str:
        """Forward message to Helix AI backend (which is now this same server)."""
        import os
        # Since we are moving to a single backend, we can potentially call the internal function
        # but for compatibility, we can still hit the API or use a local import.
        # For now, let's assume we can call the internal chat logic or hit http://localhost:PORT/api/chat
        
        PORT = os.getenv("PORT", "8000")
        try:
            # Prepare history in the format Helix expects
            history = []
            for msg in room_history[-10:]:
                role = "assistant" if msg.get("isHelixResponse") else "user"
                history.append({
                    "role": role,
                    "content": f"{msg.get('senderName')}: {msg.get('content')}"
                })

            payload = {
                "message": message.get("content"),
                "history": history,
                "images": message.get("images") if message.get("images") else [],
                "groupChat": True,
                "participantNames": participant_names,
                "participantCount": participant_count
            }

            # We use a loopback request to the same server
            # Alternatively, we could import the chat function from server.py once restructured.
            # But hitting the local API is safer for porting logic exactly.
            response = requests.post(f"http://localhost:{PORT}/api/chat", json=payload, timeout=30)
            response.raise_for_status()
            
            return response.json().get("reply", "Helix is silent.")
        except Exception as e:
            print(f"[MessageHandler] Helix API error: {e}")
            raise Exception("Helix is temporarily unavailable. Try again in a moment.")

# Singleton instance
message_handler = MessageHandler()
