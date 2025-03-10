/**
 * RepoModel representing a repository in the file browser
 */
class RepoModel {
    /**
     * Create a new RepoModel
     * @param {Object} data - The repository data
     * @param {string} data.fullName - The full repository name (user/repo)
     * @param {string} data.selBranch - The selected branch
     * @param {string} data.defaultBranch - The default branch
     * @param {boolean} data.pushAccess - Whether the user has push access
     * @param {Array} data.branches - The repository branches
     * @param {boolean} data.private - Whether the repository is private
     * @param {boolean} data.fork - Whether the repository is a fork
     * @param {boolean} data.empty - Whether the repository is empty
     * @param {number} data.repoDataExpiration - The repository data expiration time
     * @param {number} data.branchExpiration - The branch data expiration time
     */
    constructor(data = {}) {
        this.fullName = data.fullName || '';
        this.selBranch = data.selBranch || '';
        this.defaultBranch = data.defaultBranch || '';
        this.pushAccess = data.pushAccess !== undefined ? data.pushAccess : null;
        this.branches = data.branches || null;
        this.private = data.private !== undefined ? data.private : false;
        this.fork = data.fork !== undefined ? data.fork : false;
        this.empty = data.empty !== undefined ? data.empty : false;
        this.repoDataExpiration = data.repoDataExpiration || 0;
        this.branchExpiration = data.branchExpiration || 0;
    }

    /**
     * Convert to JSON representation
     * @returns {Object} The JSON representation
     */
    toJSON() {
        return {
            fullName: this.fullName,
            selBranch: this.selBranch,
            defaultBranch: this.defaultBranch,
            pushAccess: this.pushAccess,
            branches: this.branches,
            private: this.private,
            fork: this.fork,
            empty: this.empty,
            repoDataExpiration: this.repoDataExpiration,
            branchExpiration: this.branchExpiration
        };
    }

    /**
     * Create a RepoModel from JSON
     * @param {Object} json - The JSON representation
     * @returns {RepoModel} The created RepoModel
     */
    static fromJSON(json) {
        return new RepoModel(json);
    }

    /**
     * Update repository branches
     * @param {Array} branches - The new branches
     */
    updateBranches(branches) {
        this.branches = branches;
    }

    /**
     * Update branch expiration
     * @param {number} expirationTime - The new expiration time
     */
    updateBranchExpiration(expirationTime) {
        this.branchExpiration = expirationTime;
    }

    /**
     * Update selected branch
     * @param {string} branch - The new selected branch
     */
    updateSelectedBranch(branch) {
        this.selBranch = branch;
    }

    /**
     * Update repository empty status
     * @param {boolean} isEmpty - The new empty status
     */
    updateEmptyStatus(isEmpty) {
        this.empty = isEmpty;
    }

    /**
     * Update push access
     * @param {boolean} hasAccess - Whether the user has push access
     */
    updatePushAccess(hasAccess) {
        this.pushAccess = hasAccess;
    }

    /**
     * Check if repository data is expired
     * @param {number} currentTime - The current time
     * @returns {boolean} Whether the repository data is expired
     */
    isRepoDataExpired(currentTime) {
        return this.repoDataExpiration < currentTime;
    }

    /**
     * Check if branch data is expired
     * @param {number} currentTime - The current time
     * @returns {boolean} Whether the branch data is expired
     */
    isBranchDataExpired(currentTime) {
        return this.branchExpiration < currentTime;
    }

    /**
     * Get repository owner
     * @returns {string} The repository owner
     */
    getOwner() {
        return this.fullName.split('/')[0];
    }

    /**
     * Get repository name
     * @returns {string} The repository name
     */
    getName() {
        return this.fullName.split('/')[1];
    }

    /**
     * Get repository URL
     * @returns {string} The repository URL
     */
    getUrl() {
        return `https://github.com/${this.fullName}`;
    }

    /**
     * Create a copy of the repository
     * @returns {RepoModel} A copy of the repository
     */
    clone() {
        return new RepoModel(this.toJSON());
    }
}

export default RepoModel;