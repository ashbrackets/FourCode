from compiler.lexer import Lexer
from compiler.parser import Parser
from compiler.emitter import Emitter
import os, subprocess, platform

EXECUTION_TIMEOUT = 5

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
        if platform.system() == "Windows":
            exe_file += ".exe"

        compile_process = subprocess.run(
            ["gcc", c_file, "-o", exe_file],
            capture_output=True
        )

        if compile_process.returncode != 0:
            os.remove(c_file)
            return "Compilation Error: " + compile_process.stderr

        run_process = subprocess.run(
            [exe_file],
            text=True,
            capture_output=True
        )

        if run_process.returncode != 0:
            if os.path.exists(exe_file):
                os.remove(exe_file)
            return "Execution Error: " + run_process.stderr
        
        os.remove(c_file)
        if os.path.exists(exe_file):
            os.remove(exe_file)

        return run_process.stdout
        
