from django.core.management.base import BaseCommand
from django.contrib.auth.models import Group, Permission
from django.contrib.contenttypes.models import ContentType
from core.models import CoreUser
from students.models import Student, Attendance, Fee
from staff.models import StaffProfile
from transport.models import Vehicle, Route
from finance.models import Invoice, FeeCategory

class Command(BaseCommand):
    help = 'Setup default Groups and Permissions for the Application'

    def handle(self, *args, **kwargs):
        # Define Roles and their Model Access
        roles_config = {
            CoreUser.ROLE_SCHOOL_ADMIN: {
                'models': [Student, Attendance, Fee, StaffProfile, Vehicle, Route, Invoice, FeeCategory, CoreUser],
                'actions': ['add', 'change', 'delete', 'view']
            },
            CoreUser.ROLE_PRINCIPAL: {
                'models': [Student, Attendance, Fee, StaffProfile, Vehicle, Route, Invoice, FeeCategory],
                'actions': ['add', 'change', 'view'] # No delete for Principal by default? Or yes? User said "Admin only". Let's give all, restrict later.
            },
            CoreUser.ROLE_TEACHER: {
                'models': [Student, Attendance],
                'actions': ['add', 'change', 'view'] 
            },
            CoreUser.ROLE_ACCOUNTANT: {
                'models': [Fee, Invoice, FeeCategory],
                'actions': ['add', 'change', 'view'] 
            },
            CoreUser.ROLE_OFFICE_STAFF: {
                'models': [Student],
                'actions': ['add', 'change', 'view']
            }
        }

        for role, config in roles_config.items():
            group, created = Group.objects.get_or_create(name=role)
            print(f"Processing Role: {role}")
            
            permissions_to_add = []
            for model in config['models']:
                content_type = ContentType.objects.get_for_model(model)
                for action in config['actions']:
                    codename = f"{action}_{model._meta.model_name}"
                    try:
                        perm = Permission.objects.get(codename=codename, content_type=content_type)
                        permissions_to_add.append(perm)
                    except Permission.DoesNotExist:
                        print(f"Warning: Permission {codename} not found")
            
            group.permissions.set(permissions_to_add)
            group.save()
            print(f"Updated permissions for {role}")

        self.stdout.write(self.style.SUCCESS('Successfully setup Roles & Permissions'))
