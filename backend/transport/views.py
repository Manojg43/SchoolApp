from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import Vehicle, Route, Stop, TransportSubscription
from .serializers import VehicleSerializer, RouteSerializer, StopSerializer, TransportSubscriptionSerializer
from core.permissions import StandardPermission
from core.pagination import StandardResultsPagination

class VehicleViewSet(viewsets.ModelViewSet):
    permission_classes = [StandardPermission]
    serializer_class = VehicleSerializer
    pagination_class = StandardResultsPagination

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser:
            return Vehicle.objects.select_related('school').all()
        return Vehicle.objects.select_related('school').filter(school=user.school)

    def perform_create(self, serializer):
        serializer.save(school=self.request.user.school)

class RouteViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = RouteSerializer
    pagination_class = StandardResultsPagination

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser:
            return Route.objects.select_related('school').all()
        return Route.objects.select_related('school').filter(school=user.school)
        
    def perform_create(self, serializer):
        serializer.save(school=self.request.user.school)

class TransportSubscriptionViewSet(viewsets.ModelViewSet):
    permission_classes = [StandardPermission]
    serializer_class = TransportSubscriptionSerializer
    pagination_class = StandardResultsPagination

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser:
            return TransportSubscription.objects.select_related(
                'school', 'student', 'route'
            ).all()
        return TransportSubscription.objects.select_related(
            'school', 'student', 'route'
        ).filter(school=user.school)

    def perform_create(self, serializer):
        serializer.save(school=self.request.user.school)
