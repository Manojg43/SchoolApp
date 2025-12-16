from django.apps import AppConfig


class CoreConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'core'

    def ready(self):
        import core.signals
        
        # Disconnect update_last_login to prevent writes on login (for Vercel Read-Only)
        try:
            from django.contrib.auth import user_logged_in
            from django.contrib.auth.models import update_last_login
            user_logged_in.disconnect(update_last_login, dispatch_uid='update_last_login')
        except Exception:
            pass
