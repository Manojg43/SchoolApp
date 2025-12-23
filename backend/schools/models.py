from django.db import models
from django.utils.translation import gettext_lazy as _
from core.utils import generate_business_id

class School(models.Model):
    # Django PK (Immutable, internal)
    id = models.AutoField(primary_key=True)
    
    # Business ID (Public, immutable)
    school_id = models.CharField(max_length=50, unique=True, editable=False)
    
    name = models.CharField(_("School Name"), max_length=255)
    address = models.TextField(_("Address"), blank=True)
    domain = models.CharField(_("Domain"), max_length=255, blank=True, null=True, help_text=_("Custom domain or subdomain"))
    
    language = models.CharField(_("Default Language"), max_length=10, default='en', choices=[('en', 'English'), ('hi', 'Hindi'), ('mr', 'Marathi')])
    
    # Geo-Fencing (Center Point)
    gps_lat = models.DecimalField(_("Geo Latitude"), max_digits=9, decimal_places=6, null=True, blank=True)
    gps_long = models.DecimalField(_("Geo Longitude"), max_digits=9, decimal_places=6, null=True, blank=True)
    
    # Supabase Storage / Base64 DB Storage
    # Changed to TextField to allow storing Base64 strings directly in DB as per user request
    logo_url = models.TextField(_("Logo Data"), blank=True, null=True) 
    signature_url = models.TextField(_("Principal Signature Data"), blank=True, null=True)
    watermark_url = models.TextField(_("Report Watermark Data"), blank=True, null=True)

    # Attendance Configuration
    min_hours_half_day = models.FloatField(_("Min Hours for Half Day"), default=4.0)
    min_hours_full_day = models.FloatField(_("Min Hours for Full Day"), default=6.0)
    
    # Payroll Configuration
    salary_calculation_day = models.PositiveIntegerField(_("Salary Calculation Day"), default=30, help_text="Day of month to generate salary (e.g. 30)")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.school_id:
            self.school_id = generate_business_id('SCH')
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} ({self.school_id})"

class AcademicYear(models.Model):
    id = models.AutoField(primary_key=True)
    academic_year_id = models.CharField(max_length=50, unique=True, editable=False)
    
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='academic_years')
    name = models.CharField(_("Year Name"), max_length=20, help_text="e.g. 2024-25")
    start_date = models.DateField(_("Start Date"))
    end_date = models.DateField(_("End Date"))
    is_active = models.BooleanField(_("Is Active"), default=False)

    class Meta:
        unique_together = ('school', 'name')

    def save(self, *args, **kwargs):
        if not self.academic_year_id:
            self.academic_year_id = generate_business_id('AY')
        if self.is_active:
            AcademicYear.objects.filter(school=self.school, is_active=True).exclude(id=self.id).update(is_active=False)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} ({self.school.school_id})"

class Class(models.Model):
    id = models.AutoField(primary_key=True)
    # No specific class_id requested in prompt, usually purely distinct by name+school, but good practice to have one? 
    # Prompt says "Student class data must be saved year-wise". The Class model itself is metadata.
    
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='classes')
    name = models.CharField(_("Class Name"), max_length=50, help_text="e.g. Class 10")
    order = models.PositiveIntegerField(default=0, help_text="For sorting, e.g. 10")

    class Meta:
        verbose_name_plural = "Classes"
        ordering = ['order']

    def __str__(self):
        return f"{self.name}"

class Section(models.Model):
    id = models.AutoField(primary_key=True)
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='sections') # Direct strict isolation
    parent_class = models.ForeignKey(Class, on_delete=models.CASCADE, related_name='sections')
    name = models.CharField(_("Section Name"), max_length=50, help_text="e.g. A")
    
    class Meta:
        unique_together = ('parent_class', 'name')

    def __str__(self):
        return f"{self.parent_class.name} - {self.name}"

class Achievement(models.Model):
    id = models.AutoField(primary_key=True)
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='achievements')
    title = models.CharField(_("Title"), max_length=200)
    description = models.TextField(_("Description"))
    image_url = models.URLField(_("Image URL"), max_length=500) # Changed from ImageField
    date = models.DateField(_("Date"), auto_now_add=True)
    
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title}"

class ClassSchedule(models.Model):
    DAYS_OF_WEEK = [
        ('MONDAY', 'Monday'),
        ('TUESDAY', 'Tuesday'),
        ('WEDNESDAY', 'Wednesday'),
        ('THURSDAY', 'Thursday'),
        ('FRIDAY', 'Friday'),
        ('SATURDAY', 'Saturday'),
        ('SUNDAY', 'Sunday'),
    ]

    school = models.ForeignKey(School, on_delete=models.CASCADE)
    class_assigned = models.ForeignKey(Class, on_delete=models.CASCADE, related_name='schedules')
    section = models.CharField(max_length=10, blank=True) # Optional section
    
    day_of_week = models.CharField(max_length=10, choices=DAYS_OF_WEEK)
    start_time = models.TimeField()
    end_time = models.TimeField()
    
    subject = models.CharField(max_length=100)
    teacher = models.ForeignKey('core.CoreUser', on_delete=models.CASCADE, related_name='class_schedules', limit_choices_to={'role__in': ['TEACHER', 'PRINCIPAL']})
    
    class Meta:
        ordering = ['day_of_week', 'start_time']
        verbose_name = "Class Schedule"
        verbose_name_plural = "Class Schedules"

    def __str__(self):
        return f"{self.day_of_week} {self.start_time} - {self.subject} ({self.teacher.first_name})"

class Notice(models.Model):
    ROLE_CHOICES = [
        ('ALL', 'All Staff'),
        ('TEACHER', 'Teachers Only'),
        ('DRIVER', 'Drivers Only'),
    ]
    
    school = models.ForeignKey(School, on_delete=models.CASCADE)
    title = models.CharField(max_length=200)
    content = models.TextField()
    date = models.DateField(auto_now_add=True)
    target_role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='ALL')
    is_active = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['-date']
        indexes = [
            models.Index(fields=['school', 'date'], name='notice_school_date_idx'),
            models.Index(fields=['is_active'], name='notice_is_active_idx'),
            models.Index(fields=['target_role'], name='notice_target_role_idx'),
            models.Index(fields=['date'], name='notice_date_idx'),
        ]

    def __str__(self):
        return self.title

class Homework(models.Model):
    school = models.ForeignKey(School, on_delete=models.CASCADE)
    class_assigned = models.ForeignKey(Class, on_delete=models.CASCADE)
    section = models.CharField(max_length=10, blank=True)
    subject = models.CharField(max_length=100)
    teacher = models.ForeignKey('core.CoreUser', on_delete=models.CASCADE)
    title = models.CharField(max_length=200)
    description = models.TextField()
    due_date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['school', 'created_at'], name='homework_school_created_idx'),
            models.Index(fields=['class_assigned'], name='homework_class_idx'),
            models.Index(fields=['due_date'], name='homework_due_date_idx'),
            models.Index(fields=['created_at'], name='homework_created_at_idx'),
        ]

    def __str__(self):
        return f"{self.subject} - {self.class_assigned.name}"
