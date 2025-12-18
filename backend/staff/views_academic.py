from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from schools.models import ClassSchedule
from django.db.models import F
import schools.models # For Homework access because of circular/lazy import issues or cleanliness


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

class HomeworkView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # View History
        user = request.user
        hw = schools.models.Homework.objects.filter(
            school=user.school,
            teacher=user
        ).order_by('-created_at')
        
        data = []
        for h in hw:
            data.append({
                'id': h.id,
                'class_name': h.class_assigned.name,
                'section': h.section,
                'subject': h.subject,
                'title': h.title,
                'description': h.description,
                'due_date': h.due_date.strftime("%Y-%m-%d"),
                'created_at': h.created_at.strftime("%d %b")
            })
        return Response(data)

    def post(self, request):
        # Create Homework
        data = request.data
        user = request.user
        
        try:
            class_id = data.get('class_id')
            subject = data.get('subject')
            title = data.get('title')
            description = data.get('description')
            due_date = data.get('due_date')
            
            cObj = schools.models.Class.objects.get(id=class_id, school=user.school)
            
            hw = schools.models.Homework.objects.create(
                school=user.school,
                class_assigned=cObj,
                section=data.get('section', ''),
                subject=subject,
                teacher=user,
                title=title,
                description=description,
                due_date=due_date
            )
            return Response({'message': 'Homework Added', 'id': hw.id})
        except Exception as e:
            return Response({'error': str(e)}, status=400)
