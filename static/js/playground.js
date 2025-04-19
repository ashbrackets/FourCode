import { createEditor } from './editor.js'

var editor;

document.addEventListener('DOMContentLoaded', () => {
    // Initialize the code editor
    editor = createEditor('code-editor');
    editor.setSize("100%", "100%");

    // Load saved code if it exists
    const savedCode = localStorage.getItem('playground_code');
    if (savedCode) {
        editor.setValue(savedCode);
    }

    // Save code as the user types
    editor.on('change', function () {
        editor.getAllMarks().forEach(marker => marker.clear());
        const code = editor.getValue();
        localStorage.setItem('playground_code', code);
    });

    // Initialize resize bars
    initializeResizeBars();
});

// Add event listener to run button
document.getElementsByName('run-button').forEach((e) => {
    e.addEventListener('click', async () => {
        let startTime = performance.now();
        const code = editor.getValue();
        const textarea = document.getElementById('output');
        textarea.textContent = '';

        const response = await fetch('/run', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ code: code })
        });

        let result = await response.json();
        if (result.error) {
            editor.getAllMarks().forEach(marker => marker.clear());
            let line = result.line;

            textarea.innerHTML = result.error;
            editor.markText(
                { line: line, ch: result.startPos },
                { line: line, ch: result.endPos + 1 },
                { className: "error-highlight" }
            );
        } else {
            textarea.innerHTML = result.result;
        }

        let endTime = performance.now();
        let perfTime = endTime - startTime;
        textarea.innerHTML += "\nExecution Time: " + perfTime.toFixed(2).toString() + " ms";
        textarea.innerHTML += "\n<b>---END OF PROGRAM---</b>";

        // Auto scroll to the end
        scrollAnimation(textarea, .2);
    });
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

