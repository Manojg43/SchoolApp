"""
Caching utilities for high-performance data retrieval
"""
from django.core.cache import cache
from django.db.models import Count, Sum
from functools import wraps


def cache_key_for_school(prefix, school_id):
    """Generate a consistent cache key for school-specific data"""
    return f'{prefix}_{school_id}'


def invalidate_school_cache(school_id, *prefixes):
    """Invalidate multiple cache keys for a school"""
    for prefix in prefixes:
        cache_key = cache_key_for_school(prefix, school_id)
        cache.delete(cache_key)


def cached_query(cache_key_prefix, timeout=300):
    """
    Decorator to cache function results
    
    Usage:
        @cached_query('student_count', timeout=600)
        def get_student_count(school_id):
            return Student.objects.filter(school_id=school_id).count()
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Generate cache key from function args
            cache_key = f'{cache_key_prefix}_{args}_{kwargs}'
            
            # Try to get from cache
            result = cache.get(cache_key)
            
            if result is None:
                # Calculate and cache
                result = func(*args, **kwargs)
                cache.set(cache_key, result, timeout=timeout)
            
            return result
        return wrapper
    return decorator


def get_dashboard_stats(school_id):
    """
    Get cached dashboard statistics for a school
    Cache for 5 minutes to reduce database load
    """
    from students.models import Student
    from staff.models import CoreUser
    from finance.models import Invoice
    
    cache_key = cache_key_for_school('dashboard_stats', school_id)
    stats = cache.get(cache_key)
    
    if not stats:
        stats = {
            'total_students': Student.objects.filter(
                school__school_id=school_id, is_active=True
            ).count(),
            'total_staff': CoreUser.objects.filter(
                school__school_id=school_id,
                role__in=['TEACHER', 'SCHOOL_ADMIN', 'PRINCIPAL']
            ).count(),
            'pending_invoices': Invoice.objects.filter(
                school__school_id=school_id,
                status='PENDING'
            ).count(),
            'pending_amount': Invoice.objects.filter(
                school__school_id=school_id,
                status='PENDING'
            ).aggregate(
                total=Sum('balance_amount')
            )['total'] or 0,
        }
        
        # Cache for 5 minutes
        cache.set(cache_key, stats, timeout=300)
    
    return stats


def get_cached_fee_structure(class_id):
    """
    Get cached fee structure for a class
    Cache for 1 hour as fee structures change infrequently
    """
    from finance.models import FeeStructure
    
    cache_key = f'fee_structure_{class_id}'
    structure = cache.get(cache_key)
    
    if not structure:
        structure = list(
            FeeStructure.objects.filter(
                class_assigned_id=class_id
            ).select_related('category').values(
                'id', 'category__name', 'amount', 'term'
            )
        )
        
        # Cache for 1 hour
        cache.set(cache_key, structure, timeout=3600)
    
    return structure


def invalidate_student_cache(school_id):
    """Invalidate all student-related caches"""
    invalidate_school_cache(
        school_id,
        'dashboard_stats',
        'active_students',
        'student_count'
    )


def invalidate_invoice_cache(school_id):
    """Invalidate all invoice-related caches"""
    invalidate_school_cache(
        school_id,
        'dashboard_stats',
        'pending_invoices',
        'fee_summary'
    )
