from rest_framework import serializers
from .models import Certificate, CertificateTemplate, CERTIFICATE_TYPES


class CertificateTemplateSerializer(serializers.ModelSerializer):
    """Serializer for certificate templates"""
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    
    class Meta:
        model = CertificateTemplate
        fields = [
            'id', 'school', 'type', 'type_display', 'name', 'html_content',
            'include_logo', 'include_signature', 'include_seal', 'include_qr_code',
            'header_color', 'font_family', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class CertificateSerializer(serializers.ModelSerializer):
    """Serializer for issued certificates"""
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    student_enrollment =serializers.CharField(source='student.enrollment_number', read_only=True)
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    issued_by_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Certificate
        fields = [
            'id', 'certificate_no', 'verification_code', 'type', 'type_display',
            'purpose', 'issued_date', 'valid_until', 
            'student', 'student_name', 'student_enrollment',
            'school', 'template', 
            'pdf_file', 'qr_code_image', 'certificate_data',
            'is_revoked', 'revoked_reason', 'revoked_date', 'revoked_by',
            'issued_by', 'issued_by_name',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'certificate_no', 'verification_code', 'qr_code_image', 
            'pdf_file', 'created_at', 'updated_at'
        ]
    
    def get_issued_by_name(self, obj):
        """Get the name of the user who issued the certificate"""
        if obj.issued_by:
            return obj.issued_by.get_full_name()
        return None


class CertificateListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for certificate lists"""
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    
    class Meta:
        model = Certificate
        fields = [
            'id', 'certificate_no', 'type', 'type_display',
            'student_name', 'issued_date', 'is_revoked', 'created_at'
        ]


class CertificateVerificationSerializer(serializers.Serializer):
    """Serializer for certificate verification response"""
    valid = serializers.BooleanField()
    status = serializers.ChoiceField(choices=['VALID', 'REVOKED', 'EXPIRED', 'NOT_FOUND'])
    certificate_no = serializers.CharField(required=False)
    type = serializers.CharField(required=False)
    student_name = serializers.CharField(required=False)
    school_name = serializers.CharField(required=False)
    issued_date = serializers.DateField(required=False)
    issued_by = serializers.CharField(required=False)
    message = serializers.CharField(required=False)
