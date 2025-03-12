/**
 * HTML renderer for LiveView component
 * Handles rendering of HTML files in an iframe
 */
class HTMLRenderer {
    constructor(liveView) {
        this.liveView = liveView;
        this.fileBrowser = liveView.fileBrowser;
        this.config = liveView.config;
        this.utils = liveView.utils;
    }

    /**
     * Render HTML in live view
     * @param {Object} file - The file to render
     */
    async render(file) {
        // if service worker isn't installed yet
        if (this.fileBrowser.workerInstallPromise) {
            // wait until finished installing
            await this.fileBrowser.workerInstallPromise;
        }

        if (!this.fileBrowser.workerClientId) {
            await this.fileBrowser.workerInstallPromise;
        }

        this.createIframe(file);
        this.setupConsoleIfNeeded();
    }

    /**
     * Create iframe for HTML content
     * @param {Object} file - The file to render in the iframe
     */
    createIframe(file) {

        //TBD@@ not understand this, but let's add it from legacy code:
        const livePathLength = 15; // +1
        const livePath = window.location.origin + '/run/' + '_/'.repeat(livePathLength);

        liveView.innerHTML = `<iframe src="` + livePath + '?' + workerClientId + '/' + `" name="Live view" title="Live view" class="live-frame" allow="accelerometer; camera; encrypted-media; display-capture; geolocation; gyroscope; microphone; midi; clipboard-read; clipboard-write; payment" allowfullscreen="true" allowtransparency="true" loading="eager" sandbox="allow-downloads allow-forms allow-modals allow-pointer-lock allow-popups allow-presentation allow-scripts allow-same-origin"></iframe>`;

        /*const iframeSrc = `${this.liveView.livePath}?${this.fileBrowser.workerClientId}/`;

        this.liveView.element.innerHTML = `<iframe 
            src="${iframeSrc}" 
            name="Live view" 
            title="Live view" 
            class="live-frame" 
            allow="accelerometer; camera; encrypted-media; display-capture; geolocation; gyroscope; microphone; midi; clipboard-read; clipboard-write; payment" 
            allowfullscreen="true" 
            allowtransparency="true" 
            loading="eager" 
            sandbox="allow-downloads allow-forms allow-modals allow-pointer-lock allow-popups allow-presentation allow-scripts allow-same-origin">
        </iframe>`;*/

        // Store the file for request handling
        this.liveView.liveFile = file;

        // Add load event listener to show content when loaded
        const liveFrame = this.liveView.element.querySelector('.live-frame');
        liveFrame.addEventListener('load', () => {
            this.liveView.element.classList.add('loaded');
        });
    }

    /**
     * Set up console logging for mobile devices
     */
    setupConsoleIfNeeded() {
        if (!this.config.isMobile) return;

        const consoleSheet = this.fileBrowser.consoleSheet;
        const liveFrame = this.liveView.element.querySelector('.live-frame');
        const liveFrameWindow = liveFrame.contentWindow;

        // Clear live view console
        consoleSheet.clearLogs();

        // Setup live view console
        this.fileBrowser.logger.init(
            liveFrameWindow,
            consoleSheet.logCallback.bind(consoleSheet)
        );
    }
}

export default HTMLRenderer;