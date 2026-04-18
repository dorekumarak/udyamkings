# Simple Deployment Guide for UdyamKings

## 1. Server Requirements
- Linux server (Ubuntu 20.04+ recommended)
- Node.js 16.x
- MySQL 8.0+
- Nginx
- Git

## 2. Quick Start

### On Your Server:
```bash
# 1. Connect to your server
ssh user@your-server-ip

# 2. Install required software
sudo apt update && sudo apt upgrade -y
sudo apt install -y nginx mysql-server git

# 3. Install Node.js 16
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt install -y nodejs

# 4. Install PM2 for process management
sudo npm install -g pm2
```

### Database Setup
```sql
CREATE DATABASE udyamkings;
CREATE USER 'udyamkings'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON udyamkings.* TO 'udyamkings'@'localhost';
FLUSH PRIVILEGES;
```

### Deploy Application
```bash
# 1. Clone repository
git clone https://github.com/yourusername/udyamkings.git
cd udyamkings

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
nano .env  # Edit with your settings

# 4. Run database migrations
npx sequelize-cli db:migrate

# 5. Start application
pm2 start npm --name "udyamkings" -- start

# 6. Start on boot
pm2 startup
pm2 save
```

### Nginx Setup
Create `/etc/nginx/sites-available/udyamkings`:
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/udyamkings /etc/nginx/sites-enabled/
sudo nginx -t  # Test config
sudo systemctl restart nginx
```

## 3. SSL Certificate (HTTPS)
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

## 4. Environment Variables (.env)
```env
NODE_ENV=production
PORT=3000
DB_HOST=localhost
DB_NAME=udyamkings
DB_USER=udyamkings
DB_PASS=your_secure_password
JWT_SECRET=your_jwt_secret
RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret
```

## 5. Admin Access
1. Visit: `https://yourdomain.com/admin`
2. Use default admin credentials:
   - Email: admin@example.com
   - Password: ChangeThisPassword123!

## 6. Maintenance
- View logs: `pm2 logs udyamkings`
- Restart: `pm2 restart udyamkings`
- Stop: `pm2 stop udyamkings`
- Start: `pm2 start udyamkings`

## 7. Backups
```bash
# Backup database
mysqldump -u udyamkings -p udyamkings > backup_$(date +%Y%m%d).sql

# Backup uploads
tar -czf uploads_backup_$(date +%Y%m%d).tar.gz public/uploads/
```

## 8. Updating
```bash
cd /path/to/udyamkings
git pull
npm install
npx sequelize-cli db:migrate
pm2 restart udyamkings
```

## 9. Security Tips
1. Change all default passwords
2. Keep system updated: `sudo apt update && sudo apt upgrade`
3. Use strong passwords
4. Enable firewall: `sudo ufw enable`
5. Regular backups

## 10. Troubleshooting
- Check logs: `pm2 logs udyamkings`
- Check Nginx: `sudo tail -f /var/log/nginx/error.log`
- Check MySQL: `sudo tail -f /var/log/mysql/error.log`
