# Auth-Gated App Testing Playbook

## Prerequisites
This testing playbook is for apps using Emergent Google OAuth authentication. The backend uses session tokens stored in httpOnly cookies.

## Step 1: Test Backend API Directly

### 1.1 Create Test User & Session in Database

For PostgreSQL:

```bash
# Connect to database
docker exec -it crm-postgres psql -U crm_user -d crm_db

# Create test user and session
DO $$
DECLARE
    test_tenant_id UUID;
    test_user_id UUID;
    test_session_token TEXT;
BEGIN
    -- Create tenant
    INSERT INTO tenants (id, name, slug, is_active)
    VALUES (gen_random_uuid(), 'Test Organization', 'test-org', true)
    RETURNING id INTO test_tenant_id;
    
    -- Create user
    INSERT INTO users (id, tenant_id, email, name, picture, is_active)
    VALUES (
        gen_random_uuid(),
        test_tenant_id,
        'test.user@example.com',
        'Test User',
        'https://via.placeholder.com/150',
        true
    )
    RETURNING id INTO test_user_id;
    
    -- Create session token
    test_session_token := 'test_session_' || EXTRACT(EPOCH FROM NOW())::TEXT;
    
    INSERT INTO user_sessions (id, user_id, session_token, expires_at)
    VALUES (
        gen_random_uuid(),
        test_user_id,
        test_session_token,
        NOW() + INTERVAL '7 days'
    );
    
    -- Create admin permission
    INSERT INTO permissions (id, name, description, resource, action)
    VALUES (
        gen_random_uuid(),
        '*.*',
        'All permissions',
        '*',
        '*'
    )
    ON CONFLICT (name) DO NOTHING;
    
    -- Create admin role
    WITH admin_role AS (
        INSERT INTO roles (id, tenant_id, name, description)
        VALUES (gen_random_uuid(), test_tenant_id, 'Admin', 'Administrator')
        RETURNING id
    ),
    admin_perm AS (
        SELECT id FROM permissions WHERE name = '*.*'
    )
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT admin_role.id, admin_perm.id
    FROM admin_role, admin_perm;
    
    -- Assign role to user
    INSERT INTO user_roles (user_id, role_id)
    SELECT test_user_id, id FROM roles WHERE name = 'Admin' AND tenant_id = test_tenant_id;
    
    -- Display credentials
    RAISE NOTICE 'Test credentials created:';
    RAISE NOTICE 'Session Token: %', test_session_token;
    RAISE NOTICE 'User ID: %', test_user_id;
    RAISE NOTICE 'Tenant ID: %', test_tenant_id;
END $$;
```

**Note the session token** printed at the end. You'll use it for testing.

### 1.2 Test Auth Endpoint

```bash
# Get the session token from Step 1.1
SESSION_TOKEN="test_session_1234567890"

# Test /api/auth/me endpoint
curl -X GET "http://localhost:8001/api/auth/me" \
  -H "Authorization: Bearer $SESSION_TOKEN" \
  --cookie "session_token=$SESSION_TOKEN"

# Expected response:
# {
#   "id": "...",
#   "email": "test.user@example.com",
#   "name": "Test User",
#   "tenant_id": "...",
#   "is_active": true,
#   "roles": ["Admin"],
#   "permissions": ["*.*"]
# }
```

### 1.3 Test Protected Endpoints

```bash
# Test contacts endpoint
curl -X GET "http://localhost:8001/api/contacts" \
  -H "Authorization: Bearer $SESSION_TOKEN"

# Create a contact
curl -X POST "http://localhost:8001/api/contacts" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SESSION_TOKEN" \
  -d '{
    "first_name": "John",
    "last_name": "Doe",
    "email": "john.doe@example.com",
    "phone": "+1234567890",
    "company": "Acme Corp",
    "tags": ["prospect", "enterprise"]
  }'

# Get audit logs
curl -X GET "http://localhost:8001/api/audit/logs" \
  -H "Authorization: Bearer $SESSION_TOKEN"
```

## Step 2: Browser Testing with Playwright

Create a Playwright test file:

```javascript
// test-auth.spec.js
const { test, expect } = require('@playwright/test');

test('CRM Platform - Auth Flow', async ({ page, context }) => {
  const sessionToken = 'test_session_1234567890'; // From Step 1.1
  
  // Set session cookie
  await context.addCookies([{
    name: 'session_token',
    value: sessionToken,
    domain: 'localhost',
    path: '/',
    httpOnly: true,
    secure: false,
    sameSite: 'Lax'
  }]);
  
  // Navigate to dashboard
  await page.goto('http://localhost:3000/dashboard');
  
  // Wait for user data to load
  await page.waitForSelector('[data-testid="dashboard-view"]', { timeout: 5000 });
  
  // Verify user is authenticated
  await expect(page.locator('text=Test User')).toBeVisible();
  await expect(page.locator('text=test.user@example.com')).toBeVisible();
  
  // Test navigation
  await page.click('[data-testid="contacts-tab"]');
  await expect(page.locator('[data-testid="contacts-list"]')).toBeVisible();
  
  // Test logout
  await page.click('[data-testid="logout-btn"]');
  await page.waitForURL('**/login');
  
  console.log('✅ All auth tests passed');
});

test('CRM Platform - Contact CRUD', async ({ page, context }) => {
  const sessionToken = 'test_session_1234567890';
  
  await context.addCookies([{
    name: 'session_token',
    value: sessionToken,
    domain: 'localhost',
    path: '/',
    httpOnly: true
  }]);
  
  await page.goto('http://localhost:3000/dashboard');
  
  // Navigate to contacts
  await page.click('[data-testid="contacts-tab"]');
  
  // Click add contact button
  await page.click('[data-testid="add-contact-btn"]');
  
  // Form would appear here in full implementation
  // Fill and submit contact form...
  
  console.log('✅ Contact CRUD test passed');
});
```

Run tests:
```bash
npx playwright test test-auth.spec.js --headed
```

## Step 3: Manual Browser Testing

### 3.1 Set Cookie via DevTools

1. Open browser DevTools (F12)
2. Go to Console tab
3. Run:

```javascript
document.cookie = `session_token=test_session_1234567890; path=/; max-age=604800`;
location.reload();
```

4. Page should reload and show authenticated dashboard

### 3.2 Verify Auth State

In Console:
```javascript
fetch('http://localhost:8001/api/auth/me', {
  credentials: 'include'
})
.then(r => r.json())
.then(d => console.log('User:', d));
```

## Step 4: End-to-End Testing

### 4.1 Full Auth Flow (with Google OAuth)

**Important**: This requires a real Google OAuth flow, which won't work in local development without proper redirect URLs.

For production testing:

```javascript
test('Full OAuth Flow', async ({ page }) => {
  // Go to login
  await page.goto('http://localhost:3000/login');
  
  // Click Google login
  await page.click('[data-testid="google-login-btn"]');
  
  // OAuth redirect happens
  // This requires manual intervention or OAuth mock
  
  // After redirect back
  await page.waitForURL('**/dashboard');
  await expect(page.locator('text=Welcome back')).toBeVisible();
});
```

## Step 5: Cleanup

Remove test data:

```sql
-- Connect to database
docker exec -it crm-postgres psql -U crm_user -d crm_db

-- Delete test sessions
DELETE FROM user_sessions WHERE session_token LIKE 'test_session_%';

-- Delete test users
DELETE FROM users WHERE email LIKE 'test.user%@example.com';

-- Delete test tenants
DELETE FROM tenants WHERE slug = 'test-org';
```

## Quick Debug Commands

### Check Database State

```sql
-- View all users
SELECT id, email, name, tenant_id, is_active FROM users;

-- View all sessions
SELECT 
    us.session_token,
    u.email,
    us.expires_at,
    CASE WHEN us.expires_at > NOW() THEN 'valid' ELSE 'expired' END as status
FROM user_sessions us
JOIN users u ON us.user_id = u.id
ORDER BY us.created_at DESC
LIMIT 10;

-- Check user permissions
SELECT 
    u.email,
    r.name as role,
    p.name as permission
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id;
```

### Check Backend Logs

```bash
# Docker
docker-compose logs -f backend

# Local
tail -f /var/log/supervisor/backend.*.log
```

### Check Frontend Network Requests

In browser DevTools → Network tab:
- Filter by "api"
- Check request headers (should include Authorization or Cookie)
- Check response status (200 = success, 401 = auth failed, 403 = no permission)

## Common Issues

### Issue: 401 Unauthorized

**Cause**: Invalid or expired session token

**Fix**:
```sql
-- Check session expiry
SELECT session_token, expires_at, expires_at > NOW() as is_valid
FROM user_sessions
WHERE session_token = 'your-token';

-- Extend expiry
UPDATE user_sessions
SET expires_at = NOW() + INTERVAL '7 days'
WHERE session_token = 'your-token';
```

### Issue: 403 Forbidden

**Cause**: User lacks required permission

**Fix**:
```sql
-- Grant admin permission
INSERT INTO user_roles (user_id, role_id)
SELECT 
    (SELECT id FROM users WHERE email = 'test.user@example.com'),
    (SELECT id FROM roles WHERE name = 'Admin' LIMIT 1);
```

### Issue: Frontend shows "Not authenticated"

**Causes**:
1. Cookie not set correctly
2. CORS issue
3. Backend not running

**Debug**:
```javascript
// Check cookies
console.log(document.cookie);

// Check API
fetch('http://localhost:8001/api/auth/me', { credentials: 'include' })
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);
```

## Success Checklist

- [ ] Test user created in database
- [ ] Session token generated
- [ ] `/api/auth/me` returns user data
- [ ] Protected endpoints accessible with token
- [ ] Browser shows authenticated dashboard
- [ ] Navigation between tabs works
- [ ] Logout clears session
- [ ] Contacts CRUD operations work
- [ ] Audit logs capture changes

---

**Note**: For production, always use real Google OAuth flow. This testing playbook is for development/staging environments only.