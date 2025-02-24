// #region intro
alphabets = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890"
alphabets = alphabets.split('')
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function intro1() {
    let timeBetweenChange = -20
    for (let i = 0; i < 10; i++) {
        setBrandName(getRandomTextOfLength(8))
        await sleep(timeBetweenChange)
        timeBetweenChange += 3
    }
    timeBetweenChange += 20
    setBrandName(getRandomTextOfLength(8))
    await sleep(timeBetweenChange)
    setBrandName("FourCode")
}

async function intro2() {
    const word = "FourCode";
    let curLetterIndex = Math.floor(word.length / 2);
    let brandElement = document.getElementById("brandName");
    brandElement.textContent = ""
    for (let i = 0; i < word.length / 2; i++) {
        let timeBetweenChange = 0;

        updateBrandName(getRandomText(1) + brandElement.innerText + getRandomText(1));
        for (let j = 0; j < 10; j++) {
            updateBrandName(" " + brandElement.innerText.slice(1, -1) + " ");
            updateBrandName(getRandomText(1) + brandElement.innerText + getRandomText(1));
            await sleep(timeBetweenChange);
            timeBetweenChange += 1;
        }

        timeBetweenChange += 20;
        await sleep(timeBetweenChange);
        updateBrandName(" " + brandElement.innerText.slice(1, -1) + " ");
        updateBrandName(word[word.length / 2 - 1 - i] + brandElement.innerText + word[curLetterIndex]);

        curLetterIndex += 1;
    }
}

function updateBrandName(text) {
    document.getElementById("brandName").innerText = text;
}

function getRandomText(length) {
    return Array.from({ length }, () => alphabets[Math.floor(Math.random() * alphabets.length)]).join("");
}

window.addEventListener("load", (event) => {
    intro2()
});

// #endregion

// #region background

let theShader;
let container = document.getElementById("canvas")

function preload() {
    // Load our vertex and fragment shader files
    theShader = loadShader('/static/shaders/shader.vert', '/static/shaders/shader.frag');
}

function setup() {
    // Use WEBGL mode to enable shaders
    let canvas = createCanvas(container.clientWidth, container.clientHeight, WEBGL);
    canvas.parent(container)
    noStroke();
    rectMode(CENTER);
}

function draw() {
    // Set the active shader
    shader(theShader);

    // Pass uniforms: resolution, time, colors, and a noise scale factor
    theShader.setUniform("u_resolution", [width, height]);
    theShader.setUniform("u_time", millis() / 1000.0);
    // Colors are normalized (0.0 - 1.0): white and a blue shade (#0D21A1)
    theShader.setUniform("u_bgColor", [0.114, 0.176, 0.267]);
    theShader.setUniform("u_fgColor", [0.051, 0.075, 0.129]);
    theShader.setUniform("u_noiseScale", 2.0); // Adjust to taste

    // Draw a rectangle that covers the entire canvas
    rect(0, 0, width, height);
}

function windowResized() {
    let container = document.getElementById("canvas");
    resizeCanvas(container.clientWidth, container.clientHeight);
};

// #endregion

// #region start-learning-button
document.addEventListener("DOMContentLoaded", function () {
    const button = document.getElementById("start-learning-button");
    const threshold = 300; // Distance from the button where attraction starts
    const strength = 0.3; // Attraction strength
    let isInside = false;

    document.addEventListener("mousemove", (event) => {
        const mouseX = event.clientX;
        const mouseY = event.clientY;
        const buttonRect = button.getBoundingClientRect();
        const centerX = buttonRect.left + buttonRect.width / 2;
        const centerY = buttonRect.top + buttonRect.height / 2;
        const deltaX = mouseX - centerX;
        const deltaY = mouseY - centerY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        if (distance < threshold) {
            isInside = true;
            gsap.to(button, {
                x: deltaX * strength,
                y: deltaY * strength,
                duration: 0.3,
                ease: "power2.out"
            });
        } else if (isInside) {
            isInside = false;
            gsap.to(button, {
                x: 0,
                y: 0,
                duration: 0.6,
                ease: "elastic.out(1, 0.5)"
            });
        }
    });
});

// #endregion