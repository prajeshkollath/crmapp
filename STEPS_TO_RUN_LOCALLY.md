# 🚀 Step-by-Step: Run CRM Platform Locally

Follow these exact steps to get the CRM platform running on your Docker Desktop.

---

## ✅ Prerequisites Check

Before starting, verify:

1. **Docker Desktop Installed**
   ```bash
   docker --version
   # Should show: Docker version 20.x or higher
   
   docker-compose --version
   # Should show: docker-compose version 1.29.x or higher
   ```

2. **Docker Desktop Running**
   - Check system tray (Windows) or menu bar (Mac)
   - Green indicator means running
   - If not running, start Docker Desktop app

3. **Ports Available**
   ```bash
   # Check if ports 3000, 5432, 8001 are free
   # Mac/Linux:
   lsof -i :3000
   lsof -i :5432
   lsof -i :8001
   
   # Windows:
   netstat -ano | findstr :3000
   netstat -ano | findstr :5432
   netstat -ano | findstr :8001
   ```
   
   If any port is in use, either:
   - Stop the application using that port
   - Or modify `docker-compose.local.yml` to use different ports

---

## 📥 Step 1: Get the Code

If you already have the code in `/app`, skip to Step 2.

Otherwise, copy/download the entire `/app` directory to your local machine.

```bash
# Navigate to the project directory
cd /app
```

---

## 🔍 Step 2: Verify File Structure

```bash
ls -la

# You should see:
# - docker-compose.local.yml  ← Main file for local setup
# - backend/                  ← Backend code
# - frontend/                 ← Frontend code
# - README_LOCAL_SETUP.md     ← Quick start guide
# - START_LOCAL.sh            ← Start script
```

If files are missing, something went wrong with the download/copy.

---

## 🏗️ Step 3: Build and Start Services

### Option A: Using Docker Compose Directly (Recommended)

```bash
docker-compose -f docker-compose.local.yml up --build
```

### Option B: Using Start Script

```bash
chmod +x START_LOCAL.sh
./START_LOCAL.sh
```

---

## ⏳ Step 4: Wait for Startup

You'll see logs scrolling. Wait for these messages:

```
✅ PostgreSQL logs:
crm-postgres-local | database system is ready to accept connections

✅ Backend logs:
crm-backend-local | INFO:     Application startup complete
crm-backend-local | INFO:     Uvicorn running on http://0.0.0.0:8001

✅ Frontend logs:
crm-frontend-local | webpack compiled successfully
crm-frontend-local | Compiled successfully!
```

**First startup takes 3-5 minutes.** Subsequent startups take 30 seconds.

---

## 🧪 Step 5: Test Each Service

### Test 1: PostgreSQL

Open a **new terminal** (keep docker-compose running in the first one):

```bash
docker exec -it crm-postgres-local psql -U crm_user -d crm_db -c "SELECT 1;"
```

**Expected output:**
```
 ?column? 
----------
        1
(1 row)
```

✅ PostgreSQL is working!

### Test 2: Backend API

```bash
curl http://localhost:8001/api/health
```

**Expected output:**
```json
{"status":"healthy","service":"crm-platform"}
```

✅ Backend is working!

### Test 3: Backend Database Connection

```bash
curl http://localhost:8001/api/contacts
```

**Expected output:**
```json
{"total":0,"page":1,"page_size":20,"contacts":[]}
```

✅ Backend connected to PostgreSQL!

### Test 4: Frontend

Open your browser and go to:
```
http://localhost:3000
```

You should see the login page with:
- "CRM Platform" title
- "View Demo Dashboard" button
- Modern purple/blue gradient design

✅ Frontend is working!

---

## 🎉 Step 6: Explore the Application

### 6.1: Login

Click **"View Demo Dashboard"** button

You'll be taken to the dashboard.

### 6.2: Dashboard

You should see:
- Welcome message
- 4 stat cards (Contacts, Deals, Tasks, Revenue)
- Quick action buttons
- Navigation tabs at top

### 6.3: Contacts

Click **"Contacts"** tab

You'll see:
- Empty contacts table (or demo contacts)
- "Add Contact" button
- Search and filter options

### 6.4: Audit Logs

Click **"Audit"** tab

You'll see:
- Activity timeline
- CREATE/UPDATE/DELETE actions
- Timestamps

---

## 📊 Step 7: View API Documentation

Open your browser:
```
http://localhost:8001/docs
```

You'll see **Swagger UI** with all API endpoints:

- `/api/auth/` - Authentication
- `/api/contacts/` - Contacts CRUD
- `/api/webhooks/` - Webhook management
- `/api/audit/logs` - Audit logs

Try testing an endpoint:
1. Click on `/api/health`
2. Click "Try it out"
3. Click "Execute"
4. See the response

---

## 🔧 Step 8: Access Database Directly (Optional)

### Connect to PostgreSQL

```bash
docker exec -it crm-postgres-local psql -U crm_user -d crm_db
```

### View Tables

```sql
\dt

-- You should see:
-- tenants
-- users
-- user_sessions
-- roles
-- groups
-- permissions
-- user_roles
-- user_groups
-- role_permissions
-- group_permissions
-- contacts
-- audit_logs
-- webhook_subscriptions
-- integration_events
```

### Query Data

```sql
-- View all tables
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- Check migrations
SELECT * FROM alembic_version;

-- Exit
\q
```

---

## 🛑 Step 9: Stop Services

When you're done testing:

### Option 1: Stop from Terminal

In the terminal where docker-compose is running:
- Press `Ctrl+C`
- Wait for services to stop gracefully

### Option 2: Stop from Another Terminal

```bash
docker-compose -f docker-compose.local.yml down
```

### Option 3: Stop and Remove Data

⚠️ **Warning:** This deletes the database!

```bash
docker-compose -f docker-compose.local.yml down -v
```

---

## 🔄 Step 10: Restart Services (Next Time)

Services start much faster after first build:

```bash
docker-compose -f docker-compose.local.yml up
```

No `--build` flag needed unless you:
- Changed `requirements.txt` (backend dependencies)
- Changed `package.json` (frontend dependencies)
- Changed Dockerfile

---

## 📝 Step 11: Check Logs (If Issues)

### View All Logs
```bash
docker-compose -f docker-compose.local.yml logs -f
```

### View Specific Service
```bash
docker-compose -f docker-compose.local.yml logs -f backend
docker-compose -f docker-compose.local.yml logs -f frontend
docker-compose -f docker-compose.local.yml logs -f postgres
```

### Recent Logs Only
```bash
docker-compose -f docker-compose.local.yml logs --tail=50 backend
```

---

## ✅ Success Checklist

After completing all steps, verify:

- [ ] Docker Desktop is running
- [ ] 3 containers are up: postgres, backend, frontend
- [ ] PostgreSQL responds to queries
- [ ] Backend API returns health check
- [ ] Frontend loads at http://localhost:3000
- [ ] Can navigate between Dashboard, Contacts, Audit tabs
- [ ] API documentation loads at http://localhost:8001/docs
- [ ] No errors in docker-compose logs

---

## 🐛 Troubleshooting

### Issue: "Port already in use"

**Solution:**
```bash
# Find what's using the port
lsof -i :5432  # or :3000 or :8001

# Kill the process
kill -9 <PID>

# Or change port in docker-compose.local.yml
```

### Issue: "Cannot connect to Docker daemon"

**Solution:**
1. Open Docker Desktop app
2. Wait for it to fully start
3. Check system tray/menu bar for green status
4. Try again

### Issue: Backend won't start

**Check logs:**
```bash
docker-compose -f docker-compose.local.yml logs backend
```

**Common fixes:**
```bash
# Rebuild backend
docker-compose -f docker-compose.local.yml up --build backend

# Reset everything
docker-compose -f docker-compose.local.yml down -v
docker-compose -f docker-compose.local.yml up --build
```

### Issue: Frontend shows blank page

**Check:**
1. Backend is running: `curl http://localhost:8001/api/health`
2. Frontend logs: `docker-compose -f docker-compose.local.yml logs frontend`
3. Browser console (F12) for errors

**Fix:**
```bash
# Rebuild frontend
docker-compose -f docker-compose.local.yml up --build frontend
```

### Issue: Database connection error

**Check PostgreSQL health:**
```bash
docker exec crm-postgres-local pg_isready -U crm_user
```

**Wait longer:**
PostgreSQL takes 10-30 seconds to be ready. Backend retries automatically.

### Issue: Migration errors

**Reset database:**
```bash
docker-compose -f docker-compose.local.yml down -v
docker-compose -f docker-compose.local.yml up --build
```

---

## 🎯 Next Steps

Once everything is running:

1. **Create Test Data**
   - Via API at http://localhost:8001/docs
   - Or directly in database

2. **Test CRUD Operations**
   - Create a contact
   - View contacts list
   - Check audit logs

3. **Explore Code**
   - Backend: `/app/backend/app/`
   - Frontend: `/app/frontend/src/App.js`

4. **Add New Module**
   - Follow `MODULE_REPLICATION_GUIDE.md`
   - Add Companies or Deals

5. **Setup Automation**
   - Read `WEBHOOK_INTEGRATION_GUIDE.md`
   - Install n8n or Activepieces

6. **Deploy to Production**
   - Follow `DEPLOYMENT.md`
   - Deploy to GCP VM

---

## 📞 Need Help?

1. **Check logs:** `docker-compose -f docker-compose.local.yml logs -f`
2. **Verify containers:** `docker-compose -f docker-compose.local.yml ps`
3. **Clean restart:** `docker-compose -f docker-compose.local.yml down -v && docker-compose -f docker-compose.local.yml up --build`
4. **Read detailed guide:** `SETUP_LOCAL_DOCKER.md`

---

## 🎓 Understanding What Just Happened

When you ran `docker-compose up`:

1. **Docker built 3 images:**
   - PostgreSQL (official image)
   - Backend (Python + FastAPI + your code)
   - Frontend (Node + React + your code)

2. **Docker created 3 containers:**
   - crm-postgres-local (port 5432)
   - crm-backend-local (port 8001)
   - crm-frontend-local (port 3000)

3. **Docker created 1 network:**
   - crm-network (connects all containers)

4. **Docker created 1 volume:**
   - postgres_data_local (persists database)

5. **Backend ran migrations:**
   - Created all database tables
   - Set up schema

6. **Services started:**
   - PostgreSQL ready
   - Backend API running
   - Frontend serving UI

7. **You accessed:**
   - Frontend: http://localhost:3000
   - Backend: http://localhost:8001
   - Database: localhost:5432

---

## 🚀 You're Done!

Your CRM platform is now running locally. The full stack:
- ✅ PostgreSQL database
- ✅ FastAPI backend with multi-tenancy, RBAC, audit logs
- ✅ React frontend with modern UI
- ✅ All running in Docker containers
- ✅ Ready for development and testing

**Enjoy building!** 🎉
