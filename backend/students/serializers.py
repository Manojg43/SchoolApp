from rest_framework import serializers
from .models import Student, StudentHistory, Attendance, Fee
from schools.models import Class, Section, AcademicYear
from schools.models import School

class StudentSerializer(serializers.ModelSerializer):
    current_class = serializers.PrimaryKeyRelatedField(queryset=Class.objects.all())
    section = serializers.PrimaryKeyRelatedField(queryset=Section.objects.all(), required=False, allow_null=True)
    academic_year = serializers.PrimaryKeyRelatedField(queryset=AcademicYear.objects.all(), required=False, allow_null=True)

    class_name = serializers.CharField(source='current_class.name', read_only=True)
    section_name = serializers.CharField(source='section.name', read_only=True)
    year_name = serializers.CharField(source='academic_year.name', read_only=True)
    school_name = serializers.CharField(source='school.name', read_only=True)

    class Meta:
        model = Student
        fields = '__all__'
        read_only_fields = ['student_id', 'school'] # school is set by middleware/view

    def validate(self, attrs):
        user = self.context['request'].user
        if not user.school:
             raise serializers.ValidationError("User is not associated with any school.")

        # Auto-assign Academic Year if not provided
        if 'academic_year' not in attrs or not attrs['academic_year']:
             active_year = AcademicYear.objects.filter(school=user.school, is_active=True).first()
             if not active_year:
                 raise serializers.ValidationError({"academic_year": "No active academic year found for this school. Please create one first."})
             attrs['academic_year'] = active_year
        
        return attrs

class StudentHistorySerializer(serializers.ModelSerializer):
    class_name = serializers.CharField(source='class_enrolled.name', read_only=True)
    year_name = serializers.CharField(source='academic_year.name', read_only=True)

    class Meta:
        model = StudentHistory
        fields = '__all__'

class AttendanceSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.first_name', read_only=True)
    
    class Meta:
        model = Attendance
        fields = '__all__'
        read_only_fields = ['attendance_id', 'school']

from finance.models import Invoice

class FeeSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.first_name', read_only=True)
    class_name = serializers.CharField(source='student.current_class.name', read_only=True)
    
    # Map frontend 'amount' to model 'total_amount'
    amount = serializers.DecimalField(source='total_amount', max_digits=10, decimal_places=2)

    class Meta:
        model = Invoice
        fields = ['id', 'invoice_id', 'student', 'student_name', 'class_name', 'title', 'amount', 'due_date', 'status', 'paid_date', 'created_at']
        read_only_fields = ['invoice_id', 'created_at', 'paid_date']

    def create(self, validated_data):
        # Allow default status if not provided, or map it if needed
        # Invoice usage: total_amount is already set via source='total_amount'
        return super().create(validated_data)
