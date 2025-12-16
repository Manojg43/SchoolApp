import secrets
import string
import time

def generate_business_id(prefix: str) -> str:
    """
    Generates a unique, sortable, immutable business ID.
    Format: PREFIX-TIMESTAMP-RANDOM
    Example: SCH-1702934-AB92
    """
    timestamp = str(int(time.time()))[-6:] # Last 6 digits of timestamp for reasonable uniqueness/sorting
    random_str = ''.join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(4))
    return f"{prefix}-{timestamp}-{random_str}"
