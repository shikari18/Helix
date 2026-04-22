const { v4: uuidv4 } = require('uuid');

/**
 * RoomManager Service
 * Handles room creation, participant tracking, and message storage
 */

class RoomManager {
    constructor() {
        // In-memory storage for rooms
        this.rooms = new Map();
    }

    /**
     * Create a new room with unique ID
     * @returns {Object} Room object with id, createdAt, participants, messages
     */
    createRoom() {
        const roomId = uuidv4().substring(0, 13); // 13-character unique ID
        const room = {
            id: roomId,
            createdAt: Date.now(),
            participants: new Map(),
            messages: [],
            lastActivity: Date.now()
        };
        
        this.rooms.set(roomId, room);
        console.log(`[RoomManager] Room created: ${roomId}`);
        
        return room;
    }

    /**
     * Get room by ID
     * @param {string} roomId - Room identifier
     * @returns {Object|null} Room object or null if not found
     */
    getRoom(roomId) {
        return this.rooms.get(roomId) || null;
    }

    /**
     * Add participant to room
     * @param {string} roomId - Room identifier
     * @param {Object} participant - Participant data
     * @returns {Object|null} Participant object or null if room not found
     */
    addParticipant(roomId, participant) {
        const room = this.getRoom(roomId);
        
        if (!room) {
            return null;
        }

        const participantId = participant.id || uuidv4();
        const participantData = {
            ...participant,
            id: participantId,
            joinedAt: Date.now(),
            isOnline: true
        };
        
        room.participants.set(participantId, participantData);
        room.lastActivity = Date.now();
        
        console.log(`[RoomManager] Participant ${participantId} added to room ${roomId}`);
        
        return participantData;
    }

    /**
     * Remove participant from room
     * @param {string} roomId - Room identifier
     * @param {string} participantId - Participant identifier
     * @returns {boolean} True if removed, false if not found
     */
    removeParticipant(roomId, participantId) {
        const room = this.getRoom(roomId);
        
        if (!room || !participantId) {
            return false;
        }

        const removed = room.participants.delete(participantId);
        
        if (removed) {
            room.lastActivity = Date.now();
            console.log(`[RoomManager] Participant ${participantId} removed from room ${roomId}`);
        }
        
        return removed;
    }

    /**
     * Mark participant as offline
     * @param {string} roomId - Room identifier
     * @param {string} participantId - Participant identifier
     * @returns {boolean} True if updated, false if not found
     */
    markParticipantOffline(roomId, participantId) {
        const room = this.getRoom(roomId);
        
        if (!room) {
            return false;
        }

        const participant = room.participants.get(participantId);
        
        if (participant) {
            participant.isOnline = false;
            console.log(`[RoomManager] Participant ${participantId} marked offline in room ${roomId}`);
            return true;
        }
        
        return false;
    }

    /**
     * Get all participants in a room
     * @param {string} roomId - Room identifier
     * @returns {Array} Array of participant objects
     */
    getRoomParticipants(roomId) {
        const room = this.getRoom(roomId);
        
        if (!room) {
            return [];
        }

        return Array.from(room.participants.values());
    }

    /**
     * Get all messages in a room
     * @param {string} roomId - Room identifier
     * @param {number} limit - Maximum number of messages to return (default: 500)
     * @returns {Array} Array of message objects
     */
    getRoomMessages(roomId, limit = 500) {
        const room = this.getRoom(roomId);
        
        if (!room) {
            return [];
        }

        // Return most recent messages up to limit
        return room.messages.slice(-limit);
    }

    /**
     * Add message to room
     * @param {string} roomId - Room identifier
     * @param {Object} message - Message object
     * @returns {Object|null} Message object with ID and timestamp, or null if room not found
     */
    addMessage(roomId, message) {
        const room = this.getRoom(roomId);
        
        if (!room) {
            return null;
        }

        const messageData = {
            ...message,
            id: message.id || uuidv4(),
            timestamp: message.timestamp || Date.now()
        };

        room.messages.push(messageData);
        room.lastActivity = Date.now();

        // Limit message history to 500 messages per room
        if (room.messages.length > 500) {
            room.messages = room.messages.slice(-500);
        }

        console.log(`[RoomManager] Message added to room ${roomId}`);
        
        return messageData;
    }

    /**
     * Get all active rooms
     * @returns {Array} Array of room objects
     */
    getAllRooms() {
        return Array.from(this.rooms.values());
    }

    /**
     * Delete room
     * @param {string} roomId - Room identifier
     * @returns {boolean} True if deleted, false if not found
     */
    deleteRoom(roomId) {
        const deleted = this.rooms.delete(roomId);
        
        if (deleted) {
            console.log(`[RoomManager] Room ${roomId} deleted`);
        }
        
        return deleted;
    }

    /**
     * Clean up inactive rooms (no participants for 24 hours)
     * Should be called periodically
     */
    cleanupInactiveRooms() {
        const now = Date.now();
        const inactiveThreshold = 24 * 60 * 60 * 1000; // 24 hours
        let cleanedCount = 0;

        for (const [roomId, room] of this.rooms.entries()) {
            const hasNoParticipants = room.participants.size === 0;
            const isInactive = (now - room.lastActivity) > inactiveThreshold;

            if (hasNoParticipants && isInactive) {
                this.deleteRoom(roomId);
                cleanedCount++;
            }
        }

        if (cleanedCount > 0) {
            console.log(`[RoomManager] Cleaned up ${cleanedCount} inactive rooms`);
        }

        return cleanedCount;
    }
}

// Export singleton instance
const roomManager = new RoomManager();

module.exports = roomManager;
