from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from django.utils import timezone
from django.db import transaction
import datetime

from .models import (
    WorkflowTemplate, WorkflowStage, AssessmentTemplate,
    Enquiry, EnquiryStageProgress, EnquiryAssessmentResult, EnquiryDocument
)
from .serializers import (
    WorkflowTemplateSerializer, WorkflowTemplateListSerializer,
    WorkflowStageSerializer, AssessmentTemplateSerializer,
    EnquirySerializer, EnquiryListSerializer, EnquiryCreateSerializer,
    EnquiryDocumentSerializer, EnquiryAssessmentResultSerializer
)
from core.permissions import StandardPermission
from core.pagination import StandardResultsPagination
from core.utils import generate_business_id


# ============================================
# WORKFLOW MANAGEMENT
# ============================================

class WorkflowTemplateViewSet(viewsets.ModelViewSet):
    """Manage workflow templates"""
    permission_classes = [IsAuthenticated, StandardPermission]
    pagination_class = StandardResultsPagination
    
    def get_queryset(self):
        return WorkflowTemplate.objects.filter(
            school=self.request.user.school
        ).prefetch_related('stages', 'stages__assessments')
    
    def get_serializer_class(self):
        if self.action == 'list':
            return WorkflowTemplateListSerializer
        return WorkflowTemplateSerializer
    
    def perform_create(self, serializer):
        school = self.request.user.school
        workflow_type = serializer.validated_data.get('workflow_type', 'ADMISSION')
        
        # Check if any default exists for this type
        has_default = WorkflowTemplate.objects.filter(
            school=school,
            workflow_type=workflow_type,
            is_default=True
        ).exists()
        
        # Auto-set as default if no default exists (first workflow of this type)
        if not has_default:
            serializer.save(school=school, is_default=True)
        else:
            serializer.save(school=school)
    
    @action(detail=True, methods=['post'])
    def set_default(self, request, pk=None):
        """Set this template as default for its workflow type"""
        template = self.get_object()
        # Clear other defaults
        WorkflowTemplate.objects.filter(
            school=request.user.school,
            workflow_type=template.workflow_type,
            is_default=True
        ).update(is_default=False)
        # Set this one
        template.is_default = True
        template.save()
        return Response({'success': True, 'message': f'{template.name} set as default'})


class WorkflowStageViewSet(viewsets.ModelViewSet):
    """Manage workflow stages"""
    permission_classes = [IsAuthenticated, StandardPermission]
    serializer_class = WorkflowStageSerializer
    
    def get_queryset(self):
        template_id = self.request.query_params.get('template')
        queryset = WorkflowStage.objects.filter(
            template__school=self.request.user.school
        ).prefetch_related('assessments')
        if template_id:
            queryset = queryset.filter(template_id=template_id)
        return queryset


class AssessmentTemplateViewSet(viewsets.ModelViewSet):
    """Manage assessment templates"""
    permission_classes = [IsAuthenticated, StandardPermission]
    serializer_class = AssessmentTemplateSerializer
    
    def get_queryset(self):
        stage_id = self.request.query_params.get('stage')
        queryset = AssessmentTemplate.objects.filter(
            stage__template__school=self.request.user.school
        )
        if stage_id:
            queryset = queryset.filter(stage_id=stage_id)
        return queryset


# ============================================
# ENQUIRY MANAGEMENT
# ============================================

class EnquiryViewSet(viewsets.ModelViewSet):
    """Main enquiry CRUD"""
    permission_classes = [IsAuthenticated, StandardPermission]
    pagination_class = StandardResultsPagination
    
    def get_queryset(self):
        queryset = Enquiry.objects.filter(
            school=self.request.user.school
        ).select_related(
            'class_applied', 'workflow', 'current_stage', 'filled_by', 'academic_year'
        ).prefetch_related('documents', 'stage_progress', 'assessment_results')
        
        # Filters
        status_filter = self.request.query_params.get('status')
        class_filter = self.request.query_params.get('class_applied')
        filled_by = self.request.query_params.get('filled_by')
        priority = self.request.query_params.get('priority')
        
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        if class_filter:
            queryset = queryset.filter(class_applied_id=class_filter)
        if filled_by:
            # Support 'me' to filter by current user (for mobile app)
            if filled_by == 'me':
                queryset = queryset.filter(filled_by=self.request.user)
            else:
                queryset = queryset.filter(filled_by_id=filled_by)
        if priority:
            queryset = queryset.filter(priority=priority)
        
        return queryset.order_by('-created_at')
    
    def get_serializer_class(self):
        if self.action == 'list':
            return EnquiryListSerializer
        if self.action == 'create':
            return EnquiryCreateSerializer
        return EnquirySerializer

    def perform_create(self, serializer):
        serializer.save(
            school=self.request.user.school,
            filled_by=self.request.user
        )
    
    @action(detail=True, methods=['post'])
    def advance_stage(self, request, pk=None):
        """Move enquiry to next stage"""
        enquiry = self.get_object()
        remarks = request.data.get('remarks', '')
        
        if not enquiry.workflow or not enquiry.current_stage:
            return Response({'error': 'No workflow assigned'}, status=400)
        
        current_stage = enquiry.current_stage
        next_stage = enquiry.workflow.stages.filter(order__gt=current_stage.order).order_by('order').first()
        
        with transaction.atomic():
            # Mark current stage as completed
            progress, _ = EnquiryStageProgress.objects.get_or_create(
                enquiry=enquiry, stage=current_stage
            )
            progress.status = 'COMPLETED'
            progress.processed_by = request.user
            progress.processed_at = timezone.now()
            progress.remarks = remarks
            progress.save()
            
            if next_stage:
                # Move to next stage
                enquiry.current_stage = next_stage
                enquiry.status = 'IN_PROGRESS'
                EnquiryStageProgress.objects.get_or_create(
                    enquiry=enquiry, stage=next_stage,
                    defaults={'status': 'PENDING'}
                )
            else:
                # All stages completed
                enquiry.current_stage = None
                enquiry.status = 'APPROVED'
            
            enquiry.save()
        
        return Response({
            'success': True,
            'new_stage': next_stage.name if next_stage else None,
            'status': enquiry.status
        })
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Reject enquiry"""
        enquiry = self.get_object()
        reason = request.data.get('reason', '')
        
        enquiry.status = 'REJECTED'
        enquiry.rejection_reason = reason
        enquiry.save()
        
        # Mark current stage as failed
        if enquiry.current_stage:
            progress, _ = EnquiryStageProgress.objects.get_or_create(
                enquiry=enquiry, stage=enquiry.current_stage
            )
            progress.status = 'FAILED'
            progress.processed_by = request.user
            progress.processed_at = timezone.now()
            progress.remarks = reason
            progress.save()
        
        return Response({'success': True, 'message': 'Enquiry rejected'})
    
    @action(detail=True, methods=['post'])
    def convert_to_student(self, request, pk=None):
        """Convert approved enquiry to actual student"""
        enquiry = self.get_object()
        
        if enquiry.status != 'APPROVED':
            return Response({'error': 'Only approved enquiries can be converted'}, status=400)
        
        if enquiry.converted_student:
            return Response({'error': 'Already converted to student'}, status=400)
        
        from students.models import Student
        from schools.models import Section
        
        with transaction.atomic():
            # 1. Resolve Section
            # Try to get section from request, or default to first available section for this class
            section_id = request.data.get('section_id')
            section = None
            
            if section_id:
                section = Section.objects.filter(id=section_id, parent_class=enquiry.class_applied).first()
            
            if not section:
                # Fallback: Assign to the first section (usually 'A')
                section = Section.objects.filter(parent_class=enquiry.class_applied).order_by('name').first()
                
            if not section:
                return Response({'error': f'No sections found for class {enquiry.class_applied.name}. Please create sections first.'}, status=400)

            # 2. Generate Intelligent ID: [Class][Section]-[Sequence] (e.g. 10A-001)
            # Count existing students in this specific Class & Section to find the sequence
            current_count = Student.objects.filter(
                school=enquiry.school,
                current_class=enquiry.class_applied,
                section=section
            ).count()
            
            next_seq = current_count + 1
            # Format: 10A-001
            # Remove spaces from class name just in case (e.g. "Class 10" -> "10")
            class_code = enquiry.class_applied.name.replace('Class', '').replace(' ', '').strip()
            section_code = section.name.strip()
            
            custom_student_id = f"{class_code}{section_code}-{next_seq:03d}"
            
            # 3. Generate Permanent GR Number: GR-[Year]-[Sequence]
            # e.g., GR-2024-0005. This stays with student forever.
            current_year = datetime.date.today().year
            # Get total student count for school for GR sequence
            total_students = Student.objects.filter(school=enquiry.school).count() + 1
            gr_number = f"GR-{current_year}-{total_students:04d}"

            # Create student from enquiry data
            student = Student.objects.create(
                school=enquiry.school,
                first_name=enquiry.first_name,
                last_name=enquiry.last_name,
                date_of_birth=enquiry.date_of_birth,
                gender=enquiry.gender,
                current_class=enquiry.class_applied,
                section=section,  # Assign the resolved section
                academic_year=enquiry.academic_year,
                father_name=enquiry.parent_name,  # Assuming parent is father
                emergency_mobile=enquiry.parent_mobile,
                address=enquiry.address,
                enrollment_number=custom_student_id,  # Dynamic Roll No
                gr_number=gr_number, # Permanent ID
                student_id=generate_business_id('STU'), # Internal System ID
            )
            
            # Copy photo if exists
            if enquiry.photo:
                student.photo = enquiry.photo
                student.save()
            
            # Update enquiry
            enquiry.converted_student = student
            enquiry.converted_at = timezone.now()
            enquiry.converted_by = request.user
            enquiry.status = 'CONVERTED'
            enquiry.save()
        
        return Response({
            'success': True,
            'student_id': student.student_id,
            'enrollment_number': student.enrollment_number,
            'gr_number': student.gr_number,
            'message': f'Admitted: {student.get_full_name()} | GR No: {gr_number} | Roll: {custom_student_id}'
        })


class EnquiryDocumentViewSet(viewsets.ModelViewSet):
    """Manage enquiry documents"""
    permission_classes = [IsAuthenticated]
    serializer_class = EnquiryDocumentSerializer
    
    def get_queryset(self):
        enquiry_id = self.request.query_params.get('enquiry')
        queryset = EnquiryDocument.objects.filter(
            enquiry__school=self.request.user.school
        )
        if enquiry_id:
            queryset = queryset.filter(enquiry_id=enquiry_id)
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(uploaded_by=self.request.user)
    
    @action(detail=True, methods=['post'])
    def verify(self, request, pk=None):
        """Verify a document"""
        doc = self.get_object()
        remarks = request.data.get('remarks', '')
        
        doc.is_verified = True
        doc.verified_by = request.user
        doc.verified_at = timezone.now()
        doc.verification_remarks = remarks
        doc.save()
        
        return Response({'success': True, 'message': 'Document verified'})


class RecordAssessmentView(APIView):
    """Record assessment result for an enquiry"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request, enquiry_id):
        assessment_id = request.data.get('assessment_id')
        marks = request.data.get('marks_obtained')
        is_passed = request.data.get('is_passed', False)
        remarks = request.data.get('remarks', '')
        
        try:
            enquiry = Enquiry.objects.get(
                id=enquiry_id, 
                school=request.user.school
            )
            assessment = AssessmentTemplate.objects.get(id=assessment_id)
            
            # Auto-calculate pass/fail if marks provided
            if marks is not None and assessment.max_marks > 0:
                is_passed = float(marks) >= assessment.passing_marks
            
            result, created = EnquiryAssessmentResult.objects.update_or_create(
                enquiry=enquiry,
                assessment=assessment,
                defaults={
                    'marks_obtained': marks,
                    'is_passed': is_passed,
                    'evaluated_by': request.user,
                    'evaluated_at': timezone.now(),
                    'remarks': remarks
                }
            )
            
            return Response({
                'success': True,
                'is_passed': is_passed,
                'message': 'Assessment recorded'
            })
            
        except (Enquiry.DoesNotExist, AssessmentTemplate.DoesNotExist) as e:
            return Response({'error': str(e)}, status=404)


class EnquiryStatsView(APIView):
    """Dashboard stats for enquiries"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        school = request.user.school
        queryset = Enquiry.objects.filter(school=school)
        
        stats = {
            'total': queryset.count(),
            'pending': queryset.filter(status='PENDING').count(),
            'in_progress': queryset.filter(status='IN_PROGRESS').count(),
            'approved': queryset.filter(status='APPROVED').count(),
            'rejected': queryset.filter(status='REJECTED').count(),
            'converted': queryset.filter(status='CONVERTED').count(),
            'by_class': list(
                queryset.values('class_applied__name')
                .annotate(count=models.Count('id'))
                .order_by('class_applied__name')
            ),
            'by_source': list(
                queryset.values('filled_via')
                .annotate(count=models.Count('id'))
            ),
        }
        
        return Response(stats)


# Import for Count
from django.db import models
