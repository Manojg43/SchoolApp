from django.contrib import admin
from .models import FeeCategory, FeeStructure, Invoice, Receipt, Salary

@admin.register(FeeCategory)
class FeeCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'school')

@admin.register(FeeStructure)
class FeeStructureAdmin(admin.ModelAdmin):
    list_display = ('academic_year', 'class_assigned', 'category', 'amount')
    list_filter = ('school', 'academic_year')

@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ('invoice_id', 'student', 'total_amount', 'paid_amount', 'status', 'due_date')
    list_filter = ('status', 'school')
    search_fields = ('invoice_id', 'student__first_name', 'student__student_id')

@admin.register(Receipt)
class ReceiptAdmin(admin.ModelAdmin):
    list_display = ('receipt_no', 'invoice', 'amount', 'date', 'mode')
    search_fields = ('receipt_no',)

@admin.register(Salary)
class SalaryAdmin(admin.ModelAdmin):
    list_display = ('salary_id', 'staff', 'month', 'net_salary', 'is_paid')
    list_filter = ('is_paid', 'school', 'month')
