#!/bin/sh
# Attendre que Postgres soit prêt
until nc -z -v -w30 db 5432
do
  echo "Waiting for Postgres..."
  sleep 2
done

# Lancer l'app une fois que Postgres est prêt
exec "$@"