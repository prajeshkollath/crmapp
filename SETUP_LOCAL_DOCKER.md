# Local Docker Desktop Setup Guide

This guide will help you run the CRM platform locally on Docker Desktop.

---

## Prerequisites

1. **Docker Desktop** installed and running
   - Download: https://www.docker.com/products/docker-desktop
   - Ensure Docker Desktop has at least 4GB RAM allocated
   - Verify: `docker --version` and `docker-compose --version`

2. **Git** (to clone/manage the repository)

---

## Project Structure

```
/app/
├── backend/              # FastAPI backend
├── frontend/             # React frontend  
├── docker-compose.local.yml   # Local Docker Compose config
├── Dockerfile.backend         # Backend Docker image
├── Dockerfile.frontend.local  # Frontend Docker image (dev mode)
└── .env.local                 # Local environment variables
```

---

## Step-by-Step Setup

### Step 1: Verify Docker Desktop is Running

Open Docker Desktop application and ensure it's running.

Verify in terminal:
```bash
docker ps
```

You should see an empty list or existing containers (no errors).

---

### Step 2: Navigate to Project Directory

```bash
cd /app
```

---

### Step 3: Build and Start All Containers

```bash
# Build and start all services
docker-compose -f docker-compose.local.yml up --build
```

**What happens:**
1. PostgreSQL container starts (port 5432)
2. Backend waits for PostgreSQL to be healthy
3. Backend runs Alembic migrations automatically
4. Backend starts on port 8001
5. Frontend starts on port 3000

**First time build takes 3-5 minutes.** Subsequent starts are faster.

---

### Step 4: Verify All Services Are Running

Open a new terminal and run:

```bash
docker-compose -f docker-compose.local.yml ps
```

Expected output:
```
NAME                   STATUS              PORTS
crm-postgres-local     Up (healthy)        0.0.0.0:5432->5432/tcp
crm-backend-local      Up                  0.0.0.0:8001->8001/tcp
crm-frontend-local     Up                  0.0.0.0:3000->3000/tcp
```

---

### Step 5: Access the Application

**Frontend (React App):**
- URL: http://localhost:3000
- You'll see the login page

**Backend API (FastAPI):**
- API Docs: http://localhost:8001/docs
- Health Check: http://localhost:8001/api/health

**PostgreSQL Database:**
- Host: localhost
- Port: 5432
- Database: crm_db
- Username: crm_user
- Password: crm_password_123

---

### Step 6: Test the Backend API

Open http://localhost:8001/docs in your browser.

You'll see the Swagger UI with all API endpoints.

**Test health endpoint:**
```bash
curl http://localhost:8001/api/health
```

Expected response:
```json
{"status":"healthy","service":"crm-platform"}
```

---

### Step 7: Login with Google OAuth (Demo Mode)

1. Open http://localhost:3000
2. Click "View Demo Dashboard" button
3. You'll see the dashboard with demo data

**Note:** Full Google OAuth requires:
- Configuring redirect URLs in Google Console
- For local testing, the demo mode works without OAuth

---

## Database Management

### View Database Tables

```bash
# Connect to PostgreSQL
docker exec -it crm-postgres-local psql -U crm_user -d crm_db

# List all tables
\dt

# View table structure
\d contacts

# Query data
SELECT * FROM users LIMIT 5;

# Exit
\q
```

### Run Migrations

Migrations run automatically on startup. To run manually:

```bash
# Enter backend container
docker exec -it crm-backend-local bash

# Run migrations
alembic upgrade head

# Create new migration (after model changes)
alembic revision --autogenerate -m "description"

# Exit
exit
```

---

## Development Workflow

### Making Code Changes

**Backend Changes:**
1. Edit files in `/app/backend/`
2. Backend auto-reloads (--reload flag)
3. Changes reflect immediately

**Frontend Changes:**
1. Edit files in `/app/frontend/src/`
2. React hot-reload updates browser automatically
3. No restart needed

**Database Model Changes:**
1. Edit models in `/app/backend/app/models/`
2. Create migration:
   ```bash
   docker exec -it crm-backend-local alembic revision --autogenerate -m "add new field"
   ```
3. Apply migration:
   ```bash
   docker exec -it crm-backend-local alembic upgrade head
   ```

### View Logs

```bash
# All services
docker-compose -f docker-compose.local.yml logs -f

# Specific service
docker-compose -f docker-compose.local.yml logs -f backend
docker-compose -f docker-compose.local.yml logs -f frontend
docker-compose -f docker-compose.local.yml logs -f postgres
```

---

## Common Commands

### Start Services (after first build)

```bash
docker-compose -f docker-compose.local.yml up
```

### Start in Background

```bash
docker-compose -f docker-compose.local.yml up -d
```

### Stop Services

```bash
docker-compose -f docker-compose.local.yml down
```

### Stop and Remove Data (⚠️ Deletes database)

```bash
docker-compose -f docker-compose.local.yml down -v
```

### Rebuild After Dependency Changes

```bash
# If you added packages to requirements.txt or package.json
docker-compose -f docker-compose.local.yml up --build
```

### Restart Specific Service

```bash
docker-compose -f docker-compose.local.yml restart backend
docker-compose -f docker-compose.local.yml restart frontend
```

---

## Troubleshooting

### Issue: Port Already in Use

**Error:** `Bind for 0.0.0.0:5432 failed: port is already allocated`

**Solution:**
```bash
# Find process using the port
lsof -i :5432  # Mac/Linux
netstat -ano | findstr :5432  # Windows

# Kill the process or change port in docker-compose.local.yml
```

### Issue: Backend Won't Start

**Check logs:**
```bash
docker-compose -f docker-compose.local.yml logs backend
```

**Common causes:**
1. PostgreSQL not ready → Wait for health check
2. Migration failed → Check migration files
3. Port 8001 in use → Change port

### Issue: Frontend Shows Connection Error

**Check:**
1. Backend is running: `curl http://localhost:8001/api/health`
2. REACT_APP_BACKEND_URL is correct in docker-compose
3. CORS settings allow localhost:3000

### Issue: Database Connection Failed

**Verify PostgreSQL:**
```bash
# Check if container is running
docker ps | grep postgres

# Check health
docker exec crm-postgres-local pg_isready -U crm_user

# Test connection
docker exec -it crm-postgres-local psql -U crm_user -d crm_db -c "SELECT 1;"
```

### Issue: Migration Errors

**Reset database (⚠️ deletes all data):**
```bash
# Stop services
docker-compose -f docker-compose.local.yml down -v

# Start fresh
docker-compose -f docker-compose.local.yml up --build
```

---

## Testing the Full Stack

### 1. Test Backend API

```bash
# Health check
curl http://localhost:8001/api/health

# Get contacts (will be empty initially)
curl http://localhost:8001/api/contacts
```

### 2. Create Test Data

**Via API:**
```bash
# First, you need to authenticate
# For demo, we'll create a test user directly in database

docker exec -it crm-postgres-local psql -U crm_user -d crm_db << EOF
-- Create test tenant
INSERT INTO tenants (id, name, slug, is_active) 
VALUES (gen_random_uuid(), 'Test Org', 'test-org', true);

-- Create test user
INSERT INTO users (id, tenant_id, email, name, is_active)
SELECT gen_random_uuid(), id, 'test@example.com', 'Test User', true
FROM tenants WHERE slug = 'test-org';

-- View created data
SELECT * FROM tenants;
SELECT * FROM users;
EOF
```

### 3. Test Frontend

1. Open http://localhost:3000
2. Click "View Demo Dashboard"
3. Navigate through tabs: Dashboard → Contacts → Audit
4. Verify data loads correctly

---

## Environment Variables Reference

### Backend (.env or docker-compose)

```env
DATABASE_URL=postgresql+asyncpg://crm_user:crm_password_123@postgres:5432/crm_db
SECRET_KEY=local-dev-secret-key-change-in-production-min-32-chars
CORS_ORIGINS=http://localhost:3000,http://localhost
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080
```

### Frontend (.env or docker-compose)

```env
REACT_APP_BACKEND_URL=http://localhost:8001
```

---

## Next Steps

1. ✅ Verify all 3 containers are running
2. ✅ Test backend API at http://localhost:8001/docs
3. ✅ Test frontend at http://localhost:3000
4. ✅ Create test data via database or API
5. ✅ Test CRUD operations
6. 📖 Read `MODULE_REPLICATION_GUIDE.md` to add more modules
7. 📖 Read `WEBHOOK_INTEGRATION_GUIDE.md` for automation
8. 🚀 Deploy to GCP VM using `DEPLOYMENT.md`

---

## Production Differences

When deploying to GCP VM:
1. Use `docker-compose.yml` (not `docker-compose.local.yml`)
2. Change SECRET_KEY to secure random string
3. Update CORS_ORIGINS to your domain
4. Use strong PostgreSQL password
5. Configure SSL/HTTPS
6. Setup automated backups

---

## Quick Reference

| Service | Local URL | Container Name |
|---------|-----------|----------------|
| Frontend | http://localhost:3000 | crm-frontend-local |
| Backend API | http://localhost:8001 | crm-backend-local |
| API Docs | http://localhost:8001/docs | - |
| PostgreSQL | localhost:5432 | crm-postgres-local |

**Database Credentials:**
- User: crm_user
- Password: crm_password_123
- Database: crm_db

---

## Support

If you encounter issues:
1. Check logs: `docker-compose -f docker-compose.local.yml logs -f`
2. Verify all containers: `docker-compose -f docker-compose.local.yml ps`
3. Restart services: `docker-compose -f docker-compose.local.yml restart`
4. Clean start: `docker-compose -f docker-compose.local.yml down -v && docker-compose -f docker-compose.local.yml up --build`

---

**You're all set! Start with:** `docker-compose -f docker-compose.local.yml up --build`