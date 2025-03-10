/**
 * Dialog component for showing modals
 */
class Dialog {
    constructor(fileBrowser) {
        this.fileBrowser = fileBrowser;

        // Use UI references
        this.element = fileBrowser.ui.dialogWrapper;
        this.dialogTitle = fileBrowser.ui.dialogTitle;
        this.dialogButton = fileBrowser.ui.dialogConfirm;
        this.dialogCancel = fileBrowser.ui.dialogCancel;
        this.dialogBackground = fileBrowser.ui.dialogBackground;

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
        return this.fileBrowser.ui.showDialog(callback, message, buttonText, cancelable);
    }

    /**
     * Hide the dialog
     */
    hide() {
        this.fileBrowser.ui.hideDialog();
    }
}

export default Dialog;