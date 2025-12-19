# Files Overview - CRM Platform

Complete list of all files and their purposes.

---

## 📁 Core Application Files

### Backend (FastAPI + PostgreSQL)

```
backend/
├── server.py                          # Main FastAPI application
├── requirements.txt                   # Python dependencies
├── .env                              # Environment variables (configure for prod)
├── alembic.ini                       # Alembic migration config
├── alembic/
│   ├── env.py                        # Migration environment setup
│   ├── script.py.mako                # Migration template
│   └── versions/                     # Database migrations (auto-generated)
└── app/
    ├── core/
    │   ├── config.py                 # Settings management
    │   ├── database.py               # Database connection
    │   ├── security.py               # JWT, hashing, webhooks signatures
    │   ├── dependencies.py           # FastAPI dependencies (auth, RBAC)
    │   └── middleware.py             # Request context middleware
    ├── models/
    │   ├── base.py                   # SQLAlchemy base
    │   ├── tenant.py                 # Tenant model
    │   ├── user.py                   # User & UserSession models
    │   ├── role.py                   # Role & Group models
    │   ├── permission.py             # Permission model
    │   ├── contact.py                # Contact model (REFERENCE MODULE)
    │   ├── audit.py                  # AuditLog model
    │   └── webhook.py                # Webhook models
    ├── schemas/
    │   ├── user.py                   # User Pydantic schemas
    │   ├── tenant.py                 # Tenant Pydantic schemas
    │   ├── contact.py                # Contact Pydantic schemas
    │   ├── auth.py                   # Auth Pydantic schemas
    │   ├── webhook.py                # Webhook Pydantic schemas
    │   └── audit.py                  # Audit Pydantic schemas
    ├── repositories/
    │   └── contact_repository.py     # Contact data access (REFERENCE)
    ├── services/
    │   ├── audit_service.py          # Audit logging service
    │   ├── webhook_service.py        # Webhook emission service
    │   └── contact_service.py        # Contact business logic (REFERENCE)
    └── routers/
        ├── auth.py                   # Authentication endpoints
        ├── contacts.py               # Contact CRUD endpoints (REFERENCE)
        ├── webhooks.py               # Webhook management endpoints
        └── audit.py                  # Audit log endpoints
```

### Frontend (React)

```
frontend/
├── package.json                      # Node dependencies
├── .env                              # Frontend environment variables
├── tailwind.config.js                # Tailwind CSS config
├── postcss.config.js                 # PostCSS config
├── nginx.conf                        # Nginx config (for production)
├── public/                           # Static assets
└── src/
    ├── index.js                      # React entry point
    ├── App.js                        # Main React component with routing
    ├── App.css                       # Component styles
    ├── index.css                     # Global styles + Tailwind
    └── components/ui/                # Shadcn/Radix UI components (pre-installed)
```

---

## 🐳 Docker Files

### Local Development

| File | Purpose |
|------|---------|
| `docker-compose.local.yml` | **Local Docker setup** (3 services: postgres, backend, frontend) |
| `Dockerfile.backend` | Backend Docker image (production) |
| `Dockerfile.frontend.local` | Frontend Docker image (dev mode with hot-reload) |
| `.env.local` | Environment variables reference for local |
| `START_LOCAL.sh` | Quick start script for local setup |

### Production Deployment

| File | Purpose |
|------|---------|
| `docker-compose.yml` | Production Docker setup (for GCP VM) |
| `Dockerfile.backend` | Backend Docker image |
| `Dockerfile.frontend` | Frontend Docker image (Nginx) |
| `frontend/nginx.conf` | Nginx reverse proxy config |

---

## 📚 Documentation Files

### Getting Started

| File | What It Covers | Read When |
|------|----------------|-----------|
| `README_LOCAL_SETUP.md` | **Quick start for local Docker** | Start here |
| `SETUP_LOCAL_DOCKER.md` | Detailed local setup, troubleshooting, development | After quick start |
| `README.md` | Complete platform overview, architecture, API docs | After local setup works |

### Development Guides

| File | What It Covers | Read When |
|------|----------------|-----------|
| `MODULE_REPLICATION_GUIDE.md` | How to add new modules (Companies, Deals, etc.) | Want to add features |
| `WEBHOOK_INTEGRATION_GUIDE.md` | n8n/Activepieces integration | Want automation |
| `auth_testing.md` | Testing authentication flows | Testing auth |

### Deployment

| File | What It Covers | Read When |
|------|----------------|-----------|
| `DEPLOYMENT.md` | Deploy to GCP VM with Docker | Ready for production |

### Reference

| File | What It Covers | Read When |
|------|----------------|-----------|
| `STATUS.md` | Complete feature list, what's implemented | Quick reference |
| `FILES_OVERVIEW.md` | This file - all files explained | Understanding structure |

---

## 🎯 Which Files to Start With

### Local Development (Docker Desktop)

**Order to read:**
1. `README_LOCAL_SETUP.md` - Quick start (5 min)
2. `SETUP_LOCAL_DOCKER.md` - Detailed setup (15 min)
3. `README.md` - Full documentation (30 min)

**Files to configure:**
- None! Just run: `docker-compose -f docker-compose.local.yml up --build`

### Adding New Modules

**Read:**
1. `MODULE_REPLICATION_GUIDE.md` - Step-by-step guide

**Files to edit:**
- Copy pattern from `backend/app/models/contact.py`
- Copy pattern from `backend/app/repositories/contact_repository.py`
- Copy pattern from `backend/app/services/contact_service.py`
- Copy pattern from `backend/app/routers/contacts.py`

### Setting Up Automation

**Read:**
1. `WEBHOOK_INTEGRATION_GUIDE.md` - n8n/Activepieces setup

**No files to edit** - Configure via API or database.

### Deploying to Production

**Read:**
1. `DEPLOYMENT.md` - GCP VM deployment

**Files to configure:**
- `backend/.env` - Update DATABASE_URL, SECRET_KEY, CORS_ORIGINS
- `docker-compose.yml` - Update PostgreSQL password

---

## 🔧 Files You'll Rarely Touch

### Auto-Generated Files
- `backend/alembic/versions/*` - Database migrations (created by Alembic)
- `frontend/build/*` - Production build (created by `yarn build`)

### Configuration Files (Usually Don't Change)
- `backend/alembic.ini` - Alembic config
- `backend/alembic/script.py.mako` - Migration template
- `frontend/tailwind.config.js` - Tailwind settings
- `frontend/postcss.config.js` - PostCSS settings

### Core Files (Framework Setup)
- `backend/app/core/*` - Core utilities, rarely modified
- `backend/app/models/base.py` - SQLAlchemy base

---

## 📦 Dependencies Files

### Backend
- `backend/requirements.txt` - Python packages
  - FastAPI, SQLAlchemy, asyncpg, Alembic, etc.

### Frontend
- `frontend/package.json` - Node packages
  - React, React Router, Tailwind, Radix UI, Chart.js

---

## 🗂️ Directory Structure Summary

```
/app/
├── 📘 Documentation (8 files)
│   ├── README_LOCAL_SETUP.md       ⭐ Start here
│   ├── SETUP_LOCAL_DOCKER.md       📖 Detailed local setup
│   ├── README.md                   📚 Complete docs
│   ├── MODULE_REPLICATION_GUIDE.md 🔧 Add modules
│   ├── WEBHOOK_INTEGRATION_GUIDE.md 🔗 Automation
│   ├── DEPLOYMENT.md               🚀 Production
│   ├── STATUS.md                   📊 Features list
│   └── FILES_OVERVIEW.md           📁 This file
│
├── 🐳 Docker (5 files)
│   ├── docker-compose.local.yml    ⭐ Local setup
│   ├── docker-compose.yml          🚀 Production
│   ├── Dockerfile.backend
│   ├── Dockerfile.frontend
│   ├── Dockerfile.frontend.local
│   └── START_LOCAL.sh              🏃 Quick start script
│
├── 🔧 Backend (40+ files)
│   └── backend/
│       ├── server.py               ⭐ Main app
│       ├── requirements.txt
│       ├── .env
│       └── app/                    📦 All backend code
│
└── 🎨 Frontend (10+ files)
    └── frontend/
        ├── src/App.js              ⭐ Main component
        ├── package.json
        └── .env
```

---

## 🎓 Learning Path

### Beginner (Just Want to Run It)
1. Read `README_LOCAL_SETUP.md`
2. Run `docker-compose -f docker-compose.local.yml up --build`
3. Open http://localhost:3000

### Intermediate (Want to Understand)
1. Read `SETUP_LOCAL_DOCKER.md`
2. Read `README.md`
3. Explore `backend/app/routers/contacts.py` (API)
4. Explore `frontend/src/App.js` (UI)

### Advanced (Want to Build)
1. Read `MODULE_REPLICATION_GUIDE.md`
2. Add a new module (Companies)
3. Read `WEBHOOK_INTEGRATION_GUIDE.md`
4. Setup n8n automation

### Expert (Want to Deploy)
1. Read `DEPLOYMENT.md`
2. Deploy to GCP VM
3. Setup SSL, backups, monitoring

---

## 🔍 Quick File Finder

**Need to...**
- **Start locally?** → `README_LOCAL_SETUP.md`
- **Fix local issues?** → `SETUP_LOCAL_DOCKER.md`
- **Add Companies module?** → `MODULE_REPLICATION_GUIDE.md`
- **Setup webhooks?** → `WEBHOOK_INTEGRATION_GUIDE.md`
- **Deploy to GCP?** → `DEPLOYMENT.md`
- **See all features?** → `STATUS.md`
- **Understand files?** → `FILES_OVERVIEW.md` (this file)
- **Change API endpoints?** → `backend/app/routers/`
- **Change UI?** → `frontend/src/App.js`
- **Change database?** → `backend/app/models/`
- **Change business logic?** → `backend/app/services/`

---

**Total Files:** ~80 (40 backend, 15 frontend, 10 Docker, 8 docs, 7 config)

**Core Files to Understand:** 10-15 files

**Files You'll Edit Often:** 5-10 files

**Everything else:** Configuration, dependencies, auto-generated
