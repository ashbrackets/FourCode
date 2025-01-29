from lexer import *
# import sys

class Parser:
    def __init__(self, lexer, emitter):
        self.lexer = lexer
        self.emitter = emitter
        self.error = ''
        self.linePos = 0

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
        if self.curToken:
            print(self.curToken.kind)
    
    def addError(self, message):
        linePos = self.linePos - len(self.curToken.text) - 1
        lineNo = self.lexer.lineNo
        if linePos == -1:
            lineNo -= 1
            linePos = self.lexer.prevLinePos
        if "Parsing Error" not in self.error:
            self.error += "Parsing Error: \n\t" 
        self.error += 'line ' + str(lineNo) + ':' + str(linePos) + ' '
        self.error += message + '\n\t'
        # sys.exit("Parsing error. \n\t" + self.error)

    def program(self):
        self.emitter.headerLine("#include <stdio.h>")
        self.emitter.headerLine("#include <string.h>")
        self.emitter.headerLine("int main(void){")
        print('PROGRAM')


        while self.checkToken(TokenType.NEWLINE):
            self.nextToken()
        
        while not self.checkToken(TokenType.EOF):
            if self.error != '':
                print(self.error)
                break
            self.statement()
        
        print("PROGRAM-END")
        self.emitter.emitLine("return 0;")
        self.emitter.emitLine("}")
        
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
                match self.symbols[self.curToken.text]:
                    case TokenType.STRING:
                        self.emitter.emitLine('printf(\"' + self.curToken.text + '\\n\");')
                        self.nextToken()
                    case TokenType.DECIMAL:
                        self.emitter.emitLine('printf(\"%' + '.2f\\n\", (float)(' + self.curToken.text + '));')
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
                print("yo")

            print('IF-END')
            self.match(TokenType.END)
            self.emitter.emitLine('}')
        elif self.checkToken(TokenType.WHILE):
            print('WHILE')
            self.nextToken()
            self.emitter.emit('while(')
            self.comparison()

            self.nl()
            self.emitter.emitLine('){')

            while not self.checkToken(TokenType.END):
                self.statement()
            
            print("WHILE-END")
            self.match(TokenType.END)
            self.emitter.emitLine('}')
        elif self.checkToken(TokenType.VAR):
            print("VAR")
            self.nextToken()
            varName = self.curToken.text

            self.match(TokenType.VARIABLE)
            self.match(TokenType.EQ)

            if self.checkToken(TokenType.STRING):
                if varName not in self.symbols:
                    self.symbols[varName] = TokenType.STRING
                    self.emitter.headerLine("char " + varName + "[100] = " + "\"" + self.curToken.text + "\"" + ';')
                self.nextToken()
            else:
                self.emitter.emit(varName + " = ")  
                if varName not in self.symbols:
                    self.symbols[varName] = TokenType.DECIMAL
                    self.emitter.headerLine("float " + varName + ";")
                self.expression()
                self.emitter.emitLine(";")
        elif self.checkToken(TokenType.VARIABLE):
            if self.curToken.text not in self.symbols:
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
            self.addError("Unexpected token at " + self.curToken.text)

    # nl ::= '\n'+
    def nl(self):
        print('NL')
        # Require at least one newline.
        self.match(TokenType.NEWLINE)
        # But we will allow extra newlines too, of course.
        while self.checkToken(TokenType.NEWLINE):
            self.nextToken()