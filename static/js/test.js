document.getElementById("test-button").addEventListener('click', async () => {
    const response = await fetch('/testing', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
    });
    let result = await response.json()
    console.log(result)
})