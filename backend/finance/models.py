from django.db import models
from django.utils.translation import gettext_lazy as _
from schools.models import School, AcademicYear, Class
from students.models import Student
from core.models import CoreUser
from core.utils import generate_business_id

class FeeCategory(models.Model):
    name = models.CharField(_("Category Name"), max_length=100) # e.g. Tuition, Transport
    school = models.ForeignKey(School, on_delete=models.CASCADE)
    description = models.TextField(blank=True)

    def __str__(self):
        return self.name

class FeeStructure(models.Model):
    school = models.ForeignKey(School, on_delete=models.CASCADE)
    academic_year = models.ForeignKey(AcademicYear, on_delete=models.CASCADE)
    class_assigned = models.ForeignKey(Class, on_delete=models.CASCADE)
    category = models.ForeignKey(FeeCategory, on_delete=models.CASCADE)
    amount = models.DecimalField(_("Amount"), max_digits=10, decimal_places=2)
    
    class Meta:
        unique_together = ('academic_year', 'class_assigned', 'category')
        indexes = [
            models.Index(fields=['school', 'academic_year'], name='feestructure_school_year_idx'),
            models.Index(fields=['class_assigned'], name='feestructure_class_idx'),
            models.Index(fields=['category'], name='feestructure_category_idx'),
        ]

    def __str__(self):
        return f"{self.class_assigned} - {self.category}: {self.amount}"

class Invoice(models.Model):
    id = models.AutoField(primary_key=True)
    invoice_id = models.CharField(max_length=50, unique=True, editable=False)
    
    school = models.ForeignKey(School, on_delete=models.CASCADE)
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='invoices')
    
    # Can be linked to a structure or ad-hoc
    fee_structure = models.ForeignKey(FeeStructure, on_delete=models.SET_NULL, null=True, blank=True)
    title = models.CharField(_("Title"), max_length=200) # e.g. "Term 1 Tuition"
    total_amount = models.DecimalField(_("Total Amount"), max_digits=10, decimal_places=2)
    paid_amount = models.DecimalField(_("Paid Amount"), max_digits=10, decimal_places=2, default=0)
    due_date = models.DateField(_("Due Date"))
    
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('PARTIAL', 'Partially Paid'),
        ('PAID', 'Paid'),
        ('OVERDUE', 'Overdue'),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    
    # Fee Settlement Enhancement - Phase 1
    academic_year = models.ForeignKey(
        AcademicYear, 
        on_delete=models.CASCADE,
        null=True,  # Nullable for backward compatibility
        blank=True,
        help_text="Academic year for this invoice"
    )
    
    FEE_TERM_CHOICES = [
        ('TERM1', 'Term 1'),
        ('TERM2', 'Term 2'),
        ('TERM3', 'Term 3'),
        ('ANNUAL', 'Annual'),
        ('MONTHLY', 'Monthly'),
        ('ONETIME', 'One-Time'),
    ]
    fee_term = models.CharField(
        max_length=20,
        choices=FEE_TERM_CHOICES,
        default='ANNUAL',
        help_text="Payment term for this invoice"
    )
    
    # Settlement tracking
    is_settled = models.BooleanField(
        default=False,
        help_text="Whether this invoice has been settled for the year"
    )
    settled_date = models.DateField(
        null=True,
        blank=True,
        help_text="Date when invoice was settled"
    )
    settlement_note = models.TextField(
        blank=True,
        help_text="Notes about settlement"
    )
    
    # Late fee management
    late_fee = models.DecimalField(
        _("Late Fee"),
        max_digits=10,
        decimal_places=2,
        default=0,
        help_text="Late payment fee charged"
    )
    late_fee_applied_date = models.DateField(
        null=True,
        blank=True,
        help_text="Date when late fee was applied"
    )
    
    # Discount tracking
    discount_amount = models.DecimalField(
        _("Discount Amount"),
        max_digits=10,
        decimal_places=2,
        default=0,
        help_text="Discount applied to this invoice"
    )
    discount_reason = models.CharField(
        max_length=200,
        blank=True,
        help_text="Reason for discount (e.g., Scholarship, Sibling Discount)"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.invoice_id:
            self.invoice_id = generate_business_id('INV')
        
        # Auto update status
        if self.paid_amount >= self.total_amount:
            self.status = 'PAID'
        elif self.paid_amount > 0:
            self.status = 'PARTIAL'
            
        super().save(*args, **kwargs)
    
    @property
    def balance_due(self):
        """Calculate remaining balance"""
        return self.total_amount - self.paid_amount
    
    @property
    def is_overdue(self):
        """Check if invoice is overdue"""
        from datetime import date
        return self.due_date < date.today() and self.status != 'PAID'
    
    class Meta:
        indexes = [
            models.Index(fields=['school', 'status'], name='invoice_school_status_idx'),
            models.Index(fields=['student', 'created_at'], name='invoice_student_created_idx'),
            models.Index(fields=['due_date'], name='invoice_due_date_idx'),
            models.Index(fields=['invoice_id'], name='invoice_id_idx'),
            models.Index(fields=['status'], name='invoice_status_idx'),
            # New indexes for settlement
            models.Index(fields=['academic_year', 'is_settled'], name='invoice_year_settled_idx'),
            models.Index(fields=['fee_term'], name='invoice_term_idx'),
        ]

    def __str__(self):
        return f"{self.invoice_id} - {self.student.first_name}"

class Receipt(models.Model):
    id = models.AutoField(primary_key=True)
    receipt_no = models.CharField(max_length=50, unique=True, editable=False)
    
    school = models.ForeignKey(School, on_delete=models.CASCADE)
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='receipts')
    amount = models.DecimalField(_("Amount Paid"), max_digits=10, decimal_places=2)
    date = models.DateField(_("Payment Date"), auto_now_add=True)
    mode = models.CharField(_("Payment Mode"), max_length=50, choices=[('CASH', 'Cash'), ('ONLINE', 'Online'), ('CHEQUE', 'Cheque')])
    transaction_id = models.CharField(max_length=100, blank=True)
    
    created_by = models.ForeignKey(CoreUser, on_delete=models.SET_NULL, null=True) # Accountant

    def save(self, *args, **kwargs):
        if not self.receipt_no:
            self.receipt_no = generate_business_id('RCP')
        super().save(*args, **kwargs)
        
        # Update Invoice
        self.invoice.paid_amount += self.amount
        self.invoice.save()

class Holiday(models.Model):
    school = models.ForeignKey(School, on_delete=models.CASCADE)
    name = models.CharField(_("Holiday Name"), max_length=100)
    date = models.DateField()
    is_paid = models.BooleanField(default=True) # Usually holidays are paid

    class Meta:
        unique_together = ('school', 'date')

class Leave(models.Model):
    school = models.ForeignKey(School, on_delete=models.CASCADE)
    staff = models.ForeignKey(CoreUser, on_delete=models.CASCADE)
    start_date = models.DateField()
    end_date = models.DateField()
    reason = models.TextField()
    is_paid = models.BooleanField(default=False) # LWP (Leave Without Pay) by default unless approved as Paid
    
    STATUS_CHOICES = [('PENDING', 'Pending'), ('APPROVED', 'Approved'), ('REJECTED', 'Rejected')]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')

class StaffSalaryStructure(models.Model):
    school = models.ForeignKey(School, on_delete=models.CASCADE)
    staff = models.OneToOneField(CoreUser, on_delete=models.CASCADE, related_name='salary_structure')
    base_salary = models.DecimalField(_("Monthly Base Salary"), max_digits=10, decimal_places=2, default=0)
    # Placeholder for future complexity (HRA, DA, etc.)
    
    def __str__(self):
        return f"Structure: {self.staff.get_full_name()} - {self.base_salary}"

class Salary(models.Model):
    id = models.AutoField(primary_key=True)
    salary_id = models.CharField(max_length=50, unique=True, editable=False)
    
    school = models.ForeignKey(School, on_delete=models.CASCADE)
    staff = models.ForeignKey(CoreUser, on_delete=models.CASCADE, related_name='salaries')
    
    month = models.DateField(_("Salary Month")) # Store as 1st of month
    
    # Calculation Metrics
    total_working_days = models.IntegerField(default=30)
    present_days = models.DecimalField(max_digits=4, decimal_places=1, default=0)
    paid_leaves = models.DecimalField(max_digits=4, decimal_places=1, default=0)
    
    amount = models.DecimalField(_("Base Salary"), max_digits=10, decimal_places=2)
    deductions = models.DecimalField(_("Deductions"), max_digits=10, decimal_places=2, default=0)
    bonus = models.DecimalField(_("Bonus"), max_digits=10, decimal_places=2, default=0)
    net_salary = models.DecimalField(_("Net Salary"), max_digits=10, decimal_places=2)
    
    is_paid = models.BooleanField(default=False)
    paid_date = models.DateField(null=True, blank=True)

    def save(self, *args, **kwargs):
        if not self.salary_id:
            self.salary_id = generate_business_id('SAL')
        self.net_salary = self.amount + self.bonus - self.deductions
        super().save(*args, **kwargs)
    
    class Meta:
        indexes = [
            models.Index(fields=['school', 'month'], name='salary_school_month_idx'),
            models.Index(fields=['staff', 'month'], name='salary_staff_month_idx'),
            models.Index(fields=['is_paid'], name='salary_is_paid_idx'),
            models.Index(fields=['salary_id'], name='salary_id_idx'),
        ]


# Fee Settlement Enhancement - New Models (Phase 1)

class FeeInstallment(models.Model):
    """Track installment-based payments for invoices"""
    id = models.AutoField(primary_key=True)
    installment_id = models.CharField(max_length=50, unique=True, editable=False)
    
    school = models.ForeignKey(School, on_delete=models.CASCADE)
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='installments')
    
    installment_number = models.IntegerField(help_text="1, 2, 3, etc.")
    amount = models.DecimalField(
        _("Installment Amount"),
        max_digits=10,
        decimal_places=2,
        help_text="Amount for this installment"
    )
    due_date = models.DateField(_("Due Date"))
    
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('PAID', 'Paid'),
        ('OVERDUE', 'Overdue'),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    paid_date = models.DateField(null=True, blank=True)
    paid_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        help_text="Amount paid for this installment"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    def save(self, *args, **kwargs):
        if not self.installment_id:
            self.installment_id = generate_business_id('INST')
        
        # Auto-update status
        if self.paid_amount >= self.amount:
            self.status = 'PAID'
            if not self.paid_date:
                from datetime import date
                self.paid_date = date.today()
        
        super().save(*args, **kwargs)
    
    class Meta:
        unique_together = ('invoice', 'installment_number')
        ordering = ['installment_number']
        indexes = [
            models.Index(fields=['school', 'status'], name='installment_school_status_idx'),
            models.Index(fields=['invoice', 'installment_number'], name='installment_invoice_num_idx'),
            models.Index(fields=['due_date'], name='installment_due_date_idx'),
        ]
    
    def __str__(self):
        return f"{self.installment_id} - Installment {self.installment_number}"


class FeeDiscount(models.Model):
    """Manage student discounts/scholarships"""
    school = models.ForeignKey(School, on_delete=models.CASCADE)
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='fee_discounts')
    academic_year = models.ForeignKey(AcademicYear, on_delete=models.CASCADE)
    
    DISCOUNT_TYPE_CHOICES = [
        ('PERCENTAGE', 'Percentage'),
        ('FIXED', 'Fixed Amount'),
    ]
    discount_type = models.CharField(
        max_length=20,
        choices=DISCOUNT_TYPE_CHOICES,
        help_text="Percentage or fixed amount discount"
    )
    discount_value = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text="Percentage (e.g., 50 for 50%) or fixed amount (e.g., 5000)"
    )
    
    # Optional: Apply to specific category or all fees
    category = models.ForeignKey(
        FeeCategory,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        help_text="Leave blank to apply to all fees"
    )
    
    reason = models.CharField(
        max_length=200,
        help_text="e.g., Merit Scholarship, Sibling Discount, Financial Aid"
    )
    
    valid_from = models.DateField(help_text="Start date for discount")
    valid_until = models.DateField(help_text="End date for discount")
    is_active = models.BooleanField(default=True)
    
    created_by = models.ForeignKey(
        CoreUser,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_discounts'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['school', 'student'], name='discount_school_student_idx'),
            models.Index(fields=['academic_year', 'is_active'], name='discount_year_active_idx'),
            models.Index(fields=['student', 'is_active'], name='discount_student_active_idx'),
        ]
    
    def __str__(self):
        return f"{self.student.first_name} - {self.reason} ({self.discount_type})"
    
    def get_discount_amount(self, base_amount):
        """Calculate discount amount based on base amount"""
        if self.discount_type == 'PERCENTAGE':
            return (base_amount * self.discount_value) / 100
        else:
            return self.discount_value


class CertificateFee(models.Model):
    """Fee configuration for certificates"""
    school = models.ForeignKey(School, on_delete=models.CASCADE)
    
    # Certificate types from certificates app
    CERTIFICATE_TYPE_CHOICES = [
        ('BONAFIDE', 'Bonafide Certificate'),
        ('TC', 'Transfer Certificate'),
        ('LC', 'Leaving Certificate'),
        ('MIGRATION', 'Migration Certificate'),
        ('CHARACTER', 'Character Certificate'),
        ('CONDUCT', 'Conduct Certificate'),
        ('STUDY', 'Study Certificate'),
        ('ATTENDANCE', 'Attendance Certificate'),
        ('SPORTS', 'Sports Participation'),
        ('ACHIEVEMENT', ' Certificate'),
        ('FEE_CLEARANCE', 'Fee Clearance Certificate'),
        ('COURSE_COMPLETION', 'Course Completion'),
        ('CUSTOM', 'Custom Certificate'),
    ]
    certificate_type = models.CharField(
        max_length=50,
        choices=CERTIFICATE_TYPE_CHOICES,
        help_text="Type of certificate"
    )
    
    fee_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text="Fee amount for this certificate type"
    )
    is_active = models.BooleanField(
        default=True,
        help_text="Whether fee is currently active"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('school', 'certificate_type')
        indexes = [
            models.Index(fields=['school', 'is_active'], name='certfee_school_active_idx'),
        ]
    
    def __str__(self):
        return f"{self.get_certificate_type_display()} - ₹{self.fee_amount}"
