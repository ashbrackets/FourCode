window.addEventListener("DOMContentLoaded", async () => {
    // Check login status and initialize completed lessons
    const response = await fetch('/is-logged-in');
    const result = await response.json();
    
    let completedLessonsIndexes = [];
    if (!result.isLoggedIn) {
        completedLessonsIndexes = JSON.parse(localStorage.getItem("completedLessons")) || [];
    }

    // Update UI for completed lessons
    completedLessonsIndexes.forEach((index) => {
        const lessonDiv = document.querySelector(`.lesson-${index}`);
        if (!lessonDiv) return;

        const checkbox = lessonDiv.querySelector('.lesson-checkbox');
        const name = lessonDiv.querySelector(`#lesson-name-${index}`);

        if (checkbox) checkbox.checked = true;
        if (name) name.classList.add('line-through');
    });

    // Update progress bar
    updateProgress();
});

// Function to update progress bar and text
function updateProgress() {
    const totalLessons = document.querySelectorAll('.lesson-checkbox').length;
    const completedLessons = document.querySelectorAll('.lesson-checkbox:checked').length;
    const progressPercent = (completedLessons / totalLessons) * 100;

    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');

    if (progressBar) {
        progressBar.style.width = `${progressPercent}%`;
    }
    if (progressText) {
        progressText.textContent = `${completedLessons}/${totalLessons} Complete`;
    }
}

// Add event listeners to checkboxes
document.querySelectorAll(".lesson-checkbox").forEach((checkbox) => {
    checkbox.addEventListener("click", async (e) => {
        const isChecked = checkbox.checked;
        const lesson_index = parseInt(checkbox.value);
        const lessonDiv = checkbox.closest(`.lesson-${lesson_index}`);
        
        if (!lessonDiv) return;

        // Update UI
        const lesson_name = lessonDiv.querySelector(`#lesson-name-${lesson_index}`);

        if (lesson_name) {
            if (isChecked) {
                lesson_name.classList.add('line-through');
            } else {
                lesson_name.classList.remove('line-through');
            }
        }

        // Update progress bar
        updateProgress();

        // Update backend/storage
        const resp = await fetch("/is-logged-in");
        const res = await resp.json();

        if (res.isLoggedIn) {
            await fetch('/update-user-lessons-db', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ lesson_index: lesson_index, isChecked: isChecked })
            });
        } else {
            let completedLessons = JSON.parse(localStorage.getItem("completedLessons")) || [];
            if (isChecked) {
                if (!completedLessons.includes(lesson_index)) {
                    completedLessons.push(lesson_index);
                }
            } else {
                completedLessons = completedLessons.filter(item => item !== lesson_index);
            }
            localStorage.setItem("completedLessons", JSON.stringify(completedLessons));
        }
    });
}); 