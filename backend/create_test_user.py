import os
import django
from django.contrib.auth import get_user_model

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from staff.models import StaffProfile, TeacherProfile
from schools.models import School

def create_test_user():
    User = get_user_model()
    
    # 1. Ensure School Exists
    school = School.objects.first()
    if not school:
        school = School.objects.create(name="Greenwood High International", school_id="SCH-792249-L9YP")
        print(f"Created School: {school.name}")
    
    # Update GPS for testing
    if not school.gps_lat:
        school.gps_lat = 19.0760 # Mumbai Lat
        school.gps_long = 72.8777 # Mumbai Long
        school.save()
        print("Updated School GPS")
    else:
        print(f"Using School: {school.name}")

    # 2. Create User
    username = "teacher1"
    email = "teacher1@school.com"
    password = "password123"
    
    user, created = User.objects.get_or_create(username=username, defaults={'email': email, 'password': password})
    if created:
        user.set_password(password)
        user.first_name = "Amit"
        user.last_name = "Sharma"
        print(f"Created User: {username}")
    else:
        print(f"User {username} exists. Updating details...")

    # Always ensure school/mobile
    user.school = school
    user.mobile = "9876543210"
    user.role = 'TEACHER' # Ensure correct role
    user.can_use_mobile_app = True
    user.can_access_attendance = True
    user.save()
    
    # Ensure Staff Profile
    staff_profile, sp_created = StaffProfile.objects.get_or_create(
        user=user,
        defaults={'designation': "Senior Teacher"}
    )
    if sp_created:
        print("Created Staff Profile")
    else:
        print("Staff Profile confirmed")

    # Ensure Teacher Profile
    tp, tp_created = TeacherProfile.objects.get_or_create(
        user=user,
        defaults={'qualification': "M.Sc", 'subjects': "Maths"}
    )
    if tp_created:
        print("Created Teacher Profile")

if __name__ == "__main__":
    create_test_user()
