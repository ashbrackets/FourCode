# Emitter object keeps track of the generated code and outputs it.
class Emitter:
    def __init__(self, fullPath):
        self.fullPath = fullPath
        self.header = ""
        self.code = ""
        self.curPos = 0

    def emit(self, code):
        self.code += code
        self.curPos += len(code)

    def emitLine(self, code):
        self.code += code + '\n'
        self.curPos += len(code)

    def headerLine(self, code):
        self.header += code + '\n'

    def writeFile(self):
        with open(self.fullPath, 'w') as outputFile:
            outputFile.write(self.header + self.code)