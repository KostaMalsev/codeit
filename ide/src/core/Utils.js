/**
 * Utility functions for the FileBrowser application
 */
class Utils {
    /**
     * Generate a unique SHA-like identifier
     * @returns {string} A unique identifier
     */
    generateSHA() {
        return 'xxxx-xxxx-xxxx-xxxx'.replace(/x/g, () => {
            return Math.floor(Math.random() * 16).toString(16);
        });
    }

    /**
     * Decode a Unicode string
     * @param {string} content - The content to decode
     * @returns {string} The decoded content
     */
    decodeUnicode(content) {

        if (content == undefined || content == '') return '';

        // going backwards: from bytestream, to percent-encoding, to original string
        return decodeURIComponent(atob(str).split('').map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
    }

    /**
     * Encode a string to Unicode
     * @param {string} content - The content to encode
     * @returns {string} The encoded content
     */
    encodeUnicode(content) {
        if (!content) return '';

        try {
            return btoa(content);
        } catch (e) {
            return content;
        }
    }

    /**
     * Create a hash code from a string
     * @param {string} str - The string to hash
     * @returns {number} The hash code
     */
    hashCode(str) {
        let hash = 0;
        if (!str || str.length === 0) return hash;

        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }

        return hash;
    }

    /**
     * Get the file extension and language
     * @param {string} fileName - The name of the file
     * @returns {string} The language identifier for the file
     */
    getFileLang(fileName) {
        if (!fileName) return '';

        const extension = fileName.split('.').pop().toLowerCase();

        const langMap = {
            'js': 'javascript',
            'jsx': 'javascript',
            'ts': 'typescript',
            'tsx': 'typescript',
            'html': 'html',
            'css': 'css',
            'scss': 'scss',
            'sass': 'sass',
            'json': 'json',
            'md': 'markdown',
            'py': 'python',
            'rb': 'ruby',
            'java': 'java',
            'php': 'php',
            'go': 'go',
            'c': 'c',
            'cpp': 'cpp',
            'cs': 'csharp',
            'swift': 'swift',
            'kt': 'kotlin',
            'rs': 'rust',
            'sh': 'bash',
            'svg': 'svg'
        };

        return langMap[extension] || '';
    }

    /**
     * Get the file type (image, video, audio, etc.)
     * @param {string} fileName - The name of the file
     * @returns {string} The type of the file
     */
    getFileType(fileName) {
        if (!fileName) return 'other';

        const extension = fileName.split('.').pop().toLowerCase();

        const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'];
        const videoExtensions = ['mp4', 'webm', 'ogg', 'mov', 'avi'];
        const audioExtensions = ['mp3', 'wav', 'ogg', 'flac'];

        if (imageExtensions.includes(extension)) return 'image';
        if (videoExtensions.includes(extension)) return 'video';
        if (audioExtensions.includes(extension)) return 'audio';
        if (extension === 'pdf') return 'pdf';
        if (extension === 'midi') return 'midi';

        return 'other';
    }

    /**
     * Execute a function on the next animation frame
     * @param {Function} callback - The function to execute
     */
    onNextFrame(callback) {
        window.requestAnimationFrame(() => {
            window.requestAnimationFrame(callback);
        });
    }

    /**
     * Split a filename into name and extension
     * @param {string} fileName - The filename to split
     * @returns {Array} An array containing the name and extension
     */
    splitFileName(fileName) {
        const lastDotIndex = fileName.lastIndexOf('.');

        if (lastDotIndex === -1) {
            return [fileName, 'none'];
        }

        return [
            fileName.substring(0, lastDotIndex),
            fileName.substring(lastDotIndex + 1)
        ];
    }

    /**
     * Check if a key event includes the meta key (Ctrl/Cmd)
     * @param {Event} event - The keyboard event
     * @returns {boolean} Whether the meta key was pressed
     */
    isKeyEventMeta(event) {
        return event.metaKey || event.ctrlKey;
    }

    /**
     * Validate a string for special characters
     * @param {string} str - The string to validate
     * @returns {Array|null} An array of special characters, or null if none
     */
    validateString(str) {
        const regex = /[^a-zA-Z0-9\-_.]/g;
        const matches = str.match(regex);

        return matches;
    }

    /**
     * Set an attribute on a DOM element
     * @param {Element} el - The element
     * @param {string} attr - The attribute name
     * @param {string} value - The attribute value
     */
    setAttr(el, attr, value) {
        if (!el) return;
        el.setAttribute(attr, value);
    }

    /**
     * Get an attribute from a DOM element
     * @param {Element} el - The element
     * @param {string} attr - The attribute name
     * @returns {string} The attribute value
     */
    getAttr(el, attr) {
        if (!el) return null;
        return el.getAttribute(attr);
    }

    /**
     * Position an element relative to another element
     * @param {Element} elToMove - The element to move
     * @param {Element} targetEl - The target element
     * @param {number} offsetX - The X offset
     * @param {Object} options - Additional options
     */
    moveElToEl(elToMove, targetEl, offsetX = 0, options = {}) {
        if (!elToMove || !targetEl) return;

        const targetRect = targetEl.getBoundingClientRect();

        elToMove.style.left = (targetRect.left + offsetX) + 'px';

        if (options.top !== undefined) {
            elToMove.style.top = (targetRect.top + options.top) + 'px';
        } else {
            elToMove.style.top = (targetRect.bottom + 10) + 'px';
        }
    }

    /**
     * Copy text to clipboard
     * @param {string} text - The text to copy
     * @returns {Promise} A promise that resolves when the text is copied
     */
    async copy(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (e) {
            console.error('Failed to copy: ', e);
            return false;
        }
    }

    /**
     * Read text from clipboard
     * @returns {Promise<string>} A promise that resolves with the clipboard text
     */
    async readClipboard() {
        try {
            return await navigator.clipboard.readText();
        } catch (e) {
            console.error('Failed to read clipboard: ', e);
            return '';
        }
    }
}

export default Utils;