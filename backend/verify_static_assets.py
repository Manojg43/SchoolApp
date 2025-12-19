import os
import django
from django.contrib.staticfiles import finders
from django.conf import settings

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

def verify_static_assets():
    print("--- Verifying Static Assets ---")
    
    # Critical Admin Assets that often cause issues if missing
    critical_assets = [
        'admin/css/base.css',
        'admin/js/core.js',
        'admin/img/icon-yes.svg',
    ]

    missing = []
    for path in critical_assets:
        found = finders.find(path)
        if found:
            print(f"[OK] Found: {path}")
        else:
            print(f"[FAIL] Missing: {path}")
            missing.append(path)
            
    print("\n--- Configuration Check ---")
    # Check if we successfully disabled strict mode
    try:
        strict = getattr(settings, 'WHITENOISE_MANIFEST_STRICT', None)
        print(f"WHITENOISE_MANIFEST_STRICT = {strict}")
        if strict is False:
             print("[OK] Strict mode is DISABLED (Safe for Prod)")
        else:
             print("[WARN] Strict mode might be ENABLED (Risk of 500)")
    except Exception as e:
        print(f"[ERR] Could not check settings: {e}")

    if missing:
        print(f"\n[SUMMARY] {len(missing)} missing assets found. These will return 404s but NOT crash the server now.")
    else:
        print("\n[SUMMARY] All critical assets found locally.")

if __name__ == "__main__":
    verify_static_assets()
