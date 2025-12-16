from django.db import models
from django.utils.translation import gettext_lazy as _
from schools.models import School, AcademicYear
from students.models import Student
from core.models import CoreUser
from core.utils import generate_business_id

class CertificateTemplate(models.Model):
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='certificate_templates')
    name = models.CharField(_("Template Name"), max_length=100) # e.g. "Standard Bonafide 2024"
    type = models.CharField(max_length=50, choices=[('BONAFIDE', 'Bonafide'), ('TC', 'Transfer Certificate'), ('CHARACTER', 'Character'), ('OTHER', 'Custom')])
    html_content = models.TextField(_("HTML Template"), help_text="Use placeholders {{student_name}}, {{class}}, etc.")
    
    def __str__(self):
        return f"{self.name} ({self.school.name})"

class Certificate(models.Model):
    id = models.AutoField(primary_key=True)
    certificate_no = models.CharField(max_length=50, unique=True, editable=False)
    
    school = models.ForeignKey(School, on_delete=models.CASCADE)
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='certificates')
    template = models.ForeignKey(CertificateTemplate, on_delete=models.SET_NULL, null=True)
    type = models.CharField(max_length=50) # Denormalized type for filtering
    
    issued_date = models.DateField(_("Issued Date"), auto_now_add=True)
    issued_by = models.ForeignKey(CoreUser, on_delete=models.SET_NULL, null=True)
    
    # Store snapshot of data if needed, or just regeneration metadata
    
    def save(self, *args, **kwargs):
        if not self.certificate_no:
            self.certificate_no = generate_business_id('CERT')
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.type} - {self.certificate_no}"
