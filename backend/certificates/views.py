from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.http import FileResponse
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
import io
import datetime
from .models import Certificate
from students.models import Student

def generate_pdf(buffer, student, type, user):
    p = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4
    
    # Header
    p.setFont("Helvetica-Bold", 24)
    p.drawCentredString(width/2, height - 100, user.school.name.upper())
    
    p.setFont("Helvetica", 12)
    p.drawCentredString(width/2, height - 130, "Certificate of " + type.upper())
    
    # Content
    content_y = height - 200
    p.drawString(100, content_y, f"This is to certify that {student.first_name} {student.last_name}")
    p.drawString(100, content_y - 20, f"Enrollment No: {student.enrollment_number}")
    if student.current_class:
        p.drawString(100, content_y - 40, f"Class: {student.current_class.name} {student.section}")
    p.drawString(100, content_y - 60, f"DOB: {student.date_of_birth}")
    
    # Footer
    p.drawString(100, 100, "Date: " + str(datetime.date.today()))
    p.drawString(400, 100, "Principal Signature")
    
    p.showPage()
    p.save()

class GenerateCertificatePDF(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, student_id, type):
        try:
            student = Student.objects.get(id=student_id, school=request.user.school)
            buffer = io.BytesIO()
            generate_pdf(buffer, student, type, request.user)
            
            buffer.seek(0)
            return FileResponse(buffer, as_attachment=False, filename=f'{student.enrollment_number}_{type}.pdf')
            
        except Exception as e:
            return Response({'error': str(e)}, status=400)

class GenerateManualCertificatePDF(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            enrollment_number = request.GET.get('enrollment_number')
            cert_type = request.GET.get('type', 'bonafide')
            
            if not enrollment_number:
                return Response({'error': 'Enrollment number is required'}, status=400)

            student = Student.objects.filter(
                enrollment_number=enrollment_number, 
                school=request.user.school
            ).first()

            if not student:
                return Response({'error': 'Student not found with this enrollment number'}, status=404)

            buffer = io.BytesIO()
            generate_pdf(buffer, student, cert_type, request.user)
            
            buffer.seek(0)
            return FileResponse(buffer, as_attachment=False, filename=f'{student.enrollment_number}_{cert_type}.pdf')

        except Exception as e:
            return Response({'error': str(e)}, status=400)
