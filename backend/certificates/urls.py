from django.urls import path
from .views import (
    GenerateCertificatePDF,
    GenerateManualCertificatePDF,
    DownloadCertificatePDF,
    VerifyCertificate
)

urlpatterns = [
    # Generate certificate for a specific student
    path('generate/<int:student_id>/<str:cert_type>/', GenerateCertificatePDF.as_view(), name='generate-certificate'),
    
    # Generate certificate using enrollment number (manual)
    path('generate-manual/', GenerateManualCertificatePDF.as_view(), name='generate-manual-certificate'),
    
    # Download existing certificate
    path('download/<int:certificate_id>/', DownloadCertificatePDF.as_view(), name='download-certificate'),
    
    # Public verification endpoint
    path('verify/<str:verification_code>/', VerifyCertificate.as_view(), name='verify-certificate'),
]
