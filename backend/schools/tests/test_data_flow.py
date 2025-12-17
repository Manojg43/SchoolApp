from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from core.models import CoreUser
from schools.models import School, AcademicYear, Class, Section
from students.models import Student
from staff.models import StaffProfile

class DataFlowTests(APITestCase):
    def setUp(self):
        # 1. Setup Data
        self.school = School.objects.create(name="Test School", language="en")
        
        # Create Active Academic Year
        self.academic_year = AcademicYear.objects.create(
            school=self.school,
            name="2024-25",
            start_date="2024-04-01",
            end_date="2025-03-31",
            is_active=True
        )

        # Create Admin User
        self.admin_user = CoreUser.objects.create_user(
            username="admin@test.com",
            email="admin@test.com",
            password="password123",
            role=CoreUser.ROLE_SCHOOL_ADMIN,
            school=self.school
        )
        self.client.force_authenticate(user=self.admin_user)

        # Create Metadata
        self.class_10 = Class.objects.create(school=self.school, name="Class 10")
        self.section_A = Section.objects.create(school=self.school, parent_class=self.class_10, name="A")

    def test_staff_creation_flow(self):
        """
        Verify that creating a staff member works:
        - Auto-generates username from email
        - Handles empty joining_date (if None)
        - Creates StaffProfile
        """
        url = reverse('staff-list') # Assuming router basename 'staff'
        data = {
            "first_name": "John",
            "last_name": "Doe",
            "email": "teacher@test.com",
            "mobile": "1234567890",
            "role": "TEACHER",
            "designation": "Senior Teacher",
            # "joining_date": "" # Frontend sends keys, let's simulate missing or None
            # Only testing valid cases first
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Verify DB
        staff = CoreUser.objects.get(email="teacher@test.com")
        self.assertEqual(staff.username, "teacher@test.com")
        self.assertTrue(StaffProfile.objects.filter(user=staff).exists())
        self.assertEqual(staff.staff_profile.designation, "Senior Teacher")

    def test_student_creation_flow(self):
        """
        Verify that creating a student works:
        - Auto-assigns active Academic Year
        - Handles optional Section
        """
        url = reverse('student-list') # Assuming router basename 'student' from 'students' usage
        # Actually in urls.py: router.register(r'students', StudentViewSet) -> basename 'student' usually
        
        data = {
            "first_name": "Student",
            "last_name": "One",
            "father_name": "Father",
            "mother_name": "Mother",
            "email": "student@test.com", # Optional in model? No field in Student model for email, but serializer has fields='__all__'
            # Wait, Student model does NOT have email. User model has it.
            # Student model has 'enrollment_number'.
            "enrollment_number": "A101",
            "emergency_mobile": "9876543210",
            "date_of_birth": "2010-01-01",
            "gender": "M",
            "current_class": self.class_10.id,
            "section": self.section_A.id,
            # "academic_year": MISSING -> Should be auto-assigned
        }
        
        response = self.client.post('/api/students/', data, format='json') # Using explicit path to avoid reverse lookup issues
        if response.status_code != 201:
            print("Student Create Error:", response.data)
            
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        student = Student.objects.get(enrollment_number="A101")
        self.assertEqual(student.academic_year, self.academic_year)
        self.assertEqual(student.school, self.school)

    def test_duplicate_staff_email(self):
        # Ensure we can't create duplicate staff with same email
        url = reverse('staff-list')
        data = {
            "first_name": "Jane",
            "last_name": "Doe",
            "email": "jane@test.com",
            "mobile": "1111111111",
            "role": "TEACHER"
        }
        self.client.post(url, data)
        response = self.client.post(url, data) # Duplicate
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

