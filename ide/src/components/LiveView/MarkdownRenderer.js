/**
 * Markdown renderer for LiveView component
 * Handles rendering of Markdown files
 */
class MarkdownRenderer {
    constructor(liveView) {
        this.liveView = liveView;
        this.fileBrowser = liveView.fileBrowser;
        this.config = liveView.config;
        this.utils = liveView.utils;
    }

    /**
     * Render Markdown in live view
     * @param {Object} file - The markdown file to render
     */
    async render(file) {
        // Create an empty iframe first
        this.liveView.element.innerHTML = `
            <iframe 
                srcdoc="<!DOCTYPE html><html><head></head><body ontouchstart></body></html>" 
                name="Live view" 
                title="Live view" 
                style="background: hsl(228deg 16% 12%);" 
                class="live-frame" 
                loading="lazy" 
                scrolling="yes" 
                frameborder="0">
            </iframe>`;

        const liveFrame = this.liveView.element.querySelector('.live-frame');

        // Wait for iframe to load
        await new Promise(resolve => { liveFrame.onload = resolve; });

        const frameDoc = liveFrame.contentDocument;

        // Load markdown libraries if needed
        await this.loadMarkdownLibraries();

        // Parse and render markdown content
        const html = this.parseMarkdown(file.content);

        // Set up the document
        this.setupDocument(frameDoc, html);

        // Load resources and process elements
        await this.loadResources(frameDoc);

        // Show the content
        frameDoc.body.style.display = '';
        this.liveView.element.classList.add('loaded');
    }

    /**
     * Load required markdown libraries
     */
    async loadMarkdownLibraries() {
        // If markdown compiler isn't loaded
        if (typeof marked === 'undefined' || typeof DOMPurify === 'undefined') {
            // Load markdown compiler
            await this.utils.loadScript('live-view/extensions/markdown/marked.min.js');

            // Apply markdown compiler extensions
            marked.use(markedAlert());
            marked.use(markedFootnote());
            marked.use(markedBidi());
        }
    }

    /**
     * Parse markdown content to HTML
     * @param {string} content - Markdown content
     * @returns {string} HTML content
     */
    parseMarkdown(content) {
        let html = marked.parse(this.utils.decodeUnicode(content));
        return DOMPurify.sanitize(html);
    }

    /**
     * Set up the document with rendered HTML
     * @param {Document} frameDoc - The iframe document
     * @param {string} html - The HTML content
     */
    setupDocument(frameDoc, html) {
        frameDoc.head.innerHTML = '<base href="about:blank">';

        frameDoc.body.style.display = 'none';
        frameDoc.body.innerHTML = html;

        if (this.config.isMobile) frameDoc.body.classList.add('mobile');
        if (this.config.isSafari) frameDoc.body.classList.add('safari');

        this.setupLinkHandling(frameDoc);
    }

    /**
     * Set up handling for links in the markdown content
     * @param {Document} frameDoc - The iframe document
     */
    setupLinkHandling(frameDoc) {
        frameDoc.body.querySelectorAll('a[href]:not([target="_blank"])').forEach(link => {
            const href = this.utils.getAttr(link, 'href');

            if (!href.startsWith('#')) {
                // External links
                link.title = this.config.isMac ? '⌘ + click to open link' : 'Ctrl + click to open link';

                link.onclick = (e) => {
                    e.preventDefault();

                    if (event.ctrlKey || event.metaKey) {
                        window.open(href, '_blank');
                    } else {
                        this.utils.showMessage(href);
                    }
                };
            } else {
                // Internal anchor links
                link.onclick = (e) => {
                    e.preventDefault();

                    const target = frameDoc.querySelector(href.toLowerCase());
                    if (target) target.scrollIntoView();
                };
            }
        });
    }

    /**
     * Load resources needed for markdown rendering
     * @param {Document} frameDoc - The iframe document
     */
    async loadResources(frameDoc) {
        let fetchPromises = [];

        // Load Markdown stylesheet
        fetchPromises.push((async (i) => {
            await this.utils.loadStyleSheet(
                window.location.origin + '/live-view/extensions/markdown/markdown-dark.css',
                frameDoc.head
            );
            fetchPromises.splice(i, 1);
        })(fetchPromises.length));

        // Load fonts
        fetchPromises.push((async (i) => {
            await this.utils.loadStyleSheet(
                window.location.origin + '/fonts/fonts.css',
                frameDoc.head
            );
            fetchPromises.splice(i, 1);
        })(fetchPromises.length));

        // Handle code blocks
        await this.processCodeBlocks(frameDoc, fetchPromises);

        // Wait for all resources to load
        await this.utils.asyncForEach(fetchPromises, async (promise) => {
            if (fetchPromises.length === 0) return;
            if (promise) await promise;
        });
    }

    /**
     * Process code blocks in the markdown
     * @param {Document} frameDoc - The iframe document
     * @param {Array} fetchPromises - Array of fetch promises
     */
    async processCodeBlocks(frameDoc, fetchPromises) {
        if (!frameDoc.body.querySelector('pre code')) return;

        // Load editor theme
        fetchPromises.push((async (i) => {
            await this.utils.loadStyleSheet(
                window.location.origin + '/editor-theme.css',
                frameDoc.body
            );

            // Transform pre/code elements to cd-el elements
            frameDoc.body.querySelectorAll('pre').forEach(pre => {
                const codeEl = pre.querySelector('code');
                const lang = codeEl.classList[0] ? codeEl.classList[0].replace('language-', '') : '';

                const code = codeEl.textContent.replace(/[\u00A0-\u9999<>\&]/g, (i) => {
                    return '&#' + i.charCodeAt(0) + ';';
                });

                pre.outerHTML = '<cd-el lang="' + lang.toLowerCase() + '" edit="false">' + code + '</cd-el>';
            });

            fetchPromises.splice(i, 1);
        })(fetchPromises.length));

        // Load Prism for syntax highlighting
        (async (i) => {
            await this.utils.loadScript(
                window.location.origin + '/lib/prism.js',
                frameDoc.body
            );

            // Configure Prism autoloader path
            let s = document.createElement('script');
            s.appendChild(document.createTextNode(
                `Prism.plugins.autoloader.languages_path = 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.28.0/components/'`
            ));
            frameDoc.body.appendChild(s);

            this.utils.onNextFrame(() => {
                frameDoc.body.removeChild(s);
            });

            // Load CodeIt
            await this.utils.loadScript(
                window.location.origin + '/lib/codeit.js',
                frameDoc.body
            );

            fetchPromises.splice(i, 1);
        })(fetchPromises.length);
    }
}

export default MarkdownRenderer;