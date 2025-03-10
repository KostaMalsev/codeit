/**
 * Configuration and constants for the FileBrowser application
 */
class Config {
    constructor() {
        // Application information
        this.version = '1.0.0';
        this.isDev = process.env.NODE_ENV === 'development';

        // Timing constants
        this.pushAnimDuration = 0.8; // seconds
        this.eclipsedFileExpiration = 60000; // 1 minute in milliseconds
        this.branchExpiration = 24 * 60 * 60 * 1000; // 1 day in milliseconds
        this.repoDataExpiration = 60 * 24 * 60 * 60 * 1000; // 60 days in milliseconds

        // UI constants
        this.messageTimeout = 3000; // 3 seconds
        this.sidebarToggleDelay = 1500; // 1.5 seconds

        // Device detection
        this.isMobile = this.detectMobile();
        this.isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
        this.isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

        // File size limits
        this.maxViewableFileSize = 1000000; // 1MB

        // Formatter options
        this.formatterOptions = {
            "indent_size": "2",
            "indent_char": " ",
            "max_preserve_newlines": "5",
            "preserve_newlines": true,
            "keep_array_indentation": false,
            "break_chained_methods": false,
            "indent_scripts": "normal",
            "brace_style": "collapse",
            "space_before_conditional": true,
            "unescape_strings": false,
            "jslint_happy": false,
            "end_with_newline": false,
            "wrap_line_length": "0",
            "indent_inner_html": false,
            "comma_first": false,
            "e4x": false,
            "indent_empty_lines": false
        };
    }

    detectMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    isLandscape() {
        return window.matchMedia('(orientation: landscape)').matches;
    }
}

export default Config;