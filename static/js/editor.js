export function createEditor(elementId) {
    var editor = CodeMirror.fromTextArea(document.getElementById(elementId), {
        lineNumbers: true,
        theme: 'monokai',
        lineNumbers: true,
        lineWrapping: true,
        indentUnit: 4,
    });
    resizeFontInEditor()
    return editor
}

function resizeFontInEditor() {
    const editor = document.querySelector('.CodeMirror');
    if (window.screen.width < 640) {
        editor.style.fontSize = "24px";
    } else {
        editor.style.fontSize = "20px";
    }
}

window.onresize = resizeFontInEditor;