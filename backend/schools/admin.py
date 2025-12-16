from django.contrib import admin
from .models import School, AcademicYear, Class, Section, Achievement

@admin.register(School)
class SchoolAdmin(admin.ModelAdmin):
    list_display = ('school_id', 'name', 'address', 'created_at')
    search_fields = ('name', 'school_id')

@admin.register(AcademicYear)
class AcademicYearAdmin(admin.ModelAdmin):
    list_display = ('name', 'school', 'start_date', 'end_date', 'is_active')
    list_filter = ('school', 'is_active')

@admin.register(Class)
class ClassAdmin(admin.ModelAdmin):
    list_display = ('name', 'school', 'order')
    list_filter = ('school',)

@admin.register(Section)
class SectionAdmin(admin.ModelAdmin):
    list_display = ('name', 'parent_class', 'school')
    list_filter = ('school',)

@admin.register(Achievement)
class AchievementAdmin(admin.ModelAdmin):
    list_display = ('title', 'school', 'date')

