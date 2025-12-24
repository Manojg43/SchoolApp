from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.http import FileResponse, Http404
from django.template.loader import render_to_string
from django.core.files.base import ContentFile
from django.utils import timezone
# from weasyprint import HTML  # TODO: Install GTK libraries on Windows - see WEASYPRINT_WINDOWS_ISSUE.md
import qrcode
from io import BytesIO
import datetime

from .models import Certificate, CertificateTemplate, CERTIFICATE_TYPES
from students.models import Student
from core.permissions import StandardPermission


def generate_qr_code(verification_code):
    """Generate QR code image from verification code"""
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    
    # Create verification URL
    verification_url = f"https://yourschool.com/verify/{verification_code}"
    qr.add_data(verification_url)
    qr.make(fit=True)
    
    # Create image
    img = qr.make_image(fill_color="black", back_color="white")
    
    # Save to BytesIO
    buffer = BytesIO()
    img.save(buffer, 'PNG')
    buffer.seek(0)
    
    return buffer


def generate_certificate_pdf(certificate, template, student, school, user):
    """Generate PDF certificate from HTML template"""
    
    # Prepare certificate data
    certificate_data = {
        # Student details
        'student_name': student.get_full_name(),
        'enrollment_number': student.enrollment_number,
        'father_name': student.father_name or 'N/A',
        'mother_name': student.mother_name or 'N/A',
        'dob': student.date_of_birth,
        'gender': student.get_gender_display() if hasattr(student, 'get_gender_display') else student.gender,
        
        # Class details
        'class_name': student.current_class.name if student.current_class else 'N/A',
        'section': student.section.name if student.section else 'N/A',
        'academic_year': str(student.academic_year) if student.academic_year else 'N/A',
        
        # School details
        'school_name': school.name,
        'school_address': getattr(school, 'address', ''),
        'school_logo': None,  # TODO: Add school logo field
        'principal_signature': None,  # TODO: Add principal signature field
        'school_seal': None,  # TODO: Add school seal field
        
        # Certificate details
        'certificate_no': certificate.certificate_no,
        'verification_code': certificate.verification_code,
        'issue_date': certificate.issued_date,
        'purpose': certificate.purpose,
        
        # Template settings
        'header_color': template.header_color if template else '#000000',
        'font_family': template.font_family if template else 'Times New Roman',
        'include_logo': template.include_logo if template else True,
        'include_signature': template.include_signature if template else True,
        'include_seal': template.include_seal if template else True,
        'include_qr_code': template.include_qr_code if template else True,
    }
    
    # Add certificate-specific data
    if certificate.type == 'TC':
        certificate_data.update({
            'admission_date': getattr(student, 'admission_date', certificate.issued_date),
            'conduct': 'Good',  # TODO: Add conduct field to student model
            'character': 'Good',  # TODO: Add character field to student model
        })
    elif certificate.type == 'FEE_CLEARANCE':
        # TODO: Fetch actual fee details from invoices
        certificate_data.update({
            'fee_details': [],
            'total_amount': 0,
            'total_paid': 0,
        })
    
    # Store certificate data snapshot
    certificate.certificate_data = certificate_data
    
    # Generate QR code
    if template and template.include_qr_code:
        qr_buffer = generate_qr_code(certificate.verification_code)
        certificate.qr_code_image.save(
            f'qr_{certificate.certificate_no}.png',
            ContentFile(qr_buffer.read()),
            save=False
        )
        
        # Add QR code URL to context (for template rendering)
        if certificate.qr_code_image:
            certificate_data['qr_code_image'] = certificate.qr_code_image.url
    
    # Determine template file
    template_map = {
        'BONAFIDE': 'certificates/bonafide.html',
        'TC': 'certificates/transfer_certificate.html',
        'LC': 'certificates/leaving_certificate.html',
        'FEE_CLEARANCE': 'certificates/fee_clearance.html',
        'CHARACTER': 'certificates/character.html',
        'CONDUCT': 'certificates/conduct.html',
        'STUDY': 'certificates/bonafide.html',  # Reuse bonafide template
        'ATTENDANCE': 'certificates/bonafide.html',  # Reuse bonafide template
    }
    
    template_path = template_map.get(certificate.type, 'certificates/bonafide.html')
    
    # Render HTML
    try:
        html_string = render_to_string(template_path, certificate_data)
    except Exception as e:
        # Fallback to base template if specific template not found
        html_string = render_to_string('certificates/base_certificate.html', certificate_data)
    
    # Generate PDF using xhtml2pdf (fallback for Windows without GTK)
    from xhtml2pdf import pisa
    from io import BytesIO
    
    pdf_buffer = BytesIO()
    pisa_status = pisa.CreatePDF(html_string, dest=pdf_buffer, encoding='utf-8')
    
    if pisa_status.err:
        raise Exception(f"PDF generation failed: {pisa_status.err}")
    
    pdf_file = pdf_buffer.getvalue()
    
    # Save PDF
    certificate.pdf_file.save(
        f'{certificate.certificate_no}.pdf',
        ContentFile(pdf_file),
        save=False
    )
    
    # Save certificate with all updates
    certificate.save()
    
    return pdf_file


class GenerateCertificatePDF(APIView):
    """Generate certificate PDF for a student"""
    permission_classes = [IsAuthenticated, StandardPermission]
    
    def post(self, request, student_id, cert_type):
        try:
            # Validate certificate type
            valid_types = [choice[0] for choice in CERTIFICATE_TYPES]
            if cert_type.upper() not in valid_types:
                return Response({
                    'error': f'Invalid certificate type. Valid types: {", ".join(valid_types)}'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Get student
            student = Student.objects.select_related(
                'school', 'current_class', 'section', 'academic_year'
            ).get(id=student_id, school=request.user.school)
            
            # Get template for this certificate type
            template = CertificateTemplate.objects.filter(
                school=request.user.school,
                type=cert_type.upper(),
                is_active=True
            ).first()
            
            # Get purpose from request
            purpose = request.data.get('purpose', '')
            
            # Create certificate record
            certificate = Certificate.objects.create(
                school=request.user.school,
                student=student,
                template=template,
                type=cert_type.upper(),
                purpose=purpose,
                issued_by=request.user
            )
            
            # Generate PDF
            generate_certificate_pdf(certificate, template, student, request.user.school, request.user)
            
            return Response({
                'success': True,
                'certificate_id': certificate.id,
                'certificate_no': certificate.certificate_no,
                'verification_code': certificate.verification_code,
                'pdf_url': certificate.pdf_file.url if certificate.pdf_file else None,
                'message': 'Certificate generated successfully'
            }, status=status.HTTP_201_CREATED)
            
        except Student.DoesNotExist:
            return Response({
                'error': 'Student not found'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class GenerateManualCertificatePDF(APIView):
    """Generate certificate PDF using enrollment number"""
    permission_classes = [IsAuthenticated, StandardPermission]
    
    def get(self, request):
        try:
            enrollment_number = request.GET.get('enrollment_number')
            cert_type = request.GET.get('type', 'BONAFIDE').upper()
            purpose = request.GET.get('purpose', '')
            
            if not enrollment_number:
                return Response({
                    'error': 'Enrollment number is required'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Get student
            student = Student.objects.select_related(
                'school', 'current_class', 'section', 'academic_year'
            ).filter(
                enrollment_number=enrollment_number,
                school=request.user.school
            ).first()
            
            if not student:
                return Response({
                    'error': 'Student not found with this enrollment number'
                }, status=status.HTTP_404_NOT_FOUND)
            
            # Get template
            template = CertificateTemplate.objects.filter(
                school=request.user.school,
                type=cert_type,
                is_active=True
            ).first()
            
            # Create certificate
            certificate = Certificate.objects.create(
                school=request.user.school,
                student=student,
                template=template,
                type=cert_type,
                purpose=purpose,
                issued_by=request.user
            )
            
            # Generate PDF
            pdf_content = generate_certificate_pdf(
                certificate, template, student, request.user.school, request.user
            )
            
            # Return PDF file
            buffer = BytesIO(pdf_content)
            buffer.seek(0)
            
            return FileResponse(
                buffer,
                as_attachment=False,
                filename=f'{student.enrollment_number}_{cert_type}.pdf',
                content_type='application/pdf'
            )
            
        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class DownloadCertificatePDF(APIView):
    """Download existing certificate PDF"""
    permission_classes = [IsAuthenticated, StandardPermission]
    
    def get(self, request, certificate_id):
        try:
            certificate = Certificate.objects.select_related(
                'student', 'school'
            ).get(
                id=certificate_id,
                school=request.user.school
            )
            
            if not certificate.pdf_file:
                return Response({
                    'error': 'PDF not generated for this certificate'
                }, status=status.HTTP_404_NOT_FOUND)
            
            if certificate.is_revoked:
                return Response({
                    'error': 'This certificate has been revoked',
                    'revoked_reason': certificate.revoked_reason,
                    'revoked_date': certificate.revoked_date
                }, status=status.HTTP_403_FORBIDDEN)
            
            return FileResponse(
                certificate.pdf_file.open('rb'),
                as_attachment=True,
                filename=f'{certificate.certificate_no}.pdf',
                content_type='application/pdf'
            )
            
        except Certificate.DoesNotExist:
            return Response({
                'error': 'Certificate not found'
            }, status=status.HTTP_404_NOT_FOUND)


class VerifyCertificate(APIView):
    """Public endpoint to verify certificate authenticity"""
    permission_classes = []  # Public endpoint
    
    def get(self, request, verification_code):
        try:
            certificate = Certificate.objects.select_related(
                'student', 'school', 'issued_by'
            ).get(verification_code=verification_code)
            
            if certificate.is_revoked:
                return Response({
                    'valid': False,
                    'status': 'REVOKED',
                    'message': 'This certificate has been revoked',
                    'revoked_reason': certificate.revoked_reason,
                    'revoked_date': certificate.revoked_date
                })
            
            # Check if expired
            if certificate.valid_until and certificate.valid_until < timezone.now().date():
                return Response({
                    'valid': False,
                    'status': 'EXPIRED',
                    'message': 'This certificate has expired',
                    'valid_until': certificate.valid_until
                })
            
            return Response({
                'valid': True,
                'status': 'VALID',
                'certificate_no': certificate.certificate_no,
                'type': certificate.get_type_display(),
                'student_name': certificate.student.get_full_name(),
                'school_name': certificate.school.name,
                'issued_date': certificate.issued_date,
                'issued_by': certificate.issued_by.get_full_name() if certificate.issued_by else 'N/A',
                'valid_until': certificate.valid_until
            })
            
        except Certificate.DoesNotExist:
            return Response({
                'valid': False,
                'status': 'NOT_FOUND',
                'message': 'Certificate not found with this verification code'
            }, status=status.HTTP_404_NOT_FOUND)
