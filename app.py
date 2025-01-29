from flask import Flask, render_template, request, jsonify
from static.compiler.compiler import Compiler
import os, uuid


app = Flask(__name__)

STATIC_TEMP_DIR = os.path.join(app.static_folder, "temp_files")
TEMP_DIR = "temp_files"
os.makedirs(TEMP_DIR, exist_ok=True)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/run', methods=['POST'])
def run_code():
    code = request.json.get('code').strip()
    print(code)
    if not code:
        return jsonify({"result": "No code provided"})

    file_id = str(uuid.uuid4())
    c_file = os.path.join(TEMP_DIR, f"{file_id}.c")
    exe_file = os.path.join(TEMP_DIR, f'{file_id}.exe')

    compiler = Compiler(code)
    error = compiler.compile(c_file)
    if error:
        return jsonify({"result": error})
    print(error)
    code = compiler.run(c_file, exe_file)

    # return output
    return jsonify({"result": code})

