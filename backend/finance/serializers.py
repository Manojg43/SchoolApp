from rest_framework import serializers
from .models import FeeCategory, FeeStructure, Invoice, Receipt

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
    
    class Meta:
        model = Invoice
        fields = ['id', 'invoice_id', 'student', 'student_name', 'title', 'total_amount', 'paid_amount', 'due_date', 'status', 'created_at']

    def get_student_name(self, obj):
        return f"{obj.student.first_name} {obj.student.last_name}"
