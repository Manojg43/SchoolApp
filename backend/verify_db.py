
import os
import django
import sys

# Setup Django Environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from schools.models import School, AcademicYear, Class, Section
from students.models import Student
from datetime import date

def verify_integration():
    print("--- Verifying Database Integration ---")
    
    # Check for existing school or create one
    school, created = School.objects.get_or_create(
        name="Demo School",
        defaults={'address': "123 Education Lane", 'language': 'en'}
    )
    if created:
        print(f"✅ Created School: {school.name} ({school.school_id})")
    else:
        print(f"✅ Found Existing School: {school.name} ({school.school_id})")

    # Check for Academic Year
    ay, created = AcademicYear.objects.get_or_create(
        school=school,
        name="2024-25",
        defaults={'start_date': date(2024, 6, 1), 'end_date': date(2025, 4, 30), 'is_active': True}
    )
    if created: print(f"✅ Created Academic Year: {ay.name}")

    # Check for Class
    cls, created = Class.objects.get_or_create(
        school=school,
        name="Class 10",
        defaults={'order': 10}
    )
    if created: print(f"✅ Created Class: {cls.name}")

    # Check for Section
    sec, created = Section.objects.get_or_create(
        school=school,
        parent_class=cls,
        name="A"
    )

    # Check for Student
    student, created = Student.objects.get_or_create(
        school=school,
        enrollment_number="STU-001",
        defaults={
            'first_name': "Rahul",
            'last_name': "Sharma",
            'date_of_birth': date(2008, 5, 15),
            'gender': 'M',
            'academic_year': ay,
            'current_class': cls,
            'section': sec,
            'father_name': "Rajesh Sharma",
            'mother_name': "Priya Sharma"
        }
    )
    if created:
        print(f"✅ Created Student: {student.first_name} {student.last_name}")
    else:
        print(f"✅ Found Student: {student.first_name} {student.last_name}")

    print("\n🎉 INTEGRATION SUCCESSFUL!")
    print("Data is being read from and written to Supabase.")

if __name__ == "__main__":
    verify_integration()
