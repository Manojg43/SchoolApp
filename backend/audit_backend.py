import os
import django
from django.apps import apps
from django.contrib import admin
from django.db import connection, OperationalError

# Setup
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

def audit_models():
    print("--- 1. Checking All Models & Tables ---")
    all_models = apps.get_models()
    tables = connection.introspection.table_names()
    
    missing_tables = []
    
    print(f"Found {len(all_models)} Models in Django Registry.")
    print(f"Found {len(tables)} Tables in Database (Local Check).")
    
    for model in all_models:
        table_name = model._meta.db_table
        if table_name in tables:
            # print(f"[OK] {model.__name__} -> {table_name}")
            pass
        else:
            print(f"[FAIL] {model.__name__} -> {table_name} NOT FOUND in DB")
            missing_tables.append(model.__name__)

    if not missing_tables:
        print("[SUCCESS] All Django Models have corresponding tables locally.")
    else:
        print(f"[WARN] {len(missing_tables)} Missing Tables (Local).")

    print("\n--- 2. Checking Admin Registry ---")
    admin_models = list(admin.site._registry.keys())
    print(f"Found {len(admin_models)} Models registered in Admin.")
    
    for model in admin_models:
        print(f" - {model.__name__}")
        # Verify list_display configuration safety (basic check)
        model_admin = admin.site._registry[model]
        if hasattr(model_admin, 'list_display'):
             pass # Just verifying access doesn't crash
             
    print("\n[SUMMARY] Audit Complete. If 'Tables' check passed, DB schema is likely valid.")

if __name__ == "__main__":
    try:
        audit_models()
    except Exception as e:
        print(f"[CRITICAL ERROR] Audit crashed: {e}")
