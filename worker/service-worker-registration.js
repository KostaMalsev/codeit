// File: /worker/service-worker-registration.js
// Using traditional non-module syntax for better compatibility

// Service Worker Registration class
var ServiceWorkerManager = (function () {

    // Constructor
    function ServiceWorkerManager(options) {
        options = options || {};

        this.options = {
            workerUrl: options.workerUrl || '/service-worker.js',
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

    // Register the service worker
    ServiceWorkerManager.prototype.register = function () {
        var self = this;

        if (!('serviceWorker' in navigator)) {
            var error = new Error('Service Workers are not supported in this browser');
            this.log('Registration error:', error);

            if (this.options.onError) {
                this.options.onError(error);
            }

            return Promise.reject(error);
        }

        return navigator.serviceWorker.register(
            this.options.workerUrl,
            { scope: this.options.scope }
        ).then(function (registration) {
            self.registration = registration;
            self.isRegistered = true;
            self.log('Service Worker registered:', registration);

            // Setup update handlers
            registration.addEventListener('updatefound', self.handleUpdate);

            if (self.options.onSuccess) {
                self.options.onSuccess(registration);
            }

            return registration;
        }).catch(function (error) {
            self.log('Registration error:', error);

            if (self.options.onError) {
                self.options.onError(error);
            }

            throw error;
        });
    };

    // Handle service worker updates
    ServiceWorkerManager.prototype.handleUpdate = function () {
        var self = this;
        var newWorker = this.registration.installing;

        newWorker.addEventListener('statechange', function () {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New service worker is available
                self.log('New Service Worker available');

                if (self.options.autoReload) {
                    // Show notification or auto-reload
                    if (confirm('New version available! Reload to update?')) {
                        window.location.reload();
                    }
                }
            }
        });
    };

    // Check for service worker updates
    ServiceWorkerManager.prototype.update = function () {
        var self = this;

        if (!this.registration) {
            this.log('No registration available to update');
            return Promise.resolve(false);
        }

        return this.registration.update()
            .then(function () {
                self.log('Service Worker update check triggered');
                return true;
            })
            .catch(function (error) {
                self.log('Update error:', error);
                return false;
            });
    };

    // Unregister the service worker
    ServiceWorkerManager.prototype.unregister = function () {
        var self = this;

        if (!this.registration) {
            this.log('No registration available to unregister');
            return Promise.resolve(false);
        }

        return this.registration.unregister()
            .then(function (result) {
                self.isRegistered = !result;
                self.log('Service Worker unregistered:', result);
                return result;
            })
            .catch(function (error) {
                self.log('Unregister error:', error);
                return false;
            });
    };

    // Logging helper with debug mode check
    ServiceWorkerManager.prototype.log = function () {
        if (this.options.debug) {
            var args = Array.prototype.slice.call(arguments);
            args.unshift('[ServiceWorkerManager]');
            console.log.apply(console, args);
        }
    };

    return ServiceWorkerManager;
})();

// If this script is executed in Node.js environment (for tests)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ServiceWorkerManager: ServiceWorkerManager };
}