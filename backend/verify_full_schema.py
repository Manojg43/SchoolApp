import os
import django
from django.db import connection

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.apps import apps

def verify_tables():
    target_apps = ['schools', 'core', 'students', 'staff', 'finance', 'transport', 'certificates']
    
    print("--- Verifying Database Schema ---")
    
    # Get all models
    missing_tables = []
    present_tables = []
    
    with connection.cursor() as cursor:
        # Get list of all actual tables in DB
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        """)
        actual_tables = {row[0] for row in cursor.fetchall()}
        
    for app_name in target_apps:
        try:
            app_config = apps.get_app_config(app_name)
            for model in app_config.get_models():
                table_name = model._meta.db_table
                if table_name in actual_tables:
                    present_tables.append(f"{app_name}.{model.__name__} -> {table_name}")
                else:
                    missing_tables.append(f"{app_name}.{model.__name__} -> {table_name}")
        except LookupError:
             print(f"Warning: App '{app_name}' not loaded.")

    print(f"\n[OK] Present Tables ({len(present_tables)}):")
    for t in present_tables:
        print(f"  - {t}")
        
    if missing_tables:
        print(f"\n[FAIL] Missing Tables ({len(missing_tables)}):")
        for t in missing_tables:
            print(f"  - {t}")
        exit(1)
    else:
        print("\nAll Django models are successfully mapped to Database tables.")

    # 2. Check School Data
    from schools.models import School
    print("\n--- Verifying School Data ---")
    schools = School.objects.all()
    if schools.exists():
        for s in schools:
            print(f"Found School: {s.name} (ID: {s.school_id})")
            print(f"  - Logo URL: {s.logo_url or 'None'}")
            print(f"  - Banner URL: {s.signature_url or 'None'}") # Using signature for now
    else:
        print("⚠️ No schools found in database.")

if __name__ == "__main__":
    verify_tables()
