from django.contrib import admin
from .models import (
    FeeCategory, FeeStructure, Invoice, Receipt, Salary,
    # Fee Settlement Models (Phase 2)
    FeeInstallment, FeeDiscount, CertificateFee
)

@admin.register(FeeCategory)
class FeeCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'school')

@admin.register(FeeStructure)
class FeeStructureAdmin(admin.ModelAdmin):
    list_display = ('academic_year', 'class_assigned', 'category', 'amount')
    list_filter = ('school', 'academic_year')

@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ('invoice_id', 'student', 'total_amount', 'paid_amount', 'status', 'due_date', 'fee_term', 'is_settled')
    list_filter = ('status', 'school', 'academic_year', 'fee_term', 'is_settled')
    search_fields = ('invoice_id', 'student__first_name', 'student__student_id')

@admin.register(Receipt)
class ReceiptAdmin(admin.ModelAdmin):
    list_display = ('receipt_no', 'invoice', 'amount', 'date', 'mode')
    search_fields = ('receipt_no',)

@admin.register(Salary)
class SalaryAdmin(admin.ModelAdmin):
    list_display = ('salary_id', 'staff', 'month', 'net_salary', 'is_paid')
    list_filter = ('is_paid', 'school', 'month')


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
