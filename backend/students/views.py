from rest_framework import viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db import transaction

from .models import Student, StudentHistory, Attendance, Fee
from .serializers import StudentSerializer, FeeSerializer, AttendanceSerializer
from schools.models import Class, AcademicYear, Section

from core.permissions import StandardPermission
from core.pagination import StandardResultsPagination, LargeResultsPagination

class StudentViewSet(viewsets.ModelViewSet):
    permission_classes = [StandardPermission] # Teachers can manage students
    queryset = Student.objects.all()
    serializer_class = StudentSerializer
    pagination_class = StandardResultsPagination
    
    def perform_create(self, serializer):
        serializer.save(school=self.request.user.school)
    
    def get_queryset(self):
        if self.request.user.is_superuser:
            return Student.objects.select_related(
                'school', 'academic_year', 'current_class', 'section'
            ).filter(is_active=True)
        return Student.objects.select_related(
            'school', 'academic_year', 'current_class', 'section'
        ).filter(school=self.request.user.school, is_active=True)

class AttendanceViewSet(viewsets.ModelViewSet):
    permission_classes = [StandardPermission]
    queryset = Attendance.objects.all()
    serializer_class = AttendanceSerializer
    pagination_class = LargeResultsPagination
    
    def get_queryset(self):
        return Attendance.objects.select_related(
            'school', 'student', 'student__current_class', 'student__section'
        ).filter(school=self.request.user.school)

from finance.models import Invoice

class FeeViewSet(viewsets.ModelViewSet):
    permission_classes = [StandardPermission] 
    queryset = Invoice.objects.all()
    serializer_class = FeeSerializer
    pagination_class = StandardResultsPagination
    
    def get_queryset(self):
        if self.request.user.is_superuser:
            return Invoice.objects.select_related(
                'student', 'student__current_class', 'student__section', 'fee_structure'
            ).all()
        return Invoice.objects.select_related(
            'student', 'student__current_class', 'student__section', 'fee_structure'
        ).filter(school=self.request.user.school)

    def perform_create(self, serializer):
        serializer.save(school=self.request.user.school)

class PromoteStudentsView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """
        Promote a list of students to a new Class, Year, and Section.
        Automatically helps maintain history.
        """
        student_ids = request.data.get('student_ids', [])
        target_year_id = request.data.get('target_year_id')
        target_class_id = request.data.get('target_class_id')
        target_section_id = request.data.get('target_section_id') # Optional
        is_alumni_promotion = request.data.get('is_alumni_promotion', False)

        if not student_ids:
            return Response({'error': 'No students selected'}, status=400)
        
        try:
            with transaction.atomic():
                students_to_promote = Student.objects.filter(id__in=student_ids, school=request.user.school)
                promoted_count = 0
                
                # Pre-fetch target objects if not alumni
                target_year = None
                target_class = None
                target_section = None
                
                if not is_alumni_promotion:
                    if not target_year_id or not target_class_id:
                         return Response({'error': 'Target Year and Class required for promotion'}, status=400)
                    
                    target_year = AcademicYear.objects.get(id=target_year_id, school=request.user.school)
                    target_class = Class.objects.get(id=target_class_id, school=request.user.school)
                    if target_section_id:
                         target_section = Section.objects.get(id=target_section_id, school=request.user.school)
                
                for student in students_to_promote:
                    # 1. Archive Current State
                    StudentHistory.objects.create(
                        school=student.school,
                        student=student,
                        academic_year=student.academic_year,
                        class_enrolled=student.current_class,
                        section_enrolled=student.section,
                        result='PROMOTED' # Default
                    )
                    
                    # 2. Update Student
                    if is_alumni_promotion:
                        student.is_active = False
                        student.is_alumni = True
                        student.alumni_year = timezone.now().date()
                        student.current_class = None
                        student.section = None
                    else:
                        student.academic_year = target_year
                        student.current_class = target_class
                        student.section = target_section # Might be null if section assignment is later
                        
                    student.save()
                    promoted_count += 1

                return Response({'message': f'Successfully promoted {promoted_count} students.'})
                
        except Exception as e:
            return Response({'error': str(e)}, status=400)

class StudentHistoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, student_id):
        try:
             history = StudentHistory.objects.filter(student_id=student_id, school=request.user.school).order_by('-recorded_at').values()
             return Response(history)
        except Exception as e:
            return Response({'error': str(e)}, status=400)


# Toggle Student Active Status
class ToggleStudentActiveView(APIView):
    """Toggle student is_active status"""
    permission_classes = [IsAuthenticated, StandardPermission]
    
    def post(self, request, student_id):
        try:
            student = Student.objects.get(id=student_id, school=request.user.school)
            student.is_active = not student.is_active
            student.save()
            
            return Response({
                'success': True,
                'is_active': student.is_active,
                'message': f'Student {"activated" if student.is_active else "deactivated"} successfully'
            })
        except Student.DoesNotExist:
            return Response({'error': 'Student not found'}, status=404)
