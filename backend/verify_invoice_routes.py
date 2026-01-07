import os
import django
from django.urls import reverse, resolve

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

def verify_routes():
    print("Verifying Route Migration...")
    
    # 1. Check New Route
    try:
        url = reverse('invoice-list')
        print(f"✅ Success: 'invoice-list' resolves to: {url}")
        
        match = resolve(url)
        print(f"   - ViewSet: {match.func.cls.__name__}")
        print(f"   - App: {match.app_name}")
        
        if match.func.cls.__name__ == 'InvoiceViewSet':
             print("   - Correct ViewSet attached.")
        else:
             print(f"   ❌ Error: Expected InvoiceViewSet, got {match.func.cls.__name__}")

    except Exception as e:
        print(f"❌ Error resolving 'invoice-list': {e}")

    # 2. Check Old Route (Should Fail or be different)
    try:
        url = reverse('student-fees-list')
        print(f"⚠️ Warning: 'student-fees-list' still resolves to: {url}")
        # This might happen if I didn't restart server/reload urlconf, but here in script it loads fresh.
        # If it resolves, it means I failed to remove it properly.
    except Exception as e:
        print(f"✅ Success: 'student-fees-list' no longer exists (Got error: {e})")

if __name__ == '__main__':
    verify_routes()
