from django.contrib import admin
from .models import (
    WorkflowTemplate, WorkflowStage, AssessmentTemplate,
    Enquiry, EnquiryStageProgress, EnquiryAssessmentResult, EnquiryDocument
)


class WorkflowStageInline(admin.TabularInline):
    model = WorkflowStage
    extra = 1
    ordering = ['order']


class AssessmentTemplateInline(admin.TabularInline):
    model = AssessmentTemplate
    extra = 0


@admin.register(WorkflowTemplate)
class WorkflowTemplateAdmin(admin.ModelAdmin):
    list_display = ('name', 'school', 'workflow_type', 'is_active', 'is_default')
    list_filter = ('school', 'workflow_type', 'is_active')
    search_fields = ('name',)
    inlines = [WorkflowStageInline]


@admin.register(WorkflowStage)
class WorkflowStageAdmin(admin.ModelAdmin):
    list_display = ('name', 'template', 'order', 'is_required', 'required_approver_role')
    list_filter = ('template__school', 'is_required', 'requires_documents', 'requires_assessment')
    inlines = [AssessmentTemplateInline]


class EnquiryStageProgressInline(admin.TabularInline):
    model = EnquiryStageProgress
    extra = 0
    readonly_fields = ['processed_by', 'processed_at']


class EnquiryDocumentInline(admin.TabularInline):
    model = EnquiryDocument
    extra = 0


class EnquiryAssessmentResultInline(admin.TabularInline):
    model = EnquiryAssessmentResult
    extra = 0


@admin.register(Enquiry)
class EnquiryAdmin(admin.ModelAdmin):
    list_display = ('enquiry_id', 'first_name', 'last_name', 'class_applied', 'status', 'filled_by', 'filled_via', 'created_at')
    list_filter = ('school', 'status', 'priority', 'filled_via', 'class_applied', 'academic_year')
    search_fields = ('enquiry_id', 'first_name', 'last_name', 'parent_mobile')
    readonly_fields = ('enquiry_id', 'filled_at', 'converted_at')
    inlines = [EnquiryStageProgressInline, EnquiryDocumentInline, EnquiryAssessmentResultInline]
    
    fieldsets = (
        ('Basic Info', {
            'fields': ('enquiry_id', 'school', 'workflow', 'status', 'priority')
        }),
        ('Student Details', {
            'fields': ('first_name', 'last_name', 'date_of_birth', 'gender', 'photo')
        }),
        ('Academic Request', {
            'fields': ('class_applied', 'academic_year', 'previous_school_name', 'previous_class', 'previous_percentage')
        }),
        ('Parent/Guardian', {
            'fields': ('parent_name', 'parent_mobile', 'parent_email', 'parent_occupation', 'address')
        }),
        ('Tracking', {
            'fields': ('filled_by', 'filled_at', 'filled_via', 'current_stage', 'referred_by')
        }),
        ('Conversion', {
            'fields': ('converted_student', 'converted_at', 'converted_by'),
            'classes': ('collapse',)
        }),
        ('Notes', {
            'fields': ('notes', 'rejection_reason'),
            'classes': ('collapse',)
        }),
    )


@admin.register(EnquiryDocument)
class EnquiryDocumentAdmin(admin.ModelAdmin):
    list_display = ('enquiry', 'document_type', 'is_verified', 'uploaded_at')
    list_filter = ('document_type', 'is_verified')
