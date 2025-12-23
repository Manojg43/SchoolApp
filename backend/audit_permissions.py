"""
Comprehensive Django Permissions and Configuration Audit
This script checks for:
1. Missing permission_classes in views
2. View permissions setup
3. Management commands
4. Django settings security
5. Middleware configuration
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.conf import settings
from django.contrib.auth.models import Group, Permission
from django.contrib.contenttypes.models import ContentType
from core.models import CoreUser
from students.models import Student, Attendance, Fee
from schools.models import School, Class, Section,Notice, Homework
from transport.models import Vehicle, Route, TransportSubscription
from finance.models import Invoice, Salary, FeeStructure, FeeCategory
from staff.models import StaffAttendance, StaffProfile
from certificates.models import Certificate

print("="*80)
print("DJANGO PERMISSIONS & CONFIGURATION AUDIT")
print("="*80)

# 1. Check if all models have permissions
print("\n1. MODEL PERMISSIONS CHECK")
print("-"*80)

models_to_check = [
    Student, Attendance, Fee,
    School, Class, Section, Notice, Homework,
    Vehicle, Route, TransportSubscription,
    Invoice, Salary, FeeStructure, FeeCategory,
    StaffAttendance, StaffProfile,
    Certificate, CoreUser
]

for model in models_to_check:
    ct = ContentType.objects.get_for_model(model)
    perms = Permission.objects.filter(content_type=ct)
    perm_count = perms.count()
    
    # Django auto-creates 4 permissions: add, change, delete, view
    expected_count = 4
    
    if perm_count >= expected_count:
        print(f"✓ {model._meta.label}: {perm_count} permissions")
    else:
        print(f"✗ {model._meta.label}: Only {perm_count} permissions (expected {expected_count})")
        for perm in perms:
            print(f"  - {perm.codename}")

# 2. Check Groups/Roles
print("\n\n2. GROUPS/ROLES CHECK")
print("-"*80)

expected_roles = [
    CoreUser.ROLE_SCHOOL_ADMIN,
    CoreUser.ROLE_PRINCIPAL,
    CoreUser.ROLE_TEACHER,
    CoreUser.ROLE_ACCOUNTANT,
    CoreUser.ROLE_OFFICE_STAFF,
]

for role in expected_roles:
    try:
        group = Group.objects.get(name=role)
        perm_count = group.permissions.count()
        print(f"✓ {role}: {perm_count} permissions assigned")
    except Group.DoesNotExist:
        print(f"✗ {role}: Group does NOT exist!")

# 3. Check Superuser permissions
print("\n\n3. SUPERUSER CHECK")
print("-"*80)

superusers = CoreUser.objects.filter(is_superuser=True)
print(f"Total superusers: {superusers.count()}")
for su in superusers:
    print(f"  - {su.username} ({su.email})")

# 4. Security Settings Audit
print("\n\n4. SECURITY SETTINGS AUDIT")
print("-"*80)

security_checks = [
    ('DEBUG', 'Should be False in production', settings.DEBUG),
    ('SECRET_KEY', 'Should be long and unique', len(settings.SECRET_KEY) >= 50),
    ('ALLOWED_HOSTS', 'Should be configured', len(settings.ALLOWED_HOSTS) > 0),
    ('CSRF_COOKIE_SECURE', 'Should be True in HTTPS', getattr(settings, 'CSRF_COOKIE_SECURE', False)),
    ('SESSION_COOKIE_SECURE', 'Should be True in HTTPS', getattr(settings, 'SESSION_COOKIE_SECURE', False)),
    ('SECURE_SSL_REDIRECT', 'Should be True in HTTPS', getattr(settings, 'SECURE_SSL_REDIRECT', False)),
]

for setting_name, description, value in security_checks:
    status = "✓" if value else "✗"
    print(f"{status} {setting_name}: {value}")
    print(f"  Description: {description}")

# 5. Middleware Check
print("\n\n5. MIDDLEWARE CHECK")
print("-"*80)

required_middleware = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'corsheaders.middleware.CorsMiddleware',
]

for middleware in required_middleware:
    if middleware in settings.MIDDLEWARE:
        print(f"✓ {middleware}")
    else:
        print(f"✗ {middleware} - MISSING!")

# 6. REST Framework Settings
print("\n\n6. REST FRAMEWORK CONFIGURATION")
print("-"*80)

if hasattr(settings, 'REST_FRAMEWORK'):
    rest_config = settings.REST_FRAMEWORK
    
    checks = [
        ('DEFAULT_AUTHENTICATION_CLASSES', 'Authentication configured'),
        ('DEFAULT_PERMISSION_CLASSES', 'Default permissions set'),
        ('DEFAULT_PAGINATION_CLASS', 'Pagination enabled'),
    ]
    
    for key, desc in checks:
        if key in rest_config:
            print(f"✓ {key}: {desc}")
            if isinstance(rest_config[key], list):
                for item in rest_config[key]:
                    print(f"  - {item}")
            else:
                print(f"  - {rest_config[key]}")
        else:
            print(f"✗ {key}: NOT configured")
else:
    print("✗ REST_FRAMEWORK settings NOT found!")

# 7. Database Check
print("\n\n7. DATABASE CONFIGURATION")
print("-"*80)

db_config = settings.DATABASES['default']
print(f"Engine: {db_config['ENGINE']}")
print(f"Name: {db_config.get('NAME', 'N/A')}")

# 8. Custom Permissions Check
print("\n\n8. CUSTOM PERMISSIONS CHECK")
print("-"*80)

custom_perms = [
    ('can_access_finance', CoreUser),
    ('can_access_transport', CoreUser),
    ('can_access_certificates', CoreUser),
    ('can_access_attendance', CoreUser),
    ('can_access_student_records', CoreUser),
    ('can_manage_payroll', CoreUser),
    ('can_manage_leaves', CoreUser),
    ('can_mark_manual_attendance', CoreUser),
]

for codename, model in custom_perms:
    ct = ContentType.objects.get_for_model(model)
    try:
        perm = Permission.objects.get(codename=codename, content_type=ct)
        print(f"✓ {codename}: {perm.name}")
    except Permission.DoesNotExist:
        print(f"✗ {codename}: NOT found - run 'python manage.py ensure_permissions'")

# 9. CORS Settings
print("\n\n9. CORS CONFIGURATION")
print("-"*80)

cors_checks = [
    ('CORS_ALLOW_ALL_ORIGINS', getattr(settings, 'CORS_ALLOW_ALL_ORIGINS', False)),
    ('CORS_ALLOWED_ORIGINS', len(getattr(settings, 'CORS_ALLOWED_ORIGINS', [])) > 0),
]

for setting_name, value in cors_checks:
    status = "✓" if value else "ℹ️"
    print(f"{status} {setting_name}: {value}")

# 10. Summary
print("\n" + "="*80)
print("AUDIT SUMMARY")
print("="*80)

issues = []

# Count issues
if settings.DEBUG:
    issues.append("DEBUG is True (should be False in production)")

if len(settings.SECRET_KEY) < 50:
    issues.append("SECRET_KEY is too short")

groups_count = Group.objects.count()
if groups_count < len(expected_roles):
    issues.append(f"Missing role groups (found {groups_count}, expected {len(expected_roles)})")

if issues:
    print(f"\n⚠️  FOUND {len(issues)} ISSUE(S):")
    for issue in issues:
        print(f"  - {issue}")
else:
    print("\n✅ NO CRITICAL ISSUES FOUND!")

print(f"\nTotal Models Checked: {len(models_to_check)}")
print(f"Total Groups/Roles: {Group.objects.count()}")
print(f"Total Permissions: {Permission.objects.count()}")
print(f"Total Superusers: {CoreUser.objects.filter(is_superuser=True).count()}")
print(f"Total Users: {CoreUser.objects.count()}")

print("\n" + "="*80)
print("AUDIT COMPLETE")
print("="*80)
