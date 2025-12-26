from django.db import models
from django.utils.translation import gettext_lazy as _
from django.utils import timezone
from schools.models import School, AcademicYear, Class
from core.models import CoreUser
from core.utils import generate_business_id


# ============================================
# CONFIGURABLE WORKFLOW SYSTEM
# ============================================

class WorkflowTemplate(models.Model):
    """Configurable workflow templates for different purposes"""
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='workflow_templates')
    name = models.CharField(_("Template Name"), max_length=100)  # e.g., "Standard Admission"
    
    WORKFLOW_TYPES = [
        ('ADMISSION', 'Admission Enquiry'),
        ('SCHOLARSHIP', 'Scholarship Application'),
        ('TRANSPORT', 'Transport Request'),
        ('HOSTEL', 'Hostel Application'),
        ('CUSTOM', 'Custom Workflow'),
    ]
    workflow_type = models.CharField(max_length=50, choices=WORKFLOW_TYPES, default='ADMISSION')
    description = models.TextField(blank=True)
    
    is_active = models.BooleanField(default=True)
    is_default = models.BooleanField(default=False, help_text="Default template for this workflow type")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = _("Workflow Template")
        verbose_name_plural = _("Workflow Templates")
        unique_together = ('school', 'name')
    
    def __str__(self):
        return f"{self.name} ({self.get_workflow_type_display()})"


class WorkflowStage(models.Model):
    """Configurable stages within a workflow"""
    template = models.ForeignKey(WorkflowTemplate, on_delete=models.CASCADE, related_name='stages')
    name = models.CharField(_("Stage Name"), max_length=100)  # e.g., "Document Verification"
    order = models.PositiveIntegerField(_("Sequence Order"))
    
    # Stage configuration
    is_required = models.BooleanField(default=True)
    requires_documents = models.BooleanField(default=False, help_text="Documents must be uploaded at this stage")
    requires_payment = models.BooleanField(default=False, help_text="Payment required to proceed")
    requires_assessment = models.BooleanField(default=False, help_text="Assessment/test required")
    
    # Notification settings
    auto_notify_parent = models.BooleanField(default=False)
    notification_message = models.TextField(blank=True, help_text="SMS/Email content (use {name}, {stage})")
    
    # Who can approve this stage
    APPROVER_CHOICES = [
        ('ANY', 'Any Staff'),
        ('TEACHER', 'Teacher'),
        ('OFFICE_STAFF', 'Office Staff'),
        ('ACCOUNTANT', 'Accountant'),
        ('PRINCIPAL', 'Principal Only'),
        ('SCHOOL_ADMIN', 'School Admin'),
    ]
    required_approver_role = models.CharField(max_length=50, choices=APPROVER_CHOICES, default='OFFICE_STAFF')
    
    # Auto-actions on completion
    auto_advance = models.BooleanField(default=False, help_text="Auto-advance to next stage on completion")
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['template', 'order']
        unique_together = ('template', 'order')
        verbose_name = _("Workflow Stage")
        verbose_name_plural = _("Workflow Stages")
    
    def __str__(self):
        return f"{self.template.name} - Stage {self.order}: {self.name}"


class AssessmentTemplate(models.Model):
    """Configurable assessments (tests, interviews, checks)"""
    stage = models.ForeignKey(WorkflowStage, on_delete=models.CASCADE, related_name='assessments')
    name = models.CharField(_("Assessment Name"), max_length=100)  # e.g., "English Test"
    
    ASSESSMENT_TYPES = [
        ('WRITTEN', 'Written Test'),
        ('ORAL', 'Oral/Interview'),
        ('PRACTICAL', 'Practical Test'),
        ('DOCUMENT', 'Document Verification'),
        ('PAYMENT', 'Fee Payment'),
        ('APPROVAL', 'Manual Approval'),
    ]
    assessment_type = models.CharField(max_length=50, choices=ASSESSMENT_TYPES, default='APPROVAL')
    
    max_marks = models.PositiveIntegerField(default=100, help_text="Maximum marks (0 for pass/fail only)")
    passing_marks = models.PositiveIntegerField(default=40)
    is_mandatory = models.BooleanField(default=True)
    
    instructions = models.TextField(blank=True, help_text="Instructions for the assessor")
    
    class Meta:
        ordering = ['stage', 'id']
        verbose_name = _("Assessment Template")
        verbose_name_plural = _("Assessment Templates")
    
    def __str__(self):
        return f"{self.name} ({self.get_assessment_type_display()})"


# ============================================
# ENQUIRY RECORDS
# ============================================

class Enquiry(models.Model):
    """Main enquiry record - can be filled from Mobile or Web"""
    id = models.AutoField(primary_key=True)
    enquiry_id = models.CharField(max_length=50, unique=True, editable=False)
    
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='enquiries')
    workflow = models.ForeignKey(WorkflowTemplate, on_delete=models.SET_NULL, null=True, related_name='enquiries')
    
    # ========== STUDENT DETAILS ==========
    first_name = models.CharField(_("First Name"), max_length=100)
    last_name = models.CharField(_("Last Name"), max_length=100)
    date_of_birth = models.DateField(_("Date of Birth"))
    gender = models.CharField(_("Gender"), max_length=1, choices=[('M', 'Male'), ('F', 'Female'), ('O', 'Other')])
    
    # Photo (optional at enquiry stage)
    photo = models.ImageField(upload_to='enquiry_photos/', blank=True, null=True)
    
    # ========== ACADEMIC REQUEST ==========
    class_applied = models.ForeignKey(Class, on_delete=models.SET_NULL, null=True, related_name='enquiries')
    academic_year = models.ForeignKey(AcademicYear, on_delete=models.SET_NULL, null=True)
    
    # ========== PARENT/GUARDIAN DETAILS ==========
    parent_name = models.CharField(_("Parent/Guardian Name"), max_length=200)
    parent_mobile = models.CharField(_("Mobile Number"), max_length=15)
    parent_email = models.EmailField(_("Email"), blank=True)
    parent_occupation = models.CharField(_("Occupation"), max_length=100, blank=True)
    address = models.TextField(_("Address"), blank=True)
    
    # ========== PREVIOUS SCHOOL (for transfers) ==========
    previous_school_name = models.CharField(_("Previous School Name"), max_length=200, blank=True)
    previous_class = models.CharField(_("Previous Class"), max_length=50, blank=True)
    previous_percentage = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    
    # ========== TRACKING - WHO FILLED ==========
    filled_by = models.ForeignKey(
        CoreUser, 
        on_delete=models.SET_NULL, 
        null=True, 
        related_name='enquiries_filled',
        help_text="Teacher/Staff who filled this enquiry"
    )
    filled_at = models.DateTimeField(auto_now_add=True)
    
    SOURCE_CHOICES = [
        ('MOBILE', 'Mobile App'),
        ('WEB', 'Web Dashboard'),
        ('WALK_IN', 'Walk-in/Manual'),
        ('ONLINE', 'Online Form'),
    ]
    filled_via = models.CharField(max_length=20, choices=SOURCE_CHOICES, default='WALK_IN')
    
    # ========== WORKFLOW STATUS ==========
    current_stage = models.ForeignKey(
        WorkflowStage, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='current_enquiries'
    )
    
    STATUS_CHOICES = [
        ('PENDING', 'Pending Verification'),
        ('IN_PROGRESS', 'In Progress'),
        ('ON_HOLD', 'On Hold'),
        ('APPROVED', 'Approved - Ready for Admission'),
        ('REJECTED', 'Rejected'),
        ('CONVERTED', 'Converted to Student'),
        ('WITHDRAWN', 'Withdrawn'),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    
    PRIORITY_CHOICES = [
        ('LOW', 'Low'),
        ('NORMAL', 'Normal'),
        ('HIGH', 'High'),
        ('URGENT', 'Urgent'),
    ]
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='NORMAL')
    
    # ========== CONVERSION TO STUDENT ==========
    converted_student = models.OneToOneField(
        'students.Student', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='source_enquiry'
    )
    converted_at = models.DateTimeField(null=True, blank=True)
    converted_by = models.ForeignKey(
        CoreUser, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='students_admitted'
    )
    
    # ========== NOTES & METADATA ==========
    notes = models.TextField(_("Internal Notes"), blank=True)
    rejection_reason = models.TextField(blank=True)
    
    # Referral tracking
    referred_by = models.CharField(_("Referred By"), max_length=200, blank=True, help_text="Who referred this student")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = _("Enquiry")
        verbose_name_plural = _("Enquiries")
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['school', 'status'], name='enquiry_school_status_idx'),
            models.Index(fields=['filled_by'], name='enquiry_filled_by_idx'),
            models.Index(fields=['class_applied'], name='enquiry_class_idx'),
            models.Index(fields=['created_at'], name='enquiry_created_idx'),
            models.Index(fields=['enquiry_id'], name='enquiry_id_idx'),
        ]
    
    def save(self, *args, **kwargs):
        if not self.enquiry_id:
            self.enquiry_id = generate_business_id('ENQ')
        super().save(*args, **kwargs)
    
    def get_full_name(self):
        return f"{self.first_name} {self.last_name}"
    
    def __str__(self):
        return f"{self.enquiry_id} - {self.get_full_name()} ({self.get_status_display()})"


class EnquiryStageProgress(models.Model):
    """Track progress through each stage with who processed it"""
    enquiry = models.ForeignKey(Enquiry, on_delete=models.CASCADE, related_name='stage_progress')
    stage = models.ForeignKey(WorkflowStage, on_delete=models.CASCADE)
    
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('IN_PROGRESS', 'In Progress'),
        ('COMPLETED', 'Completed'),
        ('SKIPPED', 'Skipped'),
        ('FAILED', 'Failed'),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    
    # Who processed this stage
    started_at = models.DateTimeField(null=True, blank=True)
    processed_by = models.ForeignKey(CoreUser, on_delete=models.SET_NULL, null=True, blank=True)
    processed_at = models.DateTimeField(null=True, blank=True)
    
    remarks = models.TextField(blank=True)
    
    class Meta:
        unique_together = ('enquiry', 'stage')
        ordering = ['stage__order']
        verbose_name = _("Enquiry Stage Progress")
        verbose_name_plural = _("Enquiry Stage Progress")
    
    def __str__(self):
        return f"{self.enquiry.enquiry_id} - {self.stage.name}: {self.get_status_display()}"


class EnquiryAssessmentResult(models.Model):
    """Store assessment/test results"""
    enquiry = models.ForeignKey(Enquiry, on_delete=models.CASCADE, related_name='assessment_results')
    assessment = models.ForeignKey(AssessmentTemplate, on_delete=models.CASCADE)
    
    marks_obtained = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    is_passed = models.BooleanField(default=False)
    
    # Who evaluated
    evaluated_by = models.ForeignKey(CoreUser, on_delete=models.SET_NULL, null=True, blank=True)
    evaluated_at = models.DateTimeField(null=True, blank=True)
    
    remarks = models.TextField(blank=True)
    
    class Meta:
        unique_together = ('enquiry', 'assessment')
        verbose_name = _("Assessment Result")
        verbose_name_plural = _("Assessment Results")
    
    def __str__(self):
        result = "PASS" if self.is_passed else "FAIL"
        return f"{self.enquiry.enquiry_id} - {self.assessment.name}: {result}"


class EnquiryDocument(models.Model):
    """Documents uploaded during enquiry process"""
    enquiry = models.ForeignKey(Enquiry, on_delete=models.CASCADE, related_name='documents')
    
    DOCUMENT_TYPES = [
        ('BIRTH_CERT', 'Birth Certificate'),
        ('PREV_MARKSHEET', 'Previous Marksheet'),
        ('TC', 'Transfer Certificate'),
        ('AADHAR', 'Aadhar Card'),
        ('PHOTO', 'Passport Photo'),
        ('ADDRESS_PROOF', 'Address Proof'),
        ('CASTE_CERT', 'Caste Certificate'),
        ('INCOME_CERT', 'Income Certificate'),
        ('OTHER', 'Other Document'),
    ]
    document_type = models.CharField(max_length=50, choices=DOCUMENT_TYPES)
    document_name = models.CharField(max_length=100, blank=True)  # Optional custom name
    file = models.FileField(upload_to='enquiry_docs/')
    
    # Verification
    is_verified = models.BooleanField(default=False)
    verified_by = models.ForeignKey(CoreUser, on_delete=models.SET_NULL, null=True, blank=True)
    verified_at = models.DateTimeField(null=True, blank=True)
    verification_remarks = models.TextField(blank=True)
    
    uploaded_at = models.DateTimeField(auto_now_add=True)
    uploaded_by = models.ForeignKey(
        CoreUser, 
        on_delete=models.SET_NULL, 
        null=True, 
        related_name='uploaded_enquiry_docs'
    )
    
    class Meta:
        verbose_name = _("Enquiry Document")
        verbose_name_plural = _("Enquiry Documents")
    
    def __str__(self):
        return f"{self.enquiry.enquiry_id} - {self.get_document_type_display()}"
