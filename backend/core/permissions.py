from rest_framework import permissions
from .models import CoreUser

class IsSuperAdmin(permissions.BasePermission):
    """
    Allocates permissions only to Super Admins (Developers).
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and (
            request.user.is_superuser or 
            request.user.role == CoreUser.ROLE_SUPER_ADMIN
        )

class IsSchoolAdmin(permissions.BasePermission):
    """
    Allows access to School Admins.
    Strictly checks that the user belongs to the school context if applicable.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and (
            request.user.role == CoreUser.ROLE_SCHOOL_ADMIN
        )

class IsTeacher(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and (
            request.user.role == CoreUser.ROLE_TEACHER
        )

class IsSameSchool(permissions.BasePermission):
    """
    Ensures the user accessing the object belongs to the same school as the object.
    Usage: permission_classes = [IsAuthenticated, IsSameSchool]
    """
    def has_object_permission(self, request, view, obj):
        # Superusers can access everything
        if request.user.is_superuser:
            return True
            
        # Object must have a 'school' attribute
        if not hasattr(obj, 'school'):
            return False
            
        return obj.school == request.user.school
