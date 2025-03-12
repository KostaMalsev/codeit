import FileBrowser from './core/FileBrowser.js';
import * as GitAuth from './services/GitAuth.js';
import { setupWorkerChannel, registerLiveView } from '../../worker/client-channel.js';


// Initialize the application
document.addEventListener('DOMContentLoaded', async () => {

    // Initialize the service worker and worker channel
    setupWorkerChannel();

    // Create the FileBrowser instance
    const fileBrowser = new FileBrowser();

    // Register LiveView instance with the worker channel
    registerLiveView(fileBrowser.liveView);

    // Initialize GitHub authentication
    await GitAuth.initialize(fileBrowser);

    // Load data from storage
    fileBrowser.storageService.loadFromStorage(fileBrowser);

});
