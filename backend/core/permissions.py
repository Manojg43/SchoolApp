from rest_framework import permissions
from .models import CoreUser

class StandardPermission(permissions.BasePermission):
    """
    Unified Permission Class.
    1. Superuser -> Allow All.
    2. Authenticated -> Check Django Model Permissions (add_model, change_model, etc.)
    3. Object Level -> Check School Isolation.
    """
    def has_permission(self, request, view):
        # 1. Superuser Bypass
        if request.user.is_superuser:
            return True

        # 2. Authentication Check
        if not request.user or not request.user.is_authenticated:
            return False

        # 3. Method-to-Action Mapping
        # GET -> view
        # POST -> add
        # PUT/PATCH -> change
        # DELETE -> delete
        METHOD_ACTIONS = {
            'GET': 'view',
            'POST': 'add',
            'PUT': 'change',
            'PATCH': 'change',
            'DELETE': 'delete',
            'HEAD': 'view',
            'OPTIONS': 'view',
        }
        
        action = METHOD_ACTIONS.get(request.method, 'view')
        
        # We need to know the model this view is handling.
        # ViewSets usually have .queryset.model or .serializer_class.Meta.model
        model_cls = None
        if hasattr(view, 'queryset') and view.queryset is not None:
             model_cls = view.queryset.model
        elif hasattr(view, 'get_queryset'):
             # Try to get queryset result
             try:
                 qs = view.get_queryset()
                 if qs is not None: model_cls = qs.model
             except:
                 pass
        
        if not model_cls:
            # Fallback if we can't determine model (e.g. custom APIView)
            # We assume view handles its own specific checks or allows authenticated
            return True 

        app_label = model_cls._meta.app_label
        model_name = model_cls._meta.model_name
        perm_codename = f"{app_label}.{action}_{model_name}"

        if request.user.has_perm(perm_codename):
            return True

        # Fallback: Allow SCHOOL_ADMIN to manage data if they don't have explicit Django perm
        # This handles cases where Group permissions weren't set up perfectly in seeding
        if request.user.role == CoreUser.ROLE_SCHOOL_ADMIN:
            return True

        return False

    def has_object_permission(self, request, view, obj):
        # 1. Superuser Bypass
        if request.user.is_superuser:
            return True

        # 2. School Isolation
        if hasattr(obj, 'school'):
            if obj.school != request.user.school:
                return False
        
        return True
