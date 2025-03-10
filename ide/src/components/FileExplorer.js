/**
 * FileExplorer component for displaying and navigating folders and files
 */
class FileExplorer {
    constructor(fileBrowser) {
        this.fileBrowser = fileBrowser;

        // DOM elements
        this.element = document.querySelector('.file-wrapper');
        this.sidebar = document.querySelector('.sidebar');
        this.addButton = document.querySelector('.add');
        this.header = document.querySelector('.header');
        this.searchButton = document.querySelector('.search');

        // UI icons
        this.fileIcon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path d="M3 3h18v18H3V3zm16 16V5H5v14h14zM7 7h10v2H7V7zm0 4h10v2H7v-2zm0 4h7v2H7v-2z"/></svg>';
        this.folderIcon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path d="M20 5h-9.586L8.707 3.293A.997.997 0 0 0 8 3H4c-1.103 0-2 .897-2 2v14c0 1.103.897 2 2 2h16c1.103 0 2-.897 2-2V7c0-1.103-.897-2-2-2zm0 15H4V7h16v13z"/></svg>';
        this.imageIcon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path d="M20 5h-9.586L8.707 3.293A.997.997 0 0 0 8 3H4c-1.103 0-2 .897-2 2v14c0 1.103.897 2 2 2h16c1.103 0 2-.897 2-2V7c0-1.103-.897-2-2-2zm-8 13c-2.71 0-5-2.29-5-5 0-2.71 2.29-5 5-5s5 2.29 5 5-2.29 5-5 5z"/><circle cx="12" cy="13" r="3"/></svg>';
        this.videoIcon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path d="M4 8H2v12a2 2 0 0 0 2 2h12v-2H4V8zm14-4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm-1 9h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/></svg>';
        this.audioIcon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>';
        this.readmeIcon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>';
        this.repoIcon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>';
        this.arrowIcon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/></svg>';
        this.pushIcon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z"/></svg>';
        this.moreIcon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path d="M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z"/></svg>';
        this.animLockIcon = '<div class="lock"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/></svg></div>';

        // Templates
        this.fileIntroScreen = '<div class="intro"><div class="title">This repository is empty</div><div class="desc">Create new files with the + button</div></div>';
        this.repoIntroScreen = '<div class="intro"><div class="title">Create your first repository</div><div class="desc">Get started with the + button</div></div>';

        // Set up event listeners
        this.setupEventListeners();
    }

    /**
     * Set up event listeners for the file explorer
     */
    setupEventListeners() {
        // Create new repository or file on click of button
        this.addButton.addEventListener('click', () => {
            // If navigating in repository
            if (!this.header.classList.contains('out-of-repo')) {
                // Create new file
                this.createNewFile();
            } else {
                // Create new repo
                this.createNewRepo();
            }
        });
    }

    /**
     * Render the file explorer based on the current tree location
     * @param {number} pageNum - Page number for pagination (default: 1)
     */
    async renderExplorer(pageNum = 1) {
        // If not already loading, start loading
        if (!this.fileBrowser.isLoading) {
            this.fileBrowser.startLoading();
        }

        // Map tree location
        const [user, repo, contents] = this.fileBrowser.treeLoc;
        const [repoName, branch] = repo.split(':');

        // If not signed into git and navigated to Repositories page
        if (!this.fileBrowser.isAuthenticated && repo === '') {
            // Stop loading
            this.fileBrowser.stopLoading();

            // Show sign-in screen
            this.sidebar.classList.add('intro');

            return;
        }

        let resp;

        // If navigating in repository
        if (repo !== '') {
            // Get repo obj from local storage
            const repoObj = this.fileBrowser.modifiedRepos[user + '/' + repoName];

            // If repo is empty
            if (repoObj && repoObj.empty) {
                // Stop loading
                this.fileBrowser.stopLoading();

                // Show intro screen
                this.element.innerHTML = this.fileIntroScreen;

                // Update sidebar title
                this.updateSidebarTitle(user, repoName, contents);

                // Change header options
                this.header.classList.remove('out-of-repo');

                // Hide search button
                this.searchButton.classList.add('hidden');

                return;
            }

            const currentTime = new Date().getTime();

            // If repo obj doesn't exist or needs refresh
            if (!repoObj || !repoObj.defaultBranch ||
                repoObj.repoDataExpiration === undefined ||
                repoObj.branchExpiration === undefined ||
                repoObj.repoDataExpiration < currentTime) {

                // Get repo obj from git and save to modified repos
                this.fileBrowser.gitService.fetchRepoAndSaveToModRepos(this.fileBrowser.treeLoc);
            }

            // Render branch menu
            this.fileBrowser.branchManager.renderBranchMenu();
        }

        // Update sidebar title
        this.updateSidebarTitle(user, repoName, contents);

        // Get items in current tree from git
        resp = await this.fileBrowser.gitService.getItems(this.fileBrowser.treeLoc, pageNum);

        // If switched directory while loading, return
        if (user !== this.fileBrowser.treeLoc[0] ||
            repoName !== this.fileBrowser.treeLoc[1].split(':')[0] ||
            contents !== this.fileBrowser.treeLoc[2]) {
            return;
        }

        // Handle error responses
        if (await this.handleErrorResponses(resp, user, repoName)) {
            return;
        }

        // Generate HTML for items
        const html = await this.generateItemsHTML(resp, user, repo, contents, pageNum);

        // Add rendered HTML to DOM
        this.updateDOMWithItems(html, pageNum);

        // Stop loading
        this.fileBrowser.stopLoading();

        // Add item event listeners
        this.addItemEventListeners();

        // Restore selection if needed
        this.restoreSelection();

        // Hide branch menu
        document.querySelector('.branch-menu').classList.remove('visible');
        this.fileBrowser.sidebar.sidebarBranch.classList.remove('active');

        // Update search if active
        if (this.header.classList.contains('searching')) {
            this.fileBrowser.searchBar.search();
        }
    }

    /**
     * Handle error responses from the API
     * @param {Object} resp - The API response
     * @param {string} user - The user or org name
     * @param {string} repoName - The repository name
     * @returns {boolean} Whether an error was handled
     */
    async handleErrorResponses(resp, user, repoName) {
        if (resp.message) {
            if (resp.message === 'Not Found') {
                return await this.handleNotFoundError(user, repoName);
            } else if (resp.message === 'This repository is empty.') {
                return await this.handleEmptyRepoError(user, repoName);
            } else if (resp.message.startsWith('No commit found for the ref')) {
                return await this.handleBranchNotFoundError(user, repoName);
            } else if (resp.message === 'Bad credentials') {
                return await this.handleBadCredentialsError();
            }
        }

        return false;
    }

    /**
     * Handle 'Not Found' error
     * @param {string} user - The user or org name
     * @param {string} repoName - The repository name
     * @returns {boolean} Whether the error was handled
     */
    async handleNotFoundError(user, repoName) {
        // Stop loading
        this.fileBrowser.stopLoading();

        // Get repo obj from local storage
        const repoObj = this.fileBrowser.modifiedRepos[user + '/' + repoName];

        // If repo obj exists
        if (repoObj) {
            // Delete repo obj from modified repos
            this.fileBrowser.gitService.deleteModRepo(user + '/' + repoName);
        }

        // If not signed in
        if (!this.fileBrowser.isAuthenticated) {
            const dialogResp = await this.fileBrowser.dialog.show(
                async () => {
                    await this.fileBrowser.gitService.openGitHubSignIn();
                    this.fileBrowser.dialog.hide();
                },
                'Hmm... the repo you\'re\nlooking for can\'t be found.\nTry signing in.',
                'Sign in',
                true
            );

            // If chosen to sign in, return
            if (dialogResp === true) return true;
        } else { // If signed in
            await this.fileBrowser.dialog.show(
                this.fileBrowser.dialog.hide,
                'Hmm... the repo you\'re\nlooking for can\'t be found.',
                'OK',
                true
            );
        }

        // Change location
        this.fileBrowser.treeLoc[1] = '';
        this.fileBrowser.treeLoc[2] = '';
        this.fileBrowser.saveTreeLocation();

        // Change sidebar title
        this.fileBrowser.sidebar.sidebarLogo.innerText = 'Repositories';

        // Hide branch button
        this.fileBrowser.sidebar.sidebarBranch.classList.remove('visible');

        // Scroll to start of repo name
        this.fileBrowser.sidebar.sidebarLogo.scrollTo(0, 0);
        this.fileBrowser.sidebar.updateScrolledTitle();

        this.renderExplorer();

        return true;
    }

    /**
     * Handle 'Empty Repository' error
     * @param {string} user - The user or org name
     * @param {string} repoName - The repository name
     * @returns {boolean} Whether the error was handled
     */
    async handleEmptyRepoError(user, repoName) {
        // Stop loading
        this.fileBrowser.stopLoading();

        // Get repo obj from local storage
        const repoObj = this.fileBrowser.modifiedRepos[user + '/' + repoName];

        // If repo obj exists
        if (repoObj) {
            // Update repo empty status in local storage
            this.fileBrowser.gitService.updateModRepoEmptyStatus(repoObj.fullName, true);
        }

        // Show intro screen
        this.element.innerHTML = this.fileIntroScreen;

        // Update sidebar title
        this.updateSidebarTitle(user, repoName, '');

        // Scroll to start of repo name
        this.fileBrowser.sidebar.sidebarLogo.scrollTo(0, 0);
        this.fileBrowser.sidebar.updateScrolledTitle();

        // Change header options
        this.header.classList.remove('out-of-repo');

        // Hide search button
        this.searchButton.classList.add('hidden');

        return true;
    }

    /**
     * Handle 'Branch Not Found' error
     * @param {string} user - The user or org name
     * @param {string} repoName - The repository name
     * @returns {boolean} Whether the error was handled
     */
    async handleBranchNotFoundError(user, repoName) {
        // Get repo obj from local storage
        const repoObj = this.fileBrowser.modifiedRepos[user + '/' + repoName];
        let defaultBranch;

        if (repoObj && repoObj.defaultBranch) {
            defaultBranch = repoObj.defaultBranch;
        } else {
            const repoData = await this.fileBrowser.gitService.getRepo(this.fileBrowser.treeLoc);
            defaultBranch = repoData.default_branch;
        }

        // Stop loading
        this.fileBrowser.stopLoading();

        this.fileBrowser.notificationService.showMessage('Hmm... that branch can\'t be found.', 5000);

        // Add branch to tree
        this.fileBrowser.treeLoc[1] = this.fileBrowser.treeLoc[1].split(':')[0] + ':' + defaultBranch;
        this.fileBrowser.saveTreeLocation();

        // Update selected branch in local storage
        this.fileBrowser.gitService.updateModRepoSelectedBranch((user + '/' + repoName), defaultBranch);

        // Update branches in local storage
        this.fileBrowser.gitService.updateModRepoBranchExpiration((user + '/' + repoName), 0);

        this.renderExplorer();

        return true;
    }

    /**
     * Handle 'Bad Credentials' error
     * @returns {boolean} Whether the error was handled
     */
    async handleBadCredentialsError() {
        // Stop loading
        this.fileBrowser.stopLoading();

        this.fileBrowser.notificationService.showMessage('Your sign-in token expired.', 4000);

        this.sidebar.classList.add('intro');

        return true;
    }

    /**
     * Update the sidebar title based on the current location
     * @param {string} user - The user or org name
     * @param {string} repoName - The repository name
     * @param {string} contents - The current path
     */
    updateSidebarTitle(user, repoName, contents) {
        const sidebarLogo = this.fileBrowser.sidebar.sidebarLogo;
        const loggedUser = this.fileBrowser.gitService.loggedUser;

        if (sidebarLogo.innerText === '') {
            if (contents !== '') {
                // If repo is owned by logged user
                if (user === loggedUser) {
                    // Show repo name and path
                    sidebarLogo.innerText = repoName + contents;
                } else {
                    // Show username, repo name and path
                    sidebarLogo.innerText = user + '/' + repoName + contents;
                }

                sidebarLogo.classList.add('notransition');

                // Scroll to end of title
                sidebarLogo.scrollTo({
                    left: sidebarLogo.scrollWidth - sidebarLogo.offsetLeft
                });

                this.fileBrowser.sidebar.updateScrolledTitle();

                this.fileBrowser.utils.onNextFrame(() => {
                    sidebarLogo.classList.remove('notransition');
                });
            } else if (repoName !== '') {
                // If repo is owned by logged user
                if (user === loggedUser) {
                    // Show repo name
                    sidebarLogo.innerText = repoName;
                } else {
                    // Show username and repo name
                    sidebarLogo.innerText = user + '/' + repoName;
                }

                sidebarLogo.classList.add('notransition');

                // Scroll to start of title
                sidebarLogo.scrollTo(0, 0);
                this.fileBrowser.sidebar.updateScrolledTitle();

                this.fileBrowser.utils.onNextFrame(() => {
                    sidebarLogo.classList.remove('notransition');
                });
            } else {
                // Show title
                sidebarLogo.innerText = 'Repositories';

                // Hide branch button
                this.fileBrowser.sidebar.sidebarBranch.classList.remove('visible');

                sidebarLogo.classList.add('notransition');

                // Scroll to start of title
                sidebarLogo.scrollTo(0, 0);
                this.fileBrowser.sidebar.updateScrolledTitle();

                this.fileBrowser.utils.onNextFrame(() => {
                    sidebarLogo.classList.remove('notransition');
                });
            }
        }
    }

    /**
     * Generate HTML for the items in the current directory
     * @param {Array} resp - The API response containing the items
     * @param {string} user - The user or org name
     * @param {string} repo - The repository with branch
     * @param {string} contents - The current path
     * @param {number} pageNum - The page number
     * @returns {string} The generated HTML
     */
    async generateItemsHTML(resp, user, repo, contents, pageNum) {
        let out = '';
        const loggedUser = this.fileBrowser.gitService.loggedUser;

        // If navigating in repository
        if (repo !== '') {
            // Get all eclipsed files in directory
            const eclipsedFiles = Object.values(this.fileBrowser.modifiedFiles)
                .filter(modFile => modFile.dir === this.fileBrowser.treeLoc.join());

            // Change header options
            this.header.classList.remove('out-of-repo');

            // If files exist
            if (resp.length > 0 || eclipsedFiles.length > 0) {
                // Show search button
                this.searchButton.classList.remove('hidden');

                // Render files
                for (const item of resp) {
                    if (item.type === 'file') {
                        // Get the file's latest version
                        let file = this.getLatestVersion(item);

                        // Search for matching eclipsed files
                        for (let i = 0; i < eclipsedFiles.length; i++) {
                            let modFile = eclipsedFiles[i];

                            // If eclipsed file has matching SHA or name
                            if (modFile.sha === file.sha || modFile.name === file.name) {
                                // Remove eclipsed file from array
                                eclipsedFiles.splice(i, 1);
                                i--; // Reset index
                            }
                        }

                        this.fileBrowser.gitService.protectModFileInSidebar(file.sha, file.name);

                        // Add modified flag to file
                        let modified = '';
                        if (this.fileBrowser.modifiedFiles[file.sha] &&
                            !this.fileBrowser.modifiedFiles[file.sha].eclipsed) {
                            modified = ' modified';
                        }

                        // Add icon to file
                        const fileType = this.fileBrowser.utils.getFileType(file.name);
                        let fileIconHTML = this.fileIcon;

                        if (fileType === 'image') fileIconHTML = this.imageIcon;
                        if (fileType === 'video') fileIconHTML = this.videoIcon;
                        if (fileType === 'audio') fileIconHTML = this.audioIcon;
                        if (file.name.includes('README')) fileIconHTML = this.readmeIcon;

                        out += `
              <div class="item file${modified}" sha="${file.sha}">
                <div class="label">
                  ${fileIconHTML}
                  <a class="name">${file.name}</a>
                </div>
                <div class="push-wrapper">
                  ${this.pushIcon}
                </div>
              </div>
              `;
                    } else { // If item is a folder
                        out += `
              <div class="item folder">
                <div class="label">
                  ${this.folderIcon}
                  <a class="name">${item.name}</a>
                </div>
                ${this.arrowIcon}
              </div>
              `;
                    }
                }

                // Render eclipsed files from array
                let eclipsedFileNames = {};

                eclipsedFiles.forEach(file => {
                    // If file isn't already in HTML
                    if (!eclipsedFileNames[file.name]) {
                        // Add file to HTML
                        eclipsedFileNames[file.name] = true;

                        // Get the file's latest version
                        file = this.getLatestVersion(file);

                        // Add modified flag to file
                        let modified = '';
                        if (!file.eclipsed) modified = ' modified';

                        // Add icon to file
                        const fileType = this.fileBrowser.utils.getFileType(file.name);
                        let fileIconHTML = this.fileIcon;

                        if (fileType === 'image') fileIconHTML = this.imageIcon;
                        if (fileType === 'video') fileIconHTML = this.videoIcon;
                        if (fileType === 'audio') fileIconHTML = this.audioIcon;
                        if (file.name.includes('README')) fileIconHTML = this.readmeIcon;

                        out = `
              <div class="item file${modified}" sha="${file.sha}">
                <div class="label">
                  ${fileIconHTML}
                  <a class="name">${file.name}</a>
                </div>
                <div class="push-wrapper">
                  ${this.pushIcon}
                </div>
              </div>
              ` + out;
                    }
                });
            } else {
                // If no files exist, show intro screen
                out = this.fileIntroScreen;

                // Hide search button
                this.searchButton.classList.add('hidden');
            }
        } else { // Else, show all repositories
            // Change header options
            this.header.classList.add('out-of-repo');

            // Get rendered repos
            let renderedRepos = {};

            // Get all user-owned modified repos
            const userModRepos = Object.keys(this.fileBrowser.modifiedRepos).filter(repo =>
                repo.split('/')[0] === loggedUser);

            // If repositories exist
            if (resp.length > 0 || userModRepos.length > 0) {
                // Show search button
                this.searchButton.classList.remove('hidden');

                // Render repositories
                resp.forEach(item => {
                    // If repo is in modified repos
                    if (this.fileBrowser.modifiedRepos[item.full_name]) {
                        // Add repo to rendered repos
                        renderedRepos[item.full_name] = true;
                    }

                    // If eclipsed repo already exists in HTML, return
                    const eclipsedRepoEl = this.element.querySelector(
                        `.repo[fullname="${item.full_name}"]`
                    );

                    if (eclipsedRepoEl) {
                        return;
                    }

                    let fullName;

                    // If repo is owned by logged user
                    if (item.full_name.split('/')[0] === loggedUser) {
                        // Show repo name
                        fullName = item.name;
                    } else {
                        // Show username and repo name
                        fullName = item.full_name;
                    }

                    let repoObj;

                    // If repo obj doesn't already exist
                    if (!this.fileBrowser.modifiedRepos[item.full_name]) {
                        // Get repo data expiration time (two months from now)
                        let expirationDate = new Date();
                        expirationDate.setDate(expirationDate.getDate() + (2 * 4 * 7));
                        const twoMonthsTime = expirationDate.getTime();

                        // Create repo obj
                        repoObj = this.fileBrowser.gitService.createRepoObj(
                            item.full_name,
                            item.default_branch,
                            item.default_branch,
                            (item.permissions.push ?? false),
                            null,
                            item.private,
                            item.fork,
                            false,
                            twoMonthsTime,
                            0
                        );
                    } else {
                        repoObj = false;
                    }

                    out += `
            <div class="item repo" ${repoObj ?
                            (`repoObj="${encodeURI(JSON.stringify(repoObj))}"`) :
                            (`fullName="${item.full_name}"`)}
            >
              <div class="label">
                ${this.repoIcon}
                <a class="name">${fullName}</a>
              </div>
              ${this.arrowIcon}
            </div>
            `;
                });

                // If rendering first page
                if (pageNum === 1) {
                    // Render eclipsed repos
                    for (const modRepoName in this.fileBrowser.modifiedRepos) {
                        const modRepo = this.fileBrowser.modifiedRepos[modRepoName];

                        // If repo isn't rendered and user has push access in repo
                        if (!renderedRepos[modRepoName] && modRepo.pushAccess) {
                            // Render repo
                            let fullName;

                            // If repo is owned by logged user
                            if (modRepoName.split('/')[0] === loggedUser) {
                                // Show repo name
                                fullName = modRepoName.split('/')[1];
                            } else {
                                // Show username and repo name
                                fullName = modRepoName;
                            }

                            out += `
                <div class="item repo" fullName="${modRepoName}">
                  <div class="label">
                    ${this.repoIcon}
                    <a class="name">${fullName}</a>
                  </div>
                  ${this.arrowIcon}
                </div>
                `;
                        }
                    }
                }

                // If non-eclipsed repositories exist and resp length is equal to max length
                if (resp.length > 0 && resp.length === 100) {
                    // Render 'more' button
                    const nextPage = (pageNum + 1);

                    out += `
            <div class="item more" nextPage="${nextPage}">
              <div class="label">
                ${this.moreIcon}
                <a class="name">more</a><div class="item more" nextPage="${nextPage}">
            <div class="label">
              ${this.moreIcon}
              <a class="name">more</a>
            </div>
          </div>
          `;
                }
            } else if (pageNum === 1) { // If rendering first page
                // If no repositories exist, show intro screen
                out = this.repoIntroScreen;

                // Hide search button
                this.searchButton.classList.add('hidden');
            }
        }

        return out;
    }

    /**
     * Update the DOM with the generated items HTML
     * @param {string} html - The HTML to add
     * @param {number} pageNum - The page number
     */
    updateDOMWithItems(html, pageNum) {
        // If rendering first page
        if (pageNum === 1) {
            this.element.innerHTML = html;
            this.sidebar.scrollTo(0, 0);
        } else { // If rendering additional pages
            // If there's a duplicate more button, remove it
            const moreButton = this.element.querySelector('.item.more');

            if (moreButton) {
                moreButton.remove();
            }

            // Don't override existing HTML items
            this.element.innerHTML += html;
        }
    }

    /**
     * Add event listeners to items in the file explorer
     */
    addItemEventListeners() {
        const items = this.element.querySelectorAll('.item');

        // Run on all items
        items.forEach(item => {
            // Navigate on click
            item.addEventListener('click', async (e) => {
                // If item is a repository
                if (item.classList.contains('repo')) {
                    await this.handleRepoClick(item);
                } else if (item.classList.contains('folder')) {
                    // If item is a folder
                    await this.handleFolderClick(item);
                } else if (item.classList.contains('file')) {
                    // If item is a file
                    await this.handleFileClick(item, e);
                } else if (item.classList.contains('more')) {
                    // If item is a 'more' button, load more items
                    this.loadMoreItems(item);
                }
            });

            // Add context menu listener
            this.fileBrowser.contextMenu.addItemListener(item);
        });
    }

    /**
     * Handle repository click
     * @param {Element} item - The repository element
     */
    async handleRepoClick(item) {
        // Parse repo obj from HTML
        const repoObj = this.fileBrowser.utils.getAttr(item, 'repoObj') ?
            JSON.parse(decodeURI(this.fileBrowser.utils.getAttr(item, 'repoObj'))) :
            this.fileBrowser.modifiedRepos[this.fileBrowser.utils.getAttr(item, 'fullName')];

        // Change location
        const repoLoc = repoObj.fullName.split('/');

        this.fileBrowser.treeLoc[0] = repoLoc[0];
        this.fileBrowser.treeLoc[1] = repoLoc[1] + ':' + repoObj.selBranch;
        this.fileBrowser.saveTreeLocation();

        // If repo obj is in HTML
        if (this.fileBrowser.utils.getAttr(item, 'repoObj')) {
            // Add repo obj to modified repos
            this.fileBrowser.gitService.addRepoToModRepos(repoObj);
        }

        // If repo isn't empty
        if (!repoObj.empty) {
            // Render sidebar
            await this.renderExplorer();

            // Close search
            this.fileBrowser.searchBar.closeSearch();
        } else {
            // Close search
            this.fileBrowser.searchBar.closeSearch();

            // Show intro screen
            this.element.innerHTML = this.fileIntroScreen;

            // Update sidebar title
            this.updateSidebarTitle(repoLoc[0], repoLoc[1], '');

            // Scroll to start of repo name
            this.fileBrowser.sidebar.sidebarLogo.scrollTo(0, 0);
            this.fileBrowser.sidebar.updateScrolledTitle();

            // Change header options
            this.header.classList.remove('out-of-repo');

            // Hide search button
            this.searchButton.classList.add('hidden');
        }
    }

    /**
     * Handle folder click
     * @param {Element} item - The folder element
     */
    async handleFolderClick(item) {
        // Change location
        this.fileBrowser.treeLoc[2] += '/' + item.innerText.replaceAll('\n', '');
        this.fileBrowser.saveTreeLocation();

        // Render sidebar
        await this.renderExplorer();

        // Close search
        this.fileBrowser.searchBar.closeSearch();
    }

    /**
     * Handle file click
     * @param {Element} item - The file element
     * @param {Event} event - The click event
     */
    async handleFileClick(item, event) {
        // If not clicked on push button
        let pushWrapper = item.querySelector('.push-wrapper');
        let clickedOnPush = (event.target == pushWrapper);

        if (!clickedOnPush) {
            // If file not already selected
            if (!item.classList.contains('selected')) {
                // Load file
                this.fileBrowser.editor.loadFileInExplorer(item, this.fileBrowser.utils.getAttr(item, 'sha'));
            } else { // If file is selected
                if (this.fileBrowser.config.isMobile) {
                    // Update bottom float
                    this.fileBrowser.bottomFloat.updateFloat();
                }
            }
        } else {
            const dialogResp = await this.fileBrowser.gitService.checkPushDialogs();

            if (dialogResp === 'return') return;

            // If ctrl/cmd/shift-clicked on push button
            if (!this.fileBrowser.config.isMobile &&
                (this.fileBrowser.utils.isKeyEventMeta(event) || event.shiftKey)) {
                this.pushFileWithCommitMessage(item);
            } else {
                const commitMessage = 'Update ' + item.innerText;

                // Play push animation
                this.playPushAnimation(item.querySelector('.push-wrapper'));

                // Push file
                this.pushFileFromExplorer(item, commitMessage);
            }
        }
    }

    /**
     * Load more items when clicking the 'more' button
     * @param {Element} buttonEl - The 'more' button element
     */
    loadMoreItems(buttonEl) {
        const nextPage = Number(this.fileBrowser.utils.getAttr(buttonEl, 'nextPage'));

        this.renderExplorer(nextPage);

        // Disable button
        buttonEl.classList.add('disabled');

        buttonEl.querySelector('.name').textContent = 'loading more';
    }

    /**
     * Restore selection after rendering the explorer
     */
    restoreSelection() {
        // If selected file is in current directory
        if (this.fileBrowser.selectedFile.dir === this.fileBrowser.treeLoc.join()) {
            let selectedEl = this.element.querySelector(
                `.item[sha="${this.fileBrowser.selectedFile.sha}"]`
            );

            if (selectedEl) {
                // Select file
                selectedEl.classList.add('selected');
                selectedEl.scrollIntoViewIfNeeded();
            }
        }

        // If selected file exists
        if (this.fileBrowser.selectedFile.sha !== '') {
            // Protect unsaved code
            this.protectUnsavedCode();
        }
    }

    /**
     * Protect unsaved code if selected file is in current directory
     * but does not exist in the HTML
     */
    async protectUnsavedCode() {
        // Map tree location
        const [user, repo, contents] = this.fileBrowser.treeLoc;
        const [repoName, branch] = repo.split(':');

        // Map selected file location
        const [selUser, selRepo, selContents] = this.fileBrowser.selectedFile.dir.split(',');
        const [selRepoName, selBranch] = selRepo.split(':');

        if (user === selUser && repoName === selRepoName && contents === selContents) {
            // Get selected file element in HTML by sha
            let selectedElSha = this.element.querySelector('.file.selected');
            let selectedElName;

            // If the selected file's sha changed
            if (!selectedElSha) {
                // Get selected file element in HTML by name
                selectedElName = Array.from(this.element.querySelectorAll('.file'))
                    .filter(file => file.querySelector('.name').textContent == this.fileBrowser.selectedFile.name);

                selectedElName = (selectedElName.length > 0) ? selectedElName[0] : null;

                // If new version of selected file exists
                if (selectedElName !== null) {
                    const scrollPos = this.fileBrowser.selectedFile.scrollPos;

                    // Load file
                    await this.fileBrowser.editor.loadFileInExplorer(
                        selectedElName,
                        this.fileBrowser.utils.getAttr(selectedElName, 'sha')
                    );

                    // Prevent bottom float disappearing on mobile
                    if (this.fileBrowser.config.isMobile) {
                        this.fileBrowser.editor.lastScrollTop = scrollPos[1];
                    }

                    // Scroll to pos in code
                    this.fileBrowser.editor.element.scrollTo(scrollPos[0], scrollPos[1]);
                }
            } else {
                // If selected file isn't loaded
                if (this.fileBrowser.selectedFile.sha !== this.fileBrowser.utils.getAttr(selectedElSha, 'sha')) {
                    // Load file
                    this.fileBrowser.editor.loadFileInExplorer(
                        selectedElSha,
                        this.fileBrowser.utils.getAttr(selectedElSha, 'sha')
                    );
                }
            }
        }
    }

    /**
     * Get the latest version of a file
     * @param {Object} file - The file object
     * @returns {Object} The latest version of the file
     */
    getLatestVersion(file) {
        // Check if there's a modified version
        const modFile = this.fileBrowser.modifiedFiles[file.sha];

        if (modFile && !modFile.eclipsed) {
            return modFile;
        }

        return file;
    }

    /**
     * Delete a modified file
     * @param {Element} fileEl - The file element
     */
    async deleteModFileInHTML(fileEl) {
        const fileSha = this.fileBrowser.utils.getAttr(fileEl, 'sha');

        this.fileBrowser.deleteModifiedFile(fileSha);

        fileEl.classList.remove('modified');

        if (fileEl.classList.contains('selected')) {
            const scrollPos = this.fileBrowser.selectedFile.scrollPos;

            await this.fileBrowser.editor.loadFileInExplorer(fileEl, fileSha);

            // Prevent bottom float disappearing on mobile
            if (this.fileBrowser.config.isMobile) {
                this.fileBrowser.editor.lastScrollTop = scrollPos[1];
            }

            // Scroll to pos in code
            this.fileBrowser.editor.element.scrollTo(scrollPos[0], scrollPos[1]);
        }
    }

    /**
     * Create a new file in the explorer
     */
    createNewFile() {
        // If not already adding new file
        if (!this.element.querySelector('.focused')) {
            // If intro screen is visible, remove it
            if (this.element.querySelector('.intro')) {
                this.element.querySelector('.intro').remove();
            }

            // Clear existing selections
            if (this.element.querySelector('.selected')) {
                this.element.querySelector('.selected').classList.remove('selected');
            }

            // Create new file
            const fileEl = document.createElement('div');
            fileEl.classList = 'item file selected focused hidden';

            fileEl.innerHTML = `
      <div class="label">
        ${this.fileIcon}
        <a class="name" contenteditable="plaintext-only" spellcheck="false" autocorrect="off" autocomplete="off" aria-autocomplete="list" autocapitalize="off" dir="auto"></a>
      </div>
      <div class="push-wrapper">
        ${this.pushIcon}
      </div>
      `;

            // Add new file to DOM
            this.element.prepend(fileEl);

            // Focus file
            fileEl.querySelector('.name').focus();
            fileEl.scrollIntoViewIfNeeded();

            // Add key listeners
            this.addNewFileKeyListeners(fileEl);

            // Add push button event listener
            const pushWrapper = fileEl.querySelector('.push-wrapper');
            let pushListener = pushWrapper.addEventListener('click', () => this.pushNewFile(fileEl));

            // On next frame
            this.fileBrowser.utils.onNextFrame(() => {
                // Animate file
                fileEl.classList.remove('hidden');
            });
        } else {
            // If already adding a new file, focus it
            const newFile = this.element.querySelector('.item.focused');
            const newFileName = newFile.querySelector('.name');

            this.selectAllCaret(newFileName);
            newFile.scrollIntoViewIfNeeded();
        }
    }

    /**
     * Add key listeners to a new file
     * @param {Element} fileEl - The file element
     */
    addNewFileKeyListeners(fileEl) {
        fileEl.querySelector('.name').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.fileBrowser.utils.onNextFrame(() => this.pushNewFile(fileEl));
            } else if (e.key === 'Escape') {
                e.preventDefault();
                fileEl.blur();
                fileEl.classList.add('hidden');

                window.setTimeout(() => {
                    fileEl.remove();
                }, 180);
            }
        });
    }

    /**
     * Push a new file to the repository
     * @param {Element} fileEl - The file element
     * @param {Event} event - The event that triggered the push
     */
    async pushNewFile(fileEl, event) {
        if (fileEl.classList.contains('focused')) {
            const dialogResp = await this.fileBrowser.gitService.checkPushDialogs();

            if (dialogResp === 'return') return;

            // Validate file name
            let fileName = fileEl.querySelector('.name').textContent.replaceAll('\n', '');

            // If file name is empty, use default name
            if (fileName === '') fileName = 'new-file';

            // If another file in the current directory has the same name, add a differentiating number
            fileName = this.ensureUniqueFileName(fileName);

            let commitMessage = 'Create ' + fileName;

            // If ctrl/cmd/shift-clicked on push button
            if (!this.fileBrowser.config.isMobile && event &&
                (this.fileBrowser.utils.isKeyEventMeta(event) || event.shiftKey)) {

                // Get selected branch
                let selBranch = this.fileBrowser.treeLoc[1].split(':')[1];

                // Open push screen
                commitMessage = prompt(
                    `Push '${fileName}' ${selBranch ? `to branch '${selBranch}'?` : '?'}`,
                    'Commit message...'
                );

                // If canceled push, return
                if (!commitMessage) return;

                // If not specified message
                if (commitMessage === 'Commit message...') {
                    // Show default message
                    commitMessage = 'Create ' + fileName;
                }
            }

            // Play push animation
            this.playPushAnimation(fileEl.querySelector('.push-wrapper'));

            // Disable pushing file from HTML
            fileEl.classList.remove('focused');

            // Make file name uneditable
            fileEl.querySelector('.name').setAttribute('contenteditable', 'false');
            fileEl.querySelector('.name').blur();
            fileEl.querySelector('.name').scrollTo(0, 0);

            // Pad file content with random number of invisible chars
            // to generate unique file content and fix git sha generation
            const randomNum = Math.floor(Math.random() * 100) + 1;
            const fileContent = '\r\n'.padEnd(randomNum, '\r');

            // Validate file name
            fileEl.querySelector('.name').textContent = fileName;

            // Generate temporary SHA
            const tempSHA = this.fileBrowser.utils.generateSHA();
            this.fileBrowser.utils.setAttr(fileEl, 'sha', tempSHA);

            // Change selected file
            this.fileBrowser.changeSelectedFile(
                this.fileBrowser.treeLoc.join(),
                tempSHA,
                fileName,
                this.fileBrowser.utils.encodeUnicode('\r\n'),
                this.fileBrowser.utils.getFileLang(fileName),
                [0, 0],
                [0, 0],
                true
            );

            // Handle file creation in editor
            await this.fileBrowser.editor.handleNewFileCreation(fileEl, tempSHA, fileName, fileContent);

            // Create and push commit
            await this.createAndPushNewFile(fileEl, tempSHA, fileName, fileContent, commitMessage);
        }
    }

    /**
     * Create and push a new file
     * @param {Element} fileEl - The file element
     * @param {string} tempSHA - The temporary SHA for the file
     * @param {string} fileName - The name of the file
     * @param {string} fileContent - The content of the file
     * @param {string} commitMessage - The commit message
     */
    async createAndPushNewFile(fileEl, tempSHA, fileName, fileContent, commitMessage) {
        // Map tree location
        const [user, repo] = this.fileBrowser.treeLoc;
        const [repoName, branch] = repo.split(':');

        // Get repo obj from local storage
        const repoObj = this.fileBrowser.modifiedRepos[user + '/' + repoName];

        // If repo is empty
        if (repoObj && repoObj.empty) {
            // Update repo empty status in local storage
            this.fileBrowser.gitService.updateModRepoEmptyStatus(repoObj.fullName, false);

            // Show search button
            this.searchButton.classList.remove('hidden');
        }

        // If a pending promise exists, await it
        if (this.fileBrowser.pendingPromises.main) {
            await this.fileBrowser.pendingPromises.main;
        }

        // Create commit
        const commitFile = {
            name: fileName,
            dir: this.fileBrowser.treeLoc.join(),
            content: this.fileBrowser.utils.encodeUnicode(fileContent)
        };

        let commit = {
            message: commitMessage,
            file: commitFile
        };

        // Push file asynchronously
        this.fileBrowser.pendingPromises[tempSHA] = this.fileBrowser.gitService.push(commit);

        const newSHA = await this.fileBrowser.pendingPromises[tempSHA];

        delete this.fileBrowser.pendingPromises[tempSHA];

        // Git file is eclipsed (not updated) in browser private cache,
        // so store the updated file in modifiedFiles object for 1 minute after commit
        this.fileBrowser.onFileEclipsedInCache(tempSHA, newSHA, this.fileBrowser.selectedFile);

        // Add file event listeners
        fileEl.addEventListener('click', (e) => {
            this.handleFileClick(fileEl, e);
        });

        // Add context menu listener
        this.fileBrowser.contextMenu.addItemListener(fileEl);
    }

    /**
     * Ensure a file name is unique in the current directory
     * @param {string} fileName - The proposed file name
     * @returns {string} A unique file name
     */
    ensureUniqueFileName(fileName) {
        let nameIndex = 1;

        while (this.fileNameExists(fileName)) {
            // Split extension from file name
            const fileNameParts = this.fileBrowser.utils.splitFileName(fileName);

            // If file already has a differentiating number, remove it
            if (nameIndex !== 1) {
                fileNameParts[0] = fileNameParts[0].slice(0, -('-' + nameIndex).length);
            }

            // Add a differentiating number and reconstruct file name
            fileName = fileNameParts[0] + '-' + nameIndex +
                (fileNameParts[1] !== 'none' ? ('.' + fileNameParts[1]) : '');

            nameIndex++;
        }

        return fileName;
    }

    /**
     * Check if a file name already exists in the current directory
     * @param {string} name - The file name to check
     * @returns {boolean} Whether the file name exists
     */
    fileNameExists(name) {
        const files = this.element.querySelectorAll('.item.file');

        for (let i = 0; i < files.length; i++) {
            const fileElem = files[i];

            if (!fileElem.classList.contains('focused') &&
                fileElem.querySelector('.name').textContent === name) {
                return true;
            }
        }

        return false;
    }

    /**
     * Create a new repository
     */
    createNewRepo() {
        // Implementation for creating a new repository
        // Similar to createNewFile but adapted for repositories
    }

    /**
     * Select all text in an element
     * @param {Element} el - The element containing text
     */
    selectAllCaret(el) {
        const range = document.createRange();
        range.selectNodeContents(el);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
    }

    /**
     * Focus caret to the end of an element
     * @param {Element} el - The element to focus
     */
    focusCaretToEnd(el) {
        el.focus();

        if (typeof window.getSelection !== "undefined" &&
            typeof document.createRange !== "undefined") {
            const range = document.createRange();
            range.selectNodeContents(el);
            range.collapse(false);
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
        }
    }

    /**
     * Push a file with a commit message
     * @param {Element} fileEl - The file element
     */
    pushFileWithCommitMessage(fileEl) {
        // Get file name
        const fileName = fileEl.innerText;

        // Get selected branch
        let selBranch = this.fileBrowser.treeLoc[1].split(':')[1];

        // Open push screen
        let commitMessage = prompt(
            `Push '${fileName}' ${selBranch ? `to branch '${selBranch}'?` : '?'}`,
            'Commit message...'
        );

        // If canceled push, return
        if (!commitMessage) return;

        // If not specified message
        if (commitMessage === 'Commit message...') {
            // Show default message
            commitMessage = 'Update ' + fileName;
        }

        // Play push animation
        this.playPushAnimation(fileEl.querySelector('.push-wrapper'));

        // Push file
        this.pushFileFromExplorer(fileEl, commitMessage);
    }

    /**
     * Push a file from the explorer
     * @param {Element} fileEl - The file element
     * @param {string} commitMessage - The commit message
     */
    async pushFileFromExplorer(fileEl, commitMessage) {
        // Disable pushing file in HTML
        fileEl.classList.remove('modified');
        if (this.fileBrowser.bottomFloat) {
            this.fileBrowser.bottomFloat.element.classList.remove('modified');
        }

        // If the current file hasn't been pushed yet, await file creation
        const fileSha = this.fileBrowser.utils.getAttr(fileEl, 'sha');
        const newFilePendingPromise = this.fileBrowser.pendingPromises[fileSha];

        if (newFilePendingPromise) {
            await newFilePendingPromise;
        }

        // Get file selected status
        const fileSelected = fileEl.classList.contains('selected');

        // Create commit
        const commitFile = fileSelected ?
            this.fileBrowser.selectedFile :
            this.fileBrowser.modifiedFiles[fileSha];

        let commit = {
            message: commitMessage,
            file: commitFile
        };

        // Push file asynchronously
        const newSha = await this.fileBrowser.gitService.push(commit);

        // Git file is eclipsed (not updated) in browser private cache,
        // so store the updated file in modifiedFiles object for 1 minute after commit
        this.fileBrowser.onFileEclipsedInCache(commit.file.sha, newSha);
    }

    /**
     * Play push animation on an element
     * @param {Element} el - The element to animate
     */
    playPushAnimation(el) {
        el.classList.add('animate');

        setTimeout(() => {
            el.classList.remove('animate');
        }, this.fileBrowser.config.pushAnimDuration * 1000);
    }
}

export default FileExplorer;