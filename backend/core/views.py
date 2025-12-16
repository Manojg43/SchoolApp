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
            # READ-ONLY SAFE: Use filter().first() instead of get_or_create()
            token_obj = Token.objects.filter(user=user).first()
            if not token_obj:
                return Response({'error': 'Token not found. Read-only mode prevents creating one.'}, status=500)
            token = token_obj
            
            # Gather standard permissions
            all_permissions = user.get_all_permissions() # returns {'app.perm', ...}
            
            # Gather custom module flags
            custom_perms = []
            if getattr(user, 'can_use_mobile_app', False): custom_perms.append('can_use_mobile_app')
            if getattr(user, 'can_access_finance', False): custom_perms.append('can_access_finance')
            if getattr(user, 'can_access_transport', False): custom_perms.append('can_access_transport')
            if getattr(user, 'can_access_certificates', False): custom_perms.append('can_access_certificates')
            if getattr(user, 'can_access_student_records', False): custom_perms.append('can_access_student_records')
            if getattr(user, 'can_access_attendance', False): custom_perms.append('can_access_attendance')
            if user.is_superuser: custom_perms.append('is_superuser')

            combined_permissions = list(all_permissions) + custom_perms

            return Response({
                'token': token.key,
                'user_id': user.user_id,
                'role': user.role,
                'school_id': user.school.school_id if user.school else None,
                'name': user.get_full_name(),
                'email': user.email,
                'permissions': combined_permissions
            })
        else:
            return Response({'error': 'Invalid Credentials'}, status=400)
