# # Utiliser une image Python
# FROM python:3.10-slim

# # Définir le répertoire de travail
# WORKDIR /app

# # Copier les fichiers requirements.txt
# COPY requirements.txt .

# # Installer les dépendances
# RUN pip install --no-cache-dir -r requirements.txt

# # Copier le code de l'application
# COPY ./backend /app

# # Exposer le port 8000
# EXPOSE 8000

# # Commande pour démarrer FastAPI
# CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]

# Utiliser une image Python comme base
FROM python:3.10

# Définir le répertoire de travail
WORKDIR /app

# Copier le fichier requirements.txt depuis la racine du projet
COPY ./requirements.txt /app/requirements.txt

# Installer les dépendances
RUN pip install --no-cache-dir -r requirements.txt

# Copier le dossier backend dans le conteneur
COPY ./backend /app

# Exposer le port de l'application
EXPOSE 8000

# Commande pour démarrer l'application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]