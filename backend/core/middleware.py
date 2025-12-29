from django.http import JsonResponse
from django.utils.translation import gettext as _
from asgiref.local import Local

_thread_locals = Local()

def get_current_school_id():
    return getattr(_thread_locals, 'school_id', None)

class TenantMiddleware:
    """
    Ensures that the school_id is present in the request headers.
    Safe for both WSGI and ASGI environments.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.path.startswith('/admin/'):
            # Even for admin, we might want to log who did it if we can.
            if request.user.is_authenticated:
                _thread_locals.user = request.user
            return self.get_response(request)

        school_id = None
        
        # 1. Source from Authenticated User (Highest Priority & Trust)
        if request.user.is_authenticated:
            _thread_locals.user = request.user # Store user for Audit Log
            if hasattr(request.user, 'school') and request.user.school:
                school_id = request.user.school.school_id
        else:
            _thread_locals.user = None
        
        # 2. Source from Header (For public endpoints / login)
        if not school_id:
            school_id = request.headers.get('X-School-ID')
        
        if school_id:
            _thread_locals.school_id = school_id
        
        return self.get_response(request)

def get_current_user():
    return getattr(_thread_locals, 'user', None)
