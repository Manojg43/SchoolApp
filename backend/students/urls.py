from django.urls import path
from .views import PromoteStudentsView, StudentHistoryView, ToggleStudentActiveView
from .pdf_views import ReportCardPDFView

urlpatterns = [
    path('promote/', PromoteStudentsView.as_view(), name='promote-students'),
    path('history/<int:student_id>/', StudentHistoryView.as_view(), name='student-history'),
    path('<int:student_id>/toggle-active/', ToggleStudentActiveView.as_view(), name='toggle-student-active'),
    path('<int:student_id>/report-card/', ReportCardPDFView.as_view(), name='student-report-card'),
]

