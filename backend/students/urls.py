from django.urls import path
from .views import PromoteStudentsView, StudentHistoryView

urlpatterns = [
    path('promote/', PromoteStudentsView.as_view(), name='promote-students'),
    path('history/<int:student_id>/', StudentHistoryView.as_view(), name='student-history'),
]
