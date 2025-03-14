// File: /ide/src/ide.js
import FileBrowser from './core/FileBrowser.js';
import * as GitAuth from './services/GitAuth.js';

// Initialize the application
document.addEventListener('DOMContentLoaded', async () => {
    // Load the worker scripts non-modularly
    await loadWorkerScripts();

    // Initialize the service worker
    const swManager = new window.ServiceWorkerManager({
        debug: true,
        onSuccess: (registration) => {
            console.log('Service Worker registration successful with scope:', registration.scope);
            // Initialize WorkerClient after service worker is registered
            initWorkerClient();
        },
        onError: (error) => {
            console.error('Service Worker registration failed:', error);
            // Continue with app initialization even if worker fails
            initApp();
        }
    });

    // Register the service worker
    swManager.register();
});

// Load the worker scripts that need to be non-modular
async function loadWorkerScripts() {
    return Promise.all([
        loadScript('/worker/service-worker-registration.js'),
        loadScript('/worker/worker-client.js')
    ]);
}

// Helper function to load a script
function loadScript(src) {
    return new Promise((resolve, reject) => {
        // Check if script is already loaded
        if (document.querySelector(`script[src="${src}"]`)) {
            resolve();
            return;
        }

        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

// Initialize the worker client
function initWorkerClient() {
    // Create a client instance with IDE-specific options
    const workerClient = new window.WorkerClient({
        clientType: 'ide',
        metadata: {
            pageId: generatePageId(),
            path: window.location.pathname,
            activeFile: null
        },
        debug: true,
        messageHandlers: {
            onRegistered: (message) => {
                console.log(`Connected to service worker with ID: ${message.clientId}`);
                // Once worker is registered, initialize the app
                initApp();
            },
            onBroadcast: (message) => {
                // Handle broadcasts from other tabs/windows
                handleBroadcastMessage(message);
            },
            onPeerUpdate: (message) => {
                console.log('Connected IDE instances:', message.peers.length);
                // Update UI if needed to show other connected instances
            }
        }
    });

    // Store client in global scope for application-wide access
    window.workerClient = workerClient;
}

// Initialize the main application
async function initApp() {
    // Create the FileBrowser instance
    const fileBrowser = new FileBrowser();

    // Make fileBrowser available globally
    window.fileBrowser = fileBrowser;

    // Register LiveView with the worker client if available
    if (window.workerClient && fileBrowser.liveView) {
        registerLiveView(fileBrowser.liveView);
    }

    // Initialize GitHub authentication
    await GitAuth.initialize(fileBrowser);

    // Load data from storage
    fileBrowser.storageService.loadFromStorage(fileBrowser);
}

// Register LiveView with the worker client
function registerLiveView(liveView) {
    if (!window.workerClient || !liveView) return;

    // Update worker metadata with liveView info
    window.workerClient.updateMetadata({
        hasLiveView: true
    });

    // Setup event listeners for LiveView events
    liveView.addEventListener('fileChange', (event) => {
        // Notify other tabs about file changes
        window.workerClient.broadcast({
            type: 'LIVE_VIEW_UPDATE',
            fileId: event.fileId,
            action: 'fileChanged'
        });
    });

    // Make LiveView accessible to worker client for message handling
    window.liveView = liveView;
}

// Handle broadcast messages from other tabs/windows
function handleBroadcastMessage(message) {
    if (!message.payload || !window.liveView) return;

    // Handle LiveView related broadcasts
    if (message.payload.type === 'LIVE_VIEW_UPDATE') {
        const { fileId, action } = message.payload;

        switch (action) {
            case 'fileChanged':
                // Refresh the preview if the same file is open
                if (window.liveView.currentFileId === fileId) {
                    window.liveView.refresh();
                }
                break;

            case 'previewRequest':
                // Someone is requesting a preview - could respond with data
                break;

            default:
                // Handle other LiveView message types
                break;
        }
    }
}

// Generate a unique page ID for this instance
function generatePageId() {
    return `ide_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}