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
    resizeCanvas(container.clientWidth, container.clientHeight);
};