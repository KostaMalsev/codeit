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
  // register service worker
  workerInstallPromise = navigator.serviceWorker.register('/service-worker.js');
  await workerInstallPromise;

  let numOfRequests = 0;
  async function pingWorkerForClientId() {
    // get client ID from worker
    let resp = await axios.get('/worker/getClientId', '', true);

    try {
      resp = JSON.parse(resp);
    } catch (e) {
      resp = '';
      console.log('%c[Client] Pinged ServiceWorker for installation', 'color: #80868b');
    }

    if (numOfRequests < 3) { //100 TBD@@
      if (!resp || !resp.clientId) {
        numOfRequests++;
        return await pingWorkerForClientId();
      } else {
        return resp.clientId;
      }
    } else {
      return null;
    }
  }

  // ping worker for client ID
  workerInstallPromise = pingWorkerForClientId();
  workerClientId = await workerInstallPromise;
  workerInstallPromise = null;

  // create worker channel
  workerChannel = new BroadcastChannel('worker-channel');

  // add worker channel listener
  workerChannel.addEventListener('message', async (event) => {
    // if message is for current client
    if (event.data.toClient === workerClientId) {
      // if received request
      if (event.data.type === 'request') {
        try {
          // Check if LiveView instance exists
          if (!liveViewInstance) {
            console.error('LiveView instance not registered. Use registerLiveView() first.');
            throw new Error('LiveView instance not registered');
          }

          // Call handleLiveViewRequest on the LiveView instance
          const { fileContent, respStatus } =
            await liveViewInstance.handleLiveViewRequest(event.data.url);

          // send response back to worker
          workerChannel.postMessage({
            url: event.data.url,
            resp: fileContent,
            respStatus: (respStatus ?? 200),
            fromClient: workerClientId,
            type: 'response'
          });
        } catch (error) {
          console.error('Error handling live view request:', error);

          // Send error response back to worker
          workerChannel.postMessage({
            url: event.data.url,
            resp: '',
            respStatus: 500,
            fromClient: workerClientId,
            type: 'response'
          });
        }
      } else if (event.data.type === 'reload') { // if received reload request
        // reload page
        window.location.reload();
      } else if (event.data.type === 'message') { // if received message
        // log message
        console.debug(event.data.message);
      }
    }
  });

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

// enable service worker logs
function enableWorkerLogs() {
  setStorage('workerDevLogs', 'true');
  window.location.reload();
}

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