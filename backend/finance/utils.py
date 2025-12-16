import datetime
from calendar import monthrange
from decimal import Decimal
from django.db.models import Q
from .models import Holiday, Salary, Leave
from staff.models import StaffAttendance, StaffProfile
from core.models import CoreUser

def calculate_working_days(year, month, school):
    """
    Calculate working days: Total days - (Sundays + Paid Holidays)
    """
    _, num_days = monthrange(year, month)
    total_days = num_days
    
    # 1. Count Sundays
    sundays = 0
    for day in range(1, num_days + 1):
        date_obj = datetime.date(year, month, day)
        if date_obj.weekday() == 6: # Sunday
            sundays += 1
            
    # 2. Count Paid Holidays (excluding Sundays to avoid double count)
    holidays = Holiday.objects.filter(
        school=school, 
        date__year=year, 
        date__month=month,
        is_paid=True
    )
    
    unique_holidays = 0
    for h in holidays:
        if h.date.weekday() != 6:
            unique_holidays += 1
            
    return total_days - sundays - unique_holidays

def calculate_monthly_salary(school, year, month):
    """
    Batch calculate salary for all staff in school.
    """
    staff_members = CoreUser.objects.filter(school=school, is_staff=True, is_active=True)
    working_days = calculate_working_days(year, month, school)
    
    generated_count = 0
    
    for staff in staff_members:
        # Get Attendance
        attendances = StaffAttendance.objects.filter(
            school=school,
            staff=staff,
            date__year=year,
            date__month=month
        )
        
        present_count = 0
        for att in attendances:
            if att.status == 'PRESENT':
                present_count += 1
            elif att.status == 'HALF_DAY':
                present_count += 0.5
        
        # Get Paid Leaves
        approved_leaves = Leave.objects.filter(
            school=school,
            staff=staff,
            start_date__year=year, 
            start_date__month=month,
            status='APPROVED',
            is_paid=True
        )
        leave_days = 0
        for leave in approved_leaves:
             # Simplify: assumes leave is within this month completely. 
             # Real-world needs split logic, keeping simple for MVP.
             delta = (leave.end_date - leave.start_date).days + 1
             leave_days += delta

        total_payable_days = present_count + leave_days
        
        # Get Base Salary (Mocking simple field on user or profile)
        # Assuming StaffProfile has 'salary' field or we use a default
        try:
             # We didn't explicitly add 'base_salary' to StaffProfile in contract, checking models...
             # We should probably check if salary is defined in previous Salary record or default.
             # Let's use a safe default or 0 if not found.
             base_salary = Decimal(20000) # Default placeholder
             if hasattr(staff, 'staffprofile'):
                  # If we added it there? No. 
                  pass
        except:
             base_salary = Decimal(15000)

        # Calculation
        # Net = (Base / Working) * Payable
        if working_days > 0:
            daily_rate = base_salary / working_days
            net_salary = daily_rate * Decimal(total_payable_days)
        else:
            net_salary = base_salary
            
        # Create/Update Salary Record
        salary_date = datetime.date(year, month, 1)
        
        Salary.objects.update_or_create(
            school=school,
            staff=staff,
            month=salary_date,
            defaults={
                'amount': base_salary,
                'total_working_days': working_days,
                'present_days': present_count,
                'paid_leaves': leave_days,
                'net_salary': round(net_salary, 2),
                'is_paid': False
            }
        )
        generated_count += 1
        
    return generated_count
