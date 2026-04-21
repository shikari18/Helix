'use client';

import { useState } from 'react';
import type { Message } from '../types';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  messages?: Message[];
}

export default function ShareModal({ isOpen, onClose, messages = [] }: ShareModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const shareUrl = window.location.href;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent(`Check out this Helix AI chat: ${shareUrl}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  // Build preview text from messages
  const previewMessages = messages;

  return (
    <div
      style={{
        display: 'flex', position: 'fixed', inset: 0, zIndex: 10000,
        background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)',
        alignItems: 'center', justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#111', border: '1px solid #222', borderRadius: 18,
          padding: '24px 24px 28px', width: 520, maxWidth: '92vw',
          boxShadow: '0 32px 80px rgba(0,0,0,0.9)',
          animation: 'popupFadeIn 0.2s ease',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: '#fff', margin: 0 }}>Share Chat</h2>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#555', padding: 4, display: 'flex' }}
            onMouseOver={e => { (e.currentTarget as HTMLElement).style.color = '#fff' }}
            onMouseOut={e => { (e.currentTarget as HTMLElement).style.color = '#555' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Chat preview */}
        <div style={{
          background: '#0e0e0e', border: '1px solid #1e1e1e', borderRadius: 14,
          height: 300, overflow: 'hidden', marginBottom: 24, position: 'relative',
        }}>
          <div style={{
            height: '100%', overflowY: 'auto', padding: '14px 16px',
            display: 'flex', flexDirection: 'column', gap: 12,
            scrollbarWidth: 'none',
          }}>
            {previewMessages.length === 0 ? (
              <p style={{ color: '#444', fontSize: 14, margin: 0 }}>No messages yet...</p>
            ) : (
              previewMessages.map((msg, i) => (
                <div key={i} style={{
                  display: 'flex', flexDirection: 'column',
                  alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
                }}>
                  <div style={{
                    maxWidth: '80%',
                    background: msg.role === 'user' ? '#2a2a2a' : 'transparent',
                    border: msg.role === 'user' ? '1px solid #333' : 'none',
                    borderRadius: msg.role === 'user' ? 14 : 0,
                    padding: msg.role === 'user' ? '8px 12px' : '0',
                    fontSize: 13,
                    color: msg.role === 'user' ? '#e0e0e0' : '#888',
                    lineHeight: 1.5,
                  }}>
                    {msg.content.slice(0, 200)}{msg.content.length > 200 ? '...' : ''}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Bottom fade */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: 60,
            background: 'linear-gradient(transparent, #0e0e0e)',
            pointerEvents: 'none', borderRadius: '0 0 14px 14px',
          }} />
          {/* Left fade */}
          <div style={{
            position: 'absolute', top: 0, left: 0, bottom: 0, width: 28,
            background: 'linear-gradient(to right, #0e0e0e, transparent)',
            pointerEvents: 'none',
          }} />
          {/* Right fade */}
          <div style={{
            position: 'absolute', top: 0, right: 0, bottom: 0, width: 28,
            background: 'linear-gradient(to left, #0e0e0e, transparent)',
            pointerEvents: 'none',
          }} />
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 36 }}>
          {/* Copy link */}
          <div onClick={handleCopyLink} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <div style={{
              width: 54, height: 54, borderRadius: '50%',
              background: copied ? '#1a3a1a' : '#2a2a2a',
              border: `1px solid ${copied ? '#2a5a2a' : '#333'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s', color: copied ? '#4caf50' : '#ccc',
            }}>
              {copied ? (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              ) : (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                </svg>
              )}
            </div>
            <span style={{ fontSize: 13, color: copied ? '#4caf50' : '#888' }}>
              {copied ? 'Copied!' : 'Copy link'}
            </span>
          </div>

          {/* WhatsApp */}
          <div onClick={handleWhatsApp} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <div style={{
              width: 54, height: 54, borderRadius: '50%',
              background: '#2a2a2a', border: '1px solid #333',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s', color: '#25D366',
            }}
              onMouseOver={e => { (e.currentTarget as HTMLElement).style.background = '#1a2e1a' }}
              onMouseOut={e => { (e.currentTarget as HTMLElement).style.background = '#2a2a2a' }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </div>
            <span style={{ fontSize: 13, color: '#888' }}>WhatsApp</span>
          </div>
        </div>
      </div>
    </div>
  );
}
