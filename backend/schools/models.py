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
