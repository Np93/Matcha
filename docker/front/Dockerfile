# FROM node:16

# WORKDIR /app

# COPY package.json ./
# RUN npm install

# COPY . .

# EXPOSE 3000

# CMD ["npm", "start"]

# Utiliser une image Node.js
FROM node:16

# Définir le répertoire de travail
WORKDIR /app

# Copier uniquement package.json pour installer les dépendances
COPY ./frontend/package.json ./frontend/package-lock.json ./

# Créer le dossier .cache avec les bonnes permissions et installer les dépendances
RUN mkdir -p /app/node_modules/.cache && \
    chmod -R 777 /app/node_modules/.cache && \
    npm install

# Copier tout le code source du frontend
COPY ./frontend /app

# Définir les bonnes permissions pour le dossier node_modules
RUN chown -R node:node /app/node_modules

# Exposer le port 3000
EXPOSE 3000

# Commande pour démarrer le frontend
CMD ["npm", "start"]