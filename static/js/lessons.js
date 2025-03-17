window.addEventListener("DOMContentLoaded", async () => {
    // if is logged in
    // get from db
    // else 
    // get from localStorage 
    //
    // get list of completed lesson indexes
    // update check box and line through
    const response = await fetch('/is-logged-in', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    })
    const result = await response.json()
    let completedLessonsIndexes = null
    if (!result.isLoggedIn) {
        completedLessonsIndexes = JSON.parse(localStorage.getItem("completedLessons"))
    }
    if (completedLessonsIndexes === null) return
    console.log(completedLessonsIndexes)
    const lessonsContainer = document.querySelector("#lessons-container")
    completedLessonsIndexes.forEach((index) => {
        const checkbox = lessonsContainer.querySelector(`.lesson-${index}`).querySelector("#lesson-checkbox")
        const name = lessonsContainer.querySelector(`.lesson-${index}`).querySelector("#lesson-name")

        checkbox.setAttribute("checked", "")
        name.classList.add('line-through')
    })
})



let checkboxes = document.querySelectorAll(".lesson-checkbox").forEach((ele) => {
    ele.addEventListener("click", async (e) => {
        let isChecked = ele.checked
        let lesson_index = parseInt(ele.value)

        const resp = await fetch("/is-logged-in")
        const res = await resp.json()

        if (res.isLoggedIn) {
            await fetch('/update-user-lessons-db', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ lesson_index: lesson_index, isChecked: isChecked })
            })
        } else {
            let completedLessons = JSON.parse(localStorage.getItem("completedLessons")) || []
            if (isChecked) {
                console.log(completedLessons)
                completedLessons.push(lesson_index)
                localStorage.setItem("completedLessons", JSON.stringify(completedLessons))
            } else if (!isChecked) {
                completedLessons = completedLessons.filter(item => item !== lesson_index)
                localStorage.setItem("completedLessons", JSON.stringify(completedLessons))
            }
        }
        let lesson_name = ele.parentElement.querySelector('#lesson-name')
        if (isChecked) {
            lesson_name.classList.add('line-through')
        } else {
            lesson_name.classList.remove('line-through')
        }
    })
}) 