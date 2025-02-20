// #region intro
alphabets = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890"
alphabets = alphabets.split('')
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function intro() {
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

function setBrandName(text) {
    document.getElementById("brandName").innerText = text
}

function getRandomTextOfLength(length) {
    let text = ''
    for (let i = 0; i < length; i++) {
        text += alphabets[Math.floor(Math.random() * alphabets.length)]
    }
    return text
}

window.addEventListener("load", (event) => {
    intro()
});
// #endregion

// #region intro

let H, W;
let v = [];
let scl = 20;
let z = 0.002;
function setup() {
    let container = document.getElementById("canvas");
    createCanvas(container.clientWidth, container.clientHeight).parent(container);

    H = (container.clientHeight / scl) + 1;
    W = (container.clientWidth / scl) + 1;
    for (let i = -1; i < H; i++) {
        for (let j = -1; j < W; j++) {
            let index = i * W + j;
            let a = noise(j / 100, i / 100, z) * TWO_PI * 7;
            v[index] = p5.Vector.fromAngle(a).setMag(1);
        }
    }
};

function draw() {
    background("#1d2d44");
    let abc = 0;
    for (let i = -1; i < H; i++) {
        for (let j = -1; j < W; j++) {
            let index = i * W + j;
            let y = i * scl;
            let x = j * scl;

            push();
            translate(x + scl / 2, y);
            abc = abs(Math.sin(v[index].heading())) * 5;
            rotate(v[index].heading());
            noStroke();
            fill("#0d1321")
            beginShape();
            vertex(0, 0);
            vertex(scl - 5, 5 + abc);
            vertex(scl + abc, 0);
            vertex(scl - 5, -5 - abc);
            endShape(CLOSE);
            pop();
            let a = noise(j / 100, i / 100, z) * TWO_PI * 7;
            v[index] = p5.Vector.fromAngle(a);
        }
    }
    z += 0.002;
    textSize(32);
};

function windowResized() {
    let container = document.getElementById("canvas");
    resizeCanvas(container.clientWidth, container.clientHeight);
};
