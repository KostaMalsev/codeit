import FileBrowser from './core/FileBrowser.js';

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    const fileBrowser = new FileBrowser();

    // Expose to window for debugging in development
    if (process.env.NODE_ENV === 'development') {
        window.fileBrowser = fileBrowser;
    }
});