let checkboxes = document.getElementsByName("lesson").forEach((ele) => {
    ele.addEventListener("click", async (e) => {
        let start = performance.now()
        let isChecked = ele.checked
        let lesson_index = parseInt(ele.value)
        console.log(lesson_index)
        const response = await fetch('/lessons-update-db', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ lesson_index: lesson_index, isChecked: isChecked })
        })
        let result = await response.json()
        let lesson_name = ele.parentElement.querySelector('#lesson-name')
        console.log((performance.now() - start) / 1000)
        if (result.isChecked) {
            lesson_name.classList.add('line-through')
        } else {
            lesson_name.classList.remove('line-through')
        }
    })
}) 