// Communication Manager for the Service Worker
class CommunicationManager {
    constructor() {
        this.clients = new Map(); // Store client IDs and their metadata
        this.initCleanupInterval();
    }

    // Handle incoming messages from clients
    handleMessage(event) {
        const clientId = event.source.id;
        const message = event.data;

        if (message.type === 'CLIENT_REGISTER') {
            this.registerClient(event.source, message);
        }
        else {
            this.processClientMessage(clientId, message);
        }
    }

    // Register a new client
    registerClient(clientSource, message) {
        const clientId = clientSource.id;

        // Store client information
        this.clients.set(clientId, {
            id: clientId,
            url: clientSource.url,
            type: message.clientType || 'unknown',
            lastActive: Date.now(),
            metadata: message.metadata || {}
        });

        // Confirm registration to client
        clientSource.postMessage({
            type: 'REGISTRATION_CONFIRMED',
            clientId: clientId,
            timestamp: Date.now()
        });

        console.log(`Client registered: ${clientId} (${message.clientType})`);

        // Notify other clients about new connection
        this.notifyClientsAboutPeers();
    }

    // Process incoming client messages by type
    processClientMessage(clientId, message) {
        const client = this.clients.get(clientId);

        // Update last active timestamp
        if (client) {
            client.lastActive = Date.now();
        }

        switch (message.type) {
            case 'PING':
                this.sendMessageToClient(clientId, {
                    type: 'PONG',
                    timestamp: Date.now(),
                    originalTimestamp: message.timestamp
                });
                break;

            case 'BROADCAST':
                this.broadcastMessage(clientId, message.payload);
                break;

            case 'DIRECT_MESSAGE':
                if (message.targetClientId) {
                    this.sendMessageToClient(message.targetClientId, {
                        type: 'DIRECT_MESSAGE',
                        from: clientId,
                        payload: message.payload,
                        timestamp: Date.now()
                    });
                }
                break;

            case 'UPDATE_METADATA':
                if (client) {
                    client.metadata = { ...client.metadata, ...message.metadata };
                }
                break;

            case 'CLIENT_DISCONNECT':
                this.clients.delete(clientId);
                this.notifyClientsAboutPeers();
                console.log(`Client disconnected: ${clientId}`);
                break;
        }
    }

    // Handle intercepted fetch requests
    async handleFetchRequest(request, clientId) {
        const client = this.clients.get(clientId);

        // Clone the request to avoid consuming it
        const modifiedRequest = new Request(request.clone());

        // Add client info to headers
        const headers = new Headers(modifiedRequest.headers);
        headers.append('X-Client-ID', clientId || 'unknown');

        if (client) {
            headers.append('X-Client-Type', client.type);
            headers.append('X-Client-Last-Active', client.lastActive.toString());

            // Include relevant metadata if needed
            if (client.metadata && client.metadata.userRole) {
                headers.append('X-User-Role', client.metadata.userRole);
            }
        }

        // Create new request with the modified headers
        const enhancedRequest = new Request(modifiedRequest, {
            method: modifiedRequest.method,
            headers: headers,
            body: modifiedRequest.body,
            mode: modifiedRequest.mode,
            credentials: modifiedRequest.credentials,
            cache: modifiedRequest.cache,
            redirect: modifiedRequest.redirect,
            referrer: modifiedRequest.referrer,
            integrity: modifiedRequest.integrity
        });

        try {
            // Fetch with the enhanced request
            const response = await fetch(enhancedRequest);

            console.log(`Request intercepted for client ${clientId}`, {
                url: new URL(request.url).pathname,
                client: client ? client.type : 'Unknown client'
            });

            return response;
        } catch (error) {
            console.error(`Error handling request for client ${clientId}:`, error);
            return new Response(JSON.stringify({
                error: 'Service worker error processing request',
                clientId: clientId
            }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }
    }

    // Send message to a specific client
    async sendMessageToClient(clientId, message) {
        try {
            const allClients = await self.clients.matchAll();
            const targetClient = allClients.find(client => client.id === clientId);

            if (targetClient) {
                targetClient.postMessage(message);
                return true;
            }
            return false;
        } catch (error) {
            console.error(`Error sending message to client ${clientId}:`, error);
            return false;
        }
    }

    // Broadcast message to all clients except sender
    async broadcastMessage(senderId, message) {
        try {
            const allClients = await self.clients.matchAll();

            allClients.forEach(client => {
                if (client.id !== senderId) {
                    client.postMessage({
                        type: 'BROADCAST',
                        from: senderId,
                        payload: message,
                        timestamp: Date.now()
                    });
                }
            });

            return true;
        } catch (error) {
            console.error('Error broadcasting message:', error);
            return false;
        }
    }

    // Notify all clients about connected peers
    async notifyClientsAboutPeers() {
        try {
            const allClients = await self.clients.matchAll();
            const clientList = Array.from(this.clients.values()).map(client => ({
                id: client.id,
                type: client.type,
                lastActive: client.lastActive
            }));

            allClients.forEach(client => {
                client.postMessage({
                    type: 'PEER_UPDATE',
                    peers: clientList.filter(c => c.id !== client.id),
                    timestamp: Date.now()
                });
            });
        } catch (error) {
            console.error('Error notifying clients about peers:', error);
        }
    }

    // Initialize periodic cleanup of disconnected clients
    initCleanupInterval() {
        setInterval(async () => {
            const TIMEOUT = 5 * 60 * 1000; // 5 minutes
            const now = Date.now();

            // Check all registered clients
            for (const [clientId, clientData] of this.clients.entries()) {
                if (now - clientData.lastActive > TIMEOUT) {
                    try {
                        // Verify if client is still connected
                        const allClients = await self.clients.matchAll();
                        const clientExists = allClients.some(client => client.id === clientId);

                        if (!clientExists) {
                            console.log(`Client ${clientId} timed out, removing from registry`);
                            this.clients.delete(clientId);
                        }
                    } catch (error) {
                        console.error(`Error checking client ${clientId} status:`, error);
                    }
                }
            }
        }, 60000); // Run every minute
    }
}

// Make the CommunicationManager available to the service worker
self.CommunicationManager = CommunicationManager;