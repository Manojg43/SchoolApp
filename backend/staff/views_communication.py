from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from schools.models import Notice
from core.models import CoreUser
from django.db.models import Q

class NoticeBoardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        school = user.school
        
        # Determine User Role for Filtering
        is_principal = False
        try:
            is_principal = user.staff_profile.designation == 'Principal'
        except AttributeError:
            pass

        if user.is_superuser or user.role in ['SCHOOL_ADMIN', 'PRINCIPAL'] or is_principal:
            # Principal sees all active notices
            notices = Notice.objects.filter(
                school=school,
                is_active=True
            ).order_by('-date')
        else:
            role_filter = Q(target_role='ALL')
            if user.role == CoreUser.ROLE_TEACHER:
                role_filter |= Q(target_role='TEACHER')
            elif user.role == CoreUser.ROLE_DRIVER:
                role_filter |= Q(target_role='DRIVER')
            
            notices = Notice.objects.filter(
                school=school,
                is_active=True
            ).filter(role_filter).order_by('-date')
        
        data = []
        for n in notices:
            data.append({
                'id': n.id,
                'title': n.title,
                'content': n.content,
                'date': n.date.strftime("%d %b %Y"),
                'role': n.target_role
            })
            
        return Response(data)
