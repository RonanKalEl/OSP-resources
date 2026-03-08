"""
Task 2 Python Snippets for T Level Digital OSP

Purpose:
A reusable bank of Python snippets for common features that may appear in an
OSP paper. These examples are designed to be adapted to the scenario rather
than copied blindly.

How to use:
- Pick only the snippets that match the paper requirements.
- Rename variables and functions so they fit the scenario.
- Add comments explaining why the code meets the client and user needs.
- Test normal, erroneous, boundary, and missing input values.

Contents:
1. Validation and cleaning
2. Calculations and formatting
3. Lists of dictionaries (common record structure)
4. Searching, filtering, and sorting
5. Simple CRUD operations
6. File handling (JSON / CSV / text)
7. Authentication and security helpers
8. Date and time helpers
9. Reporting and analytics
10. Defensive programming patterns
11. Menu-driven console example
12. Mini example: booking flow
"""

from __future__ import annotations

import csv
import hashlib
import json
import re
from datetime import datetime, date, timedelta
from pathlib import Path
from statistics import mean
from typing import Any, Callable
from uuid import uuid4


# ============================================================
# 1. VALIDATION AND CLEANING
# ============================================================

def clean_text(value: str) -> str:
    """Trim whitespace and collapse repeated internal spaces."""
    return " ".join(value.strip().split())


def title_case_name(name: str) -> str:
    """Normalise a person's name for display."""
    return clean_text(name).title()


def is_present(value: str) -> bool:
    """Return True if a required field is not blank."""
    return bool(clean_text(value))


def is_length_valid(value: str, min_len: int = 0, max_len: int = 255) -> bool:
    """Check whether a string length falls in a valid range."""
    length = len(clean_text(value))
    return min_len <= length <= max_len


def is_integer(value: str) -> bool:
    """Check whether the supplied text can be converted to an integer."""
    try:
        int(value)
        return True
    except ValueError:
        return False


def is_float(value: str) -> bool:
    """Check whether the supplied text can be converted to a float."""
    try:
        float(value)
        return True
    except ValueError:
        return False


def is_in_range(number: float, minimum: float, maximum: float) -> bool:
    """Validate numeric ranges such as age, quantity, or price."""
    return minimum <= number <= maximum


def is_valid_email(email: str) -> bool:
    """Basic email validation for school-level projects."""
    pattern = r"^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$"
    return re.match(pattern, clean_text(email)) is not None


def is_valid_phone(phone: str) -> bool:
    """Basic phone number validation allowing spaces and leading +."""
    compact = phone.replace(" ", "")
    pattern = r"^\+?[0-9]{10,15}$"
    return re.match(pattern, compact) is not None


def is_valid_postcode_uk(postcode: str) -> bool:
    """Loose UK postcode check for common cases."""
    pattern = r"^[A-Z]{1,2}[0-9][A-Z0-9]? ?[0-9][A-Z]{2}$"
    return re.match(pattern, clean_text(postcode).upper()) is not None


def is_valid_password(password: str) -> tuple[bool, str]:
    """Check simple password rules and return a message for the user."""
    if len(password) < 8:
        return False, "Password must be at least 8 characters long."
    if not re.search(r"[A-Z]", password):
        return False, "Password must include an uppercase letter."
    if not re.search(r"[a-z]", password):
        return False, "Password must include a lowercase letter."
    if not re.search(r"[0-9]", password):
        return False, "Password must include a number."
    return True, "Password is valid."


def contains_only_letters_spaces(value: str) -> bool:
    """Useful for names, towns, or categories."""
    return re.match(r"^[A-Za-z ]+$", clean_text(value)) is not None


def get_valid_input(
    prompt: str,
    validator: Callable[[str], bool],
    error_message: str,
    transform: Callable[[str], Any] | None = None,
) -> Any:
    """
    Repeatedly ask for input until it passes validation.
    Useful in console-based prototypes.
    """
    while True:
        user_input = input(prompt)
        if validator(user_input):
            return transform(user_input) if transform else user_input
        print(error_message)


# ============================================================
# 2. CALCULATIONS AND FORMATTING
# ============================================================

def format_currency(amount: float) -> str:
    """Format a number as UK currency."""
    return f"£{amount:.2f}"


def calculate_vat(amount_ex_vat: float, vat_rate: float = 0.20) -> float:
    return round(amount_ex_vat * vat_rate, 2)


def calculate_total_with_vat(amount_ex_vat: float, vat_rate: float = 0.20) -> float:
    return round(amount_ex_vat + calculate_vat(amount_ex_vat, vat_rate), 2)


def apply_percentage_discount(amount: float, discount_percent: float) -> float:
    """Apply percentage discount such as student, member, or promo discount."""
    discount_value = amount * (discount_percent / 100)
    return round(amount - discount_value, 2)


def calculate_percentage(part: float, whole: float) -> float:
    """Avoid division by zero errors in reports."""
    if whole == 0:
        return 0.0
    return round((part / whole) * 100, 2)


def calculate_average(numbers: list[float]) -> float:
    return round(mean(numbers), 2) if numbers else 0.0


def calculate_booking_total(base_price: float, quantity: int, extras: float = 0.0) -> float:
    """Useful for tickets, products, sessions, or services."""
    return round((base_price * quantity) + extras, 2)


def calculate_age(date_of_birth: date) -> int:
    """Age calculation for age restrictions or user profiles."""
    today = date.today()
    age = today.year - date_of_birth.year
    if (today.month, today.day) < (date_of_birth.month, date_of_birth.day):
        age -= 1
    return age


# ============================================================
# 3. LISTS OF DICTIONARIES (COMMON RECORD STRUCTURE)
# ============================================================

def generate_id(prefix: str = "REC") -> str:
    """Create a short readable ID such as CUS-7F12A9."""
    return f"{prefix}-{uuid4().hex[:6].upper()}"


def create_customer(name: str, email: str, phone: str) -> dict[str, str]:
    return {
        "customer_id": generate_id("CUS"),
        "name": title_case_name(name),
        "email": clean_text(email).lower(),
        "phone": clean_text(phone),
    }


def create_booking(customer_id: str, item_name: str, quantity: int, total: float) -> dict[str, Any]:
    return {
        "booking_id": generate_id("BKG"),
        "customer_id": customer_id,
        "item_name": clean_text(item_name),
        "quantity": quantity,
        "total": round(total, 2),
        "created_at": datetime.now().isoformat(timespec="seconds"),
    }


def print_records(records: list[dict[str, Any]]) -> None:
    """Simple display helper for debugging or console prototypes."""
    if not records:
        print("No records found.")
        return

    for index, record in enumerate(records, start=1):
        print(f"\nRecord {index}")
        for key, value in record.items():
            print(f"- {key}: {value}")


# ============================================================
# 4. SEARCHING, FILTERING, AND SORTING
# ============================================================

def find_by_id(records: list[dict[str, Any]], record_id_key: str, record_id: str) -> dict[str, Any] | None:
    """Return the first record that matches the supplied ID."""
    for record in records:
        if record.get(record_id_key) == record_id:
            return record
    return None


def search_by_partial_match(records: list[dict[str, Any]], field: str, search_term: str) -> list[dict[str, Any]]:
    """Case-insensitive partial search, useful for names and titles."""
    term = clean_text(search_term).lower()
    return [record for record in records if term in str(record.get(field, "")).lower()]


def filter_by_exact_value(records: list[dict[str, Any]], field: str, value: Any) -> list[dict[str, Any]]:
    return [record for record in records if record.get(field) == value]


def filter_by_minimum_value(records: list[dict[str, Any]], field: str, minimum: float) -> list[dict[str, Any]]:
    return [record for record in records if float(record.get(field, 0)) >= minimum]


def sort_records(records: list[dict[str, Any]], field: str, reverse: bool = False) -> list[dict[str, Any]]:
    """Return a new sorted list without changing the original list."""
    return sorted(records, key=lambda record: record.get(field), reverse=reverse)


# ============================================================
# 5. SIMPLE CRUD OPERATIONS
# ============================================================

def add_record(records: list[dict[str, Any]], record: dict[str, Any]) -> None:
    records.append(record)


def update_record(records: list[dict[str, Any]], record_id_key: str, record_id: str, updates: dict[str, Any]) -> bool:
    """Update matching fields for a record. Returns True if successful."""
    record = find_by_id(records, record_id_key, record_id)
    if record is None:
        return False
    record.update(updates)
    return True


def delete_record(records: list[dict[str, Any]], record_id_key: str, record_id: str) -> bool:
    """Delete a record by ID. Returns True if a record was removed."""
    for index, record in enumerate(records):
        if record.get(record_id_key) == record_id:
            del records[index]
            return True
    return False


def record_exists(records: list[dict[str, Any]], field: str, value: Any) -> bool:
    """Useful to prevent duplicate usernames, emails, or IDs."""
    return any(record.get(field) == value for record in records)


# ============================================================
# 6. FILE HANDLING (JSON / CSV / TEXT)
# ============================================================

def save_json(filepath: str | Path, data: Any) -> None:
    with open(filepath, "w", encoding="utf-8") as file:
        json.dump(data, file, indent=4)


def load_json(filepath: str | Path, default: Any = None) -> Any:
    """Load JSON safely, returning a default value if the file is missing."""
    try:
        with open(filepath, "r", encoding="utf-8") as file:
            return json.load(file)
    except FileNotFoundError:
        return [] if default is None else default


def save_csv(filepath: str | Path, records: list[dict[str, Any]], fieldnames: list[str]) -> None:
    with open(filepath, "w", newline="", encoding="utf-8") as file:
        writer = csv.DictWriter(file, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(records)


def append_to_text_log(filepath: str | Path, message: str) -> None:
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with open(filepath, "a", encoding="utf-8") as file:
        file.write(f"[{timestamp}] {message}\n")


# ============================================================
# 7. AUTHENTICATION AND SECURITY HELPERS
# ============================================================

def hash_password(password: str) -> str:
    """
    Simple SHA-256 hashing for prototype work.
    In real production systems, a dedicated password hashing algorithm such as
    bcrypt or Argon2 should be used.
    """
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


def verify_password(password: str, stored_hash: str) -> bool:
    return hash_password(password) == stored_hash


def mask_email(email: str) -> str:
    """Useful when displaying personal data more safely."""
    local, domain = email.split("@")
    if len(local) <= 2:
        masked_local = local[0] + "*"
    else:
        masked_local = local[:2] + "*" * (len(local) - 2)
    return f"{masked_local}@{domain}"


def sanitise_for_filename(value: str) -> str:
    """Turn user input into a safer file name."""
    safe = re.sub(r"[^A-Za-z0-9_-]", "_", value)
    return safe[:50]


# ============================================================
# 8. DATE AND TIME HELPERS
# ============================================================

def parse_date(date_string: str, date_format: str = "%Y-%m-%d") -> date:
    return datetime.strptime(date_string, date_format).date()


def is_future_date(check_date: date) -> bool:
    return check_date > date.today()


def is_within_opening_hours(hour: int, opening_hour: int, closing_hour: int) -> bool:
    """Useful for booking systems or appointment schedulers."""
    return opening_hour <= hour < closing_hour


def dates_overlap(start_a: date, end_a: date, start_b: date, end_b: date) -> bool:
    """Useful for bookings, leave requests, or room reservations."""
    return start_a <= end_b and start_b <= end_a


def add_days(start_date: date, days: int) -> date:
    return start_date + timedelta(days=days)


# ============================================================
# 9. REPORTING AND ANALYTICS
# ============================================================

def count_records(records: list[dict[str, Any]]) -> int:
    return len(records)


def total_field(records: list[dict[str, Any]], field: str) -> float:
    """Sum a numeric field across multiple records."""
    return round(sum(float(record.get(field, 0)) for record in records), 2)


def group_count(records: list[dict[str, Any]], field: str) -> dict[str, int]:
    """Count how many times each category appears."""
    result: dict[str, int] = {}
    for record in records:
        key = str(record.get(field, "Unknown"))
        result[key] = result.get(key, 0) + 1
    return result


def highest_value_record(records: list[dict[str, Any]], field: str) -> dict[str, Any] | None:
    if not records:
        return None
    return max(records, key=lambda record: float(record.get(field, 0)))


def create_summary_report(bookings: list[dict[str, Any]]) -> dict[str, Any]:
    """Example of summarising a booking or sales dataset."""
    return {
        "total_bookings": count_records(bookings),
        "total_revenue": total_field(bookings, "total"),
        "average_booking_value": calculate_average([float(b.get("total", 0)) for b in bookings]),
        "most_expensive_booking": highest_value_record(bookings, "total"),
    }


# ============================================================
# 10. DEFENSIVE PROGRAMMING PATTERNS
# ============================================================

def safe_divide(numerator: float, denominator: float) -> float:
    """Avoid crashes when the denominator may be zero."""
    if denominator == 0:
        return 0.0
    return numerator / denominator


def safe_int(value: Any, default: int = 0) -> int:
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


def safe_float(value: Any, default: float = 0.0) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def try_operation(func: Callable[..., Any], *args: Any, **kwargs: Any) -> tuple[bool, Any]:
    """Wrap risky operations and return success status plus result or error."""
    try:
        return True, func(*args, **kwargs)
    except Exception as error:  # broad for prototype debugging
        return False, str(error)


# ============================================================
# 11. MENU-DRIVEN CONSOLE EXAMPLE
# ============================================================

def display_menu() -> None:
    print("\n=== Main Menu ===")
    print("1. Add customer")
    print("2. View customers")
    print("3. Search customer")
    print("4. Exit")


def run_simple_customer_menu() -> None:
    customers: list[dict[str, Any]] = []

    while True:
        display_menu()
        choice = input("Choose an option: ").strip()

        if choice == "1":
            name = get_valid_input(
                "Enter customer name: ",
                lambda value: is_present(value) and contains_only_letters_spaces(value),
                "Enter a valid name using letters and spaces only.",
                title_case_name,
            )
            email = get_valid_input(
                "Enter email: ",
                is_valid_email,
                "Enter a valid email address.",
                lambda value: clean_text(value).lower(),
            )
            phone = get_valid_input(
                "Enter phone number: ",
                is_valid_phone,
                "Enter a valid phone number.",
                clean_text,
            )

            if record_exists(customers, "email", email):
                print("A customer with that email already exists.")
            else:
                add_record(customers, create_customer(name, email, phone))
                print("Customer added successfully.")

        elif choice == "2":
            print_records(customers)

        elif choice == "3":
            search_term = input("Enter name to search: ")
            results = search_by_partial_match(customers, "name", search_term)
            print_records(results)

        elif choice == "4":
            print("Program ended.")
            break

        else:
            print("Invalid option. Please choose 1, 2, 3, or 4.")


# ============================================================
# 12. MINI EXAMPLE: BOOKING FLOW
# ============================================================

def seats_available(requested_seats: int, remaining_seats: int) -> bool:
    return requested_seats <= remaining_seats


def create_ticket_booking(
    customer_name: str,
    ticket_type: str,
    quantity: int,
    price_per_ticket: float,
    remaining_seats: int,
) -> dict[str, Any]:
    """
    Example of combining validation, calculation, and data storage logic into
    one useful scenario-based function.
    """
    if not is_present(customer_name):
        raise ValueError("Customer name is required.")
    if quantity <= 0:
        raise ValueError("Quantity must be greater than 0.")
    if not seats_available(quantity, remaining_seats):
        raise ValueError("Not enough seats available.")

    total = calculate_booking_total(price_per_ticket, quantity)

    return {
        "booking_id": generate_id("TKT"),
        "customer_name": title_case_name(customer_name),
        "ticket_type": clean_text(ticket_type).title(),
        "quantity": quantity,
        "price_per_ticket": round(price_per_ticket, 2),
        "total": total,
        "remaining_seats_after_booking": remaining_seats - quantity,
    }


# ============================================================
# 13. QUICK TEST EXAMPLES
# ============================================================

if __name__ == "__main__":
    # Quick checks you can adapt into formal test evidence.
    print("Example currency:", format_currency(14.5))
    print("Valid email:", is_valid_email("student@example.com"))
    print("Discounted total:", apply_percentage_discount(100, 15))

    example_booking = create_ticket_booking(
        customer_name="ronan barrell",
        ticket_type="standard",
        quantity=2,
        price_per_ticket=12.50,
        remaining_seats=20,
    )
    print("Example booking:")
    print(example_booking)
