"""
mock_erp.py
-----------
DUMMY ERP for testing/demo purposes only.

This simulates the real college ERP's API. It is a drop-in stand-in:
in Phase 3 of the roadmap, these functions get replaced by real HTTP calls
to the actual ERP, but the function signatures (inputs/outputs) stay the
same so the Agent Tools layer (agent/tools.py) never has to change.

Data lives in-memory in plain Python dicts. Restarting the server resets it.
"""

from datetime import date, timedelta
import random

# ---------------------------------------------------------------------------
# Fake student directory (used for dummy login)
# ---------------------------------------------------------------------------
STUDENTS = {
    "CS101": {"name": "Aarav Sharma", "password": "demo123", "branch": "CSE", "semester": 5},
    "CS102": {"name": "Priya Verma", "password": "demo123", "branch": "CSE", "semester": 5},
    "EC101": {"name": "Rohan Gupta", "password": "demo123", "branch": "ECE", "semester": 3},
    "ME101": {"name": "Simran Kaur", "password": "demo123", "branch": "MECH", "semester": 7},
    "CS103": {"name": "Kabir Singh", "password": "demo123", "branch": "CSE", "semester": 5},
    "IT101": {"name": "Ananya Rao", "password": "demo123", "branch": "IT", "semester": 5},
}

# ---------------------------------------------------------------------------
# Fake attendance data: subject -> {classes_held, classes_attended}
# ---------------------------------------------------------------------------
_ATTENDANCE = {
    "CS101": {
        "Data Structures": {"held": 40, "attended": 34},
        "Operating Systems": {"held": 38, "attended": 28},
        "DBMS": {"held": 35, "attended": 33},
        "Computer Networks": {"held": 36, "attended": 30},
    },
    "CS102": {
        "Data Structures": {"held": 40, "attended": 39},
        "Operating Systems": {"held": 38, "attended": 36},
        "DBMS": {"held": 35, "attended": 34},
        "Computer Networks": {"held": 36, "attended": 35},
    },
    "EC101": {
        "Signals & Systems": {"held": 30, "attended": 20},
        "Analog Electronics": {"held": 32, "attended": 22},
        "Digital Logic Design": {"held": 28, "attended": 25},
    },
    "ME101": {
        "Thermodynamics": {"held": 34, "attended": 30},
        "Fluid Mechanics": {"held": 33, "attended": 31},
        "Machine Design": {"held": 31, "attended": 29},
    },
    "CS103": {
        "Data Structures": {"held": 40, "attended": 15},
        "Operating Systems": {"held": 38, "attended": 18},
        "DBMS": {"held": 35, "attended": 20},
        "Computer Networks": {"held": 36, "attended": 19},
    },
    "IT101": {
        "Web Technologies": {"held": 30, "attended": 27},
        "Cloud Computing": {"held": 29, "attended": 26},
        "DBMS": {"held": 35, "attended": 30},
    },
}

# ---------------------------------------------------------------------------
# Fake weekly timetable (same pattern reused per branch for simplicity)
# ---------------------------------------------------------------------------
_TIMETABLE_TEMPLATES = {
    "CSE": {
        "Monday": ["Data Structures (9-10 AM)", "DBMS (10-11 AM)", "Operating Systems (11-12 PM)"],
        "Tuesday": ["Computer Networks (9-10 AM)", "Data Structures Lab (10-12 PM)"],
        "Wednesday": ["DBMS (9-10 AM)", "Operating Systems (10-11 AM)", "Elective (11-12 PM)"],
        "Thursday": ["Computer Networks (9-10 AM)", "DBMS Lab (10-12 PM)"],
        "Friday": ["Data Structures (9-10 AM)", "Operating Systems (10-11 AM)"],
        "Saturday": [],
        "Sunday": [],
    },
    "ECE": {
        "Monday": ["Signals & Systems (9-10 AM)", "Analog Electronics (10-11 AM)"],
        "Tuesday": ["Digital Logic Design (9-10 AM)", "Electronics Lab (10-12 PM)"],
        "Wednesday": ["Signals & Systems (9-10 AM)", "Analog Electronics (10-11 AM)"],
        "Thursday": ["Digital Logic Design (9-10 AM)"],
        "Friday": ["Analog Electronics Lab (9-11 AM)"],
        "Saturday": [],
        "Sunday": [],
    },
    "MECH": {
        "Monday": ["Thermodynamics (9-10 AM)", "Fluid Mechanics (10-11 AM)"],
        "Tuesday": ["Machine Design (9-10 AM)", "Workshop (10-12 PM)"],
        "Wednesday": ["Thermodynamics (9-10 AM)", "Fluid Mechanics Lab (10-12 PM)"],
        "Thursday": ["Machine Design (9-10 AM)"],
        "Friday": ["Thermodynamics (9-10 AM)", "Machine Design (10-11 AM)"],
        "Saturday": [],
        "Sunday": [],
    },
    "IT": {
        "Monday": ["Web Technologies (9-10 AM)", "DBMS (10-11 AM)"],
        "Tuesday": ["Cloud Computing (9-10 AM)", "Web Tech Lab (10-12 PM)"],
        "Wednesday": ["DBMS (9-10 AM)", "Cloud Computing (10-11 AM)"],
        "Thursday": ["Web Technologies (9-10 AM)"],
        "Friday": ["Cloud Computing Lab (9-11 AM)"],
        "Saturday": [],
        "Sunday": [],
    },
}

# ---------------------------------------------------------------------------
# Fake exam schedule
# ---------------------------------------------------------------------------
_EXAM_SCHEDULE = {
    "CSE": [
        {"subject": "Data Structures", "date": "2026-10-05", "venue": "Hall A", "time": "10:00 AM"},
        {"subject": "DBMS", "date": "2026-10-08", "venue": "Hall B", "time": "10:00 AM"},
        {"subject": "Operating Systems", "date": "2026-10-11", "venue": "Hall A", "time": "2:00 PM"},
        {"subject": "Computer Networks", "date": "2026-10-14", "venue": "Hall C", "time": "10:00 AM"},
    ],
    "ECE": [
        {"subject": "Signals & Systems", "date": "2026-10-06", "venue": "Hall D", "time": "10:00 AM"},
        {"subject": "Analog Electronics", "date": "2026-10-09", "venue": "Hall D", "time": "2:00 PM"},
    ],
    "MECH": [
        {"subject": "Thermodynamics", "date": "2026-10-07", "venue": "Hall E", "time": "10:00 AM"},
        {"subject": "Fluid Mechanics", "date": "2026-10-10", "venue": "Hall E", "time": "2:00 PM"},
    ],
    "IT": [
        {"subject": "Web Technologies", "date": "2026-10-05", "venue": "Hall F", "time": "10:00 AM"},
        {"subject": "Cloud Computing", "date": "2026-10-09", "venue": "Hall F", "time": "10:00 AM"},
    ],
}

# ---------------------------------------------------------------------------
# Fake fee status
# ---------------------------------------------------------------------------
_FEES = {
    "CS101": {"total": 85000, "paid": 85000, "due": 0, "due_date": None},
    "CS102": {"total": 85000, "paid": 60000, "due": 25000, "due_date": "2026-09-30"},
    "EC101": {"total": 78000, "paid": 78000, "due": 0, "due_date": None},
    "ME101": {"total": 80000, "paid": 40000, "due": 40000, "due_date": "2026-09-20"},
    "CS103": {"total": 85000, "paid": 0, "due": 85000, "due_date": "2026-09-15"},
    "IT101": {"total": 82000, "paid": 82000, "due": 0, "due_date": None},
}


# ---------------------------------------------------------------------------
# Public "ERP API" functions -- these are what the agent tools call.
# Each mirrors what a real ERP REST endpoint would return.
# ---------------------------------------------------------------------------

def authenticate(student_id: str, password: str) -> dict | None:
    student = STUDENTS.get(student_id.upper())
    if student and student["password"] == password:
        return {"student_id": student_id.upper(), "name": student["name"], "branch": student["branch"]}
    return None


def get_attendance(student_id: str, subject: str | None = None) -> dict:
    student_id = student_id.upper()
    data = _ATTENDANCE.get(student_id)
    if not data:
        return {"error": f"No attendance record found for {student_id}"}

    if subject:
        for subj_name, rec in data.items():
            if subject.lower() in subj_name.lower():
                pct = round(rec["attended"] / rec["held"] * 100, 1)
                return {"subject": subj_name, "held": rec["held"], "attended": rec["attended"], "percentage": pct}
        return {"error": f"No subject matching '{subject}' found"}

    result = {}
    total_held = total_attended = 0
    for subj_name, rec in data.items():
        pct = round(rec["attended"] / rec["held"] * 100, 1)
        result[subj_name] = {"held": rec["held"], "attended": rec["attended"], "percentage": pct}
        total_held += rec["held"]
        total_attended += rec["attended"]

    overall_pct = round(total_attended / total_held * 100, 1) if total_held else 0
    return {"subjects": result, "overall_percentage": overall_pct}


def get_timetable(student_id: str, day: str | None = None) -> dict:
    student_id = student_id.upper()
    student = STUDENTS.get(student_id)
    if not student:
        return {"error": f"Student {student_id} not found"}

    branch = student["branch"]
    timetable = _TIMETABLE_TEMPLATES.get(branch, {})

    if day:
        day_key = day.strip().capitalize()
        # allow "today"/"tomorrow" resolution to be handled by the tool layer
        classes = timetable.get(day_key)
        if classes is None:
            return {"error": f"'{day}' is not a recognized weekday"}
        return {"day": day_key, "classes": classes}

    return {"week": timetable}


def get_exam_schedule(student_id: str) -> dict:
    student_id = student_id.upper()
    student = STUDENTS.get(student_id)
    if not student:
        return {"error": f"Student {student_id} not found"}
    branch = student["branch"]
    return {"branch": branch, "exams": _EXAM_SCHEDULE.get(branch, [])}


def get_fee_status(student_id: str) -> dict:
    student_id = student_id.upper()
    fee = _FEES.get(student_id)
    if not fee:
        return {"error": f"No fee record found for {student_id}"}
    return fee


def simulate_missed_classes(student_id: str, subject: str, classes_to_miss: int) -> dict:
    """
    Extra 'what-if' helper used by the agent to answer questions like:
    'agar main 5 classes miss karu to attendance kitni hogi?'
    Purely a calculation on top of mock data -- no ERP write happens.
    """
    student_id = student_id.upper()
    data = _ATTENDANCE.get(student_id)
    if not data:
        return {"error": f"No attendance record found for {student_id}"}

    match = None
    for subj_name, rec in data.items():
        if subject.lower() in subj_name.lower():
            match = (subj_name, rec)
            break
    if not match:
        return {"error": f"No subject matching '{subject}' found"}

    subj_name, rec = match
    current_pct = round(rec["attended"] / rec["held"] * 100, 1)
    new_held = rec["held"] + classes_to_miss
    new_pct = round(rec["attended"] / new_held * 100, 1)

    return {
        "subject": subj_name,
        "current_percentage": current_pct,
        "classes_to_miss": classes_to_miss,
        "projected_percentage": new_pct,
        "below_75_warning": new_pct < 75.0,
    }
