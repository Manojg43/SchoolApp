from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Sum, Q
from students.models import Student, Attendance
from finance.models import Invoice, Receipt, Salary
from staff.models import StaffAttendance
from datetime import date

class AttendanceAnalyticsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        school_id = request.user.school.school_id
        today = date.today()
        
        # Student Attendance (Today)
        total_students = Student.objects.filter(school__school_id=school_id, is_active=True).count()
        present_today = Attendance.objects.filter(school__school_id=school_id, date=today, status='P').count()
        absent_today = Attendance.objects.filter(school__school_id=school_id, date=today, status='A').count()
        
        # Staff Attendance (Today)
        total_staff = StaffAttendance.objects.filter(school__school_id=school_id, date=today).count()
        staff_present = StaffAttendance.objects.filter(school__school_id=school_id, date=today, status='PRESENT').count()
        
        # Class-wise stats (Example)
        class_stats = Student.objects.filter(school__school_id=school_id).values('current_class__name').annotate(
            count=Count('id')
        )

        return Response({
            'date': today,
            'students': {
                'total': total_students,
                'present': present_today,
                'absent': absent_today,
                'percentage': round((present_today / total_students * 100), 1) if total_students else 0
            },
            'staff': {
                'total_marked': total_staff,
                'present': staff_present
            },
            'class_distribution': list(class_stats)
        })

class FinanceAnalyticsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        school_id = request.user.school.school_id
        
        # Totals
        total_invoiced = Invoice.objects.filter(school__school_id=school_id).aggregate(sum=Sum('total_amount'))['sum'] or 0
        total_collected = Invoice.objects.filter(school__school_id=school_id).aggregate(sum=Sum('paid_amount'))['sum'] or 0
        pending_dues = total_invoiced - total_collected
        
        # Categorized Fees
        # Example aggregation logic
        
        return Response({
            'overview': {
                'total_invoiced': total_invoiced,
                'total_collected': total_collected,
                'pending': pending_dues,
                'collection_rate': round((total_collected / total_invoiced * 100), 1) if total_invoiced else 0
            }
        })
