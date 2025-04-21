from compiler.lexer import Lexer, LexerError
from compiler.parser import Parser, ParserError
from compiler.emitter import Emitter
import os, subprocess, platform, re

EXECUTION_TIMEOUT = 5

class Compiler:
    def __init__(self, code):
        self.code = code
        self.lexer = None
        self.parser = None
        self.emitter = None

    def compile(self, filepath):
        # NOTE: IDK why i added the try catch, can't think of an error that can occur. 
        try:
            self.lexer = Lexer(self.code)
            self.emitter = Emitter(filepath)
            self.parser = Parser(self.lexer, self.emitter)
        except LexerError as e:
            print("LexerError", e)
            print(self.lexer.curPos)
            return {"error": str(e), 
                    "line": 0, 
                    "startPos": self.lexer.linePos,
                    "endPos": self.lexer.linePos
                    }
        except ParserError as e:
            print("ParserError", e)
            return "Parser"
            # errormsg = str(e)
            # errData = re.search(r'Line (\d+):(\d+)', errormsg)
            # print(type(e))
            # print(e)
            # print(str(e))
            # return {"error": str(e),
            #         "line": int(errData.group(1)) - 1,
            #         "pos": int(errData.group(2)) - 1,
            #         "curLineNo": 0,
            #         "curPos": 0
            #         }
        error = self.parser.program()
        if error:
            print("Compiler Stage: ", error)
            return error
        self.emitter.writeFile()

    def run(self, c_file, exe_file):
        if platform.system() == "Windows":
            exe_file += ".exe"
        compile_process = subprocess.run(
            ["gcc", "-O0", "-g0", c_file, "-o", exe_file, '-Werror'],
            text=True,
            capture_output=True
        )
        print(1)
        if compile_process.returncode != 0:
            os.remove(c_file)
            return "Compilation Error: " + compile_process.stderr
        
        try:
            run_process = subprocess.run(
                [exe_file],
                text=True,
                capture_output=True,
                check=True
            )
            print(2)
        except subprocess.CalledProcessError as e:
            if e.returncode != 0:
                os.remove(c_file)
                if os.path.exists(exe_file):
                    os.remove(exe_file)
                return f"1Execution Error: '{str(e.stderr)}' + '{str(e.stdout)}' + '{str(e.returncode)}'"
            else:
                os.remove(c_file)
                if os.path.exists(exe_file):
                    os.remove(exe_file)
                return f"2Execution Error: '{str(e.stderr)}' + '{str(e.stdout)}' + '{str(e.returncode)}'"

        
        if os.path.exists(exe_file):
            os.remove(exe_file)
        os.remove(c_file)

        return run_process.stdout
        
