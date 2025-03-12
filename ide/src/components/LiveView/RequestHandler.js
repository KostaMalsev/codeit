/**
 * Request handler for LiveView component
 * Handles file requests from the live view iframe
 */
class RequestHandler {
    constructor(liveView) {
        this.liveView = liveView;
        this.fileBrowser = liveView.fileBrowser;
        this.config = liveView.config;
        this.utils = liveView.utils;
    }

    /**
     * Handle live view request for file content
     * @param {string} requestPath - The requested path
     * @returns {Object} Response with file content and status
     */
    async handleRequest(requestPath) {
        // if requesting base path
        if (requestPath.split('?')[0] === this.liveView.livePath) {
            // return live file
            return {
                fileContent: this.utils.decodeUnicode(this.liveView.liveFile.content),
                respStatus: 200
            };
        } else {
            return await this.handleResourceRequest(requestPath);
        }
    }

    /**
     * Handle request for a resource file
     * @param {string} requestPath - The requested path
     * @returns {Object} Response with file content and status
     */
    async handleResourceRequest(requestPath) {
        // map file dir
        let [fileUser, fileRepo, fileContents] = this.liveView.liveFile.dir.split(',');

        // get file name
        const fileName = requestPath.split('/').slice(-1)[0];

        // Resolve the file path
        fileContents = this.resolveFilePath(requestPath, fileContents);

        // map file dir
        const liveFileDir = [fileUser, fileRepo, fileContents];

        // Try to get the file
        return await this.getRequestedFile(liveFileDir, fileName);
    }

    /**
     * Resolve the file path based on the request path
     * @param {string} requestPath - The requested path
     * @param {string} fileContents - Current file contents path
     * @returns {string} Resolved file path
     */
    resolveFilePath(requestPath, fileContents) {
        // get file name
        const fileName = requestPath.split('/').slice(-1)[0];

        // if requesting path above
        if (!requestPath.includes(this.liveView.livePath)) {
            return this.resolvePathAbove(requestPath, fileName);
        } else {
            // if requesting path below
            return this.resolvePathBelow(requestPath, fileContents, fileName);
        }
    }

    /**
     * Resolve path for requests to paths above current directory
     * @param {string} requestPath - The requested path
     * @param {string} fileName - The file name
     * @returns {string} Resolved file path
     */
    resolvePathAbove(requestPath, fileName) {
        let fileContents = '';

        // slice origin from request to get directory path
        let dirPath = requestPath.slice(window.location.origin.length);
        dirPath = dirPath.replace('/run', '/_');

        dirPath = dirPath.split('/_');

        // if didn't request uppermost directory
        if (dirPath.length !== 1) {
            // don't count file name in directory array
            const traveseDir = (this.liveView.livePathLength + 1) - (dirPath.length - 1);

            // split file contents
            fileContents = fileContents.split('/');

            // traverse dir backwards
            for (let i = 0; i < traveseDir; i++) fileContents.pop();

            // join file contents
            fileContents = fileContents.join('/');
        }

        // get path down
        let pathDown = dirPath[dirPath.length - 1];

        // slice file name from relative path
        pathDown = pathDown.slice(0, (-fileName.length - 1));

        // add path down to file directory
        fileContents += pathDown;

        return fileContents;
    }

    /**
     * Resolve path for requests to paths below current directory
     * @param {string} requestPath - The requested path
     * @param {string} fileContents - Current file contents path
     * @param {string} fileName - The file name
     * @returns {string} Resolved file path
     */
    resolvePathBelow(requestPath, fileContents, fileName) {
        // slice live path from request to get relative path
        let relPath = requestPath.slice(this.liveView.livePath.length);

        // slice file name from relative path
        relPath = relPath.slice(0, (-fileName.length - 1));

        // if relative path exists
        if (relPath) {
            // add relative path to live file path
            fileContents += '/' + relPath;
        }

        return fileContents;
    }

    /**
     * Get the requested file either from modified files or from Git
     * @param {Array} liveFileDir - Directory path components
     * @param {string} fileName - The file name
     * @returns {Object} Response with file content and status
     */
    async getRequestedFile(liveFileDir, fileName) {
        // search modified files for file
        let modFile = this.findModifiedFile(liveFileDir, fileName);

        if (modFile) {
            return await this.getModifiedFile(modFile);
        } else {
            return await this.getFileFromGit(liveFileDir, fileName);
        }
    }

    /**
     * Find a file in modified files
     * @param {Array} liveFileDir - Directory path components
     * @param {string} fileName - The file name
     * @returns {Object|null} The modified file or null if not found
     */
    findModifiedFile(liveFileDir, fileName) {
        let modFile = Object.values(this.fileBrowser.modifiedFiles).filter(file =>
            (file.dir == liveFileDir.join(',') && file.name == fileName))[0];

        // if modified file exists
        if (modFile) {
            // get the file's latest version
            return this.utils.getLatestVersion(modFile);
        }

        return null;
    }

    /**
     * Get content from a modified file
     * @param {Object} modFile - The modified file
     * @returns {Object} Response with file content and status
     */
    async getModifiedFile(modFile) {
        // return modified file content
        const respContent = modFile.content;

        // decode base64 file with browser
        const dataURL = 'data:application/octet-stream;base64,' + respContent;

        // send (instant) request
        const response = await fetch(dataURL);

        // get data from response
        const respObj = (await (response.body.getReader()).read()).value;

        // return response data
        return {
            fileContent: respObj,
            respStatus: 200
        };
    }

    /**
     * Get file from Git
     * @param {Array} liveFileDir - Directory path components
     * @param {string} fileName - The file name
     * @returns {Object} Response with file content and status
     */
    async getFileFromGit(liveFileDir, fileName) {
        const [fileUser, fileRepo] = liveFileDir;

        // get repo obj from local storage
        const repoObj = this.fileBrowser.modifiedRepos[fileUser + '/' + fileRepo.split(':')[0]];

        // if not signed in or repository is public
        if (this.fileBrowser.gitToken === '' || (repoObj && !repoObj.private)) {
            return await this.getPublicFile(liveFileDir, fileName);
        } else {
            return await this.getPrivateFile(liveFileDir, fileName);
        }
    }

    /**
     * Get public file from Git
     * @param {Array} liveFileDir - Directory path components
     * @param {string} fileName - The file name
     * @returns {Object} Response with file content and status
     */
    async getPublicFile(liveFileDir, fileName) {
        // get public file from git as ReadableStream
        const respObj = await this.fileBrowser.git.getPublicFileAsStream(liveFileDir, fileName);

        // if couldn't fetch file
        if (respObj.errorCode) {
            // return an error
            return {
                fileContent: '',
                respStatus: respObj.errorCode
            };
        }

        // check if file is stored with Git LFS
        const fileContentStr = new TextDecoder().decode(respObj);
        const isLFS = fileContentStr.startsWith('version https://git-lfs.github.com/spec/');

        if (isLFS) {
            return await this.getPublicLFSFile(liveFileDir, fileName);
        }

        // return response data
        return {
            fileContent: respObj,
            respStatus: A
        };
    }

    /**
     * Get public LFS file from Git
     * @param {Array} liveFileDir - Directory path components
     * @param {string} fileName - The file name
     * @returns {Object} Response with file content and status
     */
    async getPublicLFSFile(liveFileDir, fileName) {
        const respObj = await this.fileBrowser.git.getPublicLFSFileAsStream(liveFileDir, fileName);

        // if couldn't fetch file
        if (respObj.errorCode) {
            // return an error
            return {
                fileContent: '',
                respStatus: respObj.errorCode
            };
        }

        // return response data
        return {
            fileContent: respObj,
            respStatus: 200
        };
    }

    /**
     * Get private file from Git
     * @param {Array} liveFileDir - Directory path components
     * @param {string} fileName - The file name
     * @returns {Object} Response with file content and status
     */
    async getPrivateFile(liveFileDir, fileName) {
        // get file from git
        let resp = await this.fileBrowser.git.getFile(liveFileDir, fileName);

        // if file is over 1MB
        if ((resp.errors && resp.errors.length > 0 && resp.errors[0].code === 'too_large') ||
            (resp.size && resp.size >= 1000000 && resp.content === '')) {

            // fetch file directory
            const dirResp = await this.fileBrowser.git.getItems(liveFileDir);

            // find file in directory
            const fileObj = dirResp.filter(file => file.name === fileName)[0];

            // if file exists
            if (fileObj) {
                // fetch file from blob API (up to 100MB)
                resp = await this.fileBrowser.git.getBlob(liveFileDir, fileObj.sha);
            }
        }

        // if couldn't fetch file
        if (resp.message) {
            // return an error
            let respStatus = 400;
            if (resp.message === 'Not Found') respStatus = 404;

            return {
                fileContent: '',
                respStatus: respStatus
            };
        }

        // return contents from git response
        const respContent = resp.content;

        // decode base64 file with browser
        const dataURL = 'data:application/octet-stream;base64,' + respContent;

        // send (instant) request
        const response = await fetch(dataURL);

        // get data from response
        const respObj = (await (response.body.getReader()).read()).value;

        // return response data
        return {
            fileContent: respObj,
            respStatus: 200
        };
    }
}

export default RequestHandler;      