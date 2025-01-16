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

# Installer les dépendances
RUN npm install

# Copier tout le code source du frontend
COPY ./frontend /app

# Exposer le port 3000
EXPOSE 3000

# Commande pour démarrer le frontend
CMD ["npm", "start"]