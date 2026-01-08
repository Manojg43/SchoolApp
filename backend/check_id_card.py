import os
import sys
import django
from django.conf import settings

# Add project root to sys.path
sys.path.append(os.getcwd())

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from students.models import Student
from certificates.views import generate_certificate_pdf
from certificates.models import Certificate, CertificateTemplate
from django.contrib.auth import get_user_model

User = get_user_model()

def generate_test_card():
    # 1. Get a student
    student = Student.objects.first()
    if not student:
        print("No students found in DB. converting enquiry logic logic required or manual creation.")
        return

    print(f"Testing with Student: {student.get_full_name()} (ID: {student.student_id})")
    
    # 2. Ensure GR Number exists (populate if missing for test)
    if not student.gr_number:
        student.gr_number = "GR-TEST-001"
        student.save()
        print("Assigned temporary GR-TEST-001")

    # 3. Get School & User
    school = student.school
    user = User.objects.filter(is_superuser=True).first() or User.objects.first()

    # 4. Create/Get Template
    template, _ = CertificateTemplate.objects.get_or_create(
        school=school,
        type='ID_CARD',
        name='Standard ID Card',
        defaults={'html_content': '...'} # Content handled by view logic usually
    )

    # 5. Create Certificate Record
    cert = Certificate.objects.create(
        school=school,
        student=student,
        type='ID_CARD',
        purpose='Test Generation',
        issued_by=user
    )

    # 6. Generate PDF
    try:
        # Debug: Print HTML before PDF generation
        from django.template.loader import render_to_string
        # We need to manually invoke the logic from views.py or mock it here to see HTML
        # But wait, generate_certificate_pdf does the rendering internally.
        # Let's verify by just calling it and catching exception.
        
        pdf_content = generate_certificate_pdf(cert, template, student, school, user)
        
        output_path = "test_id_card.pdf"
        with open(output_path, "wb") as f:
            f.write(pdf_content)
        
        print(f"SUCCESS: PDF generated at {os.path.abspath(output_path)}")
        print(f"Size: {len(pdf_content)} bytes")
        
    except Exception as e:
        print(f"FAILED: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    generate_test_card()
