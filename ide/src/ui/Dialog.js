/**
 * Dialog component for showing modals
 */
class Dialog {
    constructor(fileBrowser) {
        this.fileBrowser = fileBrowser;

        // DOM elements
        this.element = document.querySelector('.dialog');
        this.dialogBack = document.querySelector('.dialog-back');
        this.dialogContent = document.querySelector('.dialog-content');
        this.dialogMessage = document.querySelector('.dialog-message');
        this.dialogButton = document.querySelector('.dialog-button');
        this.dialogCancel = document.querySelector('.dialog-cancel');

        // State
        this.dialogResolve = null;
        this.dialogCallback = null;

        // Setup event listeners
        this.setupEventListeners();
    }

    /**
     * Set up event listeners for the dialog
     */
    setupEventListeners() {
        // Confirm dialog
        this.dialogButton.addEventListener('click', () => {
            if (this.dialogCallback) {
                this.dialogCallback();
            } else {
                this.hide();

                if (this.dialogResolve) {
                    this.dialogResolve(true);
                    this.dialogResolve = null;
                }
            }
        });

        // Cancel dialog
        this.dialogCancel.addEventListener('click', () => {
            this.hide();

            if (this.dialogResolve) {
                this.dialogResolve(false);
                this.dialogResolve = null;
            }
        });

        // Cancel dialog on background click
        this.dialogBack.addEventListener('click', () => {
            if (this.element.classList.contains('cancelable')) {
                this.hide();

                if (this.dialogResolve) {
                    this.dialogResolve(false);
                    this.dialogResolve = null;
                }
            }
        });
    }

    /**
     * Show a dialog
     * @param {Function} callback - The callback to call when confirmed
     * @param {string} message - The dialog message
     * @param {string} buttonText - The button text
     * @param {boolean} cancelable - Whether the dialog can be canceled
     * @returns {Promise<boolean>} Whether the dialog was confirmed
     */
    show(callback, message, buttonText, cancelable = false) {
        return new Promise(resolve => {
            // Set dialog properties
            this.dialogMessage.textContent = message;
            this.dialogButton.textContent = buttonText;

            // Set callback and resolve function
            this.dialogCallback = callback;
            this.dialogResolve = resolve;

            // Show/hide cancel button based on cancelable
            if (cancelable) {
                this.element.classList.add('cancelable');
            } else {
                this.element.classList.remove('cancelable');
            }

            // Show dialog
            this.element.classList.add('visible');
            this.dialogBack.classList.add('visible');

            // If on mobile, change status bar color
            if (this.fileBrowser.config.isMobile) {
                document.querySelector('meta[name="theme-color"]').content = 'rgba(0, 0, 0, 0.5)';
            }
        });
    }

    /**
     * Hide the dialog
     */
    hide() {
        this.element.classList.remove('visible');
        this.dialogBack.classList.remove('visible');

        // If on mobile, restore status bar color
        if (this.fileBrowser.config.isMobile) {
            if (document.body.classList.contains('expanded')) {
                document.querySelector('meta[name="theme-color"]').content = '#1a1c24';
            } else {
                document.querySelector('meta[name="theme-color"]').content = '#313744';
            }
        }
    }
}

export default Dialog;