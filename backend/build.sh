#!/usr/bin/env bash
# exit on error
set -o errexit

pip install -r requirements.txt
python manage.py collectstatic --noinput
python manage.py migrate

# Create Superuser if it doesn't exist (Idempotent)
echo "Creating superuser..."
python manage.py shell -c "from django.contrib.auth import get_user_model; User = get_user_model(); User.objects.filter(username='dev_admin').exists() or User.objects.create_superuser('dev_admin', 'admin@school.com', 'admin123')"

echo "Running setup_roles to update permissions..."
python manage.py setup_roles

echo "Build script completed."
