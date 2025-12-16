from django.db import models
from django.utils.translation import gettext_lazy as _
from schools.models import School, AcademicYear
from students.models import Student
from core.models import CoreUser
from core.utils import generate_business_id

class Vehicle(models.Model):
    id = models.AutoField(primary_key=True)
    vehicle_id = models.CharField(max_length=50, unique=True, editable=False)
    
    school = models.ForeignKey(School, on_delete=models.CASCADE)
    registration_number = models.CharField(_("Reg Number"), max_length=20)
    model = models.CharField(_("Model/Type"), max_length=100) # e.g. Tata Starbus
    capacity = models.PositiveIntegerField(_("Capacity"))
    
    driver = models.ForeignKey(CoreUser, on_delete=models.SET_NULL, null=True, limit_choices_to={'role': 'DRIVER'}, related_name='vehicles_driven')
    # If a vehicle has multiple drivers, we might need a ManyToMany or explicit Assignment model.
    # For now, 1 vehicle = 1 main driver.
    
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.vehicle_id:
            self.vehicle_id = generate_business_id('VEH')
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.registration_number} ({self.vehicle_id})"

class Route(models.Model):
    school = models.ForeignKey(School, on_delete=models.CASCADE)
    name = models.CharField(_("Route Name"), max_length=100)
    
    def __str__(self):
        return self.name

class Stop(models.Model):
    route = models.ForeignKey(Route, on_delete=models.CASCADE, related_name='stops')
    name = models.CharField(_("Stop Name"), max_length=100)
    order = models.PositiveIntegerField(_("Order"))
    fee_amount = models.DecimalField(_("Transport Fee"), max_digits=10, decimal_places=2, default=0)
    
    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"{self.route.name} - {self.name}"

class TransportSubscription(models.Model):
    school = models.ForeignKey(School, on_delete=models.CASCADE)
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='transport')
    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE)
    stop = models.ForeignKey(Stop, on_delete=models.CASCADE)
    academic_year = models.ForeignKey(AcademicYear, on_delete=models.CASCADE)
    
    start_date = models.DateField()
    end_date = models.DateField()
    
    class Meta:
        unique_together = ('student', 'academic_year')
