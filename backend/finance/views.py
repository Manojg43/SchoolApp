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

        pisa_status = pisa.CreatePDF(html_string, dest=response)
        
        if pisa_status.err:
            return Response({'error': 'PDF generation failed'}, status=500)
            
        return response

