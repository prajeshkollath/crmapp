# 🎯 START HERE - CRM Platform Local Setup

## ✅ Prerequisites

1. **Docker Desktop** installed and running
2. You're in the `/app` directory
3. Ports 3000, 5432, 8001 are available

---

## 🚀 Quick Start (One Command)

```bash
docker-compose -f docker-compose.local.yml up --build
```

**Alternative** (if above doesn't work):
```bash
docker compose -f docker-compose.local.yml up --build
```

---

## ⏱️ Wait Time

- **First build**: 3-5 minutes
- **Subsequent starts**: 30 seconds

---

## ✅ Success Indicators

You'll see these messages:

```
crm-postgres-local    | database system is ready to accept connections
crm-backend-local     | INFO: Uvicorn running on http://0.0.0.0:8001
crm-frontend-local    | webpack compiled successfully
```

---

## 🌐 Access Application

Once all services are running:

| Service | URL |
|---------|-----|
| **Frontend** | http://localhost:3000 |
| **Backend API** | http://localhost:8001 |
| **API Docs** | http://localhost:8001/docs |

Click **"View Demo Dashboard"** at http://localhost:3000

---

## 🐛 Common Issues

### Issue 1: "Port already in use"

```bash
# Find process using port
lsof -i :5432
lsof -i :3000
lsof -i :8001

# Kill it
kill -9 <PID>
```

### Issue 2: "docker-compose: command not found"

Use `docker compose` (with space):
```bash
docker compose -f docker-compose.local.yml up --build
```

### Issue 3: "Cannot connect to Docker daemon"

1. Start Docker Desktop application
2. Wait for green indicator
3. Try again

### Issue 4: Build fails with "file not found"

Check you're in the right directory:
```bash
pwd
# Should show: /app

ls -la docker-compose.local.yml
# Should exist
```

If issues persist, see `FIXES_APPLIED.md` for detailed troubleshooting.

---

## 🛑 Stop Services

Press `Ctrl+C` in the terminal where docker-compose is running.

Or in a new terminal:
```bash
docker-compose -f docker-compose.local.yml down
```

---

## 📚 Next Steps

After successful startup:

1. ✅ Click "View Demo Dashboard" at http://localhost:3000
2. ✅ Explore Dashboard, Contacts, Audit tabs
3. ✅ Check API docs at http://localhost:8001/docs
4. 📖 Read `STEPS_TO_RUN_LOCALLY.md` for detailed guide
5. 📖 Read `MODULE_REPLICATION_GUIDE.md` to add features

---

## 📁 Key Files

- `docker-compose.local.yml` - Main config
- `Dockerfile.backend` - Backend image
- `Dockerfile.frontend.local` - Frontend image
- `README_LOCAL_SETUP.md` - Quick start guide
- `STEPS_TO_RUN_LOCALLY.md` - Detailed walkthrough
- `FIXES_APPLIED.md` - Build issue solutions

---

## 🆘 Need Help?

1. Check `FIXES_APPLIED.md` for build issues
2. Check `SETUP_LOCAL_DOCKER.md` for detailed troubleshooting
3. View logs: `docker-compose -f docker-compose.local.yml logs -f`

---

**Ready?** Run this now:

```bash
cd /app && docker-compose -f docker-compose.local.yml up --build
```

Then open: http://localhost:3000 🚀
