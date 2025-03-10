/**
 * DirectoryModel representing a directory in the file browser
 */
class DirectoryModel {
    /**
     * Create a new DirectoryModel
     * @param {Object} data - The directory data
     * @param {string} data.path - The directory path
     * @param {string} data.name - The directory name
     * @param {Array} data.items - The directory items
     * @param {string} data.parent - The parent directory path
     */
    constructor(data = {}) {
        this.path = data.path || '';
        this.name = data.name || '';
        this.items = data.items || [];
        this.parent = data.parent || '';
    }

    /**
     * Convert to JSON representation
     * @returns {Object} The JSON representation
     */
    toJSON() {
        return {
            path: this.path,
            name: this.name,
            items: this.items,
            parent: this.parent
        };
    }

    /**
     * Create a DirectoryModel from JSON
     * @param {Object} json - The JSON representation
     * @returns {DirectoryModel} The created DirectoryModel
     */
    static fromJSON(json) {
        return new DirectoryModel(json);
    }

    /**
     * Add an item to the directory
     * @param {Object} item - The item to add
     */
    addItem(item) {
        this.items.push(item);
    }

    /**
     * Remove an item from the directory
     * @param {string} name - The name of the item to remove
     * @returns {Object|null} The removed item or null if not found
     */
    removeItem(name) {
        const index = this.items.findIndex(item => item.name === name);

        if (index !== -1) {
            return this.items.splice(index, 1)[0];
        }

        return null;
    }

    /**
     * Find an item by name
     * @param {string} name - The name of the item to find
     * @returns {Object|null} The found item or null if not found
     */
    findItem(name) {
        return this.items.find(item => item.name === name) || null;
    }

    /**
     * Sort items by type and name
     */
    sortItems() {
        // Sort by type (directories first) and then by name
        this.items.sort((a, b) => {
            if (a.type === 'dir' && b.type !== 'dir') {
                return -1;
            }
            if (a.type !== 'dir' && b.type === 'dir') {
                return 1;
            }
            return a.name.localeCompare(b.name);
        });
    }

    /**
     * Get all directories
     * @returns {Array} The directories
     */
    getDirectories() {
        return this.items.filter(item => item.type === 'dir');
    }

    /**
     * Get all files
     * @returns {Array} The files
     */
    getFiles() {
        return this.items.filter(item => item.type !== 'dir');
    }

    /**
     * Check if directory is empty
     * @returns {boolean} Whether the directory is empty
     */
    isEmpty() {
        return this.items.length === 0;
    }

    /**
     * Get item count
     * @returns {number} The number of items
     */
    getItemCount() {
        return this.items.length;
    }

    /**
     * Get directory path components
     * @returns {Array} The path components
     */
    getPathComponents() {
        return this.path.split('/').filter(component => component !== '');
    }

    /**
     * Get parent directory
     * @returns {string} The parent directory path
     */
    getParentPath() {
        const components = this.getPathComponents();
        components.pop();
        return components.join('/');
    }

    /**
     * Create a copy of the directory
     * @returns {DirectoryModel} A copy of the directory
     */
    clone() {
        return new DirectoryModel(this.toJSON());
    }
}

export default DirectoryModel;