from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from finance.models import Leave
from .models import StaffAttendance
from core.models import CoreUser
from django.utils import timezone
from datetime import timedelta, date
from django.db import transaction

class ApplyLeaveView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        # Mobile/Web Staff Apply
        start_date = request.data.get('start_date')
        end_date = request.data.get('end_date')
        reason = request.data.get('reason')
        
        if not start_date or not end_date:
            return Response({'error': 'Dates are required'}, status=400)
            
        # Basic validation
        if start_date > end_date:
            return Response({'error': 'Start date cannot be after end date'}, status=400)
            
        leave = Leave.objects.create(
            school=request.user.school,
            staff=request.user,
            start_date=start_date,
            end_date=end_date,
            reason=reason,
            status='PENDING'
        )
        
        return Response({'message': 'Leave applied successfully', 'id': leave.id})

class MyLeavesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        leaves = Leave.objects.filter(staff=request.user).order_by('-start_date')
        data = [{
            'id': l.id,
            'start_date': l.start_date,
            'end_date': l.end_date,
            'reason': l.reason,
            'status': l.status,
            'is_paid': l.is_paid
        } for l in leaves]
        return Response(data)

class LeaveManagementView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        if not (request.user.can_manage_leaves or request.user.role in ['PRINCIPAL', 'SCHOOL_ADMIN'] or request.user.is_superuser):
            return Response({'error': 'Unauthorized'}, status=403)
            
        status_filter = request.query_params.get('status', 'PENDING')
        leaves = Leave.objects.filter(school=request.user.school)
        
        if status_filter != 'ALL':
            leaves = leaves.filter(status=status_filter)
            
        leaves = leaves.order_by('-start_date').select_related('staff')
        
        data = [{
            'id': l.id,
            'staff_name': l.staff.get_full_name(),
            'start_date': l.start_date,
            'end_date': l.end_date,
            'reason': l.reason,
            'status': l.status,
            'is_paid': l.is_paid
        } for l in leaves]
        
        return Response(data)

    def post(self, request, pk):
        # Approve/Reject
        if not (request.user.can_manage_leaves or request.user.role in ['PRINCIPAL', 'SCHOOL_ADMIN'] or request.user.is_superuser):
            return Response({'error': 'Unauthorized'}, status=403)
            
        action = request.data.get('action') # APPROVE / REJECT
        is_paid = request.data.get('is_paid', False)
        
        try:
            leave = Leave.objects.get(id=pk, school=request.user.school)
        except Leave.DoesNotExist:
            return Response({'error': 'Leave application not found'}, status=404)
            
        if action == 'REJECT':
            leave.status = 'REJECTED'
            leave.save()
            return Response({'message': 'Leave Rejected'})
            
        elif action == 'APPROVE':
            leave.status = 'APPROVED'
            leave.is_paid = is_paid
            leave.save()
            
            # Create Attendance Records
            with transaction.atomic():
                current_date = leave.start_date
                while current_date <= leave.end_date:
                    # Skip Sundays? Maybe configurable, for now simplistic ok
                    # If record exists, update, else create
                    StaffAttendance.objects.update_or_create(
                        school=request.user.school,
                        staff=leave.staff,
                        date=current_date,
                        defaults={
                            'status': 'LEAVE',
                            'source': 'SYSTEM',
                            'correction_reason': 'Leave Approved'
                        }
                    )
                    current_date += timedelta(days=1)
            
            return Response({'message': 'Leave Approved and Attendance Marked'})
            
        return Response({'error': 'Invalid Action'}, status=400)
