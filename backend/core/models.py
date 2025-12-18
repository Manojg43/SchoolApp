from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils.translation import gettext_lazy as _
from schools.models import School
from .utils import generate_business_id

class CoreUser(AbstractUser):
    # Roles
    ROLE_SUPER_ADMIN = 'SUPER_ADMIN'
    ROLE_SCHOOL_ADMIN = 'SCHOOL_ADMIN'
    ROLE_PRINCIPAL = 'PRINCIPAL'
    ROLE_OFFICE_STAFF = 'OFFICE_STAFF'
    ROLE_TEACHER = 'TEACHER'
    ROLE_ACCOUNTANT = 'ACCOUNTANT'
    ROLE_CLEANING_STAFF = 'CLEANING_STAFF'
    ROLE_NON_TEACHING_STAFF = 'NON_TEACHING'
    ROLE_DRIVER = 'DRIVER'
    ROLE_PARENT = 'PARENT'
    ROLE_STUDENT = 'STUDENT'

    ROLE_CHOICES = [
        (ROLE_SUPER_ADMIN, _('Developer / Super Admin')),
        (ROLE_SCHOOL_ADMIN, _('School Admin')),
        (ROLE_PRINCIPAL, _('Principal')),
        (ROLE_OFFICE_STAFF, _('Office Staff')),
        (ROLE_TEACHER, _('Teacher')),
        (ROLE_ACCOUNTANT, _('Accountant')),
        (ROLE_CLEANING_STAFF, _('Cleaning Staff')),
        (ROLE_NON_TEACHING_STAFF, _('Non-Teaching Staff')),
        (ROLE_DRIVER, _('Driver')),
        (ROLE_PARENT, _('Parent')),
        (ROLE_STUDENT, _('Student')),
    ]

    # Fields
    user_id = models.CharField(max_length=50, unique=True, editable=False)
    school = models.ForeignKey(School, on_delete=models.CASCADE, null=True, blank=True, related_name='users')
    role = models.CharField(_("Role"), max_length=50, choices=ROLE_CHOICES, default=ROLE_SCHOOL_ADMIN)
    mobile = models.CharField(_("Mobile Number"), max_length=15, blank=True)
    
    # Module Access Permissions
    can_use_mobile_app = models.BooleanField(default=False, help_text="Can login to Mobile App")
    can_access_finance = models.BooleanField(default=False, help_text="Can access Finance Module")
    can_access_transport = models.BooleanField(default=False, help_text="Can access Transport Module")
    can_access_certificates = models.BooleanField(default=False, help_text="Can access Certificates Module")
    can_access_student_records = models.BooleanField(default=False, help_text="Can access Student Records")
    can_access_attendance = models.BooleanField(default=False, help_text="Can access Attendance Module")
    can_manage_payroll = models.BooleanField(default=False, help_text="Can manage staff salaries and payroll")
    can_manage_leaves = models.BooleanField(default=False, help_text="Can approve or reject leaves")
    can_mark_manual_attendance = models.BooleanField(default=False, help_text="Can mark attendance via GPS Button (No QR) if fail")

    # Required for strict isolation check
    # We override save to generate business ID
    
    class Meta:
        verbose_name = _("User")
        verbose_name_plural = _("Users")

    def save(self, *args, **kwargs):
        if not self.user_id:
            prefix = 'USR'
            if self.role == self.ROLE_TEACHER: prefix = 'TCH'
            elif self.role == self.ROLE_SCHOOL_ADMIN: prefix = 'ADM'
            elif self.role == self.ROLE_PRINCIPAL: prefix = 'PRN'
            
            self.user_id = generate_business_id(prefix)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.username} ({self.role}) - {self.school.name if self.school else 'Global'}"

class AuditLog(models.Model):
    ACTION_CREATE = 'CREATE'
    ACTION_UPDATE = 'UPDATE'
    ACTION_DELETE = 'DELETE'
    
    ACTION_CHOICES = [
        (ACTION_CREATE, 'Create'),
        (ACTION_UPDATE, 'Update'),
        (ACTION_DELETE, 'Delete'),
    ]

    id = models.AutoField(primary_key=True)
    user = models.ForeignKey(CoreUser, on_delete=models.SET_NULL, null=True, blank=True)
    action = models.CharField(max_length=10, choices=ACTION_CHOICES)
    model_name = models.CharField(max_length=100)
    object_id = models.CharField(max_length=50) # Can be int or string ID
    object_repr = models.CharField(max_length=255)
    changes = models.JSONField(null=True, blank=True) # Stores old/new values
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.action} {self.model_name} by {self.user} at {self.timestamp}"


