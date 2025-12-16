from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import Vehicle, Route, Stop, TransportSubscription
from .serializers import VehicleSerializer, RouteSerializer, StopSerializer, TransportSubscriptionSerializer

class VehicleViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = VehicleSerializer

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser:
            return Vehicle.objects.all()
        return Vehicle.objects.filter(school=user.school)

    def perform_create(self, serializer):
        serializer.save(school=self.request.user.school)

class RouteViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = RouteSerializer

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser:
            return Route.objects.all()
        return Route.objects.filter(school=user.school)
        
    def perform_create(self, serializer):
        serializer.save(school=self.request.user.school)

class TransportSubscriptionViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = TransportSubscriptionSerializer

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser:
            return TransportSubscription.objects.all()
        return TransportSubscription.objects.filter(school=user.school)

    def perform_create(self, serializer):
        serializer.save(school=self.request.user.school)
