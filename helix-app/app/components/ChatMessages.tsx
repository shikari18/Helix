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
  chatMode?: 'chat' | 'agent';
}

const BrainIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 4.5a2.5 2.5 0 0 0-4.96.44 2.5 2.5 0 0 0-2.79-3.56 2.5 2.5 0 0 0 .5 4.78 2.5 2.5 0 0 0 .75 4.1 2.5 2.5 0 0 0 4 2.5V4.5Z"/>
    <path d="M12 4.5a2.5 2.5 0 0 1 4.96.44 2.5 2.5 0 0 1 2.79.31 2.5 2.5 0 0 1-.25 4.78 2.5 2.5 0 0 1-.75 4.1 2.5 2.5 0 0 1-4 2.5V4.5Z"/>
  </svg>
)

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

function ReasoningBlock({ thought, isThinking, label }: { thought: string, isThinking?: boolean, label?: string }) {
  const [isOpen, setIsOpen] = React.useState(true);

  const ClockIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: isThinking ? 'spin 2s linear infinite' : 'none' }}>
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  );

  const CheckIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#4ade80' }}>
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );

  // Split thought into steps (by newline or specific markers)
  const lines = thought.split('\n').filter(l => l.trim() !== '');
  const header = label || (lines.length > 0 ? lines[0] : 'Thinking...');
  const steps = lines.length > 1 ? lines.slice(1) : (lines.length === 1 && label ? [lines[0]] : []);

  return (
    <div style={{ marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Header */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 8, 
          cursor: 'pointer',
          color: '#aaa',
          fontSize: 14,
          fontWeight: 400,
          userSelect: 'none',
          width: 'fit-content'
        }}
      >
        <span style={{ maxWidth: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {header}
        </span>
        <svg 
            width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
            style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s ease' }}
        >
            <polyline points="6 9 12 15 18 9"/>
        </svg>
      </div>
      
      {isOpen && (
        <div style={{ position: 'relative', paddingLeft: 12, display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Vertical Line */}
            <div style={{ 
                position: 'absolute', 
                left: 19.5, 
                top: 24, 
                bottom: 8, 
                width: 1, 
                background: 'rgba(255,255,255,0.1)' 
            }} />

            {/* Steps */}
            {steps.map((step, i) => (
                <div key={i} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                    <div style={{ 
                        marginTop: 4,
                        width: 16, 
                        height: 16, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        background: '#141414',
                        zIndex: 1
                    }}>
                        {(isThinking && i === steps.length - 1) ? <ClockIcon /> : <CheckIcon />}
                    </div>
                    <div style={{ 
                        flex: 1,
                        color: '#ccc',
                        fontSize: 15,
                        lineHeight: '1.6',
                        fontWeight: 400
                    }}>
                        {step}
                    </div>
                </div>
            ))}

            {/* If empty steps but thinking, show initial step */}
            {steps.length === 0 && (
                 <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                    <div style={{ 
                        marginTop: 4,
                        width: 16, 
                        height: 16, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        background: '#141414',
                        zIndex: 1
                    }}>
                        {isThinking ? <ClockIcon /> : <CheckIcon />}
                    </div>
                    <div style={{ 
                        flex: 1,
                        color: '#ccc',
                        fontSize: 15,
                        lineHeight: '1.6',
                        fontWeight: 400
                    }}>
                        {thought}
                    </div>
                </div>
            )}

            {!isThinking && (
                <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                    <div style={{ 
                        width: 16, 
                        height: 16, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        background: '#141414',
                        zIndex: 1
                    }}>
                        <CheckIcon />
                    </div>
                    <div style={{ color: '#888', fontSize: 14, fontWeight: 500 }}>
                        Done
                    </div>
                </div>
            )}
        </div>
      )}
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

export default function ChatMessages({ messages, isThinking, isLoading, messagesEndRef, typingMsgId, onRegenerate, agentSteps, chatMode }: ChatMessagesProps) {
  const thinking = isThinking || isLoading || false;

  return (
    <div id="chatMessages">
      {messages.map((message, index) => (
        <MessageBubble
          key={message.id || index}
          message={message}
          isTyping={message.id === typingMsgId}
          onRegenerate={message.role === 'assistant' && index === messages.length - 1 ? onRegenerate : undefined}
          chatMode={chatMode}
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
            <ReasoningBlock key={step.id} thought={step.thought || step.label} isThinking={step.status === 'thinking'} label={step.label} />
          ))}
        </div>
      )}

      {thinking && (!agentSteps || agentSteps.length === 0) && (
          <ReasoningBlock thought="Thinking..." isThinking={true} />
      )}

      {messagesEndRef && <div ref={messagesEndRef} />}
    </div>
  );
}
