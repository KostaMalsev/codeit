/**
 * GitAuth service for handling GitHub authentication
 * This module handles GitHub OAuth authentication flow
 */

/**
 * Initialize the GitHub authentication
 * @param {FileBrowser} fileBrowser - The main FileBrowser instance
 * @returns {Promise<void>} A promise that resolves when initialization is complete
 */
export async function initialize(fileBrowser) {
    // Get stored token
    let gitToken = fileBrowser.storageService.getItem('gitToken') ?? '';
    if (gitToken === 'undefined') {
        gitToken = '';
    }

    // Store token in GitService
    fileBrowser.gitService.token = gitToken;

    // Process URL parameters
    const linkData = decodeLink(window.location.href);

    // Clear URL
    window.history.replaceState(
        window.location.origin,
        'Codeit',
        window.location.origin + '/full'
    );

    // Set tree location from link data or localStorage
    if (linkData.dir) {
        fileBrowser.treeLoc = linkData.dir;
        fileBrowser.saveTreeLocation();
    } else {
        // Get tree location from storage
        const storedTreeLoc = fileBrowser.storageService.getItem('tree');
        fileBrowser.treeLoc = storedTreeLoc ? storedTreeLoc.split(',') : ['', '', ''];

        // If repo doesn't have a branch (legacy treeLoc)
        if (fileBrowser.treeLoc[1] && !fileBrowser.treeLoc[1].includes(':')) {
            // Add default branch to repo
            fileBrowser.treeLoc[1] += ':main';
            fileBrowser.saveTreeLocation();
        }
    }

    // Get logged user from localStorage
    let loggedUser = fileBrowser.storageService.getItem('loggedUser');
    if (loggedUser) {
        try {
            // Try to parse if it's a JSON object
            const userData = JSON.parse(loggedUser);
            // Save just the login name
            fileBrowser.storageService.setItem('loggedUser', userData.login);
            loggedUser = userData.login;
        } catch (e) {
            // If parsing fails, the value is already a string
        }
    } else {
        loggedUser = null;
    }
    fileBrowser.gitService.loggedUser = loggedUser;

    // Set up sign-in button event listener
    fileBrowser.ui.signInButton.addEventListener('click', () => {
        openGitHubSignIn(fileBrowser);
    });

    // Set up message listener for OAuth callback
    setupMessageListener(fileBrowser);

    // Handle GitHub code if present in URL
    if (linkData.gitCode) {
        await handleGitHubCode(fileBrowser, linkData.gitCode);
    }
}

/**
 * Set up message listener for OAuth callback
 * @param {FileBrowser} fileBrowser - The main FileBrowser instance
 */
function setupMessageListener(fileBrowser) {
    window.addEventListener('message', async (event) => {
        // If received a git code
        if (event.origin === window.location.origin &&
            event.data && event.data.startsWith('gitCode=')) {

            // Hide intro screen
            fileBrowser.ui.sidebar.classList.remove('intro');

            // If on Repositories page
            if (fileBrowser.treeLoc[1] === '') {
                updateUIForRepositoriesPage(fileBrowser);
            }

            // If on Safari, refresh header color
            if (fileBrowser.config.isSafari) {
                refreshSafariHeaderColor(fileBrowser);
            }

            // Start loading
            fileBrowser.startLoading();

            // Show message
            fileBrowser.notificationService.showMessage('Signing in...', -1);

            // Update legacy workflow permission
            fileBrowser.storageService.setItem('hasWorkflowPermission', 'true');

            const gitCode = event.data.split('gitCode=')[1];

            // Get git token from GitHub
            await getGithubToken(fileBrowser, gitCode);

            // Clear modified repos
            fileBrowser.modifiedRepos = {};
            fileBrowser.saveModifiedRepos();

            // Hide message
            if (fileBrowser.ui.messageEl.textContent === 'Signing in...') {
                fileBrowser.notificationService.hideMessage();
            }

            // Render sidebar
            fileBrowser.fileExplorer.renderExplorer();
        }
    });
}

/**
 * Update UI for Repositories page
 * @param {FileBrowser} fileBrowser - The main FileBrowser instance
 */
function updateUIForRepositoriesPage(fileBrowser) {
    // Show sidebar title
    fileBrowser.ui.sidebarLogo.innerText = 'Repositories';

    // Hide branch button
    fileBrowser.ui.sidebarBranch.classList.remove('visible');

    fileBrowser.ui.sidebarLogo.classList.add('notransition');

    // Scroll to start of title
    fileBrowser.ui.sidebarLogo.scrollTo(0, 0);
    fileBrowser.sidebar.updateScrolledTitle();

    fileBrowser.utils.onNextFrame(() => {
        fileBrowser.ui.sidebarLogo.classList.remove('notransition');
    });
}

/**
 * Refresh Safari header color
 * @param {FileBrowser} fileBrowser - The main FileBrowser instance
 */
function refreshSafariHeaderColor(fileBrowser) {
    document.querySelector('meta[name="theme-color"]').content = '#313744';

    fileBrowser.utils.onNextFrame(() => {
        document.querySelector('meta[name="theme-color"]').content = '#1a1c24';
    });
}

// Track GitHub sign-in windows
let openGitHubSignInWindow;
let openGitHubSignInListener;

/**
 * Open GitHub sign-in window or redirect
 * @param {FileBrowser} fileBrowser - The main FileBrowser instance
 * @returns {Promise<void>} A promise that resolves when authentication is complete
 */
export function openGitHubSignIn(fileBrowser) {
    return new Promise(resolve => {
        const authURL = 'https://github.com/login/oauth/authorize?client_id=7ede3eed3185e59c042d&scope=repo,user,write:org,workflow';

        if (fileBrowser.config.isMobile) {
            window.location.href = authURL;
        } else {
            if (openGitHubSignInWindow) {
                openGitHubSignInWindow.close();
                window.removeEventListener('message', openGitHubSignInListener);
            }

            openGitHubSignInListener = (event) => {
                // If received a git code
                if (event.origin === window.location.origin &&
                    event.data.startsWith('gitCode=')) {
                    window.removeEventListener('message', openGitHubSignInListener);
                    resolve();
                }
            };

            window.addEventListener('message', openGitHubSignInListener);

            // Open sign-in window
            openGitHubSignInWindow = window.open(
                authURL,
                'Sign in with GitHub',
                'height=575,width=575'
            );
        }
    });
}

/**
 * Handle GitHub code from URL or message
 * @param {FileBrowser} fileBrowser - The main FileBrowser instance
 * @param {string} gitCode - The GitHub authorization code
 */
async function handleGitHubCode(fileBrowser, gitCode) {
    // Hide intro screen
    fileBrowser.ui.sidebar.classList.remove('intro');

    // If on Repositories page
    if (fileBrowser.treeLoc[1] === '') {
        // Show sidebar title
        fileBrowser.ui.sidebarLogo.innerText = 'Repositories';
    }

    // Handle sidebar visibility
    if (fileBrowser.storageService.getItem('sidebar') === 'true') {
        // Don't transition
        fileBrowser.ui.body.classList.add('notransition');

        fileBrowser.sidebar.toggle(true);

        fileBrowser.utils.onNextFrame(() => {
            fileBrowser.ui.body.classList.remove('notransition');
        });

        // If on Safari, refresh header color
        if (fileBrowser.config.isSafari) {
            document.querySelector('meta[name="theme-color"]').content = '#313744';

            fileBrowser.utils.onNextFrame(() => {
                document.querySelector('meta[name="theme-color"]').content = '#1a1c24';
            });
        }
    } else {
        // If on Safari, refresh header color
        if (fileBrowser.config.isSafari) {
            document.querySelector('meta[name="theme-color"]').content = '#1a1c24';

            fileBrowser.utils.onNextFrame(() => {
                document.querySelector('meta[name="theme-color"]').content = '#313744';
            });
        }
    }

    // Start loading
    fileBrowser.startLoading();
    fileBrowser.ui.body.classList.add('loaded');
    fileBrowser.notificationService.showMessage('Signing in...', -1);

    // Update legacy workflow permission
    fileBrowser.storageService.setItem('hasWorkflowPermission', 'true');

    // Get git token from GitHub
    await getGithubToken(fileBrowser, gitCode);

    // Clear modified repos
    fileBrowser.modifiedRepos = {};
    fileBrowser.saveModifiedRepos();

    // Hide message
    if (fileBrowser.ui.messageEl.textContent === 'Signing in...') {
        fileBrowser.notificationService.hideMessage();
    }
}

/**
 * Get GitHub token using authorization code
 * @param {FileBrowser} fileBrowser - The main FileBrowser instance
 * @param {string} gitCode - The GitHub authorization code
 */
async function getGithubToken(fileBrowser, gitCode) {
    // Post through CORS proxy to git with clientId, clientSecret and code
    const resp = await axios.get(
        window.location.origin + '/api/cors?url=' +
        'https://github.com/login/oauth/access_token?' +
        'client_id=7ede3eed3185e59c042d' +
        '&client_secret=c1934d5aab1c957800ea8e84ce6a24dda6d68f45' +
        '&code=' + gitCode,
        '',
        true
    );

    // Parse token from response
    const gitToken = resp.split('access_token=')[1].split('&')[0];

    // Save git token
    fileBrowser.gitService.token = gitToken;
    fileBrowser.storageService.setItem('gitToken', gitToken);

    // If logged user doesn't exist
    if (fileBrowser.storageService.getItem('loggedUser') === null) {
        // Get logged user
        const userData = await axios.get('https://api.github.com/user', gitToken);
        const loggedUser = userData.login;

        // Store logged user
        fileBrowser.gitService.loggedUser = loggedUser;
        fileBrowser.storageService.setItem('loggedUser', loggedUser);
    }
}

/**
 * Decode link data from URL
 * @param {string} url - The URL to decode
 * @returns {Object} The decoded link data
 */
function decodeLink(url) {
    // This function would need to be implemented based on your linkData schema
    // Placeholder implementation:
    return {
        dir: null,
        gitCode: url.includes('?code=') ? url.split('?code=')[1].split('&')[0] : null
    };
}

export default {
    initialize,
    openGitHubSignIn
};