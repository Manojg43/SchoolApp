from django.urls import path
from .views import GenerateCertificatePDF
import datetime

urlpatterns = [
    path('generate/<int:student_id>/<str:type>/', GenerateCertificatePDF.as_view(), name='generate-certificate'),
]
