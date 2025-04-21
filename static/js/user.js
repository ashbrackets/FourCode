const profilePic = document.getElementById("profilePic")
const confirmButton = document.getElementById("DP-confirm-button")
const navDP = document.querySelector("#nav-dp")
let currentDP = profilePic.name
let currentDPLink = profilePic.src
document.getElementsByName("dp").forEach((ele) => {
    ele.addEventListener("click", () => {
        profilePic.src = ele.querySelector(".dp").src
        currentDPLink = ele.querySelector(".dp").src
        profilePic.name = ele.querySelector(".dp").name
    })
})

confirmButton.addEventListener("click", async () => {
    currentDP = profilePic.name
    navDP.src = currentDPLink
    confirmButton.classList.replace("opacity-100", "opacity-0")
    confirmButton.disabled = true
    const loginResponse = await fetch("/is-logged-in")
    const loginResult = await loginResponse.json()

    if (loginResult.isLoggedIn) {
        const setDPResponse = await fetch("/set-dp", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ dp: currentDP })
        })
        const setDPResult = await setDPResponse.json()
    }
})

const deleteAccountButton = document.querySelector("#deleteAccount")
deleteAccountButton.addEventListener("click", async (e) => {
    const loginResponse = await fetch("/is-logged-in")
    const loginResult = await loginResponse.json()

    if (loginResult.isLoggedIn) {
        const setDPResponse = await fetch("/delete-account", {})
        const result = await setDPResponse.json()
    }
})