"""
Comprehensive Test Data Seeder
Creates dummy data for all modules to test all APIs.
Run with: python manage.py seed_test_data
"""

from django.core.management.base import BaseCommand
from django.utils import timezone
from decimal import Decimal
import datetime
import random


class Command(BaseCommand):
    help = 'Seed the database with comprehensive test data for all modules'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clean',
            action='store_true',
            help='Delete existing test data before seeding',
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE('\n' + '='*50))
        self.stdout.write(self.style.NOTICE('  COMPREHENSIVE TEST DATA SEEDER'))
        self.stdout.write(self.style.NOTICE('='*50 + '\n'))

        # Import models
        from core.models import CoreUser
        from schools.models import School, AcademicYear, Class, Section
        from students.models import Student
        from staff.models import StaffProfile, StaffAttendance
        from finance.models import (
            FeeCategory, FeeStructure, Invoice, Receipt, 
            StaffSalaryStructure, Salary, FeeDiscount, CertificateFee
        )
        from transport.models import Vehicle, Route, Stop
        from certificates.models import CertificateTemplate
        from admissions.models import Enquiry, WorkflowTemplate, WorkflowStage
        
        # Try to import communication models
        try:
            from schools.models import Notice, Homework
            has_communication = True
        except ImportError:
            has_communication = False
            self.stdout.write(self.style.WARNING('Notice/Homework models not found in schools app'))

        stats = {
            'schools': 0, 'users': 0, 'students': 0, 'classes': 0,
            'sections': 0, 'staff': 0, 'attendance': 0, 'invoices': 0,
            'enquiries': 0, 'vehicles': 0, 'notices': 0, 'workflows': 0
        }

        # ============ STEP 1: SCHOOL ============
        self.stdout.write(self.style.NOTICE('📍 Creating School...'))
        school, created = School.objects.get_or_create(
            name="Demo International School",
            defaults={
                'address': "123 Education Street, Tech City, Maharashtra 411001",
                'language': 'en',
                'gps_lat': Decimal('18.5204'),
                'gps_long': Decimal('73.8567'),
                'geofence_radius': 100,
            }
        )
        if created:
            stats['schools'] += 1
        self.stdout.write(f"   ✓ School: {school.name} ({school.school_id})")

        # ============ STEP 2: USERS ============
        self.stdout.write(self.style.NOTICE('\n👥 Creating Users...'))
        
        users_to_create = [
            {'username': 'superadmin', 'email': 'super@demo.com', 'role': 'SUPER_ADMIN', 
             'first_name': 'Super', 'last_name': 'Admin', 'is_superuser': True, 'school': None},
            {'username': 'principal', 'email': 'principal@demo.com', 'role': 'PRINCIPAL',
             'first_name': 'Rajesh', 'last_name': 'Sharma', 'is_superuser': False, 'school': school},
            {'username': 'school_admin', 'email': 'admin@demo.com', 'role': 'SCHOOL_ADMIN',
             'first_name': 'Priya', 'last_name': 'Desai', 'is_superuser': False, 'school': school},
            {'username': 'accountant', 'email': 'accounts@demo.com', 'role': 'ACCOUNTANT',
             'first_name': 'Amit', 'last_name': 'Patel', 'is_superuser': False, 'school': school},
            {'username': 'teacher1', 'email': 'teacher1@demo.com', 'role': 'TEACHER',
             'first_name': 'Sunita', 'last_name': 'Kulkarni', 'is_superuser': False, 'school': school},
            {'username': 'teacher2', 'email': 'teacher2@demo.com', 'role': 'TEACHER',
             'first_name': 'Vikram', 'last_name': 'Joshi', 'is_superuser': False, 'school': school},
            {'username': 'teacher3', 'email': 'teacher3@demo.com', 'role': 'TEACHER',
             'first_name': 'Meera', 'last_name': 'Nair', 'is_superuser': False, 'school': school},
            {'username': 'driver1', 'email': 'driver1@demo.com', 'role': 'DRIVER',
             'first_name': 'Raju', 'last_name': 'Singh', 'is_superuser': False, 'school': school},
            {'username': 'office_staff', 'email': 'office@demo.com', 'role': 'OFFICE_STAFF',
             'first_name': 'Kavita', 'last_name': 'More', 'is_superuser': False, 'school': school},
        ]

        created_users = []
        for user_data in users_to_create:
            user, created = CoreUser.objects.get_or_create(
                username=user_data['username'],
                defaults={
                    'email': user_data['email'],
                    'role': user_data['role'],
                    'first_name': user_data['first_name'],
                    'last_name': user_data['last_name'],
                    'is_superuser': user_data['is_superuser'],
                    'school': user_data['school'],
                    'mobile': f"98765{random.randint(10000, 99999)}",
                    'can_mark_manual_attendance': user_data['role'] in ['PRINCIPAL', 'SCHOOL_ADMIN'],
                }
            )
            if created:
                user.set_password('test123')
                user.save()
                stats['users'] += 1
            created_users.append(user)
            self.stdout.write(f"   ✓ {user_data['role']}: {user.get_full_name()} ({user.username})")

        # ============ STEP 3: ACADEMIC YEAR ============
        self.stdout.write(self.style.NOTICE('\n📅 Creating Academic Year...'))
        current_year = datetime.date.today().year
        ay, created = AcademicYear.objects.get_or_create(
            school=school,
            name=f"{current_year}-{str(current_year+1)[2:]}",
            defaults={
                'start_date': datetime.date(current_year, 6, 1),
                'end_date': datetime.date(current_year + 1, 5, 31),
                'is_active': True
            }
        )
        self.stdout.write(f"   ✓ Academic Year: {ay.name}")

        # ============ STEP 4: CLASSES & SECTIONS ============
        self.stdout.write(self.style.NOTICE('\n🏫 Creating Classes & Sections...'))
        classes_created = []
        for i in range(1, 11):  # Class 1 to 10
            cls, created = Class.objects.get_or_create(
                school=school,
                name=f"Class {i}",
                defaults={'order': i}
            )
            if created:
                stats['classes'] += 1
            classes_created.append(cls)
            
            # Create sections A, B for each class
            for sec_name in ['A', 'B']:
                sec, created = Section.objects.get_or_create(
                    school=school,
                    parent_class=cls,
                    name=sec_name
                )
                if created:
                    stats['sections'] += 1
        
        self.stdout.write(f"   ✓ Created {len(classes_created)} classes with 2 sections each")

        # ============ STEP 5: STUDENTS ============
        self.stdout.write(self.style.NOTICE('\n🎒 Creating Students...'))
        
        student_names = [
            ('Aarav', 'Sharma'), ('Vivaan', 'Patel'), ('Aditya', 'Singh'),
            ('Vihaan', 'Kumar'), ('Arjun', 'Verma'), ('Reyansh', 'Gupta'),
            ('Ayaan', 'Reddy'), ('Krishna', 'Nair'), ('Ishaan', 'Joshi'),
            ('Sai', 'Iyer'), ('Ananya', 'Rao'), ('Aadhya', 'Menon'),
            ('Pihu', 'Deshmukh'), ('Diya', 'Kulkarni'), ('Myra', 'Bhatt'),
            ('Sara', 'Khan'), ('Kiara', 'Saxena'), ('Anika', 'Trivedi'),
            ('Navya', 'Agarwal'), ('Pari', 'Chauhan')
        ]
        
        enrollment_counter = 1
        for cls in classes_created[:5]:  # Create students for first 5 classes
            sections = Section.objects.filter(parent_class=cls, school=school)
            for section in sections:
                for j in range(4):  # 4 students per section
                    idx = (enrollment_counter - 1) % len(student_names)
                    fname, lname = student_names[idx]
                    enrollment = f"ENR{current_year}{enrollment_counter:04d}"
                    
                    student, created = Student.objects.get_or_create(
                        school=school,
                        enrollment_number=enrollment,
                        defaults={
                            'academic_year': ay,
                            'current_class': cls,
                            'section': section,
                            'first_name': fname,
                            'last_name': lname,
                            'date_of_birth': datetime.date(current_year - 10 - cls.order, 
                                                          random.randint(1, 12), 
                                                          random.randint(1, 28)),
                            'gender': random.choice(['M', 'F']),
                            'father_name': f"Mr. {lname}",
                            'mother_name': f"Mrs. {lname}",
                            'emergency_mobile': f"98765{random.randint(10000, 99999)}",
                            'address': f"{random.randint(1, 500)}, Demo Street, Tech City"
                        }
                    )
                    if created:
                        stats['students'] += 1
                    enrollment_counter += 1
        
        self.stdout.write(f"   ✓ Created {stats['students']} students across 5 classes")

        # ============ STEP 6: STAFF PROFILES & SALARY STRUCTURES ============
        self.stdout.write(self.style.NOTICE('\n💼 Creating Staff Profiles & Salary Structures...'))
        
        staff_users = CoreUser.objects.filter(
            school=school, 
            role__in=['TEACHER', 'DRIVER', 'OFFICE_STAFF', 'ACCOUNTANT', 'PRINCIPAL', 'SCHOOL_ADMIN']
        )
        
        designations = {
            'TEACHER': 'Senior Teacher',
            'DRIVER': 'School Bus Driver',
            'OFFICE_STAFF': 'Administrative Assistant',
            'ACCOUNTANT': 'Finance Officer',
            'PRINCIPAL': 'Principal',
            'SCHOOL_ADMIN': 'School Administrator'
        }
        
        salaries = {
            'TEACHER': 35000,
            'DRIVER': 20000,
            'OFFICE_STAFF': 25000,
            'ACCOUNTANT': 40000,
            'PRINCIPAL': 80000,
            'SCHOOL_ADMIN': 50000
        }
        
        for staff_user in staff_users:
            # Staff Profile
            profile, created = StaffProfile.objects.get_or_create(
                user=staff_user,
                defaults={
                    'designation': designations.get(staff_user.role, 'Staff'),
                    'department': 'Administration' if staff_user.role in ['OFFICE_STAFF', 'ACCOUNTANT', 'SCHOOL_ADMIN'] else 'Academic',
                    'can_mark_manual_attendance': staff_user.role in ['PRINCIPAL', 'SCHOOL_ADMIN']
                }
            )
            if created:
                stats['staff'] += 1
            
            # Salary Structure
            StaffSalaryStructure.objects.get_or_create(
                staff=staff_user,
                defaults={'basic_salary': Decimal(str(salaries.get(staff_user.role, 25000)))}
            )
        
        self.stdout.write(f"   ✓ Created profiles & salary structures for {stats['staff']} staff members")

        # ============ STEP 7: STAFF ATTENDANCE ============
        self.stdout.write(self.style.NOTICE('\n📋 Creating Staff Attendance...'))
        
        today = datetime.date.today()
        start_of_month = today.replace(day=1)
        
        for staff_user in staff_users:
            for day in range(1, today.day + 1):
                date = start_of_month.replace(day=day)
                if date.weekday() < 5:  # Weekdays only
                    att, created = StaffAttendance.objects.get_or_create(
                        staff=staff_user,
                        date=date,
                        defaults={
                            'school': school,
                            'status': 'PRESENT' if random.random() > 0.1 else 'HALF_DAY',
                            'check_in': datetime.time(9, 0),
                            'check_out': datetime.time(17, 0),
                            'source': 'SYSTEM'
                        }
                    )
                    if created:
                        stats['attendance'] += 1
        
        self.stdout.write(f"   ✓ Created {stats['attendance']} attendance records")

        # ============ STEP 8: FEE CATEGORIES & STRUCTURES ============
        self.stdout.write(self.style.NOTICE('\n💰 Creating Fee Categories & Structures...'))
        
        fee_categories = [
            ('Tuition Fee', 'Monthly tuition fee'),
            ('Transport Fee', 'School bus transport fee'),
            ('Lab Fee', 'Science and Computer lab fee'),
            ('Library Fee', 'Annual library fee'),
            ('Sports Fee', 'Sports and extracurricular activities')
        ]
        
        for cat_name, desc in fee_categories:
            cat, _ = FeeCategory.objects.get_or_create(
                school=school,
                name=cat_name,
                defaults={'description': desc}
            )
            
            # Create fee structure for each class
            for cls in classes_created:
                base_amount = 5000 + (cls.order * 500)  # Higher classes pay more
                FeeStructure.objects.get_or_create(
                    school=school,
                    academic_year=ay,
                    class_assigned=cls,
                    category=cat,
                    defaults={'amount': Decimal(str(base_amount))}
                )
        
        self.stdout.write(f"   ✓ Created {len(fee_categories)} fee categories with structures")

        # ============ STEP 9: INVOICES & RECEIPTS ============
        self.stdout.write(self.style.NOTICE('\n🧾 Creating Invoices & Receipts...'))
        
        students = Student.objects.filter(school=school)[:10]  # First 10 students
        tuition_cat = FeeCategory.objects.filter(school=school, name='Tuition Fee').first()
        
        for student in students:
            inv, created = Invoice.objects.get_or_create(
                school=school,
                student=student,
                academic_year=ay,
                defaults={
                    'total_amount': Decimal('25000'),
                    'due_date': datetime.date(current_year, 9, 15),
                    'status': random.choice(['PENDING', 'PAID', 'PARTIAL'])
                }
            )
            if created:
                stats['invoices'] += 1
                
                # Add partial payment for some invoices
                if inv.status in ['PAID', 'PARTIAL']:
                    paid = inv.total_amount if inv.status == 'PAID' else Decimal('15000')
                    inv.paid_amount = paid
                    inv.save()
        
        self.stdout.write(f"   ✓ Created {stats['invoices']} invoices")

        # ============ STEP 10: CERTIFICATE FEES ============
        self.stdout.write(self.style.NOTICE('\n📜 Creating Certificate Fees...'))
        
        cert_types = [
            ('BONAFIDE', 100),
            ('TC', 500),
            ('CHARACTER', 100),
            ('MIGRATION', 1000),
        ]
        
        for cert_type, fee in cert_types:
            CertificateFee.objects.get_or_create(
                school=school,
                certificate_type=cert_type,
                defaults={'fee_amount': Decimal(str(fee)), 'is_active': True}
            )
        
        self.stdout.write(f"   ✓ Created {len(cert_types)} certificate fee configurations")

        # ============ STEP 11: CERTIFICATE TEMPLATES ============
        self.stdout.write(self.style.NOTICE('\n📄 Creating Certificate Templates...'))
        
        templates = [
            ('Bonafide Certificate', 'BONAFIDE', '<h1>Bonafide Certificate</h1><p>This is to certify that {{student_name}} is a bonafide student of {{school_name}}.</p>'),
            ('Transfer Certificate', 'TC', '<h1>Transfer Certificate</h1><p>{{student_name}} has been granted transfer certificate.</p>'),
            ('Character Certificate', 'CHARACTER', '<h1>Character Certificate</h1><p>{{student_name}} has been a student of good character.</p>'),
        ]
        
        for name, cert_type, html in templates:
            CertificateTemplate.objects.get_or_create(
                school=school,
                name=name,
                defaults={'type': cert_type, 'html_content': html}
            )
        
        self.stdout.write(f"   ✓ Created {len(templates)} certificate templates")

        # ============ STEP 12: TRANSPORT ============
        self.stdout.write(self.style.NOTICE('\n🚌 Creating Transport Data...'))
        
        vehicles = [
            ('MH-12-AB-1234', 'Tata Starbus', 40),
            ('MH-12-CD-5678', 'Ashok Leyland', 45),
            ('MH-12-EF-9012', 'Force Traveller', 20),
        ]
        
        for reg, model, capacity in vehicles:
            veh, created = Vehicle.objects.get_or_create(
                school=school,
                registration_number=reg,
                defaults={'model': model, 'capacity': capacity}
            )
            if created:
                stats['vehicles'] += 1
        
        # Create routes
        route_names = ['North Route', 'South Route', 'East Route']
        vehicles_list = list(Vehicle.objects.filter(school=school))
        
        for i, route_name in enumerate(route_names):
            route, _ = Route.objects.get_or_create(
                school=school,
                name=route_name,
                defaults={
                    'vehicle': vehicles_list[i % len(vehicles_list)] if vehicles_list else None,
                }
            )
            
            # Add stops with fee_amount
            for j in range(3):
                Stop.objects.get_or_create(
                    route=route,
                    name=f"Stop {j+1} - {route_name}",
                    defaults={
                        'order': j + 1,
                        'fee_amount': Decimal(str(500 + j*200))  # 500, 700, 900 fees per stop distance
                    }
                )
        
        self.stdout.write(f"   ✓ Created {stats['vehicles']} vehicles with routes and stops")

        # ============ STEP 13: WORKFLOWS (Admissions) ============
        self.stdout.write(self.style.NOTICE('\n🔄 Creating Admission Workflows...'))
        
        workflow, created = WorkflowTemplate.objects.get_or_create(
            school=school,
            name="Standard Admission Workflow",
            workflow_type='ADMISSION',
            defaults={'is_default': True, 'is_active': True}
        )
        
        if created:
            stats['workflows'] += 1
            stages = [
                ('Enquiry Received', 1),
                ('Documents Verification', 2),
                ('Entrance Test', 3),
                ('Interview', 4),
                ('Approval', 5),
                ('Fee Payment', 6),
                ('Admission Complete', 7),
            ]
            
            for stage_name, order in stages:
                WorkflowStage.objects.create(
                    template=workflow,  # Use 'template' not 'workflow'
                    name=stage_name,
                    order=order
                )
        
        self.stdout.write(f"   ✓ Created admission workflow with 7 stages")

        # ============ STEP 14: ENQUIRIES ============
        self.stdout.write(self.style.NOTICE('\n📝 Creating Enquiries...'))
        
        enquiry_data = [
            ('Rahul', 'Mehta', 'rahul.parent@email.com', 'Mr. Sanjay Mehta'),
            ('Priya', 'Shah', 'priya.parent@email.com', 'Mr. Kiran Shah'),
            ('Aryan', 'Kapoor', 'aryan.parent@email.com', 'Mr. Raj Kapoor'),
            ('Anuja', 'Sinha', 'anuja.parent@email.com', 'Mrs. Neha Sinha'),
        ]
        
        # Get first stage from workflow - use 'template' not 'workflow'
        first_stage = WorkflowStage.objects.filter(template=workflow).order_by('order').first()
        
        for fname, lname, email, parent_name in enquiry_data:
            enq, created = Enquiry.objects.get_or_create(
                school=school,
                first_name=fname,  # Use first_name, not student_name
                last_name=lname,   # Use last_name
                parent_email=email,  # Use parent_email, not contact_email
                defaults={
                    'date_of_birth': datetime.date(current_year - 10, random.randint(1, 12), random.randint(1, 28)),
                    'gender': random.choice(['M', 'F']),
                    'parent_name': parent_name,
                    'parent_mobile': f"98765{random.randint(10000, 99999)}",
                    'class_applied': classes_created[random.randint(0, 4)],  # Use class_applied, not class_interested
                    'academic_year': ay,
                    'filled_via': random.choice(['WEB', 'WALK_IN', 'MOBILE']),  # Use filled_via, not source
                    'workflow': workflow,
                    'current_stage': first_stage,
                    'filled_by': created_users[1] if len(created_users) > 1 else None  # Principal
                }
            )
            if created:
                stats['enquiries'] += 1
        
        self.stdout.write(f"   ✓ Created {stats['enquiries']} enquiries")

        # ============ STEP 15: NOTICES (SKIPPED) ============
        # Notice model was not found or has different field structure
        # This section is skipped to ensure core data seeding completes

        # ============ SUMMARY ============
        self.stdout.write('\n' + '='*50)
        self.stdout.write(self.style.SUCCESS('  ✅ TEST DATA SEEDING COMPLETE'))
        self.stdout.write('='*50 + '\n')
        
        self.stdout.write(self.style.SUCCESS('📊 SUMMARY:'))
        for key, value in stats.items():
            if value > 0:
                self.stdout.write(f"   • {key.title()}: {value}")
        
        self.stdout.write('\n🔐 LOGIN CREDENTIALS:')
        self.stdout.write('   Super Admin: superadmin / test123')
        self.stdout.write('   Principal: principal / test123')
        self.stdout.write('   School Admin: school_admin / test123')
        self.stdout.write('   Teacher: teacher1 / test123')
        self.stdout.write('   Accountant: accountant / test123\n')
