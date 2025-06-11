# Utiliser une image Python comme base
FROM python:3.10

# Définir le répertoire de travail
WORKDIR /app

RUN apt-get update && apt-get install -y netcat-openbsd

# Copier le fichier requirements.txt depuis la racine du projet
COPY ./requirements.txt /app/requirements.txt

# Installer les dépendances
RUN pip install --no-cache-dir -r requirements.txt

# Copier le script wait-for-it.sh et le rendre exécutable
COPY ./docker/back/wait-for-it.sh /wait-for-it.sh
RUN chmod +x /wait-for-it.sh

# Copier le dossier backend dans le conteneur
COPY ./backend /app

# Exposer le port de l'application
EXPOSE 8000

# Commande pour démarrer l'application
CMD ["/wait-for-it.sh", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]