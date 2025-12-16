from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
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
            "school": user.school.name if user.school else "Global/Super Admin"
        }
        
        # Add designation if exists
        try:
            sp = user.staff_profile
            profile_data['designation'] = sp.designation
            profile_data['department'] = sp.department
        except StaffProfile.DoesNotExist:
            profile_data['designation'] = "Staff"
            profile_data['department'] = "-"

        # 2. Attendance Stats (Current Month)
        attendance_qs = StaffAttendance.objects.filter(
            staff=user, 
            date__gte=month_start, 
            date__lte=today
        )
        present_count = attendance_qs.filter(status='PRESENT').count()
        absent_count = attendance_qs.filter(status='ABSENT').count()
        leaves_count = attendance_qs.filter(status='LEAVE').count()
        
        # Today's Status
        today_att = attendance_qs.filter(date=today).first()
        today_status = today_att.status if today_att else "NOT_MARKED"
        check_in_time = str(today_att.check_in) if today_att and today_att.check_in else "-"

        # 3. Salary Info (Latest Generated)
        last_salary = Salary.objects.filter(staff=user).order_by('-month').first()
        salary_info = {}
        if last_salary:
            salary_info = {
                "month": last_salary.month.strftime("%B %Y"),
                "net_salary": str(last_salary.net_salary),
                "is_paid": last_salary.is_paid,
                "paid_date": str(last_salary.paid_date) if last_salary.paid_date else None,
                "present_days": float(last_salary.present_days)
            }
        else:
            salary_info = {"month": "-", "net_salary": "0.00", "is_paid": False}

        return Response({
            "user": profile_data,
            "attendance": {
                "present": present_count,
                "absent": absent_count,
                "leaves": leaves_count,
                "today_status": today_status,
                "check_in": check_in_time
            },
            "salary": salary_info
        })

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
                role__in=[CoreUser.ROLE_TEACHER, CoreUser.ROLE_SCHOOL_ADMIN, CoreUser.ROLE_PRINCIPAL, CoreUser.ROLE_OFFICE_STAFF, CoreUser.ROLE_Accountant, CoreUser.ROLE_DRIVER, CoreUser.ROLE_CLEANING_STAFF]
            ).exclude(is_superuser=True)
        else:
            qs = CoreUser.objects.filter(
                school=user.school,
                role__in=[CoreUser.ROLE_TEACHER, CoreUser.ROLE_SCHOOL_ADMIN, CoreUser.ROLE_PRINCIPAL, CoreUser.ROLE_OFFICE_STAFF, CoreUser.ROLE_Accountant, CoreUser.ROLE_DRIVER, CoreUser.ROLE_CLEANING_STAFF]
            )
        return qs.select_related('staff_profile')

    def perform_create(self, serializer):
        # Auto-assign school from admin user
        serializer.save(school=self.request.user.school)

class GenerateSchoolQR(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Admin generates this for the SCHOOL DISPLAY screen
        user = request.user
        school_id = user.school.school_id
        timestamp = str(int(time.time()))
        nonce = str(uuid.uuid4())[:8]
        
        # Raw Data
        raw_data = f"{school_id}|{timestamp}|{nonce}"
        
        # HMAC Sign (Prevent Spoofing)
        signature = hmac.new(
            settings.SECRET_KEY.encode(),
            raw_data.encode(),
            hashlib.sha256
        ).hexdigest()
        
        token = f"{raw_data}|{signature}"
        
        return Response({
            'qr_token': token,
            'expires_in': 30, # Rotate every 30s
            'school_name': user.school.name
        })

class ScanAttendanceView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        token = request.data.get('qr_token')
        # Support both 'latitude' (std) and 'gps_lat' (legacy/mobile)
        lat = request.data.get('latitude') or request.data.get('gps_lat')
        lng = request.data.get('longitude') or request.data.get('gps_long')
        
        if not all([token, lat, lng]):
            return Response({'error': 'Missing data (token, lat, lng)'}, status=400)
            
        # 1. Verify Signature
        try:
            raw_data, signature = token.rsplit('|', 1)
            expected_sig = hmac.new(
                settings.SECRET_KEY.encode(),
                raw_data.encode(),
                hashlib.sha256
            ).hexdigest()
            
            if not hmac.compare_digest(signature, expected_sig):
                return Response({'error': 'Invalid QR Signature'}, status=403)
                
            school_id, timestamp, nonce = raw_data.split('|')
            
            # 2. Verify School
            if request.user.school.school_id != school_id:
                return Response({'error': 'Wrong School QR'}, status=403)
                
            # 3. Verify Timestamp (Strict 60s window)
            if time.time() - int(timestamp) > 60:
                 return Response({'error': 'QR Expired'}, status=400)
                 
        except Exception:
            return Response({'error': 'Malformed Token'}, status=400)

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
            attendance.source = 'QR_GEO'
            attendance.gps_lat = lat
            attendance.gps_long = lng
            attendance.save()
            return Response({'message': 'Check-In Successful', 'time': str(current_time)})
            
        elif not attendance.check_out:
            attendance.check_out = current_time
            attendance.save()
            return Response({'message': 'Check-Out Successful', 'time': str(current_time)})
            
        else:
            return Response({'message': 'Already Checked Out'}, status=400)

