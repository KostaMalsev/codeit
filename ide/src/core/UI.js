// src/core/UI.js

/**
 * UI class to handle DOM references and common UI operations
 */
class UI {
    constructor() {
        this.initializeDOM();
    }

    /**
     * Initialize DOM references
     */
    initializeDOM() {
        // Main elements
        this.body = document.body;

        // Bottom elements
        this.bottomWrapper = document.querySelector('.bottom-wrapper');
        this.bottomFloat = this.bottomWrapper.querySelector('.bottom-float');
        this.sidebarOpen = this.bottomFloat.querySelector('.sidebar-open');
        this.floatLogo = this.sidebarOpen.querySelector('.logo');
        this.pushWrapper = this.bottomFloat.querySelector('.push-wrapper');
        this.floatDownload = this.bottomFloat.querySelector('.download');
        this.liveButtonOptions = this.bottomWrapper.querySelector('.live-button.options');

        // Sidebar elements
        this.sidebarToggle = document.querySelector('.sidebar-toggle');
        this.liveToggle = document.querySelector('.live-toggle');
        this.sidebar = document.querySelector('.sidebar');
        this.introWrapper = this.sidebar.querySelector('.intro-wrapper');
        this.contentWrapper = this.sidebar.querySelector('.content-wrapper');
        this.learnWrapper = this.sidebar.querySelector('.learn-wrapper');

        // Intro elements
        this.signInButton = this.introWrapper.querySelector('.sign-in');

        // Content elements
        this.loader = this.contentWrapper.querySelector('.loader');
        this.header = this.contentWrapper.querySelector('.header');
        this.titleScreen = this.header.querySelector('.title-screen');
        this.searchScreen = this.header.querySelector('.search-screen');
        this.sidebarTitle = this.titleScreen.querySelector('.title');
        this.sidebarLogo = this.sidebarTitle.querySelector('.logo');
        this.sidebarBranch = this.sidebarTitle.querySelector('.branch-icon');
        this.addButton = this.header.querySelector('.add');
        this.searchButton = this.titleScreen.querySelector('.search');
        this.searchBack = this.searchScreen.querySelector('.back');
        this.searchInput = this.searchScreen.querySelector('.search-input');
        this.searchClear = this.searchScreen.querySelector('.clear');
        this.fileWrapper = this.sidebar.querySelector('.files');

        // Learn elements
        this.versionEl = this.learnWrapper.querySelector('.version');
        this.logoutButton = this.learnWrapper.querySelector('.logout');
        this.learnAbout = this.learnWrapper.querySelector('.about');
        this.learnShare = this.learnWrapper.querySelector('.share');
        this.learnClose = this.learnWrapper.querySelector('.close');

        // Misc elements
        this.sidebarBackground = document.querySelector('.sidebar-background');
        this.branchMenu = document.querySelector('.branch-menu');
        this.liveViewMenu = document.querySelector('.live-view-menu');
        this.liveMenuShare = this.liveViewMenu.querySelector('.share');
        this.liveMenuConsole = this.liveViewMenu.querySelector('.console');
        this.dialogWrapper = document.querySelector('.dialog-wrapper');
        this.dialogTitle = this.dialogWrapper.querySelector('.title');
        this.dialogCancel = this.dialogWrapper.querySelector('.cancel');
        this.dialogConfirm = this.dialogWrapper.querySelector('.confirm');
        this.dialogBackground = this.dialogWrapper.querySelector('.dialog-background');
        this.messageEl = document.querySelector('.message');
        this.liveView = document.querySelector('.live-view');

        // Editor elements
        this.codeEditor = document.querySelector('.cd-wrapper cd-el');
    }

    /**
     * Shows or hides the loading indicator
     * @param {boolean} isLoading - Whether to show the loading indicator
     */
    showLoader(isLoading) {
        if (isLoading) {
            this.loader.style.opacity = '1';
        } else {
            this.loader.style.opacity = '0';
        }
    }

    /**
     * Shows a message to the user
     * @param {string|Object} message - The message to show
     * @param {number} duration - Duration to show the message
     */
    showMessage(message, duration = 3000) {
        // Clear any existing timeout
        if (this.messageTimeout) {
            clearTimeout(this.messageTimeout);
        }

        // Set message content
        if (typeof message === 'object') {
            this.messageEl.innerHTML = `
          <div class="icon">${message.icon}</div>
          <div class="text">${message.message}</div>
        `;
        } else {
            this.messageEl.innerHTML = `<div class="text">${message}</div>`;
        }

        // Show message
        this.messageEl.classList.add('visible');

        // Set timeout to hide message if duration > 0
        if (duration > 0) {
            this.messageTimeout = setTimeout(() => {
                this.hideMessage();
            }, duration);
        }
    }

    /**
     * Hides the current message
     */
    hideMessage() {
        this.messageEl.classList.remove('visible');
        if (this.messageTimeout) {
            clearTimeout(this.messageTimeout);
            this.messageTimeout = null;
        }
    }

    /**
     * Shows a dialog to the user
     * @param {Function} callback - Function to call when confirmed
     * @param {string} message - The dialog message
     * @param {string} buttonText - Text for the confirm button
     * @param {boolean} cancelable - Whether dialog is cancelable
     * @returns {Promise<boolean>} Whether dialog was confirmed
     */
    showDialog(callback, message, buttonText, cancelable = false) {
        return new Promise((resolve) => {
            // Set dialog properties
            this.dialogTitle.textContent = message;
            this.dialogConfirm.textContent = buttonText;

            // Set cancelable
            if (cancelable) {
                this.dialogWrapper.classList.add('cancelable');
            } else {
                this.dialogWrapper.classList.remove('cancelable');
            }

            // Store callback and resolver
            this.dialogCallback = callback;
            this.dialogResolver = resolve;

            // Show dialog
            this.dialogWrapper.classList.add('visible');

            // Set theme color on mobile
            if (this.config && this.config.isMobile) {
                document.querySelector('meta[name="theme-color"]').content = 'rgba(0, 0, 0, 0.5)';
            }
        });
    }

    /**
     * Hides the dialog
     */
    hideDialog() {
        this.dialogWrapper.classList.remove('visible');

        // Restore theme color on mobile
        if (this.config && this.config.isMobile) {
            if (this.body.classList.contains('expanded')) {
                document.querySelector('meta[name="theme-color"]').content = '#1a1c24';
            } else {
                document.querySelector('meta[name="theme-color"]').content = '#313744';
            }
        }
    }
}

export default UI;