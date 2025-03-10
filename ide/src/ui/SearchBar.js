/**
 * SearchBar component for searching files and repositories
 */
class SearchBar {
    constructor(fileBrowser) {
        this.fileBrowser = fileBrowser;

        // DOM elements
        this.searchButton = document.querySelector('.search');
        this.searchInput = document.querySelector('.search-input');
        this.header = document.querySelector('.header');

        // Setup event listeners
        this.setupEventListeners();
    }

    /**
     * Set up event listeners for the search bar
     */
    setupEventListeners() {
        // Toggle search on search button click
        this.searchButton.addEventListener('click', () => {
            this.toggleSearch();
        });

        // Search on input
        this.searchInput.addEventListener('input', () => {
            this.search();
        });

        // Cancel search on escape key
        this.searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeSearch();
            }
        });
    }

    /**
     * Toggle search visibility
     */
    toggleSearch() {
        if (this.header.classList.contains('searching')) {
            this.closeSearch();
        } else {
            this.openSearch();
        }
    }

    /**
     * Open the search bar
     */
    openSearch() {
        this.header.classList.add('searching');
        this.searchInput.focus();

        // If on mobile and sidebar is open, close it
        if (this.fileBrowser.config.isMobile &&
            document.body.classList.contains('expanded')) {
            this.fileBrowser.sidebar.toggle(false);
            this.fileBrowser.sidebar.saveSidebarState();
        }
    }

    /**
     * Close the search bar
     */
    closeSearch() {
        this.header.classList.remove('searching');
        this.searchInput.value = '';
        this.searchInput.blur();

        // Clear search highlights
        this.clearSearchHighlights();
    }

    /**
     * Perform search on the current directory
     */
    search() {
        // Get search query
        const query = this.searchInput.value.toLowerCase();

        // Clear existing highlights
        this.clearSearchHighlights();

        if (query === '') {
            return;
        }

        // Get all items
        const items = this.fileBrowser.fileExplorer.element.querySelectorAll('.item');

        // Counter for matches
        let matchCount = 0;

        // Search in items
        items.forEach(item => {
            const nameElement = item.querySelector('.name');
            const name = nameElement.textContent.toLowerCase();

            if (name.includes(query)) {
                // Highlight match
                item.classList.add('search-match');
                matchCount++;

                // Highlight text
                const highlightedText = nameElement.textContent.replace(
                    new RegExp(query, 'gi'),
                    match => `<span class="highlight">${match}</span>`
                );

                nameElement.innerHTML = highlightedText;
            } else {
                item.classList.add('search-non-match');
            }
        });

        // If no matches, show message
        if (matchCount === 0 && items.length > 0) {
            this.fileBrowser.notificationService.showMessage(
                `No matches for "${query}"`,
                3000
            );
        }
    }

    /**
     * Clear search highlights
     */
    clearSearchHighlights() {
        // Get all items
        const items = this.fileBrowser.fileExplorer.element.querySelectorAll('.item');

        // Remove highlights
        items.forEach(item => {
            item.classList.remove('search-match', 'search-non-match');

            const nameElement = item.querySelector('.name');
            if (nameElement) {
                // Restore original text
                nameElement.textContent = nameElement.textContent;
            }
        });
    }
}

export default SearchBar;