from django.db import models
from django.utils.translation import gettext_lazy as _
from schools.models import School, AcademicYear
from students.models import Student
from core.models import CoreUser
from core.utils import generate_business_id
import random
import string

# Expanded certificate types
CERTIFICATE_TYPES = [
    ('BONAFIDE', 'Bonafide Certificate'),
    ('TC', 'Transfer Certificate'),
    ('LC', 'Leaving Certificate'),
    ('MIGRATION', 'Migration Certificate'),
    ('CHARACTER', 'Character Certificate'),
    ('CONDUCT', 'Conduct Certificate'),
    ('STUDY', 'Study Certificate'),
    ('ATTENDANCE', 'Attendance Certificate'),
    ('SPORTS', 'Sports Participation'),
    ('ACHIEVEMENT', 'Achievement Certificate'),
    ('FEE_CLEARANCE', 'Fee Clearance Certificate'),
    ('COURSE_COMPLETION', 'Course Completion'),
    ('CUSTOM', 'Custom Certificate')
]

class CertificateTemplate(models.Model):
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='certificate_templates')
    name = models.CharField(_("Template Name"), max_length=100)
    type = models.CharField(max_length=50, choices=CERTIFICATE_TYPES)
    
    # Template content
    html_content = models.TextField(
        _("HTML Template"), 
        help_text="Use placeholders like {{student_name}}, {{class_name}}, {{enrollment_number}}, etc."
    )
    
    # Customization options
    include_logo = models.BooleanField(_("Include School Logo"), default=True)
    include_signature = models.BooleanField(_("Include Principal Signature"), default=True)
    include_seal = models.BooleanField(_("Include School Seal"), default=True)
    include_qr_code = models.BooleanField(_("Include QR Verification Code"), default=True)
    
    # Styling
    header_color = models.CharField(_("Header Color"), max_length=7, default='#000000', help_text="Hex color code")
    font_family = models.CharField(_("Font Family"), max_length=50, default='Times New Roman')
    
    # Status
    is_active = models.BooleanField(_("Is Active"), default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = _("Certificate Template")
        verbose_name_plural = _("Certificate Templates")
        unique_together = ('school', 'type', 'name')
        ordering = ['school', 'type', 'name']
    
    def __str__(self):
        return f"{self.name} ({self.get_type_display()}) - {self.school.name}"

class Certificate(models.Model):
    id = models.AutoField(primary_key=True)
    certificate_no = models.CharField(max_length=50, unique=True, editable=False)
    
    # Relationships
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='certificates')
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='certificates')
    template = models.ForeignKey(CertificateTemplate, on_delete=models.SET_NULL, null=True, blank=True)
    
    # Certificate details
    type = models.CharField(_("Certificate Type"), max_length=50, choices=CERTIFICATE_TYPES)
    purpose = models.TextField(_("Purpose"), blank=True, help_text="Why this certificate was requested")
    
    # Metadata
    issued_date = models.DateField(_("Issued Date"), auto_now_add=True)
    issued_by = models.ForeignKey(CoreUser, on_delete=models.SET_NULL, null=True, related_name='issued_certificates')
    valid_until = models.DateField(_("Valid Until"), null=True, blank=True, help_text="Optional expiry date")
    
    # Data snapshot - stores student/school data at time of issue
    certificate_data = models.JSONField(
        _("Certificate Data"),
        default=dict,
        help_text="Snapshot of student and school data at time of certificate issuance"
    )
    
    # Verification system
    verification_code = models.CharField(
        _("Verification Code"),
        max_length=20,
        unique=True,
        editable=False,
        help_text="Unique code for certificate verification"
    )
    qr_code_image = models.ImageField(
        _("QR Code"),
        upload_to='certificates/qr/',
        blank=True,
        null=True,
        help_text="QR code image for verification"
    )
    
    # PDF storage
    pdf_file = models.FileField(
        _("PDF File"),
        upload_to='certificates/pdfs/',
        blank=True,
        null=True,
        help_text="Generated PDF certificate"
    )
    
    # Status
    is_revoked = models.BooleanField(_("Is Revoked"), default=False)
    revoked_reason = models.TextField(_("Revocation Reason"), blank=True)
    revoked_date = models.DateTimeField(_("Revoked Date"), null=True, blank=True)
    revoked_by = models.ForeignKey(
        CoreUser, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='revoked_certificates'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = _("Certificate")
        verbose_name_plural = _("Certificates")
        ordering = ['-issued_date', '-created_at']
        indexes = [
            models.Index(fields=['school', '-issued_date'], name='cert_school_date_idx'),
            models.Index(fields=['student', '-issued_date'], name='cert_student_date_idx'),
            models.Index(fields=['verification_code'], name='cert_verification_idx'),
            models.Index(fields=['certificate_no'], name='cert_number_idx'),
            models.Index(fields=['type'], name='cert_type_idx'),
            models.Index(fields=['is_revoked'], name='cert_revoked_idx'),
        ]
    
    def save(self, *args, **kwargs):
        # Generate certificate number if not exists
        if not self.certificate_no:
            self.certificate_no = generate_business_id('CERT')
        
        # Generate verification code if not exists
        if not self.verification_code:
            self.verification_code = self.generate_verification_code()
        
        super().save(*args, **kwargs)
    
    def generate_verification_code(self):
        """Generate unique verification code (format: SCH###-STU####-RND###)"""
        school_part = f"{self.school.id:03d}"
        student_part = f"{self.student.id:04d}"
        random_part = ''.join(random.choices(string.digits, k=3))
        return f"SCH{school_part}-STU{student_part}-{random_part}"
    
    def revoke(self, reason, user):
        """Revoke this certificate"""
        from django.utils import timezone
        self.is_revoked = True
        self.revoked_reason = reason
        self.revoked_date = timezone.now()
        self.revoked_by = user
        self.save()
    
    def __str__(self):
        return f"{self.get_type_display()} - {self.certificate_no} ({self.student.get_full_name()})"
