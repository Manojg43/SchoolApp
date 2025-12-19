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

class FeeCategoryViewSet(viewsets.ModelViewSet):
    queryset = FeeCategory.objects.all()
    serializer_class = FeeCategorySerializer
    permission_classes = [StandardPermission]

    def get_queryset(self):
        queryset = FeeCategory.objects.all()
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

    def get_queryset(self):
        queryset = FeeStructure.objects.all()
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




