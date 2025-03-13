// ==========================================
// CLIENT IMPLEMENTATION
// ==========================================

class WorkerClient {
    constructor(options = {}) {
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

    async init() {
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
                navigator.serviceWorker.ready.then(registration => {
                    this.serviceWorker = registration.active;
                    this.registerWithWorker();
                });
            }

            this.log('WorkerClient initialized');
        } catch (error) {
            console.error('Failed to initialize WorkerClient:', error);
        }
    }

    registerWithWorker() {
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
    }

    handleMessage(event) {
        const message = event.data;

        switch (message.type) {
            case 'REGISTRATION_CONFIRMED':
                this.clientId = message.clientId;
                this.isRegistered = true;
                this.startPingInterval();

                // Process queued messages
                while (this.messageQueue.length > 0) {
                    const queuedMessage = this.messageQueue.shift();
                    this.sendToWorker(queuedMessage);
                }

                this.log(`Registration confirmed. Client ID: ${this.clientId}`);

                // Call the registration handler if provided
                if (this.options.messageHandlers.onRegistered) {
                    this.options.messageHandlers.onRegistered(message);
                }
                break;

            case 'PONG':
                // Calculate latency
                const latency = Date.now() - message.originalTimestamp;
                this.log(`Pong received. Latency: ${latency}ms`);

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
    }

    sendToWorker(message) {
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
    }

    ping() {
        return this.sendToWorker({
            type: 'PING',
            timestamp: Date.now()
        });
    }

    broadcast(payload) {
        return this.sendToWorker({
            type: 'BROADCAST',
            payload,
            timestamp: Date.now()
        });
    }

    sendDirectMessage(targetClientId, payload) {
        return this.sendToWorker({
            type: 'DIRECT_MESSAGE',
            targetClientId,
            payload,
            timestamp: Date.now()
        });
    }

    updateMetadata(metadata) {
        this.options.metadata = { ...this.options.metadata, ...metadata };

        return this.sendToWorker({
            type: 'UPDATE_METADATA',
            metadata,
            timestamp: Date.now()
        });
    }

    startPingInterval() {
        // Clear existing interval if any
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
        }

        // Start regular pings
        this.pingInterval = setInterval(() => {
            this.ping();
        }, 30000); // Send ping every 30 seconds
    }

    disconnect() {
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
    }

    log(...args) {
        if (this.options.debug) {
            console.log('[WorkerClient]', ...args);
        }
    }
}