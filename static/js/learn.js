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

document.getElementById("complete-lesson-button").addEventListener('click', () => {

})

let curResizeBar = null
let isVerticalBar = null
let resizeBars = new Map()
let startY, startX, startHeightA, startHeightB, startWidthA, startWidthB
const MIN_HEIGHT = 250
const MIN_WIDTH = 300
let sectionSizes = new Map()

let allResizeBars = document.getElementsByName("resize-bar")
for (let i = 0; i < allResizeBars.length; i++) {
    let ele = allResizeBars[i]

    let link1 = document.getElementById(ele.getAttribute("link1"))
    let link2 = document.getElementById(ele.getAttribute("link2"))

    resizeBars.set(ele, [link1, link2])

    ele.addEventListener("mousedown", (e) => {
        curResizeBar = ele
        startX = e.clientX
        startY = e.clientY
        startWidthA = link1.offsetWidth
        startWidthB = link2.offsetWidth
        startHeightA = link1.offsetHeight
        startHeightB = link2.offsetHeight

        if (curResizeBar.getAttribute("direction") === "vertical") {
            isVerticalBar = true
        } else {
            isVerticalBar = false
        }

        document.body.classList.add("select-none")
        document.addEventListener("mousemove", resizeElements)
        document.addEventListener("mouseup", endResizeElements)
    })
}

function resizeElements(e) {
    if (!curResizeBar) {
        return
    }

    // get linked elements
    let linkedElements = resizeBars.get(curResizeBar)
    let link1 = linkedElements[0]
    let link2 = linkedElements[1]
    if (isVerticalBar) {
        let deltaY = e.clientY - startY
        let newHeightA = startHeightA + deltaY
        let newHeightB = startHeightB - deltaY

        if (newHeightA < MIN_HEIGHT || newHeightB < MIN_HEIGHT) return;

        link1.style.height = `${newHeightA}px`
        link2.style.height = `${newHeightB}px`

        let totalHeight = newHeightA + newHeightB
        sectionSizes.set(curResizeBar, [(newHeightA / totalHeight) * 100, (newHeightB / totalHeight) * 100])
    } else {
        let deltaX = e.clientX - startX
        let newWidthA = startWidthA + deltaX
        let newWidthB = startWidthB - deltaX

        if (newWidthA < MIN_WIDTH || newWidthB < MIN_WIDTH) return;

        link1.style.width = `${newWidthA}px`
        link2.style.width = `${newWidthB}px`

        let totalWidth = newWidthA + newWidthB
        sectionSizes.set(curResizeBar, [(newWidthA / totalWidth) * 100, (newWidthB / totalWidth) * 100])
    }
}

function endResizeElements() {
    curResizeBar = null
    document.body.classList.remove("select-none")
    document.removeEventListener("mousemove", resizeElements)
    document.removeEventListener("mouseup", endResizeElements)
}

function setOnWindowResize() {
    resizeBars.forEach(([link1, link2], bar) => {
        let isVertical = bar.getAttribute("direction") === "vertical" ? true : false

        if (isVertical) {
            let heights = sectionSizes.get(bar)
            if (heights) {
                link1.style.cssText = ""
                link2.style.cssText = ""
                let totalHeight = bar.parentElement.offsetHeight
                link1.style.height = `${(heights[0] * totalHeight) / 100}px`
                link2.style.height = `${(heights[1] * totalHeight) / 100}px`
            }
        } else {
            let widths = sectionSizes.get(bar)
            if (widths) {
                let totalWidth = bar.parentElement.offsetWidth
                link1.style.width = `${(widths[0] * totalWidth) / 100}px`
                link2.style.width = `${(widths[1] * totalWidth) / 100}px`
            }
        }
    })
}

window.addEventListener("resize", setOnWindowResize)