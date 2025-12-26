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
        queryset = Student.objects.select_related(
            'school', 'academic_year', 'current_class', 'section'
        )
        
        # Add prefetch for detail views to avoid N+1 queries
        if self.action == 'retrieve':
            queryset = queryset.prefetch_related(
                'invoices',
                'attendance_set',
                'transport_subscriptions'
            )
        
        if self.request.user.is_superuser:
            return queryset.filter(is_active=True)
        return queryset.filter(school=self.request.user.school, is_active=True)

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
    """
    Enhanced student promotion with detention support and marks recording.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """
        Promote or detain a list of students based on their performance.
        
        Request body:
        - student_ids: List of student IDs
        - target_year_id: Target academic year
        - target_class_id: Target class (for promotions)
        - target_section_id: Target section (optional)
        - is_alumni_promotion: Mark as alumni
        - students_data: Optional dict mapping student_id to marks/grade info
          {student_id: {total_marks, max_marks, percentage, grade, conduct, remarks, is_detained, detention_reason}}
        """
        student_ids = request.data.get('student_ids', [])
        target_year_id = request.data.get('target_year_id')
        target_class_id = request.data.get('target_class_id')
        target_section_id = request.data.get('target_section_id')
        is_alumni_promotion = request.data.get('is_alumni_promotion', False)
        students_data = request.data.get('students_data', {})

        if not student_ids:
            return Response({'error': 'No students selected'}, status=400)
        
        try:
            with transaction.atomic():
                students_to_promote = Student.objects.filter(
                    id__in=student_ids, 
                    school=request.user.school
                ).select_related('current_class', 'section', 'academic_year')
                
                promoted_count = 0
                detained_count = 0
                alumni_count = 0
                
                # Pre-fetch target objects
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
                    # Get individual student data if provided
                    student_info = students_data.get(str(student.id), {})
                    is_detained = student_info.get('is_detained', False)
                    
                    # Determine promotion status
                    if is_alumni_promotion:
                        promotion_status = 'GRADUATED'
                    elif is_detained:
                        promotion_status = 'DETAINED'
                    else:
                        promotion_status = 'PROMOTED'
                    
                    # Create History Record with all academic data
                    history = StudentHistory.objects.create(
                        school=student.school,
                        student=student,
                        academic_year=student.academic_year,
                        class_enrolled=student.current_class,
                        section_enrolled=student.section,
                        
                        # Academic Performance
                        total_marks=student_info.get('total_marks'),
                        max_marks=student_info.get('max_marks'),
                        percentage=student_info.get('percentage'),
                        grade=student_info.get('grade', ''),
                        class_rank=student_info.get('class_rank'),
                        section_rank=student_info.get('section_rank'),
                        
                        # Attendance (if provided)
                        total_working_days=student_info.get('total_working_days'),
                        days_present=student_info.get('days_present'),
                        attendance_percentage=student_info.get('attendance_percentage'),
                        
                        # Promotion
                        promotion_status=promotion_status,
                        promoted_to_class=target_class if not is_detained and not is_alumni_promotion else None,
                        
                        # Conduct
                        conduct=student_info.get('conduct', 'GOOD'),
                        result=promotion_status,
                        remarks=student_info.get('remarks', ''),
                        detention_reason=student_info.get('detention_reason', ''),
                        
                        recorded_by=request.user
                    )
                    
                    # Update Student
                    if is_alumni_promotion:
                        student.is_active = False
                        student.is_alumni = True
                        student.alumni_year = timezone.now().date()
                        student.current_class = None
                        student.section = None
                        alumni_count += 1
                    elif is_detained:
                        # Stay in same class for next year
                        student.academic_year = target_year
                        # Keep current class, update section if provided
                        if target_section_id:
                            student.section = target_section
                        detained_count += 1
                    else:
                        # Normal promotion
                        student.academic_year = target_year
                        student.current_class = target_class
                        student.section = target_section
                        promoted_count += 1
                    
                    student.save()
                    
                    # Fee carry-forward: Create invoice for pending balance
                    if not is_alumni_promotion and target_year:
                        from finance.models import Invoice
                        from decimal import Decimal
                        
                        # Get all unpaid invoices for this student in current year
                        pending_invoices = Invoice.objects.filter(
                            student=student,
                            school=student.school,
                            status__in=['PENDING', 'PARTIAL', 'OVERDUE']
                        ).exclude(academic_year=target_year)
                        
                        total_pending = Decimal('0.00')
                        for inv in pending_invoices:
                            total_pending += inv.balance_due
                        
                        if total_pending > 0:
                            # Create carry-forward invoice in new year
                            Invoice.objects.create(
                                school=student.school,
                                student=student,
                                academic_year=target_year,
                                title=f'Previous Year Balance Carry-Forward',
                                total_amount=total_pending,
                                due_date=target_year.start_date or timezone.now().date(),
                                fee_term='ONETIME',
                                status='PENDING',
                                settlement_note=f'Carried forward from {student_info.get("previous_year", "previous")} academic year'
                            )

                return Response({
                    'success': True,
                    'promoted': promoted_count,
                    'detained': detained_count,
                    'alumni': alumni_count,
                    'total': promoted_count + detained_count + alumni_count,
                    'message': f'Processed {promoted_count + detained_count + alumni_count} students'
                })
                
        except Exception as e:
            return Response({'error': str(e)}, status=400)


from .serializers import StudentHistorySerializer, StudentHistoryCreateSerializer

class StudentHistoryViewSet(viewsets.ModelViewSet):
    """ViewSet for managing student academic history"""
    permission_classes = [IsAuthenticated, StandardPermission]
    pagination_class = StandardResultsPagination
    
    def get_queryset(self):
        queryset = StudentHistory.objects.filter(
            school=self.request.user.school
        ).select_related(
            'student', 'academic_year', 'class_enrolled', 
            'section_enrolled', 'promoted_to_class', 'recorded_by'
        )
        
        # Filter by student if provided
        student_id = self.request.query_params.get('student')
        if student_id:
            queryset = queryset.filter(student_id=student_id)
        
        # Filter by academic year
        year_id = self.request.query_params.get('academic_year')
        if year_id:
            queryset = queryset.filter(academic_year_id=year_id)
        
        # Filter by promotion status
        status = self.request.query_params.get('promotion_status')
        if status:
            queryset = queryset.filter(promotion_status=status)
        
        return queryset.order_by('-academic_year__start_date')
    
    def get_serializer_class(self):
        if self.action == 'create':
            return StudentHistoryCreateSerializer
        return StudentHistorySerializer


class StudentHistoryView(APIView):
    """Legacy view for backward compatibility"""
    permission_classes = [IsAuthenticated]

    def get(self, request, student_id):
        try:
            from .serializers import StudentHistorySerializer
            history = StudentHistory.objects.filter(
                student_id=student_id, 
                school=request.user.school
            ).select_related(
                'academic_year', 'class_enrolled', 'section_enrolled', 'promoted_to_class'
            ).order_by('-academic_year__start_date')
            
            serializer = StudentHistorySerializer(history, many=True)
            return Response(serializer.data)
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
