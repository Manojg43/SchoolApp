from rest_framework import serializers
from .models import School, Achievement, AcademicYear, Class, Section

class SchoolSerializer(serializers.ModelSerializer):
    class Meta:
        model = School
        fields = '__all__'
        read_only_fields = ['school_id']

class AcademicYearSerializer(serializers.ModelSerializer):
    class Meta:
        model = AcademicYear
        fields = '__all__'
        read_only_fields = ['academic_year_id']

class SectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Section
        fields = '__all__'

class ClassSerializer(serializers.ModelSerializer):
    sections = SectionSerializer(many=True, read_only=True)
    
    class Meta:
        model = Class
        fields = ['id', 'school', 'name', 'order', 'sections']

class AchievementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Achievement
        fields = '__all__'

from .models import Notice, Homework, ClassSchedule

class NoticeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notice
        fields = '__all__'
        read_only_fields = ['school', 'date']

class HomeworkSerializer(serializers.ModelSerializer):
    teacher_name = serializers.CharField(source='teacher.first_name', read_only=True)
    subject_name = serializers.CharField(source='subject', read_only=True) 
    class_name = serializers.CharField(source='class_assigned.name', read_only=True)

    class Meta:
        model = Homework
        fields = '__all__'

class ClassScheduleSerializer(serializers.ModelSerializer):
    teacher_name = serializers.CharField(source='teacher.first_name', read_only=True)
    class_name = serializers.CharField(source='class_assigned.name', read_only=True)
    
    class Meta:
        model = ClassSchedule
        fields = '__all__'
