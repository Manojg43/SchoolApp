from django.contrib import admin
from .models import Student, StudentHistory, Attendance, Fee

@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = ('student_id', 'first_name', 'last_name', 'school', 'current_class')
    search_fields = ('first_name', 'last_name', 'student_id', 'enrollment_number')
    list_filter = ('school', 'current_class', 'gender')

@admin.register(StudentHistory)
class StudentHistoryAdmin(admin.ModelAdmin):
    list_display = ('student', 'academic_year', 'class_enrolled', 'percentage', 'grade', 'promotion_status', 'class_rank')
    list_filter = ('academic_year', 'promotion_status', 'grade', 'conduct', 'school')
    search_fields = ('student__first_name', 'student__last_name', 'student__student_id')
    readonly_fields = ('recorded_at', 'updated_at', 'recorded_by')
    
    fieldsets = (
        ('Student Info', {
            'fields': ('school', 'student', 'academic_year', 'class_enrolled', 'section_enrolled')
        }),
        ('Academic Performance', {
            'fields': ('total_marks', 'max_marks', 'percentage', 'grade', 'class_rank', 'section_rank')
        }),
        ('Attendance', {
            'fields': ('total_working_days', 'days_present', 'attendance_percentage')
        }),
        ('Promotion', {
            'fields': ('promotion_status', 'promoted_to_class', 'detention_reason')
        }),
        ('Conduct & Remarks', {
            'fields': ('conduct', 'result', 'remarks')
        }),
        ('Audit', {
            'fields': ('recorded_by', 'recorded_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

@admin.register(Attendance)
class AttendanceAdmin(admin.ModelAdmin):
    list_display = ('student', 'date', 'status', 'school')
    list_filter = ('date', 'status', 'school')

@admin.register(Fee)
class FeeAdmin(admin.ModelAdmin):
    list_display = ('student', 'title', 'amount', 'status', 'due_date')
    list_filter = ('status', 'school')
