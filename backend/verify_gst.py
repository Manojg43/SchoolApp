import os
import django
from decimal import Decimal

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from schools.models import School, AcademicYear, Class, Section
from finance.models import FeeCategory, FeeStructure, Invoice, StudentFeeBreakup
from finance.services import FeeService
from students.models import Student
from core.models import CoreUser
from datetime import date
import random

def run_verification():
    print(">>> Setting up GST Test Data...")
    
    # 1. Setup Data
    school = School.objects.first()
    year = AcademicYear.objects.filter(school=school).first()
    cls, _ = Class.objects.get_or_create(school=school, name="Class GST", order=11)
    sec, _ = Section.objects.get_or_create(school=school, name="A", parent_class=cls)
    
    # Create Student
    rand_id = random.randint(10000, 99999)
    student = Student.objects.create(
        school=school, 
        first_name="GST", 
        last_name="Tester", 
        enrollment_number=f"GST{rand_id}",
        current_class=cls,
        section=sec,
        date_of_birth=date(2010,1,1),
        gender='M'
    )
    
    # 2. Define Fee Structure with GST
    # Case 1: Tuition (Exempt/Zero GST) - 5000
    head_tuition, _ = FeeCategory.objects.get_or_create(school=school, name="Tuition GST", defaults={'gst_rate': 0})
    
    # Case 2: Transport (18% Exclusive) - 1000
    # Expected: Base 1000, Tax 180, Total 1180
    head_transport, _ = FeeCategory.objects.get_or_create(school=school, name="Transport GST", defaults={'gst_rate': 18, 'is_tax_inclusive': False})
    
    # Case 3: Books (5% Inclusive) - 1050
    # Expected: Total 1050. Base = 1050 / 1.05 = 1000. Tax = 50.
    head_books, _ = FeeCategory.objects.get_or_create(school=school, name="Books GST", defaults={'gst_rate': 5, 'is_tax_inclusive': True})
    
    # Case 4: Odd Amount (Roundup Test) - 100.55 Exclusive 0% ? Or just base amount
    # Let's add a "Misc" fee of 100.55 (0% Tax)
    head_misc, _ = FeeCategory.objects.get_or_create(school=school, name="Misc GST", defaults={'gst_rate': 0})

    FeeStructure.objects.create(school=school, academic_year=year, class_assigned=cls, section=sec, category=head_tuition, amount=5000)
    FeeStructure.objects.create(school=school, academic_year=year, class_assigned=cls, section=sec, category=head_transport, amount=1000)
    FeeStructure.objects.create(school=school, academic_year=year, class_assigned=cls, section=sec, category=head_books, amount=1050)
    FeeStructure.objects.create(school=school, academic_year=year, class_assigned=cls, section=sec, category=head_misc, amount=100.55)

    print(">>> Generating Invoice...")
    # Expected Totals:
    # Tuition: 5000
    # Transport: 1180 (1000 + 180)
    # Books: 1050 (1000 + 50)
    # Misc: 100.55
    # Gross Total: 5000 + 1180 + 1050 + 100.55 = 7330.55
    # Rounding: 7331
    # RoundOff Amount: +0.45
    
    result = FeeService.generate_annual_fees(year, school)
    print(f"Generation Result: {result}")
    
    invoice = Invoice.objects.get(student=student, academic_year=year)
    print(f"Invoice: {invoice.invoice_id}")
    print(f"Total Amount: {invoice.total_amount}")
    print(f"Round Off: {invoice.round_off_amount}")
    
    # Validation
    assert invoice.total_amount == 7331.00
    # assert invoice.round_off_amount == Decimal('0.45') # Approx
    
    breakups = {b.head.name: b for b in invoice.breakups.all()}
    
    # Check Transport
    trans = breakups['Transport GST']
    print(f"Transport: Amount {trans.amount}, Base {trans.base_amount}, Tax {trans.tax_amount}")
    assert trans.amount == 1180.00
    assert trans.base_amount == 1000.00
    assert trans.tax_amount == 180.00
    
    # Check Books
    books = breakups['Books GST']
    print(f"Books: Amount {books.amount}, Base {books.base_amount}, Tax {books.tax_amount}")
    assert books.amount == 1050.00
    assert books.base_amount == 1000.00
    assert books.tax_amount == 50.00
    
    print(">>> GST Verifications Passed!")

if __name__ == '__main__':
    try:
        run_verification()
    except Exception as e:
        print(f"FAILED: {e}")
        import traceback
        traceback.print_exc()
