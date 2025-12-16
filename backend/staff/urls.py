from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import StaffDashboardView, GenerateSchoolQR, ScanAttendanceView, StaffViewSet

router = DefaultRouter()
router.register(r'', StaffViewSet, basename='staff')

urlpatterns = [
    path('dashboard/', StaffDashboardView.as_view(), name='staff-dashboard'),
    path('qr/generate/', GenerateSchoolQR.as_view(), name='generate-qr'),
    path('attendance/scan/', ScanAttendanceView.as_view(), name='scan-attendance'),
    path('', include(router.urls)),
]
