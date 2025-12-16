import os
import django
from django.contrib.auth.models import Group, Permission
from django.contrib.contenttypes.models import ContentType

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from core.models import CoreUser
from finance.models import Invoice, Receipt, Salary, FeeStructure
from students.models import Student, Attendance
from transport.models import Vehicle, Route
from certificates.models import Certificate
from staff.models import StaffProfile, TeacherProfile

def setup_roles():
    print("--- Setting up Roles & Permissions ---")
    
    # 1. Define Role -> Model Mappings (CRUD)
    roles = {
        'Finance Manager': {
            'models': [Invoice, Receipt, Salary, FeeStructure],
            'custom_perms': [], # Handled by CoreUser fields, but Groups can enforce it too if we used a custom backend. 
                                # For now, we use Groups to group standard perms.
            'description': "Can manage all financial records."
        },
        'Transport Manager': {
            'models': [Vehicle, Route],
            'custom_perms': [],
            'description': "Can manage vehicles and routes."
        },
        'Certificate Manager': {
            'models': [Certificate],
            'custom_perms': [],
            'description': "Can issue certificates."
        },
        'Teacher': {
            'models': [Student, Attendance],
            'custom_perms': [], 
            'description': "Can manage students and attendance."
        },
        'Staff': {
            'models': [],
            'custom_perms': [],
            'description': "Basic staff access."
        }
    }

    for role_name, config in roles.items():
        group, created = Group.objects.get_or_create(name=role_name)
        if created:
            print(f"[OK] Created Group: {role_name}")
        else:
            print(f"[INFO] Group Exists: {role_name}")

        permissions = []
        for model in config['models']:
            ct = ContentType.objects.get_for_model(model)
            # Add add, change, delete, view
            perms = Permission.objects.filter(content_type=ct)
            permissions.extend(perms)
        
        group.permissions.set(permissions)
        print(f"   -> Assigned {len(permissions)} permissions to {role_name}")

    print("\n[SUCCESS] All roles configured.")

if __name__ == "__main__":
    setup_roles()
