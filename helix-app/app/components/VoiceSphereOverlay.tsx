'use client';

import { useEffect, useRef, useState } from 'react';

interface VoiceSphereOverlayProps {
  isActive: boolean;
  onClose: () => void;
}

export default function VoiceSphereOverlay({ isActive, onClose }: VoiceSphereOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [status, setStatus] = useState('Say something...');

  useEffect(() => {
    if (!isActive || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const SIZE = Math.min(window.innerWidth * 0.72, 320);
    canvas.width = SIZE;
    canvas.height = SIZE;

    // Simple sphere animation
    let animationId: number;
    let rotation = 0;

    const animate = () => {
      ctx.clearRect(0, 0, SIZE, SIZE);
      
      // Draw sphere
      const centerX = SIZE / 2;
      const centerY = SIZE / 2;
      const radius = SIZE * 0.4;

      // Gradient
      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
      gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0.1)');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fill();

      rotation += 0.01;
      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [isActive]);

  if (!isActive) return null;

  return (
    <div className="voice-sphere-overlay active">
      <button className="sphere-settings-btn" title="Voice Settings">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3"/>
          <path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24"/>
        </svg>
      </button>

      <canvas ref={canvasRef} id="voiceSphereCanvas" />

      <div className="sphere-prompt">{status}</div>

      <div className="sphere-controls">
        <button 
          className={`sphere-btn ${isMuted ? 'mute-active' : ''}`}
          onClick={() => setIsMuted(!isMuted)}
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
            <line x1="12" y1="19" x2="12" y2="23"/>
            <line x1="8" y1="23" x2="16" y2="23"/>
          </svg>
          {isMuted && <div className="mic-slash" />}
        </button>

        <button 
          className="sphere-btn end-pill"
          onClick={onClose}
        >
          <div className="x-circle">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </div>
          <span className="end-label">End</span>
        </button>
      </div>
    </div>
  );
}
