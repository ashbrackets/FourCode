from compiler.lexer import *
# import sys

LOOP_LIMIT = 1000

class ParseError(Exception):
    pass

class Parser:
    def __init__(self, lexer, emitter):
        self.lexer = lexer
        self.emitter = emitter
        self.error = ''
        self.lineNo = 0
        self.linePos = 0
        self.isInLoop = False # tracks if currently in a while loop waiting for a token. used in errors

        self.symbols = dict()    # Variables declared so far.
        self.labelsDeclared = set() # Labels declared so far.
        self.labelsGotoed = set() # Labels goto'ed so far.

        self.curToken = None
        self.peekToken = None
        self.nextToken()
        self.nextToken()
    
    def checkToken(self, kind):
        return kind == self.curToken.kind
    
    def checkPeek(self, kind):
        return kind == self.peekToken.kind
    
    def match(self, kind):
        if not self.checkToken(kind):
            self.addError("Expected " + kind.name + ", got " + self.curToken.kind.name)
        self.nextToken()

    def nextToken(self):
        self.linePos = self.lexer.linePos
        self.curToken = self.peekToken
        self.peekToken = self.lexer.getToken()
        if self.peekToken.kind == TokenType.ERROR:
            # self.addError(self.peekToken.text)
            self.error = self.peekToken.text
            print(self.error)
            raise ParseError(self.peekToken.text)
        if self.curToken:
            print(self.curToken.kind)
    
    def addError(self, message):
        self.linePos = self.linePos - len(self.curToken.text) - 1
        self.lineNo = self.lexer.lineNo
        if self.linePos == -1:
            self.lineNo -= 1
            self.linePos = self.lexer.prevLinePos
        # if "Parsing Error" not in self.error:
        #     self.error += "Parsing Error: \n"
        lineData = '<b><u>Line ' + str(self.lineNo) + ':' + str(self.linePos) + ':</u></b> '
        self.error += lineData
        # message = message.split('\n')
        # self.error += message[0]
        # for i in range(1, len(message)):
        #     self.error += "\n" + ' ' * len(lineData) + message[i]
        self.error += message
        if self.isInLoop:
            self.error += " Probably a missing 'end' for a statement."
        self.error += '\n'
        print(self.error)
        print(self.lexer.prevLinePos)
        raise ParseError(self.error)

    def program(self):
        try:
            self.emitter.headerLine("#include <stdio.h>")
            self.emitter.headerLine("#include <string.h>")
            self.emitter.headerLine("int main(void){")
            print('PROGRAM')

            while self.checkToken(TokenType.NEWLINE):
                self.nextToken()
            
            while not self.checkToken(TokenType.EOF):
                self.statement()
            
            print("PROGRAM-END")
            self.emitter.emitLine("return 0;")
            self.emitter.emitLine("}")  
            return None
        except ParseError as e:
            return {"error": self.error, "line": self.lineNo, "pos": self.linePos, "curPos": self.lexer.curPos, "curLineNo": self.lexer.prevLineNo}
        
    def statement(self):
        if self.checkToken(TokenType.PRINT):
            print("PRINT")
            self.nextToken()
            if self.checkToken(TokenType.STRING):
                print("PRINT-STRING")
                self.emitter.emitLine('printf(\"' + self.curToken.text + '\\n\");')
                self.nextToken()
            elif self.checkToken(TokenType.VARIABLE):
                print("PRINT-VARIABLE")
                if not self.symbols.get(self.curToken.text):
                    self.addError("Cannot print unassigned variable. Assign \'" + self.curToken.text + "\' a value.")
                match self.symbols[self.curToken.text]:
                    case TokenType.STRING:
                        self.emitter.emitLine('printf(\"%100s\\n\",' + self.curToken.text + ');')
                        self.nextToken()
                    case TokenType.DECIMAL:
                        self.emitter.emitLine('printf(\"%' + '.2f\\n\", (float)(' + self.curToken.text + '));')
                        self.nextToken()
                    case TokenType.INTEGER:
                        self.emitter.emitLine('printf(\"%' + 'd\\n\", (int)(' + self.curToken.text + '));')
                        self.nextToken()
            else:
                print('PRINT-NUMBER')
                self.emitter.emit('printf(\"%' + '.2f\\n\", (float)(')
                self.expression()
                self.emitter.emitLine('));')
        elif self.checkToken(TokenType.IF):
            print("IF")
            self.nextToken()
            self.emitter.emit('if(')
            if self.checkToken(TokenType.NEWLINE):
                self.addError("Expected comparison after 'if'.")
            self.comparison()

            # Goes on until it finds not nl
            self.nl()
            self.emitter.emitLine('){')
            
            self.isInLoop = True
            while not self.checkToken(TokenType.END):
                if self.checkToken(TokenType.ELSEIF):
                    self.nextToken()
                    self.emitter.emitLine('} else if (')
                    if self.checkToken(TokenType.NEWLINE):
                        self.addError("Expected comparison after 'elseif'.")
                    self.comparison()

                    # Goes on until it finds not nl
                    self.nl()
                    self.emitter.emitLine('){')
                elif self.checkToken(TokenType.ELSE):
                    self.nextToken()
                    self.emitter.emitLine('} else {')
                    self.nl()
                self.statement()
            self.isInLoop = False

            print('IF-END')
            self.match(TokenType.END)
            self.emitter.emitLine('}')
        elif self.checkToken(TokenType.WHILE):
            print('WHILE')
            self.nextToken()
            self.emitter.emitLine("__loop_counter = 0;")
            self.emitter.emit('while(')
            self.comparison()

            self.nl()
            self.emitter.emitLine('){')
            
            # Loop limiter
            if "__loop_counter" not in self.symbols.keys():
                self.symbols["__loop_counter"] = TokenType.INTEGER
                self.emitter.headerLine("int __loop_counter = 0;")
            self.emitter.emitLine("if(__loop_counter >= " + str(LOOP_LIMIT) + "){")
            self.emitter.emit(f"printf(\"Error:\\n\\tLoop limit of {LOOP_LIMIT} has been reached.\");")
            self.emitter.emitLine("break;")
            self.emitter.emitLine("}")
            self.emitter.emitLine("__loop_counter++;")
            
            self.isInLoop = True
            while not self.checkToken(TokenType.END):
                self.statement()
            self.isInLoop = False
            
            print("WHILE-END")
            self.match(TokenType.END)
            self.emitter.emitLine('}')
        elif self.checkToken(TokenType.FOR):
            print("FOR")
            self.nextToken()
            self.emitter.emit("for(")
            varName = self.curToken.text
            if varName not in self.symbols.keys():
                self.symbols[varName] = TokenType.INTEGER
                self.emitter.headerLine("int " + varName + " = 0;")
            else:
                if self.symbols[varName] != TokenType.INTEGER and self.symbols[varName] != TokenType.DECIMAL:\
                    self.addError("\'" + varName + "\' should be either an INTEGER or a DECIMAL.")
            self.emitter.emit(varName + "=")
            self.nextToken()
            self.match(TokenType.FROM)
            self.expression()
            self.emitter.emit(";" + varName + "<=")
            self.match(TokenType.TO)
            self.expression()
            self.emitter.emit(";" + varName + "+=")
            if self.checkToken(TokenType.STEP):
                self.match(TokenType.STEP)
                self.expression()
            else:
                self.emitter.emit("1")
            self.emitter.emitLine("){")
            self.nl()
            
            self.isInLoop = True
            while not self.checkToken(TokenType.END):
                self.statement()
            self.isInLoop = False

            print("FOR-END")
            self.match(TokenType.END)
            self.emitter.emitLine('}')
        elif self.checkToken(TokenType.VAR):
            print("VAR")
            self.nextToken()
            varName = self.curToken.text

            self.match(TokenType.VARIABLE)
            self.match(TokenType.EQ)

            if self.checkToken(TokenType.STRING):
                if varName not in self.symbols.keys():
                    self.symbols[varName] = TokenType.STRING
                    self.emitter.headerLine("char " + varName + "[100] = " + "\"" + self.curToken.text + "\"" + ';')
                self.nextToken()
            elif self.checkToken(TokenType.INTEGER):
                self.emitter.emit(varName + " = ")
                if varName not in self.symbols:
                    self.symbols[varName] = TokenType.INTEGER
                    self.emitter.headerLine("int " + varName + ";")
                self.expression()
                self.emitter.emitLine(";")
            elif self.checkToken(TokenType.DECIMAL):
                self.emitter.emit(varName + " = ")
                if varName not in self.symbols:
                    self.symbols[varName] = TokenType.DECIMAL
                    self.emitter.headerLine("float " + varName + ";")
                self.expression()
                self.emitter.emitLine(";")
        elif self.checkToken(TokenType.VARIABLE):
            if self.curToken.text not in self.symbols.keys():
                self.addError("Referencing variable before assignment: " + self.curToken.text)
            print("VARIABLE " + str(self.symbols[self.curToken.text]))
            if self.symbols[self.curToken.text] == TokenType.STRING:
                self.emitter.emit("strcpy(")
                self.emitter.emit(self.curToken.text + ',')
                self.nextToken()
                self.match(TokenType.EQ)
                self.emitter.emit("\"" + self.curToken.text + "\"")
                self.nextToken()
                self.emitter.emitLine(');')
            else:
                self.emitter.emit(self.curToken.text)
                self.nextToken()
                self.match(TokenType.EQ)
                self.emitter.emit(" = ")
                self.expression()
                self.emitter.emitLine(";")
        else:
            self.addError("Invalid statement at \'" + self.curToken.text + "\' (" + self.curToken.kind.name + ")")

        self.nl()
    
    # comparison ::= expression (("==" | "!=" | ">" | ">=" | "<" | "<=") expression)+
    def comparison(self):
        print('COMPARISON')
        self.expression()
        # Must be at least one comparison operator and another expression.
        if self.isComparisonOperator():
            self.emitter.emit(self.curToken.text)
            self.nextToken()
            self.expression()
        # Can have 0 or more comparison operator and expressions.
        while self.isComparisonOperator():
            self.emitter.emit(self.curToken.text)
            self.nextToken()
            self.expression()

    # Return true if the current token is a comparison operator.
    def isComparisonOperator(self):
        return self.checkToken(TokenType.GT) or self.checkToken(TokenType.GTEQ) or self.checkToken(TokenType.LT) or self.checkToken(TokenType.LTEQ) or self.checkToken(TokenType.EQEQ) or self.checkToken(TokenType.NOTEQ)

    # expression ::= term {( "-" | "+" ) term}
    def expression(self):
        print('EXPRESSION')
        self.term()
        # Can have 0 or more +/- and expressions.
        while self.checkToken(TokenType.PLUS) or self.checkToken(TokenType.MINUS):
            self.emitter.emit(self.curToken.text)
            self.nextToken()
            self.term()


    # term ::= unary {( "/" | "*" ) unary}
    def term(self):
        print('TERM')
        self.unary()
        # Can have 0 or more *// and expressions.
        while self.checkToken(TokenType.ASTERISK) or self.checkToken(TokenType.SLASH):
            self.emitter.emit(self.curToken.text)
            self.nextToken()
            self.unary()


    # unary ::= ["+" | "-"] primary
    def unary(self):
        print('UNARY')
        # Optional unary +/-
        if self.checkToken(TokenType.PLUS) or self.checkToken(TokenType.MINUS):
            self.emitter.emit(self.curToken.text)
            self.nextToken()        
        self.primary()

    # primary ::= number | ident
    def primary(self):
        print('PRIMARY')
        if self.checkToken(TokenType.INTEGER) or self.checkToken(TokenType.DECIMAL): 
            self.emitter.emit(self.curToken.text)
            self.nextToken()
        elif self.checkToken(TokenType.VARIABLE):
            # Ensure the variable already exists.
            if self.curToken.text not in self.symbols:
                self.addError("Referencing variable before assignment: " + self.curToken.text)

            self.emitter.emit(self.curToken.text)
            self.nextToken()
        else:
            # Error!
            self.addError("Unexpected token at \'" + self.curToken.text + f"\' ({self.curToken.kind}). Expecting either a INTEGER or DECIMAL. If VARIABLE, make sure it is either an INTEGER or DECIMAL.")

    # nl ::= '\n'+
    def nl(self):
        print('NL')
        # Require at least one newline.
        self.match(TokenType.NEWLINE)
        # But we will allow extra newlines too, of course.
        while self.checkToken(TokenType.NEWLINE):
            self.nextToken()