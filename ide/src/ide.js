import FileBrowser from './core/FileBrowser.js';
import * as GitAuth from './services/GitAuth.js';

// Initialize the application
document.addEventListener('DOMContentLoaded', async () => {
    // Create the FileBrowser instance
    const fileBrowser = new FileBrowser();

    // Initialize GitHub authentication
    await GitAuth.initialize(fileBrowser);

    // Load data from storage
    fileBrowser.storageService.loadFromStorage(fileBrowser);

    // Expose to window for debugging in development
    /*if (process.env.NODE_ENV === 'development') {
      window.fileBrowser = fileBrowser;
    }*/
});

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    const fileBrowser = new FileBrowser();

    // Expose to window for debugging in development
    if (fileBrowser.config.isDev) {
        window.fileBrowser = fileBrowser;
    }
});