let checkboxes = document.getElementsByName("lesson").forEach((ele) => {
    ele.addEventListener("click", async (e) => {
        let isChecked = ele.checked
        let lesson_index = ele.value + 1
        const response = await fetch('/lessons-update-db', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ lesson_index: lesson_index, isChecked: isChecked })
        })
        let result = await response.json()

        if (result.isChecked) {
            ele.parentElement.classList.add('line-through')
        } else {
            ele.parentElement.classList.remove('line-through')
        }
    })
}) 