export function createEditor(elementId) {
    // Check if dark mode is active
    const isDarkMode = document.documentElement.classList.contains('dark');
    
    var editor = CodeMirror.fromTextArea(document.getElementById(elementId), {
        lineNumbers: true,
        theme: isDarkMode ? 'monokai' : 'default',
        lineWrapping: true,
        indentUnit: 4,
    });
    
    resizeFontInEditor();
    
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

function resizeFontInEditor() {
    const editor = document.querySelector('.CodeMirror');
    if (window.screen.width < 640) {
        editor.style.fontSize = "24px";
        console.log("Codemirror font size: 24px");
    } else {
        editor.style.fontSize = "16px";
        console.log("Codemirror font size: 16px");
    }
}

window.onresize = resizeFontInEditor;