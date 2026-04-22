import time
import uuid
from typing import Dict, List, Optional

class RoomManager:
    def __init__(self):
        # In-memory storage for rooms
        # roomId -> { id, createdAt, participants: { id -> data }, messages: [], lastActivity }
        self.rooms: Dict[str, dict] = {}

    def create_room(self) -> dict:
        """Create a new room with a unique ID."""
        room_id = str(uuid.uuid4()).split('-')[0] + str(int(time.time()))[-5:]
        room_id = room_id[:13] # 13-character unique ID
        
        room = {
            "id": room_id,
            "createdAt": int(time.time() * 1000),
            "participants": {},
            "messages": [],
            "lastActivity": int(time.time() * 1000)
        }
        
        self.rooms[room_id] = room
        print(f"[RoomManager] Room created: {room_id}")
        
        return room

    def get_room(self, room_id: str) -> Optional[dict]:
        """Get room by ID."""
        return self.rooms.get(room_id)

    def add_participant(self, room_id: str, participant: dict) -> Optional[dict]:
        """Add participant to room."""
        room = self.get_room(room_id)
        if not room:
            return None

        participant_id = participant.get("id") or str(uuid.uuid4())
        participant_data = {
            **participant,
            "id": participant_id,
            "joinedAt": int(time.time() * 1000),
            "isOnline": True
        }
        
        room["participants"][participant_id] = participant_data
        room["lastActivity"] = int(time.time() * 1000)
        
        print(f"[RoomManager] Participant {participant_id} added to room {room_id}")
        
        return participant_data

    def remove_participant(self, room_id: str, participant_id: str) -> bool:
        """Remove participant from room."""
        room = self.get_room(room_id)
        if not room or not participant_id:
            return False

        if participant_id in room["participants"]:
            del room["participants"][participant_id]
            room["lastActivity"] = int(time.time() * 1000)
            print(f"[RoomManager] Participant {participant_id} removed from room {room_id}")
            return True
        
        return False

    def mark_participant_offline(self, room_id: str, participant_id: str) -> bool:
        """Mark participant as offline."""
        room = self.get_room(room_id)
        if not room:
            return False

        participant = room["participants"].get(participant_id)
        if participant:
            participant["isOnline"] = False
            print(f"[RoomManager] Participant {participant_id} marked offline in room {room_id}")
            return True
        
        return False

    def get_room_participants(self, room_id: str) -> List[dict]:
        """Get all participants in a room."""
        room = self.get_room(room_id)
        if not room:
            return []

        return list(room["participants"].values())

    def get_room_messages(self, room_id: str, limit: int = 500) -> List[dict]:
        """Get all messages in a room."""
        room = self.get_room(room_id)
        if not room:
            return []

        # Return most recent messages up to limit
        return room["messages"][-limit:]

    def add_message(self, room_id: str, message: dict) -> Optional[dict]:
        """Add message to room."""
        room = self.get_room(room_id)
        if not room:
            return None

        message_data = {
            **message,
            "id": message.get("id") or str(uuid.uuid4()),
            "timestamp": message.get("timestamp") or int(time.time() * 1000)
        }

        room["messages"].append(message_data)
        room["lastActivity"] = int(time.time() * 1000)

        # Limit message history to 500 messages per room
        if len(room["messages"]) > 500:
            room["messages"] = room["messages"][-500:]

        print(f"[RoomManager] Message added to room {room_id}")
        
        return message_data

    def get_all_rooms(self) -> List[dict]:
        """Get all active rooms."""
        return list(self.rooms.values())

    def delete_room(self, room_id: str) -> bool:
        """Delete room."""
        if room_id in self.rooms:
            del self.rooms[room_id]
            print(f"[RoomManager] Room {room_id} deleted")
            return True
        return False

    def cleanup_inactive_rooms(self) -> int:
        """Clean up inactive rooms (no participants for 24 hours)."""
        now = int(time.time() * 1000)
        inactive_threshold = 24 * 60 * 60 * 1000 # 24 hours
        cleaned_count = 0

        rooms_to_delete = []
        for room_id, room in self.rooms.items():
            has_no_participants = len(room["participants"]) == 0
            is_inactive = (now - room["lastActivity"]) > inactive_threshold

            if has_no_participants and is_inactive:
                rooms_to_delete.append(room_id)

        for room_id in rooms_to_delete:
            self.delete_room(room_id)
            cleaned_count += 1

        if cleaned_count > 0:
            print(f"[RoomManager] Cleaned up {cleaned_count} inactive rooms")

        return cleaned_count

# Singleton instance
room_manager = RoomManager()
