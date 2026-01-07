import os
import django
from decimal import Decimal

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from schools.models import School, AcademicYear, Class, Section
from finance.models import FeeCategory, FeeStructure, Invoice, StudentFeeBreakup, Receipt
from finance.services import FeeService
from students.models import Student
from core.models import CoreUser
from datetime import date

def run_verification():
    print(">>> Setting up Test Data...")
    
    # 1. Setup Data
    school = School.objects.first()
    if not school:
        school = School.objects.create(name="Test School", school_id="TEST001")
        
    year = AcademicYear.objects.filter(school=school).first()
    if not year:
        year = AcademicYear.objects.create(school=school, name="2025-26", start_date=date(2025,6,1), end_date=date(2026,5,31))
        
    cls = Class.objects.create(school=school, name="Class 10", order=10)
    sec = Section.objects.create(school=school, name="A", parent_class=cls)
    
    # Create User
    user, _ = CoreUser.objects.get_or_create(email="admin@test.com", defaults={'school': school, 'role': 'SCHOOL_ADMIN', 'username': 'admin_test'})
    
    # Create Student
    import random
    rand_id = random.randint(1000, 9999)
    student = Student.objects.create(
        school=school, 
        first_name="John", 
        last_name=f"Doe {rand_id}", 
        enrollment_number=f"ST{rand_id}",
        current_class=cls,
        section=sec,
        date_of_birth=date(2010,1,1),
        gender='M'
    )
    
    # 2. Define Fee Structure
    # Heads: Tuition (5000), Sports (3000), Library (2000) = Total 10000
    head_tuition = FeeCategory.objects.create(school=school, name="Tuition Fee")
    head_sports = FeeCategory.objects.create(school=school, name="Sports Fee")
    head_library = FeeCategory.objects.create(school=school, name="Library Fee")
    
    FeeStructure.objects.create(school=school, academic_year=year, class_assigned=cls, section=sec, category=head_tuition, amount=5000)
    FeeStructure.objects.create(school=school, academic_year=year, class_assigned=cls, section=sec, category=head_sports, amount=3000)
    FeeStructure.objects.create(school=school, academic_year=year, class_assigned=cls, section=sec, category=head_library, amount=2000)

    print(">>> Generating Invoice...")
    # 3. Generate Invoice
    result = FeeService.generate_annual_fees(year, school)
    print(f"Generation Result: {result}")
    
    invoice = Invoice.objects.get(student=student, academic_year=year)
    print(f"Invoice Created: {invoice.invoice_id}, Total: {invoice.total_amount}")
    assert invoice.total_amount == 10000
    assert invoice.breakups.count() == 3
    
    print(">>> Processing Partial Payment (5000)...")
    # 4. Process Payment (5000)
    # Logic: 5000 / 3 = 1666.66 per head.
    # Tuition (5000): Paid 1666.66
    # Sports (3000): Paid 1666.66
    # Library (2000): Paid 1666.66
    receipt = FeeService.process_payment(invoice, 5000, 'CASH', user)
    
    print(f"Receipt: {receipt.receipt_no}, Amount: {receipt.amount}")
    
    # Verify Breakups
    breakups = {b.head.name: b for b in invoice.breakups.all()}
    
    for name, b in breakups.items():
        print(f"  - {name}: Amount {b.amount}, Paid {b.paid_amount}, Balance {b.balance}")
        # With 5000 split 3 ways, each should satisfy min(balance, 1666.66)
        # 5000 / 3 = 1666.67 (approx)
        
    print(f"Invoice Status: {invoice.status}, Paid: {invoice.paid_amount}")
    assert invoice.status == 'PARTIAL'
    assert invoice.paid_amount == 5000

    print(">>> Verifications Passed!")

if __name__ == '__main__':
    try:
        run_verification()
    except Exception as e:
        print(f"FAILED: {e}")
        import traceback
        traceback.print_exc()
