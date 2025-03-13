// File: /worker/worker-client.js
// Using traditional non-module syntax for better compatibility

// WorkerClient class for interacting with the service worker
var WorkerClient = (function () {

    // Constructor
    function WorkerClient(options) {
        options = options || {};

        this.options = {
            clientType: options.clientType || 'generic',
            metadata: options.metadata || {},
            debug: options.debug || false,
            autoReconnect: options.autoReconnect !== false,
            messageHandlers: options.messageHandlers || {}
        };

        this.clientId = null;
        this.isRegistered = false;
        this.messageQueue = [];
        this.serviceWorker = null;
        this.pingInterval = null;
        this.reconnectTimeout = null;

        // Bind methods
        this.handleMessage = this.handleMessage.bind(this);

        // Initialize
        this.init();
    }

    // Initialize the client
    WorkerClient.prototype.init = function () {
        try {
            // Check if the browser supports service workers
            if (!('serviceWorker' in navigator)) {
                throw new Error('Service Worker is not supported in this browser');
            }

            // Register event listener for messages
            navigator.serviceWorker.addEventListener('message', this.handleMessage);

            // Check if service worker is already active
            if (navigator.serviceWorker.controller) {
                this.serviceWorker = navigator.serviceWorker.controller;
                this.registerWithWorker();
            } else {
                // Wait for the service worker to be activated
                var self = this;
                navigator.serviceWorker.ready.then(function (registration) {
                    self.serviceWorker = registration.active;
                    self.registerWithWorker();
                });
            }

            this.log('WorkerClient initialized');
        } catch (error) {
            console.error('Failed to initialize WorkerClient:', error);
        }
    };

    // Register with the service worker
    WorkerClient.prototype.registerWithWorker = function () {
        if (!this.serviceWorker) {
            this.log('No active service worker found');
            return;
        }

        // Send registration message
        this.sendToWorker({
            type: 'CLIENT_REGISTER',
            clientType: this.options.clientType,
            metadata: this.options.metadata,
            timestamp: Date.now()
        });

        this.log('Registration request sent to service worker');
    };

    // Handle incoming messages from the service worker
    WorkerClient.prototype.handleMessage = function (event) {
        var message = event.data;

        switch (message.type) {
            case 'REGISTRATION_CONFIRMED':
                this.clientId = message.clientId;
                this.isRegistered = true;
                this.startPingInterval();

                // Process queued messages
                while (this.messageQueue.length > 0) {
                    var queuedMessage = this.messageQueue.shift();
                    this.sendToWorker(queuedMessage);
                }

                this.log('Registration confirmed. Client ID: ' + this.clientId);

                // Call the registration handler if provided
                if (this.options.messageHandlers.onRegistered) {
                    this.options.messageHandlers.onRegistered(message);
                }
                break;

            case 'PONG':
                // Calculate latency
                var latency = Date.now() - message.originalTimestamp;
                this.log('Pong received. Latency: ' + latency + 'ms');

                if (this.options.messageHandlers.onPong) {
                    this.options.messageHandlers.onPong(message, latency);
                }
                break;

            case 'BROADCAST':
                this.log('Broadcast message received:', message);

                if (this.options.messageHandlers.onBroadcast) {
                    this.options.messageHandlers.onBroadcast(message);
                }
                break;

            case 'DIRECT_MESSAGE':
                this.log('Direct message received:', message);

                if (this.options.messageHandlers.onDirectMessage) {
                    this.options.messageHandlers.onDirectMessage(message);
                }
                break;

            case 'PEER_UPDATE':
                this.log('Peer update received:', message);

                if (this.options.messageHandlers.onPeerUpdate) {
                    this.options.messageHandlers.onPeerUpdate(message);
                }
                break;

            default:
                // Handle custom message types
                if (this.options.messageHandlers.onCustomMessage) {
                    this.options.messageHandlers.onCustomMessage(message);
                }
        }
    };

    // Send a message to the service worker
    WorkerClient.prototype.sendToWorker = function (message) {
        if (!this.serviceWorker) {
            this.log('No service worker available');
            return false;
        }

        if (!this.isRegistered && message.type !== 'CLIENT_REGISTER') {
            // Queue messages until registered
            this.messageQueue.push(message);
            this.log('Message queued until registration completes');
            return false;
        }

        try {
            this.serviceWorker.postMessage(message);
            return true;
        } catch (error) {
            console.error('Failed to send message to service worker:', error);
            return false;
        }
    };

    // Send ping to service worker
    WorkerClient.prototype.ping = function () {
        return this.sendToWorker({
            type: 'PING',
            timestamp: Date.now()
        });
    };

    // Broadcast a message to all other clients
    WorkerClient.prototype.broadcast = function (payload) {
        return this.sendToWorker({
            type: 'BROADCAST',
            payload: payload,
            timestamp: Date.now()
        });
    };

    // Send a direct message to a specific client
    WorkerClient.prototype.sendDirectMessage = function (targetClientId, payload) {
        return this.sendToWorker({
            type: 'DIRECT_MESSAGE',
            targetClientId: targetClientId,
            payload: payload,
            timestamp: Date.now()
        });
    };

    // Update client metadata
    WorkerClient.prototype.updateMetadata = function (metadata) {
        // Merge new metadata with existing
        for (var key in metadata) {
            if (metadata.hasOwnProperty(key)) {
                this.options.metadata[key] = metadata[key];
            }
        }

        return this.sendToWorker({
            type: 'UPDATE_METADATA',
            metadata: metadata,
            timestamp: Date.now()
        });
    };

    // Start periodic ping interval
    WorkerClient.prototype.startPingInterval = function () {
        // Clear existing interval if any
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
        }

        // Start regular pings
        var self = this;
        this.pingInterval = setInterval(function () {
            self.ping();
        }, 30000); // Send ping every 30 seconds
    };

    // Disconnect from the service worker
    WorkerClient.prototype.disconnect = function () {
        // Stop ping interval
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
            this.pingInterval = null;
        }

        // Remove event listener
        navigator.serviceWorker.removeEventListener('message', this.handleMessage);

        // Notify worker
        if (this.isRegistered) {
            this.sendToWorker({
                type: 'CLIENT_DISCONNECT',
                timestamp: Date.now()
            });
        }

        this.isRegistered = false;
    };

    // Logging helper with debug mode check
    WorkerClient.prototype.log = function () {
        if (this.options.debug) {
            var args = Array.prototype.slice.call(arguments);
            args.unshift('[WorkerClient]');
            console.log.apply(console, args);
        }
    };

    return WorkerClient;
})();

// If this script is executed in Node.js environment (for tests)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { WorkerClient: WorkerClient };
}