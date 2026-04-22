# Implementation Plan: Real-time Group Chat

## Overview

This implementation plan follows a bottom-up approach: backend infrastructure → message handling → frontend components → integration. The feature enables multiple users to collaborate in real-time group chats with Helix AI responding only when mentioned. The system uses WebSocket (Socket.io) for real-time communication, with messages persisted for new joiners.

**Technology Stack:**
- Backend: Node.js/Express with Socket.io
- Frontend: Next.js/React with TypeScript
- Testing: Jest + fast-check for property-based tests

## Tasks

- [x] 1. Set up backend WebSocket infrastructure
  - [x] 1.1 Install Socket.io dependencies and create WebSocket server
    - Install `socket.io` (^4.5.0) and `uuid` (^9.0.0) in root package.json
    - Create `websocket-server.js` with Socket.io server setup
    - Integrate WebSocket server with existing Express server in `server.js`
    - Configure CORS for WebSocket connections
    - _Requirements: 11.1, 11.2_

  - [x] 1.2 Implement RoomManager service for room state management
    - Create `services/RoomManager.js` with room creation, participant tracking, and message storage
    - Implement room ID generation with 128-bit entropy using uuid v4
    - Implement in-memory storage for rooms, participants, and messages
    - Add methods: createRoom(), getRoom(), addParticipant(), removeParticipant(), getRoomMessages()
    - _Requirements: 1.1, 1.3, 5.4_

  - [ ]* 1.3 Write property test for room ID uniqueness
    - **Property 1: Room ID Uniqueness**
    - **Validates: Requirements 1.1, 1.3**

  - [ ]* 1.4 Write property test for invite link consistency
    - **Property 2: Invite Link Consistency**
    - **Validates: Requirements 1.2, 1.4**

- [x] 2. Implement message handling and broadcasting
  - [x] 2.1 Create MessageHandler service for message processing
    - Create `services/MessageHandler.js` with message validation, sanitization, and broadcasting
    - Implement message ID generation and timestamp assignment
    - Add input validation: reject empty messages, enforce 4000 char limit
    - Implement XSS prevention using DOMPurify or validator library
    - Implement rate limiting (10 messages/minute per participant)
    - _Requirements: 2.1, 2.3, 2.5, 8.1, 8.2, 8.3, 8.5_

  - [x] 2.2 Implement WebSocket event handlers for message flow
    - Add event handlers in `websocket-server.js`: join_room, leave_room, send_message
    - Implement message broadcasting to all room participants using Socket.io rooms
    - Implement participant join/leave event broadcasting
    - Add connection/disconnection handlers with 30s timeout for offline marking
    - _Requirements: 2.1, 2.2, 6.1, 6.2, 10.5_

  - [ ]* 2.3 Write property test for message delivery to all participants
    - **Property 3: Message Delivery to All Online Participants**
    - **Validates: Requirements 2.1, 2.2**

  - [ ]* 2.4 Write property test for message ordering consistency
    - **Property 4: Message Ordering Consistency**
    - **Validates: Requirements 2.3, 2.4**

  - [ ]* 2.5 Write property test for empty message rejection
    - **Property 17: Empty Message Rejection**
    - **Validates: Requirements 8.1**

  - [ ]* 2.6 Write property test for XSS prevention
    - **Property 18: XSS Prevention Through Sanitization**
    - **Validates: Requirements 8.3**

- [x] 3. Implement Helix mention detection and AI integration
  - [x] 3.1 Add Helix mention detection to MessageHandler
    - Implement detectHelixMention() method with pattern matching for "helix" and "@helix"
    - Add forwardToHelix() method to send message + room history to Helix AI API
    - Integrate with existing `/api/chat` endpoint for AI responses
    - Handle AI API errors gracefully with user-friendly error messages
    - Broadcast AI responses with senderId="helix" and isHelixResponse=true
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 10.2_

  - [ ]* 3.2 Write property test for Helix mention detection accuracy
    - **Property 8: Helix Mention Detection Accuracy**
    - **Validates: Requirements 4.1, 4.4**

  - [ ]* 3.3 Write property test for AI response sender identification
    - **Property 9: AI Response Sender Identification**
    - **Validates: Requirements 4.3, 4.5**

- [ ] 4. Checkpoint - Ensure backend tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Create frontend WebSocket client
  - [x] 5.1 Install Socket.io client and create WebSocketClient utility
    - Install `socket.io-client` (^4.5.0) in helix-app/package.json
    - Create `helix-app/app/lib/WebSocketClient.ts` with connection lifecycle management
    - Implement methods: connect(), disconnect(), sendMessage(), event listeners
    - Implement exponential backoff reconnection logic (1s, 2s, 4s, 8s, max 30s)
    - Implement local message queueing during disconnection
    - _Requirements: 7.1, 7.2, 7.4, 7.5_

  - [x] 5.2 Add TypeScript interfaces for group chat data models
    - Create `helix-app/app/types/groupChat.ts` with interfaces: GroupMessage, Participant, Room, WebSocketEvent
    - Define all data model interfaces matching the design document
    - _Requirements: 2.5, 6.5_

  - [ ]* 5.3 Write property test for session restoration on reconnection
    - **Property 16: Session Restoration on Reconnection**
    - **Validates: Requirements 7.3**

- [x] 6. Implement GroupChatInterface component
  - [x] 6.1 Create GroupChatInterface component with basic structure
    - Create `helix-app/app/components/GroupChatInterface.tsx`
    - Set up component state: messages, participants, isConnected, inviteLink
    - Implement WebSocket connection initialization in useEffect
    - Add connection status indicator in UI
    - _Requirements: 3.1, 7.1_

  - [x] 6.2 Implement message display with sender-based alignment
    - Render messages in chronological order (oldest to newest)
    - Apply right alignment for current user's messages
    - Apply left alignment for other participants' messages
    - Display sender name, avatar, and timestamp for each message
    - Apply distinct styling for Helix AI responses
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 4.5_

  - [ ]* 6.3 Write property test for message alignment based on sender
    - **Property 5: Message Alignment Based on Sender**
    - **Validates: Requirements 3.1, 3.2**

  - [ ]* 6.4 Write property test for message display completeness
    - **Property 6: Message Display Completeness**
    - **Validates: Requirements 3.3, 3.4**

  - [ ]* 6.5 Write property test for chronological display order
    - **Property 7: Chronological Display Order**
    - **Validates: Requirements 3.5**

  - [ ]* 6.6 Write property test for client-side HTML escaping
    - **Property 19: Client-Side HTML Escaping**
    - **Validates: Requirements 8.4**

- [ ] 7. Implement participant visualization
  - [ ] 7.1 Add participant list display at top-right of GroupChatInterface
    - Render participant avatars in a horizontal row
    - Show online/offline status indicators
    - Update participant list on join/leave events
    - Display participant count
    - _Requirements: 6.3, 6.4_

  - [ ]* 7.2 Write property test for participant join event broadcasting
    - **Property 12: Participant Join Event Broadcasting**
    - **Validates: Requirements 6.1**

  - [ ]* 7.3 Write property test for participant leave event broadcasting
    - **Property 13: Participant Leave Event Broadcasting**
    - **Validates: Requirements 6.2**

  - [ ]* 7.4 Write property test for participant status synchronization
    - **Property 14: Participant Status Synchronization**
    - **Validates: Requirements 6.4**

  - [ ]* 7.5 Write property test for participant list consistency
    - **Property 15: Participant List Consistency**
    - **Validates: Requirements 6.5**

- [ ] 8. Implement message input and sending
  - [ ] 8.1 Add message input field and send button to GroupChatInterface
    - Create controlled input component with state management
    - Implement send message handler that calls WebSocketClient.sendMessage()
    - Add client-side validation: prevent empty messages, enforce 4000 char limit
    - Show character count indicator
    - Support Enter key to send (Shift+Enter for new line)
    - _Requirements: 8.1, 8.2_

  - [ ] 8.2 Add Helix mention detection in message input
    - Detect "helix" or "@helix" patterns in user input
    - Show visual indicator when Helix will be mentioned
    - No special handling needed (server detects and processes)
    - _Requirements: 4.1_

- [ ] 9. Checkpoint - Ensure frontend component tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 10. Implement room history loading for new joiners
  - [ ] 10.1 Add room history request on join
    - Modify join_room event handler to send complete message history
    - Send history in chronological order (oldest to newest)
    - Limit history to last 500 messages per room
    - _Requirements: 5.1, 5.2, 5.4_

  - [ ] 10.2 Implement history display in GroupChatInterface
    - Render history messages before new real-time messages
    - Add visual separator between history and new messages (optional)
    - Implement lazy loading for older messages (load 50 at a time)
    - _Requirements: 5.3, 5.5_

  - [ ]* 10.3 Write property test for room history completeness
    - **Property 10: Room History Completeness**
    - **Validates: Requirements 5.1, 5.2**

  - [ ]* 10.4 Write property test for history display before new messages
    - **Property 11: History Display Before New Messages**
    - **Validates: Requirements 5.3**

- [ ] 11. Integrate group chat into ChatApp and Sidebar
  - [ ] 11.1 Add "Group Chat" mode to chat mode dropdown
    - Modify `helix-app/app/components/ChatApp.tsx` to add "Group Chat" option
    - Add state management for current chat mode (regular vs group)
    - Conditionally render GroupChatInterface when in group chat mode
    - _Requirements: 1.1_

  - [ ] 11.2 Update Sidebar to display group chats
    - Modify `helix-app/app/components/Sidebar.tsx` to include group chat list
    - Add group chats to sidebar with label "New group chat" on creation
    - Implement sidebar click handler to open correct room
    - Persist group chat list in localStorage
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

  - [ ]* 11.3 Write property test for sidebar update on room creation
    - **Property 20: Sidebar Update on Room Creation**
    - **Validates: Requirements 9.1**

  - [ ]* 11.4 Write property test for sidebar update on room join
    - **Property 21: Sidebar Update on Room Join**
    - **Validates: Requirements 9.2**

  - [ ]* 11.5 Write property test for sidebar navigation
    - **Property 22: Sidebar Navigation**
    - **Validates: Requirements 9.4**

  - [ ]* 11.6 Write property test for sidebar persistence
    - **Property 23: Sidebar Persistence**
    - **Validates: Requirements 9.5**

- [ ] 12. Implement invite link generation and sharing
  - [ ] 12.1 Add invite link generation on room creation
    - Generate invite link with format: `https://[domain]/group/[roomId]`
    - Display invite link in GroupChatInterface with copy button
    - Add visual feedback on copy (toast notification or checkmark)
    - _Requirements: 1.2, 1.4_

  - [ ] 12.2 Create invite link route handler
    - Create `helix-app/app/group/[roomId]/page.tsx` for invite link handling
    - Extract roomId from URL and initiate join flow
    - Handle invalid room IDs with user-friendly error message
    - Add room to sidebar on successful join
    - _Requirements: 9.2, 10.1_

- [ ] 13. Implement error handling and user feedback
  - [ ] 13.1 Add error handling for connection failures
    - Display connection error indicator when WebSocket fails
    - Show "Connecting..." status with retry countdown
    - Implement exponential backoff reconnection (already in WebSocketClient)
    - _Requirements: 7.1, 7.2_

  - [ ] 13.2 Add error handling for invalid room IDs
    - Display error message: "This group chat doesn't exist or has expired"
    - Offer option to create new group chat
    - Redirect to home screen on error acknowledgment
    - _Requirements: 10.1_

  - [ ] 13.3 Add error handling for message send failures
    - Show "Failed to send" indicator on message bubble
    - Add retry button on failed messages
    - Show persistent error after 3 failed attempts with copy message option
    - _Requirements: 10.3, 10.4_

  - [ ] 13.4 Add error handling for Helix AI failures
    - Display error message: "Helix is temporarily unavailable. Try again in a moment."
    - Log error details server-side for monitoring
    - Allow users to retry by mentioning Helix again
    - _Requirements: 10.2_

- [ ] 14. Checkpoint - Ensure error handling works correctly
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 15. Implement security measures
  - [ ] 15.1 Add WebSocket security configuration
    - Configure WSS (WebSocket Secure) for production
    - Implement origin header validation in WebSocket server
    - Add connection authentication tokens (optional for MVP)
    - Set connection timeouts to prevent resource exhaustion
    - _Requirements: 11.1, 11.2, 11.3, 11.4_

  - [ ] 15.2 Add security event logging
    - Log room creation events with timestamp and metadata
    - Log room join events with participant info
    - Log suspicious patterns (rapid room creation, message flooding)
    - _Requirements: 11.5_

  - [ ]* 15.3 Write property test for origin header validation
    - **Property 24: Origin Header Validation**
    - **Validates: Requirements 11.2**

  - [ ]* 15.4 Write property test for security event logging
    - **Property 25: Security Event Logging**
    - **Validates: Requirements 11.5**

- [ ] 16. Implement performance optimizations
  - [ ] 16.1 Add message batching and lazy loading
    - Implement message batching for rapid message sends
    - Add lazy loading for message history (50 messages at a time)
    - Implement virtual scrolling for large message lists (optional)
    - _Requirements: 5.5, 12.4_

  - [ ] 16.2 Add room cleanup and participant pruning
    - Remove inactive participants after 5 minutes of disconnection
    - Archive inactive rooms after 24 hours of no activity
    - Limit in-memory message history to 500 messages per room
    - _Requirements: 5.4, 12.5_

  - [ ] 16.3 Optimize WebSocket broadcasting
    - Use Socket.io rooms for efficient message fanout
    - Implement connection pooling for multiple rooms
    - Add rate limiting enforcement (10 messages/minute per participant)
    - _Requirements: 8.5, 12.2, 12.3_

- [ ] 17. Write integration tests for end-to-end flows
  - [ ]* 17.1 Write integration test for room creation and joining
    - Test complete flow: create room → generate invite link → join via link → see history
    - Verify room appears in sidebar for both creator and joiner
    - _Requirements: 1.1, 1.2, 5.1, 9.1, 9.2_

  - [ ]* 17.2 Write integration test for multi-participant messaging
    - Test message exchange between 3+ participants
    - Verify all participants receive messages in same order
    - Verify message alignment (own vs others)
    - _Requirements: 2.1, 2.3, 3.1, 3.2_

  - [ ]* 17.3 Write integration test for Helix mention flow
    - Test message with Helix mention triggers AI response
    - Verify AI response is broadcast to all participants
    - Verify AI response has correct sender identification
    - _Requirements: 4.1, 4.2, 4.3_

  - [ ]* 17.4 Write integration test for disconnect and reconnect
    - Test participant disconnect → reconnect within 5 minutes
    - Verify session restoration and missed message sync
    - Verify participant status updates for all participants
    - _Requirements: 7.3, 6.4, 10.5_

  - [ ]* 17.5 Write integration test for concurrent message sending
    - Test multiple participants sending messages simultaneously
    - Verify message ordering consistency across all clients
    - Verify no message loss or duplication
    - _Requirements: 2.3, 2.4, 2.5_

- [ ] 18. Final checkpoint - Comprehensive testing and validation
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation throughout implementation
- Property tests validate universal correctness properties from the design
- Integration tests validate end-to-end flows across frontend and backend
- Bottom-up approach ensures solid foundation before building UI components
- All 25 correctness properties from the design document are covered by property tests
