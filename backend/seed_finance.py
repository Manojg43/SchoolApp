import os
import django
import random

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from schools.models import School, AcademicYear, Class
from finance.models import FeeCategory, FeeStructure
from core.models import CoreUser

def seed_finance():
    print("Seeding Finance Data...")
    
    # 1. Get School (First one or create)
    school = School.objects.first()
    if not school:
        print("No school found. Please create a school first.")
        return

    print(f"Using School: {school.name}")

    # 2. Get Academic Year
    year = AcademicYear.objects.filter(school=school, is_active=True).first()
    if not year:
        year = AcademicYear.objects.create(school=school, name="2024-2025", start_date="2024-04-01", end_date="2025-03-31", is_active=True)
        print("Created Academic Year: 2024-2025")

    # 3. Create Categories
    categories = [
        "Tuition Fee",
        "Exam Fee",
        "Sports Fee",
        "Library Fee",
        "Transport Fee",
        "Lab Fee"
    ]
    
    cat_objs = []
    for cat_name in categories:
        cat, created = FeeCategory.objects.get_or_create(school=school, name=cat_name)
        cat_objs.append(cat)
        if created:
            print(f"Created Category: {cat_name}")

    # 4. Create Fee Structures for Classes
    classes = Class.objects.filter(school=school)
    if not classes.exists():
        print("No classes found. Please seed classes first.")
        return

    count = 0
    for cls in classes:
        # Base multiplier based on class number (Parse 'Class 10' -> 10, or just random if text)
        multiplier = 1.0
        try:
            val = int(''.join(filter(str.isdigit, cls.name)))
            multiplier = 1 + (val * 0.1) # 10% increase per class
        except:
            pass

        # Tuition
        tuition_amt = 10000 * multiplier
        FeeStructure.objects.get_or_create(
            school=school, academic_year=year, class_assigned=cls, category=cat_objs[0],
            defaults={'amount': round(tuition_amt, 2)}
        )
        
        # Exam (Flatish)
        exam_amt = 500 * multiplier
        FeeStructure.objects.get_or_create(
            school=school, academic_year=year, class_assigned=cls, category=cat_objs[1],
            defaults={'amount': round(exam_amt, 2)}
        )

        # Lab (Only for higher classes?)
        if multiplier > 1.5: 
            FeeStructure.objects.get_or_create(
                school=school, academic_year=year, class_assigned=cls, category=cat_objs[5],
                defaults={'amount': 2000.00}
            )

        print(f"Seeded Structure for {cls.name}")
        count += 1

    print(f"Finance Seeding Complete! Added structures for {count} classes.")

if __name__ == '__main__':
    seed_finance()
