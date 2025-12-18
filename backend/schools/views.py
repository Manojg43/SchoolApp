from rest_framework import viewsets
from .models import School, Achievement, AcademicYear, Class, Section
from .serializers import SchoolSerializer, AchievementSerializer, AcademicYearSerializer, ClassSerializer, SectionSerializer
from core.permissions import StandardPermission
from core.middleware import get_current_school_id

class SchoolViewSet(viewsets.ModelViewSet):
    queryset = School.objects.all()
    serializer_class = SchoolSerializer
    permission_classes = [StandardPermission]

class AchievementViewSet(viewsets.ModelViewSet):
    queryset = Achievement.objects.all()
    serializer_class = AchievementSerializer
    permission_classes = [StandardPermission]

    def get_queryset(self):
        queryset = Achievement.objects.all()
        school_id = get_current_school_id()
        if school_id:
            queryset = queryset.filter(school__school_id=school_id)
        return queryset

class AcademicYearViewSet(viewsets.ModelViewSet):
    queryset = AcademicYear.objects.all()
    serializer_class = AcademicYearSerializer
    permission_classes = [StandardPermission]

    def get_queryset(self):
        queryset = AcademicYear.objects.all()
        school_id = get_current_school_id()
        if school_id:
            queryset = queryset.filter(school__school_id=school_id)
        return queryset

class ClassViewSet(viewsets.ModelViewSet):
    queryset = Class.objects.all()
    serializer_class = ClassSerializer
    permission_classes = [StandardPermission]

    def get_queryset(self):
        queryset = Class.objects.all()
        school_id = get_current_school_id()
        if school_id:
            queryset = queryset.filter(school__school_id=school_id)
        return queryset

class SectionViewSet(viewsets.ModelViewSet):
    queryset = Section.objects.all()
    serializer_class = SectionSerializer
    permission_classes = [StandardPermission]

    def get_queryset(self):
        queryset = Section.objects.all()
        school_id = get_current_school_id()
        if school_id:
            queryset = queryset.filter(school__school_id=school_id)
        
        # Filter by class if provided
        class_id = self.request.query_params.get('parent_class')
        if class_id:
            queryset = queryset.filter(parent_class_id=class_id)
            
        return queryset
