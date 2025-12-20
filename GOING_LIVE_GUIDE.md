# 🚀 Going Live: Connecting to Real Database & Backend API

## Step 1: Database Setup

### Run Database Migrations
After starting your Docker containers, run:
```bash
docker-compose -f docker-compose.local.yml exec backend alembic upgrade head
```

This creates all the necessary tables in PostgreSQL.

### Verify Tables Created
```bash
docker-compose -f docker-compose.local.yml exec postgres psql -U crm_user -d crm_db -c "\dt"
```

## Step 2: Firebase Configuration

### Add Your Domain to Firebase
1. Go to [Firebase Console](https://console.firebase.google.com/) → Your Project
2. Authentication → Settings → Authorized domains
3. Add your domains:
   - `localhost` (for local testing)
   - `your-app.com` (for production)
   - `crm-platform-24.preview.emergentagent.com` (Emergent preview)

### Enable Authentication Methods
Ensure these are enabled in Firebase Console → Authentication → Sign-in method:
- ✅ Email/Password
- ✅ Google

## Step 3: Environment Variables

### Frontend (.env)
```env
REACT_APP_BACKEND_URL=https://your-backend-url.com
REACT_APP_FIREBASE_API_KEY=AIzaSyBeI5LCY_lqAXxk_frwkqc1pEdrQAtA0C8
REACT_APP_FIREBASE_AUTH_DOMAIN=pythonapi-460914.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=pythonapi-460914
```

### Backend (.env)
```env
DATABASE_URL=postgresql+asyncpg://crm_user:password123@postgres:5432/crm_db
CORS_ORIGINS=*
SECRET_KEY=your-secret-key-change-this-in-production-minimum-32-chars
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080
FIREBASE_PROJECT_ID=pythonapi-460914
```

## Step 4: Connect Frontend to Real API

The frontend currently uses "Demo Mode" with localStorage. Once you're authenticated via Firebase:

1. **Firebase token** is obtained on login
2. **Token is sent** in Authorization header to backend
3. **Backend verifies** the Firebase token
4. **User is created/updated** in PostgreSQL on first login

### API Calls with Authentication
The frontend already has the auth context set up. The `useAuth` hook provides:
- `user` - Current authenticated user
- `token` - Firebase ID token for API calls
- `logout()` - Sign out function

### Making Authenticated API Calls
```javascript
import { useAuth } from '../contexts/AuthContext';

const { token } = useAuth();

const response = await fetch(`${API_URL}/api/contacts`, {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

## Step 5: Test the Flow

1. **Start Docker containers**:
   ```bash
   docker-compose -f docker-compose.local.yml up --build
   ```

2. **Run migrations**:
   ```bash
   docker-compose -f docker-compose.local.yml exec backend alembic upgrade head
   ```

3. **Open the app**: http://localhost:3000

4. **Sign in with Google or Email**:
   - First login creates a user in PostgreSQL
   - User gets `agent` role by default

5. **Access Contacts page**:
   - Now fetches from real backend API
   - CRUD operations go to PostgreSQL

## Step 6: Deployment Options

### Option A: Google Cloud Run (Recommended)
See `STEPS_TO_RUN_LOCALLY.md` for GCP deployment instructions.

### Option B: Any Docker Host
```bash
docker-compose -f docker-compose.local.yml up -d
```

### Option C: Kubernetes
Use the provided Dockerfiles to build images and deploy to your K8s cluster.

## Current Authentication Flow

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   Frontend  │ ──►  │   Firebase  │ ──►  │   Backend   │
│  (React)    │ ◄──  │    Auth     │      │  (FastAPI)  │
└─────────────┘      └─────────────┘      └─────────────┘
       │                    │                    │
       │  1. Login          │                    │
       │ ──────────────────►│                    │
       │                    │                    │
       │  2. ID Token       │                    │
       │ ◄──────────────────│                    │
       │                    │                    │
       │  3. API Call + Token                    │
       │ ────────────────────────────────────────►
       │                    │                    │
       │                    │  4. Verify Token   │
       │                    │ ◄──────────────────│
       │                    │                    │
       │  5. Response                            │
       │ ◄────────────────────────────────────────
```

## RBAC Roles

| Role    | Permissions |
|---------|-------------|
| admin   | Full access |
| manager | Contacts CRUD, Audit read, Webhooks |
| agent   | Contacts read/create/update, Audit read |
| viewer  | Read-only access |

## Troubleshooting

### "Firebase token verification failed"
- Ensure `FIREBASE_PROJECT_ID` matches your Firebase project
- Check that the token hasn't expired (tokens last 1 hour)

### "Database connection failed"
- Verify `DATABASE_URL` uses `postgresql+asyncpg://` prefix
- Check PostgreSQL container is running

### "CORS error"
- Add your frontend URL to `CORS_ORIGINS` in backend `.env`
