// Service worker version of client-channel
// Shared constants and utilities without ES module exports
// This file is designed to be used with importScripts() in service-worker.js

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
const isDev = (self.location.origin === 'https://dev.codeit.codes');

// Key:value mapping of live view client IDs to codeit client IDs
const liveViewClients = {};

// Function to get the path type
function getPathType(path) {
    let pathType = 'external';

    Object.entries(INTERNAL_PATHS).forEach(type => {
        if (path.startsWith(type[1])) {
            pathType = type[0].replaceAll('_', '');
        }
    });

    return pathType;
}

// Worker log function
function workerLog(log) {
    workerChannel.postMessage({
        message: log,
        type: 'message'
    });
}

// Create response from data
function createResponse(data, type, status, cache) {
    let headers = {
        'Content-Type': type
    };

    if (!cache) headers['Cache-Control'] = 'public, max-age=0, must-revalidate';

    // create Response from data
    const response = new Response(data, {
        headers: headers,
        status: status
    });

    return response;
}

// Other shared functions can be added here as needed...