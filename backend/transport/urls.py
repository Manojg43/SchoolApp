from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import VehicleViewSet, RouteViewSet, TransportSubscriptionViewSet

router = DefaultRouter()
router.register(r'vehicles', VehicleViewSet, basename='vehicle')
router.register(r'routes', RouteViewSet, basename='route')
router.register(r'subscriptions', TransportSubscriptionViewSet, basename='transport-subscription')

urlpatterns = [
    path('', include(router.urls)),
]
