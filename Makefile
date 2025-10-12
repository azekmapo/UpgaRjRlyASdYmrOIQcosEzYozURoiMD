# Makefile for Gestion PFE project

.PHONY: help build up down restart logs shell-backend shell-frontend shell-db migrate fresh seed backup restore clean

# Default target
.DEFAULT_GOAL := help

help: ## Show this help message
	@echo "Gestion PFE - Available Commands:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

build: ## Build all Docker images
	docker-compose build

up: ## Start all services
	docker-compose up -d

down: ## Stop all services
	docker-compose down

down-volumes: ## Stop all services and remove volumes
	docker-compose down -v

restart: ## Restart all services
	docker-compose restart

logs: ## Show logs from all services
	docker-compose logs -f

logs-backend: ## Show backend logs
	docker-compose logs -f backend

logs-frontend: ## Show frontend logs
	docker-compose logs -f frontend

logs-postgres: ## Show postgres logs
	docker-compose logs -f postgres

ps: ## Show running services
	docker-compose ps

shell-backend: ## Open shell in backend container
	docker-compose exec backend sh

shell-frontend: ## Open shell in frontend container
	docker-compose exec frontend sh

shell-db: ## Open PostgreSQL shell
	docker-compose exec postgres psql -U laravel -d gestion_pfe

migrate: ## Run database migrations
	docker-compose exec backend php artisan migrate

migrate-fresh: ## Drop all tables and re-run migrations
	docker-compose exec backend php artisan migrate:fresh

migrate-rollback: ## Rollback the last migration
	docker-compose exec backend php artisan migrate:rollback

seed: ## Seed the database
	docker-compose exec backend php artisan db:seed

fresh: ## Fresh migration with seeding
	docker-compose exec backend php artisan migrate:fresh --seed

tinker: ## Open Laravel Tinker
	docker-compose exec backend php artisan tinker

cache-clear: ## Clear all Laravel caches
	docker-compose exec backend php artisan optimize:clear

cache-config: ## Cache Laravel configuration
	docker-compose exec backend php artisan config:cache

cache-routes: ## Cache Laravel routes
	docker-compose exec backend php artisan route:cache

cache-views: ## Cache Laravel views
	docker-compose exec backend php artisan view:cache

optimize: ## Optimize Laravel for production
	docker-compose exec backend php artisan optimize

key-generate: ## Generate Laravel application key
	docker-compose exec backend php artisan key:generate

storage-link: ## Create storage symlink
	docker-compose exec backend php artisan storage:link

queue-work: ## Start queue worker
	docker-compose exec backend php artisan queue:work

test: ## Run backend tests
	docker-compose exec backend php artisan test

test-frontend: ## Run frontend tests
	docker-compose exec frontend npm test

backup: ## Backup database
	docker-compose exec -T postgres pg_dump -U laravel gestion_pfe > backup_$$(date +%Y%m%d_%H%M%S).sql
	@echo "Backup created successfully"

restore: ## Restore database from backup.sql
	@if [ ! -f backup.sql ]; then \
		echo "Error: backup.sql not found!"; \
		exit 1; \
	fi
	docker-compose exec -T postgres psql -U laravel gestion_pfe < backup.sql
	@echo "Database restored successfully"

clean: ## Remove all containers, volumes, and images
	docker-compose down -v --rmi all

install: ## Initial setup - build, start, and migrate
	@echo "Building containers..."
	docker-compose build
	@echo "Starting services..."
	docker-compose up -d
	@echo "Waiting for services to be ready..."
	sleep 10
	@echo "Running migrations..."
	docker-compose exec backend php artisan migrate --force
	@echo "Installation complete!"

dev: ## Start development environment
	docker-compose up

prod: ## Start production environment
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

prod-build: ## Build production environment
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml build

composer-install: ## Install Composer dependencies
	docker-compose exec backend composer install

composer-update: ## Update Composer dependencies
	docker-compose exec backend composer update

npm-install: ## Install npm dependencies in frontend
	docker-compose exec frontend npm install

npm-build: ## Build frontend for production
	docker-compose exec frontend npm run build

stats: ## Show container resource usage
	docker stats

health: ## Check services health
	@echo "Checking services..."
	@docker-compose ps
	@echo ""
	@echo "Checking backend health..."
	@curl -s http://localhost:8000/api/health || echo "Backend not responding"
	@echo ""
	@echo "Checking frontend..."
	@curl -s http://localhost:5173 > /dev/null && echo "Frontend: OK" || echo "Frontend: Not responding"
