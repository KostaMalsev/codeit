/**
 * LiveView component for displaying file previews and rendering content
 */
import HTMLRenderer from './LiveView/HTMLRenderer';
import MarkdownRenderer from './LiveView/MarkdownRenderer';
import BinaryRenderer from './LiveView/BinaryRenderer';
import RequestHandler from './LiveView/RequestHandler';
import EventHandler from './LiveView/EventHandler';

class LiveView {
    constructor(fileBrowser) {
        this.fileBrowser = fileBrowser;
        this.config = fileBrowser.config;
        this.utils = fileBrowser.utils;

        // DOM elements
        this.element = document.querySelector('.live-view');
        this.liveToggle = document.querySelector('.live-toggle');

        // State
        this.isToggled = false;
        this.liveTimeout = null;
        this.liveFile = null;

        // Constants
        this.livePathLength = 15; // +1
        this.livePath = window.location.origin + '/run/' + '_/'.repeat(this.livePathLength);

        // Initialize sub-components
        this.htmlRenderer = new HTMLRenderer(this);
        this.markdownRenderer = new MarkdownRenderer(this);
        this.binaryRenderer = new BinaryRenderer(this);
        this.requestHandler = new RequestHandler(this);
        this.eventHandler = new EventHandler(this);

        // Initialize event listeners
        this.eventHandler.initEventListeners();
    }

    /**
     * Check if file can be rendered in live view
     */
    canRenderFile(file) {
        return file.lang === 'html' || file.lang === 'markup' || file.lang === 'markdown';
    }

    /**
     * Toggle live view for file
     */
    toggle(file) {
        this.isToggled = !this.isToggled;

        window.clearTimeout(this.liveTimeout);

        if (!this.config.isDev) {
            // clear console
            console.clear();
            this.utils.logVersion();
        }

        // if live view is visible
        if (this.isToggled) {
            this.showLiveView(file);
        } else {
            this.hideLiveView();
        }
    }

    /**
     * Show live view for the given file
     */
    showLiveView(file) {
        if (this.config.isMobile) {
            // change status bar color
            document.querySelector('meta[name="theme-color"]').content = '#1a1c24';
        }

        this.updateViewOptions(file);

        if (file.lang === 'html' || file.lang === 'markup') {
            this.htmlRenderer.render(file);
        } else if (file.lang === 'markdown') {
            this.markdownRenderer.render(file);
        } else {
            // clear live view
            this.element.innerHTML = '';

            // hide loader
            this.element.classList.add('loaded');
        }
    }

    /**
     * Hide live view
     */
    hideLiveView() {
        if (this.config.isMobile) {
            // show loader
            this.element.classList.remove('loaded');

            // change status bar color
            document.querySelector('meta[name="theme-color"]').content = '#313744';
        }

        this.liveTimeout = window.setTimeout(() => {
            // clear live view
            this.element.innerHTML = '';

            if (!this.config.isMobile) {
                // show loader
                this.element.classList.remove('loaded');
            }
        }, 400);
    }

    /**
     * Update view options based on the file
     */
    updateViewOptions(file) {
        // if on desktop
        if (!this.config.isMobile) {
            // show popout option in live view options if opening HTML file
            if (file.lang === 'html' || file.lang === 'markup') {
                this.liveToggle.classList.remove('popout-hidden');
            } else {
                this.liveToggle.classList.add('popout-hidden');
            }
        } else { // if on mobile
            const liveButtonOptions = document.querySelector('.live-button-options');

            // show console option in live view options if opening HTML file
            if (file.lang === 'html' || file.lang === 'markup') {
                liveButtonOptions.classList.add('options-visible');
            } else {
                liveButtonOptions.classList.remove('options-visible');
            }
        }
    }

    /**
     * Update the live view arrow visibility based on file type
     */
    updateLiveViewArrow() {
        const selectedFile = this.fileBrowser.selectedFile;

        if (!selectedFile) return;

        if (this.canRenderFile(selectedFile)) {
            this.liveToggle.classList.add('visible');
        } else {
            this.liveToggle.classList.remove('visible');
        }
    }

    /**
     * Close the live view
     */
    closeLiveView() {
        this.element.classList.add('notransition');
        this.element.classList.remove('file-open');

        this.utils.onNextFrame(() => {
            this.element.classList.remove('notransition');
        });

        // If on mobile device
        if (this.config.isMobile) {
            // Update bottom float
            this.fileBrowser.bottomFloat.element.classList.remove('file-open');
        } else {
            this.liveToggle.classList.remove('file-open');
        }
    }

    /**
     * Set up the live view component
     * Initializes the live view with the selected file
     */
    async setup() {
        const linkData = this.fileBrowser.linkData;

        // Handle directory from URL
        if (linkData && linkData.dir) {
            await this.handleDirectoryFromURL(linkData);
        }

        // Handle file from URL
        if (linkData && linkData.file) {
            await this.handleFileFromURL(linkData);
        }
    }

    /**
     * Handle directory information from URL
     */
    async handleDirectoryFromURL(linkData) {
        const body = document.body;

        // don't transition
        body.classList.add('notransition');

        // if on mobile device and URL has a file or is embed
        if ((this.config.isMobile && linkData.file) || this.config.isEmbed) {
            // close sidebar
            this.fileBrowser.toggleSidebar(false);
            this.fileBrowser.saveSidebarStateLS();
        } else {
            // open sidebar
            this.fileBrowser.toggleSidebar(true);
            this.fileBrowser.saveSidebarStateLS();
        }

        // restore transition on next frame
        this.utils.onNextFrame(() => {
            body.classList.remove('notransition');
        });

        // handle branch selection from URL
        await this.handleBranchSelection(linkData);
    }

    /**
     * Handle branch selection based on link data
     */
    async handleBranchSelection(linkData) {
        let selBranch = linkData.dir[1].split(':')[1];
        const treeLoc = this.fileBrowser.treeLoc;

        // get repo obj from local storage
        const repoObj = this.fileBrowser.modifiedRepos[linkData.dir[0] + '/' + linkData.dir[1].split(':')[0]];

        // if selected branch does not exist
        if (!selBranch) {
            // get default branch
            let defaultBranch;

            if (repoObj && repoObj.defaultBranch) {
                defaultBranch = repoObj.defaultBranch;
            } else {
                defaultBranch = (await this.fileBrowser.git.getRepo(treeLoc)).default_branch;
            }

            // add branch to tree
            treeLoc[1] = linkData.dir[1].split(':')[0] + ':' + defaultBranch;
            this.fileBrowser.saveTreeLocLS(treeLoc);

            // set selected branch to default branch
            selBranch = defaultBranch;
        }

        // if repo obj exists and branch changed
        if (repoObj && repoObj.selBranch !== selBranch) {
            // update selected branch in local storage
            this.fileBrowser.updateModRepoSelectedBranch(
                (treeLoc[0] + '/' + treeLoc[1].split(':')[0]),
                selBranch
            );
        }
    }

    /**
     * Handle file information from URL
     */
    async handleFileFromURL(linkData) {
        const prevSelectedFile = this.fileBrowser.selectedFile;
        const fileName = linkData.file;
        const treeLoc = this.fileBrowser.treeLoc;
        const bottomWrapper = this.fileBrowser.bottomFloat.element;

        // Store previous selected file
        this.fileBrowser.prevSelectedFile = prevSelectedFile;

        // change selected file
        this.fileBrowser.changeSelectedFile(
            treeLoc.join(),
            this.utils.generateSHA(),
            fileName,
            '',
            this.utils.getFileLang(fileName),
            [0, 0],
            [0, 0],
            false
        );

        if (this.config.isEmbed && !linkData.openLive && !this.config.isMobile) {
            this.liveToggle.classList.add('file-embed');
        }

        // if URL has a live view flag
        if (linkData.openLive) {
            this.handleLiveViewFlag(linkData);
        }

        // Load the actual file content
        await this.loadFileContent(linkData);
    }

    /**
     * Handle live view flag in URL
     */
    handleLiveViewFlag(linkData) {
        const bottomWrapper = this.fileBrowser.bottomFloat.element;

        // if on mobile device
        if (this.config.isMobile) {
            // show URL file name
            this.fileBrowser.floatLogo.innerText = linkData.file;

            // don't transition bottom float
            bottomWrapper.classList.add('notransition');

            // expand bottom float
            bottomWrapper.classList.add('expanded');

            // restore transition on next frame
            this.utils.onNextFrame(() => {
                bottomWrapper.classList.remove('notransition');
            });
        } else {
            // don't transition live view
            this.element.classList.add('notransition');

            // show live view
            this.element.classList.add('visible');

            // restore transition on next frame
            this.utils.onNextFrame(() => {
                this.element.classList.remove('notransition');
            });
        }
    }

    /**
     * Load file content either from modified files or from Git
     */
    async loadFileContent(linkData) {
        const treeLoc = this.fileBrowser.treeLoc;
        const fileName = linkData.file;
        const prevSelectedFile = this.fileBrowser.prevSelectedFile;

        // Try to find the file in modified files
        const modFile = this.findModifiedFile(fileName, treeLoc, prevSelectedFile);

        // If not found in modified files, fetch from Git
        if (!modFile) {
            await this.fetchFileFromGit(fileName, linkData);
        } else {
            // Load file from modified files
            this.fileBrowser.changeSelectedFile(
                modFile.dir,
                modFile.sha,
                modFile.name,
                modFile.content,
                modFile.lang,
                modFile.caretPos,
                modFile.scrollPos,
                modFile.eclipsed
            );
        }

        // If URL has a live view flag
        if (linkData.openLive) {
            this.openLiveViewFromURL();
        }

        // Load file into editor
        await this.loadFileIntoEditor(modFile);
    }

    /**
     * Find a file in modified files
     */
    findModifiedFile(fileName, treeLoc, prevSelectedFile) {
        // if selected file is the file we're looking for and is modified
        if ((prevSelectedFile && (prevSelectedFile.dir === treeLoc.join())) &&
            (prevSelectedFile && (prevSelectedFile.name === fileName)) &&
            this.fileBrowser.modifiedFiles[prevSelectedFile.sha]) {

            // Return selected file
            return prevSelectedFile;
        }

        // search modified files for file
        let modFile = Object.values(this.fileBrowser.modifiedFiles).filter(file =>
            (file.dir == treeLoc.join() && file.name == fileName))[0];

        // if modified file exists
        if (modFile) {
            // get the file's latest version
            return this.utils.getLatestVersion(modFile);
        }

        return null;
    }

    /**
     * Fetch a file from Git
     */
    async fetchFileFromGit(fileName, linkData) {
        const treeLoc = this.fileBrowser.treeLoc;

        // start loading
        this.fileBrowser.startLoading();

        // get file from git
        const resp = await this.fileBrowser.git.getFile(treeLoc, fileName);

        // if file doesn't exist
        if (resp.message && resp.message === 'Not Found') {
            // stop loading
            this.fileBrowser.stopLoading();

            // close live view if needed
            this.closeLiveViewIfNeeded(linkData);

            this.utils.showMessage('Hmm... that file doesn\'t exist.', 5000);
            return false;
        }

        // if branch doesn't exist
        if (resp.message && resp.message.startsWith('No commit found for the ref')) {
            // stop loading
            this.fileBrowser.stopLoading();

            // close live view if needed
            this.closeLiveViewIfNeeded(linkData);

            return false;
        }

        // change selected file
        this.fileBrowser.changeSelectedFile(
            treeLoc.join(),
            resp.sha,
            fileName,
            resp.content,
            this.utils.getFileLang(fileName),
            [0, 0],
            [0, 0],
            false
        );

        // stop loading
        this.fileBrowser.stopLoading();

        return true;
    }

    /**
     * Close live view if needed based on link data
     */
    closeLiveViewIfNeeded(linkData) {
        // if URL has a live view flag
        if (linkData.openLive) {
            // if on mobile device
            if (this.config.isMobile) {
                // don't transition
                document.body.classList.add('notransition');

                // open sidebar
                this.fileBrowser.toggleSidebar(true);
                this.fileBrowser.saveSidebarStateLS();

                // restore transition on next frame
                this.utils.onNextFrame(() => {
                    document.body.classList.remove('notransition');
                });

                const bottomWrapper = this.fileBrowser.bottomFloat.element;
                // don't transition bottom float
                bottomWrapper.classList.add('notransition');

                // close bottom float
                bottomWrapper.classList.remove('expanded');

                // restore transition on next frame
                this.utils.onNextFrame(() => {
                    bottomWrapper.classList.remove('notransition');
                });
            } else {
                // don't transition live view
                this.element.classList.add('notransition');

                this.utils.onNextFrame(() => {
                    // hide live view
                    this.element.classList.remove('visible');

                    // restore transition on next frame
                    this.utils.onNextFrame(() => {
                        this.element.classList.remove('notransition');
                    });
                });
            }
        }
    }

    /**
     * Open live view from URL
     */
    openLiveViewFromURL() {
        // if on mobile device
        if (this.config.isMobile) {
            // update bottom float
            this.fileBrowser.bottomFloat.updateFloat();
        }

        // open live view
        this.toggle(this.fileBrowser.selectedFile);
    }

    /**
     * Load file into the editor
     */
    async loadFileIntoEditor(modFile) {
        const treeLoc = this.fileBrowser.treeLoc;
        const fileName = this.fileBrowser.selectedFile.name;

        try {
            let fileContent;

            // get repo obj from local storage
            const repoObj = this.fileBrowser.modifiedRepos[treeLoc[0] + '/' + treeLoc[1].split(':')[0]];

            // if repository is public, file is not modified, and file is HTML
            const repoIsPublic = ((this.fileBrowser.gitToken === '') || (repoObj && !repoObj.private));

            if (repoIsPublic &&
                !modFile &&
                this.utils.getFileType(fileName) === 'html') {

                // get public file from git
                fileContent = await this.fileBrowser.git.getPublicFile(treeLoc, fileName);
            } else {
                fileContent = this.utils.decodeUnicode(this.fileBrowser.selectedFile.content);
            }

            // compare current code with new code
            if (this.utils.hashCode(this.fileBrowser.editor.cd.textContent) !==
                this.utils.hashCode(fileContent)) {

                // if the code is different, swap it
                this.fileBrowser.editor.cd.textContent = fileContent;
            }

            // change codeit lang
            this.fileBrowser.editor.cd.lang = this.fileBrowser.selectedFile.lang;

            // set scroll pos in codeit
            this.fileBrowser.editor.cd.scrollTo(
                this.fileBrowser.selectedFile.scrollPos[0],
                this.fileBrowser.selectedFile.scrollPos[1]
            );

            // clear codeit history
            this.fileBrowser.editor.cd.history.records = [
                {
                    html: this.fileBrowser.editor.cd.innerHTML,
                    pos: this.fileBrowser.editor.cd.getSelection()
                }
            ];
            this.fileBrowser.editor.cd.history.pos = 0;

            // update line numbers
            this.fileBrowser.editor.updateLineNumbersHTML();

        } catch (e) { // if file is binary
            this.fileBrowser.editor.cd.textContent = '';

            // load binary file
            this.binaryRenderer.loadBinaryFile(this.fileBrowser.selectedFile, true);
            return;
        }
    }
}

export default LiveView;