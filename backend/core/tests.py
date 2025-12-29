"""
Tests for the Core App (Authentication, Permissions).
"""
import pytest
from django.urls import reverse
from rest_framework import status


@pytest.mark.django_db
class TestLoginAPI:
    """Tests for the Login API endpoint."""

    def test_login_success(self, api_client, django_user_model):
        """Test successful login returns a token."""
        from schools.models import School
        
        school = School.objects.create(name="Test School")
        user = django_user_model.objects.create_user(
            username="testuser",
            password="securepassword123",
            school=school,
            role="SCHOOL_ADMIN"
        )
        
        response = api_client.post(
            "/api/login/",
            {"username": "testuser", "password": "securepassword123"},
            format="json"
        )
        
        assert response.status_code == status.HTTP_200_OK
        assert "token" in response.data
        assert response.data["role"] == "SCHOOL_ADMIN"

    def test_login_invalid_credentials(self, api_client):
        """Test login with wrong password returns 400."""
        response = api_client.post(
            "/api/login/",
            {"username": "nonexistent", "password": "wrongpassword"},
            format="json"
        )
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_login_missing_fields(self, api_client):
        """Test login without required fields returns 400."""
        response = api_client.post("/api/login/", {}, format="json")
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
class TestPermissions:
    """Tests for the StandardPermission class."""

    def test_unauthenticated_user_denied(self, api_client):
        """Test that unauthenticated requests are denied."""
        response = api_client.get("/api/students/")
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_authenticated_user_can_list(self, authenticated_client):
        """Test that authenticated users can list resources."""
        response = authenticated_client.get("/api/students/")
        
        assert response.status_code == status.HTTP_200_OK

    def test_school_isolation(self, authenticated_client, django_user_model):
        """Test that users can only see data from their own school."""
        from schools.models import School
        from students.models import Student
        
        # Create a student in the authenticated user's school
        Student.objects.create(
            school=authenticated_client.school,
            first_name="John",
            last_name="Doe",
            enrollment_number="STU001",
            date_of_birth="2010-01-01",
            gender="M",
            father_name="Parent Doe",
            emergency_mobile="1234567890"
        )
        
        # Create another school with a student
        other_school = School.objects.create(name="Other School")
        Student.objects.create(
            school=other_school,
            first_name="Jane",
            last_name="Other",
            enrollment_number="STU002",
            date_of_birth="2010-02-01",
            gender="F",
            father_name="Other Parent",
            emergency_mobile="0987654321"
        )
        
        response = authenticated_client.get("/api/students/")
        
        # Should only see the student from their own school
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
        assert response.data[0]["first_name"] == "John"
