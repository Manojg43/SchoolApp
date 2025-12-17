from django.db.models.signals import post_save, post_delete, pre_save
from django.dispatch import receiver
from django.forms.models import model_to_dict
from django.db.utils import OperationalError, ProgrammingError
from django.dispatch import receiver
from django.forms.models import model_to_dict
from .models import AuditLog
from .middleware import get_current_user
import json
from django.core.serializers.json import DjangoJSONEncoder

# Ignore specific models to avoid noise/recursion
IGNORED_MODELS = ['AuditLog', 'Session', 'LogEntry']

@receiver(pre_save)
def capture_previous_state(sender, instance, **kwargs):
    if sender.__name__ in IGNORED_MODELS:
        return
    if instance.pk:
        try:
            old_instance = sender.objects.get(pk=instance.pk)
            instance._old_state = model_to_dict(old_instance)
        except sender.DoesNotExist:
            instance._old_state = None
    else:
        instance._old_state = None

@receiver(post_save)
def log_save(sender, instance, created, **kwargs):
    if sender.__name__ in IGNORED_MODELS:
        return
        
    user = get_current_user()
    action = AuditLog.ACTION_CREATE if created else AuditLog.ACTION_UPDATE
    
    changes = {}
    if not created and hasattr(instance, '_old_state'):
        new_state = model_to_dict(instance)
        for key, value in new_state.items():
            if key in instance._old_state and instance._old_state[key] != value:
                changes[key] = {'old': str(instance._old_state[key]), 'new': str(value)}
    
    try:
        AuditLog.objects.create(
            user=user,
            action=action,
            model_name=sender.__name__,
            object_id=str(instance.pk),
            object_repr=str(instance),
            changes=changes if changes else None
        )
    except (OperationalError, ProgrammingError):
        # Table might not exist yet during migrations
        pass

@receiver(post_delete)
def log_delete(sender, instance, **kwargs):
    if sender.__name__ in IGNORED_MODELS:
        return
        
    user = get_current_user()
    try:
        AuditLog.objects.create(
            user=user,
            action=AuditLog.ACTION_DELETE,
            model_name=sender.__name__,
            object_id=str(instance.pk),
            object_repr=str(instance),
            changes={'info': 'Object Deleted'}
        )
    except (OperationalError, ProgrammingError):
        pass
