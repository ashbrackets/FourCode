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
        
        # client = docker.from_env()
    
        # c_code = open(c_file, 'r').read()
        # os.remove(c_file)

        # container = client.containers.run(
        #         "gcc",
        #         command="sh -c 'mkdir -p /app && tail -f /dev/null'",
        #         detach=True,
        #         remove=False
        #     )
        
        # tar_stream = io.BytesIO()
        # with tarfile.open(fileobj=tar_stream, mode='w') as tar:
        #     code_data = c_code.encode('utf-8')
        #     file_info = tarfile.TarInfo(name='test.c')
        #     file_info.size = len(code_data)
        #     tar.addfile(file_info, io.BytesIO(code_data))

        # tar_stream.seek(0)

        # container.put_archive('/app', tar_stream.read())

        # exit_code, output = container.exec_run(
        #     'gcc /app/test.c -o /app/test ',
        #     workdir='/app'
        # )

        # if exit_code != 0:
        #     print(f'Compilation failed. {exit_code}')
        # else:
        #     exit_code, output = container.exec_run('/app/test', workdir='/app')
        #     return (output.decode('utf-8'))
    
        # if 'container' in locals():
        #     container.stop()
        #     container.remove()

        if platform.system() == "Windows":
            exe_file += ".exe"

        compile_process = subprocess.run(
            ["gcc", c_file, "-o", exe_file],
            text=True,
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
        
