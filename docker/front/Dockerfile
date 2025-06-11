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
COPY ./docker/front/nginx.conf /etc/nginx/nginx.conf
# Copier les certificats
COPY ./docker/ssl /etc/nginx/ssl
EXPOSE 80 443 3000
CMD ["nginx", "-g", "daemon off;"]