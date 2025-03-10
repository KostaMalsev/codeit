/**
 * Centralized event management for the FileBrowser application
 */
class EventManager {
    constructor() {
        this.events = {};
        this.asyncThreadTimers = {};
    }

    /**
     * Subscribe to an event
     * @param {string} event - The event name
     * @param {Function} callback - The callback function
     * @returns {Object} An object with an unsubscribe method
     */
    on(event, callback) {
        if (!this.events[event]) {
            this.events[event] = [];
        }

        this.events[event].push(callback);

        return {
            unsubscribe: () => {
                this.events[event] = this.events[event].filter(cb => cb !== callback);
            }
        };
    }

    /**
     * Emit an event
     * @param {string} event - The event name
     * @param {*} data - The event data
     */
    emit(event, data) {
        if (!this.events[event]) {
            return;
        }

        this.events[event].forEach(callback => {
            callback(data);
        });
    }

    /**
     * Run a function in an async thread with debouncing
     * @param {Function} fn - The function to run
     * @param {number} delay - The debounce delay in ms
     * @param {string} id - Optional identifier for the thread
     */
    asyncThread(fn, delay = 300, id = 'default') {
        // Clear existing timer
        if (this.asyncThreadTimers[id]) {
            clearTimeout(this.asyncThreadTimers[id]);
        }

        // Create new timer
        this.asyncThreadTimers[id] = setTimeout(() => {
            fn();
            delete this.asyncThreadTimers[id];
        }, delay);
    }

    /**
     * Add global keyboard event listeners
     * @param {FileBrowser} fileBrowser - The FileBrowser instance
     */
    setupGlobalKeyboardListeners(fileBrowser) {
        document.addEventListener('keydown', (e) => {
            // Handle Ctrl/Cmd + S (save)
            if ((e.key === 's' || e.keyCode === 83) && fileBrowser.utils.isKeyEventMeta(e) && !e.altKey) {
                e.preventDefault();
                fileBrowser.notificationService.showSaveMessage();
            }

            // Handle Ctrl/Cmd + D (format)
            if ((e.key === 'd' || e.keyCode === 68) && fileBrowser.utils.isKeyEventMeta(e)) {
                e.preventDefault();
                fileBrowser.formatService.formatSelectedCode();
            }

            // Handle other keyboard shortcuts
            if ((((e.key === 'b' || e.keyCode === 66) || (e.key === 'p' || e.keyCode === 80)) &&
                fileBrowser.utils.isKeyEventMeta(e)) ||
                ((e.key === 'f' || e.keyCode === 70) && e.shiftKey && e.altKey)) {

                if (fileBrowser.utils.isKeyEventMeta(e)) {
                    e.preventDefault();
                }

                if (document.activeElement === fileBrowser.editor.element) {
                    const shortcutKey = fileBrowser.config.isMac ? '⌘ + D' : 'Ctrl + D';
                    fileBrowser.notificationService.showMessage(`Try formatting with ${shortcutKey}`, 5000);
                }
            }
        });
    }
}

export default EventManager;