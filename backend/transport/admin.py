from django.contrib import admin
from .models import Vehicle, Route, Stop, TransportSubscription

@admin.register(Vehicle)
class VehicleAdmin(admin.ModelAdmin):
    list_display = ('vehicle_id', 'registration_number', 'model', 'school')

@admin.register(Route)
class RouteAdmin(admin.ModelAdmin):
    list_display = ('name', 'school')

@admin.register(Stop)
class StopAdmin(admin.ModelAdmin):
    list_display = ('route', 'name', 'order')

@admin.register(TransportSubscription)
class TransportSubscriptionAdmin(admin.ModelAdmin):
    list_display = ('student', 'vehicle', 'stop', 'academic_year')
