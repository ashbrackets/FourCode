import { createEditor } from './editor.js'

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

    // update completed lesson button
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
        console.log(completedLessonsSet, lessonIndex)
        if (completedLessonsSet.has(parseInt(lessonIndex))) {
            await animate_complete_button(0.1)
        }
    } else {
        if (has_completed_lesson) {
            await animate_complete_button(0.1)
        }
    }
    complete_button.classList.replace("opacity-10", "opacity-100")
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
            let line = result.curLineNo - 1
            let pos = result.pos - 1
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
                { line: line, ch: pos },
                { line: line, ch: pos + 1 },
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
    complete_button.querySelector(".title").classList.add("hidden")
}

let curResizeBar = null;
let isVerticalBar = null;
let resizeBars = new Map();
let startY, startX, startHeightA, startHeightB, startWidthA, startWidthB;
const MIN_HEIGHT = 250;
const MIN_WIDTH = 300;
let sectionSizes = new Map();

let allResizeBars = document.getElementsByName("resize-bar");
// Load saved sizes from localStorage
const savedSizes = JSON.parse(localStorage.getItem("resizePercentages")) || {};
for (let i = 0; i < allResizeBars.length; i++) {
    let ele = allResizeBars[i];
    let link1 = document.getElementById(ele.getAttribute("link1"));
    let link2 = document.getElementById(ele.getAttribute("link2"));
    resizeBars.set(ele, [link1, link2]);

    // Load saved percentages for this resize bar
    const id = ele.id;
    if (savedSizes[id]) {
        sectionSizes.set(ele, savedSizes[id]);
    }

    ele.addEventListener("mousedown", (e) => {
        curResizeBar = ele;
        startX = e.clientX;
        startY = e.clientY;
        startWidthA = link1.offsetWidth;
        startWidthB = link2.offsetWidth;
        startHeightA = link1.offsetHeight;
        startHeightB = link2.offsetHeight;

        isVerticalBar = curResizeBar.getAttribute("direction") === "vertical";
        document.body.classList.add("select-none");
        document.addEventListener("mousemove", resizeElements);
        document.addEventListener("mouseup", endResizeElements);
    });
}

// Apply saved sizes on initial load
setOnWindowResize();

function resizeElements(e) {
    if (!curResizeBar) return;

    let [link1, link2] = resizeBars.get(curResizeBar);
    if (isVerticalBar) {
        let deltaY = e.clientY - startY;
        let newHeightA = startHeightA + deltaY;
        let newHeightB = startHeightB - deltaY;
        if (newHeightA < MIN_HEIGHT || newHeightB < MIN_HEIGHT) return;

        link1.style.height = `${newHeightA}px`;
        link2.style.height = `${newHeightB}px`;
        sectionSizes.set(curResizeBar, [newHeightA / (newHeightA + newHeightB) * 100, newHeightB / (newHeightA + newHeightB) * 100]);
    } else {
        let deltaX = e.clientX - startX;
        let newWidthA = startWidthA + deltaX;
        let newWidthB = startWidthB - deltaX;
        if (newWidthA < MIN_WIDTH || newWidthB < MIN_WIDTH) return;

        link1.style.width = `${newWidthA}px`;
        link2.style.width = `${newWidthB}px`;
        sectionSizes.set(curResizeBar, [newWidthA / (newWidthA + newWidthB) * 100, newWidthB / (newWidthA + newWidthB) * 100]);
    }
}

function endResizeElements() {
    const savedSizes = {};
    for (const [bar, sizes] of sectionSizes) {
        savedSizes[bar.id] = sizes;
    }
    localStorage.setItem("resizePercentages", JSON.stringify(savedSizes));

    curResizeBar = null;
    document.body.classList.remove("select-none");
    document.removeEventListener("mousemove", resizeElements);
    document.removeEventListener("mouseup", endResizeElements);
}

function setOnWindowResize() {
    resizeBars.forEach(([link1, link2], bar) => {
        const isVertical = bar.getAttribute("direction") === "vertical";
        const sizes = sectionSizes.get(bar);
        if (!sizes) return;

        if (isVertical) {
            const totalHeight = bar.parentElement.offsetHeight;
            link1.style.height = `${(sizes[0] * totalHeight) / 100}px`;
            link2.style.height = `${(sizes[1] * totalHeight) / 100}px`;
        } else {
            const totalWidth = bar.parentElement.offsetWidth;
            link1.style.width = `${(sizes[0] * totalWidth) / 100}px`;
            link2.style.width = `${(sizes[1] * totalWidth) / 100}px`;
        }
    });
}

window.addEventListener("resize", setOnWindowResize);