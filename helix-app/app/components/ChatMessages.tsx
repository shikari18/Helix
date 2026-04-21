'use client';

import React from 'react';
import MessageBubble from './MessageBubble';

interface Message {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  images?: string[];
  timestamp?: number;
}

interface ChatMessagesProps {
  messages: Message[];
  isThinking?: boolean;
  isLoading?: boolean;
  messagesEndRef?: React.RefObject<HTMLDivElement>;
  onOpenShare?: () => void;
  typingMsgId?: string | null;
  onRegenerate?: () => void;
}

export default function ChatMessages({ messages, isThinking, isLoading, messagesEndRef, typingMsgId, onRegenerate }: ChatMessagesProps) {
  const thinking = isThinking || isLoading || false;
  const [showHoldOn, setShowHoldOn] = React.useState(false);

  React.useEffect(() => {
    if (thinking) {
      const timer = setTimeout(() => setShowHoldOn(true), 5000);
      return () => {
        clearTimeout(timer);
        setShowHoldOn(false);
      };
    } else {
      setShowHoldOn(false);
    }
  }, [thinking]);

  return (
    <div id="chatMessages">
      {messages.map((message, index) => (
        <MessageBubble
          key={message.id || index}
          message={message}
          isTyping={message.id === typingMsgId}
          onRegenerate={message.role === 'assistant' && index === messages.length - 1 ? onRegenerate : undefined}
        />
      ))}

      {thinking && (
        <div style={{ marginBottom: 32, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 26,
            height: 26,
            border: '2.5px solid #333',
            borderTopColor: '#fff',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }} />
          {showHoldOn && (
            <span style={{
              color: '#888',
              fontSize: 14,
              fontStyle: 'italic',
              animation: 'fadeIn 0.3s ease-in',
            }}>
              Hold on, getting info...
            </span>
          )}
        </div>
      )}

      {messagesEndRef && <div ref={messagesEndRef} />}
    </div>
  );
}
