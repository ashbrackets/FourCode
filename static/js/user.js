const profilePic = document.getElementById("profilePic")
const confirmButton = document.getElementById("DP-confirm-button")
const navDP = document.querySelector("#nav-dp")
let currentDP = profilePic.name
let currentDPLink = profilePic.src
document.getElementsByName("dp").forEach((ele) => {
    ele.addEventListener("click", () => {
        profilePic.src = ele.querySelector(".dp").src
        currentDPLink = ele.querySelector(".dp").src
        if (ele.querySelector(".dp").name === currentDP) {
            confirmButton.classList.replace("opacity-100", "opacity-0")
            confirmButton.disabled = true
            return
        }
        confirmButton.classList.replace("opacity-0", "opacity-100")
        profilePic.name = ele.querySelector(".dp").name
        confirmButton.disabled = false
    })
})

confirmButton.addEventListener("click", async () => {
    currentDP = profilePic.name
    console.log(currentDPLink)
    navDP.src = currentDPLink
    console.log(navDP.src)
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