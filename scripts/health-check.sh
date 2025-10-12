#!/bin/bash
# Health check script for Gestion PFE

# Change to project root directory
cd "$(dirname "$0")/.."

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}🏥 Gestion PFE - Health Check${NC}"
echo -e "${CYAN}================================${NC}"
echo ""

all_healthy=true

# Check Docker
echo -e "${YELLOW}🔍 Checking Docker...${NC}"
if docker info > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Docker is running${NC}"
else
    echo -e "${RED}❌ Docker is not running${NC}"
    all_healthy=false
fi

echo ""

# Check containers
echo -e "${YELLOW}🔍 Checking containers...${NC}"

services=("postgres" "backend" "frontend" "notifications-server" "redis")

for service in "${services[@]}"; do
    if docker-compose ps "$service" 2>/dev/null | grep -q "Up"; then
        echo -e "${GREEN}✅ $service is running${NC}"
    else
        echo -e "${RED}❌ $service is not running${NC}"
        all_healthy=false
    fi
done

echo ""

# Check endpoints
echo -e "${YELLOW}🔍 Checking endpoints...${NC}"

# Check Frontend
if curl -s -o /dev/null -w "%{http_code}" http://localhost:5173 | grep -q "200\|404"; then
    echo -e "${GREEN}✅ Frontend (http://localhost:5173) - OK${NC}"
else
    echo -e "${RED}❌ Frontend (http://localhost:5173) - Not responding${NC}"
    all_healthy=false
fi

# Check Backend
if curl -s -o /dev/null -w "%{http_code}" http://localhost:8000 | grep -q "200\|404"; then
    echo -e "${GREEN}✅ Backend (http://localhost:8000) - OK${NC}"
else
    echo -e "${RED}❌ Backend (http://localhost:8000) - Not responding${NC}"
    all_healthy=false
fi

# Check WebSocket
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3001 | grep -q "200\|404"; then
    echo -e "${GREEN}✅ WebSocket (http://localhost:3001) - OK${NC}"
else
    echo -e "${RED}❌ WebSocket (http://localhost:3001) - Not responding${NC}"
    all_healthy=false
fi

echo ""

# Check Database connection
echo -e "${YELLOW}🔍 Checking database connection...${NC}"
if docker-compose exec -T backend php artisan db:show > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Database connection - OK${NC}"
else
    echo -e "${YELLOW}⚠️  Database connection - Issue detected${NC}"
    all_healthy=false
fi

echo ""

# Summary
echo -e "${CYAN}================================${NC}"
if [ "$all_healthy" = true ]; then
    echo -e "${GREEN}✅ All systems healthy!${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠️  Some issues detected. Check the details above.${NC}"
    echo ""
    echo -e "${CYAN}Troubleshooting tips:${NC}"
    echo "  • Run: docker-compose logs -f"
    echo "  • Run: docker-compose restart"
    echo "  • See: DEPLOYMENT_GUIDE.md"
    exit 1
fi
