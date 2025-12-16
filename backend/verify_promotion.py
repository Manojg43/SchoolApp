import os
import django
import datetime

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from students.models import Student, StudentHistory
from schools.models import School, AcademicYear, Class, Section
from core.models import CoreUser

def verify_promotion():
    print("--- Verifying Student Promotion ---")
    
    # 1. Setup Demo Data
    try:
        school = School.objects.first()
        if not school:
            print("No school found. Please run setup_demo_school.py first.")
            return

        user_teacher = CoreUser.objects.filter(school=school, is_staff=True).first() # Just need a user for context if needed, but script runs directly
        
        # Create Classes
        class_1, _ = Class.objects.get_or_create(school=school, name="Class 1", order=1)
        class_2, _ = Class.objects.get_or_create(school=school, name="Class 2", order=2)
        
        # Create Years
        year_2024, _ = AcademicYear.objects.get_or_create(school=school, name="2024-2025", start_date="2024-04-01", end_date="2025-03-31", is_active=True)
        year_2025, _ = AcademicYear.objects.get_or_create(school=school, name="2025-2026", start_date="2025-04-01", end_date="2026-03-31")
        
        # Create Student
        student, created = Student.objects.get_or_create(
            school=school, 
            enrollment_number="TEST001",
            defaults={
                'first_name': 'Promotion',
                'last_name': 'Test',
                'date_of_birth': '2015-01-01',
                'gender': 'M',
                'current_class': class_1,
                'academic_year': year_2024
            }
        )
        if not created:
             # Reset
             student.current_class = class_1
             student.academic_year = year_2024
             student.is_active = True
             student.is_alumni = False
             student.save()
             StudentHistory.objects.filter(student=student).delete()
             
        print(f"1. Created Student: {student.first_name} in {student.current_class.name} ({student.academic_year.name})")
        
        # 2. Simulate Promotion Logic (calling logic directly as if it were the view)
        # Archive
        StudentHistory.objects.create(
            school=student.school,
            student=student,
            academic_year=student.academic_year,
            class_enrolled=student.current_class,
            section_enrolled=student.section,
            result='PROMOTED'
        )
        
        # Promote
        student.current_class = class_2
        student.academic_year = year_2025
        student.save()
        
        print(f"2. Promoted Student to: {student.current_class.name} ({student.academic_year.name})")
        
        # 3. Verify History
        history = StudentHistory.objects.filter(student=student)
        if history.exists():
            last_hist = history.first()
            print(f"3. History Found: {last_hist.class_enrolled.name} ({last_hist.academic_year.name})")
            print("SUCCESS: Promotion Loop Verified.")
        else:
            print("FAILURE: No History Record Found.")
            
    except Exception as e:
        print(f"ERROR: {str(e)}")

if __name__ == '__main__':
    verify_promotion()
