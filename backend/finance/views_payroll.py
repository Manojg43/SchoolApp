from rest_framework import viewsets, views, status, permissions
from rest_framework.response import Response
from django.db import transaction
from django.utils import timezone
from datetime import date
from .models import StaffSalaryStructure, Salary
from .serializers import (
    StaffSalaryStructureSerializer, 
    SalarySerializer, 
    PayrollRunSerializer
)
from core.models import CoreUser
from students.models import Student  # Not needed directly but context
from schools.models import School

class SalaryStructureViewSet(viewsets.ModelViewSet):
    """
    CRUD for Staff Salary Structure.
    Only accessible by Admin/HR.
    """
    serializer_class = StaffSalaryStructureSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return StaffSalaryStructure.objects.filter(staff__school=self.request.user.school)
    
    def perform_create(self, serializer):
        # Staff is passed in body, but ensure staff belongs to school
        # Serializer handles ID validation, but we should double check school match if we want strictness.
        # For now, rely on Frontend to send valid staff ID from same school.
        serializer.save()


class PayrollViewSet(viewsets.ReadOnlyModelViewSet):
    """
    View Generated Payrolls.
    """
    serializer_class = SalarySerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['month', 'status', 'staff']
    
    def get_queryset(self):
        # Admin can view all, Staff can view own (will add logic later)
        # For now, return School's payroll
        return Salary.objects.filter(school=self.request.user.school).order_by('-month', 'staff__first_name')


class GeneratePayrollView(views.APIView):
    """
    Generate Payroll for a specific month.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        serializer = PayrollRunSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        target_month = serializer.validated_data['month']
        school = request.user.school
        
        # Logic:
        # 1. Fetch all active staff with defined Salary Structure
        active_staff = CoreUser.objects.filter(
            school=school, 
            is_active=True, 
            role__in=['SCHOOL_ADMIN', 'TEACHER', 'OFFICE_STAFF', 'ACCOUNTANT', 'CLEANING_STAFF', 'NON_TEACHING', 'DRIVER'] 
        )
        
        generated_count = 0
        skipped_count = 0
        errors = []
        
        with transaction.atomic():
            for staff in active_staff:
                try:
                    # Check if structure exists
                    if not hasattr(staff, 'salary_structure'):
                        skipped_count += 1
                        continue
                    
                    structure = staff.salary_structure
                    
                    # Check if already generated
                    if Salary.objects.filter(staff=staff, month=target_month).exists():
                        # Skip or Update? Let's skip to avoid overwrite unless explicit force
                        skipped_count += 1
                        continue
                        
                    # Calculate Logic
                    # Phase 1: Assume 30 days present until Attendance Module integrated
                    total_days = 30
                    present_days = 30 # TODO: Fetch from StaffAttendance
                    loss_of_pay_days = total_days - present_days
                    
                    # Financials
                    basic = structure.basic_salary
                    # If loss of pay?
                    # Pro-rata deduction logic:
                    # Net (Structure) / 30 * Present Days?
                    # Or Basic / 30 * Present? + Allowances?
                    
                    # For Phase 1: Flat copy of Structure logic (assume full month)
                    # We will copy JSONs
                    earnings_snapshot = structure.allowances
                    deductions_snapshot = structure.deductions
                    
                    total_earnings_val = basic + sum(float(v) for v in earnings_snapshot.values())
                    total_deductions_val = sum(float(v) for v in deductions_snapshot.values())
                    
                    # Apply LOP if needed (Phase 2)
                    
                    net_salary = float(basic) + sum(float(v) for v in earnings_snapshot.values()) - total_deductions_val
                    
                    # Create Salary Record
                    Salary.objects.create(
                        school=school,
                        staff=staff,
                        month=target_month,
                        present_days=present_days,
                        total_working_days=total_days,
                        loss_of_pay_days=loss_of_pay_days,
                        basic_salary=basic,
                        earnings=earnings_snapshot,
                        total_earnings=total_earnings_val,
                        deductions=deductions_snapshot,
                        total_deductions=total_deductions_val,
                        net_salary=net_salary,
                        status='GENERATED',
                        generated_by=request.user
                    )
                    generated_count += 1
                    
                except Exception as e:
                    errors.append(f"{staff.get_full_name()}: {str(e)}")
        
        return Response({
            "message": "Payroll Generation Completed",
            "generated": generated_count,
            "skipped": skipped_count,
            "errors": errors
        }, status=status.HTTP_200_OK)
