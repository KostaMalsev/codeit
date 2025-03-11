import Config from './Config.js';
import Utils from './Utils.js';
import EventManager from './EventManager.js';

// Import services
import GitService from '../services/GitService.js';
import StorageService from '../services/StorageService.js';
import NotificationService from '../services/NotificationService.js';
import FormatService from '../services/FormatService.js';

// Import components
import Sidebar from '../components/Sidebar.js';
import FileExplorer from '../components/FileExplorer.js';
import BranchManager from '../components/BranchManager.js';
import Editor from '../components/Editor.js';
import LiveView from '../components/LiveView.js';
import BottomFloat from '../components/BottomFloat.js';

// Import UI components
import UI from './UI.js';
import Dialog from '../ui/Dialog.js';
import ContextMenu from '../ui/ContextMenu.js';
import SearchBar from '../ui/SearchBar.js';



/**
 * Main FileBrowser class that orchestrates the application
 */
class FileBrowser {
    constructor(options = {}) {
        // Initialize core services
        this.config = new Config();
        this.utils = new Utils();
        this.ui = new UI();
        this.eventManager = new EventManager();

        // Share config with UI
        this.ui.config = this.config;

        // Initialize services
        this.storageService = new StorageService();
        this.gitService = new GitService(this);
        this.notificationService = new NotificationService(this);
        this.formatService = new FormatService(this);

        // Initialize UI components
        this.dialog = new Dialog(this);
        this.contextMenu = new ContextMenu(this);
        this.searchBar = new SearchBar(this);

        // Initialize main components
        this.sidebar = new Sidebar(this);
        this.fileExplorer = new FileExplorer(this);
        this.branchManager = new BranchManager(this);
        this.editor = new Editor(this);
        this.liveView = new LiveView(this);

        // Initialize mobile-specific components if needed
        if (this.config.isMobile) {
            this.bottomFloat = new BottomFloat(this);
        }

        // Application state
        this.isLoading = false;
        this.loadTreeLocation();
        this.selectedFile = this.loadSelectedFile();
        this.modifiedFiles = this.loadModifiedFiles();
        this.modifiedRepos = this.loadModifiedRepos();

        // Pending operations
        this.pendingPromises = {};
        this.repoPromise = null;
        this.eclipsedFilesTimeout = null;

        // Initialize the application
        this.initialize();
    }

    /**
     * Initialize the application
     */
    initialize() {
        // Check authentication status
        this.checkAuthStatus();

        // Set up global event listeners
        this.setupEventListeners();

        // Load initial content
        this.loadInitialContent();

        // Mark as loaded
        document.body.classList.add('loaded');

        // Set timeout for eclipsed files
        this.setTimeoutForEclipsedFiles();
    }

    /**
     * Check if the user is authenticated
     */
    checkAuthStatus() {
        const gitToken = this.storageService.getItem('gitToken');
        const loggedUser = this.storageService.getItem('loggedUser');

        this.isAuthenticated = !!gitToken; //&& !!loggedUser; //TBD@@ gitToken is anogh.

        // If not authenticated and not at repo list, show intro
        if (!this.isAuthenticated && this.treeLoc[1] === '') {
            this.sidebar.showIntro();
        }
    }

    /**
     * Load the initial content based on the tree location
     */
    loadInitialContent() {
        // Setup editor
        this.editor.setup();

        // Setup sidebar
        this.sidebar.setup();

        // If it's an embed, hide the sidebar
        if (this.storageService.getItem('isEmbed') === 'true') {
            this.sidebar.toggle(false);
        }
    }

    /**
     * Set up global event listeners
     */
    setupEventListeners() {
        // Set up global keyboard listeners
        this.eventManager.setupGlobalKeyboardListeners(this);

        // Handle window resize
        window.addEventListener('resize', () => {
            this.eventManager.emit('window-resize');
        });

        // Handle orientation change on mobile
        if (this.config.isMobile) {
            window.addEventListener('orientationchange', () => {
                this.eventManager.emit('orientation-change');
            });
        }
    }

    /**
     * Load tree location from storage or use default
     * @returns {Array} The tree location [user, repo, path]
     */
    loadTreeLocation() {

        // Load tree location //DUPLICATE TO one at localStorage TBD@@
        if (this.storageService.getItem('tree')) {
            treeLoc = this.storageService.getItem('tree').split(',');
            this.treeLoc = treeLoc;
        } else {
            this.treeLoc = ['', '', '']; // Default: [user, repo, path]
        }
    }

    /**
     * Save tree location to storage
     */
    saveTreeLocation() {
        this.storageService.setItem('tree', this.treeLoc.join());
    }

    /**
     * Change the current tree location
     * @param {string} user - The user or org name
     * @param {string} repo - The repository name (with optional branch)
     * @param {string} path - The path within the repository
     */
    changeLocation(user, repo, path) {
        this.treeLoc = [user, repo, path];
        this.saveTreeLocation();
        this.fileExplorer.renderExplorer();
    }

    /**
     * Load selected file from storage or use default
     * @returns {Object} The selected file
     */
    loadSelectedFile() {
        const savedFile = this.storageService.getItem('selectedFile');

        if (savedFile) {
            try {
                return JSON.parse(savedFile);
            } catch (e) {
                console.error('Failed to parse selectedFile', e);
            }
        }

        return {
            dir: '',
            sha: '',
            name: '',
            content: '',
            lang: '',
            caretPos: [0, 0],
            scrollPos: [0, 0],
            eclipsed: false
        };
    }

    /**
     * Change the selected file
     * @param {string} dir - The directory of the file
     * @param {string} sha - The SHA of the file
     * @param {string} name - The name of the file
     * @param {string} content - The content of the file
     * @param {string} lang - The language of the file
     * @param {Array} caretPos - The caret position [start, end]
     * @param {Array} scrollPos - The scroll position [x, y]
     * @param {boolean} isNew - Whether the file is new
     */
    changeSelectedFile(dir, sha, name, content, lang, caretPos, scrollPos, isNew) {
        // If previous selection exists, save it
        if (this.selectedFile.sha) {
            const prevFile = this.modifiedFiles[this.selectedFile.sha];
            if (prevFile) {
                this.updateModifiedFile(
                    this.selectedFile.sha,
                    this.selectedFile.content,
                    this.selectedFile.caretPos,
                    this.selectedFile.scrollPos
                );
            }
        }

        // Update selected file
        this.selectedFile = {
            dir,
            sha,
            name,
            content,
            lang,
            caretPos,
            scrollPos,
            eclipsed: false
        };

        // Save to storage
        this.storageService.setItem('selectedFile', JSON.stringify(this.selectedFile));

        // If it's a new file, add it to modified files
        if (isNew) {
            this.addSelectedFileToModifiedFiles();
        }

        // Update editor
        this.editor.loadFile(this.selectedFile);

        // Update UI
        this.eventManager.emit('file-selected', this.selectedFile);
    }

    /**
     * Load modified files from storage or use default
     * @returns {Object} The modified files
     */
    loadModifiedFiles() {
        const savedFiles = this.storageService.getItem('modifiedFiles');

        if (savedFiles) {
            try {
                return JSON.parse(savedFiles);
            } catch (e) {
                console.error('Failed to parse modifiedFiles', e);
            }
        }

        return {};
    }

    /**
     * Save modified files to storage
     */
    saveModifiedFiles() {
        this.storageService.setItem('modifiedFiles', JSON.stringify(this.modifiedFiles));
    }

    /**
     * Add the selected file to modified files
     */
    addSelectedFileToModifiedFiles() {
        this.modifiedFiles[this.selectedFile.sha] = { ...this.selectedFile };
        this.saveModifiedFiles();
        this.eventManager.emit('file-modified', this.selectedFile);
    }

    /**
     * Update a modified file
     * @param {string} sha - The SHA of the file
     * @param {string} content - The content of the file
     * @param {Array} caretPos - The caret position
     * @param {Array} scrollPos - The scroll position
     */
    updateModifiedFile(sha, content, caretPos, scrollPos) {
        if (!this.modifiedFiles[sha]) return;

        this.modifiedFiles[sha].content = content;

        if (caretPos) {
            this.modifiedFiles[sha].caretPos = caretPos;
        }

        if (scrollPos) {
            this.modifiedFiles[sha].scrollPos = scrollPos;
        }

        this.saveModifiedFiles();
    }

    /**
     * Delete a modified file
     * @param {string} sha - The SHA of the file
     */
    deleteModifiedFile(sha) {
        if (!this.modifiedFiles[sha]) return;

        delete this.modifiedFiles[sha];
        this.saveModifiedFiles();
        this.eventManager.emit('file-deleted', sha);
    }

    /**
     * Load modified repositories from storage or use default
     * @returns {Object} The modified repositories
     */
    loadModifiedRepos() {
        const savedRepos = this.storageService.getItem('modifiedRepos');

        if (savedRepos) {
            try {
                return JSON.parse(savedRepos);
            } catch (e) {
                console.error('Failed to parse modifiedRepos', e);
            }
        }

        return {};
    }

    /**
     * Save modified repositories to storage
     */
    saveModifiedRepos() {
        this.storageService.setItem('modifiedRepos', JSON.stringify(this.modifiedRepos));
    }

    /**
     * Start the loading indicator
     */
    startLoading() {
        this.isLoading = true;
        document.querySelector('.loader').style.opacity = '1';
        this.eventManager.emit('loading-started');
    }

    /**
     * Stop the loading indicator
     */
    stopLoading() {
        this.isLoading = false;
        document.querySelector('.loader').style.opacity = '0';
        this.eventManager.emit('loading-stopped');
    }

    /**
     * Set a timeout to clean up eclipsed files
     */
    setTimeoutForEclipsedFiles() {
        // Clear existing timeout
        if (this.eclipsedFilesTimeout) {
            clearTimeout(this.eclipsedFilesTimeout);
        }

        this.eclipsedFilesTimeout = setTimeout(() => {
            this.cleanEclipsedFiles();
        }, this.config.eclipsedFileExpiration);
    }

    /**
     * Clean up eclipsed files
     */
    cleanEclipsedFiles() {
        let cleaned = false;

        for (const sha in this.modifiedFiles) {
            if (this.modifiedFiles[sha].eclipsed) {
                delete this.modifiedFiles[sha];
                cleaned = true;
            }
        }

        if (cleaned) {
            this.saveModifiedFiles();
        }

        // Reset timeout
        this.setTimeoutForEclipsedFiles();
    }

    /**
     * Mark a file as eclipsed
     * @param {string} oldSha - The old SHA of the file
     * @param {string} newSha - The new SHA of the file
     * @param {Object} fileObj - Optional file object to update
     */
    onFileEclipsedInCache(oldSha, newSha, fileObj = null) {
        // Mark old file as eclipsed
        if (this.modifiedFiles[oldSha]) {
            this.modifiedFiles[oldSha].eclipsed = true;

            // Create a copy with new SHA
            if (newSha && newSha !== oldSha) {
                this.modifiedFiles[newSha] = { ...this.modifiedFiles[oldSha], sha: newSha, eclipsed: true };
            }

            this.saveModifiedFiles();
        }

        // If provided, update file object
        if (fileObj && fileObj.sha === oldSha) {
            fileObj.sha = newSha;
            fileObj.eclipsed = true;

            // If it's the selected file, update it
            if (this.selectedFile.sha === oldSha) {
                this.selectedFile.sha = newSha;
                this.selectedFile.eclipsed = true;
                this.storageService.setItem('selectedFile', JSON.stringify(this.selectedFile));
            }
        }

        // Reset timeout for cleaning eclipsed files
        this.setTimeoutForEclipsedFiles();
    }
}

export default FileBrowser;