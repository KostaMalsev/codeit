/**
 * BranchManager component for handling branch-related operations
 */
class BranchManager {
    constructor(fileBrowser) {
        this.fileBrowser = fileBrowser;

        // DOM elements
        this.sidebarBranch = this.fileBrowser.sidebar.sidebarBranch;
        this.branchMenu = document.querySelector('.branch-menu');

        // Icons
        this.branchIcon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path d="M17 6.06a3 3 0 0 0-1.15 5.77A2 2 0 0 1 14 13.06h-4a3.91 3.91 0 0 0-2 .56V7.88a3 3 0 1 0-2 0v8.36a3 3 0 1 0 2.16.05A2 2 0 0 1 10 15.06h4a4 4 0 0 0 3.91-3.16A3 3 0 0 0 17 6.06zm-10-2a1 1 0 1 1-1 1 1 1 0 0 1 1-1zm0 16a1 1 0 1 1 1-1 1 1 0 0 1-1 1zm10-10a1 1 0 1 1 1-1 1 1 0 0 1-1 1z"/></svg>';
        this.branchMoreIcon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>';
        this.branchPlusIcon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/></svg>';

        this.setupEventListeners();
    }

    /**
     * Set up event listeners for the branch manager
     */
    setupEventListeners() {
        // If clicked on branch icon, toggle branch menu
        this.sidebarBranch.addEventListener('click', () => {
            this.branchMenu.classList.toggle('visible');
            this.sidebarBranch.classList.toggle('active');

            if (this.branchMenu.classList.contains('visible')) {
                // Move branch menu to icon
                const topOffset = this.fileBrowser.config.isSafari ? 23 : 13;
                this.fileBrowser.utils.moveElToEl(
                    this.branchMenu,
                    this.sidebarBranch,
                    topOffset,
                    { top: -16 }
                );

                this.branchMenu.scrollTo(0, 0);
            }
        });

        // Hide branch menu when clicked anywhere else
        if (!this.fileBrowser.config.isMobile) {
            document.addEventListener('mousedown', (e) => this.checkBranchMenu(e));
        } else {
            document.addEventListener('touchstart', (e) => this.checkBranchMenu(e));
        }
    }

    /**
     * Check if click was outside branch menu and hide if necessary
     * @param {Event} e - The mouse/touch event
     */
    checkBranchMenu(e) {
        // If branch menu is visible
        if (this.branchMenu.classList.contains('visible')) {
            const notClickedOnMenu = (e.target != this.branchMenu && e.target != this.sidebarBranch);
            const notClickedOnMenuChild = (
                (e.target.parentElement && e.target.parentElement != this.branchMenu) &&
                (e.target.parentElement.parentElement && e.target.parentElement.parentElement != this.branchMenu)
            );

            if (notClickedOnMenu && notClickedOnMenuChild) {
                // Hide branch menu
                this.branchMenu.classList.remove('visible');
                this.sidebarBranch.classList.remove('active');
            }
        }
    }

    /**
     * Render the branch menu
     * @param {boolean} renderAll - Whether to render all branches
     */
    async renderBranchMenu(renderAll) {
        // Map tree location
        let [user, repo, contents] = this.fileBrowser.treeLoc;

        // Get repository branch
        let [repoName, selectedBranch] = repo.split(':');

        // Check if repository object exists
        const fullName = user + '/' + repoName;
        let repoObj = this.fileBrowser.modifiedRepos[fullName];

        let branchResp;

        // Get current time
        let currentDate = new Date();
        const currentTime = currentDate.getTime();

        currentDate.setDate(currentDate.getDate() + 1);
        const dayFromNow = currentDate.getTime();

        // If repo obj exists with valid branches and expiration
        if (repoObj && repoObj.branches &&
            repoObj.branchExpiration !== undefined &&
            repoObj.branchExpiration >= currentTime) {

            // Get repository branches from repo obj
            branchResp = repoObj.branches;
        }

        // If branch menu isn't already rendered
        if (this.fileBrowser.utils.getAttr(this.branchMenu, 'tree') !== [user, repoName, contents].join()) {
            // Show loading message
            this.branchMenu.innerHTML = '<div class="icon" style="pointer-events: none; opacity: .5; font-weight: 500;"><a>Loading...</a></div>';

            this.fileBrowser.utils.setAttr(this.branchMenu, 'tree', [user, repoName, contents].join());
        }

        // If branch resp isn't already stored in local storage
        if (!repoObj || !repoObj.branches ||
            repoObj.branchExpiration === undefined ||
            repoObj.branchExpiration < currentTime) {

            // Get branches for repository
            branchResp = await this.fileBrowser.gitService.getBranches(this.fileBrowser.treeLoc);

            // If repo doesn't exist, return
            if (branchResp.message) {
                return;
            }

            // Clean resp and save only relevant fields
            const cleanedResp = branchResp.map(branch => {
                return {
                    name: branch.name,
                    commit: {
                        sha: branch.commit.sha
                    }
                };
            });

            // Save branch resp in local storage
            this.fileBrowser.gitService.updateModRepoBranches(fullName, cleanedResp);

            // Save branch expiration date in local storage
            this.fileBrowser.gitService.updateModRepoBranchExpiration(fullName, dayFromNow);
        }

        // If repository has more than one branch, show branch button
        if (branchResp && branchResp.length > 1) {
            this.sidebarBranch.classList.add('visible');
        } else {
            return;
        }

        // Save rendered HTML
        let out = '';

        // Render selected branch

        // If selected branch is not defined
        if (!selectedBranch) {
            repoObj = this.fileBrowser.modifiedRepos[fullName];

            // If default branch isn't fetched yet
            if (!repoObj.selBranch) {
                // Await fetch
                await this.fileBrowser.repoPromise;

                repoObj = this.fileBrowser.modifiedRepos[fullName];
            }

            // Add branch to tree
            this.fileBrowser.treeLoc[1] = repo + ':' + repoObj.selBranch;
            this.fileBrowser.saveTreeLocation();

            // Update selected branch
            selectedBranch = repoObj.selBranch;
        }

        const selBranchObj = branchResp.filter(branch => branch.name === selectedBranch)[0];

        out += `<div class="icon selected">${this.branchIcon}<a>${selectedBranch}</a></div>`;

        // If clicked on show more button, render all branches
        if (renderAll) {
            // Run on all branches
            branchResp.forEach(branch => {
                // Don't render selected branch twice
                if (branch.name !== selectedBranch) {
                    out += `<div class="icon">${this.branchIcon}<a>${branch.name}</a></div>`;
                }
            });
        }

        // Render show more button
        if (!renderAll && branchResp.length > 1) {
            out += `<div class="icon see-more">${this.branchMoreIcon}<a>more</a></div>`;
        }

        // Render new branch button
        // out += `<div class="icon new-branch">${this.branchPlusIcon}<a>new branch</a></div>`;

        // Wait for menu animation to finish
        window.setTimeout(() => {
            // Add rendered HTML to DOM
            this.branchMenu.innerHTML = out;

            // Add branch event listeners
            this.addBranchEventListeners(branchResp, repoName, selectedBranch, selBranchObj, fullName, renderAll);
        }, (renderAll ? 0 : 180));
    }

    /**
     * Add event listeners to branch menu items
     * @param {Array} branchResp - The branch response from the API
     * @param {string} repoName - The repository name
     * @param {string} selectedBranch - The selected branch
     * @param {Object} selBranchObj - The selected branch object
     * @param {string} fullName - The full repository name
     * @param {boolean} renderAll - Whether all branches are rendered
     */
    addBranchEventListeners(branchResp, repoName, selectedBranch, selBranchObj, fullName, renderAll) {
        let branches = this.branchMenu.querySelectorAll('.icon');

        // Run on all branches
        branches.forEach(branch => {
            // Select branch on click
            branch.addEventListener('click', async () => {
                // If clicked on branch, not a special button
                if (!branch.classList.contains('new-branch') && !branch.classList.contains('see-more')) {
                    // Hide branch menu
                    this.branchMenu.classList.remove('visible');
                    this.sidebarBranch.classList.remove('active');

                    // If branch isn't already selected
                    if (!branch.classList.contains('selected')) {
                        // Change location
                        selectedBranch = branch.querySelector('a').textContent;
                        this.fileBrowser.treeLoc[1] = repoName + ':' + selectedBranch;
                        this.fileBrowser.saveTreeLocation();

                        // Update selected branch in local storage
                        this.fileBrowser.gitService.updateModRepoSelectedBranch(fullName, selectedBranch);

                        // Render sidebar
                        this.fileBrowser.fileExplorer.renderExplorer();
                    }
                } else if (branch.classList.contains('see-more')) { // If clicked on show more button
                    // Render branch menu
                    this.renderBranchMenu(true);

                    // If on mobile, reposition branch menu
                    if (this.fileBrowser.config.isMobile) {
                        this.fileBrowser.utils.onNextFrame(() => {
                            this.fileBrowser.utils.moveElToEl(this.branchMenu, this.sidebarBranch, 13, { top: -16 });
                        });
                    }
                } else if (branch.classList.contains('new-branch')) { // If clicked on new branch button
                    await this.createNewBranch(selectedBranch, selBranchObj, repoName, fullName);
                }
            });
        });
    }

    /**
     * Create a new branch
     * @param {string} selectedBranch - The selected branch
     * @param {Object} selBranchObj - The selected branch object
     * @param {string} repoName - The repository name
     * @param {string} fullName - The full repository name
     */
    async createNewBranch(selectedBranch, selBranchObj, repoName, fullName) {
        let newBranchName = prompt(`New branch from '${selectedBranch}':`, 'branch name');

        if (newBranchName) {
            // Replace all special chars in name with dashes
            const specialChars = this.fileBrowser.utils.validateString(newBranchName);

            if (specialChars) {
                specialChars.forEach(char => { newBranchName = newBranchName.replaceAll(char, '-') });
            }

            // Hide branch menu
            this.branchMenu.classList.remove('visible');
            this.sidebarBranch.classList.remove('active');

            // Start loading
            this.fileBrowser.startLoading();

            // Get origin branch SHA
            const shaToBranchFrom = selBranchObj.commit.sha;

            // Create branch
            await this.fileBrowser.gitService.createBranch(
                this.fileBrowser.treeLoc,
                shaToBranchFrom,
                newBranchName
            );

            // Update selected branch in local storage
            this.fileBrowser.gitService.updateModRepoSelectedBranch(fullName, selectedBranch);

            // Clear branch resp from local storage
            this.fileBrowser.gitService.updateModRepoBranches(fullName, false);

            // Change location
            this.fileBrowser.treeLoc[1] = repoName + ':' + newBranchName;
            this.fileBrowser.saveTreeLocation();

            // Render sidebar
            this.fileBrowser.fileExplorer.renderExplorer();
        }
    }
}

export default BranchManager;