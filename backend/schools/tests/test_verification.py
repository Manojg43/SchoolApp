from django.test import TestCase, Client
from schools.models import School
from students.models import Student
from django.urls import reverse
from datetime import date

class VerificationTest(TestCase):
    def setUp(self):
        # Create Schools
        self.school_a = School.objects.create(name="School A", code="SCHOOL-A", language='en')
        self.school_b = School.objects.create(name="School B", code="SCHOOL-B", language='hi')
        
        # Create Students
        self.student_a1 = Student.objects.create(
            school=self.school_a,
            first_name="Alice",
            last_name="Smith",
            enrollment_number="A001",
            date_of_birth=date(2010, 1, 1),
            gender='F',
            language='en'
        )
        self.student_b1 = Student.objects.create(
            school=self.school_b,
            first_name="Bob",
            last_name="Jones",
            enrollment_number="B001",
            date_of_birth=date(2010, 2, 2),
            gender='M',
            language='hi'
        )
        
        self.client = Client()

    def test_tenant_isolation(self):
        # Test School A Access
        response = self.client.get('/api/students/', headers={'X-School-ID': 'SCHOOL-A'})
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]['enrollment_number'], 'A001')
        
        # Test School B Access
        response = self.client.get('/api/students/', headers={'X-School-ID': 'SCHOOL-B'})
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]['enrollment_number'], 'B001')

    def test_pdf_generation(self):
        # Test PDF for Student A1 in Hindi
        url = f'/api/students/{self.student_a1.id}/download_certificate/?lang=hi'
        response = self.client.get(url, headers={'X-School-ID': 'SCHOOL-A'})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response['Content-Type'], 'application/pdf')
        self.assertIn('certificate.pdf', response['Content-Disposition'])

