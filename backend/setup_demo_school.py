
import os
import django
from django.utils import timezone
import datetime

# Setup Django Environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from core.models import CoreUser
from schools.models import School, AcademicYear, Class, Section
from students.models import Student
from staff.models import TeacherProfile, StaffProfile
from finance.models import FeeCategory, FeeStructure, Invoice, Receipt
from transport.models import Vehicle, Route, Stop
from certificates.models import CertificateTemplate

def setup_demo():
    print("--- Setting up Demo School Ecosystem ---")

    # 1. Super Admin (Developer)
    if not CoreUser.objects.filter(username='dev_admin').exists():
        superuser = CoreUser.objects.create_superuser('dev_admin', 'admin@school.com', 'admin123')
        superuser.role = CoreUser.ROLE_SUPER_ADMIN
        superuser.save()
        print(f"[OK] SuperUser Created: dev_admin ({superuser.user_id})")
    else:
        print("[INFO] SuperUser already exists.")

    # 2. Create School
    school, created = School.objects.get_or_create(
        name="Greenwood High International",
        defaults={'address': "123 Education Lane, Tech City", 'language': 'en'}
    )
    if created:
        print(f"[OK] School Created: {school} ({school.school_id})")
    else:
        print(f"[INFO] School exists: {school} ({school.school_id})")

    # 3. Create School Admin / Principal
    if not CoreUser.objects.filter(username='principal_green').exists():
        principal = CoreUser.objects.create_user('principal_green', 'principal@green.com', 'pass123')
        principal.school = school
        principal.role = CoreUser.ROLE_PRINCIPAL
        principal.first_name = "Albus"
        principal.last_name = "Dumbledore"
        principal.save()
        print(f"[OK] Principal Created: principal_green ({principal.user_id})")

    # 4. Academic Year
    ay, created = AcademicYear.objects.get_or_create(
        school=school,
        name="2024-25",
        defaults={'start_date': datetime.date(2024, 6, 1), 'end_date': datetime.date(2025, 5, 31), 'is_active': True}
    )

    # 5. Class & Section
    cls_10, _ = Class.objects.get_or_create(school=school, name="Class 10", order=10)
    sec_a, _ = Section.objects.get_or_create(school=school, parent_class=cls_10, name="A")

    # 6. Student
    if not Student.objects.filter(enrollment_number='ENR001').exists():
        student = Student.objects.create(
            school=school,
            academic_year=ay,
            current_class=cls_10,
            section=sec_a,
            first_name="Harry",
            last_name="Potter",
            enrollment_number="ENR001",
            date_of_birth=datetime.date(2008, 7, 31),
            gender='M'
        )
        print(f"[OK] Student Created: {student} ({student.student_id})")
    else:
        student = Student.objects.get(enrollment_number='ENR001')

    # 7. Teacher
    if not CoreUser.objects.filter(username='teacher_snipe').exists():
        t_user = CoreUser.objects.create_user('teacher_snipe', 'snape@green.com', 'pass123')
        t_user.school = school
        t_user.role = CoreUser.ROLE_TEACHER
        t_user.first_name = "Severus"
        t_user.last_name = "Snape"
        t_user.save()
        
        TeacherProfile.objects.create(user=t_user, qualification="M.Sc. Potions", subjects="Chemistry, Potions")
        print(f"[OK] Teacher Created: {t_user} ({t_user.user_id})")

    # 8. Finance (Fee & Invoice)
    cat_tuition, _ = FeeCategory.objects.get_or_create(school=school, name="Tuition Fee")
    structure, _ = FeeStructure.objects.get_or_create(
        school=school, academic_year=ay, class_assigned=cls_10, category=cat_tuition,
        defaults={'amount': 50000}
    )
    
    if not Invoice.objects.filter(student=student, title="Term 1 Fee").exists():
        inv = Invoice.objects.create(
            school=school,
            student=student,
            fee_structure=structure,
            title="Term 1 Fee",
            total_amount=25000,
            due_date=datetime.date(2024, 9, 15)
        )
        print(f"[OK] Invoice Generated: {inv.invoice_id} - {inv.total_amount}")

    # 9. Transport
    if not Vehicle.objects.filter(registration_number="MH-12-AB-1234").exists():
        veh = Vehicle.objects.create(
            school=school,
            registration_number="MH-12-AB-1234",
            model="Magic Bus",
            capacity=40
        )
        print(f"[OK] Vehicle Created: {veh} ({veh.vehicle_id})")

    # 10. Certificates
    if not CertificateTemplate.objects.filter(name="Bonafide Certificate").exists():
        html_content = """
        <div style="border:5px double black; padding:20px; text-align:center;">
            <h1>Bonafide Certificate</h1>
            <p>This is to certify that <b>{{student_name}}</b> of Class <b>{{class}}</b> is a bonafide student of our school.</p>
            <p>Date: {{date}}</p>
        </div>
        """
        CertificateTemplate.objects.create(
            school=school,
            name="Bonafide Certificate",
            type="BONAFIDE",
            html_content=html_content
        )
        print("[OK] Bonafide Template Created")

    print("\n--- Setup Complete ---")
    print("Login Credentials:")
    print("Super Admin: dev_admin / admin123")
    print("Principal: principal_green / pass123")
    print("Teacher: teacher_snipe / pass123")

if __name__ == "__main__":
    setup_demo()
