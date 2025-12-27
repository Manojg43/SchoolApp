from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Salary, StaffSalaryStructure, FeeCategory
from core.models import CoreUser
from staff.models import StaffAttendance
from schools.models import School
from django.utils import timezone
from decimal import Decimal
import datetime
import calendar

class SalaryStructureView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, staff_id):
        # Check permissions
        if not (request.user.can_manage_payroll or request.user.role in ['PRINCIPAL', 'SCHOOL_ADMIN'] or request.user.is_superuser):
            return Response({'error': 'Unauthorized'}, status=403)
            
        try:
            struct = StaffSalaryStructure.objects.get(staff__id=staff_id, school=request.user.school)
            return Response({
                'base_salary': struct.base_salary,
                # Add allowances future proofing here
            })
        except StaffSalaryStructure.DoesNotExist:
            return Response({'base_salary': 0}) # Default

    def post(self, request, staff_id):
        if not (request.user.can_manage_payroll or request.user.role in ['PRINCIPAL', 'SCHOOL_ADMIN'] or request.user.is_superuser):
            return Response({'error': 'Unauthorized'}, status=403)
            
        try:
            target_staff = CoreUser.objects.get(id=staff_id, school=request.user.school)
        except CoreUser.DoesNotExist:
            return Response({'error': 'Staff not found'}, status=404)
            
        base_salary = request.data.get('base_salary', 0)
        
        struct, created = StaffSalaryStructure.objects.update_or_create(
            staff=target_staff,
            school=request.user.school,
            defaults={'base_salary': base_salary}
        )
        
        return Response({'message': 'Salary Structure Saved', 'base_salary': base_salary})

class PayrollDashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not (request.user.can_manage_payroll or request.user.role in ['PRINCIPAL', 'SCHOOL_ADMIN'] or request.user.is_superuser):
            return Response({'error': 'Unauthorized'}, status=403)

        school = request.user.school
        month = int(request.query_params.get('month', datetime.date.today().month))
        year = int(request.query_params.get('year', datetime.date.today().year))
        
        salaries = Salary.objects.filter(
            school=school,
            month__month=month,
            month__year=year
        ).select_related('staff', 'staff__staff_profile')
        
        data = []
        for sal in salaries:
            data.append({
                'id': sal.id,
                'staff_name': sal.staff.get_full_name(),
                'designation': sal.staff.staff_profile.designation if hasattr(sal.staff, 'staff_profile') else 'Staff',
                'present_days': float(sal.present_days),
                'base_salary': str(sal.amount),
                'net_salary': str(sal.net_salary),
                'is_paid': sal.is_paid,
                'paid_date': sal.paid_date
            })
            
        return Response(data)

class GeneratePayrollView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        if not (request.user.can_manage_payroll or request.user.role in ['PRINCIPAL', 'SCHOOL_ADMIN'] or request.user.is_superuser):
            return Response({'error': 'Unauthorized'}, status=403)

        school = request.user.school
        month = int(request.data.get('month', datetime.date.today().month))
        year = int(request.data.get('year', datetime.date.today().year))
        
        # Date Range
        num_days = calendar.monthrange(year, month)[1]
        start_date = datetime.date(year, month, 1)
        end_date = datetime.date(year, month, num_days)
        
        # List all Active Staff
        all_staff = CoreUser.objects.filter(
            school=school, 
            role__in=['TEACHER', 'OFFICE_STAFF', 'ACCOUNTANT', 'DRIVER', 'CLEANING_STAFF', 'PRINCIPAL', 'SCHOOL_ADMIN']
        ).exclude(is_active=False)
        
        generated_count = 0
        
        for staff in all_staff:
            # 1. Get Base Salary
            try:
                struct = staff.salary_structure
                base_salary = struct.base_salary  # This is Decimal
            except StaffSalaryStructure.DoesNotExist:
                # Skip if no salary structure defined? Or assume 0?
                # Let's Skip to avoid junk data
                continue
                
            if base_salary <= 0:
                continue

            # 2. Calculate Present Days
            # Count PRESENT = 1, HALF_DAY = 0.5
            p_count = StaffAttendance.objects.filter(staff=staff, date__gte=start_date, date__lte=end_date, status='PRESENT').count()
            h_count = StaffAttendance.objects.filter(staff=staff, date__gte=start_date, date__lte=end_date, status='HALF_DAY').count()
            
            total_present = Decimal(str(p_count)) + (Decimal(str(h_count)) * Decimal('0.5'))
            
            # Additional: Paid Leaves check? (For now assume separate LEAVE model if we track paid leaves)
            # Simple version: Pay for presence.
            
            # 3. Calculate Amount (using Decimal for precision)
            # Daily Rate = Base / Num Days in Month (Actual)
            daily_rate = base_salary / Decimal(str(num_days))
            payable = daily_rate * total_present
            
            # Cap at Base Salary (Precision handling)
            if payable > base_salary:
                 payable = base_salary
            
            # Calculate deductions (all Decimal)
            deductions = base_salary - payable
                 
            # 4. Create/Update Salary Record - all values are Decimal now
            salary_obj, created = Salary.objects.update_or_create(
                school=school,
                staff=staff,
                month=start_date,
                defaults={
                    'total_working_days': num_days,
                    'present_days': total_present,
                    'amount': base_salary,
                    'deductions': deductions,
                    'net_salary': payable,
                    'bonus': Decimal('0')
                }
            )
            generated_count += 1
            
        return Response({'message': f'Payroll Generated for {generated_count} staff members'})

class MarkPaidView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, salary_id):
        if not (request.user.can_manage_payroll or request.user.role in ['PRINCIPAL', 'SCHOOL_ADMIN'] or request.user.is_superuser):
            return Response({'error': 'Unauthorized'}, status=403)

        try:
            sal = Salary.objects.get(id=salary_id, school=request.user.school)
            sal.is_paid = True
            sal.paid_date = datetime.date.today()
            sal.save()
            return Response({'message': 'Marked as Paid'})
        except Salary.DoesNotExist:
            return Response({'error': 'Record not found'}, status=404)
