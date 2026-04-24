'use client';

import React from 'react';
import type { Message } from '../types';
import MessageBubble from './MessageBubble';

interface ChatMessagesProps {
  messages: Message[];
  isThinking?: boolean;
  isLoading?: boolean;
  messagesEndRef?: React.RefObject<HTMLDivElement>;
  onOpenShare?: () => void;
  typingMsgId?: string | null;
  onRegenerate?: () => void;
  agentSteps?: { id: string; label: string; status: 'thinking' | 'done' | 'error'; thought?: string }[];
}

export default function ChatMessages({ messages, isThinking, isLoading, messagesEndRef, typingMsgId, onRegenerate, agentSteps }: ChatMessagesProps) {
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

      {agentSteps && agentSteps.length > 0 && (
        <div style={{ 
          marginBottom: 32, 
          display: 'flex', 
          flexDirection: 'column', 
          gap: 16,
          animation: 'fadeIn 0.3s ease'
        }}>
          {agentSteps.map((step) => (
            <div key={step.id} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              {step.status === 'thinking' ? (
                <div style={{
                  width: 20,
                  height: 20,
                  border: '2.5px solid rgba(255,255,255,0.1)',
                  borderTopColor: '#fff',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                  flexShrink: 0
                }} />
              ) : step.status === 'done' ? (
                <div style={{
                  width: 20,
                  height: 20,
                  background: '#22c55e',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  animation: 'scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  flexShrink: 0
                }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
              ) : (
                <div style={{
                  width: 20,
                  height: 20,
                  background: '#ef4444',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <span style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>!</span>
                </div>
              )}
              
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                   {step.thought && (
                     <span style={{ color: '#888', fontSize: 13, fontStyle: 'italic', letterSpacing: '0.02em' }}>
                       {step.thought}
                     </span>
                   )}
                   <span style={{ 
                     color: step.status === 'done' ? '#fff' : '#aaa', 
                     fontSize: 14, 
                     fontWeight: 500,
                     marginLeft: step.thought ? 10 : 0
                   }}>
                     {step.label}
                   </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {thinking && !agentSteps?.length && (
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
