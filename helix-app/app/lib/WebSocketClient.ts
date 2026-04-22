import { io, Socket } from 'socket.io-client';

/**
 * WebSocket Client for Real-time Group Chat
 * Manages connection lifecycle, reconnection, and event handling
 */

export interface GroupMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  content: string;
  timestamp: number;
  isHelixResponse: boolean;
}

export interface Participant {
  id: string;
  name: string;
  avatar: string;
  joinedAt: number;
  isOnline: boolean;
}

export type ConnectionState = 'connected' | 'disconnected' | 'reconnecting';

export class WebSocketClient {
  private socket: Socket | null = null;
  private serverUrl: string;
  private connectionState: ConnectionState = 'disconnected';
  private messageQueue: GroupMessage[] = [];
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelays = [1000, 2000, 4000, 8000, 30000]; // Exponential backoff

  // Event callbacks
  private onMessageCallback: ((message: GroupMessage) => void) | null = null;
  private onParticipantJoinCallback: ((participant: Participant) => void) | null = null;
  private onParticipantLeaveCallback: ((participantId: string) => void) | null = null;
  private onConnectionChangeCallback: ((state: ConnectionState) => void) | null = null;
  private onUserTypingCallback: ((name: string, isTyping: boolean) => void) | null = null;
  private onHelixTypingCallback: ((isTyping: boolean) => void) | null = null;

  constructor(serverUrl: string = 'http://localhost:8000') {
    this.serverUrl = serverUrl;
  }

  /**
   * Connect to WebSocket server and join a room
   */
  async connect(roomId: string, participant: Participant): Promise<{ success: boolean; messages?: GroupMessage[]; participants?: Participant[]; error?: string }> {
    return new Promise((resolve) => {
      try {
        // Create socket connection
        this.socket = io(this.serverUrl, {
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionAttempts: this.maxReconnectAttempts,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 30000,
        });

        // Connection established
        this.socket.on('connect', () => {
          console.log('[WebSocketClient] Connected to server');
          this.setConnectionState('connected');
          this.reconnectAttempts = 0;

          // Send queued messages
          this.flushMessageQueue();
        });

        // Join room after connection
        this.socket.emit('join_room', { roomId, participant }, (response: any) => {
          if (response.error) {
            console.error('[WebSocketClient] Failed to join room:', response.error);
            resolve({ success: false, error: response.error });
          } else {
            console.log('[WebSocketClient] Joined room:', roomId);
            resolve({
              success: true,
              messages: response.messages || [],
              participants: response.participants || []
            });
          }
        });

        // Handle incoming messages
        this.socket.on('message_broadcast', (message: GroupMessage) => {
          console.log('[WebSocketClient] Message received:', message);
          if (this.onMessageCallback) {
            this.onMessageCallback(message);
          }
        });

        // Handle participant joined
        this.socket.on('participant_joined', (participant: Participant) => {
          console.log('[WebSocketClient] Participant joined:', participant);
          if (this.onParticipantJoinCallback) {
            this.onParticipantJoinCallback(participant);
          }
        });

        // Handle participant left
        this.socket.on('participant_left', (participantId: string) => {
          console.log('[WebSocketClient] Participant left:', participantId);
          if (this.onParticipantLeaveCallback) {
            this.onParticipantLeaveCallback(participantId);
          }
        });

        // Handle user typing events from other participants
        this.socket.on('user_typing', ({ participantName }: { participantName: string }) => {
          if (this.onUserTypingCallback) this.onUserTypingCallback(participantName, true);
        });
        this.socket.on('user_stop_typing', ({ participantName }: { participantName: string }) => {
          if (this.onUserTypingCallback) this.onUserTypingCallback(participantName, false);
        });

        // Handle helix typing indicator
        this.socket.on('helix_typing', (isTyping: boolean) => {
          if (this.onHelixTypingCallback) this.onHelixTypingCallback(isTyping);
        });

        // Handle disconnection
        this.socket.on('disconnect', (reason: string) => {
          console.log('[WebSocketClient] Disconnected:', reason);
          this.setConnectionState('disconnected');
        });

        // Handle reconnection attempt
        this.socket.on('reconnect_attempt', (attemptNumber: number) => {
          console.log('[WebSocketClient] Reconnection attempt:', attemptNumber);
          this.setConnectionState('reconnecting');
          this.reconnectAttempts = attemptNumber;
        });

        // Handle reconnection success
        this.socket.on('reconnect', (attemptNumber: number) => {
          console.log('[WebSocketClient] Reconnected after', attemptNumber, 'attempts');
          this.setConnectionState('connected');
          this.reconnectAttempts = 0;
        });

        // Handle reconnection failure
        this.socket.on('reconnect_failed', () => {
          console.error('[WebSocketClient] Reconnection failed after max attempts');
          this.setConnectionState('disconnected');
        });

        // Handle connection errors
        this.socket.on('connect_error', (error: Error) => {
          console.error('[WebSocketClient] Connection error:', error.message);
          this.setConnectionState('disconnected');
        });

      } catch (error) {
        console.error('[WebSocketClient] Connection error:', error);
        resolve({ success: false, error: 'Failed to connect to server' });
      }
    });
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.setConnectionState('disconnected');
      console.log('[WebSocketClient] Disconnected');
    }
  }

  /**
   * Send a message to the room
   */
  sendMessage(roomId: string, message: Omit<GroupMessage, 'id' | 'timestamp'>): Promise<{ success: boolean; messageId?: string; error?: string }> {
    return new Promise((resolve) => {
      if (!this.socket || this.connectionState === 'disconnected') {
        // Queue message if disconnected
        this.messageQueue.push(message as GroupMessage);
        console.log('[WebSocketClient] Message queued (disconnected)');
        resolve({ success: false, error: 'Disconnected - message queued' });
        return;
      }

      if (this.connectionState === 'reconnecting') {
        // Queue message if reconnecting
        this.messageQueue.push(message as GroupMessage);
        console.log('[WebSocketClient] Message queued (reconnecting)');
        resolve({ success: false, error: 'Reconnecting - message queued' });
        return;
      }

      this.socket.emit('send_message', { roomId, message }, (response: any) => {
        if (response.error) {
          console.error('[WebSocketClient] Failed to send message:', response.error);
          resolve({ success: false, error: response.error });
        } else {
          console.log('[WebSocketClient] Message sent:', response.messageId);
          resolve({ success: true, messageId: response.messageId });
        }
      });
    });
  }

  /**
   * Leave a room
   */
  leaveRoom(roomId: string, participantId: string): void {
    if (this.socket) {
      this.socket.emit('leave_room', { roomId, participantId });
      console.log('[WebSocketClient] Left room:', roomId);
    }
  }

  /**
   * Emit typing start event
   */
  emitTypingStart(roomId: string, participantName: string): void {
    if (this.socket && this.connectionState === 'connected') {
      this.socket.emit('typing_start', { roomId, participantName });
    }
  }

  /**
   * Emit typing stop event
   */
  emitTypingStop(roomId: string, participantName: string): void {
    if (this.socket && this.connectionState === 'connected') {
      this.socket.emit('typing_stop', { roomId, participantName });
    }
  }

  /**
   * Register callback for user typing events
   */
  onUserTyping(callback: (name: string, isTyping: boolean) => void): void {
    this.onUserTypingCallback = callback;
  }

  /**
   * Register callback for helix typing events
   */
  onHelixTyping(callback: (isTyping: boolean) => void): void {
    this.onHelixTypingCallback = callback;
  }

  /**
   * Register callback for incoming messages
   */
  onMessage(callback: (message: GroupMessage) => void): void {
    this.onMessageCallback = callback;
  }

  /**
   * Register callback for participant join events
   */
  onParticipantJoin(callback: (participant: Participant) => void): void {
    this.onParticipantJoinCallback = callback;
  }

  /**
   * Register callback for participant leave events
   */
  onParticipantLeave(callback: (participantId: string) => void): void {
    this.onParticipantLeaveCallback = callback;
  }

  /**
   * Register callback for connection state changes
   */
  onConnectionChange(callback: (state: ConnectionState) => void): void {
    this.onConnectionChangeCallback = callback;
  }

  /**
   * Get current connection state
   */
  getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  /**
   * Set connection state and notify callback
   */
  private setConnectionState(state: ConnectionState): void {
    this.connectionState = state;
    if (this.onConnectionChangeCallback) {
      this.onConnectionChangeCallback(state);
    }
  }

  /**
   * Flush queued messages when connection is restored
   */
  private flushMessageQueue(): void {
    if (this.messageQueue.length > 0 && this.socket && this.connectionState === 'connected') {
      console.log(`[WebSocketClient] Flushing ${this.messageQueue.length} queued messages`);
      
      const queue = [...this.messageQueue];
      this.messageQueue = [];

      queue.forEach((message) => {
        this.socket!.emit('send_message', { roomId: message.roomId, message }, (response: any) => {
          if (response.error) {
            console.error('[WebSocketClient] Failed to send queued message:', response.error);
          } else {
            console.log('[WebSocketClient] Queued message sent:', response.messageId);
          }
        });
      });
    }
  }
}
