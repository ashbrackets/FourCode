import { createEditor } from './editor.js'
import { resizeFontInEditor } from './resize_editor.js'

var editor
let isLoggedIn = false
const complete_button = document.getElementById("complete-lesson-button")
document.addEventListener('DOMContentLoaded', async () => {
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

    // update completed lesson button if it exists
    if (complete_button) {
        const response = await fetch('/is-logged-in', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        })
        const result = await response.json()
        isLoggedIn = result.isLoggedIn
        if (!isLoggedIn) {
            let completedLessons = JSON.parse(localStorage.getItem("completedLessons")) || []
            if (!Array.isArray(completedLessons)) completedLessons = []
            let completedLessonsSet = new Set(completedLessons)
            if (completedLessonsSet.has(parseInt(lessonIndex))) {
                // Handle animation for non-logged in users but already completed
                complete_button.classList.add("pointer-events-none");
                complete_button.classList.replace("px-6", "px-2");
                complete_button.classList.replace("rounded-lg", "rounded-full");
                complete_button.classList.replace("bg-primary/10", "bg-primary");
                complete_button.classList.replace("text-primary", "text-white");
                complete_button.querySelector(".title").classList.add("hidden");
            }
        }
    }
});

document.getElementsByName('run-button').forEach((e) => {
    e.addEventListener('click', async () => {
        let startTime = performance.now()
        const code = editor.getValue();
        const textarea = document.getElementById('output')
        textarea.textContent = ''
        const response = await fetch('/run', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ code: code })
        });
        let result = await response.json()
        if (result.error) {
            editor.getAllMarks().forEach(marker => marker.clear());
            let line = result.line
            console.log(result)

            // let pos = result.startLinePos
            // if (result.error.includes("Lexer Error: ")) {
            //     line = result.curLineNo
            //     pos = result.curPos
            // }
            // if (editor.getLine(line)) {
            //     if (pos > editor.getLine(line).trim().length) {
            //         pos = editor.getLine(line).trim().length + 1
            //         ensureCharAt(editor, line, pos)
            //     }
            // }
            // let split = result.error.split(":")
            // split[1] = pos.toString()
            // result.error = split.join(":")
            textarea.innerHTML = result.error;
            editor.markText(
                { line: line, ch: result.startPos },
                { line: line, ch: result.endPos + 1 },
                { className: "error-highlight" }
            );
            const errorMessage = result.error;
            const errorLine = result.line - 1;
            editor.setGutterMarker(errorLine, "error", document.createTextNode(errorMessage));
        } else {
            textarea.innerHTML = result.result;
        }
        let endTime = performance.now()
        let perfTime = endTime - startTime
        textarea.innerHTML += "\nExecution Time: " + perfTime.toFixed(2).toString() + " ms"
        textarea.innerHTML += "\n<b>---END OF PROGRAM---</b>"
        // auto scroll to the end
        scrollAnimation(textarea, .2)
    });
})

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

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Only add event listener if the button exists
if (complete_button) {
    complete_button.addEventListener('click', async () => {
        const urlParams = new URLSearchParams(window.location.search)
        const lesson_index = parseInt(urlParams.get("lesson_index"))

        if (!isLoggedIn) {
            let completedLessons = JSON.parse(localStorage.getItem("completedLessons")) || []
            if (!Array.isArray(completedLessons)) completedLessons = []
            let completedLessonsSet = new Set(completedLessons)
            if (!completedLessonsSet.has(lesson_index)) {
                completedLessonsSet.add(lesson_index)
                localStorage.setItem("completedLessons", JSON.stringify([...completedLessonsSet]))
            }
        } else {
            const response2 = await fetch("/update-user-lessons-db", {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ isChecked: true, lesson_index: lesson_index })
            });
            const result2 = await response2.json()
        }

        // animation
        await animate_complete_button(0.1)
    })
}

async function animate_complete_button(timems) {
    let text = complete_button.querySelector(".title").textContent
    let time = timems * 1000
    for (let i = text.length; i >= 0; i--) {
        complete_button.querySelector(".title").textContent = text.slice(0, i)
        await sleep(time / text.length)
    }
    await sleep((time / text.length) * 5)
    complete_button.classList.add("pointer-events-none")
    complete_button.classList.replace("px-6", "px-2")
    complete_button.classList.replace("rounded-lg", "rounded-full")
    complete_button.classList.replace("bg-primary/10", "bg-primary")
    complete_button.classList.replace("text-primary", "text-white")
    complete_button.querySelector(".title").classList.add("hidden")
}

