# Multi-Tenant CRM Platform

## Production-Ready Features

### Backend (Python FastAPI)
- ✅ **Multi-tenancy**: Strict tenant isolation at DB + API layer
- ✅ **Authentication**: Google OAuth (OpenID Connect) via Emergent
- ✅ **RBAC**: Users, Roles, Groups, Permissions enforced per endpoint
- ✅ **Audit Logs**: Automatic CRUD tracking with before/after data
- ✅ **PostgreSQL**: SQLAlchemy 2.0 async ORM + Alembic migrations
- ✅ **Automation Hooks**: Inbound/outbound webhooks for n8n/Activepieces
- ✅ **Modular Design**: One module = one table pattern for easy replication

### Frontend (React)
- ✅ **Modern UI**: Attio-style design with Radix UI components
- ✅ **Dashboard**: 4 charts (Chart.js) with analytics
- ✅ **Contacts CRUD**: Full table view with search, filter, pagination
- ✅ **Admin Panel**: Users, Roles, Audit Logs management
- ✅ **Google OAuth**: Seamless login flow

### Modules Implemented
1. **Contacts** (Reference module for replication)
   - Full CRUD with tenant isolation
   - Search by name/email/phone
   - Tag filtering
   - Pagination & sorting
   - Permission enforcement
   - Audit logging
   - Webhook events (created/updated/deleted)

---

## Quick Start (Docker)

### Prerequisites
- Docker & Docker Compose installed
- Update `.env` files with your settings

### Steps

```bash
# 1. Build and start all services
docker-compose up --build

# Services will be available at:
# - Frontend: http://localhost
# - Backend API: http://localhost:8001/api
# - PostgreSQL: localhost:5432

# 2. Access the application
Open http://localhost in your browser
```

### Environment Variables

**Backend** (`/backend/.env`):
```env
DATABASE_URL=postgresql+asyncpg://crm_user:password123@postgres:5432/crm_db
SECRET_KEY=your-secret-key-change-this-in-production-minimum-32-chars
CORS_ORIGINS=*
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080
```

**Frontend** (`/frontend/.env`):
```env
REACT_APP_BACKEND_URL=http://localhost:8001
```

---

## Local Development (Without Docker)

### Backend Setup

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Update .env with your PostgreSQL connection
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/crm_db

# Run migrations
alembic upgrade head

# Start server
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
yarn install

# Update .env
REACT_APP_BACKEND_URL=http://localhost:8001

# Start dev server
yarn start
```

---

## Architecture

### Backend Structure
```
backend/
├── alembic/                 # Database migrations
│   ├── versions/            # Migration files
│   └── env.py               # Alembic config
├── app/
│   ├── core/                # Core configurations
│   │   ├── config.py        # Settings
│   │   ├── database.py      # DB connection
│   │   ├── security.py      # Auth helpers
│   │   ├── dependencies.py  # FastAPI dependencies
│   │   └── middleware.py    # Request context
│   ├── models/              # SQLAlchemy models
│   │   ├── tenant.py        # Tenants
│   │   ├── user.py          # Users & Sessions
│   │   ├── role.py          # Roles & Groups
│   │   ├── permission.py    # Permissions
│   │   ├── contact.py       # Contacts (reference module)
│   │   ├── audit.py         # Audit logs
│   │   └── webhook.py       # Webhook subscriptions
│   ├── schemas/             # Pydantic schemas
│   ├── repositories/        # Data access layer
│   ├── services/            # Business logic
│   └── routers/             # API endpoints
├── server.py                # FastAPI app
└── requirements.txt         # Python dependencies
```

### Database Schema

**Core Tables**:
- `tenants` - Organizations
- `users` - User accounts
- `user_sessions` - Auth sessions
- `roles` - User roles
- `groups` - User groups
- `permissions` - Access permissions
- `user_roles` - Many-to-many join
- `user_groups` - Many-to-many join
- `role_permissions` - Many-to-many join
- `group_permissions` - Many-to-many join

**Module Tables**:
- `contacts` - Contact management (reference module)

**Automation Tables**:
- `audit_logs` - Change tracking
- `webhook_subscriptions` - Outbound webhooks
- `integration_events` - Inbound webhook events

---

## API Documentation

Once running, visit:
- Swagger UI: http://localhost:8001/docs
- ReDoc: http://localhost:8001/redoc

### Key Endpoints

**Authentication**:
- `POST /api/auth/session` - Process Google OAuth session
- `GET /api/auth/me` - Get current user info
- `POST /api/auth/logout` - Logout

**Contacts** (Reference Module):
- `POST /api/contacts` - Create contact
- `GET /api/contacts` - List contacts (with pagination/search/filter)
- `GET /api/contacts/{id}` - Get contact by ID
- `PUT /api/contacts/{id}` - Update contact
- `DELETE /api/contacts/{id}` - Delete contact

**Webhooks**:
- `POST /api/webhooks/{event_name}` - Inbound webhook endpoint
- `POST /api/webhooks/subscriptions` - Create outbound webhook
- `GET /api/webhooks/subscriptions` - List webhooks
- `DELETE /api/webhooks/subscriptions/{id}` - Delete webhook

**Audit**:
- `GET /api/audit/logs` - Get audit logs (with filters)

---

## Default Permissions

### Admin Role (Auto-created)
- `*.*` - All permissions

### Contact Permissions
- `contacts.read` - View contacts
- `contacts.create` - Create contacts
- `contacts.update` - Update contacts
- `contacts.delete` - Delete contacts

---

## Multi-Tenancy

### How It Works

1. **First User Login**: 
   - New tenant is created automatically
   - User gets Admin role with all permissions
   - Tenant slug derived from email

2. **Subsequent Logins**:
   - Users attach to existing tenant (implement your logic)
   - Or new tenant per user (default MVP behavior)

3. **Data Isolation**:
   - Every business table has `tenant_id`
   - All queries automatically filtered by tenant
   - No cross-tenant data leakage

---

## Webhook Integration (n8n / Activepieces)

### Outbound Webhooks (Trigger Workflows)

Events automatically emitted:
- `contact.created`
- `contact.updated`
- `contact.deleted`

To subscribe:

```bash
curl -X POST http://localhost:8001/api/webhooks/subscriptions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "event_name": "contact.created",
    "target_url": "https://your-n8n-instance.com/webhook/contact-created",
    "enabled": true
  }'
```

Webhooks include HMAC signature in `X-Webhook-Signature` header.

### Inbound Webhooks (Receive from Workflows)

Endpoint: `POST /api/webhooks/{event_name}`

Headers required:
- `X-Tenant-ID`: Your tenant UUID
- `X-API-Key`: Your tenant API key (generate via admin panel)

Example:

```bash
curl -X POST http://localhost:8001/api/webhooks/lead.captured \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: your-tenant-id" \
  -H "X-API-Key: your-api-key" \
  -d '{"email": "lead@example.com", "source": "website"}'
```

Events are stored in `integration_events` table for processing.

---

## Testing

```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
yarn test
```

---

## Production Deployment

### On Your GCP VM

1. **Clone/Upload Code**:
```bash
scp -r ./app user@your-vm-ip:/home/user/crm-platform
```

2. **Update Environment Variables**:
   - Change `SECRET_KEY` to a secure random string
   - Update `DATABASE_URL` with production credentials
   - Set `CORS_ORIGINS` to your frontend domain

3. **Deploy with Docker Compose**:
```bash
cd /home/user/crm-platform
docker-compose up -d
```

4. **Setup Nginx Reverse Proxy** (Optional):
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:80;
    }

    location /api {
        proxy_pass http://localhost:8001;
    }
}
```

### Environment Variables for Production

```env
DATABASE_URL=postgresql+asyncpg://user:secure_password@your-postgres-host:5432/crm_production
SECRET_KEY=generate-with-openssl-rand-base64-32
CORS_ORIGINS=https://your-domain.com
```

---

## Next Steps

1. ✅ Read `MODULE_REPLICATION_GUIDE.md` to add Companies, Deals, Tasks modules
2. ✅ Read `WEBHOOK_INTEGRATION_GUIDE.md` for n8n/Activepieces setup
3. ✅ Implement additional permissions and roles
4. ✅ Add email notifications
5. ✅ Implement advanced analytics

---

## Support

For issues or questions:
1. Check API docs at `/docs`
2. Review logs: `docker-compose logs backend`
3. Database inspection: `docker exec -it crm-postgres psql -U crm_user -d crm_db`

---

## License

MIT