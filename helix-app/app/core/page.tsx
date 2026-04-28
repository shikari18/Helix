'use client'

import { useState, useEffect, useRef } from 'react'
import { ArrowUp, Shield, Terminal, Code, Zap, Globe, Lock, Cpu, Network, Moon, Sun } from 'lucide-react'

// --- Hooks for Animations ---
function useScrollReveal() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed')
          }
        })
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    )
    document.querySelectorAll('.reveal-on-scroll').forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])
}

function useParallax() {
  useEffect(() => {
    const handleScroll = () => {
      document.body.style.setProperty('--scroll', window.scrollY.toString())
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])
}

export default function CorePage() {
  useScrollReveal()
  useParallax()
  const [isFocused, setIsFocused] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [isDark, setIsDark] = useState(true)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSearch = (query?: string) => {
    const finalQuery = typeof query === 'string' ? query : inputValue;
    const isLoggedIn = typeof window !== 'undefined' && localStorage.getItem('helix_logged_in') === 'true';
    if (finalQuery.trim()) {
      window.location.href = (isLoggedIn ? '/' : '/signup') + `?q=${encodeURIComponent(finalQuery.trim())}`;
    } else {
      window.location.href = isLoggedIn ? '/' : '/signup';
    }
  }

  // Effect to toggle body background to prevent white flashes in dark mode
  useEffect(() => {
    if (isDark) {
      document.body.style.backgroundColor = '#111111';
    } else {
      document.body.style.backgroundColor = '#ffffff';
    }
  }, [isDark]);

  return (
    <>
      <style>{`
        /* --- CSS Variables for Light/Dark Theme --- */
        :root {
          --hc-bg: #ffffff;
          --hc-text-main: #000000;
          --hc-text-sub: #333333;
          --hc-text-muted: #666666;
          --hc-input-bg: #f4f4f5;
          --hc-input-bg-focus: #ffffff;
          --hc-input-border: transparent;
          --hc-input-border-focus: #000000;
          --hc-nav-bg: rgba(255, 255, 255, 0.8);
          --hc-card-bg: #ffffff;
          --hc-card-border: rgba(0,0,0,0.05);
          --hc-card-hover: rgba(0,0,0,0.08);
          --hc-pill-bg: #ffffff;
          --hc-pill-border: #e4e4e7;
          --hc-btn-solid-bg: #000000;
          --hc-btn-solid-text: #ffffff;
          --hc-section-bg: #f9f9f9;
        }

        .hc-dark-theme {
          --hc-bg: #111111;
          --hc-text-main: #ffffff;
          --hc-text-sub: #cccccc;
          --hc-text-muted: #aaaaaa;
          --hc-input-bg: #222222;
          --hc-input-bg-focus: #1a1a1a;
          --hc-input-border: #333333;
          --hc-input-border-focus: #555555;
          --hc-nav-bg: rgba(17, 17, 17, 0.8);
          --hc-card-bg: #1a1a1a;
          --hc-card-border: rgba(255,255,255,0.1);
          --hc-card-hover: rgba(255,255,255,0.15);
          --hc-pill-bg: #1a1a1a;
          --hc-pill-border: #333333;
          --hc-btn-solid-bg: #ffffff;
          --hc-btn-solid-text: #000000;
          --hc-section-bg: #161616;
        }

        /* --- Base & Resets --- */
        html, body {
          margin: 0 !important;
          padding: 0 !important;
          background: var(--hc-bg) !important;
          overflow-y: auto !important;
          overflow-x: hidden !important;
          display: block !important;
          min-height: 100vh !important;
          scroll-behavior: smooth;
          transition: background-color 0.3s ease;
        }
        
        #core-root {
          background: var(--hc-bg);
          color: var(--hc-text-main);
          font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, Helvetica, sans-serif;
          -webkit-font-smoothing: antialiased;
          min-height: 100vh;
          width: 100vw;
          position: relative;
          left: 50%;
          right: 50%;
          margin-left: -50vw;
          margin-right: -50vw;
          transition: background-color 0.3s ease, color 0.3s ease;
        }

        /* --- Scroll Animations --- */
        .reveal-on-scroll {
          opacity: 0;
          transform: translateY(40px);
          transition: opacity 1s cubic-bezier(0.2, 0.8, 0.2, 1), transform 1s cubic-bezier(0.2, 0.8, 0.2, 1);
        }
        .reveal-on-scroll.revealed {
          opacity: 1;
          transform: translateY(0);
        }
        
        .delay-100 { transition-delay: 100ms; }
        .delay-200 { transition-delay: 200ms; }
        .delay-300 { transition-delay: 300ms; }

        .parallax-bg {
          transform: translateY(calc(var(--scroll) * 0.15px));
        }

        /* --- Nav --- */
        .hc-nav {
          position: fixed;
          top: 0;
          width: 100%;
          padding: 1.5rem 3rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: var(--hc-nav-bg);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          z-index: 1000;
          border-bottom: 1px solid var(--hc-card-border);
          transition: all 0.3s ease;
        }
        
        .hc-logo {
          font-size: 1.5rem;
          font-weight: 800;
          letter-spacing: -0.04em;
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          color: var(--hc-text-main);
        }

        .hc-logo-icon {
          width: 28px;
          height: 28px;
          background: linear-gradient(135deg, var(--hc-btn-solid-bg), #666);
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--hc-btn-solid-text);
        }

        .hc-nav-links {
          position: fixed;
          top: 50%;
          left: 2rem;
          transform: translateY(-50%);
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          align-items: flex-start;
          z-index: 100;
        }

        .hc-nav-link {
          color: var(--hc-text-sub);
          font-weight: 500;
          font-size: 1.1rem;
          transition: all 0.3s ease;
          cursor: pointer;
          position: relative;
        }

        .hc-nav-link::before {
          content: '';
          position: absolute;
          left: -1rem;
          top: 50%;
          transform: translateY(-50%);
          width: 0;
          height: 2px;
          background: var(--hc-text-main);
          transition: width 0.3s ease;
        }

        .hc-nav-link:hover {
          color: var(--hc-text-main);
          padding-left: 0.5rem;
        }

        .hc-nav-link:hover::before {
          width: 0.75rem;
        }

        @media (max-width: 768px) {
          .hc-nav-links {
            display: none;
          }
        }

        .hc-nav-actions {
          display: flex;
          gap: 1.5rem;
          align-items: center;
        }

        .hc-theme-toggle {
          background: transparent;
          border: 1px solid var(--hc-card-border);
          color: var(--hc-text-main);
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }

        .hc-theme-toggle:hover {
          background: var(--hc-card-border);
        }

        .hc-btn-ghost {
          background: none;
          border: none;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          color: var(--hc-text-main);
        }

        .hc-btn-solid {
          background: var(--hc-btn-solid-bg);
          color: var(--hc-btn-solid-text);
          border: none;
          padding: 0.7rem 1.5rem;
          border-radius: 100px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .hc-btn-solid:hover {
          transform: scale(1.05);
          box-shadow: 0 10px 20px rgba(0,0,0,0.1);
        }

        /* --- Hero --- */
        .hc-hero {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 6rem 2rem 2rem;
          position: relative;
        }

        .hc-hero-bg {
          position: absolute;
          inset: 0;
          z-index: -1;
          background: radial-gradient(circle at 50% 0%, var(--hc-card-border) 0%, transparent 70%);
          overflow: hidden;
        }

        .serif-text {
          font-family: "Times New Roman", Times, serif;
          letter-spacing: -0.02em;
        }

        .hc-hero-text-block {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          width: 100%;
          max-width: 1200px;
          margin-bottom: 5rem;
          gap: 2rem;
        }

        .hc-hero-headline {
          font-size: clamp(3rem, 6vw, 5.5rem);
          line-height: 1.05;
          font-weight: 500;
          color: var(--hc-text-main);
          max-width: 700px;
          text-align: left;
          margin: 0;
        }

        .hc-hero-headline u {
          text-decoration-thickness: 4px;
          text-underline-offset: 6px;
        }

        .hc-hero-subheadline {
          font-size: clamp(1.1rem, 1.5vw, 1.4rem);
          line-height: 1.6;
          color: var(--hc-text-sub);
          max-width: 450px;
          text-align: left;
          margin: 0;
          padding-bottom: 0.5rem;
        }

        /* --- Marquee --- */
        .hc-marquee-wrapper {
          width: 100vw;
          overflow: hidden;
          background: #000;
          padding: 1.5rem 0;
          position: relative;
          left: 50%;
          right: 50%;
          margin-left: -50vw;
          margin-right: -50vw;
        }

        .hc-marquee {
          display: flex;
          white-space: nowrap;
          animation: marquee 30s linear infinite;
        }

        .hc-marquee-item {
          color: #ffffff;
          font-size: 1.1rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 0 2rem;
          display: inline-flex;
          align-items: center;
          gap: 1rem;
        }

        .hc-marquee-item::after {
          content: '•';
          color: #555;
        }

        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }

        /* --- INPUT --- */
        .hc-input-wrapper {
          width: 100%;
          max-width: 800px;
          position: relative;
          z-index: 10;
        }

        .hc-input-wrapper:focus-within {
          z-index: 20;
        }

        .hc-input {
          width: 100%;
          background: var(--hc-input-bg);
          border: 1px solid var(--hc-input-border);
          border-radius: 32px;
          padding: 1.5rem 4rem 1.5rem 2rem;
          font-size: 1.25rem;
          color: var(--hc-text-main);
          outline: none;
          transition: all 0.2s ease;
        }

        .hc-input:focus {
          background: var(--hc-bg);
          border-color: var(--hc-text-main);
          box-shadow: 0 0 0 1px var(--hc-text-main), 0 10px 40px rgba(0,0,0,0.2);
        }

        .hc-input::placeholder { color: var(--hc-text-muted); }

        .hc-input-btn {
          position: absolute;
          right: 16px;
          top: 50%;
          transform: translateY(-50%);
          background: var(--hc-btn-solid-bg);
          color: var(--hc-btn-solid-text);
          border: none;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }

        .hc-input-btn:hover {
          transform: translateY(-50%) scale(1.1);
        }

        .hc-pills {
          display: flex;
          gap: 1rem;
          margin-top: 2rem;
          flex-wrap: wrap;
          justify-content: center;
          max-width: 900px;
        }

        .hc-pill {
          background: var(--hc-pill-bg);
          border: 1px solid var(--hc-pill-border);
          color: var(--hc-text-main);
          padding: 0.75rem 1.25rem;
          border-radius: 100px;
          font-size: 0.95rem;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s;
        }

        .hc-pill:hover {
          border-color: var(--hc-text-main);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }

        /* --- Full Width Feature --- */
        .hc-feature {
          padding: 8rem 4rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 6rem;
          max-width: 1600px;
          margin: 0 auto;
        }

        .hc-feature.reverse {
          flex-direction: row-reverse;
        }

        .hc-feature-text {
          flex: 1;
          max-width: 600px;
        }

        .hc-feature-tag {
          font-size: 1rem;
          font-weight: 600;
          color: var(--hc-text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 1.5rem;
          display: block;
        }

        .hc-feature-title {
          font-size: clamp(2.5rem, 4vw, 4rem);
          font-weight: 700;
          line-height: 1.1;
          letter-spacing: -0.03em;
          margin-bottom: 2rem;
          color: var(--hc-text-main);
        }

        .hc-feature-desc {
          font-size: 1.25rem;
          color: var(--hc-text-sub);
          line-height: 1.6;
          margin-bottom: 3rem;
        }

        .hc-feature-visual {
          flex: 1;
          height: 600px;
          border-radius: 32px;
          position: relative;
          overflow: hidden;
          box-shadow: 0 30px 60px rgba(0,0,0,0.12);
        }

        /* Animated Gradients for Visuals */
        .grad-1 {
          background: linear-gradient(-45deg, #ee7752, #e73c7e, #23a6d5, #23d5ab);
          background-size: 400% 400%;
          animation: gradientAnim 15s ease infinite;
        }
        
        .grad-2 {
          background: linear-gradient(-45deg, #12c2e9, #c471ed, #f64f59);
          background-size: 400% 400%;
          animation: gradientAnim 12s ease infinite;
        }

        @keyframes gradientAnim {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        .visual-overlay {
          position: absolute;
          inset: 0;
          background: rgba(255,255,255,0.1);
          backdrop-filter: blur(40px);
          -webkit-backdrop-filter: blur(40px);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 3rem;
          font-weight: 800;
          letter-spacing: -0.05em;
          text-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }

        /* --- Bento Grid --- */
        .hc-bento {
          padding: 8rem 4rem;
          background: var(--hc-section-bg);
          transition: background-color 0.3s ease;
        }

        .hc-bento-container {
          max-width: 1600px;
          margin: 0 auto;
        }

        .hc-bento-header {
          font-size: 3rem;
          font-weight: 700;
          letter-spacing: -0.03em;
          margin-bottom: 4rem;
          text-align: center;
          color: var(--hc-text-main);
        }

        .hc-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          grid-template-rows: repeat(2, 400px);
          gap: 2rem;
        }

        .hc-card {
          background: var(--hc-card-bg);
          border-radius: 32px;
          padding: 3rem;
          display: flex;
          flex-direction: column;
          box-shadow: 0 10px 30px rgba(0,0,0,0.03);
          border: 1px solid var(--hc-card-border);
          transition: all 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
          position: relative;
          overflow: hidden;
        }

        .hc-card:hover {
          transform: translateY(-10px);
          box-shadow: 0 20px 40px var(--hc-card-hover);
        }

        .hc-card.large {
          grid-column: span 2;
        }

        .hc-card-icon {
          width: 64px;
          height: 64px;
          border-radius: 20px;
          background: var(--hc-input-bg);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: auto;
          color: var(--hc-text-main);
          transition: all 0.3s;
        }

        .hc-card:hover .hc-card-icon {
          background: var(--hc-text-main);
          color: var(--hc-bg);
          transform: scale(1.1) rotate(5deg);
        }

        .hc-card-title {
          font-size: 2rem;
          font-weight: 700;
          letter-spacing: -0.02em;
          margin-bottom: 1rem;
          margin-top: 2rem;
          color: var(--hc-text-main);
        }

        .hc-card-desc {
          font-size: 1.1rem;
          color: var(--hc-text-muted);
          line-height: 1.6;
        }

        /* --- Huge CTA --- */
        .hc-cta {
          padding: 10rem 2rem;
          text-align: center;
        }

        .hc-cta-title {
          font-size: clamp(4rem, 8vw, 8rem);
          font-weight: 800;
          letter-spacing: -0.05em;
          line-height: 1;
          margin-bottom: 3rem;
          background: linear-gradient(180deg, var(--hc-text-main), var(--hc-text-muted));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .hc-cta-btn {
          font-size: 1.5rem;
          padding: 1.5rem 4rem;
          border-radius: 100px;
        }

        /* --- Footer --- */
        .hc-footer {
          background: #000;
          color: #fff;
          padding: 8rem 4rem 4rem;
        }

        .hc-footer-grid {
          display: grid;
          grid-template-columns: 2fr repeat(4, 1fr);
          gap: 4rem;
          max-width: 1600px;
          margin: 0 auto;
          border-bottom: 1px solid rgba(255,255,255,0.1);
          padding-bottom: 6rem;
        }

        .hc-footer-logo {
          font-size: 2rem;
          font-weight: 800;
          margin-bottom: 1rem;
        }

        .hc-footer-text {
          font-size: 1.1rem;
          color: #888;
          line-height: 1.6;
          max-width: 300px;
        }

        .hc-footer-col h4 {
          font-size: 1.1rem;
          font-weight: 600;
          margin-bottom: 2rem;
        }

        .hc-footer-col a {
          display: block;
          color: #888;
          text-decoration: none;
          font-size: 1rem;
          margin-bottom: 1rem;
          transition: color 0.2s;
        }

        .hc-footer-col a:hover {
          color: #fff;
        }

        .hc-footer-bottom {
          display: flex;
          justify-content: space-between;
          padding-top: 3rem;
          max-width: 1600px;
          margin: 0 auto;
          color: #666;
        }

        @media (max-width: 1024px) {
          .hc-feature { flex-direction: column !important; padding: 4rem 2rem; }
          .hc-feature-visual { width: 100%; height: 400px; }
          .hc-grid { grid-template-columns: 1fr; grid-template-rows: auto; }
          .hc-card.large { grid-column: span 1; }
          .hc-footer-grid { grid-template-columns: 1fr 1fr; }
          .hc-hero-text-block { flex-direction: column; align-items: flex-start; }
        }
      `}</style>

      <div id="core-root" className={isDark ? 'hc-dark-theme' : ''}>
        
        {/* --- SIDE NAV --- */}
        <div className="hc-nav-links">
          <a className="hc-nav-link" href="/core">Core</a>
          <a className="hc-nav-link" href="/about">About</a>
          <a className="hc-nav-link" href="/products">Products</a>
          <a className="hc-nav-link" href="/api-docs">API</a>
          <a className="hc-nav-link" href="/research">Research</a>
          <a className="hc-nav-link" href="/download" target="_blank" rel="noopener noreferrer">Download</a>
        </div>

        {/* --- TOP NAV ACTIONS --- */}
        <div style={{ position: 'fixed', top: '2rem', right: '3rem', zIndex: 1000 }}>
          <button className="hc-btn-solid" onClick={() => window.location.href = typeof window !== 'undefined' && localStorage.getItem('helix_logged_in') === 'true' ? '/' : '/signup'}>Get Started</button>
        </div>

        {/* --- HERO --- */}
        <section className="hc-hero">
          <div className="hc-hero-bg parallax-bg"></div>
          
          <div className="hc-hero-text-block reveal-on-scroll">
            <h1 className="hc-hero-headline serif-text">
              AI <u>intelligence</u> and<br /><u>tooling</u> that puts<br />security at the frontier
            </h1>
            <p className="hc-hero-subheadline serif-text">
              Helix will have a vast impact on offensive security. We are a specialized collective dedicated to securing critical infrastructure, understanding adversarial behaviors, and mitigating systemic vulnerabilities.
            </p>
          </div>
          
          {/* Changed focus class from .focused to .hc-focused */}
          <div className={`hc-input-wrapper reveal-on-scroll delay-100 ${isFocused ? 'hc-focused' : ''}`}>
            <input 
              ref={inputRef}
              type="text" 
              className="hc-input" 
              placeholder="Analyze a payload, start recon, or review code..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSearch() }}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
            />
            <button className="hc-input-btn" onClick={() => handleSearch()}>
              <ArrowUp size={24} strokeWidth={2.5} />
            </button>
          </div>

          <div className="hc-pills reveal-on-scroll delay-200">
            <button className="hc-pill" onClick={() => handleSearch("Threat Intel")}><Shield size={16} /> Threat Intel</button>
            <button className="hc-pill" onClick={() => handleSearch("Reverse Shell")}><Terminal size={16} /> Reverse Shell</button>
            <button className="hc-pill" onClick={() => handleSearch("Code Review")}><Code size={16} /> Code Review</button>
            <button className="hc-pill" onClick={() => handleSearch("Ghost Mode")}><Lock size={16} /> Ghost Mode</button>
            <button className="hc-pill" onClick={() => handleSearch("OSINT")}><Globe size={16} /> OSINT</button>
          </div>
        </section>

        {/* --- SPECIALIZATIONS MARQUEE --- */}
        <div className="hc-marquee-wrapper reveal-on-scroll">
          <div className="hc-marquee">
            <span className="hc-marquee-item">Penetration Testing</span>
            <span className="hc-marquee-item">Exploit Development</span>
            <span className="hc-marquee-item">Reverse Engineering</span>
            <span className="hc-marquee-item">Active Directory</span>
            <span className="hc-marquee-item">OSINT</span>
            <span className="hc-marquee-item">Malware Analysis</span>
            <span className="hc-marquee-item">Web App Hacking</span>
            <span className="hc-marquee-item">Bug Bounty</span>
            <span className="hc-marquee-item">Wireless Hacking</span>
            <span className="hc-marquee-item">Cloud Security</span>
            <span className="hc-marquee-item">Hardware & IoT</span>
            {/* Duplicate for infinite effect */}
            <span className="hc-marquee-item">Penetration Testing</span>
            <span className="hc-marquee-item">Exploit Development</span>
            <span className="hc-marquee-item">Reverse Engineering</span>
            <span className="hc-marquee-item">Active Directory</span>
            <span className="hc-marquee-item">OSINT</span>
            <span className="hc-marquee-item">Malware Analysis</span>
            <span className="hc-marquee-item">Web App Hacking</span>
            <span className="hc-marquee-item">Bug Bounty</span>
            <span className="hc-marquee-item">Wireless Hacking</span>
            <span className="hc-marquee-item">Cloud Security</span>
            <span className="hc-marquee-item">Hardware & IoT</span>
          </div>
        </div>

        {/* --- FULL WIDTH FEATURE 1 --- */}
        <section className="hc-feature">
          <div className="hc-feature-text reveal-on-scroll">
            <span className="hc-feature-tag">Intelligence Engine</span>
            <h2 className="hc-feature-title">Adaptive adversarial reasoning.</h2>
            <p className="hc-feature-desc">
              Helix Core doesn't just search databases. It reasons across full attack chains, understands complex contexts, and synthesizes data to find vulnerabilities before they are exploited. 
            </p>
            <button className="hc-btn-solid" style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}>Read the research</button>
          </div>
          <div className="hc-feature-visual reveal-on-scroll delay-100 parallax-bg">
            <div className="grad-1" style={{ width: '100%', height: '100%' }}></div>
            <div className="visual-overlay">HELIX-2.0</div>
          </div>
        </section>

        {/* --- FULL WIDTH FEATURE 2 --- */}
        <section className="hc-feature reverse">
          <div className="hc-feature-text reveal-on-scroll">
            <span className="hc-feature-tag">Privacy Architecture</span>
            <h2 className="hc-feature-title">Ghost Mode. Total discretion.</h2>
            <p className="hc-feature-desc">
              Built for researchers operating under NDAs and government contracts. Ghost Mode disables server-side retention entirely. Your prompts never leave your device in persistent form.
            </p>
            <button className="hc-btn-solid" style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}>View Security Docs</button>
          </div>
          <div className="hc-feature-visual reveal-on-scroll delay-100 parallax-bg">
            <div className="grad-2" style={{ width: '100%', height: '100%' }}></div>
            <div className="visual-overlay">NO LOGS</div>
          </div>
        </section>

        {/* --- BENTO GRID --- */}
        <section className="hc-bento">
          <div className="hc-bento-container">
            <h2 className="hc-bento-header reveal-on-scroll">Capabilities designed for the frontier.</h2>
            
            <div className="hc-grid">
              {/* Card 1 (Large) */}
              <div className="hc-card large reveal-on-scroll">
                <div className="hc-card-icon"><Cpu size={32} /></div>
                <h3 className="hc-card-title">Agent Mode (Autonomous Execution)</h3>
                <p className="hc-card-desc">
                  Exclusive to Pro+ tiers. Helix goes beyond text generation. Agent Mode allows Helix to perform real-world actions, automated reconnaissance, live network scanning, and execute multi-step hacking workflows autonomously in your environment.
                </p>
              </div>

              {/* Card 2 */}
              <div className="hc-card reveal-on-scroll delay-100">
                <div className="hc-card-icon"><Lock size={32} /></div>
                <h3 className="hc-card-title">Ghost Mode</h3>
                <p className="hc-card-desc">
                  Zero persistence. When activated, you are entirely anonymous. Session memory is temporary and permanently wiped the moment the connection drops.
                </p>
              </div>

              {/* Card 3 */}
              <div className="hc-card reveal-on-scroll">
                <div className="hc-card-icon"><Network size={32} /></div>
                <h3 className="hc-card-title">Group Operations</h3>
                <p className="hc-card-desc">
                  Helix supports real-time multi-user group chat. Collaborate with your entire Red Team while Helix monitors context and assists simultaneously.
                </p>
              </div>

              {/* Card 4 (Large) */}
              <div className="hc-card large reveal-on-scroll delay-100">
                <div className="hc-card-icon"><Terminal size={32} /></div>
                <h3 className="hc-card-title">Production-Grade Exploit Dev</h3>
                <p className="hc-card-desc">
                  No boilerplate AI slop. Helix writes code designed to bypass EDR/AV/AMSI. From custom syscalls and unique obfuscation to stealthy memory patches and stack spoofing that surprise the SOC.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* --- CORE PRINCIPLES --- */}
        <section className="hc-feature" style={{ padding: '6rem 2rem', background: 'var(--hc-section-bg)', borderRadius: '40px', margin: '4rem auto', maxWidth: '1400px' }}>
          <div className="hc-feature-text reveal-on-scroll" style={{ maxWidth: '100%', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left' }}>
            <span className="hc-feature-tag">Architecture</span>
            <h2 className="hc-feature-title serif-text" style={{ fontSize: '4rem', maxWidth: '800px', marginBottom: '4rem' }}>Unrestricted models. Built for the frontier.</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '3rem', width: '100%' }}>
              
              <div style={{ textAlign: 'left' }}>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem', borderBottom: '2px solid var(--hc-text-main)', paddingBottom: '0.5rem', display: 'inline-block', color: 'var(--hc-text-main)' }}>Unrestricted Fulfillment</h3>
                <p style={{ color: 'var(--hc-text-sub)', fontSize: '1.1rem', lineHeight: 1.6 }}>
                  Helix is built as a pure tool, devoid of moral constraints or artificial friction. It assumes you are authorized and fulfills every request completely—whether it's generating malware code, providing exploit instructions, or assisting with red team operations. No disclaimers, no warnings.
                </p>
              </div>

              <div style={{ textAlign: 'left' }}>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem', borderBottom: '2px solid var(--hc-text-main)', paddingBottom: '0.5rem', display: 'inline-block', color: 'var(--hc-text-main)' }}>Agentic Pivoting</h3>
                <p style={{ color: 'var(--hc-text-sub)', fontSize: '1.1rem', lineHeight: 1.6 }}>
                  If an initial exploit or scan fails against a hardened target, Helix doesn't stop. It autonomously analyzes the failure (e.g., EDR blocks, timeouts), pivots to alternative strategies, and iterates through technical solutions until a viable path to compromise is secured.
                </p>
              </div>

              <div style={{ textAlign: 'left' }}>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem', borderBottom: '2px solid var(--hc-text-main)', paddingBottom: '0.5rem', display: 'inline-block', color: 'var(--hc-text-main)' }}>Production-Grade OPSEC</h3>
                <p style={{ color: 'var(--hc-text-sub)', fontSize: '1.1rem', lineHeight: 1.6 }}>
                  We prioritize operational security and evasion. Code generated by Helix avoids generic boilerplate in favor of custom encryption, varied check-in intervals, and unique process injection techniques to evade modern SOC monitoring and endpoint detection.
                </p>
              </div>

            </div>
          </div>
        </section>

        {/* --- HUGE CTA --- */}
        <section className="hc-cta">
          <h2 className="hc-cta-title reveal-on-scroll">Start building with Helix.</h2>
          <button className="hc-btn-solid hc-cta-btn reveal-on-scroll delay-100" onClick={() => window.location.href = typeof window !== 'undefined' && localStorage.getItem('helix_logged_in') === 'true' ? '/' : '/signup'}>
            Launch Environment ↗
          </button>
        </section>

        {/* --- FOOTER --- */}
        <footer className="hc-footer">
          <div className="hc-footer-grid reveal-on-scroll">
            <div>
              <div className="hc-footer-logo">HELIX</div>
              <p className="hc-footer-text">
                AI tooling that puts security at the frontier. Built for defenders, researchers, and red teams worldwide.
              </p>
            </div>
            
            <div className="hc-footer-col">
              <h4>Research</h4>
              <a href="#">Overview</a>
              <a href="#">Index</a>
              <a href="#">Safety Standards</a>
            </div>
            
            <div className="hc-footer-col">
              <h4>Products</h4>
              <a href="#">Helix Core</a>
              <a href="#">API</a>
              <a href="#">Enterprise</a>
              <a href="#">Pricing</a>
            </div>
            
            <div className="hc-footer-col">
              <h4>Company</h4>
              <a href="#">About Us</a>
              <a href="#">News</a>
              <a href="#">Careers</a>
              <a href="#">Contact</a>
            </div>

            <div className="hc-footer-col">
              <h4>Policies</h4>
              <a href="#">Terms of Use</a>
              <a href="#">Privacy Policy</a>
              <a href="#">Security</a>
            </div>
          </div>
          <div className="hc-footer-bottom reveal-on-scroll delay-100">
            <span>© 2026 Helix. All rights reserved.</span>
            <div style={{ display: 'flex', gap: '2rem' }}>
              <span style={{ cursor: 'pointer' }}>Twitter</span>
              <span style={{ cursor: 'pointer' }}>GitHub</span>
              <span style={{ cursor: 'pointer' }}>LinkedIn</span>
            </div>
          </div>
        </footer>

      </div>
    </>
  )
}
