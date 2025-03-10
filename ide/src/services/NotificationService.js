/**
 * NotificationService for showing messages to the user
 */
class NotificationService {
    constructor(fileBrowser) {
        this.fileBrowser = fileBrowser;

        // Use UI for message element
        this.messageEl = fileBrowser.ui.messageEl;

        // State
        this.messageTimeout = null;

        // Shown messages tracking
        this.shownMessages = this.loadShownMessages();
    }

    /**
     * Load shown messages from storage
     * @returns {Object} The shown messages
     */
    loadShownMessages() {
        const shownMessages = this.fileBrowser.storageService.getItem('shownMessages');

        if (shownMessages) {
            try {
                return JSON.parse(shownMessages);
            } catch (e) {
                console.error('Error parsing shown messages:', e);
            }
        }

        return {};
    }

    /**
     * Save shown messages to storage
     */
    saveShownMessages() {
        this.fileBrowser.storageService.setItem('shownMessages', JSON.stringify(this.shownMessages));
    }

    /**
     * Show a message to the user
     * @param {string|Object} messageText - The message text or object
     * @param {number} duration - The duration in ms, -1 for indefinite
     */
    showMessage(messageText, duration = 3000) {
        this.fileBrowser.ui.showMessage(messageText, duration);
    }

    /**
     * Hide the current message
     */
    hideMessage() {
        this.fileBrowser.ui.hideMessage();
    }

    /**
     * Show the autosave message
     */
    showSaveMessage() {
        if (!this.shownMessages.save) this.shownMessages.save = 0;

        // If shown message less than two times
        if (this.shownMessages.save < 2) {
            // Show message
            this.showMessage({
                icon: '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M11.19 1.36l-7 3.11C3.47 4.79 3 5.51 3 6.3V11c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V6.3c0-.79-.47-1.51-1.19-1.83l-7-3.11c-.51-.23-1.11-.23-1.62 0zm-1.9 14.93L6.7 13.7c-.39-.39-.39-1.02 0-1.41.39-.39 1.02-.39 1.41 0L10 14.17l5.88-5.88c.39-.39 1.02-.39 1.41 0 .39.39.39 1.02 0 1.41l-6.59 6.59c-.38.39-1.02.39-1.41 0z" fill="currentColor"/></svg>',
                message: 'There\'s autosave'
            });

            // Bump counter
            this.shownMessages.save++;

            this.saveShownMessages();
        }
    }

    /**
     * Show the format message
     */
    showFormatSelectMessage() {
        if (!this.shownMessages.formatSelect) this.shownMessages.formatSelect = 0;

        // If shown message less than two times
        if (this.shownMessages.formatSelect < 2) {
            // Show format select message
            this.showMessage('Try selecting some code to format.', 4500);

            // Bump counter
            this.shownMessages.formatSelect++;

            this.saveShownMessages();
        }
    }
}

export default NotificationService;