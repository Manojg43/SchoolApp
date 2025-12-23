from rest_framework import serializers
from .models import (
    FeeCategory, FeeStructure, Invoice, Receipt,
    FeeInstallment, FeeDiscount, CertificateFee
)


class FeeCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = FeeCategory
        fields = ['id', 'name', 'description']


class FeeStructureSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    class_name = serializers.CharField(source='class_assigned.name', read_only=True)

    class Meta:
        model = FeeStructure
        fields = ['id', 'academic_year', 'class_assigned', 'class_name', 'category', 'category_name', 'amount']


class InvoiceSerializer(serializers.ModelSerializer):
    student_name = serializers.SerializerMethodField()
    class_name = serializers.SerializerMethodField()
    balance_due = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    is_overdue = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = Invoice
        fields = [
            'id', 'invoice_id', 'student', 'student_name', 'class_name',
            'title', 'total_amount', 'paid_amount', 'balance_due',
            'due_date', 'status', 'is_overdue',
            'academic_year', 'fee_term',
            'is_settled', 'settled_date', 'settlement_note',
            'late_fee', 'late_fee_applied_date',
            'discount_amount', 'discount_reason',
            'created_at'
        ]
        read_only_fields = ['invoice_id', 'status', 'created_at']
    
    def get_student_name(self, obj):
        return f"{obj.student.first_name} {obj.student.last_name}"
    
    def get_class_name(self, obj):
        if obj.student.current_class:
            return obj.student.current_class.name
        return None


# NEW: Fee Settlement Serializers (Phase 2)

class FeeInstallmentSerializer(serializers.ModelSerializer):
    """Serializer for fee installments"""
    balance_due = serializers.SerializerMethodField()
    
    class Meta:
        model = FeeInstallment
        fields = [
            'id', 'installment_id', 'invoice', 'installment_number',
            'amount', 'due_date', 'status', 'paid_date', 'paid_amount',
            'balance_due', 'created_at'
        ]
        read_only_fields = ['installment_id', 'status', 'created_at']
    
    def get_balance_due(self, obj):
        return obj.amount - obj.paid_amount


class FeeDiscountSerializer(serializers.ModelSerializer):
    """Serializer for student discounts"""
    student_name = serializers.SerializerMethodField()
    category_name = serializers.CharField(source='category.name', read_only=True, allow_null=True)
    created_by_name = serializers.SerializerMethodField()
    
    class Meta:
        model = FeeDiscount
        fields = [
            'id', 'school', 'student', 'student_name', 'academic_year',
            'discount_type', 'discount_value', 'category', 'category_name',
            'reason', 'valid_from', 'valid_until', 'is_active',
            'created_by', 'created_by_name', 'created_at'
        ]
        read_only_fields = ['created_at']
    
    def get_student_name(self, obj):
        return obj.student.get_full_name()
    
    def get_created_by_name(self, obj):
        if obj.created_by:
            return obj.created_by.get_full_name()
        return None


class CertificateFeeSerializer(serializers.ModelSerializer):
    """Serializer for certificate fee configuration"""
    certificate_type_display = serializers.CharField(source='get_certificate_type_display', read_only=True)
    
    class Meta:
        model = CertificateFee
        fields = [
            'id', 'school', 'certificate_type', 'certificate_type_display',
            'fee_amount', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class ReceiptSerializer(serializers.ModelSerializer):
    """Serializer for payment receipts"""
    invoice_number = serializers.CharField(source='invoice.invoice_id', read_only=True)
    student_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Receipt
        fields = [
            'id', 'receipt_no', 'invoice', 'invoice_number',
            'student_name', 'amount', 'date', 'mode',
            'transaction_id', 'created_by'
        ]
        read_only_fields = ['receipt_no', 'date']
    
    def get_student_name(self, obj):
        return obj.invoice.student.get_full_name()
