export function createEditor(elementId){
    var editor = CodeMirror.fromTextArea(document.getElementById(elementId), {
        lineNumbers: true,
        theme: 'monokai',
        lineNumbers: true,
        lineWrapping: true,
        indentUnit: 4,
    });
    
    return editor
}