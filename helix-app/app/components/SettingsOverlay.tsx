'use client';

import { useState } from 'react';

interface SettingsOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsOverlay({ isOpen, onClose }: SettingsOverlayProps) {
  const [activeSection, setActiveSection] = useState('general');

  if (!isOpen) return null;

  return (
    <div className="settings-overlay active">
      <div className="settings-container">
        {/* Left sidebar */}
        <div className="settings-sidebar">
          <div className="settings-title">Settings</div>
          <div className="settings-nav">
            <div 
              className={`settings-nav-item ${activeSection === 'general' ? 'active' : ''}`}
              onClick={() => setActiveSection('general')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
              General
            </div>
            <div 
              className={`settings-nav-item ${activeSection === 'privacy' ? 'active' : ''}`}
              onClick={() => setActiveSection('privacy')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              Privacy
            </div>
            <div 
              className={`settings-nav-item ${activeSection === 'account' ? 'active' : ''}`}
              onClick={() => setActiveSection('account')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              Account
            </div>
            <div 
              className={`settings-nav-item ${activeSection === 'billing' ? 'active' : ''}`}
              onClick={() => setActiveSection('billing')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                <line x1="1" y1="10" x2="23" y2="10"/>
              </svg>
              Billing
            </div>
          </div>
        </div>

        {/* Right content */}
        <div className="settings-content">
          <button className="settings-close-btn" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>

          {activeSection === 'general' && (
            <div className="settings-section active">
              <div className="settings-section-title">Personalization</div>
              
              <div className="settings-item">
                <div className="settings-item-info">
                  <div className="settings-item-title">What should Helix call you?</div>
                  <div className="settings-item-description">Your preferred name</div>
                </div>
                <input 
                  type="text" 
                  className="settings-input" 
                  placeholder="Your name"
                />
              </div>

              <div className="settings-item">
                <div className="settings-item-info">
                  <div className="settings-item-title">Details about you</div>
                  <div className="settings-item-description">Help Helix understand you better</div>
                </div>
                <button className="settings-button">Edit</button>
              </div>
            </div>
          )}

          {activeSection === 'privacy' && (
            <div className="settings-section active">
              <div className="settings-section-title">Privacy</div>
              
              <div className="settings-item">
                <div className="settings-item-info">
                  <div className="settings-item-title">Chat history</div>
                  <div className="settings-item-description">Save your conversations</div>
                </div>
                <div className="settings-toggle active">
                  <div className="settings-toggle-knob"></div>
                </div>
              </div>

              <div className="settings-item">
                <div className="settings-item-info">
                  <div className="settings-item-title">Help improve Helix</div>
                  <div className="settings-item-description">Allow your chats to train and improve AI models</div>
                </div>
                <div className="settings-toggle active">
                  <div className="settings-toggle-knob"></div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'account' && (
            <div className="settings-section active">
              <div className="settings-section-title">Account</div>
              
              <div className="settings-item">
                <div className="settings-item-info">
                  <div className="settings-item-title">Email</div>
                  <div className="settings-item-description">user@example.com</div>
                </div>
              </div>

              <div className="settings-item">
                <div className="settings-item-info">
                  <div className="settings-item-title">Delete account</div>
                  <div className="settings-item-description">Permanently remove your account and all data</div>
                </div>
                <button className="settings-button danger">Delete</button>
              </div>
            </div>
          )}

          {activeSection === 'billing' && (
            <div className="settings-section active">
              <div className="settings-section-title">Billing</div>
              
              <div className="settings-item">
                <div className="settings-item-info">
                  <div className="settings-item-title">Get Helix Pro</div>
                  <div className="settings-item-description">Access advanced models, file uploads, agent mode and more</div>
                </div>
                <button className="settings-button" onClick={() => window.location.href = '/pricing'}>
                  Upgrade
                </button>
              </div>

              <div className="settings-item">
                <div className="settings-item-info">
                  <div className="settings-item-title">Current plan</div>
                  <div className="settings-item-description">Free — limited features</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
