from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import StaffDashboardView, GenerateSchoolQR, ScanAttendanceView, StaffViewSet, StaffAttendanceReportView, UpdateAttendanceView, StaffDailyAttendanceView
from .views_leave import ApplyLeaveView, MyLeavesView, LeaveManagementView

router = DefaultRouter()
router.register(r'', StaffViewSet, basename='staff')

urlpatterns = [
    path('dashboard/', StaffDashboardView.as_view(), name='staff-dashboard'),
    path('qr/generate/', GenerateSchoolQR.as_view(), name='generate-qr'),
    path('attendance/scan/', ScanAttendanceView.as_view(), name='scan-attendance'),
    path('attendance/report/', StaffAttendanceReportView.as_view(), name='attendance-report'),
    path('attendance/daily/', StaffDailyAttendanceView.as_view(), name='daily-attendance'),
    path('attendance/<int:pk>/update/', UpdateAttendanceView.as_view(), name='update-attendance'),
    
    # Leave Management
    path('leaves/apply/', ApplyLeaveView.as_view(), name='apply-leave'),
    path('leaves/my/', MyLeavesView.as_view(), name='my-leaves'),
    path('leaves/manage/', LeaveManagementView.as_view(), name='manage-leaves-list'),
    path('leaves/manage/<int:pk>/', LeaveManagementView.as_view(), name='manage-leaves-action'),
    
    path('', include(router.urls)),
]
