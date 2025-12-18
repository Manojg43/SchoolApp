from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import StaffDashboardView, GenerateSchoolQR, ScanAttendanceView, StaffViewSet, StaffAttendanceReportView, UpdateAttendanceView

router = DefaultRouter()
router.register(r'', StaffViewSet, basename='staff')

urlpatterns = [
    path('dashboard/', StaffDashboardView.as_view(), name='staff-dashboard'),
    path('qr/generate/', GenerateSchoolQR.as_view(), name='generate-qr'),
    path('attendance/scan/', ScanAttendanceView.as_view(), name='scan-attendance'),
    path('attendance/report/', StaffAttendanceReportView.as_view(), name='attendance-report'),
    path('attendance/<int:pk>/update/', UpdateAttendanceView.as_view(), name='update-attendance'),
    path('', include(router.urls)),
]
