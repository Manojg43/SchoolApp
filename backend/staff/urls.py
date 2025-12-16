from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import StaffDashboardView, GenerateSchoolQR, ScanAttendanceView, StaffListView

router = DefaultRouter()
# router.register(r'list', StaffListView, basename='staff-list') # ViewSet vs APIView

urlpatterns = [
    path('dashboard/', StaffDashboardView.as_view(), name='staff-dashboard'),
    path('qr/generate/', GenerateSchoolQR.as_view(), name='generate-qr'),
    path('attendance/scan/', ScanAttendanceView.as_view(), name='scan-attendance'),
    path('list/', StaffListView.as_view(), name='staff-list'),
]
