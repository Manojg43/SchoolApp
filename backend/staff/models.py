from django.db import models
from django.utils.translation import gettext_lazy as _
from core.models import CoreUser
from schools.models import School
from core.utils import generate_business_id

class TeacherProfile(models.Model):
    user = models.OneToOneField(CoreUser, on_delete=models.CASCADE, related_name='teacher_profile')
    qualification = models.CharField(_("Qualification"), max_length=200, blank=True)
    subjects = models.CharField(_("Subjects"), max_length=500, help_text="Comma separated subjects")
    experience_years = models.PositiveIntegerField(_("Experience (Years)"), default=0)
    joining_date = models.DateField(_("Joining Date"), null=True, blank=True)
    
    def __str__(self):
        return f"Profile: {self.user.get_full_name()}"

class StaffProfile(models.Model):
    user = models.OneToOneField(CoreUser, on_delete=models.CASCADE, related_name='staff_profile')
    designation = models.CharField(_("Designation"), max_length=100)
    department = models.CharField(_("Department"), max_length=100, blank=True)
    joining_date = models.DateField(_("Joining Date"), null=True, blank=True)

    def __str__(self):
        return f"{self.designation}: {self.user.get_full_name()}"

class StaffAttendance(models.Model):
    id = models.AutoField(primary_key=True)
    attendance_id = models.CharField(max_length=50, unique=True, editable=False)
    
    school = models.ForeignKey(School, on_delete=models.CASCADE) # Redundant but good for strict isolation query optimization
    staff = models.ForeignKey(CoreUser, on_delete=models.CASCADE, related_name='staff_attendance')
    date = models.DateField(_("Date"))
    
    check_in = models.TimeField(_("Check In"), null=True, blank=True)
    check_out = models.TimeField(_("Check Out"), null=True, blank=True)
    
    gps_lat = models.DecimalField(_("GPS Latitude"), max_digits=9, decimal_places=6, null=True, blank=True)
    gps_long = models.DecimalField(_("GPS Longitude"), max_digits=9, decimal_places=6, null=True, blank=True)
    
    SOURCE_CHOICES = [
        ('WEB_MANUAL', 'Web Manual'),
        ('QR_GEO', 'QR Geo-Fenced'),
        ('MOBILE_GPS', 'Mobile Button (GPS)'),
        ('SYSTEM', 'System Auto')
    ]
    source = models.CharField(_("Source"), max_length=20, choices=SOURCE_CHOICES, default='SYSTEM')
    correction_reason = models.TextField(_("Correction Reason"), blank=True, help_text="Reason if modified manually")
    
    status = models.CharField(_("Status"), max_length=10, choices=[('PRESENT', 'Present'), ('ABSENT', 'Absent'), ('LEAVE', 'Leave'), ('HALF_DAY', 'Half Day')], default='ABSENT')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('staff', 'date')
        verbose_name = _("Staff Attendance")
        verbose_name_plural = _("Staff Attendance")

    def save(self, *args, **kwargs):
        if not self.attendance_id:
            self.attendance_id = generate_business_id('ATT-STF')
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.staff.get_full_name()} - {self.date}"
