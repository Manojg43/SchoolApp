import os
import django
from django.conf import settings
import json

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from staff.views import ScanAttendanceView
from rest_framework.request import Request
from django.http import HttpRequest
from unittest.mock import MagicMock

def test_api_logic():
    print("--- Testing ScanAttendanceView Logic ---")
    
    view = ScanAttendanceView()
    
    # Mock Request
    request = MagicMock()
    request.user.school.school_id = "SCHOOL_123"
    request.user.school.gps_lat = 10.0
    request.user.school.gps_long = 10.0
    
    # Test Case 1: Valid JSON
    print("\n1. Testing Valid JSON:")
    valid_token = "A|B|C|SIG" # Dummy inner token
    json_token = json.dumps({"token": valid_token})
    request.data = {
        "qr_token": json_token,
        "latitude": 10.0,
        "longitude": 10.0
    }
    
    # We expect 'Malformed Token' (because SIG is fake), NOT 'Invalid QR Format'
    try:
        resp = view.post(request)
        print(f"   Result: {resp.status_code} - {resp.data}")
    except Exception as e:
        print(f"   Exception: {e}")

    # Test Case 2: Bad JSON (The Hypothesized Issue)
    print("\n2. Testing Bad JSON (Single Quotes):")
    bad_json = "{'token': 'A|B|C|SIG'}" # Invalid JSON
    request.data['qr_token'] = bad_json
    
    # We expect 'Invalid QR Format (Bad JSON)' with my fix
    # Previously, this would fall through to 'Invalid Signature' or 'Malformed Token'
    try:
        resp = view.post(request)
        print(f"   Result: {resp.status_code} - {resp.data}")
    except Exception as e:
        print(f"   Exception: {e}")

if __name__ == "__main__":
    test_api_logic()
