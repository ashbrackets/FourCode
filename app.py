from flask import Flask, redirect, render_template, request, jsonify, url_for
from static.compiler.compiler import Compiler
import os, uuid, markdown


app = Flask(__name__)

STATIC_TEMP_DIR = os.path.join(app.static_folder, "temp_files")
os.makedirs(STATIC_TEMP_DIR, exist_ok=True)

LESSONS_FOLDER = os.path.join(app.static_folder, "lessons")
LESSONS = sorted(os.listdir(LESSONS_FOLDER))

def get_lesson_content(filename):
    """Read and convert a Markdown file to HTML."""
    filepath = os.path.join(LESSONS_FOLDER, filename)
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
    return markdown.markdown(content)

@app.route('/learn')
def learn():
    lesson_index = request.args.get("lesson_index", None)
    if lesson_index is None:
        return redirect(url_for("learn", lesson_index=0))
    if not LESSONS:  # If there are no lessons, show an error
        return "No lessons found", 404
    try:
        lesson_index = int(lesson_index)  # Convert to integer
    except ValueError:
        return "Invalid lesson index", 400  # Handle invalid numbers

    if lesson_index < 0 or lesson_index >= len(LESSONS):
        return "Lesson not found", 404  # Prevent out-of-bounds access

    lesson_content = get_lesson_content(LESSONS[lesson_index])

    return render_template("learn.html", 
                           content=lesson_content, 
                           lesson_index=lesson_index, 
                           total_lessons=len(LESSONS))

@app.route("/learn/<int:lesson_index>")
def lesson(lesson_index):
    """Displays a specific lesson by index."""
    if lesson_index < 0 or lesson_index >= len(LESSONS):
        return "Lesson not found", 404

    lesson_content = get_lesson_content(LESSONS[lesson_index])
    
    return render_template("learn.html", 
                           content=lesson_content, 
                           lesson_index=lesson_index, 
                           total_lessons=len(LESSONS))


@app.route('/run', methods=['POST'])
def run_code():
    code = request.json.get('code').strip()
    if not code:
        return jsonify({"result": "No code provided"})

    file_id = str(uuid.uuid4())
    c_file = os.path.join(STATIC_TEMP_DIR, f"{file_id}.c")
    exe_file = os.path.join(STATIC_TEMP_DIR, f'{file_id}.exe')

    compiler = Compiler(code)
    error = compiler.compile(c_file)
    if error:
        return jsonify({"error": error["error"], "line": error["line"], "pos": error["pos"]})
    
    output = compiler.run(c_file, exe_file)
    # return output
    return jsonify({"result": output})

