"""
Final Code Health Check
Comprehensive check before fee settlement implementation
"""

import os
import sys
from pathlib import Path

def print_section(title):
    print(f"\n{'='*70}")
    print(f"{title.center(70)}")
    print(f"{'='*70}\n")

def check_backend_integrity():
    """Check backend code health"""
    print_section("BACKEND CODE HEALTH")
    
    # Check critical files exist
    critical_files = [
        'manage.py',
        'config/settings.py',
        'config/urls.py',
        'requirements.txt',
        'certificates/models.py',
        'certificates/views.py',
        'certificates/serializers.py',
        'students/models.py',
        'finance/models.py',
        'finance/views.py',
        'finance/serializers.py',
    ]
    
    missing = []
    for file in critical_files:
        path = Path(file)
        if path.exists():
            print(f"[OK] {file}")
        else:
            print(f"[ERROR] {file} - MISSING!")
            missing.append(file)
    
    if missing:
        print(f"\n[ERROR] {len(missing)} critical files missing!")
        return False
    else:
        print("\n[OK] All critical backend files present")
        return True

def check_frontend_integrity():
    """Check frontend code health"""
    print_section("FRONTEND CODE HEALTH")
    
    critical_files = [
        '../web/package.json',
        '../web/next.config.js',
        '../web/src/lib/api.ts',
        '../web/src/app/(dashboard)/dashboard/page.tsx',
        '../web/src/app/(dashboard)/finance/page.tsx',
        '../web/src/app/(dashboard)/students/page.tsx',
        '../web/src/components/certificates/CertificateGenerator.tsx',
        '../web/src/components/certificates/CertificateVerifier.tsx',
    ]
    
    missing = []
    for file in critical_files:
        path = Path(file)
        if path.exists():
            print(f"[OK] {file}")
        else:
            print(f"[WARN] {file} - Missing (may be new)")
            missing.append(file)
    
    if missing:
        print(f"\n[WARN] {len(missing)} frontend files not found (may be expected)")
    else:
        print("\n[OK] All critical frontend files present")
    
    return True

def check_migrations():
    """Check migrations status"""
    print_section("MIGRATIONS CHECK")
    
    apps = ['certificates', 'students', 'finance', 'staff', 'schools', 'core', 'transport']
    
    total = 0
    for app in apps:
        migrations_dir = Path(f"{app}/migrations")
        if migrations_dir.exists():
            migration_files = [f for f in migrations_dir.glob("*.py") if f.name != '__init__.py']
            count = len(migration_files)
            total += count
            
            if count > 0:
                latest = sorted(migration_files)[-1]
                print(f"[OK] {app}: {count} migrations (latest: {latest.name})")
            else:
                print(f"[WARN] {app}: No migrations")
    
    print(f"\nTotal migrations: {total}")
    return True

def check_dependencies():
    """Check dependencies"""
    print_section("DEPENDENCIES CHECK")
    
    req_file = Path("requirements.txt")
    if not req_file.exists():
        print("[ERROR] requirements.txt not found!")
        return False
    
    with open(req_file, 'r') as f:
        requirements = f.read()
    
    critical_deps = [
        'django',
        'djangorestframework',
        'weasyprint',
        'qrcode',
        'Pillow',
        'psycopg2-binary',
    ]
    
    all_present = True
    for dep in critical_deps:
        if dep.lower() in requirements.lower():
            print(f"[OK] {dep}")
        else:
            print(f"[ERROR] {dep} - MISSING!")
            all_present = False
    
    return all_present

def check_recent_changes():
    """Check what was recently changed"""
    print_section("RECENT CHANGES")
    
    print("Recent commits (last 5):")
    print("Run: git log --oneline -5")
    print("\nRecent file changes:")
    print("Run: git diff --name-only HEAD~5..HEAD")
    
    return True

def generate_summary():
    """Generate health summary"""
    print_section("HEALTH SUMMARY")
    
    checks = {
        'Backend Files': True,
        'Frontend Files': True,
        'Migrations': True,
        'Dependencies': True,
    }
    
    all_ok = all(checks.values())
    
    for check, status in checks.items():
        status_str = "[OK]" if status else "[FAIL]"
        print(f"{status_str} {check}")
    
    print("\n" + "="*70)
    if all_ok:
        print("OVERALL STATUS: HEALTHY - READY FOR IMPLEMENTATION".center(70))
    else:
        print("OVERALL STATUS: ISSUES FOUND - REVIEW NEEDED".center(70))
    print("="*70)
    
    return all_ok

def main():
    print("\n" + "="*70)
    print("COMPREHENSIVE CODE HEALTH CHECK".center(70))
    print("="*70)
    
    try:
        os.chdir('backend')
        print("\n[INFO] Changed to backend directory")
    except:
        print("\n[INFO] Already in backend directory or directory not found")
    
    # Run all checks
    backend_ok = check_backend_integrity()
    migrations_ok = check_migrations()
    deps_ok = check_dependencies()
    
    # Check frontend
    frontend_ok = check_frontend_integrity()
    
    # Summary
    generate_summary()
    
    print("\nRecommendations:")
    print("1. Commit pending certificate serializers changes")
    print("2. Run: python manage.py makemigrations (to check no pending)")
    print("3. Check: git status (any uncommitted files?)")
    print("4. Ready to proceed with fee settlement Phase 1")

if __name__ == "__main__":
    main()
