/**
 * Storage utility functions for the IDE
 * This file handles loading and saving data to localStorage
 */

/**
 * Check if the application is running in embed mode
 * @returns {boolean} Whether the application is in embed mode
 */
function checkIfEmbed() {
    return window.location.href.includes('embed=true') ||
        window.location.href.includes('?embed') ||
        window.parent !== window;
}

// Cache the result to avoid rechecking
const isEmbed = checkIfEmbed();


/**
 * Load data from localStorage
 * @param {FileBrowser} fileBrowser - The main FileBrowser instance
 */
export function loadFromStorage(fileBrowser) {
    // Load selected file
    if (fileBrowser.storageService.getItem('selectedFile')) {
        // Load selected file from storage
        const item = fileBrowser.storageService.getItem('selectedFile');
        fileBrowser.selectedFile = JSON.parse(item);
    } else {
        // Load empty file
        fileBrowser.changeSelectedFile('', '', '', '', '', [0, 0], [0, 0], false);
    }

    // Load modified files if not in embed mode
    if (fileBrowser.storageService.getItem('modifiedFiles') && !isEmbed) {
        // Load modified files from storage
        const item = fileBrowser.storageService.getItem('modifiedFiles');
        const parsed = JSON.parse(item);
        const entries = Object.entries(parsed).map(([key, value]) => {
            return [key, value];
        });
        fileBrowser.modifiedFiles = Object.fromEntries(entries);
    } else {
        fileBrowser.modifiedFiles = {};
    }

    // Load modified repos
    if (fileBrowser.storageService.getItem('modifiedRepos')) {
        // Load modified repos from storage
        const item = fileBrowser.storageService.getItem('modifiedRepos');
        const parsed = JSON.parse(item);
        const entries = Object.entries(parsed).map(([key, value]) => {
            return [key, value];
        });
        fileBrowser.modifiedRepos = Object.fromEntries(entries);
    } else {
        fileBrowser.modifiedRepos = {};
    }

    // Load tree location //DUPLICATE TO 
    if (fileBrowser.storageService.getItem('tree')) {
        treeLoc = getStorage('tree').split(',');
        fileBrowser.treeLoc = treeLoc;
    } else {
        treeLoc = ['', '', ''];
    }

    // Set up components
    setupComponents(fileBrowser);

}

/**
 * Set up components after loading data
 * @param {FileBrowser} fileBrowser - The main FileBrowser instance
 */
function setupComponents(fileBrowser) {
    // Initialize LiveView
    //fileBrowser.liveView.setup(); //TBD@@ there is not such thing

    // Initialize Editor
    fileBrowser.editor.setup();

    // Initialize Sidebar
    fileBrowser.sidebar.setup();

    // Set timeout for eclipsed files
    fileBrowser.setTimeoutForEclipsedFiles();

    // Mark as loaded
    document.body.classList.add('loaded');
}

/**
 * Save selected file to localStorage
 * @param {FileBrowser} fileBrowser - The main FileBrowser instance
 */
export function saveSelectedFile(fileBrowser) {
    if (!isEmbed) {
        fileBrowser.storageService.setItem('selectedFile', JSON.stringify(fileBrowser.selectedFile));
    }
}

/**
 * Save modified files to localStorage
 * @param {FileBrowser} fileBrowser - The main FileBrowser instance
 */
export function saveModifiedFiles(fileBrowser) {
    if (!isEmbed) {
        fileBrowser.storageService.setItem(
            'modifiedFiles',
            JSON.stringify(Object.entries(fileBrowser.modifiedFiles))
        );
    }
}

/**
 * Save modified repositories to localStorage
 * @param {FileBrowser} fileBrowser - The main FileBrowser instance
 */
export function saveModifiedRepos(fileBrowser) {
    fileBrowser.storageService.setItem(
        'modifiedRepos',
        JSON.stringify(Object.entries(fileBrowser.modifiedRepos))
    );
}

/**
 * Save tree location to localStorage
 * @param {FileBrowser} fileBrowser - The main FileBrowser instance
 */
export function saveTreeLocation(fileBrowser) {
    if (!isEmbed) {
        fileBrowser.storageService.setItem('tree', fileBrowser.treeLoc.join());
    }
}

/**
 * Save sidebar state to localStorage
 * @param {FileBrowser} fileBrowser - The main FileBrowser instance
 * @param {boolean} isExpanded - Whether the sidebar is expanded
 */
export function saveSidebarState(fileBrowser, isExpanded) {
    if (!isEmbed) {
        fileBrowser.storageService.setItem('sidebar', isExpanded.toString());
    }
}

/**
 * Save Git token to localStorage
 * @param {FileBrowser} fileBrowser - The main FileBrowser instance
 * @param {string} gitToken - The Git token
 */
export function saveGitToken(fileBrowser, gitToken) {
    fileBrowser.storageService.setItem('gitToken', gitToken);
}

export default {
    loadFromStorage,
    saveSelectedFile,
    saveModifiedFiles,
    saveModifiedRepos,
    saveTreeLocation,
    saveSidebarState,
    saveGitToken
};