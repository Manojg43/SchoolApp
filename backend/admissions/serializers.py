from rest_framework import serializers
from .models import (
    WorkflowTemplate, WorkflowStage, AssessmentTemplate,
    Enquiry, EnquiryStageProgress, EnquiryAssessmentResult, EnquiryDocument
)


# ============================================
# WORKFLOW SERIALIZERS
# ============================================

class AssessmentTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = AssessmentTemplate
        fields = ['id', 'name', 'assessment_type', 'max_marks', 'passing_marks', 'is_mandatory', 'instructions']


class WorkflowStageSerializer(serializers.ModelSerializer):
    assessments = AssessmentTemplateSerializer(many=True, read_only=True)
    
    class Meta:
        model = WorkflowStage
        fields = [
            'id', 'name', 'order', 'is_required', 
            'requires_documents', 'requires_payment', 'requires_assessment',
            'required_approver_role', 'auto_advance', 'assessments'
        ]


class WorkflowStageWritableSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating stages within a workflow"""
    class Meta:
        model = WorkflowStage
        fields = [
            'name', 'order', 'is_required', 
            'requires_documents', 'requires_payment', 'requires_assessment',
            'required_approver_role', 'auto_advance'
        ]


class WorkflowTemplateSerializer(serializers.ModelSerializer):
    stages = WorkflowStageSerializer(many=True, read_only=True)
    stages_count = serializers.SerializerMethodField()
    
    # For write operations - accept stages as nested array
    stages_data = WorkflowStageWritableSerializer(many=True, write_only=True, required=False, source='stages')
    
    class Meta:
        model = WorkflowTemplate
        fields = [
            'id', 'name', 'workflow_type', 'description', 
            'is_active', 'is_default', 'stages', 'stages_count', 'stages_data'
        ]
    
    def get_stages_count(self, obj):
        return obj.stages.count()
    
    def create(self, validated_data):
        stages_data = validated_data.pop('stages', [])
        workflow = WorkflowTemplate.objects.create(**validated_data)
        
        # Create stages
        for stage_data in stages_data:
            WorkflowStage.objects.create(template=workflow, **stage_data)
        
        return workflow
    
    def update(self, instance, validated_data):
        stages_data = validated_data.pop('stages', None)
        
        # Update workflow fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # If stages provided, replace existing stages
        if stages_data is not None:
            instance.stages.all().delete()
            for stage_data in stages_data:
                WorkflowStage.objects.create(template=instance, **stage_data)
        
        return instance


class WorkflowTemplateListSerializer(serializers.ModelSerializer):
    """Lighter serializer for list views"""
    stages_count = serializers.SerializerMethodField()
    
    class Meta:
        model = WorkflowTemplate
        fields = ['id', 'name', 'workflow_type', 'is_active', 'is_default', 'stages_count']
    
    def get_stages_count(self, obj):
        return obj.stages.count()


# ============================================
# ENQUIRY SERIALIZERS
# ============================================

class EnquiryDocumentSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.CharField(source='uploaded_by.get_full_name', read_only=True)
    verified_by_name = serializers.CharField(source='verified_by.get_full_name', read_only=True)
    
    class Meta:
        model = EnquiryDocument
        fields = [
            'id', 'document_type', 'document_name', 'file', 
            'is_verified', 'verified_by', 'verified_by_name', 'verified_at',
            'verification_remarks', 'uploaded_at', 'uploaded_by', 'uploaded_by_name'
        ]
        read_only_fields = ['verified_by', 'verified_at', 'uploaded_at', 'uploaded_by']


class EnquiryAssessmentResultSerializer(serializers.ModelSerializer):
    assessment_name = serializers.CharField(source='assessment.name', read_only=True)
    assessment_type = serializers.CharField(source='assessment.get_assessment_type_display', read_only=True)
    max_marks = serializers.IntegerField(source='assessment.max_marks', read_only=True)
    passing_marks = serializers.IntegerField(source='assessment.passing_marks', read_only=True)
    evaluated_by_name = serializers.CharField(source='evaluated_by.get_full_name', read_only=True)
    
    class Meta:
        model = EnquiryAssessmentResult
        fields = [
            'id', 'assessment', 'assessment_name', 'assessment_type',
            'max_marks', 'passing_marks', 'marks_obtained', 'is_passed',
            'evaluated_by', 'evaluated_by_name', 'evaluated_at', 'remarks'
        ]
        read_only_fields = ['evaluated_by', 'evaluated_at']


class EnquiryStageProgressSerializer(serializers.ModelSerializer):
    stage_name = serializers.CharField(source='stage.name', read_only=True)
    stage_order = serializers.IntegerField(source='stage.order', read_only=True)
    processed_by_name = serializers.CharField(source='processed_by.get_full_name', read_only=True)
    
    class Meta:
        model = EnquiryStageProgress
        fields = [
            'id', 'stage', 'stage_name', 'stage_order', 'status',
            'started_at', 'processed_by', 'processed_by_name', 'processed_at', 'remarks'
        ]


class EnquirySerializer(serializers.ModelSerializer):
    """Full serializer for detail view"""
    filled_by_name = serializers.CharField(source='filled_by.get_full_name', read_only=True)
    converted_by_name = serializers.CharField(source='converted_by.get_full_name', read_only=True)
    class_name = serializers.CharField(source='class_applied.name', read_only=True)
    current_stage_name = serializers.CharField(source='current_stage.name', read_only=True)
    workflow_name = serializers.CharField(source='workflow.name', read_only=True)
    
    documents = EnquiryDocumentSerializer(many=True, read_only=True)
    stage_progress = EnquiryStageProgressSerializer(many=True, read_only=True)
    assessment_results = EnquiryAssessmentResultSerializer(many=True, read_only=True)
    
    full_name = serializers.SerializerMethodField()
    age = serializers.SerializerMethodField()
    
    class Meta:
        model = Enquiry
        fields = [
            'id', 'enquiry_id', 'status', 'priority',
            # Student
            'first_name', 'last_name', 'full_name', 'date_of_birth', 'age', 'gender', 'photo',
            # Academic
            'class_applied', 'class_name', 'academic_year',
            'previous_school_name', 'previous_class', 'previous_percentage',
            # Parent
            'parent_name', 'parent_mobile', 'parent_email', 'parent_occupation', 'address',
            # Workflow
            'workflow', 'workflow_name', 'current_stage', 'current_stage_name',
            # Tracking
            'filled_by', 'filled_by_name', 'filled_at', 'filled_via', 'referred_by',
            # Conversion
            'converted_student', 'converted_at', 'converted_by', 'converted_by_name',
            # Notes
            'notes', 'rejection_reason',
            # Related
            'documents', 'stage_progress', 'assessment_results',
            # Timestamps
            'created_at', 'updated_at'
        ]
        read_only_fields = ['enquiry_id', 'filled_by', 'filled_at', 'converted_at', 'converted_by']
    
    def get_full_name(self, obj):
        return obj.get_full_name()
    
    def get_age(self, obj):
        from datetime import date
        today = date.today()
        born = obj.date_of_birth
        return today.year - born.year - ((today.month, today.day) < (born.month, born.day))


class EnquiryListSerializer(serializers.ModelSerializer):
    """Lighter serializer for list views"""
    filled_by_name = serializers.CharField(source='filled_by.get_full_name', read_only=True)
    class_name = serializers.CharField(source='class_applied.name', read_only=True)
    current_stage_name = serializers.CharField(source='current_stage.name', read_only=True)
    full_name = serializers.SerializerMethodField()
    documents_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Enquiry
        fields = [
            'id', 'enquiry_id', 'full_name', 'first_name', 'last_name',
            'class_applied', 'class_name', 'parent_mobile',
            'status', 'priority', 'current_stage_name',
            'filled_by', 'filled_by_name', 'filled_via', 'filled_at',
            'documents_count', 'created_at'
        ]
    
    def get_full_name(self, obj):
        return obj.get_full_name()
    
    def get_documents_count(self, obj):
        return obj.documents.count()


class EnquiryCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating enquiry from Mobile"""
    
    class Meta:
        model = Enquiry
        fields = [
            # Student
            'first_name', 'last_name', 'date_of_birth', 'gender', 'photo',
            # Academic
            'class_applied', 'academic_year',
            'previous_school_name', 'previous_class', 'previous_percentage',
            # Parent
            'parent_name', 'parent_mobile', 'parent_email', 'parent_occupation', 'address',
            # Optional
            'referred_by', 'notes', 'priority'
        ]
    
    def create(self, validated_data):
        request = self.context.get('request')
        school = request.user.school
        
        # Set default workflow
        default_workflow = WorkflowTemplate.objects.filter(
            school=school, 
            workflow_type='ADMISSION', 
            is_default=True,
            is_active=True
        ).first()
        
        # Get current academic year
        from schools.models import AcademicYear
        if not validated_data.get('academic_year'):
            validated_data['academic_year'] = AcademicYear.objects.filter(
                school=school, is_active=True
            ).first()
        
        # 'school' comes from perform_create -> serializer.save(school=...), so it is in validated_data
        # We ensure it's there, but don't pass it twice.
        if 'school' not in validated_data:
            validated_data['school'] = school
            
        # Ensure filled_by is set but not duplicated
        if 'filled_by' not in validated_data:
            validated_data['filled_by'] = request.user
            
        enquiry = Enquiry.objects.create(
            workflow=default_workflow,
            filled_via='MOBILE' if request.META.get('HTTP_X_MOBILE_APP') else 'WEB',
            **validated_data
        )
        
        # Initialize stage progress
        if default_workflow:
            first_stage = default_workflow.stages.order_by('order').first()
            if first_stage:
                enquiry.current_stage = first_stage
                enquiry.save()
                EnquiryStageProgress.objects.create(
                    enquiry=enquiry,
                    stage=first_stage,
                    status='PENDING'
                )
        
        return enquiry
