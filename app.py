from flask import Flask, render_template, request, jsonify
from static.compiler.compiler import Compiler

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/run', methods=['POST'])
def run_code():
    code = request.json.get('code')
    
    compiler = Compiler(code)
    compiler.compile()
    # return output
    return jsonify({"result": code})

