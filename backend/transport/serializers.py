from rest_framework import serializers
from .models import Vehicle, Route, Stop, TransportSubscription

class VehicleSerializer(serializers.ModelSerializer):
    driver_name = serializers.CharField(source='driver.first_name', read_only=True)
    
    class Meta:
        model = Vehicle
        fields = '__all__'
        read_only_fields = ['vehicle_id', 'school']

class StopSerializer(serializers.ModelSerializer):
    class Meta:
        model = Stop
        fields = '__all__'

class RouteSerializer(serializers.ModelSerializer):
    stops = StopSerializer(many=True, read_only=True)
    
    class Meta:
        model = Route
        fields = '__all__'
        read_only_fields = ['school']

class TransportSubscriptionSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.first_name', read_only=True)
    vehicle_number = serializers.CharField(source='vehicle.registration_number', read_only=True)
    stop_name = serializers.CharField(source='stop.name', read_only=True)
    
    class Meta:
        model = TransportSubscription
        fields = '__all__'
        read_only_fields = ['school']
