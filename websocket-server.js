const { Server } = require('socket.io');
const roomManager = require('./services/RoomManager');
const messageHandler = require('./services/MessageHandler');

/**
 * WebSocket Server for Real-time Group Chat
 * Handles room management, message broadcasting, and participant tracking
 */

/**
 * Initialize WebSocket server with HTTP server and CORS configuration
 * @param {http.Server} httpServer - Express HTTP server instance
 * @returns {Server} Socket.io server instance
 */
function initializeWebSocketServer(httpServer) {
    const io = new Server(httpServer, {
        cors: {
            origin: [
                process.env.FRONTEND_URL || 'http://localhost:3000',
                'http://localhost:3001',
                'http://localhost:3002',
            ],
            methods: ['GET', 'POST'],
            credentials: true
        },
        pingTimeout: 30000,
        pingInterval: 25000
    });

    io.on('connection', (socket) => {
        console.log(`[WebSocket] Client connected: ${socket.id}`);

        // Handle room creation
        socket.on('create_room', (callback) => {
            const room = roomManager.createRoom();
            const inviteLink = `${process.env.FRONTEND_URL || 'http://localhost:3001'}/group/${room.id}`;
            
            console.log(`[WebSocket] Room created: ${room.id}`);
            
            callback({ roomId: room.id, inviteLink });
        });

        // Handle joining a room
        socket.on('join_room', ({ roomId, participant }, callback) => {
            const room = roomManager.getRoom(roomId);
            
            if (!room) {
                callback({ error: 'Room not found' });
                return;
            }

            // Check if participant already exists (refresh case) — don't fire join event again
            const existingParticipant = room.participants.get(participant.id);
            const isRejoin = !!existingParticipant;

            const participantData = roomManager.addParticipant(roomId, participant);
            
            if (!participantData) {
                callback({ error: 'Failed to join room' });
                return;
            }
            
            socket.join(roomId);
            socket.data.roomId = roomId;
            socket.data.participantId = participantData.id;

            console.log(`[WebSocket] Participant ${participantData.id} ${isRejoin ? 're' : ''}joined room ${roomId}`);

            callback({
                success: true,
                messages: roomManager.getRoomMessages(roomId),
                participants: roomManager.getRoomParticipants(roomId)
            });

            // Only broadcast join event if this is a genuinely new participant
            if (!isRejoin) {
                socket.to(roomId).emit('participant_joined', participantData);
            }
        });

        // Handle leaving a room
        socket.on('leave_room', ({ roomId, participantId }) => {
            if (roomManager.removeParticipant(roomId, participantId)) {
                socket.leave(roomId);
                console.log(`[WebSocket] Participant ${participantId} left room ${roomId}`);
                socket.to(roomId).emit('participant_left', participantId);

                // Delete room if empty
                const room = roomManager.getRoom(roomId);
                if (room && room.participants.size === 0) {
                    roomManager.deleteRoom(roomId);
                    console.log(`[WebSocket] Room ${roomId} deleted — all participants left`);
                }
            }
        });

        // Handle sending messages
        socket.on('send_message', async ({ roomId, message }, callback) => {
            const room = roomManager.getRoom(roomId);
            
            if (!room) {
                callback({ error: 'Room not found' });
                return;
            }

            // Process and validate message
            const result = messageHandler.processMessage(message, socket.data.participantId);

            if (!result.success) {
                callback({ error: result.error });
                return;
            }

            // Add processed message to room
            const messageData = roomManager.addMessage(roomId, result.message);

            if (!messageData) {
                callback({ error: 'Failed to send message' });
                return;
            }

            console.log(`[WebSocket] Message sent in room ${roomId} by ${message.senderName}`);

            // Broadcast message to all participants in the room
            io.to(roomId).emit('message_broadcast', messageData);

            // Send confirmation to sender
            callback({ success: true, messageId: messageData.id });

            // Check if Helix should respond
            const participantCount = room.participants.size;
            const shouldRespond = participantCount === 1 || messageHandler.detectHelixMention(message.content);

            if (shouldRespond) {
                try {
                    console.log(`[WebSocket] Helix mention detected in room ${roomId}`);
                    
                    // Get room history for context
                    const roomHistory = roomManager.getRoomMessages(roomId);
                    
                    // Get participant names
                    const participantNames = Array.from(room.participants.values())
                        .map(p => p.name)
                        .filter(n => n && n !== 'Helix AI');

                    // Emit helix_typing to all in room
                    io.to(roomId).emit('helix_typing', true);
                    
                    // Forward to Helix AI
                    const aiResponse = await messageHandler.forwardToHelix(
                        messageData,
                        roomHistory,
                        participantCount,
                        participantNames
                    );

                    // Create Helix response message
                    const helixMessage = {
                        roomId: roomId,
                        senderId: 'helix',
                        senderName: 'Helix AI',
                        senderAvatar: '',
                        content: aiResponse,
                        isHelixResponse: true
                    };

                    // Add Helix message to room
                    const helixMessageData = roomManager.addMessage(roomId, helixMessage);

                    if (helixMessageData) {
                        // Broadcast Helix response to all participants
                        io.to(roomId).emit('helix_typing', false);
                        io.to(roomId).emit('message_broadcast', helixMessageData);
                        console.log(`[WebSocket] Helix responded in room ${roomId}`);
                    }
                } catch (error) {
                    console.error('[WebSocket] Helix response error:', error.message);
                    io.to(roomId).emit('helix_typing', false);
                    
                    // Send error message to room
                    const errorMessage = {
                        roomId: roomId,
                        senderId: 'helix',
                        senderName: 'Helix AI',
                        senderAvatar: '',
                        content: error.message || 'Helix is temporarily unavailable. Try again in a moment.',
                        isHelixResponse: true
                    };
                    
                    const errorMessageData = roomManager.addMessage(roomId, errorMessage);
                    if (errorMessageData) {
                        io.to(roomId).emit('message_broadcast', errorMessageData);
                    }
                }
            }
        });

        // Handle typing events
        socket.on('typing_start', ({ roomId, participantName }) => {
            socket.to(roomId).emit('user_typing', { participantName });
        });

        socket.on('typing_stop', ({ roomId, participantName }) => {
            socket.to(roomId).emit('user_stop_typing', { participantName });
        });

        // Handle disconnect
        socket.on('disconnect', () => {
            const { roomId, participantId } = socket.data;
            
            if (roomId && participantId) {
                roomManager.markParticipantOffline(roomId, participantId);
                console.log(`[WebSocket] Participant ${participantId} disconnected from room ${roomId}`);
                
                // Don't immediately broadcast leave — wait to see if they reconnect (refresh)
                setTimeout(() => {
                    const room = roomManager.getRoom(roomId);
                    if (room) {
                        const participant = room.participants.get(participantId);
                        if (participant && !participant.isOnline) {
                            roomManager.removeParticipant(roomId, participantId);
                            // Only broadcast leave after timeout (not on refresh)
                            socket.to(roomId).emit('participant_left', participantId);
                            
                            // Delete room if now empty
                            const updatedRoom = roomManager.getRoom(roomId);
                            if (updatedRoom && updatedRoom.participants.size === 0) {
                                roomManager.deleteRoom(roomId);
                                console.log(`[WebSocket] Room ${roomId} deleted — all participants disconnected`);
                            }
                        }
                    }
                }, 8000); // 8 second grace period for refresh
            }
            
            console.log(`[WebSocket] Client disconnected: ${socket.id}`);
        });
    });

    // Schedule periodic cleanup of inactive rooms (every 24 hours)
    setInterval(() => {
        roomManager.cleanupInactiveRooms();
    }, 24 * 60 * 60 * 1000);

    return io;
}

module.exports = { initializeWebSocketServer };
