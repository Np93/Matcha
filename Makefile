# Variables
DC = docker-compose

# Règles
.PHONY: all build up clean fclean ps re help dev prod

# Règle par défaut
# all: ## Construire et démarrer les conteneurs avec sudo
# 	$(DC) up --build
# 	@echo "Containers started with sudo."
all: prod ## Par défaut, lancer le projet en mode développement

# Construire les services Docker
build: ## Construire les images Docker pour tous les services
	$(DC) build
	@echo "Build completed."

# Démarrer les services
up: ## Démarrer tous les services en arrière-plan
	$(DC) up
	@echo "Containers are up."

prod: certs ## Lancer tous les services avec React buildé + Nginx
	$(DC) -f docker-compose.yml up --build
	@echo "Production environment started on port 443."

certs: ## Générer les certificats SSL si nécessaire
	$(DC) -f docker-compose.yml run --rm certgen
	@echo "Certificats générés dans ./docker/ssl"

# Supprimer les conteneurs mais conserver les volumes
clean: ## Arrêter et supprimer les conteneurs, tout en conservant les volumes
	$(DC) down --volumes
	@echo "Containers stopped and volumes removed."

# Supprimer les conteneurs, les volumes et les images associées
fclean: ## Supprimer les conteneurs, les volumes et les images Docker
	$(DC) down --rmi all --volumes --remove-orphans
	docker system prune -f
	@echo "Cleaned all containers, volumes, and images."

# Vérifier les conteneurs actifs
ps: ## Afficher les conteneurs en cours d'exécution
	docker ps

insert_all: ## insert de faux profiles  attention ne pas avoir cree de user
	docker build -f scripts/Dockerfile.insert -t insert-fake-profiles .
	docker run --rm \
		--env POSTGRES_DB=matcha \
		--env POSTGRES_USER=postgres \
		--env POSTGRES_PASSWORD=your_password \
		--env POSTGRES_HOST=postgres_db \
		--env POSTGRES_PORT=5432 \
		--network matcha_internal \
		insert-fake-profiles

# Rebuild and restart
re: clean all ## Nettoyer puis reconstruire et redémarrer les conteneurs
	@echo "Rebuilt and restarted containers."

# Aide pour afficher les commandes disponibles
help: ## Afficher la liste des commandes disponibles
	@echo "Usage: make [target]"
	@echo
	@echo "Available targets:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'