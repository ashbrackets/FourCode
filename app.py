from flask import Flask, render_template, request, jsonify
from static.compiler.compiler import Compiler
import subprocess, os, uuid


app = Flask(__name__)

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


    compiler = Compiler(code)
    error = compiler.compile()
    if error:
        return jsonify({"result": error})
    
    # return output
    return jsonify({"result": code})

