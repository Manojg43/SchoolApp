from django.core.management.base import BaseCommand
from django.contrib.auth.models import Permission
from django.contrib.contenttypes.models import ContentType
from core.models import CoreUser

class Command(BaseCommand):
    help = 'Ensure all required permissions exist in the database'

    def handle(self, *args, **kwargs):
        # 1. Custom Permissions that match CoreUser fields
        # structure: (codename, name, content_type_model)
        custom_perms = [
            ('can_access_finance', 'Can Access Finance Module', CoreUser),
            ('can_access_transport', 'Can Access Transport Module', CoreUser),
            ('can_access_certificates', 'Can Access Certificates Module', CoreUser),
            ('can_access_attendance', 'Can Access Attendance Module', CoreUser),
            ('can_access_student_records', 'Can Access Student Records', CoreUser),
            ('can_manage_payroll', 'Can Manage Payroll', CoreUser),
            ('can_manage_leaves', 'Can Manage Leaves', CoreUser),
            ('can_mark_manual_attendance', 'Can Mark Manual Attendance', CoreUser),
        ]

        for codename, name, model in custom_perms:
            ct = ContentType.objects.get_for_model(model)
            perm, created = Permission.objects.get_or_create(
                codename=codename,
                content_type=ct,
                defaults={'name': name}
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f"Created permission: {codename}"))
            else:
                self.stdout.write(f"Permission exists: {codename}")

        self.stdout.write(self.style.SUCCESS('Permission check complete.'))
