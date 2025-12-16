# 🛡️ Security Checklist for Production

## ✅ Completed Security Measures

### Application Security
- [x] **Helmet.js** - Security headers enabled
- [x] **CORS** - Properly configured for production
- [x] **Input Validation** - Size limits on JSON payloads (10mb)
- [x] **Environment Variables** - Sensitive data not hardcoded
- [x] **Supabase RLS** - Row Level Security policies active
- [x] **Authentication** - Token-based auth with Supabase
- [x] **Admin Restrictions** - Email domain verification for admins

### Infrastructure Security
- [x] **HTTPS/SSL** - Let's Encrypt certificates
- [x] **Nginx Security Headers** - X-Frame-Options, CSP, etc.
- [x] **Gzip Compression** - Enabled
- [x] **Rate Limiting** - Configured on auth endpoints
- [x] **Process Manager** - PM2 with auto-restart

## ⚠️ Required Actions Before Going Live

### 1. Environment Variables
```bash
# Verify no secrets in code
grep -r "SUPABASE_SERVICE_ROLE_KEY" --exclude-dir=node_modules .
grep -r "password" --exclude-dir=node_modules .
```

### 2. Firewall Configuration
```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

### 3. SSH Hardening
```bash
# Edit SSH config
sudo nano /etc/ssh/sshd_config

# Recommended settings:
# PermitRootLogin no
# PasswordAuthentication no  # Use SSH keys only
# Port 2222  # Change default port (optional)

# Restart SSH
sudo systemctl restart sshd
```

### 4. Automatic Security Updates
```bash
sudo apt install unattended-upgrades
sudo dpkg-reconfigure --priority=low unattended-upgrades
```

### 5. Fail2Ban (Brute Force Protection)
```bash
sudo apt install fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### 6. Database Security (Supabase)
- [ ] Enable MFA on Supabase account
- [ ] Review RLS policies in Supabase dashboard
- [ ] Enable database backups in Supabase
- [ ] Rotate service role key periodically
- [ ] Set up database connection pooling if needed

### 7. Monitoring Setup
```bash
# Install monitoring tools
sudo apt install htop iotop nethogs

# Setup PM2 monitoring
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

### 8. Backup Verification
```bash
# Test backup creation
cd /var/www
tar -czf test-backup.tar.gz call-manager/

# Test backup restoration
mkdir test-restore
tar -xzf test-backup.tar.gz -C test-restore/
rm -rf test-restore test-backup.tar.gz
```

## 🔒 Sensitive Data Protection

### Never Commit These:
- `.env` files
- `SUPABASE_SERVICE_ROLE_KEY`
- Database credentials
- API keys
- Session secrets
- SSL certificates/keys

### Check for Leaks:
```bash
# Scan git history for secrets (if using git)
git log -p | grep -i "password\|key\|secret" --color=always
```

## 🔐 Access Control

### Admin Users
- [ ] Only @mejorra.com emails can register as admin
- [ ] Admin routes protected by middleware
- [ ] Admin panel access verified on frontend

### Regular Users
- [ ] RLS policies limit data access
- [ ] Users can only see their own records
- [ ] Contact sharing controlled

## 🌐 Network Security

### SSL/TLS
- [ ] HTTPS enforced (HTTP redirects to HTTPS)
- [ ] TLS 1.2+ only
- [ ] Strong cipher suites configured
- [ ] Certificate auto-renewal enabled

### Headers (Already Configured in Nginx)
```
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: no-referrer-when-downgrade
Content-Security-Policy: ...
```

## 📊 Security Monitoring

### Log Files to Monitor
```bash
# Application logs
pm2 logs call-manager-backend

# Nginx access logs
sudo tail -f /var/log/nginx/call-manager-access.log

# Nginx error logs
sudo tail -f /var/log/nginx/call-manager-error.log

# System auth logs
sudo tail -f /var/log/auth.log

# Fail2ban logs
sudo tail -f /var/log/fail2ban.log
```

### Regular Security Checks
```bash
# Check for unauthorized users
cat /etc/passwd

# Check for unauthorized SSH keys
cat ~/.ssh/authorized_keys

# Check listening ports
sudo netstat -tlnp

# Check for unusual processes
ps aux --sort=-%cpu | head -20
```

## 🚨 Incident Response Plan

### If Compromised:
1. **Immediately:**
   - Take site offline
   - Change all passwords/keys
   - Rotate Supabase keys
   - Review access logs

2. **Investigation:**
   - Check PM2 logs
   - Check Nginx access logs
   - Check system auth logs
   - Identify breach vector

3. **Recovery:**
   - Restore from known-good backup
   - Apply security patches
   - Update all credentials
   - Notify users if needed

## 🔄 Regular Maintenance

### Weekly
- [ ] Review application logs
- [ ] Check for failed login attempts
- [ ] Monitor disk space
- [ ] Review active sessions

### Monthly
- [ ] Update system packages
- [ ] Update Node.js dependencies (security only)
- [ ] Review user accounts
- [ ] Test backup restoration
- [ ] Review firewall rules

### Quarterly
- [ ] Full security audit
- [ ] Rotate secrets/keys
- [ ] Review access controls
- [ ] Update SSL certificates (if needed)
- [ ] Penetration testing (optional)

## 🛠️ Security Tools

### Recommended Tools
```bash
# Security scanning
sudo apt install lynis
sudo lynis audit system

# Port scanning (from external machine)
nmap -sV your-server-ip

# Web vulnerability scanning (use carefully)
nikto -h https://yourdomain.com
```

## 📱 Two-Factor Authentication

### Supabase Admin Account
- [ ] Enable 2FA on Supabase dashboard
- [ ] Use authenticator app (Google Authenticator, Authy)
- [ ] Save backup codes securely

### VPS Access
- [ ] Consider 2FA for SSH (optional)
- [ ] Use SSH keys instead of passwords

## 🔗 Third-Party Services

### Supabase
- [ ] Enable database encryption at rest
- [ ] Configure connection pooling
- [ ] Set up daily backups
- [ ] Monitor API usage
- [ ] Review security advisories

### Let's Encrypt
- [ ] Auto-renewal configured
- [ ] Email notifications enabled
- [ ] Renewal testing successful

## ⚖️ Compliance Considerations

### Data Protection
- [ ] Privacy policy available
- [ ] Terms of service available
- [ ] User data deletion process
- [ ] Data export capability
- [ ] Cookie consent (if in EU)

### GDPR (if applicable)
- [ ] Right to access data
- [ ] Right to deletion
- [ ] Data processing agreement
- [ ] Data breach notification plan

## 🎯 Security Best Practices

### Code
- [ ] No sensitive data in logs
- [ ] Input sanitization
- [ ] SQL injection prevention (handled by Supabase)
- [ ] XSS prevention
- [ ] CSRF protection

### Infrastructure
- [ ] Principle of least privilege
- [ ] Regular updates
- [ ] Monitoring enabled
- [ ] Backups automated
- [ ] Disaster recovery plan

## 📞 Emergency Contacts

### Keep These Handy:
- Supabase support: support@supabase.com
- VPS provider support
- Domain registrar support
- Your development team contacts

## ✅ Pre-Launch Security Verification

Run this checklist before going live:

```bash
# 1. Check SSL
curl -I https://yourdomain.com | grep "HTTP"

# 2. Check security headers
curl -I https://yourdomain.com | grep -E "X-Frame|X-Content|X-XSS"

# 3. Check HTTPS redirect
curl -I http://yourdomain.com | grep "301"

# 4. Check API health
curl https://yourdomain.com/api/health

# 5. Verify firewall
sudo ufw status

# 6. Check PM2 status
pm2 status

# 7. Verify no exposed secrets
grep -r "sk_" . --exclude-dir=node_modules
grep -r "eyJ" . --exclude-dir=node_modules | grep -v ".git"
```

---

## 🎉 Security Status

Once all items are checked, your application has industry-standard security measures in place!

**Remember:** Security is an ongoing process, not a one-time setup. Stay vigilant and keep systems updated!

