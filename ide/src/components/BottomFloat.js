/**
 * BottomFloat component for mobile controls
 */
class BottomFloat {
    constructor(fileBrowser) {
        this.fileBrowser = fileBrowser;

        // DOM elements
        this.element = document.querySelector('.bottom-float');
        this.pushButton = this.element.querySelector('.push-button');

        // State
        this.lastScrollTop = 0;

        // Setup event listeners
        this.setupEventListeners();
    }

    /**
     * Set up event listeners for the bottom float
     */
    setupEventListeners() {
        // Handle push button click
        this.pushButton.addEventListener('click', () => {
            this.handlePushButtonClick();
        });

        // Hide bottom float when scrolling down
        this.fileBrowser.editor.element.addEventListener('scroll', () => {
            this.handleEditorScroll();
        });
    }

    /**
     * Handle push button click
     */
    async handlePushButtonClick() {
        // Check if push is allowed
        const dialogResp = await this.fileBrowser.gitService.checkPushDialogs();

        if (dialogResp === 'return') return;

        // Get the selected file element
        const selectedEl = this.fileBrowser.fileExplorer.element.querySelector(
            `.item[sha="${this.fileBrowser.selectedFile.sha}"]`
        );

        if (!selectedEl) return;

        // Generate commit message
        const commitMessage = 'Update ' + this.fileBrowser.selectedFile.name;

        // Play push animation
        this.fileBrowser.fileExplorer.playPushAnimation(this.pushButton);

        // Push file
        await this.fileBrowser.fileExplorer.pushFileFromExplorer(selectedEl, commitMessage);

        // Update UI
        this.element.classList.remove('modified');
    }

    /**
     * Handle editor scroll to show/hide bottom float
     */
    handleEditorScroll() {
        const st = this.fileBrowser.editor.element.scrollTop;

        // If scrolling down
        if (st > this.lastScrollTop) {
            this.element.classList.add('hidden');
        } else {
            this.element.classList.remove('hidden');
        }

        // Update last scroll position
        this.lastScrollTop = st;
    }

    /**
     * Update the bottom float's state
     */
    updateFloat() {
        // Reset hidden state
        this.element.classList.remove('hidden');

        // If a file is open, show appropriate controls
        if (this.fileBrowser.selectedFile.sha) {
            this.element.classList.add('file-open');

            // If file is modified, show modified state
            if (this.fileBrowser.modifiedFiles[this.fileBrowser.selectedFile.sha] &&
                !this.fileBrowser.modifiedFiles[this.fileBrowser.selectedFile.sha].eclipsed) {
                this.element.classList.add('modified');
            } else {
                this.element.classList.remove('modified');
            }
        } else {
            this.element.classList.remove('file-open');
        }
    }
}

export default BottomFloat;