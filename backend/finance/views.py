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
from .services import FeeService
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
            result = FeeService.generate_annual_fees(
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
            
            result = FeeService.settle_year(
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
            
            summary = FeeService.get_settlement_summary(
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
            try:
                new_class = Class.objects.get(id=new_class_id)
            except Class.DoesNotExist:
                return Response({'success': False, 'error': 'Target Class not found'}, status=404)

            try:
                new_year = AcademicYear.objects.get(id=new_year_id)
            except AcademicYear.DoesNotExist:
                return Response({'success': False, 'error': 'Target Academic Year not found'}, status=404)
            
            result = FeeService.handle_class_promotion(
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
    pagination_class = StandardResultsPagination
    
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


from .models import Receipt
from .serializers import ReceiptSerializer, ReceiptCreateSerializer, InvoiceSerializer

class InvoiceViewSet(ModelViewSet):
    """
    ViewSet for managing Invoices.
    Replaces the old 'fees' endpoint in students app.
    Centralized source of truth for all invoices.
    """
    queryset = Invoice.objects.all()
    serializer_class = InvoiceSerializer
    permission_classes = [StandardPermission]
    pagination_class = StandardResultsPagination

    def get_queryset(self):
        queryset = Invoice.objects.select_related(
            'student', 'student__current_class', 'student__section', 
            'fee_structure', 'academic_year'
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
            
        # Filter by status
        status = self.request.query_params.get('status')
        if status:
            queryset = queryset.filter(status=status)
            
        return queryset.order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(school=self.request.user.school)


class ReceiptViewSet(ModelViewSet):
    """
    ViewSet for payment receipts - handling payment collection and history
    
    Filters:
    - invoice: Filter by invoice ID
    - student: Filter by student ID
    - date_from: Filter payments from this date
    - date_to: Filter payments until this date
    - mode: Filter by payment mode (CASH, UPI, ONLINE, etc.)
    - created_by: Filter by who created the receipt
    """
    queryset = Receipt.objects.all()
    permission_classes = [StandardPermission]
    pagination_class = StandardResultsPagination
    
    def get_serializer_class(self):
        if self.action == 'create':
            return ReceiptCreateSerializer
        return ReceiptSerializer
    
    def get_queryset(self):
        queryset = Receipt.objects.select_related(
            'school', 'invoice', 'invoice__student', 
            'created_by', 'collected_by'
        ).all()
        school_id = get_current_school_id()
        if school_id:
            queryset = queryset.filter(school__school_id=school_id)
        
        # Filter by invoice
        invoice_id = self.request.query_params.get('invoice')
        if invoice_id:
            queryset = queryset.filter(invoice_id=invoice_id)
        
        # Filter by student
        student_id = self.request.query_params.get('student')
        if student_id:
            queryset = queryset.filter(invoice__student_id=student_id)
        
        # Filter by date range
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        if date_from:
            queryset = queryset.filter(date__gte=date_from)
        if date_to:
            queryset = queryset.filter(date__lte=date_to)
        
        # Filter by payment mode
        mode = self.request.query_params.get('mode')
        if mode:
            queryset = queryset.filter(mode=mode)
        
        # Filter by who created
        created_by = self.request.query_params.get('created_by')
        if created_by:
            queryset = queryset.filter(created_by_id=created_by)
        
        return queryset.order_by('-created_at')


class PendingReceivablesView(APIView):
    """Get all pending receivables (unpaid invoices)"""
    permission_classes = [IsAuthenticated, StandardPermission]
    
    def get(self, request):
        """
        Get pending receivables with filters
        
        Query params:
        - class_id: Filter by class
        - student_id: Filter by specific student
        - status: PENDING, PARTIAL, OVERDUE (default: all pending)
        """
        from .serializers import InvoiceSerializer
        
        queryset = Invoice.objects.filter(
            school=request.user.school
        ).select_related(
            'student', 'student__current_class', 'academic_year'
        ).prefetch_related('receipts')
        
        # Filter by status (default to pending types)
        status = request.query_params.get('status')
        if status:
            queryset = queryset.filter(status=status)
        else:
            queryset = queryset.filter(status__in=['PENDING', 'PARTIAL', 'OVERDUE'])
        
        # Filter by class
        class_id = request.query_params.get('class_id')
        if class_id:
            queryset = queryset.filter(student__current_class_id=class_id)
        
        # Filter by student
        student_id = request.query_params.get('student_id')
        if student_id:
            queryset = queryset.filter(student_id=student_id)
        
        # Order by due date
        queryset = queryset.order_by('due_date')
        
        # Calculate totals
        from django.db.models import Sum
        totals = queryset.aggregate(
            total_amount=Sum('total_amount'),
            total_paid=Sum('paid_amount'),
        )
        
        total_pending = (totals['total_amount'] or 0) - (totals['total_paid'] or 0)
        
        serializer = InvoiceSerializer(queryset, many=True)
        
        return Response({
            'invoices': serializer.data,
            'summary': {
                'total_invoices': queryset.count(),
                'total_amount': float(totals['total_amount'] or 0),
                'total_paid': float(totals['total_paid'] or 0),
                'total_pending': float(total_pending),
            }
        })


class PaymentHistoryView(APIView):
    """Get complete payment history with tracking details"""
    permission_classes = [IsAuthenticated, StandardPermission]
    
    def get(self, request):
        """
        Get payment history with all tracking information
        
        Query params:
        - date_from, date_to: Date range filter
        - student_id: Filter by student
        - mode: Filter by payment mode
        """
        queryset = Receipt.objects.filter(
            school=request.user.school
        ).select_related(
            'invoice', 'invoice__student', 'created_by', 'collected_by'
        ).order_by('-created_at')
        
        # Date filters
        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to')
        if date_from:
            queryset = queryset.filter(date__gte=date_from)
        if date_to:
            queryset = queryset.filter(date__lte=date_to)
        
        # Student filter
        student_id = request.query_params.get('student_id')
        if student_id:
            queryset = queryset.filter(invoice__student_id=student_id)
        
        # Payment mode filter
        mode = request.query_params.get('mode')
        if mode:
            queryset = queryset.filter(mode=mode)
        
        serializer = ReceiptSerializer(queryset[:100], many=True)  # Limit to 100
        
        # Summary
        from django.db.models import Sum
        totals = queryset.aggregate(total=Sum('amount'))
        
        return Response({
            'receipts': serializer.data,
            'summary': {
                'total_receipts': queryset.count(),
                'total_collected': float(totals['total'] or 0),
            }
        })


class StudentFeeView(APIView):
    """
    Get complete fee summary for a specific student
    Shows all invoices (pending, paid, settled) with payment history
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request, student_id):
        """
        Get student's fee summary including:
        - All invoices with their status
        - Total fees, paid, pending amounts
        - Payment receipts history
        """
        from .serializers import InvoiceSerializer
        from students.models import Student
        from django.db.models import Sum
        
        try:
            student = Student.objects.get(id=student_id, school=request.user.school)
        except Student.DoesNotExist:
            return Response({'error': 'Student not found'}, status=404)
        
        # Get all invoices for this student
        invoices = Invoice.objects.filter(
            student=student
        ).select_related('academic_year').order_by('-created_at')
        
        # Get all receipts for this student
        receipts = Receipt.objects.filter(
            invoice__student=student
        ).select_related(
            'invoice', 'created_by', 'collected_by'
        ).order_by('-created_at')
        
        # Calculate totals
        pending_invoices = invoices.filter(status__in=['PENDING', 'PARTIAL', 'OVERDUE'])
        totals = invoices.aggregate(
            total_amount=Sum('total_amount'),
            total_paid=Sum('paid_amount'),
        )
        
        pending_totals = pending_invoices.aggregate(
            pending_amount=Sum('total_amount'),
            pending_paid=Sum('paid_amount'),
        )
        
        total_pending = (pending_totals['pending_amount'] or 0) - (pending_totals['pending_paid'] or 0)
        
        invoice_serializer = InvoiceSerializer(invoices, many=True)
        receipt_serializer = ReceiptSerializer(receipts, many=True)
        
        return Response({
            'student': {
                'id': student.id,
                'name': student.get_full_name(),
                'enrollment_number': student.enrollment_number,
                'class_name': str(student.current_class) if student.current_class else None,
                'section_name': str(student.section) if student.section else None,
            },
            'invoices': invoice_serializer.data,
            'receipts': receipt_serializer.data,
            'summary': {
                'total_invoices': invoices.count(),
                'pending_invoices': pending_invoices.count(),
                'total_amount': float(totals['total_amount'] or 0),
                'total_paid': float(totals['total_paid'] or 0),
                'total_pending': float(total_pending),
            }
        })


class SettleInvoiceView(APIView):
    """
    Settle/Waive pending amount on an invoice
    This is used when the school decides to:
    - Waive remaining balance
    - Write off bad debt
    - Apply special discount/concession
    """
    permission_classes = [IsAuthenticated, StandardPermission]
    
    def post(self, request, invoice_id):
        """
        Settle an invoice by marking it as settled
        
        Request body:
        {
            "settlement_note": "Waived due to financial hardship",
            "waive_amount": 5000  // Amount to waive (optional, defaults to full balance)
        }
        """
        from datetime import date
        
        try:
            invoice = Invoice.objects.get(id=invoice_id, school=request.user.school)
        except Invoice.DoesNotExist:
            return Response({'error': 'Invoice not found'}, status=404)
        
        if invoice.status == 'PAID':
            return Response({'error': 'Invoice is already fully paid'}, status=400)
        
        # Updated Logic: "is_settled" removed from Model.
        # We now check if fully paid, or check if settlement note exists?
        # Actually proper way is: Invoice is settled if balance is 0.
        # "Settlement" here acts as a "Discount/Waiver".
        
        balance = invoice.balance_due
        if balance <= 0:
             return Response({'error': 'Invoice has no balance due to settle'}, status=400)
             
        waive_amount = request.data.get('waive_amount')
        settlement_note = request.data.get('settlement_note', '')
        
        if not settlement_note:
            return Response({'error': 'Settlement note is required'}, status=400)

        # Logic: 
        # 1. Create a "Waiver" discount (FeeDiscount)
        # 2. Or just reduce the Total Amount? (Bad practice)
        # 3. Or add a "Credit Note"?
        # 4. Previously: invoice.discount_amount += waive.
        #    BUT `discount_amount` is not in new `Invoice` model shown in `views.py` 
        #    (Wait, let me double check Model... `models.py` lines 48-71 do NOT show discount_amount)
        #    (It shows total_amount, paid_amount, status).
        
        # Checking `backend/finance/models.py` again...
        # Lines 48-92: Invoice has total_amount, round_off_amount, paid_amount. NO discount_amount.
        # So previous code would crash! 
        
        # SOLUTION: Create a `FeeDiscount` entry and link it? 
        # Or better (simpler for now since FeeDiscount is separate): 
        # Create a "Settlement" Payment (Mode='WAIVER')?
        # Yes! Create a Receipt with mode='WAIVER'. This balances the books perfectly.
        
        if waive_amount:
            waive_amount = float(waive_amount)
            if waive_amount > float(balance):
                return Response({'error': 'Waive amount cannot exceed balance due'}, status=400)
        else:
            waive_amount = float(balance)
            
        # Create "Waiver" Receipt
        from .models import Receipt
        Receipt.objects.create(
            school=request.user.school,
            invoice=invoice,
            amount=waive_amount,
            mode='WAIVER', # Special mode
            created_by=request.user,
            remarks=f"Settlement: {settlement_note}"
        )
        
        # Update Invoice Paid Amount logic is triggered by Receipt? 
        # No, my Service usually handles it.
        # Let's use FeeService.process_payment with mode='WAIVER'.
        
        from .services import FeeService
        from decimal import Decimal
        
        FeeService.process_payment(
            invoice=invoice,
            amount=Decimal(str(waive_amount)),
            mode='WAIVER',
            created_by=request.user,
            transaction_id=f"SETTLE-{date.today()}"
        )   
        
        return Response({
            'success': True,
            'message': 'Invoice settled successfully via Waiver Receipt',
            'invoice_id': invoice.invoice_id,
            'waived_amount': float(waive_amount),
            'settled_by': request.user.get_full_name(),
        })


class StudentFeeSummaryView(APIView):
    """Get a quick summary of all students' pending fees (for dashboard/reports)"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """
        Get summary of pending fees per student
        
        Query params:
        - class_id: Filter by class
        - min_pending: Minimum pending amount to show
        """
        from django.db.models import Sum, F, OuterRef, Subquery
        from students.models import Student
        
        # Base query for students with pending invoices
        students_with_pending = Student.objects.filter(
            school=request.user.school,
            is_active=True
        ).annotate(
            total_invoiced=Sum('invoice__total_amount'),
            total_paid=Sum('invoice__paid_amount'),
        ).annotate(
            pending_amount=F('total_invoiced') - F('total_paid')
        ).filter(
            pending_amount__gt=0
        ).order_by('-pending_amount')
        
        # Filter by class
        class_id = request.query_params.get('class_id')
        if class_id:
            students_with_pending = students_with_pending.filter(current_class_id=class_id)

        # Filter by section
        section_id = request.query_params.get('section_id')
        if section_id:
            students_with_pending = students_with_pending.filter(section_id=section_id)
        
        # Filter by minimum pending
        min_pending = request.query_params.get('min_pending')
        if min_pending:
            students_with_pending = students_with_pending.filter(pending_amount__gte=float(min_pending))
        
        # Limit to 100
        students_with_pending = students_with_pending[:100]
        
        result = []
        for student in students_with_pending:
            result.append({
                'id': student.id,
                'name': student.get_full_name(),
                'enrollment_number': student.enrollment_number,
                'class_name': str(student.current_class) if student.current_class else None,
                'total_invoiced': float(student.total_invoiced or 0),
                'total_paid': float(student.total_paid or 0),
                'pending_amount': float(student.pending_amount or 0),
            })
        
        # Overall summary
        totals = Invoice.objects.filter(
            school=request.user.school,
            status__in=['PENDING', 'PARTIAL', 'OVERDUE']
        ).aggregate(
            total=Sum('total_amount'),
            paid=Sum('paid_amount'),
        )
        
        return Response({
            'students': result,
            'summary': {
                'students_with_pending': len(result),
                'total_pending': float((totals['total'] or 0) - (totals['paid'] or 0)),
            }
        })
