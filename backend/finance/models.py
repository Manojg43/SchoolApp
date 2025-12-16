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
