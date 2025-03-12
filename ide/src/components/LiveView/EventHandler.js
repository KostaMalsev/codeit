/**
 * Event handler for LiveView component
 * Manages all event listeners and user interactions for the LiveView
 */
class EventHandler {
    /**
     * Create a new EventHandler instance
     * @param {LiveView} liveView - The parent LiveView component
     */
    constructor(liveView) {
        this.liveView = liveView;
        this.fileBrowser = liveView.fileBrowser;
        this.config = liveView.config;
        this.utils = liveView.utils;
    }

    /**
     * Initialize appropriate event listeners based on device type
     */
    initEventListeners() {
        if (this.config.isMobile) {
            this.initMobileEventListeners();
        } else {
            this.initDesktopEventListeners();
        }
    }

    /**
     * Initialize mobile-specific event listeners
     */
    initMobileEventListeners() {
        this.setupBottomSwipeHandler();
        this.setupMobileMenuHandlers();
    }

    /**
     * Initialize desktop-specific event listeners
     */
    initDesktopEventListeners() {
        const liveToggle = this.liveView.liveToggle;

        // Toggle arrow click handler
        liveToggle.querySelector('.arrow').addEventListener('click', () => {
            this.liveView.element.classList.toggle('visible');
            this.liveView.toggle(this.fileBrowser.selectedFile);
        });

        // Button handlers
        liveToggle.querySelector('.download').addEventListener('click', this.downloadSelectedFile.bind(this));
        liveToggle.querySelector('.share').addEventListener('click', this.shareOnDesktop.bind(this));
        liveToggle.querySelector('.popout').addEventListener('click', this.popoutToNewWindow.bind(this));

        // Keyboard shortcut (Ctrl/Cmd+R)
        document.addEventListener('keydown', this.handleKeyboardShortcuts.bind(this));
    }

    /**
     * Set up mobile menu handlers (share, console, etc.)
     */
    setupMobileMenuHandlers() {
        const liveButtonOptions = document.querySelector('.live-button-options');
        const liveViewMenu = document.querySelector('.live-view-menu');
        const liveMenuShare = document.querySelector('.live-menu-share');
        const liveMenuConsole = document.querySelector('.live-menu-console');

        // Options button click handler
        liveButtonOptions.addEventListener('click', () => {
            if (liveButtonOptions.classList.contains('options-visible')) {
                // Toggle options menu
                liveViewMenu.classList.toggle('visible');
                liveButtonOptions.classList.toggle('active');
            } else {
                // Share button clicked
                this.shareOnMobile();
            }
        });

        // Share menu item click handler
        liveMenuShare.addEventListener('click', this.shareOnMobile.bind(this));

        // Console menu item click handler
        liveMenuConsole.addEventListener('click', this.toggleConsole.bind(this));

        // Hide menu when clicking outside
        document.addEventListener('touchstart', (e) => {
            if (liveViewMenu.classList.contains('visible')) {
                if (e.target.parentElement !== liveViewMenu &&
                    e.target.parentElement.parentElement !== liveViewMenu &&
                    e.target !== liveButtonOptions) {
                    liveViewMenu.classList.remove('visible');
                    liveButtonOptions.classList.remove('active');
                }
            }
        });

        // Hide menu when clicking on it
        liveViewMenu.addEventListener('click', () => {
            liveViewMenu.classList.remove('visible');
            liveButtonOptions.classList.remove('active');
        });
    }

    /**
     * Toggle console visibility
     */
    toggleConsole() {
        const consoleSheet = this.fileBrowser.consoleSheet;

        if (!consoleSheet.isVisible()) {
            consoleSheet.show();
        } else {
            consoleSheet.hide();
        }
    }

    /**
     * Set up swipe handler for the bottom float (mobile)
     */
    setupBottomSwipeHandler() {
        const bottomWrapper = this.fileBrowser.bottomFloat.element;

        // Initialize Draggable
        bottomWrapper.Draggable = new Draggable(bottomWrapper);
        const draggable = bottomWrapper.Draggable;

        // Swipe handler
        draggable.on('swipe', (e) => {
            this.handleSwipeGesture(e, bottomWrapper);
        });

        // Click handler
        bottomWrapper.addEventListener('click', (e) => {
            this.handleBottomFloatClick(e, bottomWrapper);
        });
    }

    /**
     * Handle swipe gestures on the bottom float (mobile)
     * @param {Event} e - Swipe event
     * @param {HTMLElement} bottomWrapper - Bottom float element
     */
    handleSwipeGesture(e, bottomWrapper) {
        // If in media viewer mode, don't handle swipes
        if (bottomWrapper.classList.contains('file-open')) return;

        const isExpanded = bottomWrapper.classList.contains('expanded');

        if (e.direction === 'up' && !isExpanded) {
            // Swipe up - expand bottom float
            bottomWrapper.classList.add('expanded');

            // Open live view if it's closed
            if (!this.liveView.isToggled) {
                this.liveView.toggle(this.fileBrowser.selectedFile);
            }
        } else if (e.direction === 'down' && isExpanded) {
            // Swipe down - retract bottom float
            bottomWrapper.classList.remove('expanded');

            // Close live view if it's open
            if (this.liveView.isToggled) {
                this.liveView.toggle(this.fileBrowser.selectedFile);
            }
        }
    }

    /**
     * Handle clicks on the bottom float (mobile)
     * @param {Event} e - Click event
     * @param {HTMLElement} bottomWrapper - Bottom float element
     */
    handleBottomFloatClick(e, bottomWrapper) {
        const liveButtonOptions = document.querySelector('.live-button-options');
        const clickedOnOptions = (e.target === liveButtonOptions);
        const isExpanded = bottomWrapper.classList.contains('expanded');
        const consoleSheet = this.fileBrowser.consoleSheet;

        if (isExpanded && !clickedOnOptions) {
            // If expanded and not clicking options, retract the float
            bottomWrapper.classList.remove('expanded');

            // Close live view if open
            if (this.liveView.isToggled) {
                this.liveView.toggle(this.fileBrowser.selectedFile);
            }

            // Hide console if visible
            if (consoleSheet.isVisible()) {
                consoleSheet.hide();
            }
        } else if (!isExpanded && e.target === bottomWrapper) {
            // Handle text selection in non-expanded state
            this.handleBottomFloatTextSelection(e);
        }
    }

    /**
     * Handle text selection when clicking on the bottom float (mobile)
     * @param {Event} e - Click event
     */
    handleBottomFloatTextSelection(e) {
        const bottomWrapper = this.fileBrowser.bottomFloat.element;

        // Disable pointer events to get the underlying element
        bottomWrapper.style.pointerEvents = 'none';

        const pointX = e.clientX;
        const pointY = e.clientY;
        const range = document.caretRangeFromPoint(pointX, pointY);

        // Restore pointer events
        bottomWrapper.style.pointerEvents = '';

        // Select the text range if exists
        if (range) {
            e.preventDefault();

            const sel = window.getSelection();
            sel.setBaseAndExtent(
                range.startContainer,
                range.startOffset,
                range.endContainer,
                range.endOffset
            );
        }
    }

    /**
     * Handle keyboard shortcuts (Ctrl/Cmd+R)
     * @param {KeyboardEvent} e - Keyboard event
     */
    handleKeyboardShortcuts(e) {
        // Detect Ctrl/Cmd+R
        if ((e.key === 'r' || e.keyCode === 82) && this.utils.isKeyEventMeta(e)) {
            e.preventDefault();

            const selectedFile = this.fileBrowser.selectedFile;

            if (this.liveView.canRenderFile(selectedFile)) {
                // Toggle live view
                this.liveView.element.classList.toggle('visible');
                this.liveView.toggle(selectedFile);
            } else {
                // Show unsupported file message
                this.utils.showMessage('You can run HTML, Markdown and SVG.', 5000);
            }
        }
    }

    /**
     * Share live view link on mobile devices
     */
    shareOnMobile() {
        // Create a shareable link
        const link = this.createLink({
            dir: this.fileBrowser.treeLoc,
            file: this.fileBrowser.selectedFile
        });

        // Use Web Share API
        navigator.share({
            title: 'Run ' + this.fileBrowser.treeLoc[0] + '/' +
                this.fileBrowser.treeLoc[1].split(':')[0] + ' with Codeit',
            url: link,
        });
    }

    /**
     * Share live view link on desktop (copy to clipboard)
     */
    shareOnDesktop() {
        // Create a shareable link
        const link = this.createLink({
            dir: this.fileBrowser.selectedFile.dir.split(','),
            file: this.fileBrowser.selectedFile,
            openLive: (this.liveView.element.classList.contains('visible'))
        });

        // Copy to clipboard and show notification
        this.utils.copy(link).then(() => {
            const [user, repo] = this.fileBrowser.selectedFile.dir.split(',');
            const repoObj = this.fileBrowser.modifiedRepos[user + '/' + repo.split(':')[0]];

            if (!repoObj.private) {
                this.utils.showMessage('Copied link!');
            } else {
                this.utils.showMessage({
                    icon: this.fileBrowser.icons.lockIcon,
                    message: 'Copied private link!'
                });
            }
        });
    }

    /**
     * Create a link to the current file
     * @param {Object} options - Link options
     * @returns {string} The generated link
     */
    createLink(options) {
        return this.fileBrowser.utils.createLink(options);
    }

    /**
     * Open live view in a new window
     */
    popoutToNewWindow() {
        if (!this.config.isEmbed) {
            // Standard mode - open live view URL in new window
            const liveViewURL = this.liveView.livePath + '?' + this.fileBrowser.workerClientId + '/';
            window.open(liveViewURL, '_blank');

            // Clean up the inline view
            this.closeInlineLiveView();
        } else {
            // Embed mode - open with link
            const link = this.createLink({
                dir: this.fileBrowser.selectedFile.dir.split(','),
                file: this.fileBrowser.selectedFile,
                openLive: (this.liveView.element.classList.contains('visible'))
            });

            window.open(link, '_blank');
        }
    }

    /**
     * Close the inline live view after popping out
     */
    closeInlineLiveView() {
        // Toggle state
        this.liveView.isToggled = !this.liveView.isToggled;

        // Clear content
        this.liveView.element.innerHTML = '';

        // Show loader
        this.liveView.element.classList.remove('loaded');

        // Smoothly hide the view
        this.liveView.element.classList.add('notransition');
        this.liveView.element.classList.remove('visible');

        // Restore transition on next frame
        this.utils.onNextFrame(() => {
            this.liveView.element.classList.remove('notransition');
        });
    }

    /**
     * Download the currently selected file
     */
    async downloadSelectedFile() {
        const selectedFile = this.fileBrowser.selectedFile;
        const fileSizeText = this.fileBrowser.fileSizeText;

        // Check if file content is already available
        if (selectedFile.content &&
            this.utils.hashCode(selectedFile.content) !== this.utils.hashCode(fileSizeText)) {

            this.downloadFile(selectedFile.content, selectedFile.name);
        } else {
            // Fetch the file content
            this.utils.showMessage('Downloading...', -1);

            const resp = await this.fileBrowser.git.getBlob(
                this.fileBrowser.treeLoc,
                selectedFile.sha
            );

            this.utils.hideMessage();
            this.downloadFile(resp.content, selectedFile.name);
        }
    }

    /**
     * Trigger file download
     * @param {string} fileContent - Base64 encoded file content
     * @param {string} fileName - Name of the file
     */
    downloadFile(fileContent, fileName) {
        const a = document.createElement('a');

        a.href = 'data:application/octet-stream;base64,' + fileContent;
        a.target = '_blank';
        a.download = fileName;

        a.click();
        a.remove();
    }
}

export default EventHandler;