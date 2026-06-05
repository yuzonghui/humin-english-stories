const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

const DATA_DIR = path.join(app.getPath('userData'), 'humin-data');
const DATA_FILE = path.join(DATA_DIR, 'user-data.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readUserData() {
  ensureDataDir();
  if (fs.existsSync(DATA_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    } catch {
      return getDefaultUserData();
    }
  }
  return getDefaultUserData();
}

function getDefaultUserData() {
  return {
    progress: {},
    wrongSentences: [],
    vocabulary: [],
    settings: {
      fontSize: 16,
      theme: 'light',
      accent: 'en-US',
      practiceMode: 'segment',
      speechRate: 0.9
    }
  };
}

function writeUserData(data) {
  ensureDataDir();
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: '胡敏考研英语趣味小故事',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  win.loadFile('index.html');
  win.setMenuBarVisibility(false);
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('load-user-data', () => readUserData());

ipcMain.handle('save-user-data', (_event, data) => {
  writeUserData(data);
  return true;
});

ipcMain.handle('load-stories', () => {
  const storiesPath = path.join(__dirname, 'data', 'stories.json');
  return JSON.parse(fs.readFileSync(storiesPath, 'utf-8'));
});
