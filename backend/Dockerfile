# Use PHP 8.2 with FPM and Alpine for better performance
FROM php:8.2-fpm-alpine

# Install dependencies
RUN apk add --no-cache \
    curl \
    zip \
    unzip \
    libzip-dev \
    libpng-dev \
    libjpeg-turbo-dev \
    freetype-dev \
    postgresql-dev \
    oniguruma-dev \
    linux-headers \
    $PHPIZE_DEPS

# Configure and install PHP extensions
RUN docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j$(nproc) \
    pdo \
    pdo_pgsql \
    zip \
    bcmath \
    exif \
    opcache \
    pcntl \
    gd \
    sockets

# Add this line after installing other PHP extensions
RUN apk add --no-cache icu-dev \
    && docker-php-ext-install intl

# Install Redis extension
RUN apk add --no-cache redis \
    && pecl install redis \
    && docker-php-ext-enable redis

# Add PHP configuration optimizations
RUN { \
    echo 'opcache.memory_consumption=128'; \
    echo 'opcache.interned_strings_buffer=8'; \
    echo 'opcache.max_accelerated_files=4000'; \
    echo 'opcache.revalidate_freq=2'; \
    echo 'opcache.fast_shutdown=1'; \
    echo 'opcache.enable_cli=1'; \
    echo 'upload_max_filesize=64M'; \
    echo 'post_max_size=64M'; \
    echo 'memory_limit=256M'; \
    echo 'max_execution_time=60'; \
    echo 'max_input_time=60'; \
} > /usr/local/etc/php/conf.d/docker-php-optimizations.ini

# Configure PHP-FPM for better performance
RUN { \
    echo '[global]'; \
    echo 'emergency_restart_threshold = 10'; \
    echo 'emergency_restart_interval = 1m'; \
    echo 'process_control_timeout = 10s'; \
    echo 'daemonize = no'; \
    echo '[www]'; \
    echo 'pm = dynamic'; \
    echo 'pm.max_children = 20'; \
    echo 'pm.start_servers = 5'; \
    echo 'pm.min_spare_servers = 5'; \
    echo 'pm.max_spare_servers = 10'; \
    echo 'pm.process_idle_timeout = 10s'; \
    echo 'pm.max_requests = 500'; \
} > /usr/local/etc/php-fpm.d/zz-docker.conf

# Install Composer
COPY --from=composer:2.7 /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /var/www/html

# Copy composer files for dependency installation
COPY composer.json composer.loc[k] ./

# Install PHP dependencies (without dev dependencies for production)
# Use update if lock file is missing or outdated
RUN composer update --no-scripts --no-autoloader --prefer-dist --optimize-autoloader --no-dev || \
    composer install --no-scripts --no-autoloader --prefer-dist --optimize-autoloader

# Copy existing application directory contents
COPY . .

# Run composer scripts and generate optimized autoloader
RUN composer dump-autoload --optimize

# Note: We don't cache config/routes/views in build as they need .env
# These will be cached at runtime if needed

# Install Nginx and Supervisor for serving
RUN apk add --no-cache nginx supervisor

# Configure Nginx
COPY docker/nginx.conf /etc/nginx/http.d/default.conf

# Configure supervisord
RUN mkdir -p /etc/supervisor.d
COPY docker/supervisord.conf /etc/supervisor.d/supervisord.ini

# Set permissions
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache

# Create startup script that handles migrations and cache
COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

# Expose HTTP port (nginx will proxy to PHP-FPM internally)
EXPOSE 80

# Start with entrypoint script then run Supervisor
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["/usr/bin/supervisord", "-n", "-c", "/etc/supervisor.d/supervisord.ini"]
