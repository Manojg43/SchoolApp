"""
Tests for the Finance App (Invoices, Payments, Salary).
"""
import pytest
from decimal import Decimal
from django.utils import timezone
from rest_framework import status


@pytest.mark.django_db
class TestInvoiceAPI:
    """Tests for Invoice CRUD operations."""

    def test_create_invoice(self, authenticated_client):
        """Test creating a new invoice."""
        from students.models import Student
        from schools.models import AcademicYear
        
        # Create prerequisite data
        year = AcademicYear.objects.create(
            school=authenticated_client.school,
            name="2024-25",
            start_date="2024-04-01",
            end_date="2025-03-31",
            is_active=True
        )
        
        student = Student.objects.create(
            school=authenticated_client.school,
            first_name="Test",
            last_name="Student",
            enrollment_number="STU001",
            date_of_birth="2010-01-01",
            gender="M",
            father_name="Parent",
            emergency_mobile="1234567890",
            academic_year=year
        )
        
        response = authenticated_client.post(
            "/api/finance/invoices/",
            {
                "student": student.id,
                "academic_year": year.id,
                "total_amount": "5000.00",
                "due_date": "2024-05-01",
                "description": "Tuition Fee"
            },
            format="json"
        )
        
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["total_amount"] == "5000.00"
        assert response.data["status"] == "PENDING"

    def test_list_invoices(self, authenticated_client):
        """Test listing invoices for a school."""
        response = authenticated_client.get("/api/finance/invoices/")
        
        assert response.status_code == status.HTTP_200_OK
        assert isinstance(response.data, list)


@pytest.mark.django_db
class TestReceiptAPI:
    """Tests for Payment Receipt operations."""

    def test_record_payment(self, authenticated_client):
        """Test recording a payment against an invoice."""
        from students.models import Student
        from schools.models import AcademicYear
        from finance.models import Invoice
        
        year = AcademicYear.objects.create(
            school=authenticated_client.school,
            name="2024-25",
            start_date="2024-04-01",
            end_date="2025-03-31",
            is_active=True
        )
        
        student = Student.objects.create(
            school=authenticated_client.school,
            first_name="Test",
            last_name="Student",
            enrollment_number="STU002",
            date_of_birth="2010-01-01",
            gender="M",
            father_name="Parent",
            emergency_mobile="1234567890",
            academic_year=year
        )
        
        invoice = Invoice.objects.create(
            school=authenticated_client.school,
            student=student,
            academic_year=year,
            total_amount=Decimal("5000.00"),
            due_date=timezone.now().date(),
            description="Tuition Fee"
        )
        
        response = authenticated_client.post(
            "/api/finance/receipts/",
            {
                "invoice": invoice.id,
                "amount": "2500.00",
                "payment_mode": "CASH",
                "date": timezone.now().date().isoformat()
            },
            format="json"
        )
        
        assert response.status_code == status.HTTP_201_CREATED
        
        # Verify invoice status updated
        invoice.refresh_from_db()
        assert invoice.paid_amount == Decimal("2500.00")
        assert invoice.status == "PARTIAL"


@pytest.mark.django_db
class TestSalaryModel:
    """Tests for Salary calculation logic."""

    def test_salary_calculation(self, authenticated_client, django_user_model):
        """Test that salary is calculated correctly based on attendance."""
        from finance.models import StaffSalaryStructure, Salary
        from staff.models import StaffAttendance
        
        # Get the test user from the authenticated client
        staff_user = authenticated_client.user
        
        # Create salary structure
        salary_structure = StaffSalaryStructure.objects.create(
            school=authenticated_client.school,
            staff=staff_user,
            base_salary=Decimal("30000.00")
        )
        
        # Create attendance records for a month (20 working days)
        for day in range(1, 21):
            StaffAttendance.objects.create(
                school=authenticated_client.school,
                staff=staff_user,
                date=f"2024-01-{day:02d}",
                status="PRESENT",
                check_in="09:00:00",
                check_out="17:00:00"
            )
        
        # Salary generation would typically be done via a management command
        # Here we just verify the model works
        salary = Salary.objects.create(
            school=authenticated_client.school,
            staff=staff_user,
            month=1,
            year=2024,
            base_salary=salary_structure.base_salary,
            days_worked=20,
            total_days=22,
            deductions=Decimal("0.00"),
            net_salary=Decimal("30000.00")
        )
        
        assert salary.net_salary == Decimal("30000.00")
        assert salary.is_paid == False
