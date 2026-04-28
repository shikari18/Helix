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

const REASONING_THOUGHTS = [
  "Analyzing target system architecture...",
  "Enumerating network interfaces...",
  "Searching for vulnerable entry points...",
  "Probing for security misconfigurations...",
  "Attempting to bypass EDR barriers...",
  "Escalating privileges on local machine...",
  "Checking for stored credentials in memory...",
  "Mapping out the lateral movement path...",
  "Bypassing AMSI using memory patching...",
  "Enumerating Active Directory users..."
];

function ReasoningBlock() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [thoughtIndex, setThoughtIndex] = React.useState(0);
  const [displayText, setDisplayText] = React.useState('');
  const [isDeleting, setIsDeleting] = React.useState(false);

  React.useEffect(() => {
    let timeout: NodeJS.Timeout;
    const currentThought = REASONING_THOUGHTS[thoughtIndex];
    
    if (isDeleting) {
      if (displayText === '') {
        setIsDeleting(false);
        setThoughtIndex((prev) => (prev + 1) % REASONING_THOUGHTS.length);
        timeout = setTimeout(() => {}, 500);
      } else {
        timeout = setTimeout(() => setDisplayText(displayText.slice(0, -1)), 30);
      }
    } else {
      if (displayText === currentThought) {
        timeout = setTimeout(() => setIsDeleting(true), 2000);
      } else {
        timeout = setTimeout(() => setDisplayText(currentThought.slice(0, displayText.length + 1)), 50);
      }
    }

    return () => clearTimeout(timeout);
  }, [displayText, isDeleting, thoughtIndex]);

  return (
    <div style={{ marginBottom: 32, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 10, 
          cursor: 'pointer',
          color: '#aaa',
          fontSize: 14,
          fontWeight: 500,
          userSelect: 'none',
          width: 'fit-content'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 16v-4"/>
                <path d="M12 8h.01"/>
            </svg>
            <span>Reasoning</span>
        </div>
        <svg 
            width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s ease' }}
        >
            <polyline points="6 9 12 15 18 9"/>
        </svg>
      </div>
      
      {isOpen ? (
        <div style={{ 
            padding: '12px 16px', 
            background: 'rgba(255,255,255,0.03)', 
            borderLeft: '2px solid rgba(255,255,255,0.1)',
            color: '#888',
            fontSize: 14,
            lineHeight: '1.6',
            fontStyle: 'italic',
            animation: 'slideDown 0.2s ease'
        }}>
            {displayText}
            <span style={{ marginLeft: 2, display: 'inline-block', width: 2, height: 14, background: '#fff', animation: 'blink 0.8s infinite', verticalAlign: 'middle' }} />
        </div>
      ) : (
          <div style={{ color: '#666', fontSize: 13, fontStyle: 'italic', paddingLeft: 28 }}>
              {displayText}
          </div>
      )}
      <style>{`
        @keyframes slideDown { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
      `}</style>
    </div>
  );
}

export default function ChatMessages({ messages, isThinking, isLoading, messagesEndRef, typingMsgId, onRegenerate, agentSteps }: ChatMessagesProps) {
  const thinking = isThinking || isLoading || false;

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

      {thinking && !agentSteps?.length && <ReasoningBlock />}

      {messagesEndRef && <div ref={messagesEndRef} />}
    </div>
  );
}
