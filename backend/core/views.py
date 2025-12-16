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
