from flask import Flask, redirect, render_template, request, jsonify, url_for, flash, session, g
import psycopg2.pool
from werkzeug.security import generate_password_hash, check_password_hash
from dotenv import load_dotenv
from compiler.compiler import Compiler
import os, uuid, markdown, datetime, psycopg2, requests
import compiler.test as diff

load_dotenv(override=True)

app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY")


TEMP_DIR = "temp_files"
os.makedirs(TEMP_DIR, exist_ok=True)

LESSONS_FOLDER = os.path.join(app.static_folder, "lessons")
LESSONS = sorted(os.listdir(LESSONS_FOLDER))

SHOULD_CREATE_LESSONS_DB = False

db_pool = psycopg2.pool.SimpleConnectionPool(1, 10, dsn=os.getenv('DATABASE_URL'))

def get_db_connection():
    if not hasattr(g, 'db_conn'):
        g.db_conn = db_pool.getconn()
    return g.db_conn

@app.teardown_appcontext
def close_db_connection(exception=None):
    db_conn = getattr(g, 'db_conn', None)
    if db_conn is not None:
        db_pool.putconn(db_conn)
        g.db_conn = None

# def get_db_connection():
#     return psycopg2.connect(os.getenv('DATABASE_URL'))


def create_lessons_table():
    conn = get_db_connection()
    cur = conn.cursor()

    try:
        cur.execute("TRUNCATE TABLE lessons RESTART IDENTITY CASCADE")
        LESSONS = sorted(os.listdir(LESSONS_FOLDER))
        for lesson in LESSONS:
            lesson_data = os.path.splitext(lesson)[0].split('_') 
            lesson_id = int(lesson_data[0])
            lesson_name = ' '.join(lesson_data[1:-1])
            lesson_order = lesson_data[-1]

            cur.execute("INSERT INTO lessons (lesson_id, lesson_name, lesson_order) VALUES (%s, %s, %s)", 
                        (lesson_id, lesson_name, lesson_order))
        conn.commit()
        print("LESSONS TABLE CREATED")
    except Exception as e:
        conn.rollback()
        print("LESSONS TABLE CREATION ERROR:", e)
    finally:
        cur.close()
        



def get_lesson_content(filename):
    filepath = os.path.join(LESSONS_FOLDER, filename)
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
    return markdown.markdown(content)


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/playground')
def playground():
    return render_template('playground.html')


@app.route('/about')
def about():
    return render_template('about.html')


@app.route('/learn')
def learn():
    lesson_index = request.args.get("lesson_index", None)
    if lesson_index is None:
        return redirect(url_for("learn", lesson_index=0))
    if not LESSONS: 
        return "No lessons found", 404
    try:
        lesson_index = int(lesson_index)
    except ValueError:
        return "Invalid lesson index", 400 
    if lesson_index < 0 or lesson_index >= len(LESSONS):
        return "Lesson not found", 404  

    lesson_content = get_lesson_content(LESSONS[lesson_index])
    has_completed_lesson = False
    if 'user_id' in session:
        has_completed_lesson = check_lesson_completion(lesson_index)

    return render_template("learn.html", 
                            content=lesson_content, 
                            lesson_index=lesson_index,
                            has_completed_lesson = has_completed_lesson,
                            total_lessons=len(LESSONS))


@app.route('/run', methods=['POST'])
def run_code():
    code = request.json.get('code')
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
                        "startPos": error["startPos"], 
                        "endPos": error["endPos"],
                        })
    output = compiler.run(c_file, exe_file)
    print("Output: ", output)
    return jsonify({"result": output})


@app.route("/login", methods=['GET', 'POST'])
def login():
    if request.method == "POST":
        username = request.form["username"].strip()
        password = request.form["password"].strip()
        

        if len(username) > 20 or len(username) < 3:
            flash('Username should be between 3 to 20 characters.', 'error')
            return render_template(
                'login.html', 
                username=username,
            )
        if len(password) < 8:
            flash('Password should be atleast 8 characters.', 'error')
            return render_template(
                'login.html', 
                username=username,
            )
        if username.isalnum() == False:
            flash('Username should only contain characters a-z, A-Z or 0-9.')
            return render_template(
                'login.html', 
                username=username,
            )   

        conn = get_db_connection()
        cur = conn.cursor()

        try:
            cur.execute('SELECT * FROM users WHERE username = %s', (username,))
            user = cur.fetchone()
            if not user:
                flash("Username already exists.", "error")
                return render_template("login.html")
            else:
                if check_password_hash(user[2], password):
                    session['user_id'] = user[0]
                    session['dp'] = user[4]
                    flash('Logged in successfully!', 'success')
                    return redirect(url_for('lessons'))
                else:
                    flash('Incorrect Password!', 'error')
                    return redirect(url_for('login'))
        except Exception as e:
            conn.rollback()
            flash(f'An error occurred {e}', 'error')
            return redirect(url_for('login'))
        finally:
            cur.close()
            
    return render_template("login.html")


@app.route('/signup', methods=['GET', 'POST'])
def signup():
    username = ''
    password = ''
    if request.method == "POST":
        username = request.form.get("username").strip()
        password = request.form.get("password").strip()
        confirm_password = request.form.get("confirm-password").strip()
        
        input_error = False
        if len(username) > 20 or len(username) < 3:
            flash('Username should be between 3 to 20 characters.', 'error')
            input_error = True
        if len(password) < 8:
            flash('Password should be atleast 8 characters.', 'error')
            input_error = True
        if username.isalnum() == False:
            flash('Username should only contain characters a-z, A-Z or 0-9.')
            input_error = True
        if password != confirm_password:
            flash('Passwords do not match.', 'error')
            input_error = True

        if input_error:
            return render_template(
                'signup.html', 
                username=username,
            )
        
        conn = get_db_connection()
        cur = conn.cursor()

        try:
            hashed_password = generate_password_hash(password)
            cur.execute(
                'INSERT INTO users (username, password, created_at) VALUES (%s, %s, %s)',
                (username, hashed_password, datetime.datetime.now())
            )
            conn.commit()
            cur.execute('SELECT id FROM users WHERE username = %s', (username,))
            user_id = cur.fetchone()
            session['user_id'] = user_id[0]
            flash('Account created successfully!', 'success')
            return redirect(url_for('lessons'))
        except Exception as e:
            conn.rollback()
            flash('Account creation failed', 'error')
            return redirect(url_for('login'))
        finally:
            cur.close()

    return render_template('signup.html', username = username)


@app.route("/logout")
def logout():
    session.pop('user_id', None)
    session.pop('dp', None)
    return redirect(url_for('login'))


@app.route("/user")
def user():
    if 'user_id' not in session:
        return redirect(url_for('login'))
    username = ''
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("SELECT username, dp FROM users WHERE id=%s", (session['user_id'],))
        res = cur.fetchone()
        username = res[0]
        dp = str(res[1])
    except Exception as e:
        conn.rollback()
        flash("Could not get username." + str(e), "error")
    finally:
        cur.close()
    return render_template('user.html', username = username, dp = dp)


@app.route("/is-logged-in")
def is_logged_in():
    if 'user_id' in session:
        return jsonify({'isLoggedIn': True})
    return jsonify({'isLoggedIn': False})


@app.route("/delete-account")
def delete_account():
    user_id = session['user_id']

    conn = get_db_connection()
    cur = conn.cursor()

    try:
        cur.execute('DELETE FROM users WHERE id = %s', (user_id,))
        conn.commit()
        return redirect(url_for('login'))
    except Exception as e:
        conn.rollback()
        flash('Failed to delete account')
        return  redirect(url_for('user'))
    finally:
        cur.close()

@app.route("/lessons")
def lessons():
    lessons = []
    index = 0
    has_lessons = []
    if 'user_id' in session:
        conn = get_db_connection()
        cur = conn.cursor()
        has_lessons = []
        try:
            cur.execute("SELECT l.lesson_id FROM user_lessons ul JOIN lessons l ON ul.lesson_id = l.lesson_id WHERE ul.user_id = %s;", 
                        (session['user_id'],))
            has_lessons = [row[0] for row in cur.fetchall()]
        except Exception as e:
            conn.rollback()
            flash("GET LESSONS ERROR:", e)
        finally: 
            cur.close()

    # remove later (debug for changing lessons mid run)
    LESSONS = sorted(os.listdir(LESSONS_FOLDER))
    for file in LESSONS:
        name =  os.path.splitext(file)[0].split("_")[1]
        isChecked = True if index in has_lessons else False 
        lessons.append({'name': name, 'index': index, 'isChecked': isChecked})
        index += 1

    return render_template('lessons.html', lessons=lessons)


@app.route("/get-completed-lessons", methods=["POST"])
def get_completed_lessons():
    conn = get_db_connection()
    cur = conn.cursor()
    has_lessons = []
    try:
        cur.execute("SELECT l.lesson_id FROM user_lessons ul JOIN lessons l ON ul.lesson_id = l.lesson_id WHERE ul.user_id = %s;", 
                    (session['user_id'],))
        has_lessons = [row[0] for row in cur.fetchall()]
    except Exception as e:
        conn.rollback()
        flash("GET LESSONS ERROR:", e)
    finally: 
        cur.close()

    return jsonify({'completedLessons': has_lessons})


@app.route("/get_has_completed_lesson", methods=["POST"])
def get_has_completed_lesson():
    lesson_index = request.json.get("lesson_index")
    has_completed_lesson = check_lesson_completion(lesson_index)
    return jsonify({'has_completed_lesson': has_completed_lesson})

def check_lesson_completion(lesson_index):
    conn = get_db_connection()
    cur = conn.cursor()
    has_completed_lesson = False
    try:
        cur.execute("SELECT EXISTS(SELECT 1 FROM user_lessons WHERE lesson_id = %s AND user_id = %s) AS has_completed", (lesson_index, session['user_id']))
        result = cur.fetchone()
        has_completed_lesson = result[0]
    except Exception as e:
        conn.rollback()
        flash("Failed to get if user completed lesson" + str(e), "error")
    finally:
        cur.close()
    return has_completed_lesson


@app.route("/update-user-lessons-db", methods=["POST"])
def update_lessons_db():
    isChecked = request.json.get('isChecked')
    lesson_id = request.json.get('lesson_index')

    if 'user_id' not in session:
        return jsonify({'isChecked': isChecked})
    user_id = session['user_id']

    conn = get_db_connection()
    cur = conn.cursor()

    # TODO check if row exist before operations
    try:
        if isChecked:
            cur.execute("INSERT INTO user_lessons (user_id, lesson_id) VALUES (%s, %s)", (user_id, lesson_id))
        else:
            cur.execute("DELETE FROM user_lessons WHERE user_id = %s AND lesson_id = %s", (user_id, lesson_id))
        conn.commit()
    except Exception as e:
        conn.rollback()
        flash('Lesson update failed', 'error')
    finally:
        cur.close()

    return jsonify({'isChecked': isChecked})


@app.route("/set-dp", methods=["POST"])
def set_dp():
    if "user_id" not in session:
        return jsonify({"result": "error"})
    dp = request.json.get("dp")
    user_id = session["user_id"]
    conn = get_db_connection()
    cur = conn.cursor()

    try:
        cur.execute("UPDATE users SET dp = %s WHERE id = %s", (dp, user_id))
        conn.commit()
        session['dp'] = dp
    except Exception as e:
        conn.rollback()
        flash("set dp error" + str(e), "error")
    finally:
        cur.close()
    return jsonify({"result": "success"})


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

if SHOULD_CREATE_LESSONS_DB:
    create_lessons_table()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)