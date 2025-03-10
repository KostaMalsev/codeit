/**
 * Editor component for handling code editing
 */
class Editor {
    constructor(fileBrowser) {
        this.fileBrowser = fileBrowser;

        // DOM elements
        this.element = document.querySelector('.codeit');
        this.lineNumbers = document.querySelector('.line-numbers');
        this.cd = document.querySelector('.codeit'); // Alias for convenience

        // Editor state
        this.lastScrollTop = 0;
        this.editorScrollTimeout = null;

        // Set up event listeners
        this.setupEventListeners();
    }

    /**
     * Set up event listeners for the editor
     */
    setupEventListeners() {
        this.cd.on('type', () => this.onCodeChange());
        this.cd.on('scroll', () => this.onEditorScroll());
        this.cd.on('caretmove', () => this.saveSelectedFileCaretPos());

        // Update on screen resize
        const landscape = window.matchMedia('(orientation: landscape)');
        landscape.addEventListener('change', () => {
            this.fileBrowser.utils.onNextFrame(() => this.updateLineNumbers());
        });

        // When editor resizes, update scrollbar arrow
        new ResizeObserver(() => this.updateScrollbarArrow()).observe(this.cd);
    }

    /**
     * Set up the editor
     */
    setup() {
        // If code in storage
        if (this.fileBrowser.selectedFile.content) {
            this.loadFile(this.fileBrowser.selectedFile);
        }
    }

    /**
     * Load a file into the editor
     * @param {Object} file - The file to load
     */
    loadFile(file) {
        // Show file content in codeit
        try {
            const fileContent = this.fileBrowser.utils.decodeUnicode(file.content);

            // Compare current code with new code
            if (this.fileBrowser.utils.hashCode(this.cd.textContent) !==
                this.fileBrowser.utils.hashCode(fileContent)) {
                // If the code is different, swap it
                this.cd.textContent = fileContent;
            }

            // Change codeit lang
            this.cd.lang = file.lang;
        } catch (e) { // If file is binary
            if (this.fileBrowser.utils.hashCode(file.content) !==
                this.fileBrowser.utils.hashCode('fileSizeText')) {
                this.cd.textContent = '';

                // Load binary file
                this.fileBrowser.liveView.loadBinaryFile(file, false);
                return;
            }
        }

        // If on desktop, focus codeit
        if (!this.fileBrowser.config.isMobile) {
            // Set caret pos in code
            this.cd.setSelection(file.caretPos[0], file.caretPos[1]);
        }

        // Prevent bottom float disappearing on mobile
        if (this.fileBrowser.config.isMobile) {
            this.lastScrollTop = file.scrollPos[1];
        }

        // Scroll to pos in code
        this.cd.scrollTo(file.scrollPos[0], file.scrollPos[1]);

        // Update line numbers
        this.updateLineNumbers();

        // Clear codeit history
        this.cd.history.records = [{ html: this.cd.innerHTML, pos: this.cd.getSelection() }];
        this.cd.history.pos = 0;
    }

    /**
     * Load a file from the explorer
     * @param {Element} fileEl - The file element
     * @param {string} fileSha - The file SHA
     */
    async loadFileInExplorer(fileEl, fileSha) {
        // Clear existing selections in HTML
        if (this.fileBrowser.fileExplorer.element.querySelector('.selected')) {
            this.fileBrowser.fileExplorer.element.querySelector('.selected').classList.remove('selected');
        }

        // If adding a new file, remove it
        if (this.fileBrowser.fileExplorer.element.querySelector('.focused')) {
            this.fileBrowser.fileExplorer.element.querySelector('.focused').classList.add('hidden');

            window.setTimeout(() => {
                this.fileBrowser.fileExplorer.element.querySelector('.focused').remove();
            }, 180);
        }

        // Select the new file in HTML
        fileEl.classList.add('selected');
        this.fileBrowser.utils.onNextFrame(() => {
            fileEl.scrollIntoViewIfNeeded();
        });

        // Close search
        this.fileBrowser.searchBar.closeSearch();

        // If previous file selection exists
        if (this.fileBrowser.selectedFile.sha) {
            // Get previous selection in modifiedFiles array
            let selectedItem = this.fileBrowser.modifiedFiles[this.fileBrowser.selectedFile.sha];

            // If previous selection was modified
            if (selectedItem) {
                // Save previous selection in localStorage
                this.fileBrowser.updateModifiedFile(
                    this.fileBrowser.selectedFile.sha,
                    this.fileBrowser.selectedFile.content,
                    this.fileBrowser.selectedFile.caretPos,
                    this.fileBrowser.selectedFile.scrollPos
                );
            }
        }

        const fileName = fileEl.querySelector('.name').textContent.replaceAll('\n', '');

        this.fileBrowser.gitService.protectModFileInSidebar(fileSha, fileName);

        // If file is modified
        if (this.fileBrowser.modifiedFiles[fileSha] &&
            !this.fileBrowser.modifiedFiles[fileSha].eclipsed &&
            !fileEl.classList.contains('modified')) {
            // Update file in HTML
            fileEl.classList.add('modified');
        }

        // If file is not modified; fetch from Git
        if (!this.fileBrowser.modifiedFiles[fileSha]) {
            // If not already loading, start loading
            if (!this.fileBrowser.isLoading) {
                this.fileBrowser.startLoading();
            }

            const fileDir = this.fileBrowser.treeLoc.join();

            // Get file from git
            let resp = await this.fileBrowser.gitService.getFile(this.fileBrowser.treeLoc, fileName);

            const currSelectedFileName = this.fileBrowser.fileExplorer.element.querySelector('.selected .name').textContent.replaceAll('\n', '');

            // If switched file or directory while loading, return
            if (this.fileBrowser.treeLoc.join() !== fileDir ||
                currSelectedFileName !== fileName) {
                return;
            }

            // If file doesn't exist
            if (resp.message && resp.message === 'Not Found') {
                // Stop loading
                this.fileBrowser.stopLoading();

                this.fileBrowser.notificationService.showMessage('Hmm... that file doesn\'t exist.', 5000);

                // Remove file from HTML
                if (fileEl) fileEl.remove();

                // If previous file selection exists
                if (this.fileBrowser.selectedFile.sha) {
                    const prevSelFileEl = this.fileBrowser.fileExplorer.element.querySelector(
                        `.item[sha="${this.fileBrowser.selectedFile.sha}"]`
                    );

                    // If previous file selection exists in HTML
                    if (prevSelFileEl) {
                        // Load previous selected file
                        this.loadFileInExplorer(prevSelFileEl, this.fileBrowser.selectedFile.sha);
                    } else {
                        // Clear editor to protect unsaved code
                        this.clearEditor();
                    }
                } else {
                    // Clear editor to protect unsaved code
                    this.clearEditor();
                }

                return;
            }

            // If file is over max size
            if (resp.size >= this.fileBrowser.config.maxViewableFileSize && resp.content === '') {
                // Show file size prompt
                this.fileBrowser.liveView.showFileSizePrompt();

                resp = { content: 'fileSizeText' };
                this.cd.textContent = '';
            }

            // Change selected file
            this.fileBrowser.changeSelectedFile(
                this.fileBrowser.treeLoc.join(),
                fileSha,
                fileName,
                resp.content,
                this.fileBrowser.utils.getFileLang(fileName),
                [0, 0],
                [0, 0],
                false
            );

            // Stop loading
            this.fileBrowser.stopLoading();
        } else { // Else, load file from modifiedFiles object
            const modFile = (this.fileBrowser.selectedFile.sha === fileSha) ?
                this.fileBrowser.selectedFile : this.fileBrowser.modifiedFiles[fileSha];

            this.fileBrowser.changeSelectedFile(
                modFile.dir,
                modFile.sha,
                modFile.name,
                modFile.content,
                modFile.lang,
                modFile.caretPos,
                modFile.scrollPos,
                false
            );
        }

        // Load file in editor
        this.loadFile(this.fileBrowser.selectedFile);

        // If on desktop and file is modified
        if (!this.fileBrowser.config.isMobile && this.fileBrowser.modifiedFiles[fileSha]) {
            // Set caret pos in codeit
            this.cd.setSelection(
                this.fileBrowser.selectedFile.caretPos[0],
                this.fileBrowser.selectedFile.caretPos[1]
            );
        } else {
            this.cd.blur();
        }

        // If live view is showing a file, close it if not binary
        if (this.fileBrowser.utils.hashCode(this.fileBrowser.selectedFile.content) !==
            this.fileBrowser.utils.hashCode('fileSizeText')) {
            this.fileBrowser.liveView.closeLiveView();
        }
    }

    /**
     * Clear the editor
     */
    clearEditor() {
        // Clear codeit contents
        this.cd.textContent = '\r\n';

        // Change codeit lang
        this.cd.lang = '';

        // Clear codeit history
        this.cd.history.records = [{ html: this.cd.innerHTML, pos: this.cd.getSelection() }];
        this.cd.history.pos = 0;

        // Update line numbers
        this.updateLineNumbers();

        // If on mobile, show sidebar
        if (this.fileBrowser.config.isMobile) {
            // Don't transition
            document.body.classList.add('notransition');

            // Show sidebar
            this.fileBrowser.sidebar.toggle(true);
            this.fileBrowser.sidebar.saveSidebarState();

            this.fileBrowser.utils.onNextFrame(() => {
                document.body.classList.remove('notransition');
            });
        }

        // Change selected file to empty file
        this.fileBrowser.changeSelectedFile('', '', '', '', '', [0, 0], [0, 0], false);
    }

    /**
     * Handle new file creation
     * @param {Element} fileEl - The file element
     * @param {string} tempSHA - The temporary SHA
     * @param {string} fileName - The file name
     * @param {string} fileContent - The file content
     */
    async handleNewFileCreation(fileEl, tempSHA, fileName, fileContent) {
        // Close file view if open
        if (this.fileBrowser.liveView.element.classList.contains('file-open')) {
            this.fileBrowser.liveView.closeLiveView();
        }

        // If on mobile device
        if (this.fileBrowser.config.isMobile) {
            // Wait for push animation to finish, then update bottom float
            window.setTimeout(() => {
                this.fileBrowser.bottomFloat.updateFloat();
            }, (this.fileBrowser.config.pushAnimDuration * 1000));
        }

        // Show file content in codeit
        this.cd.textContent = '\r\n';

        // Change codeit lang
        this.cd.lang = this.fileBrowser.utils.getFileLang(fileName);

        // Clear codeit history
        this.cd.history.records = [{ html: this.cd.innerHTML, pos: this.cd.getSelection() }];
        this.cd.history.pos = 0;

        // Update line numbers
        this.updateLineNumbers();

        // Set caret pos in codeit
        if (!this.fileBrowser.config.isMobile) this.cd.setSelection(0, 0);
    }

    /**
     * Called when code changes
     */
    /**
   * Called when code changes
   */
    onCodeChange() {
        // If selected file is not in modifiedFiles or if it is in modifiedFiles and eclipsed
        if (!this.fileBrowser.modifiedFiles[this.fileBrowser.selectedFile.sha] ||
            (this.fileBrowser.modifiedFiles[this.fileBrowser.selectedFile.sha] &&
                this.fileBrowser.modifiedFiles[this.fileBrowser.selectedFile.sha].eclipsed)) {

            // If selected file is in modifiedFiles and eclipsed
            if (this.fileBrowser.modifiedFiles[this.fileBrowser.selectedFile.sha] &&
                this.fileBrowser.modifiedFiles[this.fileBrowser.selectedFile.sha].eclipsed) {
                // File cannot be both eclipsed and modified
                this.fileBrowser.selectedFile.eclipsed = false;
            }

            // Add selected file to modifiedFiles
            this.fileBrowser.addSelectedFileToModifiedFiles();
        }

        // Enable pushing file in HTML
        const selectedEl = this.fileBrowser.fileExplorer.element.querySelector(
            `.item[sha="${this.fileBrowser.selectedFile.sha}"]`
        );

        // If selected file element exists in HTML
        if (selectedEl) {
            // Enable pushing file
            selectedEl.classList.add('modified');

            // Enable pushing from bottom float
            if (this.fileBrowser.bottomFloat) {
                this.fileBrowser.bottomFloat.element.classList.add('modified');
            }
        }

        // Save code in async thread
        this.fileBrowser.eventManager.asyncThread(
            () => this.saveSelectedFileContent(),
            30,
            'saveContent'
        );
    }

    /**
     * Save the content of the selected file
     */
    saveSelectedFileContent() {
        try {
            const content = this.fileBrowser.utils.encodeUnicode(this.cd.textContent);
            this.fileBrowser.selectedFile.content = content;

            // Update modified file
            if (this.fileBrowser.modifiedFiles[this.fileBrowser.selectedFile.sha]) {
                this.fileBrowser.updateModifiedFile(
                    this.fileBrowser.selectedFile.sha,
                    content,
                    null,
                    null
                );
            }
        } catch (e) {
            console.error('Error saving file content:', e);
        }
    }

    /**
     * Save the caret position of the selected file
     */
    saveSelectedFileCaretPos() {
        const pos = this.cd.getSelection();
        this.fileBrowser.selectedFile.caretPos = [pos.start, pos.end];

        // Update modified file
        if (this.fileBrowser.modifiedFiles[this.fileBrowser.selectedFile.sha]) {
            this.fileBrowser.updateModifiedFile(
                this.fileBrowser.selectedFile.sha,
                null,
                [pos.start, pos.end],
                null
            );
        }
    }

    /**
     * Handle editor scroll
     */
    onEditorScroll() {
        if (this.editorScrollTimeout) {
            window.clearTimeout(this.editorScrollTimeout);
        }

        // When stopped scrolling, save scroll pos
        this.editorScrollTimeout = window.setTimeout(() => this.saveSelectedFileScrollPos(), 100);
    }

    /**
     * Save the scroll position of the selected file
     */
    saveSelectedFileScrollPos() {
        const scrollPos = [this.cd.scrollLeft, this.cd.scrollTop];
        this.fileBrowser.selectedFile.scrollPos = scrollPos;

        // Update modified file
        if (this.fileBrowser.modifiedFiles[this.fileBrowser.selectedFile.sha]) {
            this.fileBrowser.updateModifiedFile(
                this.fileBrowser.selectedFile.sha,
                null,
                null,
                scrollPos
            );
        }
    }

    /**
     * Update the line numbers in the editor
     */
    updateLineNumbers() {
        // If mobile but not in landscape, or if editor isn't in view, return
        if (this.fileBrowser.config.isMobile && !this.fileBrowser.config.isLandscape()) {
            if (this.cd.querySelector('.line-numbers-rows')) {
                this.fileBrowser.utils.setAttr(
                    this.cd.querySelector('.line-numbers-rows'),
                    'line-numbers',
                    ''
                );
            }

            this.cd.classList.remove('line-numbers');

            return;
        }

        this.cd.classList.add('line-numbers');

        // Update line numbers using Prism plugin
        Prism.plugins.lineNumbers.update(this.cd);

        if (!this.fileBrowser.config.isMobile) {
            this.fileBrowser.liveView.updateLiveViewArrow();
        }
    }

    /**
     * Update the scrollbar arrow based on horizontal scroll
     */
    updateScrollbarArrow() {
        // If codeit is horizontally scrollable
        if (this.cd.scrollWidth > this.cd.clientWidth) {
            // Move sidebar arrow up to make way for horizontal scrollbar
            document.body.classList.add('scroll-enabled');
        } else {
            document.body.classList.remove('scroll-enabled');
        }
    }
}

export default Editor;
