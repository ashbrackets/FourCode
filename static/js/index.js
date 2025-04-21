import { createEditor } from './editor.js'

let editor;

const fibonacciCode = `var a = 0
var b = 1
var c = a + b
for i from 3 to 10
    print c
    a = b
b = c
    c = a + b
end`

const greaterCode = `var a = 10
var b = 20

if a > b
	print "a is greater"
elseif a < b
	print "b is greater"
else
	print "a is equal to b"
end`

const lut = { "fibonacciCode": fibonacciCode, "greaterCode": greaterCode }

document.addEventListener('DOMContentLoaded', () => {
    // Initialize the code editor
    editor = createEditor('code-editor');
    editor.setSize("100%", "100%");
    const ed = document.querySelector(".CodeMirror")
    editor.setOption("readOnly", "nocursor")
    if (window.screen.width < 640) {
        ed.style.fontSize = "16px"
    } else {
        ed.style.fontSize = "24px"
    }
    editor.setValue(fibonacciCode)
});

document.querySelectorAll(".codeExample").forEach((button) => {
    button.addEventListener("click", (e) => {
        editor.setValue(lut[button.id])
        document.querySelectorAll(".codeExample").forEach((but) => {
            if (but.id !== button.id) {
                but.classList.remove("ring-2")
                but.classList.remove("ring-gray-500")
            }
        })
        button.classList.add("ring-2", "ring-gray-500")
    })
})
