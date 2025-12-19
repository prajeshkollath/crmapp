# Quick Reference Card

---

## 🚀 Start Locally (3 Commands)

```bash
cd /app
docker-compose -f docker-compose.local.yml up --build
# Open: http://localhost:3000
```

---

## 🌐 URLs

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8001 |
| API Docs | http://localhost:8001/docs |
| PostgreSQL | localhost:5432 |

---

## 🔑 Credentials

**PostgreSQL:**
- User: `crm_user`
- Password: `crm_password_123`
- Database: `crm_db`

---

## 🛠️ Common Commands

```bash
# Start
docker-compose -f docker-compose.local.yml up

# Start (rebuild)
docker-compose -f docker-compose.local.yml up --build

# Start (background)
docker-compose -f docker-compose.local.yml up -d

# Stop
docker-compose -f docker-compose.local.yml down

# Stop (remove data)
docker-compose -f docker-compose.local.yml down -v

# Logs
docker-compose -f docker-compose.local.yml logs -f

# Status
docker-compose -f docker-compose.local.yml ps
```

---

## 🔍 Database Access

```bash
# Connect
docker exec -it crm-postgres-local psql -U crm_user -d crm_db

# View tables
\dt

# Query
SELECT * FROM users;

# Exit
\q
```

---

## 🐛 Quick Fixes

**Port in use:**
```bash
lsof -i :5432  # Find process
kill -9 <PID>  # Kill it
```

**Won't start:**
```bash
docker-compose -f docker-compose.local.yml down -v
docker-compose -f docker-compose.local.yml up --build
```

**Check health:**
```bash
curl http://localhost:8001/api/health
docker exec crm-postgres-local pg_isready -U crm_user
```

---

## 📚 Documentation

| File | Purpose |
|------|---------|
| `README_LOCAL_SETUP.md` | **Start here** |
| `STEPS_TO_RUN_LOCALLY.md` | Step-by-step guide |
| `SETUP_LOCAL_DOCKER.md` | Detailed setup |
| `MODULE_REPLICATION_GUIDE.md` | Add modules |
| `WEBHOOK_INTEGRATION_GUIDE.md` | Automation |
| `DEPLOYMENT.md` | Production |

---

## 🎯 Quick Tests

```bash
# Backend health
curl http://localhost:8001/api/health

# Database
docker exec crm-postgres-local psql -U crm_user -d crm_db -c "SELECT 1;"

# Frontend
open http://localhost:3000
```

---

## 📦 Container Names

- `crm-postgres-local`
- `crm-backend-local`
- `crm-frontend-local`

---

## 🔧 File Structure

```
/app/
├── docker-compose.local.yml  ← Local setup
├── backend/                  ← FastAPI code
├── frontend/                 ← React code
└── *.md                      ← Documentation
```

---

## ⚡ Development

**Backend auto-reloads** on file changes
**Frontend hot-reloads** in browser

Edit files in:
- `backend/app/`
- `frontend/src/`

Changes reflect immediately.

---

## 🎓 Learning Path

1. Start: `README_LOCAL_SETUP.md`
2. Detailed: `SETUP_LOCAL_DOCKER.md`
3. Add modules: `MODULE_REPLICATION_GUIDE.md`
4. Automation: `WEBHOOK_INTEGRATION_GUIDE.md`
5. Deploy: `DEPLOYMENT.md`

---

**That's it! Keep this handy.** 📌
