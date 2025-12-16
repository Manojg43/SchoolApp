from django.contrib import admin
from .models import Student, Attendance, Fee

@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = ('student_id', 'first_name', 'last_name', 'school', 'current_class')
    search_fields = ('first_name', 'last_name', 'student_id', 'enrollment_number')
    list_filter = ('school', 'current_class', 'gender')

@admin.register(Attendance)
class AttendanceAdmin(admin.ModelAdmin):
    list_display = ('student', 'date', 'status', 'school')
    list_filter = ('date', 'status', 'school')

@admin.register(Fee)
class FeeAdmin(admin.ModelAdmin):
    list_display = ('student', 'title', 'amount', 'status', 'due_date')
    list_filter = ('status', 'school')

