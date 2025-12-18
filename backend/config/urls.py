
from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from schools.views import SchoolViewSet, AchievementViewSet, AcademicYearViewSet, ClassViewSet, SectionViewSet, NoticeViewSet, HomeworkViewSet
from students.views import StudentViewSet, AttendanceViewSet, FeeViewSet
from django.http import JsonResponse

router = DefaultRouter()
router.register(r'schools', SchoolViewSet, basename='school')
router.register(r'years', AcademicYearViewSet)
router.register(r'classes', ClassViewSet)
router.register(r'sections', SectionViewSet)
router.register(r'students', StudentViewSet)
router.register(r'attendance', AttendanceViewSet)
router.register(r'fees', FeeViewSet)
router.register(r'achievements', AchievementViewSet)
router.register(r'notices', NoticeViewSet, basename='notice')
router.register(r'homework', HomeworkViewSet, basename='homework')

from django.conf import settings
from django.conf.urls.static import static

from core.views import LoginApiView

def api_root(request):
    return JsonResponse({
        "message": "Welcome to SchoolApp Backend API",
        "status": "running",
        "docs": "/admin/"
    })

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/transport/', include('transport.urls')),
    path('api/finance/', include('finance.urls')),
    path('api/certificates/', include('certificates.urls')),
    path('api/reports/', include('reports.urls')),
    path('api/staff/', include('staff.urls')),
    path('api/login/', LoginApiView.as_view(), name='login'),
    path('api/', include(router.urls)),
    path('', api_root, name='api-root'), # Root URL Fix
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
