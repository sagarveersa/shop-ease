#!/bin/sh
set -eu

python scripts/wait_for_services.py

# If a legacy table exists without migration state, record it first to avoid DuplicateTable errors.
python manage.py shell -c "
from django.db import connection
from django.db.migrations.recorder import MigrationRecorder

recorder = MigrationRecorder(connection)
recorder.ensure_schema()

with connection.cursor() as cursor:
    cursor.execute(\"SELECT to_regclass('public.accounts_user') IS NOT NULL\")
    accounts_user_exists = bool(cursor.fetchone()[0])

is_applied = recorder.migration_qs.filter(app='accounts', name='0001_initial').exists()

if accounts_user_exists and not is_applied:
    print('Detected existing accounts_user with missing migration record. Marking accounts.0001_initial as applied.')
    recorder.record_applied('accounts', '0001_initial')
"

python manage.py migrate --noinput --fake-initial

python manage.py collectstatic --noinput

gunicorn core.wsgi:application --bind "0.0.0.0:8000" --workers 4
