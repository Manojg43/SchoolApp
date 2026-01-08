import os
import django
import sys

# Setup Django environment
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from students.models import Student
from schools.models import School, Class, Section, AcademicYear
from rest_framework.test import APIRequestFactory
from students.views import StudentViewSet

def test_create_student():
    print("Testing Student Creation...")
    
    # Get prerequisites
    school = School.objects.first()
    if not school:
        print("ERROR: No school found")
        return

    cls = Class.objects.filter(school=school).first()
    if not cls:
        print("ERROR: No class found")
        return
        
    section = Section.objects.filter(school=school).first()
    
    # Payload
    payload = {
        "first_name": "Test",
        "last_name": "Student",
        "date_of_birth": "2015-01-01",
        "gender": "M",
        "current_class": cls.id,
        "section": section.id if section else None,
        "address": "123 Test Lane",
        "father_name": "Test Father",
        "mother_name": "Test Mother",
        "emergency_mobile": "9999999999",
        "student_id": "ST_TEST_001",
        "enrollment_number": "A001" # Required field
    }
    
    print(f"Payload: {payload}")
    
    # Simulate Request
    factory = APIRequestFactory()
    request = factory.post('/api/students/', payload, format='json')
    
    # Mock User
    from django.contrib.auth import get_user_model
    User = get_user_model()
    user = User.objects.filter(school=school).first()
    if not user:
        # Create dummy user if needed
        user = User.objects.create(username='test_admin', school=school)
        
    request.user = user
    
    # Init ViewSet
    view = StudentViewSet.as_view({'post': 'create'})
    
    try:
        response = view(request)
        print(f"Response Status: {response.status_code}")
        print(f"Response Data: {response.data}")
    except Exception as e:
        print(f"CRASHED: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_create_student()
