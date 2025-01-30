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
    const textarea = document.getElementById('output')
    textarea.textContent = ''
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
        textarea.innerHTML = result.error;
    } else {
        textarea.innerHTML = result.result; // Display the result
    }
    // auto scroll to the end
    scrollAnimation(textarea, .2)
});

function scrollAnimation(textarea, duration) {
    const element = textarea;
    const start = element.scrollTop;
    const end = element.scrollHeight - element.clientHeight;
    const startTime = performance.now();

    function animate(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / (duration * 1000), 1);

        element.scrollTop = start + (end - start) * progress;

        if (progress < 1) {
            requestAnimationFrame(animate);
        }
    }

    requestAnimationFrame(animate);
}

var savedCode = localStorage.getItem('savedCode');
if (savedCode) {
    editor.setValue(savedCode);
}

editor.on('change', function () {
    var code = editor.getValue();
    localStorage.setItem('savedCode', code);
});