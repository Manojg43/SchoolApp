"""
Management command to set dummy salary structure for all staff and generate test payroll.
Run with: python manage.py setup_payroll_test
"""

from django.core.management.base import BaseCommand
from core.models import CoreUser
from finance.models import StaffSalaryStructure, Salary
from staff.models import StaffAttendance
from schools.models import School
from decimal import Decimal
import datetime
import calendar


class Command(BaseCommand):
    help = 'Set dummy salary structure for all staff and optionally generate payroll'

    def add_arguments(self, parser):
        parser.add_argument(
            '--salary',
            type=float,
            default=30000,
            help='Base salary amount to set (default: 30000)',
        )
        parser.add_argument(
            '--generate',
            action='store_true',
            help='Also generate payroll after setting salary structures',
        )
        parser.add_argument(
            '--month',
            type=int,
            default=datetime.date.today().month,
            help='Month to generate payroll for (default: current month)',
        )
        parser.add_argument(
            '--year',
            type=int,
            default=datetime.date.today().year,
            help='Year to generate payroll for (default: current year)',
        )
        parser.add_argument(
            '--mark-attendance',
            action='store_true',
            help='Also create dummy attendance records for testing',
        )

    def handle(self, *args, **options):
        base_salary = options['salary']
        generate = options['generate']
        month = options['month']
        year = options['year']
        mark_attendance = options['mark_attendance']
        
        # Step 1: Set salary structures for all staff
        self.stdout.write(self.style.NOTICE(f'Setting base salary of ₹{base_salary} for all staff...'))
        
        # Get all staff roles
        staff_roles = ['TEACHER', 'OFFICE_STAFF', 'ACCOUNTANT', 'DRIVER', 'CLEANING_STAFF', 'PRINCIPAL', 'SCHOOL_ADMIN']
        
        all_staff = CoreUser.objects.filter(
            role__in=staff_roles,
            is_active=True
        )
        
        self.stdout.write(f'Found {all_staff.count()} active staff members')
        
        created_count = 0
        updated_count = 0
        
        for staff in all_staff:
            if not staff.school:
                self.stdout.write(self.style.WARNING(f'  Skipping {staff.email}: No school assigned'))
                continue
                
            struct, created = StaffSalaryStructure.objects.update_or_create(
                staff=staff,
                school=staff.school,
                defaults={'base_salary': base_salary}
            )
            
            if created:
                created_count += 1
            else:
                updated_count += 1
            
            self.stdout.write(f'  {"Created" if created else "Updated"}: {staff.get_full_name()} -> ₹{base_salary}')
        
        self.stdout.write(self.style.SUCCESS(f'Salary structures: {created_count} created, {updated_count} updated'))
        
        # Step 2: Create dummy attendance if requested
        if mark_attendance:
            self.stdout.write(self.style.NOTICE(f'\nCreating dummy attendance for {month}/{year}...'))
            
            num_days = calendar.monthrange(year, month)[1]
            start_date = datetime.date(year, month, 1)
            
            attendance_created = 0
            for staff in all_staff:
                if not staff.school:
                    continue
                
                # Mark attendance for first 20 days of month (simulating working days)
                for day in range(1, min(21, num_days + 1)):
                    date = datetime.date(year, month, day)
                    # Skip weekends
                    if date.weekday() >= 5:
                        continue
                    
                    att, created = StaffAttendance.objects.get_or_create(
                        staff=staff,
                        date=date,
                        defaults={
                            'school': staff.school,  # Required field - in defaults
                            'status': 'PRESENT',
                            'check_in': datetime.time(9, 0),
                            'check_out': datetime.time(17, 0)
                        }
                    )
                    if created:
                        attendance_created += 1
            
            self.stdout.write(self.style.SUCCESS(f'Created {attendance_created} attendance records'))
        
        # Step 3: Generate payroll if requested
        if generate:
            self.stdout.write(self.style.NOTICE(f'\nGenerating payroll for {month}/{year}...'))
            
            num_days = calendar.monthrange(year, month)[1]
            start_date = datetime.date(year, month, 1)
            end_date = datetime.date(year, month, num_days)
            
            generated_count = 0
            skipped_count = 0
            
            for staff in all_staff:
                if not staff.school:
                    skipped_count += 1
                    continue
                
                # Get salary structure
                try:
                    struct = staff.salary_structure
                    salary_amount = struct.base_salary
                except StaffSalaryStructure.DoesNotExist:
                    self.stdout.write(self.style.WARNING(f'  No salary structure for {staff.email}'))
                    skipped_count += 1
                    continue
                
                if salary_amount <= 0:
                    self.stdout.write(self.style.WARNING(f'  Salary is 0 for {staff.email}'))
                    skipped_count += 1
                    continue
                
                # Count attendance
                present_count = StaffAttendance.objects.filter(
                    staff=staff,
                    date__gte=start_date,
                    date__lte=end_date,
                    status='PRESENT'
                ).count()
                
                half_day_count = StaffAttendance.objects.filter(
                    staff=staff,
                    date__gte=start_date,
                    date__lte=end_date,
                    status='HALF_DAY'
                ).count()
                
                total_present = Decimal(str(present_count)) + (Decimal(str(half_day_count)) * Decimal('0.5'))
                
                # Calculate salary with Decimal
                daily_rate = salary_amount / Decimal(str(num_days))
                payable = daily_rate * total_present
                
                if payable > salary_amount:
                    payable = salary_amount
                
                deductions = salary_amount - payable
                
                # Create salary record - all Decimal values
                salary_obj, created = Salary.objects.update_or_create(
                    school=staff.school,
                    staff=staff,
                    month=start_date,
                    defaults={
                        'total_working_days': num_days,
                        'present_days': total_present,
                        'amount': salary_amount,
                        'deductions': deductions,
                        'net_salary': payable,
                        'bonus': Decimal('0')
                    }
                )
                
                generated_count += 1
                self.stdout.write(
                    f'  {staff.get_full_name()}: {total_present} days, ₹{payable:.2f}'
                )
            
            self.stdout.write('')
            self.stdout.write(self.style.SUCCESS(f'Payroll generated for {generated_count} staff'))
            if skipped_count > 0:
                self.stdout.write(self.style.WARNING(f'Skipped {skipped_count} staff (no school/salary structure)'))
        
        # Summary
        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS('Done!'))
        self.stdout.write('')
        self.stdout.write('To view payroll, go to: Finance -> Payroll Dashboard')
        self.stdout.write(f'Select month: {month}/{year}')
