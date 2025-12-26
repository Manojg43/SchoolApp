from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import permissions
from django.utils import timezone
from .models import StaffAttendance, StaffProfile
from core.models import CoreUser
from finance.models import Salary
from django.conf import settings
from django.db.models import Count, Q
import hmac
import hashlib
import time
import math
import datetime
import uuid

# Helper: Haversine Distance (Meters)
def calculate_distance(lat1, lon1, lat2, lon2):
    R = 6371000 # Earth radius in meters
    phi1 = math.radians(float(lat1))
    phi2 = math.radians(float(lat2))
    delta_phi = math.radians(float(lat2) - float(lat1))
    delta_lambda = math.radians(float(lon2) - float(lon1))
    
    a = math.sin(delta_phi / 2)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    
    return R * c

class StaffDashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        today = datetime.date.today()
        month_start = today.replace(day=1)
        
        # 1. Profile Data
        profile_data = {
            "first_name": user.first_name,
            "last_name": user.last_name,
            "email": user.email,
            "mobile": user.mobile,
            "school": user.school.name if user.school else "Global/Super Admin",
            "can_mark_manual_attendance": user.can_mark_manual_attendance or user.is_superuser,
            "school_gps": {
                "lat": float(user.school.gps_lat) if user.school and user.school.gps_lat else None,
                "long": float(user.school.gps_long) if user.school and user.school.gps_long else None,
            }
        }
        
        # Add designation if exists
        try:
            sp = user.staff_profile
            profile_data['designation'] = sp.designation
            profile_data['department'] = sp.department
            profile_data['can_mark_manual_attendance'] = sp.can_mark_manual_attendance
        except StaffProfile.DoesNotExist:
            profile_data['designation'] = "Staff"
            profile_data['department'] = "-"
            # Default to False unless superuser
            profile_data['can_mark_manual_attendance'] = False

        # Override for superuser if needed, or rely on the OR logic if it was in the model default
        if user.is_superuser:
             profile_data['can_mark_manual_attendance'] = True

        # 2. Attendance Stats (Current Month)
        attendance_qs = StaffAttendance.objects.filter(
            staff=user,
            date__gte=month_start,
            date__lte=today
        )
        
        stats = {
            'present': attendance_qs.filter(status='PRESENT').count(),
            'absent': attendance_qs.filter(status='ABSENT').count(),
            'late': attendance_qs.filter(status='HALF_DAY').count(), # Using Half Day as proxy for irregularities
            'total_working_days': 26 # Placeholder or distinct count
        }

        # 3. Today's Status
        today_att = attendance_qs.filter(date=today).first()
        today_status = {
            'status': today_att.status if today_att else 'NOT_MARKED',
            'check_in': today_att.check_in if today_att else None,
            'check_out': today_att.check_out if today_att else None
        }

        # 4. Salary Status (Current Month)
        salary_data = {
            'total_earned': 0.0,
            'is_paid': False,
            'generated': False
        }
        try:
            # Use the existing Report logic or simple summary
            from finance.models import Salary
            sal_obj = Salary.objects.filter(staff=user, month=month_start).first()
            if sal_obj:
                salary_data['total_earned'] = float(sal_obj.net_salary)
                salary_data['is_paid'] = sal_obj.is_paid
                salary_data['generated'] = True
        except:
            pass

        return Response({
            'user': profile_data,
            'attendance': stats,
            'today': today_status,
            'salary': salary_data
        })

    def patch(self, request):
        user = request.user
        data = request.data
        
        # 1. Update CoreUser fields
        if 'first_name' in data: user.first_name = data['first_name']
        if 'last_name' in data: user.last_name = data['last_name']
        if 'email' in data: user.email = data['email']
        if 'mobile' in data: user.mobile = data['mobile']
        user.save()
        
        # 2. Update StaffProfile fields
        profile, created = StaffProfile.objects.get_or_create(user=user)
        if 'address' in data: profile.address = data['address']
        if 'bio' in data: profile.bio = data['bio']
        if 'can_mark_manual_attendance' in data:
            profile.can_mark_manual_attendance = data['can_mark_manual_attendance']
        profile.save()
        
        return Response({'message': 'Profile updated successfully'})

from rest_framework import viewsets
from core.permissions import StandardPermission
from .serializers import StaffSerializer

class StaffViewSet(viewsets.ModelViewSet):
    permission_classes = [StandardPermission]
    serializer_class = StaffSerializer

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser:
            qs = CoreUser.objects.filter(
                role__in=[CoreUser.ROLE_TEACHER, CoreUser.ROLE_SCHOOL_ADMIN, CoreUser.ROLE_PRINCIPAL, CoreUser.ROLE_OFFICE_STAFF, CoreUser.ROLE_ACCOUNTANT, CoreUser.ROLE_DRIVER, CoreUser.ROLE_CLEANING_STAFF]
            ).exclude(is_superuser=True)
        else:
            qs = CoreUser.objects.filter(
                school=user.school,
                role__in=[CoreUser.ROLE_TEACHER, CoreUser.ROLE_SCHOOL_ADMIN, CoreUser.ROLE_PRINCIPAL, CoreUser.ROLE_OFFICE_STAFF, CoreUser.ROLE_ACCOUNTANT, CoreUser.ROLE_DRIVER, CoreUser.ROLE_CLEANING_STAFF]
            )
        return qs.select_related('staff_profile')

    def perform_create(self, serializer):
        # Auto-assign school from admin user
        serializer.save(school=self.request.user.school)

class GenerateSchoolQR(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Admin generates this for the SCHOOL DISPLAY screen (Static)
        user = request.user
        school_id = user.school.school_id
        
        # Raw Data (Static Format)
        # Type|SchoolID|Nonce(Optional, but removed to make it truly static if intended for wall)
        # User asked for "Stick at wall", implying it should NOT change.
        raw_data = f"STATIC|{school_id}"
        
        # HMAC Sign
        signature = hmac.new(
            settings.SECRET_KEY.encode(),
            raw_data.encode(),
            hashlib.sha256
        ).hexdigest()
        
        token = f"{raw_data}|{signature}"
        
        return Response({
            'qr_token': token,
            'expires_in': None, # Never expires
            'school_name': user.school.name
        })

class ScanAttendanceView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        # Mobile app sends 'qr_token', web might send 'token'
        token = request.data.get('token') or request.data.get('qr_token')
        is_manual = request.data.get('manual_gps')
        
        print(f"DEBUG: Received QR Token: {token!r}, Manual: {is_manual}")

        # Handle JSON formatted QR codes (Strict Mode) - Only if token exists
        if token and isinstance(token, str) and token.strip().startswith('{'):
            try:
                import json
                data = json.loads(token)
                token = data.get('token', token)
                print(f"DEBUG: Parsed JSON Token: {token}")
            except Exception as e:
                print(f"DEBUG: JSON Parse Error: {e}")
                return Response({'error': 'Invalid QR Format (Bad JSON)'}, status=400)

        # Support both 'latitude' (std) and 'gps_lat' (legacy/mobile)
        lat = request.data.get('latitude') or request.data.get('gps_lat')
        lng = request.data.get('longitude') or request.data.get('gps_long')
        
        if not (token or is_manual) or not lat or not lng:
            return Response({'error': 'Missing data (token or manual_gps, lat, lng)'}, status=400)
            
        # 1. Verify Request Validity
        try:
            if is_manual:
                # Manual GPS Check-In
                has_perm = request.user.is_superuser
                if not has_perm and hasattr(request.user, 'staff_profile'):
                    has_perm = request.user.staff_profile.can_mark_manual_attendance
                
                if not has_perm:
                     return Response({'error': 'Permission Denied for Manual Attendance'}, status=403)
            else:
                # QR Verification
                if '|' not in token:
                     print(f"DEBUG: Malformed Token (No Pipe): {token}")
                     return Response({'error': 'Malformed Token (No Pipe)'}, status=400)

                raw_data, signature = token.rsplit('|', 1)
                expected_sig = hmac.new(
                    settings.SECRET_KEY.encode(),
                    raw_data.encode(),
                    hashlib.sha256
                ).hexdigest()
                
                if not hmac.compare_digest(signature, expected_sig):
                    print(f"DEBUG: Signature Mismatch!")
                    # ... logging ...
                    return Response({'error': 'Invalid QR Signature'}, status=403)
                    
                parts = raw_data.split('|')
                
                # Verify School match
                # Static: STATIC|SchoolID, Dynamic: SchoolID|Timestamp
                school_id = parts[1] if parts[0] == 'STATIC' else parts[0]
                
                if request.user.school.school_id != school_id:
                    return Response({'error': 'Wrong School QR'}, status=403)
                
                # Check Timestamp for Dynamic ONLY
                if parts[0] != 'STATIC' and len(parts) > 1:
                     timestamp = parts[1]
                     if time.time() - int(timestamp) > 300:
                          return Response({'error': 'QR Expired'}, status=400)
                 
        except Exception as e:
            print(f"DEBUG: Verification Exception: {e}")
            import traceback
            traceback.print_exc()
            return Response({'error': 'Validation Error'}, status=400)

        # 4. Verify Geo-Fence
        school = request.user.school
        if not school.gps_lat or not school.gps_long:
            return Response({'error': 'School GPS not configured'}, status=400)
            
        distance = calculate_distance(lat, lng, school.gps_lat, school.gps_long)
        if distance > 50: # 50 Meters Fence
            return Response({
                'error': 'Outside Geo-Fence',
                'distance': f"{distance:.1f}m",
                'allowed': "50m"
            }, status=403)

        # 5. Process Attendance
        today = datetime.date.today()
        attendance, created = StaffAttendance.objects.get_or_create(
            staff=request.user, # The logged-in mobile user
            date=today,
            school=request.user.school
        )
        
        current_time = timezone.localtime().time()
        
        if not attendance.check_in:
            attendance.check_in = current_time
            attendance.status = 'PRESENT'
            attendance.source = 'MOBILE_GPS' if is_manual else 'QR_GEO'
            attendance.gps_lat = lat
            attendance.gps_long = lng
            attendance.save()
            return Response({'message': 'Check-In Successful', 'time': str(current_time)})
            
        elif not attendance.check_out:
            attendance.check_out = current_time
            
            # Logic: Calculate Duration
            # Assuming check_in and check_out are on the same day for standard attendance
            # If cross-day, logic needs datetime, but for simple school app assuming same day.
            
            # Convert to datetime for diff
            dummy_date = datetime.date.today() # Only for time diff calculation
            in_dt = datetime.datetime.combine(dummy_date, attendance.check_in)
            out_dt = datetime.datetime.combine(dummy_date, attendance.check_out)
            
            duration_hours = (out_dt - in_dt).total_seconds() / 3600.0
            
            school_config = request.user.school
            min_full = school_config.min_hours_full_day
            min_half = school_config.min_hours_half_day
            
            if duration_hours >= min_full:
                attendance.status = 'PRESENT'
            elif duration_hours >= min_half:
                attendance.status = 'HALF_DAY'
            else:
                # Less than half day minimum -> Still Absent or specific short leave?
                # Usually marked 'ABSENT' or 'LEAVE' if very short. 
                # Let's keep it ABSENT or HALF_DAY? 
                # User prompted: "how we can consider half day".
                # If < min_half, let's mark ABSENT (Short duration)
                attendance.status = 'ABSENT' 
                
            attendance.save()
            
            # Check-out message with status (Optional to show hours)
            msg = f'Check-Out: {attendance.status} ({duration_hours:.1f} hrs)'
            return Response({'message': msg, 'time': str(current_time)})
            
        else:
            return Response({'message': 'Already Checked Out'}, status=400)


class UpdateAttendanceView(APIView):
    # Only Admin/Principal
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        user = request.user
        # Strict permission check: must be admin/principal
        if not (user.role in ['PRINCIPAL', 'SCHOOL_ADMIN'] or user.is_superuser):
             return Response({'error': 'Unauthorized'}, status=403)
             
        try:
            attendance = StaffAttendance.objects.get(id=pk, school=user.school)
        except StaffAttendance.DoesNotExist:
            return Response({'error': 'Attendance record not found'}, status=404)
            
        data = request.data
        
        # Update Fields
        if 'status' in data:
            attendance.status = data['status']
            
        if 'check_in' in data:
            # Expected HH:MM:SS or HH:MM
            attendance.check_in = data['check_in']
            
        if 'check_out' in data:
             attendance.check_out = data['check_out']
             
        if 'correction_reason' in data:
             attendance.correction_reason = data['correction_reason']
             
        attendance.source = 'WEB_MANUAL' # Mark as manual edit
        attendance.save()
        
        return Response({'message': 'Attendance updated successfully'})


class StaffAttendanceReportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        school = user.school
        
        # Filters
        staff_id = request.query_params.get('staff_id')
        month = int(request.query_params.get('month', datetime.date.today().month))
        year = int(request.query_params.get('year', datetime.date.today().year))
        
        if not staff_id:
            # If no staff_id provided, assume self-view if not admin searching
            staff_id = user.id
            
        # Get Staff Member
        try:
             target_staff = CoreUser.objects.get(id=staff_id, school=school)
        except CoreUser.DoesNotExist:
             return Response({'error': 'Staff not found'}, status=404)

        # Get Base Salary
        try:
             from finance.models import StaffSalaryStructure
             salary_struct = StaffSalaryStructure.objects.get(staff=target_staff, school=school)
             base_salary = float(salary_struct.base_salary)
        except (ImportError, Exception): # Handle DoesNotExist or import
             base_salary = 0.0

        # Calculate Date Range
        import calendar
        num_days = calendar.monthrange(year, month)[1]
        start_date = datetime.date(year, month, 1)
        end_date = datetime.date(year, month, num_days)

        daily_rate = base_salary / float(num_days) if base_salary > 0 else 0.0
        
        # Fetch Attendance
        attendances = StaffAttendance.objects.filter(
            staff=target_staff,
            date__gte=start_date,
            date__lte=end_date
        )
        
        # Build Map: Date -> Object
        att_map = {att.date: att for att in attendances}
        
        # Generate Full Month Report
        report = []
        present_days = 0
        half_days = 0
        leaves = 0
        absent_days = 0 
        
        for day in range(1, num_days + 1):
            current_date = datetime.date(year, month, day)
            status = 'ABSENT'
            record_id = None
            check_in = None
            check_out = None
            day_salary = 0.0
            
            if current_date in att_map:
                att = att_map[current_date]
                status = att.status
                record_id = att.id
                check_in = str(att.check_in) if att.check_in else None
                check_out = str(att.check_out) if att.check_out else None
            
            # Don't mark future dates as absent
            if current_date > datetime.date.today():
                status = '-'
            
            # Count Stats & Salary
            if status == 'PRESENT': 
                present_days += 1
                day_salary = daily_rate
            elif status == 'HALF_DAY': 
                half_days += 1
                day_salary = daily_rate / 2.0
            elif status == 'LEAVE': 
                leaves += 1
                # Check if Paid Leave? For now assume Paid if LEAVE status exists via Admin approval
                # Or check specific leave record if needed. Simplicity: If Admin marked LEAVE, it's paid usually?
                # Actually earlier I said "Unpaid (LWP)"... 
                # Let's check `StaffAttendance.correction_reason` or similar? 
                # For now, let's enable salary for LEAVE to be opt-in, but default 0?
                # User asked "day wise salary", usually Paid Leave counts.
                # Let's assume LEAVE is PAID for now unless marked UNPAID in attendance (which we don't handle deep yet).
                day_salary = daily_rate 
            elif status == 'ABSENT' and current_date <= datetime.date.today(): 
                absent_days += 1
                day_salary = 0.0
            
            report.append({
                'date': current_date.strftime("%Y-%m-%d"),
                'day': day,
                'status': status,
                'id': record_id,
                'check_in': check_in,
                'check_out': check_out,
                'daily_salary': round(day_salary, 2)
            })
            
        # Check if Salary Generated
        salary_id = None
        is_paid = False
        try:
             from finance.models import Salary
             sal_obj = Salary.objects.get(staff=target_staff, month=datetime.date(year, month, 1))
             salary_id = sal_obj.id
             is_paid = sal_obj.is_paid
        except (ImportError, Exception):
             pass

        return Response({
            'staff_name': f"{target_staff.first_name} {target_staff.last_name}",
            'month': datetime.date(year, month, 1).strftime("%B %Y"),
            'stats': {
                'present': present_days,
                'half_day': half_days,
                'leave': leaves,
                'absent': absent_days
            },
            'daily_logs': report,
            'salary_generated': bool(salary_id),
            'salary_id': salary_id,
            'is_paid': is_paid
        })

class StaffDailyAttendanceView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        school = request.user.school
        if not school:
            return Response({'error': 'School context required'}, status=400)
            
        date_str = request.query_params.get('date')
        if not date_str:
            target_date = datetime.date.today()
        else:
            try:
                target_date = datetime.datetime.strptime(date_str, "%Y-%m-%d").date()
            except ValueError:
                return Response({'error': 'Invalid date format (YYYY-MM-DD)'}, status=400)

        # Get all active staff (Everyone except Students, Parents, SuperAdmin)
        all_staff = CoreUser.objects.filter(school=school, is_active=True).exclude(
            role__in=[CoreUser.ROLE_STUDENT, CoreUser.ROLE_PARENT, CoreUser.ROLE_SUPER_ADMIN]
        )
        
        # Get attendances for this date
        attendances = StaffAttendance.objects.filter(school=school, date=target_date)
        att_map = {att.staff_id: att for att in attendances}
        
        data = []
        for staff in all_staff:
            att = att_map.get(staff.id)
            data.append({
                'id': staff.id,
                'name': f"{staff.first_name} {staff.last_name}",
                'status': att.status if att else 'ABSENT',
                'check_in': str(att.check_in) if (att and att.check_in) else '-',
                'check_out': str(att.check_out) if (att and att.check_out) else '-',
                'attendance_id': att.id if att else None
            })
            
        return Response({
            'date': target_date.strftime("%Y-%m-%d"),
            'records': data
        })


class CheckLocationView(APIView):
    """
    Real-time location validation endpoint for visual feedback.
    Returns distance from school and validation status for green/red light indicator.
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        lat = request.data.get('latitude') or request.data.get('gps_lat')
        lng = request.data.get('longitude') or request.data.get('gps_long')
        
        if not lat or not lng:
            return Response({'error': 'Missing location data'}, status=400)
        
        school = request.user.school
        if not school.gps_lat or not school.gps_long:
            return Response({
                'error': 'School GPS not configured',
                'status': 'unknown',
                'can_mark': False
            }, status=400)
        
        # Calculate distance
        distance = calculate_distance(lat, lng, school.gps_lat, school.gps_long)
        
        # Determine status based on Configured Radius
        max_dist = school.geofence_radius or 50 # Default to 50 if somehow null
        
        if distance <= (max_dist * 0.4): # Excellent = within 40% of radius
            status = 'excellent'
            can_mark = True
            message = f"Perfect! You're at the school ({distance:.0f}m)"
            color = '#10b981'
        elif distance <= (max_dist * 0.7): # Good = within 70% of radius
            status = 'good'
            can_mark = True
            message = f"Good location ({distance:.0f}m away)"
            color = '#84cc16'
        elif distance <= max_dist: # Acceptable = within radius
            status = 'acceptable'
            can_mark = True
            message = f"Acceptable ({distance:.0f}m away)"
            color = '#eab308'
        elif distance <= (max_dist * 1.4): # Warning = slightly outside
            status = 'warning'
            can_mark = False
            message = f"Too far! Move closer ({distance:.0f}m away)"
            color = '#f97316'
        else:
            status = 'error' # Error = far outside
            can_mark = False
            message = f"Outside geo-fence ({distance:.0f}m away, max: {max_dist}m)"
            color = '#ef4444'
        
        return Response({
            'distance': round(distance, 1),
            'max_distance': max_dist,
            'status': status,
            'can_mark': can_mark,
            'message': message,
            'color': color,
            'school_location': {
                'lat': float(school.gps_lat),
                'lng': float(school.gps_long)
            }
        })

from rest_framework.permissions import AllowAny
from django.contrib.auth import get_user_model

class StaffPasswordResetView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        mobile = request.data.get('mobile')
        reset_code = request.data.get('reset_code')
        new_password = request.data.get('new_password')

        if not mobile or not reset_code or not new_password:
            return Response({'error': 'Mobile, Reset Code, and New Password are required'}, status=400)

        User = get_user_model()
        try:
            # Find user by mobile
            user = User.objects.filter(mobile=mobile).first()
            
            if not user:
                return Response({'error': 'User not found with this mobile number'}, status=404)

            # Check profile
            if not hasattr(user, 'staff_profile'):
                 return Response({'error': 'Not a staff account (No Profile)'}, status=400)
            
            # Verify Reset Code
            if not user.staff_profile.reset_code:
                 return Response({'error': 'No reset code generated. Contact Admin.'}, status=400)
                 
            if user.staff_profile.reset_code != reset_code:
                return Response({'error': 'Invalid Reset Code'}, status=403)

            # Allow Reset & Clear Code
            user.set_password(new_password)
            user.staff_profile.reset_code = None # One-time use
            user.staff_profile.save()
            user.save()
            
            return Response({'message': 'Password reset successfully. Please login.'})

        except Exception as e:
            print(f"Reset Error: {e}")
            return Response(serializer.errors, status=400)


# Toggle Staff Active Status
class ToggleStaffActiveView(APIView):
    """Toggle staff is_active status"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request, staff_id):
        try:
            # Get CoreUser (staff)
            staff = CoreUser.objects.get(id=staff_id, school=request.user.school)
            
            # Only superuser or admin can toggle staff status
            if not request.user.is_superuser:
                return Response({'error': 'Permission denied'}, status=403)
            
            staff.is_active = not staff.is_active
            staff.save()
            
            return Response({
                'success': True,
                'is_active': staff.is_active,
                'message': f'Staff {"activated" if staff.is_active else "deactivated"} successfully'
            })
        except CoreUser.DoesNotExist:
            return Response({'error': 'Staff not found'}, status=404)

from rest_framework import permissions
import random

class GenerateResetCodeView(APIView):
    permission_classes = [permissions.IsAuthenticated] # Admin only
    
    def post(self, request, pk):
        # Only Allow Admins/Principals
        if not (request.user.is_superuser or request.user.role in ['SCHOOL_ADMIN', 'PRINCIPAL']):
            return Response({'error': 'Permission Denied'}, status=403)
            
        try:
            User = get_user_model()
            target_user = User.objects.get(pk=pk, school=request.user.school)
            
            # Generate 6 digit code
            code = str(random.randint(100000, 999999))
            
            if hasattr(target_user, 'staff_profile'):
                target_user.staff_profile.reset_code = code
                target_user.staff_profile.save()
                return Response({'message': 'Reset Code Generated', 'code': code})
            else:
                return Response({'error': 'User has no staff profile'}, status=400)
                
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=404)
