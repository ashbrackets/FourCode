document.addEventListener('DOMContentLoaded', () => { resizeFontInEditor() })


export function resizeFontInEditor(editor) {
    // const editor = document.querySelector('.CodeMirror');
    if (window.screen.width < 640) {
        editor.style.fontSize = "24px";
        console.log("Codemirror font size: 24px");
    } else {
        editor.style.fontSize = "16px";
        console.log("Codemirror font size: 16px");
    }
}

window.onresize = resizeFontInEditor;