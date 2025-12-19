# Fixes Applied for Docker Build Issues

## Problem
The error you encountered:
```
failed to compute cache key: "/frontend/yarn.lock": not found
```

This happened because the Docker build context was incorrect.

---

## What Was Fixed

### 1. Changed Build Context

**Before (Incorrect):**
```yaml
frontend:
  build:
    context: .                    # Root directory
    dockerfile: Dockerfile.frontend.local
```

**After (Correct):**
```yaml
frontend:
  build:
    context: ./frontend           # Frontend directory as context
    dockerfile: ../Dockerfile.frontend.local
```

### 2. Updated Dockerfile.frontend.local

**Before:**
```dockerfile
COPY frontend/package.json ./
COPY frontend/yarn.lock ./
```

**After:**
```dockerfile
COPY package.json ./
COPY yarn.lock ./
```

Since the build context is now `./frontend`, we don't need the `frontend/` prefix.

### 3. Applied Same Fix to Backend

**docker-compose.local.yml:**
```yaml
backend:
  build:
    context: ./backend
    dockerfile: ../Dockerfile.backend
```

**Dockerfile.backend:**
```dockerfile
COPY requirements.txt .
COPY . .
```

---

## How to Run Now

```bash
cd /app

# Build and start all services
docker-compose -f docker-compose.local.yml up --build
```

---

## If You Still Get Errors

### Error: "docker-compose: command not found"

Try with `docker compose` (space instead of hyphen):
```bash
docker compose -f docker-compose.local.yml up --build
```

### Error: Port already in use

```bash
# Find what's using the port
lsof -i :5432
lsof -i :3000
lsof -i :8001

# Kill the process
kill -9 <PID>
```

### Error: Cannot connect to Docker daemon

1. Start Docker Desktop application
2. Wait for it to fully start (green indicator)
3. Try again

### Error: "No such file or directory"

Make sure you're in the `/app` directory:
```bash
pwd
# Should show: /app

ls -la
# Should show: docker-compose.local.yml, backend/, frontend/
```

---

## Verify Files Exist

Before building, verify:

```bash
ls -la frontend/package.json
ls -la frontend/yarn.lock
ls -la backend/requirements.txt
ls -la Dockerfile.backend
ls -la Dockerfile.frontend.local
ls -la docker-compose.local.yml
```

All should exist without errors.

---

## Clean Start (If Needed)

If you've tried building before and it failed:

```bash
# Remove old containers and images
docker-compose -f docker-compose.local.yml down -v
docker system prune -a

# Start fresh
docker-compose -f docker-compose.local.yml up --build
```

---

## What Happens During Build

1. **PostgreSQL**: Downloads official image (no build needed)
2. **Backend**: 
   - Context: `./backend`
   - Copies `requirements.txt`
   - Installs Python packages
   - Copies all backend code
   - Takes ~2-3 minutes

3. **Frontend**:
   - Context: `./frontend`
   - Copies `package.json` and `yarn.lock`
   - Installs Node packages (`yarn install`)
   - Copies all frontend code
   - Takes ~3-5 minutes

---

## Expected Output

You should see:
```
[+] Building 180.2s (25/25) FINISHED
 => [postgres internal] load ...
 => [backend 1/6] FROM python:3.11-slim
 => [backend 2/6] WORKDIR /app
 => [backend 3/6] RUN apt-get update ...
 => [backend 4/6] COPY requirements.txt .
 => [backend 5/6] RUN pip install ...
 => [backend 6/6] COPY . .
 => [frontend 1/6] FROM node:18-alpine
 => [frontend 2/6] WORKDIR /app
 => [frontend 3/6] COPY package.json ./
 => [frontend 4/6] COPY yarn.lock ./
 => [frontend 5/6] RUN yarn install
 => [frontend 6/6] COPY . .
```

Then services start:
```
crm-postgres-local    | database system is ready
crm-backend-local     | INFO: Uvicorn running on http://0.0.0.0:8001
crm-frontend-local    | Compiled successfully!
```

---

## After Successful Build

1. **Open browser**: http://localhost:3000
2. **Click**: "View Demo Dashboard"
3. **Verify**: Dashboard, Contacts, Audit tabs all work
4. **Check API**: http://localhost:8001/docs

---

## Files Modified

1. `docker-compose.local.yml` - Fixed build contexts
2. `Dockerfile.backend` - Updated COPY paths
3. `Dockerfile.frontend.local` - Updated COPY paths

All other files remain unchanged.

---

## Summary

**Root cause**: Build context was set to root directory (`.`), but Dockerfiles were trying to copy from subdirectories that weren't in the context.

**Solution**: Changed build context to the specific directory (`./backend` or `./frontend`) and updated COPY commands accordingly.

**Result**: Docker can now find all files during build.

---

Try building again with:
```bash
docker-compose -f docker-compose.local.yml up --build
```

It should work now! 🚀
