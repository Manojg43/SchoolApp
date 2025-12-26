from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    WorkflowTemplateViewSet, WorkflowStageViewSet, AssessmentTemplateViewSet,
    EnquiryViewSet, EnquiryDocumentViewSet,
    RecordAssessmentView, EnquiryStatsView
)

router = DefaultRouter()
router.register(r'workflows', WorkflowTemplateViewSet, basename='workflow')
router.register(r'stages', WorkflowStageViewSet, basename='stage')
router.register(r'assessments', AssessmentTemplateViewSet, basename='assessment')
router.register(r'enquiries', EnquiryViewSet, basename='enquiry')
router.register(r'documents', EnquiryDocumentViewSet, basename='enquiry-document')

urlpatterns = [
    path('enquiries/<int:enquiry_id>/record-assessment/', RecordAssessmentView.as_view(), name='record-assessment'),
    path('stats/', EnquiryStatsView.as_view(), name='enquiry-stats'),
    path('', include(router.urls)),
]
