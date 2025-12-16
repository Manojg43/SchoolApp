from rest_framework import serializers
from .models import Student, Attendance, Fee, StudentHistory
from schools.models import School

class StudentSerializer(serializers.ModelSerializer):
    class_name = serializers.CharField(source='current_class.name', read_only=True)
    section_name = serializers.CharField(source='section.name', read_only=True)
    year_name = serializers.CharField(source='academic_year.name', read_only=True)
    school_name = serializers.CharField(source='school.name', read_only=True)

    class Meta:
        model = Student
        fields = '__all__'
        read_only_fields = ['student_id', 'school'] # school is set by middleware/view

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

class FeeSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.first_name', read_only=True)
    
    class Meta:
        model = Fee
        fields = '__all__'
        read_only_fields = ['invoice_id', 'school']
