# Variables
DC = docker-compose

# Règles
.PHONY: all build up clean fclean ps re help

# Règle par défaut
all: ## Construire et démarrer les conteneurs avec sudo
	$(DC) up --build
	@echo "Containers started with sudo."

# Construire les services Docker
build: ## Construire les images Docker pour tous les services
	$(DC) build
	@echo "Build completed."

# Démarrer les services
up: ## Démarrer tous les services en arrière-plan
	$(DC) up
	@echo "Containers are up."

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

# Rebuild and restart
re: clean all ## Nettoyer puis reconstruire et redémarrer les conteneurs
	@echo "Rebuilt and restarted containers."

# Aide pour afficher les commandes disponibles
help: ## Afficher la liste des commandes disponibles
	@echo "Usage: make [target]"
	@echo
	@echo "Available targets:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'