'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { 
  Terminal as TerminalIcon, 
  Folder, 
  Shield, 
  Cpu, 
  Settings, 
  Activity, 
  Target, 
  Network, 
  Play, 
  ChevronRight, 
  FileCode, 
  Server,
  ArrowLeft,
  Search
} from 'lucide-react'

const LANGUAGES = ['python', 'bash', 'javascript', 'powershell']

const STARTERS: Record<string, string> = {
  python: `# Python practice\nimport socket\nimport os\n\nhost = "127.0.0.1"\nport = 80\n\nprint(f"[*] Initializing Helix Agent...")\nprint(f"[*] Targeting {host}:{port}")\n\ntry:\n    s = socket.socket()\n    s.connect((host, port))\n    print("[+] Connected successfully! Port is open.")\n    s.close()\nexcept Exception as e:\n    print(f"[-] Connection failed: {e}")\n`,
  bash: `#!/bin/bash\n# Bash practice - Reconnaissance\n\nTARGET="127.0.0.1"\necho "[*] Running rapid scan on $TARGET..."\n# nmap -sV -p 1-1000 $TARGET\necho "[+] Scan complete. Output saved to memory."\n`,
  javascript: `// JavaScript practice - Exploit Delivery\nconsole.log("[*] Generating payload...")\nfetch("http://localhost:3000/api/health")\n  .then(r => r.json())\n  .then(d => console.log("[+] Target response:", d))\n  .catch(e => console.error("[-] Target unreachable:", e.message));\n`,
  powershell: `# PowerShell practice - Lateral Movement\n$Target = "127.0.0.1"\nWrite-Host "[*] Testing connection to $Target"\nTest-NetConnection -ComputerName $Target -Port 80\n`,
}

const FILE_TREE = {
  python: 'exploit_dev.py',
  bash: 'recon_scan.sh',
  javascript: 'payload_delivery.js',
  powershell: 'lateral_movement.ps1'
}

export default function PracticePage() {
  const [lang, setLang] = useState('python')
  const [codes, setCodes] = useState<Record<string, string>>(STARTERS)
  const [outputs, setOutputs] = useState<Record<string, string>>({})
  const [running, setRunning] = useState(false)
  const [activeTab, setActiveTab] = useState<'terminal' | 'output' | 'problems'>('terminal')
  const [activeSideMenu, setActiveSideMenu] = useState('explorer')
  const [fontSize, setFontSize] = useState(14)
  const [theme, setTheme] = useState('helix-dark')
  const [searchQuery, setSearchQuery] = useState('')
  const taRef = useRef<HTMLTextAreaElement>(null)

  const code = codes[lang] || ''
  const output = outputs[lang] || ''
  const searchResults: { line: number; text: string }[] = searchQuery ? code.split('\n').map((line, i) => line.toLowerCase().includes(searchQuery.toLowerCase()) ? { line: i+1, text: line } : null).filter((item): item is { line: number; text: string } => item !== null) : []

  const toggleMenu = (menu: string) => {
    setActiveSideMenu(prev => prev === menu ? '' : menu)
  }

  const loadExploit = (name: string, snippet: string) => {
    setCodes(prev => ({ ...prev, [lang]: snippet }))
    setOutputs(prev => ({ ...prev, [lang]: (prev[lang] || '') + `\n[*] Loaded exploit module: ${name}\n` }))
  }

  const runNetworkScan = () => {
    setActiveTab('output')
    setOutputs(prev => ({ ...prev, [lang]: (prev[lang] || '') + '\nroot@helix:~/workspace$ nmap -sn 192.168.1.0/24\n[*] Starting Nmap 7.93...\nNmap scan report for 192.168.1.1\nHost is up (0.0020s latency).\nNmap scan report for 192.168.1.55\nHost is up (0.050s latency).\nNmap scan report for 192.168.1.104\nHost is up (0.0001s latency).\nNmap done: 256 IP addresses (3 hosts up) scanned in 2.1 seconds\n' }))
  }

  // Auto-scroll terminal
  const terminalEndRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [output])

  const changeLang = (l: string) => { 
    setLang(l); 
  }

  const setCode = (newCode: string) => {
    setCodes(prev => ({ ...prev, [lang]: newCode }))
  }

  const appendOutput = (text: string, replace: boolean = false) => {
    setOutputs(prev => ({ ...prev, [lang]: replace ? text : (prev[lang] || '') + text }))
  }

  const run = async () => {
    setRunning(true)
    setActiveTab('output')
    
    // Auto-clear output before running again for cleaner UX
    appendOutput(`root@helix:~/workspace$ ./run_${lang}\n[*] Executing payload sequence...\n`, true)
    
    try {
      const res = await fetch('http://localhost:8000/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: lang, code }),
      })
      const data = await res.json()
      appendOutput('\n' + (data.output || data.error || '[!] Execution completed with no output.'))
    } catch {
      appendOutput('\n[-] Fatal Error: Could not connect to Helix backend.\n[-] Ensure server.py is running on port 8000.')
    }
    setRunning(false)
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault()
      const ta = taRef.current!
      const s = ta.selectionStart
      const newCode = code.substring(0, s) + '    ' + code.substring(ta.selectionEnd)
      setCode(newCode)
      setTimeout(() => { ta.selectionStart = ta.selectionEnd = s + 4 }, 0)
    }
  }

  return (
    <div className="ide-root">
      <style>{`
        * { box-sizing: border-box; }
        .ide-root {
          position: fixed;
          inset: 0;
          background: #050505;
          color: #e0e0e0;
          display: flex;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          overflow: hidden;
        }

        /* Scrollbars */
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: #0a0a0a; }
        ::-webkit-scrollbar-thumb { background: #333; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #444; }

        /* Left Activity Bar */
        .activity-bar {
          width: 50px;
          background: #0a0a0a;
          border-right: 1px solid #1a1a1a;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 10px 0;
          z-index: 10;
        }
        .activity-icon {
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #555;
          cursor: pointer;
          transition: all 0.2s;
          border-left: 2px solid transparent;
        }
        .activity-icon.active {
          color: #fff;
          border-left-color: #fff;
        }
        .activity-icon:hover:not(.active) {
          color: #888;
        }

        /* Sidebar (File Tree) */
        .sidebar {
          width: 250px;
          background: #0d0d0d;
          border-right: 1px solid #1a1a1a;
          display: flex;
          flex-direction: column;
          flex-shrink: 0;
        }
        .sidebar-header {
          height: 40px;
          display: flex;
          align-items: center;
          padding: 0 16px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.1em;
          color: #888;
          text-transform: uppercase;
        }
        .tree-item {
          display: flex;
          align-items: center;
          padding: 6px 16px;
          cursor: pointer;
          font-size: 13px;
          color: #aaa;
          gap: 8px;
          transition: all 0.2s;
        }
        .tree-item:hover {
          background: #161616;
          color: #e0e0e0;
        }
        .tree-item.active {
          background: rgba(255,255,255,0.05);
          color: #fff;
        }

        /* Main Editor Area */
        .main-pane {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          background: #080808;
        }

        /* Top Bar */
        .top-bar {
          height: 48px;
          background: #0d0d0d;
          border-bottom: 1px solid #1a1a1a;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 16px;
          flex-shrink: 0;
        }
        .breadcrumbs {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: #888;
        }
        .breadcrumbs span.active {
          color: #fff;
        }

        .run-btn {
          background: #fff;
          color: #000;
          border: none;
          padding: 6px 20px;
          border-radius: 4px;
          font-size: 13px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 0 15px rgba(255,255,255,0.1);
        }
        .run-btn:hover:not(:disabled) {
          background: #e0e0e0;
          box-shadow: 0 0 25px rgba(255,255,255,0.2);
        }
        .run-btn:disabled {
          background: #333;
          color: #666;
          cursor: not-allowed;
          box-shadow: none;
        }
        
        .pulse {
          animation: pulseAnim 2s infinite;
        }
        @keyframes pulseAnim {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }

        /* Code Area */
        .code-container {
          flex: 1;
          display: flex;
          position: relative;
          background: #080808;
        }
        .line-numbers {
          width: 50px;
          padding: 16px 0;
          background: #0a0a0a;
          border-right: 1px solid #1a1a1a;
          text-align: right;
          color: #444;
          font-family: "Fira Code", "JetBrains Mono", "Courier New", monospace;
          font-size: 14px;
          line-height: 1.6;
          user-select: none;
        }
        .line-number { padding-right: 12px; }

        .editor-textarea {
          flex: 1;
          background: transparent;
          color: #d4d4d4;
          border: none;
          outline: none;
          resize: none;
          padding: 16px;
          font-family: "Fira Code", "JetBrains Mono", "Courier New", monospace;
          font-size: 14px;
          line-height: 1.6;
          white-space: pre;
          overflow-wrap: normal;
          overflow-x: auto;
        }

        /* Bottom Panel (Terminal) */
        .bottom-panel {
          height: 35vh;
          min-height: 200px;
          background: #0d0d0d;
          border-top: 1px solid #1a1a1a;
          display: flex;
          flex-direction: column;
          flex-shrink: 0;
        }
        .panel-tabs {
          display: flex;
          border-bottom: 1px solid #1a1a1a;
          padding: 0 16px;
        }
        .panel-tab {
          padding: 10px 16px;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          color: #666;
          cursor: pointer;
          border-bottom: 1px solid transparent;
          margin-bottom: -1px;
          transition: all 0.2s;
        }
        .panel-tab.active {
          color: #fff;
          border-bottom-color: #fff;
        }
        .panel-tab:hover:not(.active) { color: #aaa; }

        .terminal-content {
          flex: 1;
          padding: 16px;
          font-family: "Fira Code", "JetBrains Mono", "Courier New", monospace;
          font-size: 13px;
          line-height: 1.6;
          color: #a0a0a0;
          overflow-y: auto;
          white-space: pre-wrap;
        }
        .terminal-prompt { color: #00d2ff; font-weight: bold; }
        .terminal-text { color: #e0e0e0; }
        .terminal-success { color: #4ade80; }
        .terminal-error { color: #f87171; }
      `}</style>

      {/* --- Activity Bar --- */}
      <div className="activity-bar">
        <div className={`activity-icon ${activeSideMenu === 'explorer' ? 'active' : ''}`} onClick={() => toggleMenu('explorer')}><Folder size={24} strokeWidth={1.5} /></div>
        <div className={`activity-icon ${activeSideMenu === 'search' ? 'active' : ''}`} onClick={() => toggleMenu('search')}><Search size={24} strokeWidth={1.5} /></div>
        <div className={`activity-icon ${activeSideMenu === 'shield' ? 'active' : ''}`} onClick={() => toggleMenu('shield')}><Shield size={24} strokeWidth={1.5} /></div>
        <div className={`activity-icon ${activeSideMenu === 'network' ? 'active' : ''}`} onClick={() => toggleMenu('network')}><Network size={24} strokeWidth={1.5} /></div>
        <div style={{ flex: 1 }} />
        <Link href="/" style={{ color: 'inherit', textDecoration: 'none' }}>
          <div className="activity-icon"><ArrowLeft size={24} strokeWidth={1.5} /></div>
        </Link>
        <div className={`activity-icon ${activeSideMenu === 'settings' ? 'active' : ''}`} onClick={() => toggleMenu('settings')}><Settings size={24} strokeWidth={1.5} /></div>
      </div>

      {/* --- Sidebar --- */}
      {/* --- Sidebar --- */}
      <div className="sidebar" style={{ display: activeSideMenu ? 'flex' : 'none', minWidth: '250px' }}>
        {activeSideMenu === 'explorer' && (
          <>
            <div className="sidebar-header">EXPLORER</div>
            <div className="tree-item">
              <ChevronRight size={16} />
              <Folder size={16} />
              <span>HELIX_WORKSPACE</span>
            </div>
            <div style={{ paddingLeft: 12 }}>
              {LANGUAGES.map(l => (
                <div 
                  key={l} 
                  className={`tree-item ${lang === l ? 'active' : ''}`}
                  onClick={() => changeLang(l)}
                >
                  <FileCode size={16} color={lang === l ? '#fff' : '#666'} />
                  <span>{FILE_TREE[l as keyof typeof FILE_TREE]}</span>
                </div>
              ))}
            </div>

            <div className="sidebar-header" style={{ marginTop: '2rem' }}>TARGET INFO</div>
            <div style={{ padding: '0 16px' }}>
              <div style={{ background: '#111', padding: '12px', borderRadius: '8px', border: '1px solid #222' }}>
                <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>IP ADDRESS</div>
                <div style={{ fontSize: 13, color: '#fff', fontFamily: 'monospace', marginBottom: 12 }}>192.168.1.104</div>
                <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>OS FINGERPRINT</div>
                <div style={{ fontSize: 13, color: '#fff', fontFamily: 'monospace' }}>Linux 5.4.0-104</div>
              </div>
            </div>
          </>
        )}

        {activeSideMenu === 'search' && (
          <>
            <div className="sidebar-header">SEARCH</div>
            <div style={{ padding: '16px' }}>
              <input 
                type="text" 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search workspace..." 
                style={{ width: '100%', padding: '8px 12px', background: '#111', border: '1px solid #222', borderRadius: '4px', color: '#fff', outline: 'none' }} 
              />
              <div style={{ marginTop: '24px', fontSize: 13, color: '#666' }}>
                {searchResults.length === 0 ? (
                  <div style={{ textAlign: 'center' }}>No results found.</div>
                ) : (
                  searchResults.map((res, idx) => (
                    <div key={idx} style={{ padding: '4px 0', borderBottom: '1px solid #222' }}>
                      <span style={{ color: '#888', marginRight: 8 }}>{res.line}</span>
                      <span style={{ color: '#fff' }}>{res.text.length > 25 ? res.text.substring(0, 25) + '...' : res.text}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}

        {activeSideMenu === 'shield' && (
          <>
            <div className="sidebar-header">EXPLOIT MODULES</div>
            <div className="tree-item" onClick={() => loadExploit('CVE-2023-44487', '# CVE-2023-44487 HTTP/2 Rapid Reset\n# This module exploits the HTTP/2 Rapid Reset vulnerability.\n\nimport socket\nprint("[*] Launching Rapid Reset Attack...")')}><ChevronRight size={16} /><span>CVE-2023-44487</span></div>
            <div className="tree-item" onClick={() => loadExploit('CVE-2024-21412', '# CVE-2024-21412 Windows Defender Bypass\n# Bypasses SmartScreen protections.\n\nprint("[*] Injecting shellcode...")')}><ChevronRight size={16} /><span>CVE-2024-21412</span></div>
            <div className="tree-item" onClick={() => loadExploit('Zero-Day Payloads', '// Custom Zero-Day payload generator\n\nconsole.log("[*] Compiling rootkit for target arch...")')}><ChevronRight size={16} /><span>Zero-Day Payloads</span></div>
            <div className="tree-item" onClick={() => loadExploit('Post-Exploitation', '# Post-Exploitation enumeration\n\nimport os\nos.system("whoami && id")')}><ChevronRight size={16} /><span>Post-Exploitation</span></div>
          </>
        )}

        {activeSideMenu === 'network' && (
          <>
            <div className="sidebar-header">NETWORK TOPOLOGY</div>
            <div style={{ padding: '16px', fontSize: 13, color: '#888' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ade80' }}></span> 192.168.1.104 (Target)</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f87171' }}></span> 192.168.1.1 (Gateway)</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#fbbf24' }}></span> 192.168.1.55 (Unknown)</div>
              <button 
                style={{ width: '100%', padding: '8px', background: '#222', color: '#fff', border: '1px solid #444', borderRadius: '4px', cursor: 'pointer', marginTop: '16px' }}
                onClick={runNetworkScan}
              >
                Run Ping Sweep
              </button>
            </div>
          </>
        )}

        {activeSideMenu === 'settings' && (
          <>
            <div className="sidebar-header">SETTINGS</div>
            <div style={{ padding: '16px', fontSize: 13, color: '#aaa' }}>
              <div style={{ marginBottom: 16 }}>
                <div style={{ marginBottom: 4 }}>Theme</div>
                <select value={theme} onChange={e => setTheme(e.target.value)} style={{ width: '100%', padding: '6px', background: '#111', color: '#fff', border: '1px solid #222', borderRadius: '4px' }}>
                  <option value="helix-dark">Helix Dark</option>
                  <option value="high-contrast">High Contrast</option>
                </select>
              </div>
              <div style={{ marginBottom: 16 }}>
                <div style={{ marginBottom: 4 }}>Font Size</div>
                <input type="number" value={fontSize} onChange={e => setFontSize(Number(e.target.value))} style={{ width: '100%', padding: '6px', background: '#111', color: '#fff', border: '1px solid #222', borderRadius: '4px' }} />
              </div>
            </div>
          </>
        )}
      </div>

      {/* --- Main Pane --- */}
      <div className="main-pane">
        
        {/* Top Bar */}
        <div className="top-bar">
          <div className="breadcrumbs">
            <Server size={14} />
            <span>workspace</span>
            <ChevronRight size={14} />
            <span className="active">{FILE_TREE[lang as keyof typeof FILE_TREE]}</span>
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginRight: 16 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ade80' }}></span>
              <span style={{ fontSize: 12, color: '#888', fontFamily: 'monospace' }}>NODE_ONLINE</span>
            </div>
            <button className="run-btn" onClick={run} disabled={running}>
              {running ? (
                <><Activity size={16} className="pulse" /> EXECUTING...</>
              ) : (
                <><Play size={16} fill="currentColor" /> DEPLOY PAYLOAD</>
              )}
            </button>
          </div>
        </div>

        {/* Code Area */}
        <div className="code-container" style={{ filter: theme === 'high-contrast' ? 'contrast(1.5)' : 'none' }}>
          <div className="line-numbers" style={{ fontSize: `${fontSize}px` }}>
            {code.split('\n').map((_, i) => (
              <div key={i} className="line-number">{i + 1}</div>
            ))}
          </div>
          <textarea
            ref={taRef}
            value={code}
            onChange={e => setCode(e.target.value)}
            onKeyDown={onKeyDown}
            spellCheck={false}
            className="editor-textarea"
            style={{ fontSize: `${fontSize}px` }}
          />
        </div>

        {/* Bottom Panel */}
        <div className="bottom-panel">
          <div className="panel-tabs">
            <div className={`panel-tab ${activeTab === 'terminal' ? 'active' : ''}`} onClick={() => setActiveTab('terminal')}>Terminal</div>
            <div className={`panel-tab ${activeTab === 'output' ? 'active' : ''}`} onClick={() => setActiveTab('output')}>Output</div>
            <div className={`panel-tab ${activeTab === 'problems' ? 'active' : ''}`} onClick={() => setActiveTab('problems')}>Problems (0)</div>
          </div>
          
          <div className="terminal-content">
            {activeTab === 'terminal' && (
              <div>
                <span className="terminal-prompt">root@helix:~/workspace$</span> 
                <span className="terminal-text"> ./helix_daemon --connect 192.168.1.104</span>
                <br/>
                <span className="terminal-success">[+] Connection established securely. Waiting for payload execution...</span>
                <br/>
                <span className="terminal-prompt">root@helix:~/workspace$</span> <span className="pulse">_</span>
              </div>
            )}
            
            {activeTab === 'output' && (
              <div>
                {output || <span style={{ color: '#555' }}>No output generated yet. Deploy payload to see results.</span>}
                <div ref={terminalEndRef} />
              </div>
            )}

            {activeTab === 'problems' && (
              <div style={{ color: '#555', fontStyle: 'italic' }}>
                No vulnerabilities or syntax errors detected in current workspace.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}

