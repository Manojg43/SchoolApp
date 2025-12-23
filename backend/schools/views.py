from rest_framework import viewsets
from .models import School, Achievement, AcademicYear, Class, Section
from .serializers import SchoolSerializer, AchievementSerializer, AcademicYearSerializer, ClassSerializer, SectionSerializer
from core.permissions import StandardPermission
from core.middleware import get_current_school_id
from core.pagination import StandardResultsPagination

from rest_framework.decorators import action
from rest_framework.response import Response

class SchoolViewSet(viewsets.ModelViewSet):
    serializer_class = SchoolSerializer
    permission_classes = [StandardPermission]

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser:
            return School.objects.all()
        return School.objects.filter(id=user.school.id)

    @action(detail=False, methods=['get', 'put', 'patch'])
    def current(self, request):
        school = request.user.school
        if request.method == 'GET':
            serializer = self.get_serializer(school)
            return Response(serializer.data)
        
        serializer = self.get_serializer(school, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

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
    pagination_class = StandardResultsPagination

    def get_queryset(self):
        queryset = AcademicYear.objects.select_related('school').all()
        school_id = get_current_school_id()
        if school_id:
            queryset = queryset.filter(school__school_id=school_id)
        return queryset

class ClassViewSet(viewsets.ModelViewSet):
    queryset = Class.objects.all()
    serializer_class = ClassSerializer
    permission_classes = [StandardPermission]
    pagination_class = StandardResultsPagination

    def get_queryset(self):
        queryset = Class.objects.select_related('school').all()
        school_id = get_current_school_id()
        if school_id:
            queryset = queryset.filter(school__school_id=school_id)
        return queryset

class SectionViewSet(viewsets.ModelViewSet):
    queryset = Section.objects.all()
    serializer_class = SectionSerializer
    permission_classes = [StandardPermission]
    pagination_class = StandardResultsPagination

    def get_queryset(self):
        queryset = Section.objects.select_related('school', 'parent_class').all()
        school_id = get_current_school_id()
        if school_id:
            queryset = queryset.filter(school__school_id=school_id)
        
        # Filter by class if provided
        class_id = self.request.query_params.get('parent_class')
        if class_id:
            queryset = queryset.filter(parent_class_id=class_id)
            
        return queryset

from .models import Notice, Homework
from .serializers import NoticeSerializer, HomeworkSerializer

class NoticeViewSet(viewsets.ModelViewSet):
    # Admin Interface for Notices
    permission_classes = [StandardPermission] 
    serializer_class = NoticeSerializer
    pagination_class = StandardResultsPagination

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser:
            return Notice.objects.select_related('school').all().order_by('-date')
        return Notice.objects.select_related('school').filter(school=user.school).order_by('-date')

    def perform_create(self, serializer):
        # Allow superuser to manually set school if needed, otherwise default to user.school
        # Ideally SuperAdmin shouldn't create school-specific notices without context, 
        # but for now we default to user.school or error if None.
        serializer.save(school=self.request.user.school)

class HomeworkViewSet(viewsets.ReadOnlyModelViewSet):
    # Admin Monitoring for Homework (ReadOnly for Admin, Teachers use App)
    permission_classes = [StandardPermission]
    serializer_class = HomeworkSerializer
    pagination_class = StandardResultsPagination

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser:
             return Homework.objects.select_related('school').all().order_by('-created_at')
        return Homework.objects.select_related('school').filter(school=user.school).order_by('-created_at')
