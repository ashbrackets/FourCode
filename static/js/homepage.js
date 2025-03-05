// #region start-learning-button
document.addEventListener("DOMContentLoaded", function () {
    const button = document.getElementById("start-learning-button");
    const threshold = 300;
    const strength = 0.3;
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