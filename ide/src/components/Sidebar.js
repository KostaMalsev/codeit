/**
 * Sidebar component for the FileBrowser application
 */
class Sidebar {
    constructor(fileBrowser) {
        this.fileBrowser = fileBrowser;

        // Use UI references
        this.element = fileBrowser.ui.sidebar;
        this.sidebarToggle = fileBrowser.ui.sidebarToggle;
        this.sidebarTitle = fileBrowser.ui.sidebarTitle;
        this.sidebarLogo = fileBrowser.ui.sidebarLogo;
        this.sidebarBranch = fileBrowser.ui.sidebarBranch;
        this.fileWrapper = fileBrowser.ui.fileWrapper;

        // Search UI elements
        this.searchInput = fileBrowser.ui.searchInput;
        this.searchButton = fileBrowser.ui.searchButton;
        this.searchBack = fileBrowser.ui.searchBack;
        this.searchClear = fileBrowser.ui.searchClear;
        this.header = fileBrowser.ui.header;
        this.addButton = fileBrowser.ui.addButton;

        // State
        this.isVisible = this.fileBrowser.storageService.getItem('sidebar') === 'true';
        this.hoveringSidebarToggle = false;

        // Setup event listeners
        this.setupEventListeners();
        this.setupSearchFunctionality();
    }

    /**
     * Set up the sidebar
     */
    setup() {
        if (!this.fileBrowser.isAuthenticated && this.fileBrowser.treeLoc[1] === '') {
            this.showIntro();
        } else {
            this.fileBrowser.fileExplorer.renderExplorer();
            document.body.classList.add('expanded');//TBD@@ show always expanded
        }
    }

    /**
     * Show the intro screen
     */
    showIntro() {
        this.element.classList.add('intro');

        // Don't transition
        document.body.classList.add('notransition');

        // Show sidebar
        this.toggle(true);
        this.saveSidebarState();

        this.fileBrowser.utils.onNextFrame(() => {
            document.body.classList.remove('notransition');
        });
    }

    /**
     * Show the learn screen
     */
    showLearn() {
        this.element.classList.add('learn');

        // If adding a repository, remove it
        const focusedRepo = this.fileWrapper.querySelector('.repo.focused');
        if (focusedRepo) {
            focusedRepo.remove();
        }
    }

    /**
     * Set up event listeners for the sidebar
     */
    setupEventListeners() {

        // Show bookmark on hover
        this.sidebarToggle.addEventListener('mouseover', () => {
            this.hoveringSidebarToggle = true;

            if (!document.body.classList.contains('expanded')) {
                this.sidebarToggle.classList.add('visible');
            }
        });

        // Hide bookmark on mouse out
        this.sidebarToggle.addEventListener('mouseout', () => {
            this.hoveringSidebarToggle = false;

            if (!document.body.classList.contains('expanded')) {
                window.setTimeout(() => {
                    if (!this.hoveringSidebarToggle && !document.body.classList.contains('expanded')) {
                        this.sidebarToggle.classList.remove('visible');
                    }
                }, this.fileBrowser.config.sidebarToggleDelay);
            }
        });

        // Toggle sidebar on click of bookmark
        this.sidebarToggle.addEventListener('click', () => {
            this.toggle(!document.body.classList.contains('expanded'));
            this.saveSidebarState();
        });

        // Traverse backwards in tree when clicked on button
        this.sidebarTitle.addEventListener('click', (e) => {
            // If clicked on branch menu, return
            if (e.target === this.sidebarBranch) {
                return;
            }

            // Map tree location
            const [user, repo, contents] = this.fileBrowser.treeLoc;

            // If navigating in folders
            if (contents !== '') {
                // Pop last folder
                let splitContents = contents.split('/');
                splitContents.pop();

                // Change location
                this.fileBrowser.treeLoc[2] = splitContents.join('/');
                this.fileBrowser.saveTreeLocation();

                // Render sidebar
                this.fileBrowser.fileExplorer.renderExplorer();
            } else if (repo !== '') { // If navigating in repository
                // Change location
                this.fileBrowser.treeLoc[1] = '';
                this.fileBrowser.saveTreeLocation();

                // Render sidebar
                this.fileBrowser.fileExplorer.renderExplorer();
            } else { // Show learn page
                this.showLearn();
            }
        });

        // Handle sidebar scroll for loading more content
        this.element.addEventListener('scroll', () => {
            const moreButton = this.fileWrapper.querySelector('.item.more');

            // If more button exists and is not disabled (loading more)
            if (moreButton && !moreButton.classList.contains('disabled')) {
                const maxScroll = this.element.scrollHeight - this.element.clientHeight;

                // If scrolled to bottom of sidebar
                if (this.element.scrollTop >= maxScroll) {
                    // Load more repos
                    this.fileBrowser.fileExplorer.loadMoreItems(moreButton);
                }
            }
        });

        // Show gradients on edges of sidebar title when scrolling long titles
        this.sidebarLogo.addEventListener('scroll', () => this.updateScrolledTitle());

        // Handle mouse/touch interactions for title scrolling
        if (!this.fileBrowser.config.isMobile) {
            this.setupDesktopTitleInteractions();
        } else {
            this.setupMobileTitleInteractions();
        }
    }

    /**
     * Setup spotlight search functionality
     */
    setupSearchFunctionality() {
        // Define the openSearch method
        this.searchInput.openSearch = () => {
            // clear search input
            this.searchInput.innerText = '';

            // hide clear button
            this.searchClear.classList.remove('visible');

            // update add button
            this.addButton.classList.remove('clear-button-visible');

            this.header.classList.add('searching');

            // focus search input
            this.searchInput.focus();
        };

        // open search screen on click of button
        this.searchButton.addEventListener('click', this.searchInput.openSearch);

        // open search on focus
        this.searchInput.addEventListener('focus', () => {
            // if not already searching
            if (!this.header.classList.contains('searching')) {
                // open search
                this.searchInput.openSearch();
            }
        });

        // Define the closeSearch method
        this.searchInput.closeSearch = () => {
            // show all files
            let files = this.fileWrapper.querySelectorAll('.item[style="display: none;"]');
            files.forEach(file => { file.style.display = '' });

            this.header.classList.remove('searching');

            if (document.activeElement === this.searchInput) {
                this.searchInput.blur();
            }
        };

        this.searchBack.addEventListener('click', this.searchInput.closeSearch);

        this.searchInput.addEventListener('blur', () => {
            // if query is empty
            if (this.searchInput.textContent === '') {
                // close search
                this.searchInput.closeSearch();
            }
        });

        // Define the search method
        this.searchInput.search = () => {
            if (this.searchInput.innerHTML === '<br>') {
                this.searchInput.textContent = '';
            }
            let query = this.searchInput.textContent.toLowerCase().replaceAll('\n', '');

            // exclude 'more' button from search
            let files = this.fileWrapper.querySelectorAll('.item:not(.more)');

            // search files
            files.forEach(file => {
                let name = file.querySelector('.name').textContent;
                if (!name.toLowerCase().includes(query)) {
                    file.style.display = 'none';
                } else {
                    file.style.display = '';
                }
            });

            // if search query exists
            if (this.searchInput.textContent !== '') {
                // show clear button
                this.searchClear.classList.add('visible');

                // rotate add button
                this.addButton.classList.add('clear-button-visible');
            } else {
                // hide clear button
                this.searchClear.classList.remove('visible');

                // update add button
                this.addButton.classList.remove('clear-button-visible');
            }

            const moreButton = this.fileWrapper.querySelector('.item.more');

            // if more button exists and is not disabled (loading more)
            if (moreButton && !moreButton.classList.contains('disabled')) {
                // if more button is in view
                if (this.fileBrowser.utils.elInView(moreButton)) {
                    // load more items
                    this.fileBrowser.fileExplorer.loadMoreItems(moreButton);
                }
            }
        };

        // search when typed in input
        this.searchInput.addEventListener('input', this.searchInput.search);

        this.searchInput.addEventListener('keydown', (e) => {
            // disable enter key in search input
            if (e.key === 'Enter') {
                e.preventDefault();
                // if query exists
                if (this.searchInput.textContent !== '') {
                    this.searchInput.blur();
                }
            }

            if (e.key === 'Escape') {
                // close search
                e.preventDefault();
                this.searchInput.closeSearch();
            }
        });

        // Define the clearSearch method
        this.searchInput.clearSearch = () => {
            // show all files
            let files = this.fileWrapper.querySelectorAll('.item[style="display: none;"]');
            files.forEach(file => { file.style.display = '' });

            // clear search input
            this.searchInput.innerText = '';

            // hide clear button
            this.searchClear.classList.remove('visible');

            // update add button
            this.addButton.classList.remove('clear-button-visible');

            // focus search input
            this.searchInput.focus();
        };

        // clear search input when clicked on button
        this.searchClear.addEventListener('click', this.searchInput.clearSearch);
    }

    /**
     * Setup desktop-specific title scrolling interactions
     */
    setupDesktopTitleInteractions() {
        this.sidebarLogo.mouseDown = false;

        this.sidebarLogo.addEventListener('scroll', () => {
            if (this.sidebarLogo.mouseDown) {
                this.sidebarTitle.classList.add('scrolling');
            }
        });

        this.sidebarLogo.addEventListener('mousedown', () => {
            this.sidebarLogo.mouseDown = true;
        });

        this.sidebarLogo.addEventListener('mouseup', () => {
            this.sidebarLogo.mouseDown = false;
            this.sidebarTitle.classList.remove('scrolling');
        });
    }

    /**
     * Setup mobile-specific title scrolling interactions
     */
    setupMobileTitleInteractions() {
        this.sidebarLogo.touchDown = false;

        this.sidebarLogo.addEventListener('scroll', () => {
            if (this.sidebarLogo.touchDown) {
                this.sidebarTitle.classList.add('scrolling');
            }
        });

        this.sidebarLogo.addEventListener('touchstart', () => {
            this.sidebarLogo.touchDown = true;
        });

        this.sidebarLogo.addEventListener('touchend', () => {
            this.sidebarLogo.touchDown = false;
            this.sidebarTitle.classList.remove('scrolling');
        });
    }

    /**
     * Update scrolled title gradients
     */
    updateScrolledTitle() {
        if (this.sidebarLogo.scrollLeft > 0) {
            this.sidebarLogo.classList.add('scrolled-start');
        } else {
            this.sidebarLogo.classList.remove('scrolled-start');
        }

        if ((this.sidebarLogo.offsetWidth + this.sidebarLogo.scrollLeft + 1) >= this.sidebarLogo.scrollWidth) {
            this.sidebarLogo.classList.add('scrolled-end');
        } else {
            this.sidebarLogo.classList.remove('scrolled-end');
        }
    }

    /**
     * Toggle the sidebar visibility
     * @param {boolean} closed - Whether the sidebar is closed the sidebar
     */
    toggle(closed) {
        if (this.sidebarTimeout) {
            window.clearTimeout(this.sidebarTimeout);
        }

        if (document.body.classList.contains('notransition')) {
            this.element.classList.remove('transitioning');
        } else {
            this.element.classList.add('transitioning');

            this.sidebarTimeout = window.setTimeout(() => {
                this.element.classList.remove('transitioning');
            }, 400);
        }

        if (closed) {
            document.body.classList.add('expanded');

            if (this.fileBrowser.config.isMobile) {
                document.querySelector('meta[name="theme-color"]').content = '#1a1c24';
            } else {
                this.sidebarToggle.classList.add('visible');
            }
        } else {
            document.body.classList.remove('expanded');

            if (this.fileBrowser.config.isMobile) {
                if (!this.fileBrowser.liveView.element.classList.contains('visible')) {
                    document.querySelector('meta[name="theme-color"]').content = '#313744';
                }
            } else {
                window.setTimeout(() => {
                    if (!this.hoveringSidebarToggle && !document.body.classList.contains('expanded')) {
                        this.sidebarToggle.classList.remove('visible');
                    }
                }, this.fileBrowser.config.sidebarToggleDelay);
            }
        }

        this.isVisible = !closed;
    }

    /**
     * Save the sidebar state to local storage
     */
    saveSidebarState() {
        this.fileBrowser.storageService.setItem('sidebar', this.isVisible.toString());
    }
}

export default Sidebar