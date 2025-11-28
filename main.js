const { app, BrowserWindow, dialog, ipcMain, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const screenshot = require('screenshot-desktop');

function createWindow() {
  // Create the browser window
  let mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    resizable: false,
    maximizable: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, 'assets', 'icon.png'), // Optional: add icon later
    title: 'DreamHRAi - HR Management System'
  });

  // Set Content Security Policy to fix security warning
  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self';"
        ]
      }
    });
  });

  // Remove default menu bar (File, Edit, View, Window, Help)
  mainWindow.setMenuBarVisibility(false);
  // Alternative: Menu.setApplicationMenu(null);

  // Load the login.html file
  mainWindow.loadFile('src/template/login.html');

  // Open DevTools always for debugging
  mainWindow.webContents.openDevTools();

  // Handle screenshot request
  ipcMain.handle('take-screenshot', async () => {
    try {
      // Create screenshots directory if it doesn't exist
      const screenshotsDir = path.join(__dirname, 'src', 'screenshots');
      if (!fs.existsSync(screenshotsDir)) {
        fs.mkdirSync(screenshotsDir, { recursive: true });
      }

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `time-in-${timestamp}.png`;
      const filepath = path.join(screenshotsDir, filename);

      console.log('Taking screenshot...');

      // Take screenshot of entire screen
      const img = await screenshot();

      // Save the screenshot
      fs.writeFileSync(filepath, img);

      console.log('Screenshot saved successfully:', filepath);

      return {
        success: true,
        filepath: filepath,
        filename: filename
      };

    } catch (error) {
      console.error('Screenshot failed:', error);
      throw error;
    }
  });

  // Handle window close event with confirmation
  mainWindow.on('close', (event) => {
    const choice = dialog.showMessageBoxSync(mainWindow, {
      type: 'question',
      buttons: ['Yes', 'No'],
      title: 'Confirm Exit',
      message: 'Are you sure you want to quit DreamHRAi?',
      detail: 'All unsaved work will be lost.',
      defaultId: 1, // Default to 'No'
      cancelId: 1,  // ESC key maps to 'No'
      noLink: true
    });

    if (choice === 1) { // 'No' button clicked
      event.preventDefault(); // Prevent the window from closing
    }
    // If choice === 0 ('Yes'), allow the window to close naturally
  });

  // Handle login success and navigate to dashboard
  ipcMain.on('login-success', (event, userEmail) => {
    if (mainWindow) {
      // Load the main dashboard
      mainWindow.loadFile('src/template/index.html');
    }
  });

  // Emitted when the window is closed
  mainWindow.on('closed', () => {
    // Dereference the window object
    mainWindow = null;
  });
}

// This method will be called when Electron has finished initialization
app.whenReady().then(createWindow);

// Quit when all windows are closed
app.on('window-all-closed', () => {
  // On macOS it is common for applications to stay active until explicitly quit
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On macOS it's common to re-create a window when dock icon is clicked
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
