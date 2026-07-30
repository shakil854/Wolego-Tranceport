# 🚀 Hostinger VPS Setup & Deployment Guide (Wolego Transport)

Ye guide aapko **Wolego Transport** project ko Hostinger Ubuntu/Debian VPS par step-by-step live karne me madad karegi.

---

## 📋 Step 1: Hostinger VPS me Login & Initial Server Setup

SSH terminal se apne Hostinger VPS me login karein:
```bash
ssh root@YOUR_VPS_IP
```

### System Packages Update:
```bash
sudo apt update && sudo apt upgrade -y
```

### Node.js 20 LTS & PM2 Install:
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs git nginx mysql-server
sudo npm install -g pm2
```

---

## 🛠️ Step 2: Puppeteer Linux Dependencies Install Karein (PDF Generation Ke Liye)

Puppeteer ko Ubuntu VPS par bina issue chalane ke liye Chromium dependencies install karein:
```bash
sudo apt install -y chromium-browser \
  ca-certificates \
  fonts-liberation \
  libappindicator3-1 \
  libasound2 \
  libatk-bridge2.0-0 \
  libatk1.0-0 \
  libc6 \
  libcairo2 \
  libcups2 \
  libdbus-1-3 \
  libexpat1 \
  libfontconfig1 \
  libgbm1 \
  libgcc1 \
  libglib2.0-0 \
  libgtk-3-0 \
  libnspr4 \
  libnss3 \
  libpango-1.0-0 \
  libpangocairo-1.0-0 \
  libstdc++6 \
  libx11-6 \
  libx11-xcb1 \
  libxcb1 \
  libxcomposite1 \
  libxcursor1 \
  libxdamage1 \
  libxext6 \
  libxfixes3 \
  libxi6 \
  libxrandr2 \
  libxrender1 \
  libxss1 \
  libxtst6 \
  lsb-release \
  wget \
  xdg-utils
```

---

## 🗄️ Step 3: MySQL Database Setup

1. MySQL terminal open karein:
```bash
sudo mysql
```

2. Database aur User create karein:
```sql
CREATE DATABASE wolego_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'wolego_user'@'localhost' IDENTIFIED BY 'YourStrongPassword123!';
GRANT ALL PRIVILEGES ON wolego_db.* TO 'wolego_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

3. Apne local MySQL database export (`.sql` file) ko VPS me import karein:
```bash
mysql -u wolego_user -p wolego_db < backup.sql
```

---

## 📂 Step 4: Code Deploy Karein

VPS par directory banayein ya Git repository clone karein:
```bash
cd /var/www
# Agar Git se clone kar rahe hain:
# git clone <your-repository-url> wolego-transport
# cd wolego-transport
```

---

## ⚙️ Step 5: Backend Deployment (PM2)

1. Backend folder me jayein aur dependencies install karein:
```bash
cd /var/www/wolego-transport/backend
npm install
```

2. `.env` file banayein:
```bash
nano .env
```
Usme ye details daalein:
```env
PORT=8002
DB_HOST=localhost
DB_USER=wolego_user
DB_PASSWORD=YourStrongPassword123!
DB_NAME=wolego_db
DB_PORT=3306
JWT_SECRET=super_secure_jwt_secret_key_99
SESSION_SECRET=super_secure_session_secret_99
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
```

3. Backend ko PM2 se start karein:
```bash
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

---

## 🌐 Step 6: Frontend Build

1. Root project directory me jayein:
```bash
cd /var/www/wolego-transport
npm install
npm run build
```
*(Aapka React production build `/var/www/wolego-transport/build` directory me tayar ho jayega.)*

---

## 🚦 Step 7: Nginx Reverse Proxy Setup

1. Nginx configuration file banayein:
```bash
sudo nano /etc/nginx/sites-available/wolego
```

2. Ye configuration paste karein (Domain name replace karein):
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com; # Apka domain name ya VPS IP

    # React Static Frontend
    root /var/www/wolego-transport/build;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Express Backend API Proxy
    location /api {
        proxy_pass http://127.0.0.1:8002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

3. Site enable karein aur Nginx restart karein:
```bash
sudo ln -s /etc/nginx/sites-available/wolego /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## 🔒 Step 8: Free SSL Certificate (HTTPS)

Certbot se SSL enable karein:
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

---

## 🎉 Verification & Check

1. Browser me `https://yourdomain.com` kholein.
2. Login, LR Entry, PDF Generation, aur Accounting check karein.
3. PM2 status check karne ke liye: `pm2 status`
4. Backend logs check karne ke liye: `pm2 logs wolego-transport-api`
