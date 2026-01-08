from rest_framework import serializers
from .models import (
    FeeCategory, FeeStructure, Invoice, Receipt,
    FeeInstallment, FeeDiscount, CertificateFee, StudentFeeBreakup
)


class FeeCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = FeeCategory
        fields = ['id', 'name', 'description', 'gst_rate', 'is_tax_inclusive']


class FeeStructureSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    class_name = serializers.CharField(source='class_assigned.name', read_only=True)
    # GST info is now on the model itself, not just category default

    class Meta:
        model = FeeStructure
        fields = [
            'id', 'academic_year', 'class_assigned', 'class_name', 
            'section', # Added Section support
            'category', 'category_name', 'amount',
            'gst_rate', 'is_tax_inclusive'
        ]


class StudentFeeBreakupSerializer(serializers.ModelSerializer):
    head_name = serializers.CharField(source='head.name', read_only=True)
    gst_rate = serializers.DecimalField(source='head.gst_rate', max_digits=5, decimal_places=2, read_only=True)
    is_tax_inclusive = serializers.BooleanField(source='head.is_tax_inclusive', read_only=True)
    balance = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = StudentFeeBreakup
        fields = [
            'id', 'head', 'head_name', 
            'amount', 'base_amount', 'tax_amount', 
            'paid_amount', 'balance',
            'gst_rate', 'is_tax_inclusive'
        ]

class InvoiceSerializer(serializers.ModelSerializer):
    student_name = serializers.SerializerMethodField()
    class_name = serializers.SerializerMethodField()
    balance_due = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    is_overdue = serializers.BooleanField(read_only=True)
    breakups = StudentFeeBreakupSerializer(many=True, read_only=True) # Added breakups
    
    class Meta:
        model = Invoice
        fields = [
            'id', 'invoice_id', 'student', 'student_name', 'class_name',
            'total_amount', 'paid_amount', 'balance_due',
            'round_off_amount',
            'due_date', 'status', 'is_overdue',
            'academic_year', 'breakups', # Added field
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
            'fee_amount', 'is_active', 
            'gst_rate', 'is_tax_inclusive', 'round_off_amount', # Added GST fields
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class ReceiptSerializer(serializers.ModelSerializer):
    """Serializer for payment receipts with full tracking"""
    invoice_number = serializers.CharField(source='invoice.invoice_id', read_only=True)
    student_name = serializers.SerializerMethodField()
    created_by_name = serializers.SerializerMethodField()
    collected_by_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Receipt
        fields = [
            'id', 'receipt_no', 'invoice', 'invoice_number',
            'student_name', 'amount', 'round_off_amount', # Added
            'date', 'mode',
            'transaction_id', 
            'created_by', 'created_by_name', 'created_at',
            'collected_by', 'collected_by_name',
            'remarks'
        ]
        read_only_fields = ['receipt_no', 'date', 'created_at']
    
    def get_student_name(self, obj):
        return obj.invoice.student.get_full_name()
    
    def get_created_by_name(self, obj):
        if obj.created_by:
            return obj.created_by.get_full_name()
        return None
    
    def get_collected_by_name(self, obj):
        if obj.collected_by:
            return obj.collected_by.get_full_name()
        return None


class ReceiptCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating new receipts (collecting payment)"""
    custom_allocations = serializers.JSONField(required=False, write_only=True)
    
    class Meta:
        model = Receipt
        fields = [
            'invoice', 'amount', 'mode', 
            'transaction_id', 'collected_by', 'remarks',
            'custom_allocations' # Added field
        ]
    
    def create(self, validated_data):
        request = self.context.get('request')
        validated_data['school'] = request.user.school
        validated_data['created_by'] = request.user
        
        # Pop custom allocations before saving Receipt model (as it's not a model field)
        # Note: We are using FeeService.process_payment separately in the ViewSet, 
        # so this serializer might just be used for validation.
        # Ideally, logic should be: ViewSet calls Serializer -> Serializer.save calls Service.
        # But for complex logic, standard ModelSerializer.create might be too simple.
        # Let's override create to call our Service.
        
        from .services import FeeService
        
        custom_allocations = validated_data.pop('custom_allocations', None)
        
        # We need to call Service to handle distribution logic
        # But ModelSerializer expects an object return.
        
        # NOTE: ViewSet logic usually handles Service calls. 
        # If we do it here, we bypass ViewSet perform_create.
        # Let's keep it simple: Validate here, but let ViewSet handle the logic if possible, 
        # OR put logic here to ensure "Consistency".
        # Given "Fat Models/Services, Thin Views", let's put logic in Service, called by ViewSet.
        # BUT standard pattern `serializer.save()` triggers this `create`.
        
        try:
            return FeeService.process_payment(
                invoice=validated_data['invoice'],
                amount=validated_data['amount'],
                payment_data=validated_data,
                custom_allocations=custom_allocations,
                user=request.user
            )
        except Exception as e:
            raise serializers.ValidationError(str(e))


# -----------------------------------------------------------------------------
# PAYROLL SERIALIZERS
# -----------------------------------------------------------------------------

from .models import StaffSalaryStructure, Salary

class StaffSalaryStructureSerializer(serializers.ModelSerializer):
    staff_name = serializers.CharField(source='staff.get_full_name', read_only=True)
    
    class Meta:
        model = StaffSalaryStructure
        fields = [
            'id', 'staff', 'staff_name', 
            'basic_salary', 'allowances', 'deductions', 
            'net_salary', 'updated_at'
        ]
        read_only_fields = ['net_salary', 'updated_at']


class SalarySerializer(serializers.ModelSerializer):
    staff_name = serializers.CharField(source='staff.get_full_name', read_only=True)
    generated_by_name = serializers.CharField(source='generated_by.get_full_name', read_only=True)
    
    class Meta:
        model = Salary
        fields = [
            'id', 'salary_id', 'staff', 'staff_name', 'month',
            'present_days', 'total_working_days', 'loss_of_pay_days',
            'basic_salary', 'earnings', 'total_earnings',
            'deductions', 'total_deductions',
            'net_salary', 
            'status', 'payment_date', 'transaction_ref',
            'generated_by', 'generated_by_name', 'created_at'
        ]
        read_only_fields = [
            'salary_id', 'generated_by', 'created_at', 
            'total_earnings', 'total_deductions', 'net_salary'
            # Note: earnings/deductions/basic can be editable if manual correction needed
        ]

class PayrollRunSerializer(serializers.Serializer):
    """Serializer for triggering payroll generation"""
    month = serializers.DateField(format="%Y-%m-%d", input_formats=["%Y-%m-%d"])
    
    def validate_month(self, value):
        # Ensure it's the 1st of the month
        return value.replace(day=1)


