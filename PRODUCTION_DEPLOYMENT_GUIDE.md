# 🚀 Production Deployment Guide - Call Manager

Complete guide to deploy Call Manager on a VPS (Ubuntu/Debian).

## 📋 Prerequisites

### Your VPS Should Have:
- Ubuntu 20.04+ or Debian 11+
- At least 2GB RAM
- 20GB+ storage
- Root or sudo access
- Domain name pointed to VPS IP

### Required Software:
- Node.js 18+ (LTS)
- Nginx
- PM2 (Process Manager)
- Git
- Certbot (for SSL)

---

## 🔧 Step 1: Initial Server Setup

### 1.1 Update System
```bash
sudo apt update && sudo apt upgrade -y
```

### 1.2 Install Node.js (using NodeSource)
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
node --version  # Should show v18.x.x
npm --version
```

### 1.3 Install Nginx
```bash
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 1.4 Install PM2 Globally
```bash
sudo npm install -g pm2
pm2 startup  # Follow the instructions output
```

### 1.5 Install Git
```bash
sudo apt install -y git
```

---

## 📦 Step 2: Clone and Setup Application

### 2.1 Create App Directory
```bash
sudo mkdir -p /var/www/call-manager
sudo chown -R $USER:$USER /var/www/call-manager
cd /var/www/call-manager
```

### 2.2 Clone Repository
```bash
# Option A: If using Git
git clone <your-repo-url> .

# Option B: Upload files manually using SCP/SFTP
# From your local machine:
# scp -r "Call Manager"/* user@your-vps-ip:/var/www/call-manager/
```

### 2.3 Install Server Dependencies
```bash
cd /var/www/call-manager/server
npm ci --production
```

### 2.4 Install Client Dependencies
```bash
cd /var/www/call-manager/client
npm ci
```

---

## 🔐 Step 3: Configure Environment Variables

### 3.1 Server Environment
```bash
cd /var/www/call-manager/server
nano .env
```

Paste this (replace with your actual values):
```env
NODE_ENV=production
PORT=5001

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

FRONTEND_URL=https://yourdomain.com
SESSION_SECRET=your_generated_secret_here
```

Generate SESSION_SECRET:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 3.2 Client Environment
```bash
cd /var/www/call-manager/client
nano .env.production
```

Paste this:
```env
REACT_APP_API_URL=https://yourdomain.com/api
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your_anon_key_here
```

---

## 🏗️ Step 4: Build React Application

```bash
cd /var/www/call-manager/client
npm run build

# Verify build was created
ls -la build/
```

---

## ⚙️ Step 5: Configure PM2

### 5.1 Copy PM2 Config
The `ecosystem.config.js` file is already in your project root.

### 5.2 Start Application with PM2
```bash
cd /var/www/call-manager
pm2 start ecosystem.config.js
```

### 5.3 Save PM2 Configuration
```bash
pm2 save
```

### 5.4 Verify Application is Running
```bash
pm2 status
pm2 logs call-manager-backend

# Test backend
curl http://localhost:5001/api/health
```

---

## 🌐 Step 6: Configure Nginx

### 6.1 Create Nginx Configuration
```bash
sudo nano /etc/nginx/sites-available/call-manager
```

Copy the contents from `/Users/chizy/Desktop/Call Manager/nginx.conf`

**Important: Replace these in the config:**
- `yourdomain.com` with your actual domain
- Certificate paths (we'll set these up next)

### 6.2 Enable Site
```bash
sudo ln -s /etc/nginx/sites-available/call-manager /etc/nginx/sites-enabled/
sudo nginx -t  # Test configuration
```

---

## 🔒 Step 7: Setup SSL Certificate (HTTPS)

### 7.1 Install Certbot
```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 7.2 Get SSL Certificate
```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Follow the prompts:
- Enter email address
- Agree to terms
- Choose to redirect HTTP to HTTPS

### 7.3 Auto-renewal Setup
```bash
sudo certbot renew --dry-run  # Test renewal
sudo systemctl status certbot.timer  # Verify auto-renewal is enabled
```

---

## 🚀 Step 8: Start Services

### 8.1 Reload Nginx
```bash
sudo systemctl reload nginx
```

### 8.2 Check PM2 Status
```bash
pm2 status
pm2 monit  # Interactive monitoring
```

---

## ✅ Step 9: Verify Deployment

### 9.1 Check Application
Visit: `https://yourdomain.com`

### 9.2 Check API
Visit: `https://yourdomain.com/api/health`

Should return:
```json
{
  "status": "ok",
  "database": "supabase",
  "environment": "production",
  "timestamp": "2024-..."
}
```

### 9.3 Test Login
- Try logging in with existing account
- Try creating new account
- Verify dashboard loads

---

## 📊 Step 10: Monitoring and Logs

### PM2 Commands
```bash
# View status
pm2 status

# View logs
pm2 logs call-manager-backend

# View logs in real-time
pm2 logs call-manager-backend --lines 100

# Restart application
pm2 restart call-manager-backend

# Stop application
pm2 stop call-manager-backend

# Delete from PM2
pm2 delete call-manager-backend
```

### Nginx Logs
```bash
# Access logs
sudo tail -f /var/log/nginx/call-manager-access.log

# Error logs
sudo tail -f /var/log/nginx/call-manager-error.log
```

### System Monitoring
```bash
# CPU and Memory
htop

# Disk usage
df -h

# Check running processes
ps aux | grep node
```

---

## 🔄 Step 11: Setup Deployment Script

### 11.1 Make Deploy Script Executable
```bash
cd /var/www/call-manager
chmod +x deploy.sh
```

### 11.2 Future Deployments
```bash
cd /var/www/call-manager
./deploy.sh
```

This script will:
1. Create backup
2. Pull latest code
3. Install dependencies
4. Build React app
5. Restart backend
6. Reload Nginx
7. Clean old backups

---

## 🛡️ Security Checklist

### Essential Security Measures:

- [x] SSL certificate installed (HTTPS)
- [x] Helmet.js security headers enabled
- [x] CORS configured properly
- [x] Environment variables secured
- [x] Service role key kept secret
- [x] PM2 running as non-root user
- [ ] Firewall configured (UFW)
- [ ] Fail2ban installed (optional)
- [ ] Regular backups scheduled
- [ ] Monitoring setup

### Configure Firewall (UFW)
```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status
```

---

## 🔧 Troubleshooting

### Application Won't Start
```bash
# Check PM2 logs
pm2 logs call-manager-backend --err

# Check environment variables
cd /var/www/call-manager/server
cat .env

# Test backend manually
cd /var/www/call-manager/server
node index.js
```

### Nginx Errors
```bash
# Check Nginx configuration
sudo nginx -t

# Check error logs
sudo tail -50 /var/log/nginx/error.log

# Restart Nginx
sudo systemctl restart nginx
```

### Database Connection Issues
```bash
# Test Supabase connection
cd /var/www/call-manager/server
node -e "
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
supabase.from('users').select('count').then(console.log);
"
```

### 502 Bad Gateway
- Check if backend is running: `pm2 status`
- Check backend port: `sudo netstat -tlnp | grep 5001`
- Check Nginx proxy configuration
- Check PM2 logs: `pm2 logs`

### SSL Certificate Issues
```bash
# Renew certificate manually
sudo certbot renew

# Check certificate status
sudo certbot certificates

# Test SSL configuration
curl -I https://yourdomain.com
```

---

## 📈 Performance Optimization

### 1. Enable PM2 Clustering
Already configured in `ecosystem.config.js` (2 instances)

### 2. Nginx Caching
Already configured in nginx.conf:
- Static assets cached for 1 year
- Gzip compression enabled

### 3. Database Optimization
- Ensure proper indexes in Supabase
- Use RLS policies efficiently
- Monitor query performance

### 4. CDN (Optional)
Consider using Cloudflare for:
- DDoS protection
- Additional caching
- Global CDN

---

## 🔄 Backup Strategy

### Manual Backup
```bash
# Create backup
cd /var/www
tar -czf call-manager-backup-$(date +%Y%m%d).tar.gz call-manager/

# Download to local machine
scp user@your-vps-ip:/var/www/call-manager-backup-*.tar.gz ./
```

### Automated Daily Backups (Cron)
```bash
# Edit crontab
crontab -e

# Add this line (backup at 2 AM daily)
0 2 * * * tar -czf /var/backups/call-manager/backup-$(date +\%Y\%m\%d).tar.gz -C /var/www/call-manager . && find /var/backups/call-manager -name "backup-*.tar.gz" -mtime +7 -delete
```

---

## 📋 Maintenance Tasks

### Weekly
- [ ] Review PM2 logs
- [ ] Check disk space
- [ ] Review Nginx logs
- [ ] Monitor application performance

### Monthly
- [ ] Update system packages
- [ ] Update Node.js dependencies (security patches)
- [ ] Review and rotate logs
- [ ] Test backup restoration
- [ ] Review user activity

### Quarterly
- [ ] Update Node.js version if needed
- [ ] Update PM2
- [ ] Review and update security policies
- [ ] Performance audit

---

## 🆘 Emergency Procedures

### Application Crash
```bash
pm2 restart call-manager-backend
# If still failing:
pm2 delete call-manager-backend
cd /var/www/call-manager
pm2 start ecosystem.config.js
```

### Rollback to Previous Version
```bash
cd /var/www/call-manager
# Restore from backup
sudo tar -xzf /var/backups/call-manager/backup-YYYYMMDD.tar.gz -C /var/www/call-manager
pm2 restart call-manager-backend
sudo systemctl reload nginx
```

### High CPU/Memory Usage
```bash
# Check processes
htop

# Restart PM2 processes
pm2 restart all

# If needed, increase PM2 memory limit
pm2 delete call-manager-backend
# Edit ecosystem.config.js (increase max_memory_restart)
pm2 start ecosystem.config.js
```

---

## 📞 Support & Resources

### Useful Links
- PM2 Documentation: https://pm2.keymetrics.io/docs/usage/quick-start/
- Nginx Documentation: https://nginx.org/en/docs/
- Supabase Documentation: https://supabase.com/docs
- Let's Encrypt: https://letsencrypt.org/docs/

### Command Cheat Sheet
```bash
# PM2
pm2 status
pm2 logs
pm2 restart all
pm2 monit

# Nginx
sudo nginx -t
sudo systemctl reload nginx
sudo systemctl restart nginx

# System
df -h  # Disk usage
free -m  # Memory usage
htop  # Process monitor
```

---

## ✅ Post-Deployment Checklist

- [ ] Application accessible via HTTPS
- [ ] HTTP redirects to HTTPS
- [ ] API endpoints responding
- [ ] Login/Signup working
- [ ] Dashboard loads correctly
- [ ] Admin panel accessible (for admin users)
- [ ] SSL certificate valid
- [ ] PM2 auto-restart enabled
- [ ] Backups configured
- [ ] Monitoring setup
- [ ] Firewall configured
- [ ] DNS records correct
- [ ] Environment variables set
- [ ] Logs rotating properly

---

## 🎉 Congratulations!

Your Call Manager application is now deployed in production!

Access your application at: **https://yourdomain.com**

For ongoing support and updates, refer to this guide and the troubleshooting section.

