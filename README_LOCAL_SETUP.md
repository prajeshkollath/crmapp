# 🚀 Quick Start - Local Docker Desktop

Get the CRM platform running on your local machine in 5 minutes.

---

## Prerequisites

✅ **Docker Desktop** installed and running
- Download: https://www.docker.com/products/docker-desktop
- Ensure Docker Desktop is running (check system tray/menu bar)

✅ **Minimum Requirements:**
- 4GB RAM allocated to Docker
- 10GB free disk space

---

## Quick Start (3 Commands)

```bash
# 1. Navigate to project
cd /app

# 2. Start everything
docker-compose -f docker-compose.local.yml up --build

# 3. Open browser
# Frontend: http://localhost:3000
# API Docs: http://localhost:8001/docs
```

**That's it!** Wait 3-5 minutes for first build, then access http://localhost:3000

---

## Alternative: Use Start Script

```bash
cd /app
./START_LOCAL.sh
```

---

## What Gets Started

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | http://localhost:3000 | React UI |
| **Backend API** | http://localhost:8001 | FastAPI server |
| **API Docs** | http://localhost:8001/docs | Swagger UI |
| **PostgreSQL** | localhost:5432 | Database |

---

## Verify Everything is Running

```bash
# Check container status
docker-compose -f docker-compose.local.yml ps

# Expected output:
# crm-postgres-local    Up (healthy)
# crm-backend-local     Up
# crm-frontend-local    Up
```

---

## Access the Application

### 1. Open Frontend
http://localhost:3000

Click **"View Demo Dashboard"** to see the UI.

### 2. Test Backend API
http://localhost:8001/docs

Try the `/api/health` endpoint to verify backend is working.

### 3. Connect to Database (Optional)

```bash
docker exec -it crm-postgres-local psql -U crm_user -d crm_db
```

---

## Stop Services

**Option 1:** Press `Ctrl+C` in the terminal where docker-compose is running

**Option 2:** Run in new terminal:
```bash
docker-compose -f docker-compose.local.yml down
```

---

## Common Issues & Solutions

### Issue: "Port 5432 already in use"

**Solution:** Stop local PostgreSQL or change port in `docker-compose.local.yml`

```bash
# Check what's using port 5432
lsof -i :5432

# Kill the process or change port to 5433 in docker-compose
```

### Issue: "Cannot connect to Docker daemon"

**Solution:** Start Docker Desktop application

### Issue: Backend shows database connection error

**Solution:** Wait for PostgreSQL to be healthy (takes 10-30 seconds)

```bash
# Check PostgreSQL health
docker exec crm-postgres-local pg_isready -U crm_user
```

---

## View Logs

```bash
# All services
docker-compose -f docker-compose.local.yml logs -f

# Specific service
docker-compose -f docker-compose.local.yml logs -f backend
```

---

## Clean Start (Reset Everything)

```bash
# Stop and remove all data (⚠️ deletes database)
docker-compose -f docker-compose.local.yml down -v

# Start fresh
docker-compose -f docker-compose.local.yml up --build
```

---

## Development Mode

Changes to code are automatically reflected:

- **Backend**: Auto-reloads on file changes
- **Frontend**: Hot-reload in browser
- **Database**: Migrations run automatically on startup

---

## Next Steps

After verifying local setup works:

1. 📖 Read full documentation: `SETUP_LOCAL_DOCKER.md`
2. 🔧 Add more modules: `MODULE_REPLICATION_GUIDE.md`
3. 🔗 Setup webhooks: `WEBHOOK_INTEGRATION_GUIDE.md`
4. 🚀 Deploy to GCP: `DEPLOYMENT.md`

---

## Quick Commands Reference

```bash
# Start services
docker-compose -f docker-compose.local.yml up

# Start in background
docker-compose -f docker-compose.local.yml up -d

# Stop services
docker-compose -f docker-compose.local.yml down

# Rebuild after changes
docker-compose -f docker-compose.local.yml up --build

# View logs
docker-compose -f docker-compose.local.yml logs -f

# Check status
docker-compose -f docker-compose.local.yml ps
```

---

## Production Deployment

Once local testing is complete, deploy to GCP VM:
- See `DEPLOYMENT.md` for production setup
- Use `docker-compose.yml` (not `docker-compose.local.yml`)
- Update environment variables for production

---

**Need help?** Check `SETUP_LOCAL_DOCKER.md` for detailed troubleshooting.
