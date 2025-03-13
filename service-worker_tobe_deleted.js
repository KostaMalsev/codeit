// update worker name when updating cached files
const WORKER_NAME = 'codeit-worker-v786'; // Incrementing version to ensure clean cache

// Import the non-module version of client-channel
self.importScripts('/worker/client-channel-sw.js');

// Now we can use isDev and other shared functions from client-channel-sw.js
let WORKER_CACHE_ENABLED = true;
if (isDev) {
  WORKER_CACHE_ENABLED = false;
}

// list of files to cache
const FILES_TO_CACHE = [
  '/lib/codeit.js',
  '/lib/prism.js',
  '/lib/plugins/codeit-line-numbers.js',
  '/lib/plugins/codeit-match-braces.js',
  '/lib/plugins/codeit-autolinker.js',
  '/lib/plugins/codeit-autocomplete.js',
  '/full',
  '/full.css',

  // Update worker-related files
  '/worker/client-channel-sw.js', // Add the new file

  '/utils.js',
  '/manifest.js',
  '/files.js',
  '/links.js',
  '/repos.js',
  '/git/gitapi.js',
  '/codedrop.js',
  '/bottomfloat.js',
  '/context-menu.js',

  // Add new LiveView component files if they need to be cached
  '/ide/src/components/LiveView/HTMLRenderer.js',
  '/ide/src//components/LiveView/MarkdownRenderer.js',
  '/ide/src//components/LiveView/BinaryRenderer.js',
  '/ide/src//components/LiveView/RequestHandler.js',
  '/ide/src//components/LiveView/EventHandler.js',

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

// More robust caching strategy
async function cacheResources() {
  if (!WORKER_CACHE_ENABLED) return;

  try {
    const cache = await caches.open(WORKER_NAME);

    // Use individual cache.add() calls instead of cache.addAll()
    // This prevents a single failure from aborting the entire operation
    for (const file of FILES_TO_CACHE) {
      try {
        await cache.add(file);
        if (enableDevLogs) {
          console.log(`Cached ${file}`);
        }
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

// remove previous cached data
caches.keys().then((keyList) => {
  return Promise.all(keyList.map((key) => {
    if (key !== WORKER_NAME || !WORKER_CACHE_ENABLED) {
      return caches.delete(key);
    }
  }));
});

self.addEventListener('install', (evt) => {
  console.log('Service worker installing...');
  // Start caching during installation
  evt.waitUntil(cacheResources());
  self.skipWaiting();
});

self.addEventListener('activate', (evt) => {
  console.log('Service worker activating...');
  self.clients.claim();
});

// Use the handleFetchRequest function from client-channel-sw.js
self.addEventListener('fetch', (evt) => {
  evt.respondWith(handleFetchRequest(evt.request, evt));
});