var editor = CodeMirror.fromTextArea(document.getElementById('code-editor'), {
    lineNumbers: true,
    theme: 'monokai',
    lineNumbers: true,
    lineWrapping: true,
    indentUnit: 4,
});
editor.setSize("100%", "100%")

document.getElementById('run-button').addEventListener('click', async () => {
    const code = editor.getValue(); // Get the text from the editor

    // Send the code to the Flask backend
    const response = await fetch('/run', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: code })
    });

    const result = await response.json();
    if (result.error) {
        document.getElementById('output').textContent = result.error;
    } else {
        document.getElementById('output').textContent = result.result; // Display the result
    }
});

var savedCode = localStorage.getItem('savedCode');
if (savedCode) {
    editor.setValue(savedCode);
}

editor.on('change', function () {
    var code = editor.getValue();
    localStorage.setItem('savedCode', code);
});