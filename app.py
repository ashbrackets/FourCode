from flask import Flask, render_template, request, jsonify
from compiler.lexer import Lexer
from compiler.parser import Parser

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/run', methods=['POST'])
def run_code():
    code = request.json.get('code')
    
    
    lexer = Lexer(code)
    parser = Parser(lexer)

    parser.program()

    # return output
    return jsonify({"result": code})

