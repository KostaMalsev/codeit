/**
 * Binary renderer for LiveView component
 * Handles rendering of binary files like images and unsupported file types
 */
class BinaryRenderer {
    constructor(liveView) {
        this.liveView = liveView;
        this.fileBrowser = liveView.fileBrowser;
        this.config = liveView.config;
        this.utils = liveView.utils;
    }

    /**
     * Show the file size prompt when a file is too large
     */
    showFileSizePrompt() {
        this.liveView.element.classList.add('file-open', 'notransition');
        this.liveView.element.innerHTML = `
        <div class="prompt">
          <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" fill="none" height="96" viewBox="0 0 72 96" width="72" class="file-svg">
            <clipPath id="a"><path d="m0 0h72v96h-72z"></path></clipPath>
            <clipPath id="b"><path d="m0 0h72v96h-72z"></path></clipPath>
            <clipPath id="c"><path d="m12 36h48v48h-48z"></path></clipPath>
            <g clip-path="url(#a)">
              <g clip-path="url(#b)">
                <path d="m72 29.3v60.3c0 2.24 0 3.36-.44 4.22-.38.74-1 1.36-1.74 1.74-.86.44-1.98.44-4.22.44h-59.20002c-2.24 0-3.36 0-4.22-.44-.74-.38-1.359997-1-1.739996-1.74-.44000025-.86-.44000006-1.98-.43999967-4.22l.00001455-83.2c.00000039-2.24.00000059-3.36.44000112-4.22.38-.74 1-1.36 1.74-1.74.86-.43999947 1.98-.43999927 4.22-.43999888l36.3.00000635c1.96.00000034 2.94.00000051 3.86.22000053.5.12.98.28 1.44.5v16.879992c0 2.24 0 3.36.44 4.22.38.74 1 1.36 1.74 1.74.86.44 1.98.44 4.22.44h16.88c.22.46.38.94.5 1.44.22.92.22 1.9.22 3.86z" fill="hsl(223deg 92% 87%)"></path>
                <path d="m68.26 20.26c1.38 1.38 2.06 2.06 2.56 2.88.18.28.32.56.46.86h-16.88c-2.24 0-3.36 0-4.22-.44-.74-.38-1.36-1-1.74-1.74-.44-.86-.44-1.98-.44-4.22v-16.880029c.3.14.58.28.86.459999.82.5 1.5 1.18 2.88 2.56z" fill="hsl(223deg 85% 58%)"></path>
              </g>
            </g>
          </svg>
          <div class="title">This file is too big to view</div>
          <div class="desc">You can download it below.</div>
        </div>
      `;

        this.fileBrowser.editor.cd.textContent = '';

        // If on mobile device
        if (this.config.isMobile) {
            this.utils.onNextFrame(() => {
                this.liveView.element.classList.remove('notransition');

                // Update bottom float
                this.fileBrowser.bottomFloat.element.classList.add('file-open');
                this.fileBrowser.bottomFloat.updateFloat();
            });
        } else {
            this.liveView.liveToggle.classList.add('file-open');

            this.utils.onNextFrame(() => {
                this.liveView.element.classList.remove('notransition');
            });
        }
    }

    /**
     * Load a binary file in the live view
     * @param {Object} file - The file to load
     * @param {boolean} toggled - Whether the sidebar is toggled
     */
    loadBinaryFile(file, toggled) {
        // If on mobile device
        if (this.config.isMobile) {
            // Update bottom float
            this.fileBrowser.bottomFloat.element.classList.add('file-open');
        }

        // If sidebar is open and on mobile device
        if (toggled && this.config.isMobile) {
            this.liveView.element.classList.add('notransition', 'file-open');

            this.utils.onNextFrame(() => {
                this.liveView.element.classList.remove('notransition');
                this.fileBrowser.bottomFloat.updateFloat();
            });
        } else {
            this.liveView.element.classList.add('notransition');
            this.liveView.element.classList.add('file-open');

            if (!this.config.isMobile) {
                this.liveView.liveToggle.classList.add('file-open');
            }

            this.utils.onNextFrame(() => {
                this.liveView.element.classList.remove('notransition');
            });
        }

        const fileType = this.utils.getFileType(file.name);
        const fileSizeText = this.fileBrowser.fileSizeText;

        if (this.utils.hashCode(file.content) !==
            this.utils.hashCode(fileSizeText)) {

            if (fileType === 'image') {
                this.renderImage(file);
            } else {
                this.renderUnsupportedFile(fileType);
            }
        } else {
            // Show file size prompt
            this.showFileSizePrompt();
        }
    }

    /**
     * Render an image file
     * @param {Object} file - The image file to render
     */
    renderImage(file) {
        // Get MIME type
        let mimeType = 'image/' + file.name.split('.')[1];

        if (mimeType.endsWith('svg')) mimeType = 'image/svg+xml';

        this.liveView.element.innerHTML = `<img src="data:${mimeType};base64,${file.content}" draggable="false"></img>`;
    }

    /**
     * Render an unsupported file type
     * @param {string} fileType - The type of file
     */
    renderUnsupportedFile(fileType) {
        let fileMessage = 'This file type isn\'t';

        if (fileType !== 'other') fileMessage = fileType[0].toUpperCase() + fileType.slice(1) + ' files aren\'t';
        if (fileType === 'pdf') fileMessage = 'PDF files aren\'t';
        if (fileType === 'midi') fileMessage = 'MIDI files aren\'t';

        // Show file supported prompt
        this.liveView.element.innerHTML = `
        <div class="prompt">
          <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" fill="none" height="96" viewBox="0 0 72 96" width="72" class="file-svg">
            <clipPath id="a"><path d="m0 0h72v96h-72z"></path></clipPath>
            <clipPath id="b"><path d="m0 0h72v96h-72z"></path></clipPath>
            <clipPath id="c"><path d="m12 36h48v48h-48z"></path></clipPath>
            <g clip-path="url(#a)">
              <g clip-path="url(#b)">
                <path d="m72 29.3v60.3c0 2.24 0 3.36-.44 4.22-.38.74-1 1.36-1.74 1.74-.86.44-1.98.44-4.22.44h-59.20002c-2.24 0-3.36 0-4.22-.44-.74-.38-1.359997-1-1.739996-1.74-.44000025-.86-.44000006-1.98-.43999967-4.22l.00001455-83.2c.00000039-2.24.00000059-3.36.44000112-4.22.38-.74 1-1.36 1.74-1.74.86-.43999947 1.98-.43999927 4.22-.43999888l36.3.00000635c1.96.00000034 2.94.00000051 3.86.22000053.5.12.98.28 1.44.5v16.879992c0 2.24 0 3.36.44 4.22.38.74 1 1.36 1.74 1.74.86.44 1.98.44 4.22.44h16.88c.22.46.38.94.5 1.44.22.92.22 1.9.22 3.86z" fill="hsl(223deg 92% 87%)"></path>
                <path d="m68.26 20.26c1.38 1.38 2.06 2.06 2.56 2.88.18.28.32.56.46.86h-16.88c-2.24 0-3.36 0-4.22-.44-.74-.38-1.36-1-1.74-1.74-.44-.86-.44-1.98-.44-4.22v-16.880029c.3.14.58.28.86.459999.82.5 1.5 1.18 2.88 2.56z" fill="hsl(223deg 85% 58%)"></path>
              </g>
            </g>
          </svg>
          <div class="title">${fileMessage} supported yet</div>
          <div class="desc">You can download the file below.</div>
        </div>
      `;
    }
}

export default BinaryRenderer;