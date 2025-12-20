from django.urls import path
from .views import GenerateCertificatePDF, GenerateManualCertificatePDF

urlpatterns = [
    path('generate/manual/', GenerateManualCertificatePDF.as_view(), name='generate-certificate-manual'),
    path('generate/<int:student_id>/<str:type>/', GenerateCertificatePDF.as_view(), name='generate-certificate'),
]
