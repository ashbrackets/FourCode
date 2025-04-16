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

function initializeResizeBars() {
    let curResizeBar = null;
    let startY, startX, startHeightA, startHeightB, startWidthA, startWidthB;
    const MIN_HEIGHT = 200;
    const MIN_WIDTH = 300;
    let sectionSizes = new Map();

    let allResizeBars = document.getElementsByName("resize-bar");
    // Load saved sizes from localStorage
    const savedSizes = JSON.parse(localStorage.getItem("resizePercentages")) || {};

    allResizeBars.forEach(bar => {
        let link1 = document.getElementById(bar.getAttribute("link1"));
        let link2 = document.getElementById(bar.getAttribute("link2"));

        // Load saved percentages for this resize bar
        const id = bar.id;
        if (savedSizes[id]) {
            sectionSizes.set(bar, savedSizes[id]);
        }

        bar.addEventListener("mousedown", (e) => {
            curResizeBar = bar;
            startX = e.clientX;
            startY = e.clientY;
            startWidthA = link1.offsetWidth;
            startWidthB = link2.offsetWidth;
            startHeightA = link1.offsetHeight;
            startHeightB = link2.offsetHeight;

            document.body.classList.add("select-none");
            document.addEventListener("mousemove", handleResize);
            document.addEventListener("mouseup", stopResize);
        });

        function handleResize(e) {
            if (!curResizeBar) return;

            const isMobile = window.innerWidth < 1024;
            const isDesktopBar = curResizeBar.id === "desktopResize";

            if (!isMobile && isDesktopBar) {
                // Horizontal resize on desktop
                let deltaX = e.clientX - startX;
                let newWidthA = startWidthA + deltaX;
                let newWidthB = startWidthB - deltaX;
                if (newWidthA < MIN_WIDTH || newWidthB < MIN_WIDTH) return;

                link1.style.width = `${newWidthA}px`;
                link2.style.width = `${newWidthB}px`;
                sectionSizes.set(curResizeBar, [newWidthA / (newWidthA + newWidthB) * 100, newWidthB / (newWidthA + newWidthB) * 100]);
            } else if (isMobile && !isDesktopBar) {
                // Vertical resize on mobile
                let deltaY = e.clientY - startY;
                let newHeightA = startHeightA + deltaY;
                let newHeightB = startHeightB - deltaY;
                if (newHeightA < MIN_HEIGHT || newHeightB < MIN_HEIGHT) return;

                link1.style.height = `${newHeightA}px`;
                link2.style.height = `${newHeightB}px`;
                sectionSizes.set(curResizeBar, [newHeightA / (newHeightA + newHeightB) * 100, newHeightB / (newHeightA + newHeightB) * 100]);
            }
        }

        function stopResize() {
            const savedSizes = {};
            sectionSizes.forEach((sizes, bar) => {
                savedSizes[bar.id] = sizes;
            });
            localStorage.setItem("resizePercentages", JSON.stringify(savedSizes));

            curResizeBar = null;
            document.body.classList.remove("select-none");
            document.removeEventListener("mousemove", handleResize);
            document.removeEventListener("mouseup", stopResize);
        }
    });

    // Apply saved sizes on initial load and window resize
    function applySavedSizes() {
        allResizeBars.forEach(bar => {
            const link1 = document.getElementById(bar.getAttribute("link1"));
            const link2 = document.getElementById(bar.getAttribute("link2"));
            const sizes = sectionSizes.get(bar);
            if (!sizes) return;

            const isMobile = window.innerWidth < 1024;
            const isDesktopBar = bar.id === "desktopResize";

            if (!isMobile && isDesktopBar) {
                // Horizontal layout on desktop
                const totalWidth = bar.parentElement.offsetWidth - 16; // Account for gap
                link1.style.width = `${(sizes[0] * totalWidth) / 100}px`;
                link2.style.width = `${(sizes[1] * totalWidth) / 100}px`;
                // Reset heights
                link1.style.height = '';
                link2.style.height = '';
            } else if (isMobile && !isDesktopBar) {
                // Vertical layout on mobile
                const totalHeight = bar.parentElement.offsetHeight - 16; // Account for gap
                link1.style.height = `${(sizes[0] * totalHeight) / 100}px`;
                link2.style.height = `${(sizes[1] * totalHeight) / 100}px`;
                // Reset widths
                link1.style.width = '';
                link2.style.width = '';
            }
        });
    }

    window.addEventListener("resize", applySavedSizes);
    applySavedSizes();
}