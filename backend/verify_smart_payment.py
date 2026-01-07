import os
import django
from decimal import Decimal

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from finance.models import Invoice, FeeCategory, FeeStructure, StudentFeeBreakup, Receipt, PaymentAllocation
from schools.models import School, AcademicYear, Class, Section
from students.models import Student
from finance.services import FeeService

def verify_smart_payment():
    print("🧪 Verifying Smart Payment Logic...")
    
    # Setup Data
    school = School.objects.first()
    year = AcademicYear.objects.filter(school=school, is_active=True).first()
    if not year:
        year = AcademicYear.objects.create(school=school, name="2025-26", start_date="2025-04-01", end_date="2026-03-31", is_active=True)
    
    student = Student.objects.filter(school=school, is_active=True).first()
    if not student:
        print("❌ No active student found. Cannot run test.")
        return

    # Create Mock Invoice with Multiple Heads
    print(f"   - Creating Invoice for {student.first_name}...")
    
    cat1, _ = FeeCategory.objects.get_or_create(school=school, name="Tuition", defaults={'gst_rate': 0})
    cat2, _ = FeeCategory.objects.get_or_create(school=school, name="Transport", defaults={'gst_rate': 18})
    cat3, _ = FeeCategory.objects.get_or_create(school=school, name="Library", defaults={'gst_rate': 0})
    
    invoice = Invoice.objects.create(
        school=school, student=student, academic_year=year,
        total_amount=Decimal('8000.00'), due_date="2025-06-15", status='PENDING'
    )
    
    # Breakups: Tuition 5000, Transport 2000, Library 1000
    b1 = StudentFeeBreakup.objects.create(invoice=invoice, head=cat1, amount=5000, base_amount=5000, tax_amount=0)
    b2 = StudentFeeBreakup.objects.create(invoice=invoice, head=cat2, amount=2000, base_amount=1694.92, tax_amount=305.08)
    b3 = StudentFeeBreakup.objects.create(invoice=invoice, head=cat3, amount=1000, base_amount=1000, tax_amount=0)
    
    print("   - Invoice Created. Total: 8000. Heads: Tuition(5000), Transport(2000), Library(1000)")

    # Test 1: Auto Distribution (Partial Payment of 4000)
    # Expected: 4000 / 3 = 1333.33 each. 
    # But Library is only 1000. So Library gets 1000 FULL.
    # Surplus 333.33 redistributes to Tuition & Transport.
    # New Remaining: 3000. Heads: 2. Share: 1500 per head.
    # Result: Library=1000, Tuition=1500, Transport=1500.
    
    print("\n🔹 Test 1: Auto Distribution (Pay 4000)")
    try:
        r1 = FeeService.process_payment(invoice, Decimal('4000'), 'CASH', None)
        print("   - Payment Processed.")
        
        b1.refresh_from_db()
        b2.refresh_from_db()
        b3.refresh_from_db()
        
        print(f"     Tuition Paid: {b1.paid_amount} (Expected ~1500)")
        print(f"     Transport Paid: {b2.paid_amount} (Expected ~1500)")
        print(f"     Library Paid: {b3.paid_amount} (Expected 1000)")
        
        if b3.paid_amount == 1000 and b1.paid_amount > 1490 and b2.paid_amount > 1490:
             print("✅ Auto Distribution Success")
        else:
             print("❌ Auto Distribution Logic Failed")
             
    except Exception as e:
        print(f"❌ Error: {e}")

    # Test 2: Custom Allocation (Pay 2000: 1500 Tuition, 500 Transport)
    print("\n🔹 Test 2: Custom Allocation (Pay 2000 -> 1500 Tuition, 500 Transport)")
    custom_alloc = [
        {'head_id': cat1.id, 'amount': 1500},
        {'head_id': cat2.id, 'amount': 500}
    ]
    
    try:
        start_tuition = b1.paid_amount
        start_transport = b2.paid_amount
        
        r2 = FeeService.process_payment(
            invoice, Decimal('2000'), 'CASH', None, 
            custom_allocations=custom_alloc
        )
        
        b1.refresh_from_db()
        b2.refresh_from_db()
        
        diff_tuition = b1.paid_amount - start_tuition
        diff_transport = b2.paid_amount - start_transport
        
        print(f"     Tuition Added: {diff_tuition} (Expected 1500)")
        print(f"     Transport Added: {diff_transport} (Expected 500)")
        
        if diff_tuition == 1500 and diff_transport == 500:
            print("✅ Custom Allocation Success")
        else:
            print("❌ Custom Allocation Failed")

    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

    # Cleanup
    invoice.delete()

if __name__ == '__main__':
    verify_smart_payment()
