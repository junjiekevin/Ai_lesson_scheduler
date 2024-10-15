from flask import Flask, render_template, request, redirect, url_for

from flask_sqlalchemy import SQLAlchemy

# Initializing Flask app
app = Flask(__name__)

# DB URI for SQLAlchemy; Had some issues with creating DB on my laptop. 
# "try/except" to help debug and solve issue.
try:
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///C:/Users/leeju/Voice_lesson_AI_Scheduler/lesson.db' # Temp absolute path to resolve bug
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    db = SQLAlchemy(app)
    print("Configured successfully.")
except Exception as e:
    print(f"Error configurating: {e}")

import logging
logging.basicConfig()
logging.getLogger('sqlalchemy.engine').setLevel(logging.INFO)

# Route for 'Home' page / Student input form
@app.route('/')
def student_input():
    return render_template('student_input.html')

# Handling form submission
@app.route('/submit', methods = ['POST'])
def submit():
    # Capturing form data
    full_name = request.form['full_name']
    lesson_cat = request.form['lesson_cat']
    day1 = request.form['day1']
    time1 = request.form['time1']
    day2 = request.form['day2']
    time2 = request.form['time2']
    day3 = request.form['day3']
    time3 = request.form['time3']
    freq = request.form['freq']

    # New Student entry
    new_student = Student(
        full_name = full_name,
        lesson_cat = lesson_cat,
        day1 = day1,
        time1 = time1,
        day2 = day2,
        time2 = time2,
        day3 = day3,
        time3 = time3,
        freq = freq
    )

    # Add student to DB
    db.session.add(new_student)
    db.session.commit()

    # Confirmation page
    return render_template('confirmation.html',
                           full_name = full_name,
                           lesson_cat = lesson_cat,
                            day1 = day1, time1 = time1,
                            day2 = day2, time2 = time2,
                            day3 = day3, time3 = time3,
                            freq = freq
                           )

    # For Debugging, prints form data to the console
    print(f"Name: {full_name}, Lesson Type: {lesson_cat}")
    print(f"Preferred Day/Time Choice 1: {day1}, {time1}")
    print(f"Preferred Day/Time Choice 2: {day2}, {time2}")
    print(f"Preferred Day/Time Choice 3: {day3}, {time3}")
    print(f"Lesson Frequency: {freq}")

# New route for teacher view
@app.route('/teacher_view')
def teacher_view():
    # Random placeholder values for now until DB is built
    student_data = [
        {
            'full_name': 'Cindy Marie',
            'lesson_cat': 'Consultation',
            'day1': 'Monday', 'time1': '10:00am',
            'day2': 'Tuesday', 'time2': '3:00pm',
            'day3': 'Friday', 'time3': '2:00pm',
            'freq': 'Once'
        }
    ]

    return render_template('teacher_view.html', students = student_data)

# New route for finalizing schedule
@app.route('/finalize_schedule')
def finalize_schedule():
    # Get data from teacher's view
    student_full_name = request.form['student_full_name']
    finalized_time = request.form['finalized_time']

    # Just for debugging
    print(f"Finalized time for {student_full_name}: {finalized_time}")

    return redirect(url_for('teacher_view'))

# Defining Student Model
class Student(db.Model):
    id = db.Column(db.Integer, primary_key = True)
    full_name = db.Column(db.String(50), nullable = False)
    lesson_cat = db.Column(db.String(50), nullable = False)
    day1 = db.Column(db.String(20), nullable = False)
    time1 = db.Column(db.String(20), nullable = False)
    day2 = db.Column(db.String(20), nullable = False)
    time2 = db.Column(db.String(20), nullable = False)
    day3 = db.Column(db.String(20), nullable = False)
    time3 = db.Column(db.String(20), nullable = False)
    freq = db.Column(db.String(20), nullable = False)
    finalized_time = db.Column(db.String(50), nullable = True)

    def __repr__(self):
        return f"<{self.full_name}>"

class Finalized_lesson(db.Model):
    id = db.Column(db.Integer, primary_key = True)
    student_id = db.Column(db.Integer, db.ForeignKey('student.id'), nullable = False)
    final_time = db.Column(db.String(50), nullable = False)



if __name__ == '__main__':
    app.run(debug = True)