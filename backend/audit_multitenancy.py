import os
import re

def analyze_models(root_dir):
    """
    Scans directories for models.py and checks if classes have a 'school' field.
    """
    model_report = {}
    
    # Apps to ignore (standard django apps or irrelevant)
    ignored_apps = ['migrations', 'tests', 'venv', '__pycache__']

    for root, dirs, files in os.walk(root_dir):
        # Skip ignored dirs
        dirs[:] = [d for d in dirs if d not in ignored_apps]
        
        if 'models.py' in files:
            path = os.path.join(root, 'models.py')
            app_name = os.path.basename(root)
            
            with open(path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
                
            # Regex to find class definitions
            # We want to find "class Name(models.Model):" or similar
            # And then check if the body contains "school ="
            
            # Split by class definitions
            classes = re.split(r'^class\s+(\w+)\s*\(.*?\):', content, flags=re.MULTILINE)
            
            # The split result is [preamble, className1, body1, className2, body2, ...]
            # So start from index 1, take 2 at a time
            
            for i in range(1, len(classes), 2):
                class_name = classes[i]
                body = classes[i+1]
                
                # Check inheritance in the capture? Regex above captures name but not parent.
                # Let's assume most things in models.py are models.
                # Filter out Meta classes or non-Model things if possible, but hard with simple regex.
                # We'll assume if it has fields it's a model.
                
                has_school = 'school = models' in body or 'school = ForeignKey' in body
                
                # Exclude specific models that might receive global or system-wide status
                # e.g. "School" model itself doesn't need a school field (it IS the tenant)
                if class_name == 'School':
                    pass
                elif 'Abstract' in class_name or 'Mixin' in class_name:
                    pass
                else:
                    if app_name not in model_report:
                        model_report[app_name] = []
                    model_report[app_name].append({'model': class_name, 'has_school': has_school})

    return model_report

def analyze_views(root_dir):
    """
    Scans for views.py and checks if ViewSets filter by school.
    """
    view_report = {}
    
    for root, dirs, files in os.walk(root_dir):
        if 'views.py' in files:
            path = os.path.join(root, 'views.py')
            app_name = os.path.basename(root)
            
            with open(path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
            
            # Find ViewSets
            viewsets = re.split(r'^class\s+(\w+ViewSet)\s*\(.*?\):', content, flags=re.MULTILINE)
            
            for i in range(1, len(viewsets), 2):
                name = viewsets[i]
                body = viewsets[i+1]
                
                # Look for filtering logic
                # Common patterns: 
                # .filter(school=...)
                # .filter(school_id=...)
                # self.request.user.school
                
                is_isolated = (
                    'filter(school' in body or 
                    'filter(student__school' in body or 
                    'request.user.school' in body or
                    'get_queryset' not in body # If no get_queryset, it might rely on default queryset which is BAD for multi-tenant unless mixin used
                )
                
                if app_name not in view_report:
                    view_report[app_name] = []
                view_report[app_name].append({'view': name, 'is_isolated': is_isolated})
                
    return view_report

def main():
    root = r'C:\Flutter apk\SchoolApp\backend'
    print("ANALYZING MODELS...")
    models = analyze_models(root)
    
    print("\n--- Models Missing School Field (Potential Leaks) ---")
    for app, items in models.items():
        for item in items:
            if not item['has_school']:
                # Filter out known non-tenant models if any
                if item['model'] not in ['User', 'CoreUser', 'AbstractUser', 'Token', 'Session', 'AdminLog']:
                     print(f"[{app}] {item['model']}")

    print("\n\nANALYZING VIEWS...")
    views = analyze_views(root)
    print("\n--- ViewSets Missing School Filter (Potential Leaks) ---")
    for app, items in views.items():
        for item in items:
            if not item['is_isolated']:
                 print(f"[{app}] {item['view']}")

if __name__ == '__main__':
    main()
