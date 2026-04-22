# Installation Instructions for Real-Time Group Chat

## Error Fix: "Module not found: Can't resolve 'socket.io-client'"

The `socket.io-client` package is already added to `helix-app/package.json`, but you need to install the dependencies.

### Steps to Fix:

1. **Navigate to the helix-app directory:**
   ```bash
   cd helix-app
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Also install backend dependencies (if not done):**
   ```bash
   cd ..
   npm install
   ```

4. **Start the backend server:**
   ```bash
   node server.js
   ```

5. **In a new terminal, start the frontend:**
   ```bash
   cd helix-app
   npm run dev
   ```

## What Was Installed:

### Backend (root package.json):
- `socket.io` (^4.5.0) - WebSocket server
- `uuid` (^9.0.0) - Unique ID generation
- `validator` (^13.9.0) - Input validation and XSS prevention

### Frontend (helix-app/package.json):
- `socket.io-client` (^4.5.0) - WebSocket client

## Files Created/Modified:

### Backend:
- `services/RoomManager.js` - Room and participant management
- `services/MessageHandler.js` - Message validation, sanitization, rate limiting
- `websocket-server.js` - WebSocket server with event handlers

### Frontend:
- `helix-app/app/lib/WebSocketClient.ts` - WebSocket client utility
- `helix-app/app/types/groupChat.ts` - TypeScript interfaces
- `helix-app/app/components/GroupChatInterface.tsx` - Group chat UI component
- `helix-app/app/components/InputSection.tsx` - Removed "Group Chat" from dropdown

## Features Implemented:

✅ Real-time messaging via WebSocket
✅ Automatic reconnection with exponential backoff
✅ Message queueing during disconnection
✅ Typing indicators (shows "{Name} is typing..." at top)
✅ Helix responds to ALL messages when alone, only when mentioned with others
✅ XSS prevention and input validation
✅ Rate limiting (10 messages per 10 seconds)
✅ Room cleanup (inactive rooms after 24 hours)
✅ Connection state indicators
✅ Sender-based message alignment (right for user, left for others)

## Next Steps:

After running `npm install` in both directories, the error should be resolved and you can test the group chat feature!
