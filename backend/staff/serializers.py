from rest_framework import serializers
from core.models import CoreUser
from .models import StaffProfile, StaffAttendance

class StaffProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = StaffProfile
        fields = ['designation', 'department', 'joining_date']

class StaffSerializer(serializers.ModelSerializer):
    # Flatten nested profile data for easier frontend consumption
    designation = serializers.CharField(source='staff_profile.designation', required=False, allow_blank=True)
    department = serializers.CharField(source='staff_profile.department', required=False, allow_blank=True)
    joining_date = serializers.DateField(source='staff_profile.joining_date', required=False, allow_null=True)
    
    password = serializers.CharField(write_only=True, required=False) 

    class Meta:
        model = CoreUser
        fields = ['id', 'user_id', 'first_name', 'last_name', 'email', 'mobile', 'role', 'designation', 'department', 'joining_date', 'password', 'is_active']
        read_only_fields = ['id', 'user_id']

    def create(self, validated_data):
        profile_data = {}
        # Extract profile fields
        if 'staff_profile' in validated_data:
             profile_data = validated_data.pop('staff_profile')
        
        # Create User
        # Remove 'staff_profile' from validated_data to avoid error in create_user
        password = validated_data.pop('password', 'Staff@123') # Default password
        
        # Auto-generate username from email if not provided
        if 'username' not in validated_data and 'email' in validated_data:
            validated_data['username'] = validated_data['email']
            
        user = CoreUser.objects.create_user(**validated_data, password=password)
        
        # Create Profile
        StaffProfile.objects.create(user=user, **profile_data)
        return user

    def update(self, instance, validated_data):
        profile_data = validated_data.pop('staff_profile', {})
        
        # Update User fields
        for attr, value in validated_data.items():
            if attr != 'password':
                setattr(instance, attr, value)
        instance.save()
        
        # Update Profile
        if profile_data:
            profile, created = StaffProfile.objects.get_or_create(user=instance)
            for attr, value in profile_data.items():
                 setattr(profile, attr, value)
            profile.save()
            
        return instance
