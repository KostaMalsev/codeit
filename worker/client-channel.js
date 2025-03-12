// client-side
// service worker/client communication channel

// Internal paths used by both client and service worker
const INTERNAL_PATHS = {
  internal: 'https://codeit.codes/',
  internal_: 'https://dev.codeit.codes/',

  run: 'https://codeit.codes/run',
  run_: 'https://dev.codeit.codes/run',

  relLivePath: ('/run/' + '_/'.repeat(15)),

  clientId: 'https://codeit.codes/worker/getClientId',
  clientId_: 'https://dev.codeit.codes/worker/getClientId',
};

// Browser detection
const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
const isDev = (window.location.origin === 'https://dev.codeit.codes');

let workerChannel;
let workerInstallPromise;
let workerClientId;

// Reference to the LiveView instance
let liveViewInstance = null;

/**
 * Register a LiveView instance for worker communication
 * @param {Object} liveView - The LiveView instance
 */
function registerLiveView(liveView) {
  liveViewInstance = liveView;

  // Optionally, provide the LiveView with access to constants
  if (liveView) {
    liveView.internalPaths = INTERNAL_PATHS;
    liveView.isSafari = isSafari;
    liveView.isDev = isDev;
  }
}

// setup worker channel
async function setupWorkerChannel() {
  try {
    // Register service worker
    const registration = await navigator.serviceWorker.register('/service-worker.js');
    console.log('Service Worker registered with scope:', registration.scope);

    // Wait for the service worker to be activated
    if (registration.installing) {
      console.log('Service worker installing');
      await waitForServiceWorkerActivation(registration.installing);
    } else if (registration.waiting) {
      console.log('Service worker installed but waiting');
      await waitForServiceWorkerActivation(registration.waiting);
    } else if (registration.active) {
      console.log('Service worker active');
    }

    // Create worker channel
    workerChannel = new BroadcastChannel('worker-channel');

    // Get client ID from worker
    workerClientId = await getClientIdFromWorker();

    if (!workerClientId) {
      console.warn('Failed to get client ID from worker, generating fallback ID');
      workerClientId = generateClientId();
    }

    // Set up message listener
    setupMessageListener();

    // Log success
    console.log('Service worker setup complete with client ID:', workerClientId);
    window.fileBrowser.workerClientId = workerClientId;

    // Setup additional event listeners
    setupAdditionalListeners();

    return workerClientId;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    return null;
  }
}

// Wait for service worker to activate
function waitForServiceWorkerActivation(serviceWorker) {
  return new Promise((resolve) => {
    if (serviceWorker.state === 'activated') {
      resolve();
      return;
    }

    serviceWorker.addEventListener('statechange', (e) => {
      if (e.target.state === 'activated') {
        resolve();
      }
    });
  });
}

// Get client ID from worker
async function getClientIdFromWorker() {
  let numOfRequests = 0;
  const maxRequests = 3;

  async function pingWorker() {
    try {
      // Get client ID from worker
      let resp = await axios.get('/worker/getClientId', '', true);

      try {
        if (typeof resp === 'string') {
          resp = JSON.parse(resp);
        }
      } catch (e) {
        console.log('%c[Client] Failed to parse worker response', 'color: #80868b');
      }

      if (resp && resp.clientId) {
        return resp.clientId;
      }

      console.log('%c[Client] Pinged ServiceWorker for installation', 'color: #80868b');

      if (numOfRequests < maxRequests) {
        numOfRequests++;
        // Wait a bit before trying again
        await new Promise(resolve => setTimeout(resolve, 500));
        return await pingWorker();
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error getting client ID from worker:', error);

      if (numOfRequests < maxRequests) {
        numOfRequests++;
        // Wait a bit before trying again
        await new Promise(resolve => setTimeout(resolve, 500));
        return await pingWorker();
      } else {
        return null;
      }
    }
  }

  return await pingWorker();
}

// Generate a fallback client ID
function generateClientId() {
  return 'client-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
}

// Set up message listener
function setupMessageListener() {
  workerChannel.addEventListener('message', async (event) => {
    // If message is for current client
    if (event.data.toClient === workerClientId) {
      // If received request
      if (event.data.type === 'request') {
        handleServiceWorkerRequest(event.data);
      } else if (event.data.type === 'reload') { // If received reload request
        // Reload page
        window.location.reload();
      } else if (event.data.type === 'message') { // If received message
        // Log message
        console.debug(event.data.message);
      }
    }
  });
}

// Handle service worker requests
async function handleServiceWorkerRequest(data) {
  try {
    // Check if LiveView instance exists
    if (!liveViewInstance) {
      console.error('LiveView instance not registered. Use registerLiveView() first.');
      throw new Error('LiveView instance not registered');
    }

    // Call handleLiveViewRequest on the LiveView instance
    const { fileContent, respStatus } =
      await liveViewInstance.handleLiveViewRequest(data.url);

    // Send response back to worker
    workerChannel.postMessage({
      url: data.url,
      resp: fileContent,
      respStatus: (respStatus ?? 200),
      fromClient: workerClientId,
      type: 'response'
    });
  } catch (error) {
    console.error('Error handling live view request:', error);

    // Send error response back to worker
    workerChannel.postMessage({
      url: data.url,
      resp: '',
      respStatus: 500,
      fromClient: workerClientId,
      type: 'response'
    });
  }
}

// Setup additional event listeners
function setupAdditionalListeners() {
  window.addEventListener('load', () => {
    if (getStorage('workerDevLogs')) {
      workerChannel.postMessage({
        type: 'enableDevLogs'
      });
    }

    if (window.location.hostname === 'dev.codeit.codes') {
      workerChannel.postMessage({
        type: 'updateWorker'
      });
    }
  });
}

// Enable service worker logs
function enableWorkerLogs() {
  setStorage('workerDevLogs', 'true');
  window.location.reload();
}

// Simple axios implementation
try {
  axios = axios;
} catch (e) {
  window.axios = null;
}

axios = {
  'get': (url, token, noParse) => {
    return new Promise((resolve, reject) => {
      try {
        var xmlhttp = new XMLHttpRequest();
        xmlhttp.onreadystatechange = function () {
          if (this.readyState == 4 && String(this.status).startsWith('2')) {
            try {
              if (!noParse) {
                resolve(JSON.parse(this.responseText));
              } else {
                resolve(this.responseText);
              }
            } catch (e) {
              resolve();
            }
          } else if (this.responseText) {
            try {
              if (!noParse) {
                resolve(JSON.parse(this.responseText));
              } else {
                resolve(this.responseText);
              }
            } catch (e) { }
          }
        };
        xmlhttp.onerror = function () {
          if (this.responseText) {
            try {
              if (!noParse) {
                resolve(JSON.parse(this.responseText));
              } else {
                resolve(this.responseText);
              }
            } catch (e) { }
          }
        };

        xmlhttp.open('GET', url, true);
        xmlhttp.send();
      } catch (e) { reject(e) }
    });
  }
};

// Export functions and variables for ES modules
export {
  setupWorkerChannel,
  registerLiveView,
  workerClientId,
  workerInstallPromise,
  INTERNAL_PATHS,
  isSafari,
  isDev
};

// Initialize if this script is loaded directly via script tag
if (typeof module === 'undefined' && !window.isModuleScript) {
  setupWorkerChannel();
}