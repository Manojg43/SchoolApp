from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.http import HttpResponse
from finance.models import Salary, StaffSalaryStructure
from core.models import CoreUser
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
import io

from django.core.signing import TimestampSigner, BadSignature, SignatureExpired

signer = TimestampSigner()

class GetPayslipLinkView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        # Generate a signed token valid for 5 minutes
        # Data: "salary_id:user_id"
        
        # Allow if staff matches OR if user is Admin/Principal of the same school
        try:
            salary = Salary.objects.get(id=pk)
            
            # Check permission
            is_owner = (salary.staff == request.user)
            is_admin = (
                request.user.role in ['SCHOOL_ADMIN', 'PRINCIPAL'] and 
                salary.school == request.user.school
            )
            
            if not (is_owner or is_admin):
                return Response({'error': 'Permission Denied'}, status=403)
                
        except Salary.DoesNotExist:
            return Response({'error': 'Salary not found'}, status=404)

        token = signer.sign(f"{salary.id}:{request.user.id}")
        
        # Build URL
        # Target: /api/finance/salary/<pk>/download/?token=<token>
        path = f"/api/finance/salary/{salary.id}/download/?token={token}"
        full_url = request.build_absolute_uri(path)
        
        return Response({'url': full_url})
        
import logging
logger = logging.getLogger(__name__)

class DownloadPayslipView(APIView):
    # Allow Any - We verify Signature manually
    permission_classes = [] 

    def get(self, request, pk):
        token = request.query_params.get('token')
        
        user = None
        salary_id = pk
        
        if request.user.is_authenticated:
            user = request.user
        elif token:
            try:
                # Verify Token (Max age 300s = 5 mins)
                original = signer.unsign(token, max_age=300)
                sid, uid = original.split(':')
                
                if str(sid) != str(pk):
                    return Response({'error': 'Invalid Token Scope'}, status=403)
                    
                user = CoreUser.objects.get(id=uid)
            except (SignatureExpired, BadSignature):
                return Response({'error': 'Invalid or Expired Link'}, status=403)
            except CoreUser.DoesNotExist:
                return Response({'error': 'User not found'}, status=404)
        else:
            return Response({'error': 'Authentication Required'}, status=401)
            
        # Proceed with Generation
        try:
            salary = Salary.objects.get(id=salary_id)
            
            # Verify Access again for the authenticated/token user
            is_owner = (salary.staff == user)
            is_admin = (
                user.role in ['SCHOOL_ADMIN', 'PRINCIPAL'] and 
                salary.school == user.school
            )
            
            if not (is_owner or is_admin):
                 return Response({'error': 'Permission Denied'}, status=403)
                 
        except Salary.DoesNotExist:
            return Response({'error': 'Salary record not found'}, status=404)
        
        # Prepare Context
        from django.conf import settings
        from django.template.loader import render_to_string
        from xhtml2pdf import pisa
        from datetime import datetime
        
        # Parse earnings/deductions if they are JSON strings
        earnings = salary.earnings # Fixed from allowances
        deductions = salary.deductions
        
        context = {
            'school': user.school,
            'salary': salary,
            'earnings': earnings,
            'deductions': deductions,
            'current_date': datetime.now(),
            'amount_in_words': f"{salary.net_salary} Only", # Placeholder
            'base_url': request.build_absolute_uri('/')[:-1]
        }
        
        html = render_to_string('finance/payslip.html', context)
        buffer = io.BytesIO()
        pisa_status = pisa.CreatePDF(html, dest=buffer)
        
        if pisa_status.err:
            return Response({'error': 'PDF Generation Error'}, status=500)
            
        buffer.seek(0)
        response = HttpResponse(buffer, content_type='application/pdf')
        filename = f"Payslip_{salary.month.strftime('%b%Y')}.pdf"
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response
