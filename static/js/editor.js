export function createEditor(elementId) {
    // Check if dark mode is active
    const isDarkMode = document.documentElement.classList.contains('dark');

    var editor = CodeMirror.fromTextArea(document.getElementById(elementId), {
        lineNumbers: true,
        theme: isDarkMode ? 'monokai' : 'default',
        lineWrapping: true,
        indentUnit: 4,
    });

    // Listen for dark mode changes and update the theme
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.attributeName === 'class') {
                const isDarkMode = document.documentElement.classList.contains('dark');
                editor.setOption('theme', isDarkMode ? 'monokai' : 'default');
            }
        });
    });

    // Observe the html element for class changes
    observer.observe(document.documentElement, { attributes: true });

    return editor;
}
