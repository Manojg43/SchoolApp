"""
Test script to verify attendance marking with dummy locations
"""
import os
import django
import requests
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from schools.models import School

BASE_URL = 'http://localhost:8000/api'

# Test with a staff user
User = get_user_model()
staff_user = User.objects.filter(role='TEACHER').first()

if not staff_user:
    print("No teacher found for testing!")
    exit(1)

print(f"Testing with user: {staff_user.username} ({staff_user.get_full_name()})")
print(f"School: {staff_user.school.name}")
print(f"School GPS: {staff_user.school.gps_lat}, {staff_user.school.gps_long}")

# Login to get token
login_response = requests.post(f'{BASE_URL}/login/', json={
    'username': staff_user.username,
    'password': 'teacher123'  # Default password from seed
})

if login_response.status_code != 200:
    print(f"Login failed: {login_response.text}")
    exit(1)

token = login_response.json()['token']
print(f"\n✓ Login successful! Token: {token[:20]}...")

headers = {
    'Authorization': f'Token {token}',
    'Content-Type': 'application/json'
}

# Step 1: Generate QR Token
print("\n" + "="*80)
print("STEP 1: Generating QR Token")
print("="*80)

qr_response = requests.get(f'{BASE_URL}/staff/qr/generate/', headers=headers)
if qr_response.status_code == 200:
    qr_data = qr_response.json()
    qr_token = qr_data['qr_token']
    print(f"✓ QR Token generated:")
    print(f"  Token: {qr_token[:50]}...")
    print(f"  School: {qr_data['school_name']}")
else:
    print(f"✗ QR generation failed: {qr_response.text}")
    qr_token = None

# Step 2: Test attendance with different locations
print("\n" + "="*80)
print("STEP 2: Testing Attendance Marking with Different Locations")
print("="*80)

# Get school location
school_lat = float(staff_user.school.gps_lat)
school_lng = float(staff_user.school.gps_long)

test_scenarios = [
    {
        "name": "Exact School Location (Should PASS)",
        "lat": school_lat,
        "lng": school_lng,
        "should_pass": True
    },
    {
        "name": "10m away (Should PASS)",
        "lat": school_lat + 0.0001,  # ~11m north
        "lng": school_lng,
        "should_pass": True
    },
    {
        "name": "45m away (Should PASS)",
        "lat": school_lat + 0.0004,  # ~44m north
        "lng": school_lng,
        "should_pass": True
    },
    {
        "name": "100m away (Should FAIL - Outside fence)",
        "lat": school_lat + 0.001,  # ~111m north
        "lng": school_lng,
        "should_pass": False
    },
    {
        "name": "1km away (Should FAIL - Far outside)",
        "lat": school_lat + 0.01,  # ~1.1km north
        "lng": school_lng,
        "should_pass": False
    },
]

for i, scenario in enumerate(test_scenarios, 1):
    print(f"\n{i}. {scenario['name']}")
    print(f"   Location: ({scenario['lat']:.6f}, {scenario['lng']:.6f})")
    
    payload = {
        'qr_token': qr_token,
        'gps_lat': scenario['lat'],
        'gps_long': scenario['lng'],
        'manual_gps': False
    }
    
    response = requests.post(f'{BASE_URL}/staff/attendance/scan/', 
                            headers=headers,
                            json=payload)
    
    if response.status_code == 200:
        result = response.json()
        print(f"   ✓ SUCCESS: {result.get('message', result)}")
        if scenario['should_pass']:
            print(f"   ✅ Test PASSED (Expected: Success, Got: Success)")
        else:
            print(f"   ❌ Test FAILED (Expected: Failure, Got: Success)")
    else:
        error_data = response.json()
        print(f"   ✗ FAILED: {error_data.get('error', response.text)}")
        if 'distance' in error_data:
            print(f"   Distance: {error_data['distance']} (Allowed: {error_data.get('allowed', 'N/A')})")
        if not scenario['should_pass']:
            print(f"   ✅ Test PASSED (Expected: Failure, Got: Failure)")
        else:
            print(f"   ❌ Test FAILED (Expected: Success, Got: Failure)")

# Step 3: Test malformed tokens
print("\n" + "="*80)
print("STEP 3: Testing Error Handling")
print("="*80)

error_scenarios = [
    {
        "name": "No Token",
        "payload": {'gps_lat': school_lat, 'gps_long': school_lng},
        "expected_error": "Missing data"
    },
    {
        "name": "Malformed Token (No Pipe)",
        "payload": {'qr_token': 'INVALIDTOKEN', 'gps_lat': school_lat, 'gps_long': school_lng},
        "expected_error": "Malformed Token"
    },
    {
        "name": "Invalid Signature",
        "payload": {'qr_token': 'STATIC|SCH001|wrongsignature', 'gps_lat': school_lat, 'gps_long': school_lng},
        "expected_error": "Invalid QR"
    },
]

for i, scenario in enumerate(error_scenarios, 1):
    print(f"\n{i}. {scenario['name']}")
    
    response = requests.post(f'{BASE_URL}/staff/attendance/scan/',
                            headers=headers,
                            json=scenario['payload'])
    
    if response.status_code != 200:
        error = response.json().get('error', '')
        print(f"   ✓ Correctly rejected: {error}")
        if scenario['expected_error'].lower() in error.lower():
            print(f"   ✅ Test PASSED")
        else:
            print(f"   ⚠️  Got different error than expected")
    else:
        print(f"   ✗ Should have failed but succeeded")
        print(f"   ❌ Test FAILED")

print("\n" + "="*80)
print("TESTING COMPLETE")
print("="*80)
