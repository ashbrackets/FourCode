from pathlib import Path
from flask import Flask, redirect, render_template, request, jsonify, url_for, session
from flask_sqlalchemy import SQLAlchemy
from flask_wtf.csrf import CSRFProtect
from compiler.compiler import Compiler
import os, uuid, markdown, bcrypt, dotenv
import compiler.test as diff

app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get("SECRET_KEY", 'curb-your-david')
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get("DATABASE_URL")
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SECURE'] = True  # Enable in production
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'

csrf = CSRFProtect(app)
db = SQLAlchemy(app)

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(120), nullable=False)

TEMP_DIR = "temp_files"
os.makedirs(TEMP_DIR, exist_ok=True)

LESSONS_FOLDER = os.path.join(app.static_folder, "lessons")
LESSONS = sorted(os.listdir(LESSONS_FOLDER))

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/playground')
def playground():
    return render_template('playground.html')

@app.route('/about')
def about():
    return render_template('about.html')

def get_lesson_content(filename):
    """Read and convert a Markdown file to HTML."""
    filepath = os.path.join(LESSONS_FOLDER, filename)
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
    return markdown.markdown(content)

@app.route('/learn')
def learn():
    lesson_index = request.args.get("lesson_index", None)
    if lesson_index is None:
        return redirect(url_for("learn", lesson_index=0))
    if not LESSONS:  # If there are no lessons, show an error
        return "No lessons found", 404
    try:
        lesson_index = int(lesson_index)  # Convert to integer
    except ValueError:
        return "Invalid lesson index", 400  # Handle invalid numbers

    if lesson_index < 0 or lesson_index >= len(LESSONS):
        return "Lesson not found", 404  # Prevent out-of-bounds access

    lesson_content = get_lesson_content(LESSONS[lesson_index])

    return render_template("learn.html", 
                           content=lesson_content, 
                           lesson_index=lesson_index, 
                           total_lessons=len(LESSONS))

@app.route('/run', methods=['POST'])
def run_code():
    code = request.json.get('code').strip()
    if not code:
        return jsonify({"result": "No code provided"})

    file_id = str(uuid.uuid4())
    c_file = os.path.join(TEMP_DIR, f"{file_id}.c")
    exe_file = os.path.join(TEMP_DIR, f"{file_id}")

    compiler = Compiler(code)
    error = compiler.compile(c_file)
    if error:
        return jsonify({"error": error["error"], 
                        "line": error["line"], 
                        "pos": error["pos"], 
                        "curLineNo": error["curLineNo"], 
                        "curPos": error["curPos"]
                        })
    
    output = compiler.run(c_file, exe_file)
    print("Output: ", output)
    return jsonify({"result": output})

@app.route("/login", methods=['GET'])
def login_page():
    return render_template("login.html")

@app.route("/login", methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username', '').strip()
    password = data.get('password', '').strip()

    if not username or not password:
        return jsonify({'error': 'Username and password are required'}), 400
    
    user = User.query.filter_by(username=username).first()

    if not user or not bcrypt.checkpw(password.encode('utf-8'), user.password_hash):
        return jsonify({'error': 'Invalid credentials'}), 401

    session['user_id'] = user.id
    return jsonify({'redirect': '/learn'})


class TempError(Exception):
    pass

class AnotherTempError(Exception):
    pass

def another_temp_func():
    raise AnotherTempError("hello")

def diff_funcc():
    diff.diff_func()

def temp_func():
    diff_funcc()
    another_temp_func()
    raise TempError()

@app.route('/testing', methods=['POST'])
def testing():
    output = "Fail"
    try:

        temp_func()
        return jsonify(output)
    except Exception as e:
        output = "yo"
    # except TempError as e:
    #     output = "Win"
    # except AnotherTempError as e:
    #     output = str(e)
    # except diff.DiffError as e:
    #     output = 'diff'
    return jsonify(output)

@app.route('/test')
def test():
    return render_template('test.html')

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)