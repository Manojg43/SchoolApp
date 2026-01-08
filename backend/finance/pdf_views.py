from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.http import FileResponse
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
import io
from .models import Salary, Receipt

# GeneratePayslipPDF moved to views_pdf.py (DownloadPayslipView) using xhtml2pdf

class GenerateReceiptPDF(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, receipt_no):
         try:
            receipt = Receipt.objects.get(receipt_no=receipt_no, school=request.user.school)
            buffer = io.BytesIO()
            p = canvas.Canvas(buffer, pagesize=A4)
            width, height = A4
            
            p.setFont("Helvetica-Bold", 20)
            p.drawCentredString(width/2, height - 50, "FEE RECEIPT")
            
            p.setFont("Helvetica", 12)
            y = height - 150
            p.drawString(100, y, f"Receipt No: {receipt.receipt_no}"); y -= 20
            p.drawString(100, y, f"Date: {receipt.date}"); y -= 20
            p.drawString(100, y, f"Amount: Rs. {receipt.amount}"); y -= 20
             
            p.showPage()
            p.save()
            buffer.seek(0)
            return FileResponse(buffer, as_attachment=False, filename=f'Receipt_{receipt_no}.pdf')
         except Exception as e:
            return Response({'error': str(e)}, status=400)
