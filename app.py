from flask import Flask, redirect, render_template, request, jsonify, url_for, flash, session
from werkzeug.security import generate_password_hash, check_password_hash
from dotenv import load_dotenv
from compiler.compiler import Compiler
import os, uuid, markdown, datetime, psycopg2
import compiler.test as diff

load_dotenv(override=True)

app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY")


TEMP_DIR = "temp_files"
os.makedirs(TEMP_DIR, exist_ok=True)

LESSONS_FOLDER = os.path.join(app.static_folder, "lessons")
LESSONS = sorted(os.listdir(LESSONS_FOLDER))

def get_db_connection():
    print(os.getenv('DATABASE_URL'))
    return psycopg2.connect(os.getenv('DATABASE_URL'))

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

@app.route("/login", methods=['GET', 'POST'])
def login():
    if request.method == "POST":
        username = request.form["username"]
        password = request.form["password"]
        
        conn = get_db_connection()
        cur = conn.cursor()

        try:
            if app.debug:
                cur.execute('SELECT * FROM test WHERE username = %s', (username,))
            else:
                cur.execute('SELECT * FROM users WHERE username = %s', (username,))
            user = cur.fetchone()
            if not user:
                session['pending_user'] = {
                    'username': username,
                    'password': password
                }
                return redirect(url_for('confirm_signup'))
            else:
                if check_password_hash(user[2], password):
                    session['user'] = username
                    flash('Logged in successfully!', 'success')
                    return redirect(url_for('learn'))
                else:
                    flash('Incorrect Password!', 'error')
                    return redirect(url_for('login'))
        except Exception as e:
            conn.rollback()
            flash(f'An error occurred {e}', 'error')
            return redirect(url_for('login'))
        finally:
            cur.close()
            conn.close()
    return render_template("login.html")

@app.route('/confirm-signup', methods=['GET', 'POST'])
def confirm_signup():
    if 'pending_user' not in session:
        return redirect(url_for('login'))
    
    if request.method == 'POST':
        username = session['pending_user']['username']
        password = session['pending_user']['password']

        conn = get_db_connection()
        cur = conn.cursor()

        try:
            hashed_password = generate_password_hash(password)
            if app.debug:
                cur.execute(
                    'INSERT INTO test (username, password, created_at) VALUES (%s, %s, %s)',
                    (username, hashed_password, datetime.datetime.now())
                )
            else:
                cur.execute(
                    'INSERT INTO users (username, password, created_at) VALUES (%s, %s, %s)',
                    (username, hashed_password, datetime.datetime.now())
                )
            conn.commit()
            session['user'] = username
            flash('Account created successfully!', 'success')
            return redirect(url_for('learn'))
        except Exception as e:
            conn.rollback()
            flash('Account creation failed', 'error')
            return redirect(url_for('login'))
        finally:
            session.pop('pending_user', None)
            cur.close()
            conn.close()

    return render_template('confirm_signup.html', 
        username=session['pending_user']['username'], 
        password=session['pending_user']['password']
    )

@app.route("/logout")
def logout():
    session.pop('user', None)
    return redirect(url_for('login'))

@app.route("/user")
def user():
    if 'user' not in session:
        return redirect(url_for('login'))
    return render_template('user.html')


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