from pathlib import Path
from flask import Flask, redirect, render_template, request, jsonify, url_for
from compiler.compiler import Compiler
import compiler.test as diff
import os, uuid, markdown


app = Flask(__name__)

TEMP_DIR = "temp_files"
os.makedirs(TEMP_DIR, exist_ok=True)

LESSONS_FOLDER = os.path.join(app.static_folder, "lessons")
LESSONS = sorted(os.listdir(LESSONS_FOLDER))

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/playground')
def playground():
    return render_template('playground.html')

@app.route('/about')
def about():
    return render_template('about.html')

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

@app.route('/run', methods=['POST'])
def run_code():
    code = request.json.get('code').strip()
    if not code:
        return jsonify({"result": "No code provided"})

    file_id = str(uuid.uuid4())
    c_file = os.path.join(TEMP_DIR, f"{file_id}.c")
    exe_file = os.path.join(TEMP_DIR, f"{file_id}")

    compiler = Compiler(code)
    error = compiler.compile(c_file)
    if error:
        return jsonify({"error": error["error"], 
                        "line": error["line"], 
                        "pos": error["pos"], 
                        "curLineNo": error["curLineNo"], 
                        "curPos": error["curPos"]
                        })
    
    output = compiler.run(c_file, exe_file)
    print("Output: ", output)
    return jsonify({"result": output})

class TempError(Exception):
    pass

class AnotherTempError(Exception):
    pass

def another_temp_func():
    raise AnotherTempError("hello")

def diff_funcc():
    diff.diff_func()

def temp_func():
    diff_funcc()
    another_temp_func()
    raise TempError()

@app.route('/testing', methods=['POST'])
def testing():
    output = "Fail"
    try:

        temp_func()
        return jsonify(output)
    except Exception as e:
        output = "yo"
    # except TempError as e:
    #     output = "Win"
    # except AnotherTempError as e:
    #     output = str(e)
    # except diff.DiffError as e:
    #     output = 'diff'
    return jsonify(output)

@app.route('/test')
def test():
    return render_template('test.html')

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)