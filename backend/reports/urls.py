from django.urls import path
from .views import AttendanceAnalyticsView, FinanceAnalyticsView

urlpatterns = [
    path('attendance/', AttendanceAnalyticsView.as_view(), name='analytics-attendance'),
    path('finance/', FinanceAnalyticsView.as_view(), name='analytics-finance'),
]
