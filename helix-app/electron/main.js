const { app, BrowserWindow, globalShortcut, ipcMain, Menu } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

Menu.setApplicationMenu(null); // Remove default menu bar

let mainWindow;
let pythonProcess;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    backgroundColor: '#0a0a0a',
    frame: true, // Ensure standard window frame (min/max/close)
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
  });

  // Set User Agent with unique identifier for the frontend to detect
  const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 HelixDesktop/1.0';

  // Load the web app
  const startUrl = process.env.ELECTRON_START_URL || 'https://helix-app-ueow.onrender.com/';
  console.log(`[Desktop] Attempting to load: ${startUrl}`);
  
  const loadPage = () => {
    mainWindow.loadURL(startUrl, { userAgent }).catch(e => {
      console.error('[Desktop] Failed to load page, retrying in 5s...', e);
      setTimeout(loadPage, 5000);
    });
  };

  loadPage();

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Start Python sidecar
function startPythonSidecar() {
  const pythonPath = process.platform === 'win32' ? 'python' : 'python3';
  const scriptPath = path.join(__dirname, '..', '..', 'server.py');
  
  console.log(`[Desktop] Starting Python sidecar: ${pythonPath} ${scriptPath}`);
  
  pythonProcess = spawn(pythonPath, [scriptPath], {
    env: { ...process.env, PORT: '8001' } // Run sidecar on unique port
  });

  pythonProcess.stdout.on('data', (data) => console.log(`[Python] ${data}`));
  pythonProcess.stderr.on('data', (data) => console.error(`[Python Error] ${data}`));
}

app.whenReady().then(() => {
  createWindow();
  startPythonSidecar();

  // Native Agent Bridge
  ipcMain.on('agent-action', async (event, { action, data }) => {
    console.log(`[Desktop] Received agent action: ${action}`);
    
    // Some actions can be handled directly by Electron
    if (action === 'get_window_info') {
      event.reply('agent-response', { success: True, title: mainWindow.getTitle() });
      return;
    }

    // Forward most actions to the Python sidecar
    try {
      const response = await fetch(`http://127.0.0.1:8001/api/agent/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, params: data })
      });
      const result = await response.json();
      event.reply('agent-response', result);
    } catch (err) {
      console.error('[Desktop] Failed to forward action to sidecar:', err);
      event.reply('agent-response', { success: false, error: 'Sidecar communication failed' });
    }
  });

  // Alt+Space to toggle Helix
  globalShortcut.register('Alt+Space', () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    if (pythonProcess) pythonProcess.kill();
    app.quit();
  }
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});
