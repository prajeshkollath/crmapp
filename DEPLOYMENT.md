# Deployment Guide - GCP VM

This guide walks you through deploying the CRM platform to your GCP VM with Docker.

---

## Prerequisites

- GCP VM with Docker and Docker Compose installed
- PostgreSQL credentials (will be in Docker container)
- Domain name (optional, for production)
- SSH access to your VM

---

## Step 1: Prepare Your VM

### Install Docker & Docker Compose

```bash
# Update packages
sudo apt-get update
sudo apt-get upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version

# Logout and login again for group changes
exit
```

---

## Step 2: Transfer Code to VM

### Option A: Via SCP

```bash
# From your local machine (where you built the code)
cd /app
tar -czf crm-platform.tar.gz .

# Transfer to VM
scp crm-platform.tar.gz user@YOUR_VM_IP:/home/user/

# SSH into VM
ssh user@YOUR_VM_IP

# Extract
cd /home/user
tar -xzf crm-platform.tar.gz
mkdir -p crm-platform
cd crm-platform
```

### Option B: Via Git (if you push to a repo)

```bash
ssh user@YOUR_VM_IP
cd /home/user
git clone https://your-repo-url.git crm-platform
cd crm-platform
```

---

## Step 3: Configure Environment Variables

### Backend Configuration

Edit `/home/user/crm-platform/backend/.env`:

```bash
nano backend/.env
```

Update with your production values:

```env
# IMPORTANT: Change these for production
DATABASE_URL=postgresql+asyncpg://crm_user:CHANGE_THIS_PASSWORD@postgres:5432/crm_db
SECRET_KEY=GENERATE_RANDOM_STRING_HERE_MIN_32_CHARS
CORS_ORIGINS=https://your-domain.com,http://YOUR_VM_IP
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080
```

**Generate SECRET_KEY**:
```bash
openssl rand -base64 32
```

### Frontend Configuration

Edit `/home/user/crm-platform/frontend/.env`:

```bash
nano frontend/.env
```

Update:
```env
# Use your VM's IP or domain
REACT_APP_BACKEND_URL=http://YOUR_VM_IP:8001
# OR for production with domain:
# REACT_APP_BACKEND_URL=https://api.your-domain.com
```

### Docker Compose Configuration

Edit `/home/user/crm-platform/docker-compose.yml`:

```bash
nano docker-compose.yml
```

Update the backend environment section:

```yaml
backend:
  environment:
    - DATABASE_URL=postgresql+asyncpg://crm_user:YOUR_SECURE_PASSWORD@postgres:5432/crm_db
    - SECRET_KEY=YOUR_GENERATED_SECRET_KEY
    - CORS_ORIGINS=http://YOUR_VM_IP,http://localhost
```

And update PostgreSQL credentials:

```yaml
postgres:
  environment:
    POSTGRES_USER: crm_user
    POSTGRES_PASSWORD: YOUR_SECURE_PASSWORD  # Change this!
    POSTGRES_DB: crm_db
```

---

## Step 4: Build and Deploy

```bash
cd /home/user/crm-platform

# Build all containers
docker-compose build

# Start services
docker-compose up -d

# Check status
docker-compose ps

# Expected output:
# NAME                STATUS              PORTS
# crm-backend         Up                  0.0.0.0:8001->8001/tcp
# crm-frontend        Up                  0.0.0.0:80->80/tcp
# crm-postgres        Up                  0.0.0.0:5432->5432/tcp
```

### Verify Deployment

```bash
# Check logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Test backend API
curl http://localhost:8001/api/health

# Expected: {"status":"healthy","service":"crm-platform"}
```

---

## Step 5: Access Your Application

### Via IP Address

Open browser:
- Frontend: `http://YOUR_VM_IP`
- Backend API: `http://YOUR_VM_IP:8001/docs`

### Configure Firewall (GCP)

```bash
# Allow HTTP
gcloud compute firewall-rules create allow-http \
  --allow tcp:80 \
  --source-ranges 0.0.0.0/0 \
  --description "Allow HTTP traffic"

# Allow Backend API (optional, for testing)
gcloud compute firewall-rules create allow-backend \
  --allow tcp:8001 \
  --source-ranges 0.0.0.0/0 \
  --description "Allow Backend API"

# Or via GCP Console:
# VPC Network → Firewall → Create Rule
# - Targets: All instances
# - Source IP: 0.0.0.0/0
# - Protocols: tcp:80, tcp:8001
```

---

## Step 6: Production Setup (Optional)

### A. Setup Domain Name

1. Point your domain to VM IP in DNS (A record)
2. Wait for DNS propagation (5-30 minutes)

### B. Install SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx -y

# Get certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Auto-renewal
sudo certbot renew --dry-run
```

### C. Configure Nginx for SSL

Create `/etc/nginx/sites-available/crm-platform`:

```nginx
# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    return 301 https://$server_name$request_uri;
}

# Frontend (HTTPS)
server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;
    
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

# API (HTTPS)
server {
    listen 443 ssl http2;
    server_name api.your-domain.com;
    
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    location / {
        proxy_pass http://localhost:8001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

Enable and restart:
```bash
sudo ln -s /etc/nginx/sites-available/crm-platform /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

Update frontend `.env`:
```env
REACT_APP_BACKEND_URL=https://api.your-domain.com
```

Rebuild frontend:
```bash
cd /home/user/crm-platform
docker-compose build frontend
docker-compose up -d frontend
```

---

## Step 7: Database Backup

### Manual Backup

```bash
# Backup PostgreSQL
docker exec crm-postgres pg_dump -U crm_user crm_db > backup_$(date +%Y%m%d).sql

# Restore
cat backup_20250115.sql | docker exec -i crm-postgres psql -U crm_user -d crm_db
```

### Automated Daily Backups

Create `/home/user/backup-crm.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/home/user/backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup database
docker exec crm-postgres pg_dump -U crm_user crm_db | gzip > $BACKUP_DIR/crm_db_$DATE.sql.gz

# Keep only last 7 days
find $BACKUP_DIR -name "crm_db_*.sql.gz" -mtime +7 -delete

echo "Backup completed: crm_db_$DATE.sql.gz"
```

Make executable and add to cron:
```bash
chmod +x /home/user/backup-crm.sh

# Add to crontab (daily at 2 AM)
crontab -e
# Add line:
0 2 * * * /home/user/backup-crm.sh >> /home/user/backup.log 2>&1
```

---

## Step 8: Monitoring

### Check Container Health

```bash
# View all containers
docker-compose ps

# View logs
docker-compose logs -f

# View specific service
docker-compose logs -f backend

# Check resource usage
docker stats
```

### Check Application Health

```bash
# Backend health check
curl http://localhost:8001/api/health

# PostgreSQL connection
docker exec crm-postgres psql -U crm_user -d crm_db -c "SELECT 1;"

# List tables
docker exec crm-postgres psql -U crm_user -d crm_db -c "\dt"
```

---

## Step 9: Updates

### Update Code

```bash
cd /home/user/crm-platform

# Pull latest code (if using git)
git pull

# Or upload new files via SCP

# Rebuild and restart
docker-compose build
docker-compose up -d

# Run migrations
docker-compose exec backend alembic upgrade head
```

---

## Step 10: Troubleshooting

### Backend Won't Start

```bash
# Check logs
docker-compose logs backend

# Common issues:
# 1. Database connection failed
#    - Check DATABASE_URL in .env
#    - Verify postgres container is running
docker-compose ps postgres

# 2. Migration failed
#    - Run manually
docker-compose exec backend alembic upgrade head

# 3. Port already in use
sudo lsof -i :8001
# Kill process or change port
```

### Frontend Won't Load

```bash
# Check logs
docker-compose logs frontend

# Verify Nginx config
docker-compose exec frontend nginx -t

# Check if backend is accessible
curl http://localhost:8001/api/health
```

### Can't Access from Browser

```bash
# Check firewall
sudo ufw status

# Allow ports
sudo ufw allow 80
sudo ufw allow 8001

# Check GCP firewall rules in Console
```

### Database Issues

```bash
# Check PostgreSQL logs
docker-compose logs postgres

# Connect to database
docker exec -it crm-postgres psql -U crm_user -d crm_db

# Check connections
\conninfo

# List tables
\dt

# View users
SELECT * FROM users;
```

---

## Common Commands Reference

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# Restart specific service
docker-compose restart backend

# View logs
docker-compose logs -f

# Execute command in container
docker-compose exec backend bash
docker-compose exec postgres psql -U crm_user -d crm_db

# Rebuild after code change
docker-compose build backend
docker-compose up -d backend

# Run migrations
docker-compose exec backend alembic upgrade head

# Create new migration
docker-compose exec backend alembic revision --autogenerate -m "description"

# Clean up
docker-compose down -v  # Removes volumes (WARNING: deletes data!)
docker system prune -a   # Clean unused images
```

---

## Security Checklist

- [ ] Changed default PostgreSQL password
- [ ] Generated new SECRET_KEY
- [ ] Configured CORS_ORIGINS properly
- [ ] Firewall configured (only necessary ports open)
- [ ] SSL certificate installed (for production)
- [ ] Database backups configured
- [ ] Sensitive data not in git repository
- [ ] Updated all default credentials
- [ ] Monitoring enabled
- [ ] Log rotation configured

---

## Support

**Logs Location**:
- Backend: `docker-compose logs backend`
- Frontend: `docker-compose logs frontend`
- PostgreSQL: `docker-compose logs postgres`

**Database Access**:
```bash
docker exec -it crm-postgres psql -U crm_user -d crm_db
```

**API Documentation**: `http://YOUR_VM_IP:8001/docs`

---

## Success!

Your CRM platform is now deployed! Access it at:
- **Application**: `http://YOUR_VM_IP` (or your domain)
- **API Docs**: `http://YOUR_VM_IP:8001/docs`

Next steps:
1. Login with Google OAuth
2. Create your first contact
3. Setup webhooks for automation
4. Add more modules (Companies, Deals, etc.)

Refer to `MODULE_REPLICATION_GUIDE.md` to extend the platform!
