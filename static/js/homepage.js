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