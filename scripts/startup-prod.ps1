# Production Startup Script
# This script starts the application in production mode

Write-Host "🚀 Starting Production Environment..." -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Gray

# Get the project root directory (parent of scripts folder)
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptPath
Set-Location $projectRoot

Write-Host "📁 Project root: $projectRoot" -ForegroundColor Yellow

# Check if Docker is running
Write-Host "`n🔍 Checking Docker..." -ForegroundColor Cyan
try {
    docker info | Out-Null
    Write-Host "✅ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not running. Please start Docker Desktop." -ForegroundColor Red
    exit 1
}

# Environment files to check
$envFiles = @(
    "postgres/.env",
    "backend/.env",
    "frontend/.env",
    "notifications-server/.env",
    "redis/.env"
)

# Check and create .env files if missing
Write-Host "`n🔍 Checking environment files..." -ForegroundColor Cyan
$missingEnvFiles = @()

foreach ($envFile in $envFiles) {
    $envPath = Join-Path $projectRoot $envFile
    $examplePath = "$envPath.example"
    
    if (-not (Test-Path $envPath)) {
        if (Test-Path $examplePath) {
            Write-Host "⚠️  Creating $envFile from example..." -ForegroundColor Yellow
            Copy-Item $examplePath $envPath
            $missingEnvFiles += $envFile
        } else {
            Write-Host "❌ Missing: $envFile (no example found)" -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "✅ Found: $envFile" -ForegroundColor Green
    }
}

if ($missingEnvFiles.Count -gt 0) {
    Write-Host "`n⚠️  WARNING: The following .env files were created from examples:" -ForegroundColor Yellow
    foreach ($file in $missingEnvFiles) {
        Write-Host "   - $file" -ForegroundColor Yellow
    }
    Write-Host "`n📝 Please review and update these files with your production credentials!" -ForegroundColor Yellow
    Write-Host "Press Enter to continue or Ctrl+C to cancel..." -ForegroundColor Cyan
    Read-Host
}

# Verify critical production settings
Write-Host "`n🔍 Verifying production configuration..." -ForegroundColor Cyan

$backendEnv = Get-Content "$projectRoot/backend/.env" -Raw
if ($backendEnv -match "APP_ENV=production") {
    Write-Host "✅ Backend APP_ENV is set to production" -ForegroundColor Green
} else {
    Write-Host "⚠️  Backend APP_ENV is not set to production" -ForegroundColor Yellow
}

if ($backendEnv -match "APP_DEBUG=false") {
    Write-Host "✅ Backend APP_DEBUG is set to false" -ForegroundColor Green
} else {
    Write-Host "⚠️  Backend APP_DEBUG is not set to false" -ForegroundColor Yellow
}

# Create Laravel storage directories
Write-Host "`n📁 Creating Laravel storage directories..." -ForegroundColor Cyan

$storageDirs = @(
    "backend\storage\app\private\profile-pictures",
    "backend\storage\app\private\signatures",
    "backend\storage\app\private\pvs"
)

foreach ($dir in $storageDirs) {
    $dirPath = Join-Path $projectRoot $dir
    if (-not (Test-Path $dirPath)) {
        New-Item -ItemType Directory -Path $dirPath -Force | Out-Null
        Write-Host "✅ Created: $dir" -ForegroundColor Green
    } else {
        Write-Host "✅ Exists: $dir" -ForegroundColor Green
    }
}

# Configure nginx for production
Write-Host "`n🔧 Configuring nginx for production..." -ForegroundColor Cyan
if (Test-Path "$projectRoot\nginx\conf.d\default.conf") {
    Move-Item "$projectRoot\nginx\conf.d\default.conf" "$projectRoot\nginx\conf.d\default.conf.dev" -Force -ErrorAction SilentlyContinue
}
if (Test-Path "$projectRoot\nginx\conf.d\production.conf.disabled") {
    Move-Item "$projectRoot\nginx\conf.d\production.conf.disabled" "$projectRoot\nginx\conf.d\production.conf" -Force -ErrorAction SilentlyContinue
}
Write-Host "✅ nginx configured for production" -ForegroundColor Green

# Stop existing containers
Write-Host "`n🛑 Stopping existing containers..." -ForegroundColor Cyan
docker-compose -f docker-compose.prod.yml down

# Remove old images (optional - uncomment if you want fresh builds)
# Write-Host "`n🗑️  Removing old images..." -ForegroundColor Cyan
# docker-compose -f docker-compose.prod.yml down --rmi all

# Build production images
Write-Host "`n🔨 Building production images..." -ForegroundColor Cyan
docker-compose -f docker-compose.prod.yml build --no-cache

if ($LASTEXITCODE -ne 0) {
    Write-Host "`n❌ Build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "`n✅ Build completed successfully!" -ForegroundColor Green

# Start services
Write-Host "`n🚀 Starting production services..." -ForegroundColor Cyan
docker-compose -f docker-compose.prod.yml up -d

if ($LASTEXITCODE -ne 0) {
    Write-Host "`n❌ Failed to start services!" -ForegroundColor Red
    exit 1
}

# Wait for services to be healthy
Write-Host "`n⏳ Waiting for services to be ready..." -ForegroundColor Cyan
Start-Sleep -Seconds 10

# Check service status
Write-Host "`n📊 Service Status:" -ForegroundColor Cyan
docker-compose -f docker-compose.prod.yml ps

# Show logs from backend (first 20 lines)
Write-Host "`n📋 Backend logs (first 20 lines):" -ForegroundColor Cyan
docker-compose -f docker-compose.prod.yml logs --tail=20 backend

Write-Host "`n" + ("=" * 60) -ForegroundColor Gray
Write-Host "🎉 Production Environment Started!" -ForegroundColor Green
Write-Host ("=" * 60) -ForegroundColor Gray

Write-Host "`n📍 Access Points:" -ForegroundColor Cyan
Write-Host "   Frontend:      http://localhost" -ForegroundColor White
Write-Host "   Backend API:   http://localhost/api" -ForegroundColor White
Write-Host "   WebSocket:     http://localhost:3001" -ForegroundColor White
Write-Host "   PostgreSQL:    localhost:5432" -ForegroundColor White
Write-Host "   Redis:         localhost:6379" -ForegroundColor White

Write-Host "`n📝 Useful Commands:" -ForegroundColor Cyan
Write-Host "   View logs:     docker-compose -f docker-compose.prod.yml logs -f" -ForegroundColor White
Write-Host "   Stop services: docker-compose -f docker-compose.prod.yml down" -ForegroundColor White
Write-Host "   Restart:       docker-compose -f docker-compose.prod.yml restart" -ForegroundColor White
Write-Host "   Health check:  .\scripts\health-check.ps1" -ForegroundColor White

Write-Host "`n⚠️  PRODUCTION MODE:" -ForegroundColor Yellow
Write-Host "   - Source code is NOT mounted (changes won't reflect)" -ForegroundColor Yellow
Write-Host "   - Debug mode is OFF" -ForegroundColor Yellow
Write-Host "   - All services restart automatically on failure" -ForegroundColor Yellow
Write-Host "   - This simulates a production environment locally" -ForegroundColor Yellow

Write-Host "`n✨ Done! Your production environment is running." -ForegroundColor Green
