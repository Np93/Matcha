# Étape 1 : build React avec variable d'environnement
FROM node:16 as build

WORKDIR /app

# Injecter la variable d'environnement build-time
ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=$REACT_APP_API_URL

COPY ./frontend/package*.json ./
RUN npm install

COPY ./frontend ./
RUN npm run build

# Étape 2 : NGINX qui sert le React buildé
FROM nginx:stable-alpine as prod

COPY --from=build /app/build /usr/share/nginx/html
COPY ./docker/front/nginx.conf /etc/nginx/nginx.conf
COPY ./docker/ssl /etc/nginx/ssl

EXPOSE 80 443
CMD ["nginx", "-g", "daemon off;"]