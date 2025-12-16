import requests
import json
import os
import django
from datetime import date

# Setup Django for DB access verification
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from staff.models import StaffAttendance, StaffProfile
from django.contrib.auth import get_user_model

BASE_URL = "http://127.0.0.1:8000/api"
User = get_user_model()

def test_mobile_flow():
    print("--- [MOBILE] Simulating Mobile App Logic ---")

    # 1. Login (Mobile App Action)
    print("\n1. Testing Login...")
    # Ensure we have a test user
    username = "teacher1"
    password = "password123"
    
    # Check if user exists, if not create/reset
    user_qs = User.objects.filter(username=username)
    if not user_qs.exists():
        print(f"User {username} not found. Test setup required.")
        # Create test user is out of scope for this script, generally assume setup_demo_school ran.
        # But let's try to grab *any* user if teacher1 fails, or just fail.
        # Actually, let's use the Superuser 'admin' if teacher1 doesn't exist, or create teacher1.
        if User.objects.filter(username='admin').exists():
            username = 'admin'
            password = 'admin'
            print("Using 'admin' account.")
    
    session = requests.Session()
    try:
        login_resp = session.post(f"{BASE_URL}/login/", json={
            "username": username,
            "password": password
        })
        
        if login_resp.status_code != 200:
            print(f"[FAIL] Login Failed: {login_resp.status_code} - {login_resp.text}")
            return
        
        token = login_resp.json().get('token')
        school_id = login_resp.json().get('school_id')
        print(f"[OK] Login Successful. Token: {token[:10]}... | School: {school_id}")
        
    except requests.exceptions.ConnectionError:
         print(f"[FAIL] Connection Failed. Is the Django Server running on {BASE_URL}?")
         return

    # 2. Get Profile (Mobile Home Screen)
    print("\n2. Fetching Profile...")
    headers = {
        'Authorization': f'Token {token}',
        'X-School-ID': school_id
    }
    
    profile_resp = session.get(f"{BASE_URL}/staff/profile/", headers=headers)
    if profile_resp.status_code == 200:
        p_data = profile_resp.json()
        user_info = p_data.get('user', {})
        print(f"[OK] Profile Loaded: {user_info.get('first_name')} ({user_info.get('designation')})")
        print(f"     - Attendance: {p_data.get('attendance', {}).get('present')} Present")
        print(f"     - Salary: {p_data.get('salary', {}).get('net_salary')} ({p_data.get('salary', {}).get('month')})")
    else:
        print(f"[FAIL] Profile Fetch Failed: {profile_resp.status_code}")

    # 3. Simulate QR Scan (Mobile Scan Screen)
    print("\n3. Simulating QR Scan...")
    # We need a valid QR token. Let's generate one via API (like the Web Dashboard would)
    qr_resp = session.get(f"{BASE_URL}/staff/qr/generate/", headers=headers)
    if qr_resp.status_code == 200:
        qr_token = qr_resp.json().get('qr_token') # Key fixed from qr_code
        print(f"   (Generated QR Token: {str(qr_token)[:20]}...)")
        
        if qr_token:
            # Now Scan it
            scan_payload = {
                "qr_token": qr_token,
                "gps_lat": 19.0760,
                "gps_long": 72.8777
            }
            scan_resp = session.post(f"{BASE_URL}/staff/attendance/scan/", json=scan_payload, headers=headers)
            
            if scan_resp.status_code == 200:
                 print(f"[OK] Attendance Marked! Response: {scan_resp.json()}")
                 
                 # 4. Verifying in DB (Web UI Connection)
                 print("\n4. Verifying DB Record (Web UI Sync)...")
                 today_attendance = StaffAttendance.objects.filter(
                     staff__username=username, 
                     date=date.today()
                 ).first()
                 
                 if today_attendance:
                     print(f"[OK] DB Record Found: ID {today_attendance.id}")
                     print(f"   - Status: {today_attendance.status}")
                     print(f"   - Time: {today_attendance.check_in}")
                     print(f"   - Source: {today_attendance.source} (Matches Mobile logic?)")
                     
                     if today_attendance.source == 'QR_APP' or today_attendance.source == 'QR_GEO': 
                         print("   - Source Verification: PASS")
                     else:
                         print(f"   - Source: {today_attendance.source} (Expected QR_GEO)")
                 else:
                     print("[FAIL] DB Record NOT found! (Sync Error)")
                     
            else:
                 print(f"[FAIL] Scan Failed: {scan_resp.status_code} - {scan_resp.text}")
        else:
            print("[FAIL] QR Token missing in response")
    else:
        print(f"[FAIL] Failed to generate QR for test: {qr_resp.status_code}")

if __name__ == "__main__":
    test_mobile_flow()
