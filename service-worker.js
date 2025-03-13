// File: /service-worker.js

// Configuration
const CACHE_VERSION = 'v1';
const CACHE_NAME = 'codeit-cache-' + CACHE_VERSION;
const CACHE_ENABLED = true;

// Import communication manager using importScripts
// This requires the file to be written in traditional non-module JavaScript
self.importScripts('/worker/worker-communication-manager.js');

// Files to cache
const FILES_TO_CACHE = [
    '/lib/codeit.js',
    '/lib/prism.js',
    '/lib/plugins/codeit-line-numbers.js',
    '/lib/plugins/codeit-match-braces.js',
    '/lib/plugins/codeit-autolinker.js',
    '/lib/plugins/codeit-autocomplete.js',
    '/full',
    '/full.css',
    '/worker/worker-communication-manager.js',
    '/worker/worker-client.js',
    '/worker/service-worker-registration.js',
    '/utils.js',
    '/manifest.js',
    '/files.js',
    '/links.js',
    '/repos.js',
    '/git/gitapi.js',
    '/codedrop.js',
    '/bottomfloat.js',
    '/context-menu.js',
    '/ide/src/components/LiveView/HTMLRenderer.js',
    '/ide/src/components/LiveView/MarkdownRenderer.js',
    '/ide/src/components/LiveView/BinaryRenderer.js',
    '/ide/src/components/LiveView/RequestHandler.js',
    '/ide/src/components/LiveView/EventHandler.js',
    '/live-view/extensions/draggable.js',
    '/live-view/extensions/beautifier.min.js',
    '/live-view/extensions/mobile-console/console-sheet.js',
    '/live-view/extensions/mobile-console/logger.js',
    '/live-view/extensions/mobile-console/safari-keyboard.js',
    '/live-view/extensions/markdown/marked.min.js',
    '/live-view/extensions/markdown/markdown-dark.css',
    '/editor-theme.css',
    '/fonts/fonts.css',
    '/fonts/Mono-Sans/MonoSans-Regular.woff2',
    '/fonts/Mono-Sans/MonoSans-Italic.woff2',
    '/fonts/Mono-Sans/MonoSans-Bold.woff2',
    '/fonts/Mono-Sans/MonoSans-BoldItalic.woff2',
    '/fonts/Inter/Inter-Regular.woff2',
    '/fonts/Inter/Inter-Italic.woff2',
    '/fonts/Inter/Inter-Medium.woff2',
    '/fonts/Inter/Inter-SemiBold.woff2',
    '/fonts/Inter/Inter-SemiBoldItalic.woff2',
    '/fonts/Inter/Inter-Bold.woff2',
    '/fonts/Roboto-Mono/RobotoMono-Regular.woff2',
    '/fonts/Roboto-Mono/RobotoMono-Italic.woff2',
    '/fonts/Roboto-Mono/RobotoMono-Bold.woff2',
    '/fonts/Roboto-Mono/RobotoMono-BoldItalic.woff2',
    'https://plausible.io/js/plausible.js',
    '/',
    '/icons/android-app-512.png',
    '/icons/iphone-app-180.png',
    '/icons/app-favicon.png',
    '/icons/mac-icon-512-padding.png'
];

// Cache resources function
async function cacheResources() {
    if (!CACHE_ENABLED) return;

    try {
        const cache = await caches.open(CACHE_NAME);

        // Cache files individually to prevent one failure from stopping all caching
        for (const file of FILES_TO_CACHE) {
            try {
                await cache.add(file);
                console.log(`Cached ${file}`);
            } catch (error) {
                console.warn(`Failed to cache ${file}: ${error.message}`);
                // Continue despite individual failures
            }
        }

        console.log('Caching complete');
    } catch (error) {
        console.error('Caching failed:', error);
    }
}

// Clean up old caches
async function deleteOldCaches() {
    const keyList = await caches.keys();
    return Promise.all(keyList.map((key) => {
        if (key !== CACHE_NAME && key.startsWith('codeit-cache-')) {
            console.log('Deleting old cache:', key);
            return caches.delete(key);
        }
    }));
}

// Service worker lifecycle events
self.addEventListener('install', (event) => {
    console.log('Service worker installing...');
    event.waitUntil(cacheResources());
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    console.log('Service Worker activated');
    event.waitUntil(
        Promise.all([
            deleteOldCaches(),
            self.clients.claim(),
            // Initialize communication manager
            (async () => {
                self.communicationManager = new self.CommunicationManager();
                console.log('Communication Manager initialized');
            })()
        ])
    );
});

// Fetch event handler
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // For API requests, use the communication manager
    if (url.pathname.startsWith('/api/') && self.communicationManager) {
        event.respondWith(
            self.communicationManager.handleFetchRequest(event.request, event.clientId)
        );
        return;
    }

    // For other requests, use cache-first strategy
    event.respondWith(
        caches.match(event.request)
            .then(cachedResponse => {
                if (cachedResponse) {
                    return cachedResponse;
                }

                return fetch(event.request)
                    .then(response => {
                        // Cache only successful GET requests
                        if (!response || response.status !== 200 || event.request.method !== 'GET') {
                            return response;
                        }

                        // Clone the response as it can only be read once
                        const responseToCache = response.clone();

                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            });

                        return response;
                    })
                    .catch(error => {
                        console.error('Fetch failed:', error);
                        // Return offline fallback for HTML requests
                        if (event.request.headers.get('Accept').includes('text/html')) {
                            return new Response(
                                '<html><body><h1>Offline</h1><p>You are currently offline.</p></body></html>',
                                { headers: { 'Content-Type': 'text/html' } }
                            );
                        }

                        // Let other errors propagate
                        throw error;
                    });
            })
    );
});

// Message handler for client communication
self.addEventListener('message', (event) => {
    // Handle cache control messages
    if (event.data && event.data.type === 'CACHE_CONTROL') {
        if (event.data.command === 'CLEAR') {
            caches.delete(CACHE_NAME);
        } else if (event.data.command === 'UPDATE') {
            cacheResources();
        }
        return;
    }

    // Delegate other messages to the communication manager
    if (self.communicationManager) {
        self.communicationManager.handleMessage(event);
    }
});