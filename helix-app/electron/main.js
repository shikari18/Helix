const { app, BrowserWindow, globalShortcut, ipcMain, Menu, shell } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const { spawn } = require('child_process');

// Increase limit for listeners
process.setMaxListeners(20);

// Disable menu
Menu.setApplicationMenu(null); 

let mainWindow;
let pythonProcess;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    backgroundColor: '#0a0a0a',
    frame: false, // Custom frame
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#0a0a0a',
      symbolColor: '#ffffff',
      height: 32
    },
    show: false, 
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
  });

  const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 HelixDesktop/1.0';
  const startUrl = process.env.ELECTRON_START_URL || 'https://helix-app-ueow.onrender.com/';
  
  const loadPage = () => {
    mainWindow.loadURL(startUrl, { userAgent }).catch(e => {
      if (e.code !== 'ERR_ABORTED') {
        mainWindow.loadFile(path.join(__dirname, 'offline.html')).catch(err => console.error(err));
      }
    });
  };

  loadPage();

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    // Only show offline for critical connection errors, skip aborts
    if (errorCode <= -100 && errorCode !== -3) {
      mainWindow.loadFile(path.join(__dirname, 'offline.html')).catch(e => console.error(e));
    }
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://accounts.google.com/')) {
      return { 
        action: 'allow',
        overrideBrowserWindowOptions: {
          width: 500,
          height: 650,
          autoHideMenuBar: true,
          title: 'Sign in with Google'
        }
      };
    }
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function startPythonSidecar() {
  const scriptPath = path.join(__dirname, '..', '..', 'server.py');
  const pythonPath = process.platform === 'win32' ? 'python' : 'python3';
  try {
    pythonProcess = spawn(pythonPath, [scriptPath], {
      env: { ...process.env, PORT: '8001' }
    });
    pythonProcess.on('error', (err) => console.error('[Desktop] Sidecar failed:', err));
  } catch (err) {}
}

app.whenReady().then(() => {
  createWindow();
  setTimeout(startPythonSidecar, 2000);

  ipcMain.on('agent-action', (event, { action }) => {
    if (action === 'get_window_info') {
      event.reply('agent-response', { success: true, title: 'Helix' });
    }
  });

  try {
    globalShortcut.register('Alt+Space', () => {
      if (mainWindow) {
        if (mainWindow.isVisible()) mainWindow.hide();
        else { mainWindow.show(); mainWindow.focus(); }
      }
    });
  } catch (e) {}
  // Auto-updater configuration
  autoUpdater.autoDownload = true;
  autoUpdater.checkForUpdatesAndNotify();

  autoUpdater.on('update-available', () => {
    console.log('[Updater] Update available.');
  });

  autoUpdater.on('update-downloaded', () => {
    console.log('[Updater] Update downloaded; will install now.');
    autoUpdater.quitAndInstall();
  });

  autoUpdater.on('error', (err) => {
    console.error('[Updater] Error:', err);
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    if (pythonProcess) pythonProcess.kill();
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
