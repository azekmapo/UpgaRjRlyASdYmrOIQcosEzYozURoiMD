#!/bin/bash

# Production Startup Script
# This script starts the application in production mode

echo "🚀 Starting Production Environment..."
echo "============================================================"

# Get the project root directory (parent of scripts folder)
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"
cd "$PROJECT_ROOT"

echo "📁 Project root: $PROJECT_ROOT"

# Check if Docker is running
echo ""
echo "🔍 Checking Docker..."
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker."
    exit 1
fi
echo "✅ Docker is running"

# Environment files to check
ENV_FILES=(
    "postgres/.env"
    "backend/.env"
    "frontend/.env"
    "notifications-server/.env"
    "redis/.env"
)

# Check and create .env files if missing
echo ""
echo "🔍 Checking environment files..."
MISSING_ENV_FILES=()

for ENV_FILE in "${ENV_FILES[@]}"; do
    ENV_PATH="$PROJECT_ROOT/$ENV_FILE"
    EXAMPLE_PATH="$ENV_PATH.example"
    
    if [ ! -f "$ENV_PATH" ]; then
        if [ -f "$EXAMPLE_PATH" ]; then
            echo "⚠️  Creating $ENV_FILE from example..."
            cp "$EXAMPLE_PATH" "$ENV_PATH"
            MISSING_ENV_FILES+=("$ENV_FILE")
        else
            echo "❌ Missing: $ENV_FILE (no example found)"
            exit 1
        fi
    else
        echo "✅ Found: $ENV_FILE"
    fi
done

if [ ${#MISSING_ENV_FILES[@]} -gt 0 ]; then
    echo ""
    echo "⚠️  WARNING: The following .env files were created from examples:"
    for FILE in "${MISSING_ENV_FILES[@]}"; do
        echo "   - $FILE"
    done
    echo ""
    echo "📝 Please review and update these files with your production credentials!"
    echo "Press Enter to continue or Ctrl+C to cancel..."
    read
fi

# Verify critical production settings
echo ""
echo "🔍 Verifying production configuration..."

if grep -q "APP_ENV=production" "$PROJECT_ROOT/backend/.env"; then
    echo "✅ Backend APP_ENV is set to production"
else
    echo "⚠️  Backend APP_ENV is not set to production"
fi

if grep -q "APP_DEBUG=false" "$PROJECT_ROOT/backend/.env"; then
    echo "✅ Backend APP_DEBUG is set to false"
else
    echo "⚠️  Backend APP_DEBUG is not set to false"
fi

# Stop existing containers
echo ""
echo "🛑 Stopping existing containers..."
docker-compose -f docker-compose.prod.yml down

# Remove old images (optional - uncomment if you want fresh builds)
# echo ""
# echo "🗑️  Removing old images..."
# docker-compose -f docker-compose.prod.yml down --rmi all

# Create Laravel storage directories
echo ""
echo "📁 Creating Laravel storage directories..."
STORAGE_DIRS=(
    "backend/storage/app/private/profile-pictures"
    "backend/storage/app/private/signatures"
    "backend/storage/app/private/pvs"
)

for dir in "${STORAGE_DIRS[@]}"; do
    if [ ! -d "$PROJECT_ROOT/$dir" ]; then
        mkdir -p "$PROJECT_ROOT/$dir"
        chmod -R 775 "$PROJECT_ROOT/$dir"
        echo "✅ Created: $dir"
    else
        echo "✅ Exists: $dir"
    fi
done

# Disable development nginx config
echo ""
echo "🔧 Configuring nginx for production..."
if [ -f "$PROJECT_ROOT/nginx/conf.d/default.conf" ]; then
    mv "$PROJECT_ROOT/nginx/conf.d/default.conf" "$PROJECT_ROOT/nginx/conf.d/default.conf.dev" 2>/dev/null || true
fi
if [ -f "$PROJECT_ROOT/nginx/conf.d/production.conf.disabled" ]; then
    mv "$PROJECT_ROOT/nginx/conf.d/production.conf.disabled" "$PROJECT_ROOT/nginx/conf.d/production.conf" 2>/dev/null || true
fi
echo "✅ nginx configured for production"

# Build production images
echo ""
echo "🔨 Building production images..."
docker-compose -f docker-compose.prod.yml build --no-cache

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Build failed!"
    exit 1
fi

echo ""
echo "✅ Build completed successfully!"

# Start services
echo ""
echo "🚀 Starting production services..."
docker-compose -f docker-compose.prod.yml up -d

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Failed to start services!"
    exit 1
fi

# Wait for services to be healthy
echo ""
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check service status
echo ""
echo "📊 Service Status:"
docker-compose -f docker-compose.prod.yml ps

# Show logs from backend (first 20 lines)
echo ""
echo "📋 Backend logs (first 20 lines):"
docker-compose -f docker-compose.prod.yml logs --tail=20 backend

echo ""
echo "============================================================"
echo "🎉 Production Environment Started!"
echo "============================================================"

echo ""
echo "📍 Access Points:"
echo "   Frontend:      http://localhost:5173"
echo "   Backend API:   http://localhost:8000"
echo "   WebSocket:     http://localhost:3001"
echo "   PostgreSQL:    localhost:5432"
echo "   Redis:         localhost:6379"

echo ""
echo "📝 Useful Commands:"
echo "   View logs:     docker-compose -f docker-compose.prod.yml logs -f"
echo "   Stop services: docker-compose -f docker-compose.prod.yml down"
echo "   Restart:       docker-compose -f docker-compose.prod.yml restart"
echo "   Health check:  ./scripts/health-check.sh"

echo ""
echo "⚠️  PRODUCTION MODE:"
echo "   - Source code is NOT mounted (changes won't reflect)"
echo "   - Debug mode is OFF"
echo "   - All services restart automatically on failure"
echo "   - This simulates a production environment locally"

echo ""
echo "✨ Done! Your production environment is running."
