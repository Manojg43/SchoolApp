from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .utils import calculate_monthly_salary
from django.template.loader import render_to_string
from django.http import HttpResponse
from xhtml2pdf import pisa
from .models import Invoice
import datetime

class CalculateSalaryView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        year = request.data.get('year')
        month = request.data.get('month')
        
        if not year or not month:
            # Default to current month
            today = datetime.date.today()
            year = today.year
            month = today.month
            
        try:
            count = calculate_monthly_salary(request.user.school, int(year), int(month))
            return Response({'message': f'Salary calculated for {count} staff members.'})
        except Exception as e:
            return Response({'error': str(e)}, status=400)

class DownloadInvoiceView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, invoice_id):
        try:
            invoice = Invoice.objects.get(id=invoice_id, school=request.user.school)
        except Invoice.DoesNotExist:
            return Response({'error': 'Invoice not found'}, status=404)

        context = {
            'school_name': invoice.school.name,
            'student_name': f"{invoice.student.first_name} {invoice.student.last_name}",
            'enrollment_number': invoice.student.enrollment_number,
            'class_name': str(invoice.fee_structure.class_assigned) if invoice.fee_structure else "N/A",
            'section': str(invoice.student.section) if invoice.student.section else "N/A",
            'father_name': invoice.student.father_name,
            'mother_name': invoice.student.mother_name,
            'mobile': invoice.student.emergency_mobile,
            'address': invoice.student.address,
            'dob': invoice.student.date_of_birth.strftime('%Y-%m-%d') if invoice.student.date_of_birth else "",
            'invoice_id': invoice.invoice_id,
            'date': invoice.created_at.strftime('%Y-%m-%d'),
            'due_date': invoice.due_date,
            'status': invoice.status,
            'title': invoice.title,
            'amount': invoice.total_amount
        }

        html_string = render_to_string('invoice.html', context)
        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = f'inline; filename="invoice_{invoice.invoice_id}.pdf"'

        pisa_status = pisa.CreatePDF(
            html_string, dest=response)

        if pisa_status.err:
            return Response({'error': 'PDF generation failed'}, status=500)
            
        return response

from rest_framework import viewsets
from .models import FeeCategory, FeeStructure
from .serializers import FeeCategorySerializer, FeeStructureSerializer
from core.permissions import StandardPermission
from core.middleware import get_current_school_id
from core.pagination import StandardResultsPagination

class FeeCategoryViewSet(viewsets.ModelViewSet):
    queryset = FeeCategory.objects.all()
    serializer_class = FeeCategorySerializer
    permission_classes = [StandardPermission]
    pagination_class = StandardResultsPagination

    def get_queryset(self):
        queryset = FeeCategory.objects.select_related('school').all()
        school_id = get_current_school_id()
        if school_id:
            queryset = queryset.filter(school__school_id=school_id)
        return queryset

    def perform_create(self, serializer):
        serializer.save(school=self.request.user.school)

class FeeStructureViewSet(viewsets.ModelViewSet):
    queryset = FeeStructure.objects.all()
    serializer_class = FeeStructureSerializer
    permission_classes = [StandardPermission]
    pagination_class = StandardResultsPagination

    def get_queryset(self):
        queryset = FeeStructure.objects.select_related(
            'school', 'academic_year', 'class_assigned', 'category'
        ).all()
        school_id = get_current_school_id()
        class_id = self.request.query_params.get('class_assigned')
        category_id = self.request.query_params.get('category')
        
        if school_id:
            queryset = queryset.filter(school__school_id=school_id)
        
        if class_id:
            queryset = queryset.filter(class_assigned_id=class_id)
        if category_id:
            queryset = queryset.filter(category_id=category_id)
            
        return queryset

    def perform_create(self, serializer):
        serializer.save(school=self.request.user.school)


# ViewSet Cleanups
# FeeViewSet is handled in students.views to avoid duplication


# Fee Settlement Enhancement - New Views (Phase 2)

from rest_framework.viewsets import ModelViewSet
from .models import FeeInstallment, FeeDiscount, CertificateFee
from .serializers import (
    FeeInstallmentSerializer, FeeDiscountSerializer, CertificateFeeSerializer
)
from .services import FeeSettlementService
from schools.models import AcademicYear
from students.models import Student


class BulkFeeGenerationView(APIView):
    """Generate fees for all students (year-end bulk operation)"""
    permission_classes = [IsAuthenticated, StandardPermission]
    
    def post(self, request):
        """
        Generate annual fees for all students in an academic year
        
        Request body:
        {
            "academic_year_id": 1,
            "options": {
                "auto_apply_discounts": true,
                "skip_pending_fees": true
            }
        }
        """
        try:
            academic_year_id = request.data.get('academic_year_id')
            options = request.data.get('options', {})
            
            if not academic_year_id:
                return Response({
                    'success': False,
                    'error': 'academic_year_id is required'
                }, status=400)
            
            academic_year = AcademicYear.objects.get(id=academic_year_id)
            
            # Generate fees
            result = FeeSettlementService.generate_annual_fees(
                academic_year,
                request.user.school,
                options
            )
            
            return Response(result)
            
        except AcademicYear.DoesNotExist:
            return Response({
                'success': False,
                'error': 'Academic year not found'
            }, status=404)
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=500)


class YearSettlementView(APIView):
    """Mark academic year as settled"""
    permission_classes = [IsAuthenticated, StandardPermission]
    
    def post(self, request, year_id):
        """Settle all paid invoices for an academic year"""
        try:
            academic_year = AcademicYear.objects.get(id=year_id)
            
            result = FeeSettlementService.settle_year(
                academic_year,
                request.user.school
            )
            
            return Response(result)
            
        except AcademicYear.DoesNotExist:
            return Response({
                'success': False,
                'error': 'Academic year not found'
            }, status=404)
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=500)


class SettlementSummaryView(APIView):
    """Get settlement summary/report for an academic year"""
    permission_classes = [IsAuthenticated, StandardPermission]
    
    def get(self, request, year_id):
        """Get comprehensive settlement summary"""
        try:
            academic_year = AcademicYear.objects.get(id=year_id)
            
            summary = FeeSettlementService.get_settlement_summary(
                academic_year,
                request.user.school
            )
            
            return Response(summary)
            
        except AcademicYear.DoesNotExist:
            return Response({
                'success': False,
                'error': 'Academic year not found'
            }, status=404)
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=500)


class StudentPromotionView(APIView):
    """Handle student promotion with fee generation"""
    permission_classes = [IsAuthenticated, StandardPermission]
    
    def post(self, request, student_id):
        """
        Promote student to new class and generate fees
        
        Request body:
        {
            "new_class_id": 5,
            "new_academic_year_id": 2
        }
        """
        try:
            student = Student.objects.get(id=student_id, school=request.user.school)
            new_class_id = request.data.get('new_class_id')
            new_year_id = request.data.get('new_academic_year_id')
            
            if not new_class_id or not new_year_id:
                return Response({
                    'success': False,
                    'error': 'new_class_id and new_academic_year_id are required'
                }, status=400)
            
            from schools.models import Class
            new_class = Class.objects.get(id=new_class_id)
            new_year = AcademicYear.objects.get(id=new_year_id)
            
            result = FeeSettlementService.handle_class_promotion(
                student,
                new_class,
                new_year
            )
            
            return Response(result)
            
        except Student.DoesNotExist:
            return Response({'success': False, 'error': 'Student not found'}, status=404)
        except Exception as e:
            return Response({'success': False, 'error': str(e)}, status=500)


class CertificateFeeCheckView(APIView):
    """Check certificate fee before generation"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, cert_type):
        """Get fee amount for a certificate type"""
        try:
            cert_fee = CertificateFee.objects.filter(
                school=request.user.school,
                certificate_type=cert_type,
                is_active=True
            ).first()
            
            if cert_fee and cert_fee.fee_amount > 0:
                return Response({
                    'fee_required': True,
                    'amount': float(cert_fee.fee_amount),
                    'certificate_type': cert_type
                })
            
            return Response({
                'fee_required': False,
                'amount': 0,
                'certificate_type': cert_type
            })
            
        except Exception as e:
            return Response({
                'error': str(e)
            }, status=500)


# ViewSets for new models

class FeeInstallmentViewSet(ModelViewSet):
    """ViewSet for fee installments"""
    queryset = FeeInstallment.objects.all()
    serializer_class = FeeInstallmentSerializer
    permission_classes = [StandardPermission]
    pagination_class = StandardResultsPagination
    
    def get_queryset(self):
        queryset = FeeInstallment.objects.select_related(
            'school', 'invoice', 'invoice__student'
        ).all()
        school_id = get_current_school_id()
        if school_id:
            queryset = queryset.filter(school__school_id=school_id)
        
        # Filter by invoice if provided
        invoice_id = self.request.query_params.get('invoice')
        if invoice_id:
            queryset = queryset.filter(invoice_id=invoice_id)
        
        # Filter by status
        status = self.request.query_params.get('status')
        if status:
            queryset = queryset.filter(status=status)
        
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(school=self.request.user.school)


class FeeDiscountViewSet(ModelViewSet):
    """ViewSet for student discounts/scholarships"""
    queryset = FeeDiscount.objects.all()
    serializer_class = FeeDiscountSerializer
    permission_classes = [StandardPermission]
    pagination_class = StandardResultsPagination
    
    def get_queryset(self):
        queryset = FeeDiscount.objects.select_related(
            'school', 'student', 'academic_year', 'category', 'created_by'
        ).all()
        school_id = get_current_school_id()
        if school_id:
            queryset = queryset.filter(school__school_id=school_id)
        
        # Filter by student
        student_id = self.request.query_params.get('student')
        if student_id:
            queryset = queryset.filter(student_id=student_id)
        
        # Filter by academic year
        year_id = self.request.query_params.get('academic_year')
        if year_id:
            queryset = queryset.filter(academic_year_id=year_id)
        
        # Filter by active status
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(
            school=self.request.user.school,
            created_by=self.request.user
        )


class CertificateFeeViewSet(ModelViewSet):
    """ViewSet for certificate fee configuration"""
    queryset = CertificateFee.objects.all()
    serializer_class = CertificateFeeSerializer
    permission_classes = [StandardPermission]
    
    def get_queryset(self):
        queryset = CertificateFee.objects.select_related('school').all()
        school_id = get_current_school_id()
        if school_id:
            queryset = queryset.filter(school__school_id=school_id)
        
        # Filter by active status
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(school=self.request.user.school)
