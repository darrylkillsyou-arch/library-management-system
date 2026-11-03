from datetime import datetime, timezone
import pytz

IST = pytz.timezone("Asia/Kolkata")


def now_ist() -> datetime:
    """Return current UTC datetime (stored as UTC, consistent with IST context)."""
    return datetime.now(timezone.utc).replace(tzinfo=None)


def calculate_fine(due_on: datetime, returned_on: datetime | None = None) -> tuple[float, int, bool]:
    """
    Returns (fine_amount, overdue_days, is_overdue).
    Fine = INR 2 per calendar day overdue.
    """
    check_date = returned_on if returned_on else now_ist()
    # Normalize to date only for calendar-day calculation
    due_date = due_on.date() if hasattr(due_on, 'date') else due_on
    check_date_d = check_date.date() if hasattr(check_date, 'date') else check_date

    delta = (check_date_d - due_date).days
    overdue_days = max(0, delta)
    fine = overdue_days * 2.0
    is_overdue = overdue_days > 0
    return fine, overdue_days, is_overdue
