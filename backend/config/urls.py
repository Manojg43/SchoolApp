"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""


from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from schools.views import SchoolViewSet, AchievementViewSet, AcademicYearViewSet, ClassViewSet, SectionViewSet
from students.views import StudentViewSet, AttendanceViewSet, FeeViewSet

router = DefaultRouter()
router.register(r'schools', SchoolViewSet)
router.register(r'years', AcademicYearViewSet)
router.register(r'classes', ClassViewSet)
router.register(r'sections', SectionViewSet)
router.register(r'students', StudentViewSet)
router.register(r'attendance', AttendanceViewSet)
router.register(r'fees', FeeViewSet)
router.register(r'achievements', AchievementViewSet)

from django.conf import settings
from django.conf.urls.static import static

from core.views import LoginApiView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/transport/', include('transport.urls')),
    path('api/finance/', include('finance.urls')),
    path('api/certificates/', include('certificates.urls')), # Assuming we will add this later or now
    path('api/reports/', include('reports.urls')),
    path('api/staff/', include('staff.urls')),
    path('api/login/', LoginApiView.as_view(), name='login'),
    path('api/', include(router.urls)),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
