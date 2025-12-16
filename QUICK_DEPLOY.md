# ⚡ Quick Deployment Guide - TL;DR

For experienced developers who want to deploy fast. Full details in `PRODUCTION_DEPLOYMENT_GUIDE.md`.

## 🚀 Quick Steps

### 1. Server Setup (5 minutes)
```bash
# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs nginx git

# Install PM2
sudo npm install -g pm2
pm2 startup
```

### 2. Deploy Application (3 minutes)
```bash
# Clone app
sudo mkdir -p /var/www/call-manager
sudo chown -R $USER:$USER /var/www/call-manager
cd /var/www/call-manager
# Upload your files or git clone

# Install and build
cd server && npm ci --production && cd ..
cd client && npm ci && npm run build && cd ..
```

### 3. Environment Variables (2 minutes)
```bash
# Server .env
cd /var/www/call-manager/server
nano .env
```
```env
NODE_ENV=production
PORT=5001
SUPABASE_URL=your_url
SUPABASE_ANON_KEY=your_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
FRONTEND_URL=https://yourdomain.com
SESSION_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
```

```bash
# Client .env.production
cd /var/www/call-manager/client
nano .env.production
```
```env
REACT_APP_API_URL=https://yourdomain.com/api
REACT_APP_SUPABASE_URL=your_url
REACT_APP_SUPABASE_ANON_KEY=your_key
```

### 4. Start Backend (1 minute)
```bash
cd /var/www/call-manager
pm2 start ecosystem.config.js
pm2 save
```

### 5. Configure Nginx (3 minutes)
```bash
# Copy nginx config
sudo nano /etc/nginx/sites-available/call-manager
# Paste nginx.conf contents, replace yourdomain.com

# Enable and test
sudo ln -s /etc/nginx/sites-available/call-manager /etc/nginx/sites-enabled/
sudo nginx -t
```

### 6. SSL Certificate (2 minutes)
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### 7. Start Services
```bash
sudo systemctl reload nginx
pm2 restart all
```

### 8. Security (3 minutes)
```bash
# Firewall
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable

# Auto-updates
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure --priority=low unattended-upgrades
```

## ✅ Verification

```bash
# Check backend
curl https://yourdomain.com/api/health

# Check frontend
curl -I https://yourdomain.com

# Check PM2
pm2 status

# Visit site
https://yourdomain.com
```

## 🔄 Future Updates

```bash
cd /var/www/call-manager
./deploy.sh
```

## 📖 Need Help?

- Full guide: `PRODUCTION_DEPLOYMENT_GUIDE.md`
- Security: `SECURITY_CHECKLIST.md`
- Environment: `ENV_SETUP_GUIDE.md`

---

**Total Time: ~20 minutes** (excluding DNS propagation)

