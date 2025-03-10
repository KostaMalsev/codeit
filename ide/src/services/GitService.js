/**
 * GitService for handling Git interactions
 */
class GitService {
    constructor(fileBrowser) {
        this.fileBrowser = fileBrowser;

        // Authentication state
        this.token = this.fileBrowser.storageService.getItem('gitToken') || '';
        this.loggedUser = this.fileBrowser.storageService.getItem('loggedUser') || '';

        // API base URL
        this.apiUrl = 'https://api.github.com';
    }

    /**
     * Get items (files and folders) for the current tree location
     * @param {Array} treeLoc - The current tree location [user, repo, path]
     * @param {number} pageNum - The page number for pagination
     * @returns {Promise<Object>} The API response
     */
    async getItems(treeLoc, pageNum = 1) {
        const [user, repo, path] = treeLoc;
        const [repoName, branch] = repo.split(':');

        if (repo === '') {
            // Get repositories
            return this.getRepositories(pageNum);
        } else {
            // Get repository contents
            return this.getRepositoryContents(user, repoName, branch, path, pageNum);
        }
    }

    /**
     * Get repositories for the authenticated user
     * @param {number} pageNum - The page number
     * @returns {Promise<Array>} The repositories
     */
    async getRepositories(pageNum) {
        try {
            const url = `${this.apiUrl}/user/repos?page=${pageNum}&per_page=100&sort=updated`;

            const response = await fetch(url, {
                headers: {
                    'Authorization': `token ${this.token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            if (!response.ok) {
                throw new Error(`GitHub API returned ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching repositories:', error);
            return { message: error.message };
        }
    }

    /**
     * Get repository contents
     * @param {string} user - The user or org name
     * @param {string} repoName - The repository name
     * @param {string} branch - The branch name
     * @param {string} path - The path within the repository
     * @returns {Promise<Array>} The repository contents
     */
    async getRepositoryContents(user, repoName, branch, path, pageNum) {
        try {
            // Normalize path
            let normalizedPath = path;
            if (normalizedPath.startsWith('/')) {
                normalizedPath = normalizedPath.substring(1);
            }

            const url = `${this.apiUrl}/repos/${user}/${repoName}/contents/${normalizedPath}` +
                (branch ? `?ref=${branch}` : '');

            const response = await fetch(url, {
                headers: {
                    'Authorization': `token ${this.token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            if (!response.ok) {
                if (response.status === 404) {
                    return { message: 'Not Found' };
                }
                throw new Error(`GitHub API returned ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching repository contents:', error);
            return { message: error.message };
        }
    }

    /**
     * Get a file from GitHub
     * @param {Array} treeLoc - The tree location
     * @param {string} fileName - The file name
     * @returns {Promise<Object>} The file content
     */
    async getFile(treeLoc, fileName) {
        try {
            const [user, repo, path] = treeLoc;
            const [repoName, branch] = repo.split(':');

            // Construct the path to the file
            let filePath = path ? (path + '/' + fileName) : fileName;

            // Remove leading slash if present
            if (filePath.startsWith('/')) {
                filePath = filePath.substring(1);
            }

            const url = `${this.apiUrl}/repos/${user}/${repoName}/contents/${filePath}` +
                (branch ? `?ref=${branch}` : '');

            const response = await fetch(url, {
                headers: {
                    'Authorization': `token ${this.token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            if (!response.ok) {
                if (response.status === 404) {
                    return { message: 'Not Found' };
                }
                throw new Error(`GitHub API returned ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching file:', error);
            return { message: error.message };
        }
    }

    /**
     * Push a file to GitHub
     * @param {Object} commit - The commit object
     * @returns {Promise<string>} The new SHA of the file
     */
    async push(commit) {
        try {
            const [user, repo, path] = commit.file.dir.split(',');
            const [repoName, branch] = repo.split(':');

            // Construct the path to the file
            let filePath = path ? path + '/' + commit.file.name : commit.file.name;

            // Remove leading slash if present
            if (filePath.startsWith('/')) {
                filePath = filePath.substring(1);
            }

            // Get existing file to get its SHA (needed for updates)
            let existingSha = null;

            try {
                const existing = await this.getFile([user, repo, path], commit.file.name);
                existingSha = existing.sha;
            } catch (error) {
                // File doesn't exist, which is fine for new files
            }

            const url = `${this.apiUrl}/repos/${user}/${repoName}/contents/${filePath}`;

            const data = {
                message: commit.message,
                content: commit.file.content,
                branch: branch
            };

            // If updating existing file, include its SHA
            if (existingSha) {
                data.sha = existingSha;
            }

            const response = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${this.token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/vnd.github.v3+json'
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                throw new Error(`GitHub API returned ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            return result.content.sha;
        } catch (error) {
            console.error('Error pushing file:', error);
            this.fileBrowser.notificationService.showMessage('Error pushing file: ' + error.message, 5000);
            return null;
        }
    }

    /**
     * Get branches for a repository
     * @param {Array} treeLoc - The tree location
     * @returns {Promise<Array>} The branches
     */
    async getBranches(treeLoc) {
        try {
            const [user, repo] = treeLoc;
            const repoName = repo.split(':')[0];

            const url = `${this.apiUrl}/repos/${user}/${repoName}/branches`;

            const response = await fetch(url, {
                headers: {
                    'Authorization': `token ${this.token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            if (!response.ok) {
                throw new Error(`GitHub API returned ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching branches:', error);
            return { message: error.message };
        }
    }

    /**
     * Create a new branch
     * @param {Array} treeLoc - The tree location
     * @param {string} sha - The SHA to branch from
     * @param {string} branchName - The new branch name
     * @returns {Promise<Object>} The create branch response
     */
    async createBranch(treeLoc, sha, branchName) {
        try {
            const [user, repo] = treeLoc;
            const repoName = repo.split(':')[0];

            const url = `${this.apiUrl}/repos/${user}/${repoName}/git/refs`;

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `token ${this.token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/vnd.github.v3+json'
                },
                body: JSON.stringify({
                    ref: `refs/heads/${branchName}`,
                    sha: sha
                })
            });

            if (!response.ok) {
                throw new Error(`GitHub API returned ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error creating branch:', error);
            this.fileBrowser.notificationService.showMessage(
                'Error creating branch: ' + error.message,
                5000
            );
            return { message: error.message };
        }
    }

    /**
     * Get repository information
     * @param {Array} treeLoc - The tree location
     * @returns {Promise<Object>} The repository information
     */
    async getRepo(treeLoc) {
        try {
            const [user, repo] = treeLoc;
            const repoName = repo.split(':')[0];

            const url = `${this.apiUrl}/repos/${user}/${repoName}`;

            const response = await fetch(url, {
                headers: {
                    'Authorization': `token ${this.token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            if (!response.ok) {
                throw new Error(`GitHub API returned ${response.status}: ${response.statusText}`);
            }

            const repoData = await response.json();

            // Update repo in modified repos
            this.fetchRepoAndSaveToModRepos(treeLoc, repoData);

            return repoData;
        } catch (error) {
            console.error('Error fetching repository:', error);
            return { message: error.message };
        }
    }

    /**
     * Fork a repository
     * @param {Array} treeLoc - The tree location
     * @returns {Promise<Object>} The fork response
     */
    async forkRepo(treeLoc) {
        try {
            const [user, repo] = treeLoc;
            const repoName = repo.split(':')[0];

            const url = `${this.apiUrl}/repos/${user}/${repoName}/forks`;

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `token ${this.token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            if (!response.ok) {
                throw new Error(`GitHub API returned ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error forking repository:', error);
            this.fileBrowser.notificationService.showMessage(
                'Error forking repository: ' + error.message,
                5000
            );
            return { message: error.message };
        }
    }

    /**
       * Create a new repository
       * @param {string} repoName - The repository name
       * @param {boolean} isPrivate - Whether the repository is private
       * @returns {Promise<Object>} The create repository response
       */
    async createRepo(repoName, isPrivate) {
        try {
            const url = `${this.apiUrl}/user/repos`;

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `token ${this.token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/vnd.github.v3+json'
                },
                body: JSON.stringify({
                    name: repoName,
                    private: isPrivate,
                    auto_init: true
                })
            });

            if (!response.ok) {
                throw new Error(`GitHub API returned ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error creating repository:', error);
            this.fileBrowser.notificationService.showMessage(
                'Error creating repository: ' + error.message,
                5000
            );
            return { message: error.message };
        }
    }

    /**
     * Fetch repository and save to modified repos
     * @param {Array} treeLoc - The tree location
     * @param {Object} existingRepoData - Optional existing repo data
     */
    async fetchRepoAndSaveToModRepos(treeLoc, existingRepoData = null) {
        try {
            const [user, repo] = treeLoc;
            const [repoName, branch] = repo.split(':');

            // Create a promise that will be resolved when the repo is fetched
            this.fileBrowser.repoPromise = (async () => {
                try {
                    // If repo data wasn't provided, fetch it
                    const repoData = existingRepoData || await this.getRepo(treeLoc);

                    // Get expiration dates
                    const twoMonthsTime = new Date();
                    twoMonthsTime.setDate(twoMonthsTime.getDate() + (2 * 30)); // approximately 2 months

                    const dayFromNow = new Date();
                    dayFromNow.setDate(dayFromNow.getDate() + 1);

                    // Create repo object
                    const repoObj = this.createRepoObj(
                        repoData.full_name,
                        branch || repoData.default_branch,
                        repoData.default_branch,
                        repoData.permissions ? repoData.permissions.push : true,
                        null,
                        repoData.private,
                        repoData.fork,
                        false,
                        twoMonthsTime.getTime(),
                        dayFromNow.getTime()
                    );

                    // Add repo to modified repos
                    this.addRepoToModRepos(repoObj);

                    return repoObj;
                } catch (error) {
                    console.error('Error in fetchRepoAndSaveToModRepos:', error);
                    throw error;
                } finally {
                    this.fileBrowser.repoPromise = null;
                }
            })();

            return await this.fileBrowser.repoPromise;
        } catch (error) {
            console.error('Error fetching repository data:', error);
            this.fileBrowser.repoPromise = null;
            throw error;
        }
    }

    /**
     * Create a repository object
     * @param {string} fullName - The full repository name (user/repo)
     * @param {string} selBranch - The selected branch
     * @param {string} defaultBranch - The default branch
     * @param {boolean} pushAccess - Whether the user has push access
     * @param {Array} branches - The repository branches
     * @param {boolean} isPrivate - Whether the repository is private
     * @param {boolean} fork - Whether the repository is a fork
     * @param {boolean} empty - Whether the repository is empty
     * @param {number} repoDataExpiration - The repository data expiration time
     * @param {number} branchExpiration - The branch data expiration time
     * @returns {Object} The repository object
     */
    createRepoObj(
        fullName,
        selBranch,
        defaultBranch,
        pushAccess,
        branches,
        isPrivate,
        fork,
        empty,
        repoDataExpiration,
        branchExpiration
    ) {
        return {
            fullName,
            selBranch,
            defaultBranch,
            pushAccess,
            branches,
            private: isPrivate,
            fork,
            empty,
            repoDataExpiration,
            branchExpiration
        };
    }

    /**
     * Add a repository to modified repos
     * @param {Object} repoObj - The repository object
     */
    addRepoToModRepos(repoObj) {
        this.fileBrowser.modifiedRepos[repoObj.fullName] = repoObj;
        this.fileBrowser.saveModifiedRepos();
    }

    /**
     * Delete a repository from modified repos
     * @param {string} repoFullName - The full repository name
     */
    deleteModRepo(repoFullName) {
        delete this.fileBrowser.modifiedRepos[repoFullName];
        this.fileBrowser.saveModifiedRepos();
    }

    /**
     * Update repository branches in modified repos
     * @param {string} repoFullName - The full repository name
     * @param {Array|false} branches - The branches or false to clear
     */
    updateModRepoBranches(repoFullName, branches) {
        if (!this.fileBrowser.modifiedRepos[repoFullName]) return;

        this.fileBrowser.modifiedRepos[repoFullName].branches = branches;
        this.fileBrowser.saveModifiedRepos();
    }

    /**
     * Update branch expiration in modified repos
     * @param {string} repoFullName - The full repository name
     * @param {number} expirationTime - The expiration time
     */
    updateModRepoBranchExpiration(repoFullName, expirationTime) {
        if (!this.fileBrowser.modifiedRepos[repoFullName]) return;

        this.fileBrowser.modifiedRepos[repoFullName].branchExpiration = expirationTime;
        this.fileBrowser.saveModifiedRepos();
    }

    /**
     * Update selected branch in modified repos
     * @param {string} repoFullName - The full repository name
     * @param {string} branch - The selected branch
     */
    updateModRepoSelectedBranch(repoFullName, branch) {
        if (!this.fileBrowser.modifiedRepos[repoFullName]) return;

        this.fileBrowser.modifiedRepos[repoFullName].selBranch = branch;
        this.fileBrowser.saveModifiedRepos();
    }

    /**
     * Update repository empty status in modified repos
     * @param {string} repoFullName - The full repository name
     * @param {boolean} isEmpty - Whether the repository is empty
     */
    updateModRepoEmptyStatus(repoFullName, isEmpty) {
        if (!this.fileBrowser.modifiedRepos[repoFullName]) return;

        this.fileBrowser.modifiedRepos[repoFullName].empty = isEmpty;
        this.fileBrowser.saveModifiedRepos();
    }

    /**
     * Protect a modified file in the sidebar
     * @param {string} fileSha - The file SHA
     * @param {string} fileName - The file name
     */
    protectModFileInSidebar(fileSha, fileName) {
        // If file is not modified
        if (!this.fileBrowser.modifiedFiles[fileSha]) {
            // Check if old modified file with same name and directory exists
            const oldModFile = Object.values(this.fileBrowser.modifiedFiles).filter(
                modFile => (
                    modFile.dir === this.fileBrowser.treeLoc.join() &&
                    modFile.name === fileName &&
                    !modFile.eclipsed
                )
            )[0];

            if (oldModFile) {
                const oldFileSha = oldModFile.sha;

                // Update old modified file with new sha
                oldModFile.sha = fileSha;

                // Save new modified file in local storage
                this.fileBrowser.modifiedFiles[fileSha] = oldModFile;

                // Delete old modified file
                delete this.fileBrowser.modifiedFiles[oldFileSha];

                this.fileBrowser.saveModifiedFiles();
            }
        }
    }

    /**
     * Check dialogs for push operations
     * @returns {Promise<string|undefined>} 'return' if operation should be canceled
     */
    async checkPushDialogs() {
        // If not signed in to git
        if (this.token === '') {
            this.fileBrowser.dialog.show(
                async () => {
                    await this.openGitHubSignIn();
                    this.fileBrowser.dialog.hide();
                },
                'Sign in to push this file.',
                'Sign in'
            );

            return 'return';
        }

        // Get repo obj from local storage
        const [user, repo, contents] = this.fileBrowser.treeLoc;
        const repoName = repo.split(':')[0];

        let repoObj = this.fileBrowser.modifiedRepos[user + '/' + repoName];

        // If repo obj isn't fetched yet
        if (!repoObj || repoObj.pushAccess === null) {
            // Await repo obj promise
            if (this.fileBrowser.repoPromise) {
                this.fileBrowser.notificationService.showMessage('Just a sec..', -1);

                await this.fileBrowser.repoPromise;

                repoObj = this.fileBrowser.modifiedRepos[user + '/' + repoName];

                this.fileBrowser.notificationService.hideMessage();
            } else {
                return 'return';
            }
        }

        // If user doesn't have push access in repo
        if (repoObj.pushAccess === false) {
            const dialogResult = await this.fileBrowser.dialog.show(
                async () => {
                    await this.forkRepo(this.fileBrowser.treeLoc);
                    this.fileBrowser.dialog.hide();
                    return true;
                },
                'Fork this repository\nto push your changes.',
                'Fork'
            );

            if (dialogResult === false) return 'return';
        } else { // If user has push access in repo
            // If pushing a git workflow file, request legacy additional permissions
            if (this.fileBrowser.storageService.getItem('hasWorkflowPermission') === null &&
                this.fileBrowser.treeLoc[2] === '/.github/workflows') {
                this.fileBrowser.dialog.show(
                    async () => {
                        await this.openGitHubSignIn();
                        this.fileBrowser.dialog.hide();
                    },
                    'To push this file, request\nGit workflow access.',
                    'Open'
                );

                return 'return';
            }
        }
    }

    /**
     * Open GitHub sign in page
     */
    async openGitHubSignIn() {
        // In a real implementation, this would redirect to GitHub OAuth
        // or open a popup for authentication
        console.log('Opening GitHub sign in...');

        // Example implementation:
        // window.location.href = '/auth/github';
    }
}

export default GitService;