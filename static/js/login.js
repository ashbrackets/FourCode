document.getElementsByName("togglePassword").forEach((ele) => {
    ele.addEventListener("click", () => {
        const link = ele.getAttribute("link")
        const password = document.querySelector("#" + link)
        const eye = ele.querySelector("#eye")
        const eyeOff = ele.querySelector("#eye-off")
        let type = password.getAttribute("type") === "password" ? "text" : "password"
        password.setAttribute('type', type)

        eye.classList.toggle('hidden')
        eyeOff.classList.toggle('hidden')
    })
})