from flask import Flask, render_template, request, jsonify
from static.compiler.lexer import Lexer
from static.compiler.parser import Parser
from static.compiler.emitter import Emitter

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/run', methods=['POST'])
def run_code():
    code = request.json.get('code')
    
    
    lexer = Lexer(code)
    emitter = Emitter("out.c")
    parser = Parser(lexer, emitter)

    parser.program()
    emitter.writeFile()
    print("Compilation Complete!!")
    # return output
    return jsonify({"result": code})

