from rest_framework import serializers
from .models import Vehicle, Route, Stop, TransportSubscription

class RouteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Route
        fields = '__all__'
        read_only_fields = ['school', 'vehicle']

class VehicleSerializer(serializers.ModelSerializer):
    # Nested routes for creation
    routes = RouteSerializer(many=True, required=False)
    
    class Meta:
        model = Vehicle
        fields = '__all__'
        read_only_fields = ['vehicle_id', 'school']

    def create(self, validated_data):
        routes_data = validated_data.pop('routes', [])
        vehicle = Vehicle.objects.create(**validated_data)
        
        for route_data in routes_data:
            Route.objects.create(vehicle=vehicle, school=vehicle.school, **route_data)
            
        return vehicle

class StopSerializer(serializers.ModelSerializer):
    class Meta:
        model = Stop
        fields = '__all__'



class TransportSubscriptionSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.first_name', read_only=True)
    vehicle_number = serializers.CharField(source='vehicle.registration_number', read_only=True)
    stop_name = serializers.CharField(source='stop.name', read_only=True)
    
    class Meta:
        model = TransportSubscription
        fields = '__all__'
        read_only_fields = ['school']
