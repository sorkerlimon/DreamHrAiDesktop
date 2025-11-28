const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
    // Login success handler
    loginSuccess: (userEmail) => {
        ipcRenderer.send('login-success', userEmail);
    },

    // Screenshot functionality
    takeScreenshot: () => ipcRenderer.invoke('take-screenshot'),

    // Listen for navigation events from main process
    onNavigateToDashboard: (callback) => {
        ipcRenderer.on('navigate-to-dashboard', callback);
    },

    // Clean up listeners
    removeAllListeners: (event) => {
        ipcRenderer.removeAllListeners(event);
    }
});
