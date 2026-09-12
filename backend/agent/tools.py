"""
agent/tools.py
---------------
Whitelisted tools the agent is allowed to call.

Security principle (from the project proposal): the LLM NEVER writes raw
SQL/API calls. It can only invoke these pre-defined, typed functions.
Each tool wraps mock_erp.py today; in Phase 3 the internals swap to real
ERP HTTP calls but these signatures stay stable.
"""

from langchain_core.tools import tool
from datetime import date, timedelta
from backend import mock_erp

_WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]


def _resolve_day(day_str: str) -> str:
    """Turn 'today' / 'tomorrow' / 'kal' into an actual weekday name."""
    d = day_str.strip().lower()
    today = date.today()
    if d in ("today", "aaj"):
        return _WEEKDAYS[today.weekday()]
    if d in ("tomorrow", "kal"):
        return _WEEKDAYS[(today.weekday() + 1) % 7]
    return day_str.strip().capitalize()


def make_tools(student_id: str):
    """
    Build tool instances bound to the currently logged-in student.
    Binding student_id here (server-side, from the auth session) means the
    LLM can never ask for someone else's data -- it has no student_id
    parameter to manipulate.
    """

    @tool
    def get_my_attendance(subject: str = "") -> dict:
        """Get the logged-in student's attendance. Pass a subject name to
        filter to one subject, or leave blank for an overall summary
        across all subjects."""
        return mock_erp.get_attendance(student_id, subject or None)

    @tool
    def get_my_timetable(day: str = "") -> dict:
        """Get the logged-in student's class timetable. 'day' can be a
        weekday name, 'today', or 'tomorrow'. Leave blank for the full
        week."""
        resolved = _resolve_day(day) if day else None
        return mock_erp.get_timetable(student_id, resolved)

    @tool
    def get_my_exam_schedule() -> dict:
        """Get the logged-in student's upcoming exam schedule (subject,
        date, time, venue)."""
        return mock_erp.get_exam_schedule(student_id)

    @tool
    def get_my_fee_status() -> dict:
        """Get the logged-in student's fee payment status: total, paid,
        due amount, and due date."""
        return mock_erp.get_fee_status(student_id)

    @tool
    def what_if_miss_classes(subject: str, classes_to_miss: int) -> dict:
        """Calculate projected attendance percentage if the student misses
        a given number of additional classes in a subject. Use this for
        'what if I miss N classes' style questions."""
        return mock_erp.simulate_missed_classes(student_id, subject, classes_to_miss)

    return [get_my_attendance, get_my_timetable, get_my_exam_schedule,
            get_my_fee_status, what_if_miss_classes]
