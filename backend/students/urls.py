from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    PromoteStudentsView, StudentHistoryView, ToggleStudentActiveView,
    StudentViewSet, AttendanceViewSet, FeeViewSet, StudentHistoryViewSet,
    StudentCertificatesView
)
from .pdf_views import ReportCardPDFView

router = DefaultRouter()
router.register(r'attendance', AttendanceViewSet, basename='student-attendance')
router.register(r'fees', FeeViewSet, basename='student-fees')
router.register(r'history-manage', StudentHistoryViewSet, basename='student-history-manage')
router.register(r'', StudentViewSet, basename='students')

urlpatterns = [
    path('promote/', PromoteStudentsView.as_view(), name='promote-students'),
    path('history/<int:student_id>/', StudentHistoryView.as_view(), name='student-history'),
    path('<int:student_id>/toggle-active/', ToggleStudentActiveView.as_view(), name='toggle-student-active'),
    path('<int:student_id>/report-card/', ReportCardPDFView.as_view(), name='student-report-card'),
    path('<int:student_id>/certificates/', StudentCertificatesView.as_view(), name='student-certificates'),
    path('', include(router.urls)),
]

