from django.db import models
from django.utils.translation import gettext_lazy as _
from schools.models import School, AcademicYear, Class, Section
from core.utils import generate_business_id

class Student(models.Model):
    id = models.AutoField(primary_key=True)
    student_id = models.CharField(max_length=50, unique=True, editable=False)
    
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='students')
    
    # Academic Details (Current)
    academic_year = models.ForeignKey(AcademicYear, on_delete=models.SET_NULL, null=True, related_name='students')
    current_class = models.ForeignKey(Class, on_delete=models.SET_NULL, null=True, related_name='students')
    section = models.ForeignKey(Section, on_delete=models.SET_NULL, null=True, related_name='students')
    enrollment_number = models.CharField(_("Enrollment Number"), max_length=50)
    
    # Personal Details
    first_name = models.CharField(_("First Name"), max_length=100)
    last_name = models.CharField(_("Last Name"), max_length=100)
    date_of_birth = models.DateField(_("Date of Birth"))
    gender = models.CharField(_("Gender"), max_length=1, choices=[('M', 'Male'), ('F', 'Female'), ('O', 'Other')])
    
    # Parent / Contact Details
    father_name = models.CharField(_("Father's Name"), max_length=100, blank=True)
    mother_name = models.CharField(_("Mother's Name"), max_length=100, blank=True)
    emergency_mobile = models.CharField(_("Emergency Mobile"), max_length=15, blank=True)
    address = models.TextField(_("Address"), blank=True)
    
    # PHASE 4A: Document Management
    birth_certificate = models.FileField(
        _("Birth Certificate"),
        upload_to='students/docs/birth_cert/',
        blank=True,
        null=True,
        help_text="Upload birth certificate document (PDF/Image)"
    )
    transfer_certificate = models.FileField(
        _("Transfer Certificate"),
        upload_to='students/docs/tc/',
        blank=True,
        null=True,
        help_text="Transfer certificate from previous school"
    )
    aadhar_card = models.FileField(
        _("Aadhar Card"),
        upload_to='students/docs/aadhar/',
        blank=True,
        null=True,
        help_text="Aadhar card document"
    )
    photo = models.ImageField(
        _("Student Photo"),
        upload_to='students/photos/',
        blank=True,
        null=True,
        help_text="Student photograph for ID card"
    )
    
    # PHASE 4A: Medical Records
    BLOOD_GROUP_CHOICES = [
        ('A+', 'A Positive'),
        ('A-', 'A Negative'),
        ('B+', 'B Positive'),
        ('B-', 'B Negative'),
        ('O+', 'O Positive'),
        ('O-', 'O Negative'),
        ('AB+', 'AB Positive'),
        ('AB-', 'AB Negative'),
    ]
    
    blood_group = models.CharField(
        _("Blood Group"),
        max_length=5,
        choices=BLOOD_GROUP_CHOICES,
        blank=True,
        help_text="Student's blood group"
    )
    medical_conditions = models.TextField(
        _("Medical Conditions"),
        blank=True,
        help_text="Any existing medical conditions (e.g., diabetes, asthma, epilepsy)"
    )
    allergies = models.TextField(
        _("Allergies"),
        blank=True,
        help_text="Food or medicine allergies"
    )
    current_medications = models.TextField(
        _("Current Medications"),
        blank=True,
        help_text="Medications currently being taken regularly"
    )
    
    # Status
    language = models.CharField(_("Preferred Language"), max_length=10, default='en')
    is_active = models.BooleanField(_("Is Active"), default=True)
    is_alumni = models.BooleanField(_("Is Alumni"), default=False)
    alumni_year = models.DateField(_("Alumni Year"), null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('school', 'enrollment_number')
        verbose_name = _("Student")
        verbose_name_plural = _("Students")
        indexes = [
            models.Index(fields=['school', 'is_active'], name='student_school_active_idx'),
            models.Index(fields=['current_class', 'section'], name='student_class_section_idx'),
            models.Index(fields=['enrollment_number'], name='student_enrollment_idx'),
            models.Index(fields=['created_at'], name='student_created_at_idx'),
            models.Index(fields=['academic_year'], name='student_academic_year_idx'),
        ]

    def save(self, *args, **kwargs):
        if not self.student_id:
            self.student_id = generate_business_id('STU')
        super().save(*args, **kwargs)
    
    def get_full_name(self):
        """Return student's full name"""
        return f"{self.first_name} {self.last_name}"

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.student_id})"

class StudentHistory(models.Model):
    """
    Enhanced academic history for students.
    Records yearly performance including marks, grades, rank, and promotion status.
    """
    
    PROMOTION_STATUS_CHOICES = [
        ('PROMOTED', 'Promoted'),
        ('DETAINED', 'Detained'),
        ('GRADUATED', 'Graduated'),
        ('TRANSFERRED', 'Transferred'),
        ('WITHDRAWN', 'Withdrawn'),
    ]
    
    GRADE_CHOICES = [
        ('A+', 'A+ (Outstanding)'),
        ('A', 'A (Excellent)'),
        ('B+', 'B+ (Very Good)'),
        ('B', 'B (Good)'),
        ('C+', 'C+ (Above Average)'),
        ('C', 'C (Average)'),
        ('D', 'D (Below Average)'),
        ('E', 'E (Marginal)'),
        ('F', 'F (Fail)'),
    ]
    
    CONDUCT_CHOICES = [
        ('EXCELLENT', 'Excellent'),
        ('GOOD', 'Good'),
        ('SATISFACTORY', 'Satisfactory'),
        ('NEEDS_IMPROVEMENT', 'Needs Improvement'),
        ('UNSATISFACTORY', 'Unsatisfactory'),
    ]
    
    # Core Fields
    school = models.ForeignKey(School, on_delete=models.CASCADE)
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='history')
    academic_year = models.ForeignKey(AcademicYear, on_delete=models.CASCADE)
    class_enrolled = models.ForeignKey(Class, on_delete=models.CASCADE)
    section_enrolled = models.ForeignKey(Section, on_delete=models.CASCADE, null=True)
    
    # Academic Performance
    total_marks = models.DecimalField(
        _("Total Marks Obtained"),
        max_digits=7, decimal_places=2,
        null=True, blank=True,
        help_text="Total marks obtained in all subjects"
    )
    max_marks = models.DecimalField(
        _("Maximum Marks"),
        max_digits=7, decimal_places=2,
        null=True, blank=True,
        help_text="Maximum possible marks"
    )
    percentage = models.DecimalField(
        _("Percentage"),
        max_digits=5, decimal_places=2,
        null=True, blank=True,
        help_text="Overall percentage obtained"
    )
    grade = models.CharField(
        _("Grade"),
        max_length=5,
        choices=GRADE_CHOICES,
        blank=True,
        help_text="Overall grade for the year"
    )
    class_rank = models.PositiveIntegerField(
        _("Class Rank"),
        null=True, blank=True,
        help_text="Rank in class"
    )
    section_rank = models.PositiveIntegerField(
        _("Section Rank"),
        null=True, blank=True,
        help_text="Rank in section"
    )
    
    # Attendance Summary (for year-end record)
    total_working_days = models.PositiveIntegerField(
        _("Total Working Days"),
        null=True, blank=True
    )
    days_present = models.PositiveIntegerField(
        _("Days Present"),
        null=True, blank=True
    )
    attendance_percentage = models.DecimalField(
        _("Attendance %"),
        max_digits=5, decimal_places=2,
        null=True, blank=True
    )
    
    # Promotion Status
    promotion_status = models.CharField(
        _("Promotion Status"),
        max_length=20,
        choices=PROMOTION_STATUS_CHOICES,
        default='PROMOTED'
    )
    promoted_to_class = models.ForeignKey(
        Class,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='promoted_histories',
        help_text="Class promoted to (null if detained/graduated)"
    )
    
    # Conduct & Behavior
    conduct = models.CharField(
        _("Conduct"),
        max_length=20,
        choices=CONDUCT_CHOICES,
        default='GOOD'
    )
    
    # Legacy result field (kept for backward compatibility)
    result = models.CharField(max_length=50, blank=True)
    
    # Additional Notes
    remarks = models.TextField(
        _("Remarks"),
        blank=True,
        help_text="Teacher/Principal remarks"
    )
    detention_reason = models.TextField(
        _("Detention Reason"),
        blank=True,
        help_text="Reason if student was detained"
    )
    
    # Audit Fields
    recorded_by = models.ForeignKey(
        'core.CoreUser',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='recorded_histories'
    )
    recorded_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = _("Student History")
        verbose_name_plural = _("Student Histories")
        unique_together = ('student', 'academic_year')
        ordering = ['-academic_year__start_date']
        indexes = [
            models.Index(fields=['school', 'academic_year'], name='shistory_school_year_idx'),
            models.Index(fields=['student', 'academic_year'], name='shistory_student_year_idx'),
            models.Index(fields=['promotion_status'], name='shistory_promotion_idx'),
        ]
    
    def calculate_percentage(self):
        """Calculate percentage from marks"""
        if self.total_marks and self.max_marks and self.max_marks > 0:
            self.percentage = (self.total_marks / self.max_marks) * 100
            self.assign_grade()
            return self.percentage
        return None
    
    def assign_grade(self):
        """Auto-assign grade based on percentage"""
        if self.percentage is None:
            return
        if self.percentage >= 90:
            self.grade = 'A+'
        elif self.percentage >= 80:
            self.grade = 'A'
        elif self.percentage >= 70:
            self.grade = 'B+'
        elif self.percentage >= 60:
            self.grade = 'B'
        elif self.percentage >= 50:
            self.grade = 'C+'
        elif self.percentage >= 40:
            self.grade = 'C'
        elif self.percentage >= 33:
            self.grade = 'D'
        elif self.percentage >= 25:
            self.grade = 'E'
        else:
            self.grade = 'F'
    
    def save(self, *args, **kwargs):
        # Auto-calculate percentage if marks provided
        if self.total_marks and self.max_marks and not self.percentage:
            self.calculate_percentage()
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.student} - {self.academic_year} ({self.promotion_status})"



class Attendance(models.Model):
    id = models.AutoField(primary_key=True)
    attendance_id = models.CharField(max_length=50, unique=True, editable=False)
    
    school = models.ForeignKey(School, on_delete=models.CASCADE) # Direct isolation
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='attendance')
    date = models.DateField(_("Date"))
    status = models.CharField(_("Status"), max_length=1, choices=[('P', 'Present'), ('A', 'Absent'), ('L', 'Late')])
    remarks = models.CharField(_("Remarks"), max_length=255, blank=True)

    class Meta:
        unique_together = ('student', 'date')
        indexes = [
            models.Index(fields=['school', 'date'], name='attendance_school_date_idx'),
            models.Index(fields=['student', 'date'], name='attendance_student_date_idx'),
            models.Index(fields=['status'], name='attendance_status_idx'),
            models.Index(fields=['date'], name='attendance_date_idx'),
        ]

    def save(self, *args, **kwargs):
        if not self.attendance_id:
            self.attendance_id = generate_business_id('ATT')
        super().save(*args, **kwargs)

class Fee(models.Model):
    id = models.AutoField(primary_key=True)
    invoice_id = models.CharField(max_length=50, unique=True, editable=False)
    
    school = models.ForeignKey(School, on_delete=models.CASCADE) # Direct isolation
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='fees')
    title = models.CharField(_("Title"), max_length=200)
    amount = models.DecimalField(_("Amount"), max_digits=10, decimal_places=2)
    due_date = models.DateField(_("Due Date"))
    status = models.CharField(_("Status"), max_length=10, choices=[('PAID', 'Paid'), ('PENDING', 'Pending'), ('OVERDUE', 'Overdue')], default='PENDING')
    paid_date = models.DateField(_("Paid Date"), blank=True, null=True)

    class Meta:
        verbose_name = _("Fee Invoice")
        verbose_name_plural = _("Fee Invoices")
    
    def save(self, *args, **kwargs):
        if not self.invoice_id:
            self.invoice_id = generate_business_id('INV')
        super().save(*args, **kwargs)
