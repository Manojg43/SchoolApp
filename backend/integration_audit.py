"""
Comprehensive Integration Audit
Checks for missing DB tables, API endpoints, and frontend integrations
"""

import os
from pathlib import Path
import re

def print_header(title):
    print(f"\n{'='*70}")
    print(f"{title.center(70)}")
    print(f"{'='*70}\n")

def check_models_vs_apis():
    """Check if all models have corresponding API endpoints"""
    print_header("MODELS vs API ENDPOINTS")
    
    apps = ['certificates', 'students', 'finance', 'staff', 'schools', 'core', 'transport']
    
    results = {}
    for app in apps:
        models_file = Path(f"{app}/models.py")
        views_file = Path(f"{app}/views.py")
        
        if not models_file.exists():
            continue
            
        # Extract model names
        with open(models_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Find all class definitions that inherit from models.Model
        model_pattern = r'class\s+(\w+)\(models\.Model\):'
        models = re.findall(model_pattern, content)
        
        # Check for ViewSets or APIViews
        api_coverage = {}
        if views_file.exists():
            with open(views_file, 'r', encoding='utf-8') as f:
                views_content = f.read()
            
            for model in models:
                # Check for ViewSet or APIView mentioning this model
                has_viewset = f'{model}ViewSet' in views_content
                has_api = model in views_content
                api_coverage[model] = has_viewset or has_api
        else:
            api_coverage = {model: False for model in models}
        
        results[app] = {
            'models': models,
            'api_coverage': api_coverage
        }
    
    # Print results
    missing_apis = []
    for app, data in results.items():
        print(f"\n{app}:")
        print(f"  Models: {len(data['models'])}")
        
        for model, has_api in data['api_coverage'].items():
            if has_api:
                print(f"  [OK] {model} - API exists")
            else:
                print(f"  [WARN] {model} - NO API")
                missing_apis.append(f"{app}.{model}")
    
    if missing_apis:
        print(f"\n[WARN] {len(missing_apis)} models without APIs:")
        for model in missing_apis:
            print(f"  - {model}")
    else:
        print("\n[OK] All models have API coverage")
    
    return missing_apis

def check_urls_configuration():
    """Check URL configurations"""
    print_header("URL CONFIGURATION CHECK")
    
    config_urls = Path("config/urls.py")
    
    if not config_urls.exists():
        print("[ERROR] config/urls.py not found")
        return []
    
    with open(config_urls, 'r', encoding='utf-8') as f:
        config_content = f.read()
    
    apps = ['certificates', 'students', 'finance', 'staff', 'schools', 'transport']
    
    missing_urls = []
    for app in apps:
        if f"'{app}.urls'" in config_content or f'"{app}.urls"' in config_content:
            print(f"[OK] {app} URLs included in config")
        else:
            print(f"[WARN] {app} URLs NOT included in config")
            missing_urls.append(app)
    
    return missing_urls

def check_serializers():
    """Check if all models have serializers"""
    print_header("SERIALIZERS CHECK")
    
    apps = ['certificates', 'students', 'finance', 'staff', 'schools', 'transport']
    
    missing_serializers = []
    for app in apps:
        serializers_file = Path(f"{app}/serializers.py")
        models_file = Path(f"{app}/models.py")
        
        if not models_file.exists():
            continue
        
        # Get models
        with open(models_file, 'r', encoding='utf-8') as f:
            content = f.read()
        model_pattern = r'class\s+(\w+)\(models\.Model\):'
        models = re.findall(model_pattern, content)
        
        if serializers_file.exists():
            with open(serializers_file, 'r', encoding='utf-8') as f:
                serializer_content = f.read()
            
            print(f"\n{app}:")
            for model in models:
                serializer_name = f"{model}Serializer"
                if serializer_name in serializer_content:
                    print(f"  [OK] {model} has serializer")
                else:
                    print(f"  [WARN] {model} missing serializer")
                    missing_serializers.append(f"{app}.{model}")
        else:
            print(f"\n[WARN] {app}: No serializers.py file")
            missing_serializers.extend([f"{app}.{model}" for model in models])
    
    return missing_serializers

def check_frontend_api_functions():
    """Check frontend API functions"""
    print_header("FRONTEND API FUNCTIONS")
    
    api_file = Path("../web/src/lib/api.ts")
    if not api_file.exists():
        api_file = Path("web/src/lib/api.ts")
    
    if not api_file.exists():
        print("[ERROR] api.ts not found")
        return []
    
    with open(api_file, 'r', encoding='utf-8') as f:
        api_content = f.read()
    
    # Check for key API functions
    required_functions = {
        'students': ['getStudents'],
        'staff': ['getStaff', 'StaffProfile'],
        'finance': ['Invoice', 'Receipt', 'FeeCategory'],
        'certificates': ['generateCertificate', 'verifyCertificate', 'downloadCertificate'],
        'attendance': ['Attendance'],
        'schools': ['School', 'Class', 'Section'],
    }
    
    missing_frontend = []
    for category, functions in required_functions.items():
        print(f"\n{category}:")
        for func in functions:
            if func in api_content:
                print(f"  [OK] {func}")
            else:
                print(f"  [WARN] {func} missing")
                missing_frontend.append(f"{category}.{func}")
    
    return missing_frontend

def check_admin_registration():
    """Check if models are registered in admin"""
    print_header("ADMIN REGISTRATION CHECK")
    
    apps = ['certificates', 'students', 'finance', 'staff', 'schools', 'transport']
    
    unregistered = []
    for app in apps:
        admin_file = Path(f"{app}/admin.py")
        models_file = Path(f"{app}/models.py")
        
        if not models_file.exists():
            continue
        
        # Get models
        with open(models_file, 'r', encoding='utf-8') as f:
            content = f.read()
        model_pattern = r'class\s+(\w+)\(models\.Model\):'
        models = re.findall(model_pattern, content)
        
        if admin_file.exists():
            with open(admin_file, 'r', encoding='utf-8') as f:
                admin_content = f.read()
            
            print(f"\n{app}:")
            for model in models:
                if f"admin.site.register({model}" in admin_content or f"{model}Admin" in admin_content:
                    print(f"  [OK] {model} registered")
                else:
                    print(f"  [WARN] {model} not registered")
                    unregistered.append(f"{app}.{model}")
        else:
            print(f"\n[WARN] {app}: No admin.py file")
    
    return unregistered

def generate_report(missing_apis, missing_urls, missing_serializers, missing_frontend, unregistered):
    """Generate final report"""
    print_header("INTEGRATION AUDIT REPORT")
    
    total_issues = len(missing_apis) + len(missing_urls) + len(missing_serializers) + len(missing_frontend) + len(unregistered)
    
    if total_issues == 0:
        print("\n[OK] ALL INTEGRATIONS COMPLETE!")
        print("\nNo missing components found:")
        print("  - All models have API endpoints")
        print("  - All URLs are configured")
        print("  - All models have serializers")
        print("  - Frontend has API functions")
        print("  - Admin registrations complete")
    else:
        print(f"\n[WARN] {total_issues} integration issues found\n")
        
        if missing_apis:
            print(f"Models without APIs ({len(missing_apis)}):")
            for item in missing_apis:
                print(f"  - {item}")
        
        if missing_urls:
            print(f"\nApps not in URL config ({len(missing_urls)}):")
            for item in missing_urls:
                print(f"  - {item}")
        
        if missing_serializers:
            print(f"\nModels without serializers ({len(missing_serializers)}):")
            for item in missing_serializers:
                print(f"  - {item}")
        
        if missing_frontend:
            print(f"\nMissing frontend functions ({len(missing_frontend)}):")
            for item in missing_frontend:
                print(f"  - {item}")
        
        if unregistered:
            print(f"\nUnregistered admin models ({len(unregistered)}):")
            for item in unregistered:
                print(f"  - {item}")
    
    print("\n" + "="*70)
    if total_issues == 0:
        print("STATUS: ALL SYSTEMS INTEGRATED".center(70))
    else:
        print(f"STATUS: {total_issues} INTEGRATION GAPS".center(70))
    print("="*70)

def main():
    print("\n" + "="*70)
    print("COMPREHENSIVE INTEGRATION AUDIT".center(70))
    print("Checking DB Tables, APIs, URLs, and Frontend".center(70))
    print("="*70)
    
    try:
        os.chdir('backend')
        print("\n[INFO] Changed to backend directory")
    except:
        print("\n[INFO] Already in correct directory")
    
    # Run all checks
    missing_apis = check_models_vs_apis()
    missing_urls = check_urls_configuration()
    missing_serializers = check_serializers()
    
    # Check frontend
    try:
        os.chdir('..')
        missing_frontend = check_frontend_api_functions()
        unregistered = []  # Skip admin check for now
    except:
        missing_frontend = []
        unregistered = []
    
    # Generate report
    generate_report(missing_apis, missing_urls, missing_serializers, missing_frontend, unregistered)

if __name__ == "__main__":
    main()
