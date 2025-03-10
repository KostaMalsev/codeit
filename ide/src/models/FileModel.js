/**
 * FileModel representing a file in the file browser
 */
class FileModel {
    /**
     * Create a new FileModel
     * @param {Object} data - The file data
     * @param {string} data.sha - The file SHA
     * @param {string} data.name - The file name
     * @param {string} data.content - The file content
     * @param {string} data.dir - The file directory
     * @param {string} data.lang - The file language
     * @param {Array} data.caretPos - The caret position [start, end]
     * @param {Array} data.scrollPos - The scroll position [x, y]
     * @param {boolean} data.eclipsed - Whether the file is eclipsed
     */
    constructor(data = {}) {
        this.sha = data.sha || '';
        this.name = data.name || '';
        this.content = data.content || '';
        this.dir = data.dir || '';
        this.lang = data.lang || '';
        this.caretPos = data.caretPos || [0, 0];
        this.scrollPos = data.scrollPos || [0, 0];
        this.eclipsed = data.eclipsed || false;
    }

    /**
     * Convert to JSON representation
     * @returns {Object} The JSON representation
     */
    toJSON() {
        return {
            sha: this.sha,
            name: this.name,
            content: this.content,
            dir: this.dir,
            lang: this.lang,
            caretPos: this.caretPos,
            scrollPos: this.scrollPos,
            eclipsed: this.eclipsed
        };
    }

    /**
     * Create a FileModel from JSON
     * @param {Object} json - The JSON representation
     * @returns {FileModel} The created FileModel
     */
    static fromJSON(json) {
        return new FileModel(json);
    }

    /**
     * Update file content
     * @param {string} content - The new content
     */
    updateContent(content) {
        this.content = content;
    }

    /**
     * Update caret position
     * @param {Array} caretPos - The new caret position [start, end]
     */
    updateCaretPos(caretPos) {
        this.caretPos = caretPos;
    }

    /**
     * Update scroll position
     * @param {Array} scrollPos - The new scroll position [x, y]
     */
    updateScrollPos(scrollPos) {
        this.scrollPos = scrollPos;
    }

    /**
     * Mark file as eclipsed or not
     * @param {boolean} eclipsed - Whether the file is eclipsed
     */
    markEclipsed(eclipsed) {
        this.eclipsed = eclipsed;
    }

    /**
     * Get the file type (image, video, audio, etc.)
     * @param {Object} utils - Utils instance for file type detection
     * @returns {string} The file type
     */
    getFileType(utils) {
        return utils.getFileType(this.name);
    }

    /**
     * Check if file is binary
     * @returns {boolean} Whether the file is binary
     */
    isBinary() {
        try {
            // Try to encode/decode the content
            // If it fails, it's likely binary
            const decodedContent = atob(this.content);
            return false;
        } catch (e) {
            return true;
        }
    }

    /**
     * Get the file extension
     * @returns {string} The file extension
     */
    getExtension() {
        const parts = this.name.split('.');
        if (parts.length > 1) {
            return parts.pop().toLowerCase();
        }
        return '';
    }

    /**
     * Create a copy of the file
     * @returns {FileModel} A copy of the file
     */
    clone() {
        return new FileModel(this.toJSON());
    }
}

export default FileModel;