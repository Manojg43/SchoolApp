import pytest
from django.test import Client
from rest_framework.test import APIClient
from rest_framework.authtoken.models import Token


@pytest.fixture
def api_client():
    """Returns an unauthenticated API client."""
    return APIClient()


@pytest.fixture
def authenticated_client(db, django_user_model):
    """Returns an authenticated API client with a test user."""
    from schools.models import School
    
    # Create a test school
    school = School.objects.create(
        name="Test School",
        address="123 Test Street"
    )
    
    # Create a test user (School Admin)
    user = django_user_model.objects.create_user(
        username="testadmin",
        password="testpass123",
        email="test@example.com",
        role="SCHOOL_ADMIN",
        school=school
    )
    
    # Create auth token
    token, _ = Token.objects.get_or_create(user=user)
    
    client = APIClient()
    client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")
    client.user = user
    client.school = school
    return client
