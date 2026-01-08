from rest_framework import serializers
from core.models import CoreUser
from .models import StaffProfile, StaffAttendance

class StaffProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = StaffProfile
        fields = ['designation', 'department', 'joining_date']

class StaffSerializer(serializers.ModelSerializer):
    # Safe access using helpers
    designation = serializers.SerializerMethodField()
    department = serializers.SerializerMethodField()
    joining_date = serializers.SerializerMethodField()

    password = serializers.CharField(write_only=True, required=False) 
    
    # Writable Nested Profile
    profile = StaffProfileSerializer(source='staff_profile', required=False)

    def get_designation(self, obj):
        if hasattr(obj, 'staff_profile'):
            return obj.staff_profile.designation
        return ""

    def get_department(self, obj):
        if hasattr(obj, 'staff_profile'):
            return obj.staff_profile.department
        return ""

    def get_joining_date(self, obj):
        # Try staff profile first, then teacher profile
        if hasattr(obj, 'staff_profile') and obj.staff_profile.joining_date:
            return obj.staff_profile.joining_date
        if hasattr(obj, 'teacher_profile') and obj.teacher_profile.joining_date:
            return obj.teacher_profile.joining_date
        return None 

    can_mark_manual_attendance = serializers.BooleanField(default=False)

    def get_can_mark_manual_attendance(self, obj):
         if hasattr(obj, 'staff_profile'):
             return obj.staff_profile.can_mark_manual_attendance
         return False

    class Meta:
        model = CoreUser
        fields = ['id', 'user_id', 'first_name', 'last_name', 'email', 'mobile', 'role', 'designation', 'department', 'joining_date', 'password', 'is_active', 'can_mark_manual_attendance', 'profile']
        read_only_fields = ['id', 'user_id', 'designation', 'department', 'joining_date'] # derive from profile

    def create(self, validated_data):
        profile_data = {}
        if 'staff_profile' in validated_data:
             profile_data = validated_data.pop('staff_profile')
        
        manual_attendance = validated_data.pop('can_mark_manual_attendance', False)
        
        # Create User
        password = validated_data.pop('password', 'Staff@123')
        
        if 'username' not in validated_data and 'email' in validated_data:
            validated_data['username'] = validated_data['email']
            
        user = CoreUser.objects.create_user(**validated_data, password=password)
        
        # Create Profile
        StaffProfile.objects.create(user=user, can_mark_manual_attendance=manual_attendance, **profile_data)
        return user

    def update(self, instance, validated_data):
        profile_data = validated_data.pop('staff_profile', {})
        manual_attendance = validated_data.pop('can_mark_manual_attendance', None)

        # Update User fields
        for attr, value in validated_data.items():
            if attr != 'password':
                setattr(instance, attr, value)
        instance.save()
        
        # Update Profile
        # Always ensure profile exists
        profile, created = StaffProfile.objects.get_or_create(user=instance)
        
        # Update manual attendance if provided
        if manual_attendance is not None:
             profile.can_mark_manual_attendance = manual_attendance

        if profile_data:
            for attr, value in profile_data.items():
                 setattr(profile, attr, value)
        
        profile.save()
            
        return instance
