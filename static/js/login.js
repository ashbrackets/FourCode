let password = document.querySelector('input[name=\"password\"]')
let eye = document.getElementById("eye")
let eyeOff = document.getElementById("eye-off")

document.getElementById("togglePassword").addEventListener("click", () => {
    let type = password.getAttribute("type") === "password" ? "text" : "password"
    password.setAttribute('type', type)

    eye.classList.toggle('hidden')
    eyeOff.classList.toggle('hidden')
})