from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import StaffDashboardView, GenerateSchoolQR, ScanAttendanceView, StaffViewSet, StaffAttendanceReportView, UpdateAttendanceView, StaffDailyAttendanceView, StaffPasswordResetView, GenerateResetCodeView, CheckLocationView, ToggleStaffActiveView
from .views_leave import ApplyLeaveView, MyLeavesView, LeaveManagementView
from .views_academic import TeacherTimetableView, HomeworkView
from .views_communication import NoticeBoardView

router = DefaultRouter()
router.register(r'', StaffViewSet, basename='staff')

urlpatterns = [
    path('dashboard/', StaffDashboardView.as_view(), name='staff-dashboard'),
    path('qr/generate/', GenerateSchoolQR.as_view(), name='generate-qr'),
    path('attendance/scan/', ScanAttendanceView.as_view(), name='scan-attendance'),
    path('attendance/check-location/', CheckLocationView.as_view(), name='check-location'),
    path('attendance/report/', StaffAttendanceReportView.as_view(), name='attendance-report'),
    path('reset-password/', StaffPasswordResetView.as_view(), name='staff-reset-password'),
    path('reset-code/<int:pk>/', GenerateResetCodeView.as_view(), name='generate-reset-code'),
    path('<int:staff_id>/toggle-active/', ToggleStaffActiveView.as_view(), name='toggle-staff-active'),
    path('attendance/daily/', StaffDailyAttendanceView.as_view(), name='daily-attendance'),
    path('attendance/<int:pk>/update/', UpdateAttendanceView.as_view(), name='update-attendance'),
    
    # Leave Management
    path('leaves/apply/', ApplyLeaveView.as_view(), name='apply-leave'),
    path('leaves/my/', MyLeavesView.as_view(), name='my-leaves'),
    path('leaves/manage/', LeaveManagementView.as_view(), name='manage-leaves-list'),
    path('leaves/manage/<int:pk>/', LeaveManagementView.as_view(), name='manage-leaves-action'),

    # Academic / Timetable
    path('timetable/', TeacherTimetableView.as_view(), name='teacher-timetable'),
    path('homework/', HomeworkView.as_view(), name='teacher-homework'),
    path('notices/', NoticeBoardView.as_view(), name='staff-notices'),
    
    path('', include(router.urls)),
]
