'use client';

export default function GhostModeInfo() {
  return (
    <div className="ghost-info" id="ghostInfo">
      <svg 
        width="64" 
        height="64" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="1.8"
        strokeLinecap="round" 
        strokeLinejoin="round"
      >
        <path d="M12 3C8.13 3 5 6.13 5 10v8l2-2 2 2 2-2 2 2 2-2 2 2v-8c0-3.87-3.13-7-7-7z"/>
        <circle cx="9.5" cy="10.5" r="1" fill="currentColor"/>
        <circle cx="14.5" cy="10.5" r="1" fill="currentColor"/>
      </svg>
      <h2>Ghost Mode</h2>
      <p>This session won't be saved to history and will be wiped when you leave. No traces left behind.</p>
    </div>
  );
}
