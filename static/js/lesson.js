import { createEditor } from './editor.js'

var editor
document.addEventListener('DOMContentLoaded', () => {
    editor = createEditor('code-editor');
    editor.setSize("100%", "100%")
    const urlParams = new URLSearchParams(window.location.search);
    const lessonIndex = urlParams.get('lesson_index');
    var savedCode = localStorage.getItem('lesson_' + lessonIndex + '_code');
    if (savedCode) {
        editor.setValue(savedCode);
    }

    editor.on('change', function () {
        editor.getAllMarks().forEach(marker => marker.clear());
        var code = editor.getValue();
        const urlParams = new URLSearchParams(window.location.search);
        const lessonIndex = urlParams.get('lesson_index');
        localStorage.setItem('lesson_' + lessonIndex + '_code', code);
    });
});

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
    let result = await response.json();
    console.log(result)
    if (result.error) {
        editor.getAllMarks().forEach(marker => marker.clear());
        const line = result.line - 1
        let pos = result.pos - 1
        if (pos > editor.getLine(line).trim().length) {
            pos = editor.getLine(line).trim().length + 1
            ensureCharAt(editor, line, pos)
        }
        let split = result.error.split(":")
        split[1] = pos.toString()
        result.error = split.join(":")
        console.log(result.error)
        textarea.innerHTML = result.error;
        editor.markText(
            { line: line, ch: pos }, // Start position
            { line: line, ch: pos + 1 }, // End position
            { className: "error-highlight" } // Custom class for styling
        );
        const errorMessage = result.error;
        const errorLine = result.line - 1; // The line where the error occurred
        editor.setGutterMarker(errorLine, "error", document.createTextNode(errorMessage));
    } else {
        textarea.innerHTML = result.result; // Display the result
    }
    // textarea.innerHTML += result.pos
    textarea.innerHTML += "\n<b>---END OF PROGRAM---</b>"
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

function ensureCharAt(editor, line, ch) {
    let lineText = editor.getLine(line);

    // If `ch` is beyond the end of the line, pad it with spaces
    if (ch > lineText.length) {
        let padding = " ".repeat(ch - lineText.length);
        editor.replaceRange(padding + " ", { line, ch: lineText.length });
        return true
    }

    // If the position is empty (e.g., at the end of the line), insert a space
    if (lineText[ch] === '') {
        editor.replaceRange(" ", { line, ch });

    }
}