#!/bin/bash
# Production Deployment Script for Call Manager
# Usage: ./deploy.sh

set -e  # Exit on error

echo "🚀 Starting Call Manager Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
APP_DIR="/var/www/call-manager"
BACKUP_DIR="/var/backups/call-manager"
DATE=$(date +%Y%m%d_%H%M%S)

echo -e "${YELLOW}📦 Step 1: Creating backup...${NC}"
mkdir -p $BACKUP_DIR
if [ -d "$APP_DIR" ]; then
    tar -czf $BACKUP_DIR/backup_$DATE.tar.gz -C $APP_DIR .
    echo -e "${GREEN}✓ Backup created${NC}"
else
    echo -e "${YELLOW}⚠ No existing installation found, skipping backup${NC}"
fi

echo -e "${YELLOW}📥 Step 2: Pulling latest code...${NC}"
cd $APP_DIR
git pull origin main
echo -e "${GREEN}✓ Code updated${NC}"

echo -e "${YELLOW}📦 Step 3: Installing server dependencies...${NC}"
cd $APP_DIR/server
npm ci --production
echo -e "${GREEN}✓ Server dependencies installed${NC}"

echo -e "${YELLOW}📦 Step 4: Installing client dependencies...${NC}"
cd $APP_DIR/client
npm ci
echo -e "${GREEN}✓ Client dependencies installed${NC}"

echo -e "${YELLOW}🏗️  Step 5: Building React app...${NC}"
npm run build
echo -e "${GREEN}✓ React app built${NC}"

echo -e "${YELLOW}🔄 Step 6: Restarting backend with PM2...${NC}"
pm2 restart call-manager-backend
echo -e "${GREEN}✓ Backend restarted${NC}"

echo -e "${YELLOW}🔄 Step 7: Reloading Nginx...${NC}"
sudo systemctl reload nginx
echo -e "${GREEN}✓ Nginx reloaded${NC}"

echo -e "${YELLOW}🧹 Step 8: Cleaning up old backups (keeping last 5)...${NC}"
cd $BACKUP_DIR
ls -t | tail -n +6 | xargs -r rm --
echo -e "${GREEN}✓ Cleanup complete${NC}"

echo ""
echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo ""
echo "📊 Application Status:"
pm2 status call-manager-backend
echo ""
echo "📝 View logs with: pm2 logs call-manager-backend"
echo "🔍 Monitor with: pm2 monit"

