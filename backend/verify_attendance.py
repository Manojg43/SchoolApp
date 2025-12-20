
import os
import django
from django.conf import settings
from rest_framework.test import APIRequestFactory, force_authenticate
from staff.views import ScanAttendanceView
from core.models import CoreUser
from staff.models import StaffProfile, StaffAttendance
from schools.models import School
import datetime

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'school_backend.settings')
django.setup()

def log(msg):
    with open('attendance_log.txt', 'a') as f:
        f.write(str(msg) + "\n")
    print(msg)

def verify_manual_attendance():
    log("--- Verifying Manual Attendance ---")
    
    # 1. Setup Data
    school = School.objects.first()
    if not school:
        school = School.objects.create(name="Test School", school_id="TEST01", gps_lat=12.9716, gps_long=77.5946)
        log("Created Test School")

    user, created = CoreUser.objects.get_or_create(username="test_staff_manual", defaults={
        'first_name': 'Test', 'last_name': 'Staff', 'role': 'TEACHER', 'school': school
    })
    if created:
        user.set_password("password123")
        user.save()
        log("Created Test User")

    profile, _ = StaffProfile.objects.get_or_create(user=user, defaults={'designation': 'Teacher'})

    
    # 2. Test DENIAL (Permission False)
    profile.can_mark_manual_attendance = False
    profile.save()
    
    factory = APIRequestFactory()
    view = ScanAttendanceView.as_view()
    
    data_denied = {'manual_gps': True, 'gps_lat': float(school.gps_lat), 'gps_long': float(school.gps_long)}
    log(f"Using Coords: {data_denied['gps_lat']}, {data_denied['gps_long']}")
    req = factory.post('/staff/attendance/scan/', data_denied, format='json')
    force_authenticate(req, user=user)
    
    log("\nTest 1: Deny Permission")
    resp = view(req)
    log(f"Status: {resp.status_code}")
    log(f"Response: {resp.data}")
    
    if resp.status_code == 403:
        log("PASS: Permission correctly denied.")
    else:
        log("FAIL: Permission not denied.")

    # 3. Test ALLOW (Permission True)
    profile.can_mark_manual_attendance = True
    profile.save()
    
    # Refresh user to clear OneToOne cache
    user.refresh_from_db()
    profile.refresh_from_db()
    log(f"Profile Permission Set To: {profile.can_mark_manual_attendance}")
    
    # Clear previous attendance
    StaffAttendance.objects.filter(staff=user, date=datetime.date.today()).delete()
    
    log("\nTest 2: Allow Permission + Create Attendance")
    req = factory.post('/staff/attendance/scan/', data_denied, format='json')
    force_authenticate(req, user=user)
    
    resp = view(req)
    log(f"Status: {resp.status_code}")
    log(f"Response: {resp.data}")
    
    if resp.status_code == 200:
        att = StaffAttendance.objects.get(staff=user, date=datetime.date.today())
        log(f"DB Record: {att}")
        log(f"Source: {att.source}")
        log(f"Status: {att.status}")
        
        if att.source == 'MOBILE_GPS' and att.status == 'PRESENT':
             log("PASS: Manual Attendance Marked Successfully.")
        else:
             log("FAIL: Incorrect DB Record state.")
    else:
        log("FAIL: API request failed.")

# Execute directly
verify_manual_attendance()
