from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate
from rest_framework.permissions import AllowAny

class LoginApiView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        
        user = authenticate(username=username, password=password)
        
        if user:
            # Supabase is Writable: Create token if missing
            token, created = Token.objects.get_or_create(user=user)
            
            # Gather standard permissions (Flattened from User + Groups)
            all_permissions = user.get_all_permissions() # returns {'app.perm', ...}
            
            # Combine everything into a single list
            # We want specific strings like 'students.add_student', 'finance.view_invoice'
            permission_list = list(all_permissions)

            # Keep legacy custom flags for backwards compatibility if needed, 
            # but primary source is now permission_list
            if user.is_superuser: permission_list.append('is_superuser')

            # --- Custom Boolean Permissions ---
            # If user is superuser, grant ALL permissions regardless of flags
            if user.is_superuser:
                permission_list.extend([
                    'can_access_finance', 'can_access_transport', 'can_access_certificates',
                    'can_access_student_records', 'can_access_attendance', 'can_manage_payroll',
                    'can_manage_leaves', 'can_mark_manual_attendance', 'can_use_mobile_app'
                ])
            else:
                if user.can_access_finance: permission_list.append('can_access_finance')
                if user.can_access_transport: permission_list.append('can_access_transport')
                if user.can_access_certificates: permission_list.append('can_access_certificates')
                if user.can_access_student_records: permission_list.append('can_access_student_records')
                if user.can_access_attendance: permission_list.append('can_access_attendance')
                if user.can_manage_payroll: permission_list.append('can_manage_payroll')
                if user.can_manage_leaves: permission_list.append('can_manage_leaves')
                if user.can_mark_manual_attendance: permission_list.append('can_mark_manual_attendance')
                if user.can_use_mobile_app: permission_list.append('can_use_mobile_app')

            return Response({
                'token': token.key,
                'user_id': user.user_id,
                'role': user.role,
                'school_id': user.school.school_id if user.school else None,
                'name': user.get_full_name(),
                'email': user.email,
                'permissions': permission_list
            })
        else:
            return Response({'error': 'Invalid Credentials'}, status=400)

class HeaderDebugView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response({
            'is_secure': request.is_secure(),
            'scheme': request.scheme,
            'headers': dict(request.headers),
            'meta_proto': request.META.get('HTTP_X_FORWARDED_PROTO'),
            'meta_https': request.META.get('HTTPS'),
        })
