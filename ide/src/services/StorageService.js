import * as StorageUtils from '../utils/localStorage';

/**
 * Storage service for handling local storage operations
 */
class StorageService {
    constructor() {
        // Test localStorage availability
        this.isAvailable = this.testLocalStorage();
    }

    /**
     * Test if localStorage is available
     * @returns {boolean} Whether localStorage is available
     */
    testLocalStorage() {
        try {
            localStorage.setItem('test', 'test');
            localStorage.removeItem('test');
            return true;
        } catch (e) {
            return false;
        }
    }

    /**
     * Get an item from localStorage
     * @param {string} key - The key to get
     * @returns {string|null} The value or null if not found
     */
    getItem(key) {
        if (!this.isAvailable) return null;

        try {
            return localStorage.getItem(key);
        } catch (e) {
            console.error('Error getting item from localStorage:', e);
            return null;
        }
    }

    /**
     * Set an item in localStorage
     * @param {string} key - The key to set
     * @param {string} value - The value to set
     */
    setItem(key, value) {
        if (!this.isAvailable) return;

        try {
            localStorage.setItem(key, value);
        } catch (e) {
            console.error('Error setting item in localStorage:', e);

            // If quota exceeded, try to clear some space
            if (e.name === 'QuotaExceededError') {
                this.clearOldItems();

                // Try again
                try {
                    localStorage.setItem(key, value);
                } catch (e2) {
                    console.error('Still failed to set item after clearing space:', e2);
                }
            }
        }
    }

    /**
     * Remove an item from localStorage
     * @param {string} key - The key to remove
     */
    removeItem(key) {
        if (!this.isAvailable) return;

        try {
            localStorage.removeItem(key);
        } catch (e) {
            console.error('Error removing item from localStorage:', e);
        }
    }

    /**
     * Clear all items from localStorage
     */
    clear() {
        if (!this.isAvailable) return;

        try {
            localStorage.clear();
        } catch (e) {
            console.error('Error clearing localStorage:', e);
        }
    }

    /**
     * Clear old items to free up space
     */
    clearOldItems() {
        // This is a simple implementation that removes the modifiedRepos
        // and eclipsed files, which are typically less critical

        // Clear modified repos
        this.removeItem('modifiedRepos');

        // Clear eclipsed files from modifiedFiles
        const modifiedFiles = this.getItem('modifiedFiles');

        if (modifiedFiles) {
            try {
                const files = JSON.parse(modifiedFiles);

                for (const sha in files) {
                    if (files[sha].eclipsed) {
                        delete files[sha];
                    }
                }

                this.setItem('modifiedFiles', JSON.stringify(files));
            } catch (e) {
                console.error('Error clearing eclipsed files:', e);
            }
        }
    }
}

export default StorageService;