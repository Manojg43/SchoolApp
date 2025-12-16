
import os
import sys
from pathlib import Path

# Add the parent directory to sys.path so 'config' can be imported
path = Path(__file__).resolve().parent.parent
if str(path) not in sys.path:
    sys.path.append(str(path))

from django.core.wsgi import get_wsgi_application

# Set settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

# Get the WSGI app
app = get_wsgi_application()
