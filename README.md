# 🚀 Production Deployment - Quick Start

## Architecture

```
             ┌─────────────────┐
             │   Port 80/443   │  ← Only exposed port
             │   nginx Gateway │
             └────────┬────────┘
                      │
         ┌────────────┼────────────┐
         │            │            │
    ┌────▼───┐  ┌────▼────┐  ┌───▼────┐
    │Backend │  │Frontend │  │ Notif  │
    │ :80    │  │  :80    │  │ :3001  │
    └────┬───┘  └─────────┘  └────────┘
         │
    ┌────┴─────┐
    │PostgreSQL│  Redis
    │  :5432   │  :6379
    └──────────┘
```

## Quick Deploy (5 Minutes)

### 1. Clone and Configure
```bash
git clone https://github.com/yourusername/gestion-pfe.git
cd gestion-pfe

# Copy environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
cp postgres/.env.example postgres/.env
cp redis/.env.example redis/.env
cp notifications-server/.env.example notifications-server/.env
```

### 2. Edit Production Environment

**backend/.env**:
```env
APP_ENV=production
APP_DEBUG=false
APP_URL=http://localhost  # Change to your domain

DB_PASSWORD=CHANGE_THIS_STRONG_PASSWORD
REDIS_PASSWORD=CHANGE_THIS_STRONG_PASSWORD
```

**frontend/.env**:
```env
VITE_API_BASE_URL=http://localhost/api/
VITE_SOCKET_URL=http://localhost
```

**postgres/.env**:
```env
POSTGRES_PASSWORD=CHANGE_THIS_STRONG_PASSWORD  # Same as DB_PASSWORD
```

**redis/.env**:
```env
REDIS_PASSWORD=CHANGE_THIS_STRONG_PASSWORD  # Same as REDIS_PASSWORD
```

### 3. Deploy
```bash
# Windows
.\scripts\startup-prod.ps1

# Linux/Mac
chmod +x scripts/startup-prod.sh
./scripts/startup-prod.sh
```

### 4. Access
- **Application**: http://localhost
- **Health Check**: http://localhost/health

## What Happens During Deployment?

1. ✅ Creates storage directories (`profile-pictures`, `signatures`, `pvs`)
2. ✅ Configures nginx for production
3. ✅ Builds Docker images (backend, frontend, notifications)
4. ✅ Starts PostgreSQL + Redis
5. ✅ Runs database migrations
6. ✅ Starts backend with nginx + PHP-FPM
7. ✅ Builds and serves React frontend (production build)
8. ✅ Starts WebSocket notifications server
9. ✅ Starts nginx gateway (single entry point)

## Services Overview

| Service | Internal Port | Exposed to Internet | Purpose |
|---------|---------------|---------------------|---------|
| nginx | 80 | ✅ Yes | Single entry point, routing, CORS, rate limiting |
| backend | 80 | ❌ No (internal only) | Laravel API (nginx + PHP-FPM) |
| frontend | 80 | ❌ No (internal only) | React production build |
| notifications | 3001 | ❌ No (internal only) | WebSocket server |
| postgres | 5432 | ❌ No (internal only) | Database |
| redis | 6379 | ❌ No (internal only) | Cache, queues, tokens |

## Security Features

✅ **Implemented**:
- Rate limiting (10 req/s API, 5 req/m login)
- CORS properly configured
- Security headers (X-Frame-Options, CSP, etc.)
- Service isolation (only nginx exposed)
- Connection limits (10 per IP)
- File upload limits (64MB)
- CSRF protection disabled for API (token-based auth)

✅ **Production Ready**:
- No source code mounted (baked into images)
- APP_DEBUG=false
- No database/Redis exposed to internet
- Health checks on all services
- Automatic restarts
- Optimized PHP OPcache
- Gzip compression enabled

## Monitoring

### Check Services
```bash
docker-compose -f docker-compose.prod.yml ps
```

### View Logs
```bash
# All services
docker-compose -f docker-compose.prod.yml logs -f

# Specific service
docker-compose -f docker-compose.prod.yml logs -f nginx
docker-compose -f docker-compose.prod.yml logs -f backend
```

### Health Checks
```bash
# Application health
curl http://localhost/health

# nginx gateway
curl -I http://localhost

# Backend API
curl http://localhost/api/health
```

### Resource Usage
```bash
docker stats
```

## Common Commands

### Restart Services
```bash
# All services
docker-compose -f docker-compose.prod.yml restart

# Specific service
docker-compose -f docker-compose.prod.yml restart backend
```

### Update Application
```bash
# Pull latest code
git pull origin main

# Rebuild and redeploy
docker-compose -f docker-compose.prod.yml up -d --build

# Run migrations
docker-compose -f docker-compose.prod.yml exec backend php artisan migrate --force
```

### Database Operations
```bash
# Backup database
docker-compose -f docker-compose.prod.yml exec postgres \
  pg_dump -U laravel gestion_pfe > backup_$(date +%Y%m%d).sql

# Restore database
docker-compose -f docker-compose.prod.yml exec -T postgres \
  psql -U laravel gestion_pfe < backup.sql

# Run migrations
docker-compose -f docker-compose.prod.yml exec backend \
  php artisan migrate --force

# Seed database
docker-compose -f docker-compose.prod.yml exec backend \
  php artisan db:seed --force
```

### Clear Caches
```bash
# Laravel caches
docker-compose -f docker-compose.prod.yml exec backend php artisan optimize:clear
docker-compose -f docker-compose.prod.yml exec backend php artisan optimize

# nginx cache
docker-compose -f docker-compose.prod.yml restart nginx
```

## Troubleshooting

### Can't login from browser
```bash
# Check nginx logs
docker-compose -f docker-compose.prod.yml logs nginx

# Test CORS
curl -X OPTIONS http://localhost/api/auth/login \
  -H "Origin: http://localhost" -v

# Should see: Access-Control-Allow-Origin: http://localhost
```

### 502 Bad Gateway
```bash
# Check backend is running
docker-compose -f docker-compose.prod.yml ps backend

# Check backend logs
docker-compose -f docker-compose.prod.yml logs backend

# Restart backend
docker-compose -f docker-compose.prod.yml restart backend
```

### Database connection failed
```bash
# Check PostgreSQL
docker-compose -f docker-compose.prod.yml ps postgres

# Test connection
docker-compose -f docker-compose.prod.yml exec backend \
  php artisan db:show
```

### High memory usage
```bash
# Check container stats
docker stats

# Restart services
docker-compose -f docker-compose.prod.yml restart
```

## Adding SSL/HTTPS

### 1. Get SSL Certificate
```bash
# Let's Encrypt (Free)
sudo apt install certbot
sudo certbot certonly --standalone -d yourdomain.com

# Certificates in: /etc/letsencrypt/live/yourdomain.com/
```

### 2. Update nginx Config
Edit `nginx/conf.d/production.conf`:
```nginx
server {
    listen 443 ssl http2;
    ssl_certificate /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;
    # ... rest of config
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    return 301 https://$server_name$request_uri;
}
```

### 3. Mount Certificates
Edit `docker-compose.prod.yml`:
```yaml
nginx:
  ports:
    - "80:80"
    - "443:443"  # Add this
  volumes:
    - /etc/letsencrypt/live/yourdomain.com:/etc/nginx/ssl:ro  # Add this
```

### 4. Update Environment
```env
# backend/.env
APP_URL=https://yourdomain.com

# frontend/.env
VITE_API_BASE_URL=https://yourdomain.com/api/
VITE_SOCKET_URL=https://yourdomain.com
```

## Scaling

### Multiple Backend Instances
Edit `docker-compose.prod.yml`:
```yaml
backend:
  deploy:
    replicas: 3  # Run 3 backend instances
```

nginx will automatically load balance between them.

## Production Checklist

Before going live:

- [ ] Changed all default passwords (DB, Redis)
- [ ] Set strong `APP_KEY` in backend/.env
- [ ] `APP_DEBUG=false`
- [ ] `APP_ENV=production`
- [ ] Updated domain names in .env files
- [ ] SSL/HTTPS configured
- [ ] Firewall configured (only 80/443 open)
- [ ] Database backups automated
- [ ] Storage backups automated
- [ ] Monitoring setup
- [ ] Log rotation configured
- [ ] Tested all critical features
- [ ] Documented recovery procedures

## Performance Tips

1. **Enable OPcache**: Already configured in PHP
2. **Use Redis**: Already configured for cache/sessions/queues
3. **Enable nginx caching**: Configured for static assets
4. **CDN**: Add CloudFlare or similar for static assets
5. **Database indexes**: Review and optimize queries
6. **Queue workers**: Run background jobs asynchronously

## Support

- **Documentation**: See `docs/` folder
- **Architecture**: `docs/ARCHITECTURE.md`
- **Full Deployment Guide**: `docs/DEPLOYMENT_GUIDE.md`
- **CORS Guide**: `docs/CORS_FIX.md`

## Default Credentials

After deployment, seed the database:
```bash
docker-compose -f docker-compose.prod.yml exec backend php artisan db:seed
```

Default admin:
- Email: `mtadlaoui@hotmail.com`
- Password: `12345678`

**⚠️ CHANGE IMMEDIATELY IN PRODUCTION!**
