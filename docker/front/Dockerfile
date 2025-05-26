# # Utiliser une image Node.js
# FROM node:16

# # Définir le répertoire de travail
# WORKDIR /app

# # Copier uniquement package.json pour installer les dépendances
# COPY ./frontend/package.json ./frontend/package-lock.json ./

# # Installer les dépendances
# RUN npm install

# # Copier tout le code source du frontend
# COPY ./frontend /app

# # Exposer le port 3000
# EXPOSE 3000

# # Commande pour démarrer le frontend
# CMD ["npm", "start"]


# Étape 1 : build React
FROM node:16 as build

WORKDIR /app
COPY ./frontend/package*.json ./
RUN npm install
COPY ./frontend ./
RUN npm run build

# Étape 2a : dev = React avec npm start
FROM node:16 as dev

WORKDIR /app
COPY --from=build /app ./
EXPOSE 3000
CMD ["npm", "start"]

# Étape 2b : prod = React buildé + Nginx
FROM nginx:stable-alpine as prod

COPY --from=build /app/build /usr/share/nginx/html
COPY ./docker/front/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80 3000
CMD ["nginx", "-g", "daemon off;"]