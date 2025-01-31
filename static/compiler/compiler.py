from static.compiler.lexer import Lexer
from static.compiler.parser import Parser
from static.compiler.emitter import Emitter
import subprocess, os

class Compiler:
    def __init__(self, code):
        self.code = code

    def compile(self, filepath):
        lexer = Lexer(self.code)
        emitter = Emitter(filepath)
        parser = Parser(lexer, emitter)

        error = parser.program()
        if error:
            return error
        emitter.writeFile()

    def run(self, c_file, exe_file):
        compile_process = subprocess.run(
            ["gcc", c_file, "-o", exe_file],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )

        if compile_process.returncode != 0:
            os.remove(exe_file)
            return compile_process.stderr.decode()

        # Execute the compiled program
        process = subprocess.Popen(
            [exe_file],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
        )
    
        output, error = process.communicate()

        os.remove(c_file)
        os.remove(exe_file)

        if process.returncode != 0:
            return error
        return output
