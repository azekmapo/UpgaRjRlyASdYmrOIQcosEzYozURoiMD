#!/usr/bin/env pwsh
# Health check script for Gestion PFE

# Change to project root directory
Set-Location -Path (Split-Path -Parent $PSScriptRoot)

Write-Host "🏥 Gestion PFE - Health Check" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

$allHealthy = $true

# Check Docker
Write-Host "🔍 Checking Docker..." -ForegroundColor Yellow
try {
    docker info | Out-Null
    Write-Host "✅ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not running" -ForegroundColor Red
    $allHealthy = $false
}

Write-Host ""

# Check if containers are running
Write-Host "🔍 Checking containers..." -ForegroundColor Yellow
$containers = docker-compose ps --format json 2>$null | ConvertFrom-Json

if ($containers) {
    $services = @('postgres', 'backend', 'frontend', 'notifications-server', 'redis')
    
    foreach ($service in $services) {
        $container = $containers | Where-Object { $_.Service -eq $service } | Select-Object -First 1
        
        if ($container) {
            if ($container.State -eq 'running' -or $container.Health -eq 'healthy') {
                Write-Host "✅ $service is running" -ForegroundColor Green
            } else {
                Write-Host "⚠️  $service is $($container.State)" -ForegroundColor Yellow
                $allHealthy = $false
            }
        } else {
            Write-Host "❌ $service not found" -ForegroundColor Red
            $allHealthy = $false
        }
    }
} else {
    Write-Host "❌ No containers running" -ForegroundColor Red
    $allHealthy = $false
}

Write-Host ""

# Check endpoints
Write-Host "🔍 Checking endpoints..." -ForegroundColor Yellow

# Check Frontend
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5173" -TimeoutSec 5 -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Frontend (http://localhost:5173) - OK" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Frontend (http://localhost:5173) - Not responding" -ForegroundColor Red
    $allHealthy = $false
}

# Check Backend
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8000" -TimeoutSec 5 -UseBasicParsing
    if ($response.StatusCode -eq 200 -or $response.StatusCode -eq 404) {
        Write-Host "✅ Backend (http://localhost:8000) - OK" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Backend (http://localhost:8000) - Not responding" -ForegroundColor Red
    $allHealthy = $false
}

# Check WebSocket
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001" -TimeoutSec 5 -UseBasicParsing
    if ($response.StatusCode -eq 200 -or $response.StatusCode -eq 404) {
        Write-Host "✅ WebSocket (http://localhost:3001) - OK" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ WebSocket (http://localhost:3001) - Not responding" -ForegroundColor Red
    $allHealthy = $false
}

Write-Host ""

# Check Database connection
Write-Host "🔍 Checking database connection..." -ForegroundColor Yellow
try {
    $dbCheck = docker-compose exec -T backend php artisan db:show 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Database connection - OK" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Database connection - Issue detected" -ForegroundColor Yellow
        $allHealthy = $false
    }
} catch {
    Write-Host "❌ Cannot check database connection" -ForegroundColor Red
    $allHealthy = $false
}

Write-Host ""

# Summary
Write-Host "================================" -ForegroundColor Cyan
if ($allHealthy) {
    Write-Host "✅ All systems healthy!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "⚠️  Some issues detected. Check the details above." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Troubleshooting tips:" -ForegroundColor Cyan
    Write-Host "  • Run: docker-compose logs -f" -ForegroundColor White
    Write-Host "  • Run: docker-compose restart" -ForegroundColor White
    Write-Host "  • See: DEPLOYMENT_GUIDE.md" -ForegroundColor White
    exit 1
}
