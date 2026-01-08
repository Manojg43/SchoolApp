from django.contrib import admin
from .models import (
    FeeCategory, FeeStructure, Invoice, Receipt, Salary, StaffSalaryStructure,
    StudentFeeBreakup, PaymentAllocation,
    # Fee Settlement Models (Phase 2)
    FeeInstallment, FeeDiscount, CertificateFee
)

@admin.register(FeeCategory)
class FeeCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'school')

@admin.register(FeeStructure)
class FeeStructureAdmin(admin.ModelAdmin):
    list_display = ('academic_year', 'class_assigned', 'section', 'category', 'amount')
    list_filter = ('school', 'academic_year', 'class_assigned', 'section')

class StudentFeeBreakupInline(admin.TabularInline):
    model = StudentFeeBreakup
    extra = 0
    readonly_fields = ('head', 'amount', 'paid_amount')
    can_delete = False

@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ('invoice_id', 'student', 'academic_year', 'total_amount', 'paid_amount', 'status', 'due_date')
    list_filter = ('status', 'school', 'academic_year')
    search_fields = ('invoice_id', 'student__first_name', 'student__student_id')
    inlines = [StudentFeeBreakupInline]

@admin.register(Receipt)
class ReceiptAdmin(admin.ModelAdmin):
    list_display = ('receipt_no', 'invoice', 'amount', 'date', 'mode')
    search_fields = ('receipt_no',)

@admin.register(StaffSalaryStructure)
class StaffSalaryStructureAdmin(admin.ModelAdmin):
    list_display = ('staff', 'basic_salary', 'net_salary')
    search_fields = ('staff__first_name', 'staff__email')

@admin.register(Salary)
class SalaryAdmin(admin.ModelAdmin):
    list_display = ('salary_id', 'staff', 'month', 'net_salary', 'status')
    list_filter = ('status', 'school', 'month')

@admin.register(StudentFeeBreakup)
class StudentFeeBreakupAdmin(admin.ModelAdmin):
    list_display = ('invoice', 'head', 'amount', 'paid_amount')
    list_filter = ('head',)

@admin.register(PaymentAllocation)
class PaymentAllocationAdmin(admin.ModelAdmin):
    list_display = ('receipt', 'fee_breakup', 'amount')

# Fee Settlement Admin (Phase 2)

@admin.register(FeeInstallment)
class FeeInstallmentAdmin(admin.ModelAdmin):
    list_display = ('installment_id', 'invoice', 'installment_number', 'amount', 'due_date', 'status')
    list_filter = ('status', 'school')
    search_fields = ('installment_id', 'invoice__invoice_id')

@admin.register(FeeDiscount)
class FeeDiscountAdmin(admin.ModelAdmin):
    list_display = ('student', 'discount_type', 'discount_value', 'reason', 'academic_year', 'is_active')
    list_filter = ('discount_type', 'is_active', 'academic_year', 'school')
    search_fields = ('student__first_name', 'student__last_name', 'reason')

@admin.register(CertificateFee)
class CertificateFeeAdmin(admin.ModelAdmin):
    list_display = ('certificate_type', 'fee_amount', 'school', 'is_active')
    list_filter = ('is_active', 'school', 'certificate_type')
