'use client';

import React, { useState, useRef, useEffect } from 'react';
import ChatMessages from './ChatMessages';
import InputSection from './InputSection';
import GhostModeInfo from './GhostModeInfo';

interface ChatInterfaceProps {
  isIncognito: boolean;
  voiceModeActive: boolean;
  onToggleVoiceMode: () => void;
  onOpenShare: () => void;
  onNewChat: () => void;
}

export default function ChatInterface({ 
  isIncognito, 
  voiceModeActive, 
  onToggleVoiceMode,
  onOpenShare,
  onNewChat
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [greeting, setGreeting] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [chatMode, setChatMode] = useState<'chat' | 'agent'>('chat');
  const [ghostMode, setGhostMode] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null) as React.MutableRefObject<HTMLDivElement>;

  useEffect(() => {
    // Set random greeting
    const greetings = [
      'What are we testing today, Shikari?',
      'What should we hack, Shikari?',
      'Where do we start, Shikari?',
      'Got an idea, Shikari?',
      'Ready to run recon, Shikari?',
      'What are we fuzzing today, Shikari?',
      'Which exploit are we testing, Shikari?',
      'Ready to pop a shell, Shikari?'
    ];
    setGreeting(greetings[Math.floor(Math.random() * greetings.length)]);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (message: string, images?: string[]) => {
    setMessages(prev => [...prev, { role: 'user', content: message, images }]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          history: messages,
          images,
          deepThink: false
        })
      });

      if (!response.ok) throw new Error('API error');

      const data = await response.json();
      
      if (data.reply) {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: data.reply,
          sources: data.sources || [],
          locationQuery: data.locationQuery
        }]);
      } else {
        throw new Error('No reply');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "I'm having trouble connecting right now. Please check your internet connection and try again."
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleGhostMode = () => {
    if (ghostMode) {
      // Exit ghost mode - clear messages and reset
      setGhostMode(false)
      setMessages([])
      setInputValue('')
      onNewChat() // Call parent's new chat handler
    } else {
      // Enter ghost mode
      setGhostMode(true)
    }
  }

  return (
    <div className={`container ${messages.length > 0 ? 'chat-active' : ''}`}>
      {/* Voice light effect */}
      <div className="voice-light-overlay"></div>

      {/* Incognito Button - top right, hidden when ghost mode active */}
      <button 
        className="incognito-btn"
        onClick={toggleGhostMode}
        title="Ghost Mode"
        style={{ display: ghostMode ? 'none' : 'flex' }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3C8.13 3 5 6.13 5 10v8l2-2 2 2 2-2 2 2 2-2 2 2v-8c0-3.87-3.13-7-7-7z"/>
          <circle cx="9.5" cy="10.5" r="1" fill="currentColor"/>
          <circle cx="14.5" cy="10.5" r="1" fill="currentColor"/>
        </svg>
      </button>

      {/* Leave Incognito Button */}
      <button 
        className={`leave-incognito-btn ${ghostMode ? 'visible' : ''}`}
        onClick={toggleGhostMode}
        title="Leave Ghost Mode"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3a7 7 0 0 0-7 7v4a7 7 0 0 0 14 0v-4a7 7 0 0 0-7-7z"/>
          <circle cx="9" cy="12" r="1"/>
          <circle cx="15" cy="12" r="1"/>
        </svg>
        Leave Ghost Mode
      </button>
      
      {!ghostMode && (
        <>
          <div className="helix-logo-container">
            <img src="/logo.png" alt="Helix Logo" className="logo-img" />
            <div className="logo-tooltip">Hello! I'm Helix, your agent AI</div>
          </div>
          
          <div className="plan-badge">
            Free plan <span>·</span> <a href="/pricing.html" className="upgrade-link">Upgrade</a>
          </div>
          
          <h1 id="homeGreeting">{greeting}</h1>
        </>
      )}

      {/* Ghost Mode Info - Shows ABOVE input when ghost mode is active and no messages */}
      {ghostMode && messages.length === 0 && <GhostModeInfo />}

      <ChatMessages 
        messages={messages} 
        isLoading={isLoading}
        messagesEndRef={messagesEndRef}
        onOpenShare={onOpenShare}
      />

      <InputSection 
        value={inputValue}
        onChange={setInputValue}
        onSend={handleSendMessage}
        chatMode={chatMode}
        onChatModeChange={setChatMode}
        isGhostMode={ghostMode}
      />
    </div>
  );
}