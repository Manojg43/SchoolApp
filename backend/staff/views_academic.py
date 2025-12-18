from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from schools.models import ClassSchedule
from django.db.models import F

class TeacherTimetableView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        school = user.school
        
        # Filter by Day
        day = request.query_params.get('day') # MONDAY, TUESDAY...
        
        schedules = ClassSchedule.objects.filter(
            school=school,
            teacher=user
        )
        
        if day:
            schedules = schedules.filter(day_of_week=day.upper())
            
        schedules = schedules.order_by('day_of_week', 'start_time').select_related('class_assigned')
        
        data = []
        for s in schedules:
            data.append({
                'id': s.id,
                'day': s.day_of_week,
                'start_time': s.start_time.strftime("%H:%M"),
                'end_time': s.end_time.strftime("%H:%M"),
                'subject': s.subject,
                'class_name': s.class_assigned.name,
                'section': s.section
            })
            
        return Response(data)
