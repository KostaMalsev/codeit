/**
 * ContextMenu component for showing context menus
 */
class ContextMenu {
    constructor(fileBrowser) {
        this.fileBrowser = fileBrowser;

        // DOM elements
        this.element = document.querySelector('.context-menu');

        // State
        this.currentItem = null;

        // Setup event listeners
        this.setupEventListeners();
    }

    /**
     * Set up event listeners for the context menu
     */
    setupEventListeners() {
        // Hide context menu on click outside
        document.addEventListener('click', (e) => {
            if (!this.element.contains(e.target)) {
                this.hideMenu();
            }
        });

        // Hide context menu on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideMenu();
            }
        });
    }

    /**
     * Add context menu listener to an item
     * @param {Element} item - The item to add the listener to
     */
    addItemListener(item) {
        // Add context menu event listener
        if (this.fileBrowser.config.isMobile) {
            item.addEventListener('touchstart', (e) => {
                if (e.touches.length === 1) {
                    const touch = e.touches[0];

                    // Create a timer for long press
                    this.longPressTimer = setTimeout(() => {
                        this.showMenuForItem(item, touch.clientX, touch.clientY);
                    }, 500);
                }
            });

            item.addEventListener('touchend', () => {
                clearTimeout(this.longPressTimer);
            });

            item.addEventListener('touchmove', () => {
                clearTimeout(this.longPressTimer);
            });
        } else {
            item.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                this.showMenuForItem(item, e.clientX, e.clientY);
            });
        }
    }

    /**
     * Show the context menu for an item
     * @param {Element} item - The item to show the menu for
     * @param {number} x - The x coordinate
     * @param {number} y - The y coordinate
     */
    showMenuForItem(item, x, y) {
        this.currentItem = item;

        // Generate menu options based on item type
        let menuHtml = '';

        if (item.classList.contains('file')) {
            menuHtml = this.generateFileMenu(item);
        } else if (item.classList.contains('folder')) {
            menuHtml = this.generateFolderMenu(item);
        } else if (item.classList.contains('repo')) {
            menuHtml = this.generateRepoMenu(item);
        }

        // Set menu HTML
        this.element.innerHTML = menuHtml;

        // Show menu at position
        this.element.style.left = `${x}px`;
        this.element.style.top = `${y}px`;
        this.element.classList.add('visible');

        // Add click handlers to menu items
        this.addMenuItemHandlers();

        // Adjust position if out of viewport
        this.adjustMenuPosition();
    }

    /**
     * Generate menu HTML for a file
     * @param {Element} item - The file item
     * @returns {string} The menu HTML
     */
    generateFileMenu(item) {
        const fileSha = this.fileBrowser.utils.getAttr(item, 'sha');
        const isModified = this.fileBrowser.modifiedFiles[fileSha] &&
            !this.fileBrowser.modifiedFiles[fileSha].eclipsed;

        let html = '';

        // Common options
        html += `<div class="item" data-action="open">Open</div>`;

        // Modified file options
        if (isModified) {
            html += `<div class="item" data-action="push">Push changes</div>`;
            html += `<div class="item" data-action="revert">Revert changes</div>`;
        }

        // Copy options
        html += `<div class="item" data-action="copy-name">Copy name</div>`;
        html += `<div class="item" data-action="copy-path">Copy path</div>`;

        // Download option
        html += `<div class="item" data-action="download">Download</div>`;

        return html;
    }

    /**
   * Generate menu HTML for a folder
   * @param {Element} item - The folder item
   * @returns {string} The menu HTML
   */
    generateFolderMenu(item) {
        let html = '';

        // Common options
        html += `<div class="item" data-action="open">Open</div>`;

        // Copy options
        html += `<div class="item" data-action="copy-name">Copy name</div>`;
        html += `<div class="item" data-action="copy-path">Copy path</div>`;

        return html;
    }

    /**
     * Generate menu HTML for a repository
     * @param {Element} item - The repository item
     * @returns {string} The menu HTML
     */
    generateRepoMenu(item) {
        let html = '';

        // Common options
        html += `<div class="item" data-action="open">Open</div>`;

        // Copy options
        html += `<div class="item" data-action="copy-name">Copy name</div>`;
        html += `<div class="item" data-action="copy-url">Copy URL</div>`;

        // Check if repo is owned by logged user
        const fullName = this.fileBrowser.utils.getAttr(item, 'fullName') ||
            JSON.parse(decodeURI(this.fileBrowser.utils.getAttr(item, 'repoObj'))).fullName;

        const isOwnedByUser = fullName.split('/')[0] === this.fileBrowser.gitService.loggedUser;

        // Only show delete option for user's own repos
        if (isOwnedByUser) {
            html += `<div class="item danger" data-action="delete">Delete</div>`;
        }

        return html;
    }

    /**
     * Add click handlers to menu items
     */
    addMenuItemHandlers() {
        const menuItems = this.element.querySelectorAll('.item');

        menuItems.forEach(menuItem => {
            menuItem.addEventListener('click', () => {
                const action = menuItem.getAttribute('data-action');
                this.handleMenuAction(action);
            });
        });
    }

    /**
     * Handle a menu action
     * @param {string} action - The action to handle
     */
    handleMenuAction(action) {
        if (!this.currentItem) {
            this.hideMenu();
            return;
        }

        const item = this.currentItem;

        switch (action) {
            case 'open':
                // Simulate a click on the item
                item.click();
                break;

            case 'push':
                if (item.classList.contains('file')) {
                    // Simulate a click on the push button
                    const pushButton = item.querySelector('.push-wrapper');
                    if (pushButton) {
                        const clickEvent = new MouseEvent('click', {
                            bubbles: true,
                            cancelable: true,
                            view: window
                        });
                        pushButton.dispatchEvent(clickEvent);
                    }
                }
                break;

            case 'revert':
                if (item.classList.contains('file')) {
                    const fileSha = this.fileBrowser.utils.getAttr(item, 'sha');
                    if (this.fileBrowser.modifiedFiles[fileSha]) {
                        this.fileBrowser.fileExplorer.deleteModFileInHTML(item);
                    }
                }
                break;

            case 'copy-name':
                // Copy the item's name
                const name = item.querySelector('.name').textContent;
                this.fileBrowser.utils.copy(name).then(() => {
                    this.fileBrowser.notificationService.showMessage(`Copied ${name}!`);
                });
                break;

            case 'copy-path':
                // Copy the item's path
                let path = this.fileBrowser.treeLoc[2];
                if (path === '') path = '/';

                const itemName = item.querySelector('.name').textContent;
                const fullPath = path + (path.endsWith('/') ? '' : '/') + itemName;

                this.fileBrowser.utils.copy(fullPath).then(() => {
                    this.fileBrowser.notificationService.showMessage(`Copied ${fullPath}!`);
                });
                break;

            case 'copy-url':
                if (item.classList.contains('repo')) {
                    // Copy the repo URL
                    const fullName = this.fileBrowser.utils.getAttr(item, 'fullName') ||
                        JSON.parse(decodeURI(this.fileBrowser.utils.getAttr(item, 'repoObj'))).fullName;

                    const repoUrl = `https://github.com/${fullName}`;

                    this.fileBrowser.utils.copy(repoUrl).then(() => {
                        this.fileBrowser.notificationService.showMessage(`Copied ${repoUrl}!`);
                    });
                }
                break;

            case 'download':
                if (item.classList.contains('file')) {
                    this.downloadFile(item);
                }
                break;

            case 'delete':
                if (item.classList.contains('repo')) {
                    this.promptDeleteRepo(item);
                }
                break;

            default:
                console.warn('Unknown context menu action:', action);
        }

        this.hideMenu();
    }

    /**
     * Download a file
     * @param {Element} item - The file item
     */
    async downloadFile(item) {
        const fileName = item.querySelector('.name').textContent;
        const fileSha = this.fileBrowser.utils.getAttr(item, 'sha');

        let content;

        // If file is in modifiedFiles and not eclipsed, use that content
        if (this.fileBrowser.modifiedFiles[fileSha] &&
            !this.fileBrowser.modifiedFiles[fileSha].eclipsed) {
            content = this.fileBrowser.utils.decodeUnicode(
                this.fileBrowser.modifiedFiles[fileSha].content
            );
        } else {
            // Otherwise, fetch from GitHub
            const [user, repo, path] = this.fileBrowser.treeLoc;
            const fileResp = await this.fileBrowser.gitService.getFile(
                this.fileBrowser.treeLoc,
                fileName
            );

            if (fileResp.message) {
                this.fileBrowser.notificationService.showMessage(
                    `Error downloading file: ${fileResp.message}`,
                    5000
                );
                return;
            }

            content = this.fileBrowser.utils.decodeUnicode(fileResp.content);
        }

        // Create a download link
        const blob = new Blob([content], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();

        // Clean up
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 0);
    }

    /**
     * Prompt to delete a repository
     * @param {Element} item - The repository item
     */
    async promptDeleteRepo(item) {
        const fullName = this.fileBrowser.utils.getAttr(item, 'fullName') ||
            JSON.parse(decodeURI(this.fileBrowser.utils.getAttr(item, 'repoObj'))).fullName;

        const repoName = fullName.split('/')[1];

        const confirmed = await this.fileBrowser.dialog.show(
            null,
            `Are you sure you want to delete\n${repoName}?\nThis can't be undone.`,
            'Delete',
            true
        );

        if (confirmed) {
            this.deleteRepo(fullName, item);
        }
    }

    /**
     * Delete a repository
     * @param {string} fullName - The full repository name
     * @param {Element} item - The repository item
     */
    async deleteRepo(fullName, item) {
        try {
            // Show loading
            this.fileBrowser.startLoading();

            // Delete repository from GitHub
            const url = `${this.fileBrowser.gitService.apiUrl}/repos/${fullName}`;

            const response = await fetch(url, {
                method: 'DELETE',
                headers: {
                    'Authorization': `token ${this.fileBrowser.gitService.token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            if (!response.ok) {
                throw new Error(`GitHub API returned ${response.status}: ${response.statusText}`);
            }

            // Delete from modified repos
            this.fileBrowser.gitService.deleteModRepo(fullName);

            // Remove item from DOM
            item.remove();

            // Show success message
            this.fileBrowser.notificationService.showMessage(
                `Deleted ${fullName.split('/')[1]}`,
                3000
            );
        } catch (error) {
            console.error('Error deleting repository:', error);
            this.fileBrowser.notificationService.showMessage(
                `Error deleting repository: ${error.message}`,
                5000
            );
        } finally {
            // Stop loading
            this.fileBrowser.stopLoading();
        }
    }

    /**
     * Hide the context menu
     */
    hideMenu() {
        this.element.classList.remove('visible');
        this.currentItem = null;
    }

    /**
     * Adjust the menu position to keep it in the viewport
     */
    adjustMenuPosition() {
        const rect = this.element.getBoundingClientRect();

        // Check right edge
        if (rect.right > window.innerWidth) {
            this.element.style.left = `${window.innerWidth - rect.width - 10}px`;
        }

        // Check bottom edge
        if (rect.bottom > window.innerHeight) {
            this.element.style.top = `${window.innerHeight - rect.height - 10}px`;
        }
    }
}

export default ContextMenu;