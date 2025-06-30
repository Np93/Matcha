#!/bin/bash
set -e

echo "✨ Insertion directe du SQL..."
psql postgresql://$POSTGRES_USER:$POSTGRES_PASSWORD@$POSTGRES_HOST:$POSTGRES_PORT/$POSTGRES_DB -f /app/data/fake_profiles_insert.sql

echo "🖌️ Insertion des images compressées..."
python /app/scripts/insert_images.py

# echo "🛰️ Forçage de la méthode de localisation à GPS..."
# psql postgresql://$POSTGRES_USER:$POSTGRES_PASSWORD@$POSTGRES_HOST:$POSTGRES_PORT/$POSTGRES_DB -c "UPDATE locations SET location_method = 'GPS';"

echo "🛠️ Correction de la séquence auto-incrément pour users..."
psql postgresql://$POSTGRES_USER:$POSTGRES_PASSWORD@$POSTGRES_HOST:$POSTGRES_PORT/$POSTGRES_DB -c "SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));"

echo "✅ Fausse base Matcha entièrement initialisée."