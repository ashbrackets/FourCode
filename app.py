from flask import Flask, render_template, request, jsonify
from static.compiler.compiler import Compiler
import os, uuid, time


app = Flask(__name__)

STATIC_TEMP_DIR = os.path.join(app.static_folder, "temp_files")
os.makedirs(STATIC_TEMP_DIR, exist_ok=True)

@app.route('/learn')
def index():
    return render_template('learn.html')

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

