from static.compiler.lexer import Lexer
from static.compiler.parser import Parser
from static.compiler.emitter import Emitter
import subprocess

class Compiler:
    def __init__(self, code):
        self.code = code

    def compile(self):
        lexer = Lexer(self.code)
        emitter = Emitter("out.c")
        parser = Parser(lexer, emitter)

        error = parser.program()
        if error:
            return error 
        emitter.writeFile()

    def run(self):
        pass

def compile_c_file(c_file_path, output_executable_path):
    try:
        subprocess.run(["gcc", c_file_path, "-o", output_executable_path], check=True)
        return True, "Compilation successful"
    except subprocess.CalledProcessError as e:
        return False, f"Compilation failed: {e}"

def execute_program(executable_path, input_data=None):
    try:
        process = subprocess.Popen(
            [executable_path],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        
        # Send input data to the program (if any)
        if input_data:
            stdout, stderr = process.communicate(input=input_data)
        else:
            stdout, stderr = process.communicate()
        
        return stdout, stderr
    except Exception as e:
        return None, f"Execution failed: {e}"
