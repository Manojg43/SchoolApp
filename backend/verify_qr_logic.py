import os
import django
import json
import time
import uuid
import hmac
import hashlib
from django.conf import settings

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

def verify_qr_logic():
    print("--- Verifying QR Logic Locally ---")
    
    # 1. Simulate frontend generation (GenerateSchoolQR logic)
    # Mocking user/school data
    school_id = "SCHOOL_123"
    timestamp = str(int(time.time()))
    nonce = str(uuid.uuid4())[:8]
    
    raw_data = f"{school_id}|{timestamp}|{nonce}"
    signature = hmac.new(
        settings.SECRET_KEY.encode(),
        raw_data.encode(),
        hashlib.sha256
    ).hexdigest()
    
    token = f"{raw_data}|{signature}"
    print(f"1. Generated Token: {token}")
    
    # 2. Simulate Frontend JSON wrapping (settings/page.tsx)
    qr_json = {
        "type": "ATTENDANCE_QR",
        "token": token,
        "school": "Test School",
        "exp": 300
    }
    qr_string = json.dumps(qr_json)
    print(f"2. QR Content (JSON): {qr_string}")
    
    # 3. Simulate Backend Validation (ScanAttendanceView logic)
    print("3. Validating...")
    
    # Step A: JSON Parse
    received_token = qr_string
    parsed_token = None
    try:
        if received_token and isinstance(received_token, str) and received_token.strip().startswith('{'):
            data = json.loads(received_token)
            parsed_token = data.get('token', received_token)
            print(f"   [OK] Parsed JSON, extracted token: {parsed_token}")
        else:
            parsed_token = received_token
            print(f"   [INFO] Not JSON, using raw: {parsed_token}")
    except Exception as e:
        print(f"   [FAIL] JSON Parsing error: {e}")
        return

    # Step B: Signature Verify
    try:
        raw_part, sig_part = parsed_token.rsplit('|', 1)
        expected_sig = hmac.new(
            settings.SECRET_KEY.encode(),
            raw_part.encode(),
            hashlib.sha256
        ).hexdigest()
        
        if hmac.compare_digest(sig_part, expected_sig):
            print("   [SUCCESS] Signature Verified!")
        else:
            print(f"   [FAIL] Signature Mismatch!")
            print(f"     Received: {sig_part}")
            print(f"     Expected: {expected_sig}")
            
    except Exception as e:
        print(f"   [FAIL] Token splitting/logic error: {e}")

if __name__ == "__main__":
    verify_qr_logic()
