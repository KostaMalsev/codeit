// Register and manage the service worker
class ServiceWorkerManager {
    constructor(options = {}) {
        this.options = {
            workerUrl: options.workerUrl || '../service-worker.js',
            scope: options.scope || '/',
            debug: options.debug || false,
            onSuccess: options.onSuccess || null,
            onError: options.onError || null,
            autoReload: options.autoReload !== false
        };

        this.registration = null;
        this.isRegistered = false;

        // Bind methods
        this.handleUpdate = this.handleUpdate.bind(this);
    }

    async register() {
        if (!('serviceWorker' in navigator)) {
            const error = new Error('Service Workers are not supported in this browser');
            this.log('Registration error:', error);

            if (this.options.onError) {
                this.options.onError(error);
            }

            return false;
        }

        try {
            this.registration = await navigator.serviceWorker.register(
                this.options.workerUrl,
                { scope: this.options.scope }
            );

            this.isRegistered = true;
            this.log('Service Worker registered:', this.registration);

            // Setup update handlers
            this.registration.addEventListener('updatefound', this.handleUpdate);

            if (this.options.onSuccess) {
                this.options.onSuccess(this.registration);
            }

            return true;
        } catch (error) {
            this.log('Registration error:', error);

            if (this.options.onError) {
                this.options.onError(error);
            }

            return false;
        }
    }

    handleUpdate() {
        const newWorker = this.registration.installing;

        newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New service worker is available
                this.log('New Service Worker available');

                if (this.options.autoReload) {
                    // Show notification or auto-reload
                    if (confirm('New version available! Reload to update?')) {
                        window.location.reload();
                    }
                }
            }
        });
    }

    async update() {
        if (!this.registration) {
            this.log('No registration available to update');
            return false;
        }

        try {
            await this.registration.update();
            this.log('Service Worker update check triggered');
            return true;
        } catch (error) {
            this.log('Update error:', error);
            return false;
        }
    }

    async unregister() {
        if (!this.registration) {
            this.log('No registration available to unregister');
            return false;
        }

        try {
            const result = await this.registration.unregister();
            this.isRegistered = !result;
            this.log('Service Worker unregistered:', result);
            return result;
        } catch (error) {
            this.log('Unregister error:', error);
            return false;
        }
    }

    log(...args) {
        if (this.options.debug) {
            console.log('[ServiceWorkerManager]', ...args);
        }
    }
}