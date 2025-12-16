from django.contrib import admin
from .models import Certificate, CertificateTemplate

@admin.register(CertificateTemplate)
class CertificateTemplateAdmin(admin.ModelAdmin):
    list_display = ('name', 'school', 'type')

@admin.register(Certificate)
class CertificateAdmin(admin.ModelAdmin):
    list_display = ('certificate_no', 'school', 'student', 'type', 'issued_date')
    list_filter = ('type', 'school')
    search_fields = ('certificate_no', 'student__first_name')
