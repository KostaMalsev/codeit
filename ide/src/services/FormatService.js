/**
 * FormatService for handling code formatting
 */
class FormatService {
    constructor(fileBrowser) {
        this.fileBrowser = fileBrowser;
    }

    /**
     * Format the selected code in the editor
     */
    formatSelectedCode() {
        // If codeit is active
        if (document.activeElement === this.fileBrowser.editor.element) {
            const selText = window.getSelection().toString();

            // If selection exists
            if (selText !== '') {
                const cursor = this.fileBrowser.editor.cd.dropper.cursor();
                const cursorEl = cursor.startContainer === this.fileBrowser.editor.cd ?
                    this.fileBrowser.editor.cd :
                    cursor.getParent();

                // Get selection language
                let selLang = Prism.util.getLanguage(cursorEl);
                if (selLang == 'javascript') selLang = 'js';
                if (selLang == 'json') selLang = 'js';
                if (selLang == 'markup') selLang = 'html';

                // Find syntax for language
                const formatSyntax = beautifier[selLang];

                // If syntax exists
                if (formatSyntax) {
                    // Format
                    const formatterOptions = { ...this.fileBrowser.config.formatterOptions };
                    formatterOptions.indent_char = this.fileBrowser.editor.cd.options.tab[0];
                    let formattedText = formatSyntax(selText, formatterOptions);

                    // Prevent deleting ending newline when formatting
                    if (selText.endsWith('\n') && !formattedText.endsWith('\n')) {
                        formattedText += '\n';
                    }

                    // Compare current code with formatted code
                    // If the code is different, swap it
                    if (this.fileBrowser.utils.hashCode(selText) !==
                        this.fileBrowser.utils.hashCode(formattedText)) {

                        // Replace selection contents with formatted text
                        this.fileBrowser.editor.cd.deleteCurrentSelection();
                        this.fileBrowser.editor.cd.insert(formattedText, { moveToEnd: false });

                        // Get caret pos in text
                        const pos = this.fileBrowser.editor.cd.getSelection();

                        // Select beautified text
                        this.fileBrowser.editor.cd.setSelection(pos.start, (pos.start + formattedText.length));

                        // Dispatch type event (simulate typing)
                        this.fileBrowser.editor.cd.dispatchTypeEvent();
                    }
                } else {
                    // Show unsupported language message
                    this.fileBrowser.notificationService.showMessage(
                        'You can format HTML, JS, CSS, JSON,\nand SVG.',
                        5000
                    );
                }
            } else {
                this.fileBrowser.notificationService.showFormatSelectMessage();
            }
        }
    }
}

export default FormatService;