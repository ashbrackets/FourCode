from static.compiler.lexer import Lexer
from static.compiler.parser import Parser
from static.compiler.emitter import Emitter
from flask import jsonify
import subprocess, os, time

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
            try:
                os.remove(exe_file)
            except PermissionError:
                time.sleep(1)  # Wait for 1 second and try again
                os.remove(exe_file)
            return jsonify({"error": compile_process.stderr.decode()})

        # Execute the compiled program
        try:
            process = subprocess.Popen(
                [exe_file],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
            )
            output = process.stdout
            error = process.stderr
        except Exception as e:
            output = ""
            error = str(e)

        try:
            os.remove(c_file)
        except PermissionError:
            time.sleep(1)  # Wait for 1 second and try again
            os.remove(c_file)
        
        try:
            os.remove(exe_file)
        except PermissionError:
            time.sleep(1)  # Wait for 1 second and try again
            os.remove(exe_file)

        if process.returncode != 0:
            print(str(error))
            return jsonify({"error": error})
        return jsonify({"output": output})

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
