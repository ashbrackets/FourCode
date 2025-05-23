import enum
# import sys
class LexerError(Exception):
    pass

class Lexer:
    def __init__(self, source):
        self.source = source + '\n'
        self.curChar = ''
        self.curPos = -1
        self.lineNo = 0
        self.linePos = -1
        self.error = ''
        self.debug = []
        self.nextChar()

    def nextChar(self):
        self.curPos += 1
        if self.curPos >= len(self.source):
            self.curChar = '\0'
        else:
            self.curChar = self.source[self.curPos]
            print(f'{self.curPos}: "{self.curChar}"')
            if self.curChar != "\n":
                self.linePos += 1
            print(f"{self.lineNo}:{self.linePos}, {self.curPos}: \"{str('\\n') if self.curChar == "\n" else self.curChar}\"")

    def prevChar(self):
        print(f'"{self.curChar}"')
        self.curPos -= 1
        if self.curPos <= 0:
            self.curChar = '\0'
        else:
            self.curChar = self.source[self.curPos]
            self.linePos -= 1

    def peek(self):
        if self.curPos + 1 >= len(self.source):
            return '\0'
        return self.source[self.curPos + 1]
    
    def addError(self, message):
        # if "Lexing Error" not in self.error:
        #     self.error += "Lexing Error: \n\t" 
        self.error += '<b><u>Line ' + str(self.lineNo + 1) + ':' + str(self.linePos + 1) + ':</u></b> '
        self.error += message + '\n\t'
        raise LexerError("Lexer Error: " + self.error)

    def skipWhitespace(self):
        while self.curChar == ' ' or self.curChar == "\t" or self.curChar == '\r':
            self.nextChar()

    def skipComment(self):
        if self.curChar == '#':
            while self.curChar != '\n':
                self.nextChar()

    def getToken(self):
        self.skipWhitespace()
        self.skipComment()
        token = None
        startLinePos = self.linePos
        if self.curChar == '+':
            token = Token(self.curChar, TokenType.PLUS)
        elif self.curChar == '-':
            token = Token(self.curChar, TokenType.MINUS)
        elif self.curChar == '*':
            token = Token(self.curChar, TokenType.ASTERISK)
        elif self.curChar == '/':
            token = Token(self.curChar, TokenType.SLASH)
        elif self.curChar == '=':
            if self.peek() == '=':
                lastChar = self.curChar
                self.nextChar()
                token = Token(lastChar + self.curChar, TokenType.EQEQ)
            else:
                token = Token(self.curChar, TokenType.EQ)
        elif self.curChar == '>':
            if self.peek() == '=':
                lastChar = self.curChar
                self.nextChar()
                token = Token(lastChar + self.curChar, TokenType.GTEQ)
            else:
                token = Token(self.curChar, TokenType.GT)
        elif self.curChar == '<':
            if self.peek() == '=':
                lastChar = self.curChar
                self.nextChar()
                token = Token(lastChar + self.curChar, TokenType.LTEQ)
            else:
                token = Token(self.curChar, TokenType.LT)
        elif self.curChar == '!':
            if self.peek() == '=':
                lastChar = self.curChar
                self.nextChar()
                token = Token(lastChar + self.curChar, TokenType.NOTEQ)
            else:
                self.addError("Expected !=, got !" + self.peek())
                token = Token(self.curChar, TokenType.UNKNOWN)
        elif self.curChar == '\"':
            self.nextChar()
            startPos = self.curPos

            while self.curChar != '\"' and self.curChar != '\0':
                isIncompleteString = False
                if self.peek() == '\0' or self.peek() == '\n':
                    isIncompleteString = True
                    while self.curChar == " ":
                        self.prevChar()
                    self.addError("String needs a end quote.")
                    token = Token(self.error, TokenType.ERROR)
                errorChar = None
                if self.curChar == '\r':
                    errorChar = '\\r' 
                elif self.curChar == '\n':
                    errorChar = '\\n'  
                elif self.curChar == '\t':
                    errorChar = '\\t' 
                elif self.curChar == '\\':
                    errorChar = '\\' 
                elif self.curChar == '%':
                    errorChar = '%'
                if errorChar and not isIncompleteString:
                    self.addError(errorChar + " not allowed in strings in this language. Allowed in most other languages")
                self.nextChar()

            string = self.source[startPos : self.curPos]
            token = Token(string, TokenType.STRING)
        elif self.curChar.isdigit():
            # Number is either INTEGER or DECIMAL
            startPos = self.curPos
            while self.peek().isdigit():
                self.nextChar()
            isDecimal = False
            if self.peek() == '.':
                # Its a decimal
                self.nextChar()

                if not self.peek().isdigit():
                    self.addError('Number cannot end with ''.''')
                isDecimal = True
                while self.peek().isdigit():
                    self.nextChar()
            number = self.source[startPos : self.curPos + 1]
            if isDecimal:
                token = Token(number, TokenType.DECIMAL)    
            else:
                token = Token(number, TokenType.INTEGER)
        elif self.curChar.isalpha():
            # If it is a letter, it is either a variable or keyword
            startPos = self.curPos
            while self.peek().isalpha():
                self.nextChar()
            
            tokenText = self.source[startPos : self.curPos + 1]
            keyword = Token.checkIfKeyword(tokenText)
            if keyword == None:
                token = Token(tokenText, TokenType.VARIABLE)
            else:
                token = Token(tokenText, keyword)
        elif self.curChar == '\n':
            token = Token('\\n', TokenType.NEWLINE)
            self.lineNo += 1
            self.linePos = -1
        elif self.curChar == '\0':
            token = Token('', TokenType.EOF)
        elif self.curChar == ';':
            token = Token(';', TokenType.IGNORE)
        else:
            self.addError('Unknown Token: ' + self.curChar)
            token = Token('', TokenType.UNKNOWN)
        
        if self.error:
            return Token(self.error, TokenType.ERROR)

        self.nextChar()
        token.setPos(self.lineNo, startLinePos, self.linePos)
        return token


class Token:
    def __init__(self, tokenText, tokenKind):
        self.text = tokenText
        self.kind = tokenKind
        self.lineNo = -1
        self.startLinePos = -1
        self.endLinePos = -1
    
    def setPos(self, lineNo, startLinePos, endLinePos):
        self.lineNo = lineNo
        self.startLinePos = startLinePos
        self.endLinePos = endLinePos

    @staticmethod
    def checkIfKeyword(tokenText):
        return KEYWORDS.get(tokenText.upper(), None)

class TokenType(enum.Enum):
    ERROR = -4
    IGNORE = -3 
    UNKNOWN = -2
    EOF = -1
    NEWLINE = 0
    INTEGER = 1
    DECIMAL = 2
    VARIABLE = 3
    STRING = 4
    # Keywords.
    PRINT = 103
    INPUT = 104
    VAR = 105
    IF = 106
    ELSEIF = 107
    ELSE = 108
    END = 109
    WHILE = 110
    REPEAT = 111
    FOR = 112
    FROM = 113
    TO = 114
    STEP = 115
    FUNCTION = 116
    RETURN = 117
    # Operators.
    EQ = 201  
    PLUS = 202
    MINUS = 203
    ASTERISK = 204
    SLASH = 205
    EQEQ = 206
    NOTEQ = 207
    LT = 208
    LTEQ = 209
    GT = 210
    GTEQ = 211

KEYWORDS = {
    'PRINT': TokenType.PRINT,
    'INPUT': TokenType.INPUT,
    'VAR': TokenType.VAR,
    'IF': TokenType.IF,
    'ELSEIF': TokenType.ELSEIF,
    'ELSE': TokenType.ELSE,
    'END': TokenType.END,
    'WHILE': TokenType.WHILE,
    'REPEAT': TokenType.REPEAT,
    'FOR': TokenType.FOR,
    'FROM': TokenType.FROM,
    'TO': TokenType.TO,
    'STEP': TokenType.STEP,
}