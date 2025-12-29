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
        salary = Salary.objects.get(id=pk, staff=request.user) # Verify ownership
        token = signer.sign(f"{salary.id}:{request.user.id}")
        
        # Build URL
        # Assuming typical setup, we return relative or absolute
        # For Linking.openURL, we need full URL.
        # We can construct it from request.build_absolute_uri
        
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
            
        # Proceed with Generation (Code same as before)
        try:
            salary = Salary.objects.get(id=salary_id, staff=user)
        except Salary.DoesNotExist:
            return Response({'error': 'Salary record not found'}, status=404)
        
        # Create PDF Buffer
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4)
        elements = []
        
        styles = getSampleStyleSheet()
        title_style = styles['Heading1']
        title_style.alignment = 1 # Center
        
        # Header
        school_name = user.school.name if user.school else "School App"
        elements.append(Paragraph(school_name, title_style))
        elements.append(Paragraph(f"Payslip for {salary.month.strftime('%B %Y')}", styles['Heading2']))
        elements.append(Spacer(1, 20))
        
        # Staff Details
        details_data = [
            ["Staff Name:", f"{user.first_name} {user.last_name}"],
            ["Designation:", getattr(user.staff_profile, 'designation', 'Staff') if hasattr(user, 'staff_profile') else 'Staff'],
            ["Department:", getattr(user.staff_profile, 'department', '-') if hasattr(user, 'staff_profile') else '-'],
            ["Present Days:", str(salary.present_days)]
        ]
        
        t_details = Table(details_data, colWidths=[150, 300])
        t_details.setStyle(TableStyle([
            ('FONTNAME', (0,0), (0, -1), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ]))
        elements.append(t_details)
        elements.append(Spacer(1, 20))
        
        # Salary Table
        data = [
            ["Earnings", "Amount (INR)", "Deductions", "Amount (INR)"],
            ["Base Salary", str(salary.base_salary), "Tax/TDS", "0.00"],
            ["Allowances", str(salary.allowances), "PF", "0.00"],
            ["Bonus", str(salary.bonus), "Other Deductions", str(salary.deductions)],
            ["", "", "", ""],
            ["Gross Salary", str(salary.base_salary + salary.allowances + salary.bonus), "Total Deductions", str(salary.deductions)],
        ]
        
        t = Table(data)
        t.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.grey),
            ('TEXTCOLOR', (0,0), (-1,0), colors.whitesmoke),
            ('ALIGN', (0,0), (-1,-1), 'CENTER'),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0,0), (-1,0), 12),
            ('BACKGROUND', (0,-1), (-1,-1), colors.lightgrey),
            ('GRID', (0,0), (-1,-1), 1, colors.black),
        ]))
        elements.append(t)
        elements.append(Spacer(1, 20))
        
        # Net Salary
        net_style = ParagraphStyle('Net', parent=styles['Heading2'], alignment=2) # Right
        elements.append(Paragraph(f"Net Salary: INR {salary.net_salary}", net_style))
        elements.append(Spacer(1, 40))
        
        # Footer
        footer = Paragraph("This is a computer generated payslip and does not require signature.", styles['Italic'])
        elements.append(footer)
        
        doc.build(elements)
        
        buffer.seek(0)
        response = HttpResponse(buffer, content_type='application/pdf')
        filename = f"Payslip_{salary.month.strftime('%b%Y')}.pdf"
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response
