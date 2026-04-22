/**
 * TypeScript interfaces for Group Chat data models
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

export interface Room {
  id: string;
  createdAt: number;
  participants: Participant[];
  messages: GroupMessage[];
  inviteLink: string;
}

export type WebSocketEvent =
  | { type: 'join_room'; roomId: string; participant: Participant }
  | { type: 'leave_room'; roomId: string; participantId: string }
  | { type: 'send_message'; roomId: string; message: GroupMessage }
  | { type: 'message_broadcast'; message: GroupMessage }
  | { type: 'participant_joined'; participant: Participant }
  | { type: 'participant_left'; participantId: string }
  | { type: 'room_history'; messages: GroupMessage[]; participants: Participant[] }
  | { type: 'error'; code: string; message: string };

export type ConnectionState = 'connected' | 'disconnected' | 'reconnecting';
