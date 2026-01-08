from django.db import models
from django.utils.translation import gettext_lazy as _
from django.utils import timezone
from schools.models import School, AcademicYear, Class
from students.models import Student
from core.models import CoreUser
from core.utils import generate_business_id

class FeeCategory(models.Model):
    name = models.CharField(_("Category Name"), max_length=100) # e.g. Tuition, Transport
    school = models.ForeignKey(School, on_delete=models.CASCADE)
    description = models.TextField(blank=True)
    
    # GST Configuration
    gst_rate = models.DecimalField(
        _("GST Rate (%)"), 
        max_digits=5, 
        decimal_places=2, 
        default=0.00,
        help_text="GST Percentage (e.g. 18.00)"
    )
    is_tax_inclusive = models.BooleanField(
        _("Is Tax Inclusive"), 
        default=False,
        help_text="If True, amount includes tax. If False, tax is added on top."
    )

    def __str__(self):
        return self.name

class FeeStructure(models.Model):
    school = models.ForeignKey(School, on_delete=models.CASCADE)
    academic_year = models.ForeignKey(AcademicYear, on_delete=models.CASCADE)
    class_assigned = models.ForeignKey(Class, on_delete=models.CASCADE)
    # Added Section support as per requirements ("Can be different for each class and section")
    section = models.ForeignKey('schools.Section', on_delete=models.CASCADE, null=True, blank=True)
    category = models.ForeignKey(FeeCategory, on_delete=models.CASCADE)
    amount = models.DecimalField(_("Amount"), max_digits=10, decimal_places=2)
    
    class Meta:
        unique_together = ('academic_year', 'class_assigned', 'section', 'category')
        indexes = [
            models.Index(fields=['school', 'academic_year'], name='feestructure_school_year_idx'),
        ]

    def __str__(self):
        return f"{self.class_assigned} ({self.section if self.section else 'All'}) - {self.category}: {self.amount}"

class Invoice(models.Model):
    id = models.AutoField(primary_key=True)
    invoice_id = models.CharField(max_length=50, unique=True, editable=False)
    
    school = models.ForeignKey(School, on_delete=models.CASCADE)
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='invoices')
    academic_year = models.ForeignKey(AcademicYear, on_delete=models.CASCADE)
    
    # Snapshot of totals
    total_amount = models.DecimalField(_("Total Amount"), max_digits=10, decimal_places=2)
    round_off_amount = models.DecimalField(_("Round Off Amount"), max_digits=5, decimal_places=2, default=0.00)
    paid_amount = models.DecimalField(_("Paid Amount"), max_digits=10, decimal_places=2, default=0)
    due_date = models.DateField(_("Due Date"))
    
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('PARTIAL', 'Partially Paid'),
        ('PAID', 'Paid'),
        ('OVERDUE', 'Overdue'),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.invoice_id:
            self.invoice_id = generate_business_id('INV')
        
        # Auto update status base on amounts
        if self.paid_amount >= self.total_amount:
            self.status = 'PAID'
        elif self.paid_amount > 0:
            self.status = 'PARTIAL'
        else:
            self.status = 'PENDING'
            
        super().save(*args, **kwargs)
    
    @property
    def balance_due(self):
        return self.total_amount - self.paid_amount

    def __str__(self):
        return f"{self.invoice_id} - {self.student.first_name}"

class StudentFeeBreakup(models.Model):
    """
    IMMUTABLE SNAPSHOT: This table stores the fee heads and amounts 
    at the time of invoice generation. Future changes to FeeStructure 
    will NOT affect this.
    """
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='breakups')
    head = models.ForeignKey(FeeCategory, on_delete=models.PROTECT) # Protect history
    
    amount = models.DecimalField(_("Original Amount"), max_digits=10, decimal_places=2)
    
    # Tax Breakdown (Audit)
    tax_amount = models.DecimalField(_("Tax Amount"), max_digits=10, decimal_places=2, default=0.00)
    base_amount = models.DecimalField(_("Base Amount"), max_digits=10, decimal_places=2, default=0.00)
    
    paid_amount = models.DecimalField(_("Paid Amount"), max_digits=10, decimal_places=2, default=0)
    
    @property
    def balance(self):
        return self.amount - self.paid_amount

    class Meta:
        unique_together = ('invoice', 'head')

    def __str__(self):
        return f"{self.invoice.invoice_id} - {self.head.name}"

class Receipt(models.Model):
    id = models.AutoField(primary_key=True)
    receipt_no = models.CharField(max_length=50, unique=True, editable=False)
    
    school = models.ForeignKey(School, on_delete=models.CASCADE)
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='receipts')
    amount = models.DecimalField(_("Amount Paid"), max_digits=10, decimal_places=2)
    round_off_amount = models.DecimalField(_("Round Off Amount"), max_digits=5, decimal_places=2, default=0.00)
    date = models.DateField(_("Payment Date"), auto_now_add=True)
    mode = models.CharField(_("Payment Mode"), max_length=50, choices=[
        ('CASH', 'Cash'), 
        ('ONLINE', 'Online'), 
        ('CHEQUE', 'Cheque'),
        ('UPI', 'UPI'),
        ('NEFT', 'NEFT/RTGS'),
        ('CARD', 'Debit/Credit Card'),
    ])
    transaction_id = models.CharField(max_length=100, blank=True)
    
    # Tracking
    created_by = models.ForeignKey(CoreUser, on_delete=models.SET_NULL, null=True, related_name='receipts_created')
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.receipt_no:
            self.receipt_no = generate_business_id('RCP')
        super().save(*args, **kwargs)
        # Note: Invoice paid_amount update and Allocation logic should handle 
        # centrally via Signals or Service layer to avoid circular logic here.

    def __str__(self):
        return f"{self.receipt_no} - {self.amount}"

class PaymentAllocation(models.Model):
    """
    Tracks how a single receipt amount was distributed across fee heads.
    Example: Receipt 5000 -> (Library: 1000, Sports: 4000)
    """
    receipt = models.ForeignKey(Receipt, on_delete=models.CASCADE, related_name='allocations')
    fee_breakup = models.ForeignKey(StudentFeeBreakup, on_delete=models.CASCADE, related_name='allocations')
    amount = models.DecimalField(_("Allocated Amount"), max_digits=10, decimal_places=2)

    def __str__(self):
        return f"Alloc {self.amount} to {self.fee_breakup.head.name}"

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
    
    # GST Configuration
    gst_rate = models.DecimalField(
        _("GST Rate (%)"), 
        max_digits=5, 
        decimal_places=2, 
        default=0.00,
        help_text="GST Percentage (e.g. 18.00)"
    )
    is_tax_inclusive = models.BooleanField(
        _("Is Tax Inclusive"), 
        default=False,
        help_text="If True, amount includes tax. If False, tax is added on top."
    )
    round_off_amount = models.DecimalField(_("Round Off Amount"), max_digits=5, decimal_places=2, default=0.00)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('school', 'certificate_type')
        indexes = [
            models.Index(fields=['school', 'is_active'], name='certfee_school_active_idx'),
        ]
    
    def __str__(self):
        return f"{self.get_certificate_type_display()} - ₹{self.fee_amount}"


# -----------------------------------------------------------------------------
# PAYROLL MODULE (Phase 2)
# -----------------------------------------------------------------------------

class StaffSalaryStructure(models.Model):
    """
    Defines the salary structure for a staff member.
    Includes Basic Salary and JSON-based Allowances/Deductions.
    """
    staff = models.OneToOneField(
        'core.CoreUser', 
        on_delete=models.CASCADE, 
        related_name='salary_structure'
    )
    basic_salary = models.DecimalField(
        _("Basic Salary"), 
        max_digits=12, 
        decimal_places=2,
        help_text="Base salary amount",
        default=0
    )
    
    # Store dynamic components as JSON: {"HRA": 5000, "Travel": 2000}
    allowances = models.JSONField(
        _("Allowances"), 
        default=dict, 
        blank=True,
        help_text="Dictionary of allowance names and amounts"
    )
    
    # Store dynamic deductions as JSON: {"Tax": 1000, "PF": 1800}
    deductions = models.JSONField(
        _("Deductions"), 
        default=dict, 
        blank=True,
        help_text="Dictionary of deduction names and amounts"
    )
    
    # Pre-calculated net (for quick reference, though actual depends on month)
    net_salary = models.DecimalField(
        _("Net Salary (Est)"), 
        max_digits=12, 
        decimal_places=2,
        editable=False,
        default=0
    )
    
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    def save(self, *args, **kwargs):
        # Auto-calculate net_salary
        total_allowance = sum(float(v) for v in self.allowances.values())
        total_deduction = sum(float(v) for v in self.deductions.values())
        self.net_salary = float(self.basic_salary) + total_allowance - total_deduction
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Salary Structure: {self.staff.get_full_name()} (₹{self.net_salary})"


class Salary(models.Model):
    """
    Represents a monthly salary slip (Payroll Entry).
    Snapshots the structure at the time of generation and accounts for attendance.
    """
    salary_id = models.CharField(max_length=50, unique=True, editable=False)
    
    school = models.ForeignKey(School, on_delete=models.CASCADE)
    staff = models.ForeignKey('core.CoreUser', on_delete=models.CASCADE, related_name='salaries')
    
    # Period: Usually 1st of the month (e.g., 2025-10-01 for October Salary)
    month = models.DateField(_("Salary Month"))
    
    # Attendance Stats
    present_days = models.DecimalField(max_digits=4, decimal_places=1, default=0)
    total_working_days = models.IntegerField(default=30)
    loss_of_pay_days = models.DecimalField(max_digits=4, decimal_places=1, default=0)
    
    # Financials (Snapshot)
    basic_salary = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    earnings = models.JSONField(_("Earnings Breakdown"), default=dict)
    total_earnings = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    deductions = models.JSONField(_("Deductions Breakdown"), default=dict)
    total_deductions = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    net_salary = models.DecimalField(_("Net Salary"), max_digits=12, decimal_places=2, default=0)
    
    # Payment Status
    STATUS_CHOICES = [
        ('GENERATED', 'Generated'),
        ('PAID', 'Paid'),
        ('CANCELLED', 'Cancelled'),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='GENERATED')
    payment_date = models.DateField(null=True, blank=True)
    transaction_ref = models.CharField(max_length=100, blank=True, null=True)
    
    generated_by = models.ForeignKey('core.CoreUser', on_delete=models.SET_NULL, null=True, related_name='generated_salaries')
    created_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        unique_together = ('staff', 'month')
        indexes = [
            models.Index(fields=['school', 'month'], name='salary_school_month_idx'),
            models.Index(fields=['staff', 'month'], name='salary_staff_month_idx'),
            models.Index(fields=['status'], name='salary_status_idx'),
        ]
        ordering = ['-month']

    def save(self, *args, **kwargs):
        if not self.salary_id:
            self.salary_id = generate_business_id('PAY')
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Payroll: {self.staff.get_full_name()} - {self.month.strftime('%b %Y')}"
