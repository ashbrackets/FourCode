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
        // Only apply width changes on desktop
        if (window.innerWidth >= 1024) { // lg breakpoint
            let deltaX = e.clientX - startX;
            let newWidthA = startWidthA + deltaX;
            let newWidthB = startWidthB - deltaX;
            if (newWidthA < MIN_WIDTH || newWidthB < MIN_WIDTH) return;

            link1.style.width = `${newWidthA}px`;
            link2.style.width = `${newWidthB}px`;
            sectionSizes.set(curResizeBar, [newWidthA / (newWidthA + newWidthB) * 100, newWidthB / (newWidthA + newWidthB) * 100]);
        }
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
            // Only apply width changes on desktop
            if (window.innerWidth >= 1024) { // lg breakpoint
                const totalWidth = bar.parentElement.offsetWidth;
                link1.style.width = `${(sizes[0] * totalWidth) / 100}px`;
                link2.style.width = `${(sizes[1] * totalWidth) / 100}px`;
            } else {
                // Reset width on mobile
                link1.style.width = '';
                link2.style.width = '';
            }
        }
    });
}

window.addEventListener("resize", setOnWindowResize);