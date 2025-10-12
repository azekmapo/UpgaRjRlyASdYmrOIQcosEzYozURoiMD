#!/bin/sh
set -e

echo "🚀 Starting Laravel application..."

# Wait for database to be ready
echo "⏳ Waiting for database connection..."
php artisan db:show 2>/dev/null || sleep 5

# Create storage directories
echo "📁 Ensuring storage directories exist..."
mkdir -p /var/www/html/storage/app/private/profile-pictures
mkdir -p /var/www/html/storage/app/private/signatures
mkdir -p /var/www/html/storage/app/private/pvs
chmod -R 775 /var/www/html/storage/app/private
echo "✅ Storage directories ready"

# Clear cache in development
if [ "$APP_ENV" = "local" ] || [ "$APP_ENV" = "development" ]; then
    echo "🔧 Development environment detected"
    php artisan config:clear
    php artisan cache:clear
    php artisan route:clear
    php artisan view:clear
fi

# Run migrations if AUTO_MIGRATE is enabled
if [ "${AUTO_MIGRATE:-true}" = "true" ]; then
    echo "🗄️  Running database migrations..."
    php artisan migrate --force
fi

# Cache config for production
if [ "$APP_ENV" = "production" ]; then
    echo "⚡ Caching configuration for production..."
    php artisan config:cache
    php artisan route:cache
    php artisan view:cache
fi

# Create storage symlink if not exists
if [ ! -L /var/www/html/public/storage ]; then
    echo "🔗 Creating storage symlink..."
    php artisan storage:link
fi

echo "✅ Laravel application ready!"

# Execute the main command
exec "$@"
