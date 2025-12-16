from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CoreUser, AuditLog

@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ('timestamp', 'action', 'model_name', 'object_repr', 'user')
    list_filter = ('action', 'model_name', 'timestamp')
    search_fields = ('object_repr', 'changes')
    readonly_fields = ('timestamp', 'action', 'user', 'model_name', 'object_id', 'object_repr', 'changes')
    
    def has_add_permission(self, request):
        return False
    
    def has_change_permission(self, request, obj=None):
        return False
    
    def has_delete_permission(self, request, obj=None):
        return False

@admin.register(CoreUser)
class CoreUserAdmin(UserAdmin):
    # Display fields in list view
    list_display = ('username', 'email', 'get_full_name', 'role', 'school', 'is_active', 'is_staff', 'is_superuser')
    list_filter = ('role', 'school', 'is_active', 'is_staff', 'is_superuser')
    search_fields = ('username', 'email', 'first_name', 'last_name', 'user_id')
    
    # Custom Fieldsets to include our new fields
    fieldsets = UserAdmin.fieldsets + (
        ('School & Role', {'fields': ('school', 'role', 'mobile')}),
    )
    
    # Enable adding custom fields during creation
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('School & Role', {'fields': ('school', 'role', 'mobile')}),
    )
    
    # Optimization for ManyToMany fields (Permissions)
    filter_horizontal = ('groups', 'user_permissions')

admin.site.site_header = "SchoolApp Super Admin"
admin.site.site_title = "SchoolApp Admin Portal"
admin.site.index_title = "Welcome to School Management System"
