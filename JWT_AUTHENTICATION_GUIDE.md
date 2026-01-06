# JWT Authentication Guide for TGT Inventory System

## Overview

The TGT Inventory system now uses JWT (JSON Web Tokens) for API authentication. All API endpoints except login require a valid JWT token.

---

## How JWT Authentication Works

1. **Login**: User submits username/password to get a JWT token
2. **Token Storage**: Frontend stores the access token
3. **API Requests**: Frontend includes token in Authorization header
4. **Token Refresh**: When access token expires, use refresh token to get new one

---

## API Endpoints

### 1. Login (No Auth Required)

**Endpoint**: `POST /account/users/`

**Request**:
```bash
curl -X POST http://localhost:8000/account/users/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "your_password"
  }'
```

**Response**:
```json
{
  "id": 1,
  "username": "admin",
  "role": "admin",
  "email": "admin@example.com",
  ...
}
```

### 2. Get JWT Token (No Auth Required)

**Endpoint**: `POST /api/token/`

**Request**:
```bash
curl -X POST http://localhost:8000/api/token/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "your_password"
  }'
```

**Response**:
```json
{
  "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Token Lifetime**:
- Access Token: 8 hours
- Refresh Token: 7 days

### 3. Refresh Token (No Auth Required)

**Endpoint**: `POST /api/token/refresh/`

**Request**:
```bash
curl -X POST http://localhost:8000/api/token/refresh/ \
  -H "Content-Type: application/json" \
  -d '{
    "refresh": "YOUR_REFRESH_TOKEN_HERE"
  }'
```

**Response**:
```json
{
  "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 4. Authenticated Requests (Auth Required)

All other endpoints require the Authorization header:

**Example - Get Products**:
```bash
curl -X GET http://localhost:8000/product/products/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
```

**Example - Create Product**:
```bash
curl -X POST http://localhost:8000/product/products/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "barcode": "123456",
    "so_number": "SO-001",
    "date": "2025-12-11"
  }'
```

---

## Frontend Integration

### Option 1: Update Frontend to Use JWT Tokens

You'll need to modify your frontend to:
1. Get JWT token on login
2. Store token in session/localStorage
3. Include token in all API requests
4. Handle token expiration

**Example Frontend Code** (frontend/app/lib/data.ts):

```typescript
// Get JWT token after successful login
async function getJWTToken(username: string, password: string) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_Django_API_URL}/api/token/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    throw new Error('Failed to get token');
  }

  const data = await response.json();
  return {
    accessToken: data.access,
    refreshToken: data.refresh,
  };
}

// Store token in session storage (or use a better state management solution)
function storeTokens(accessToken: string, refreshToken: string) {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('access_token', accessToken);
    sessionStorage.setItem('refresh_token', refreshToken);
  }
}

// Get stored access token
function getAccessToken(): string | null {
  if (typeof window !== 'undefined') {
    return sessionStorage.getItem('access_token');
  }
  return null;
}

// Make authenticated API request
async function authenticatedFetch(url: string, options: RequestInit = {}) {
  const token = getAccessToken();

  if (!token) {
    throw new Error('No access token available');
  }

  const headers = {
    ...options.headers,
    'Authorization': `Bearer ${token}`,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // If token expired, try to refresh
  if (response.status === 401) {
    const refreshToken = sessionStorage.getItem('refresh_token');
    if (refreshToken) {
      const newToken = await refreshAccessToken(refreshToken);
      if (newToken) {
        storeTokens(newToken, refreshToken);
        // Retry original request
        headers['Authorization'] = `Bearer ${newToken}`;
        return fetch(url, { ...options, headers });
      }
    }
  }

  return response;
}

// Refresh access token
async function refreshAccessToken(refreshToken: string): Promise<string | null> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_Django_API_URL}/api/token/refresh/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.access;
  } catch (error) {
    return null;
  }
}

// Example: Update getProducts to use JWT
export async function getProducts(
  query: string = '',
  currentPage: number = 1,
  sortField: string = '',
  sortOrder: 'asc' | 'desc' = 'asc'
) {
  const page = Math.max(1, currentPage);
  const url = `${process.env.NEXT_PUBLIC_Django_API_URL}/product/products/?` +
    `search=${query}&page=${page}&limit=100&sortField=${sortField}&sortOrder=${sortOrder}`;

  const response = await authenticatedFetch(url, {
    method: 'GET',
    cache: 'no-store',
  });

  if (!response.ok) {
    if (response.status === 404) {
      return [];
    }
    throw new Error(`Error: ${response.status}`);
  }

  const data = await response.json();
  return data.results || [];
}
```

### Option 2: Temporarily Disable Authentication (NOT RECOMMENDED)

If you need time to update the frontend, you can temporarily allow unauthenticated access by updating `settings.py`:

```python
# TEMPORARY - Remove this in production!
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.AllowAny',  # CHANGE BACK TO IsAuthenticated
    ],
}
```

**WARNING**: This defeats the purpose of adding authentication. Only use temporarily during development!

---

## Testing JWT Authentication

### 1. Test Login and Get Token

```bash
# Login and get JWT token
curl -X POST http://localhost:8000/api/token/ \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"your_password"}' | python -m json.tool
```

Save the `access` token from the response.

### 2. Test Authenticated Request

```bash
# Replace YOUR_TOKEN with the access token from step 1
export TOKEN="YOUR_ACCESS_TOKEN_HERE"

# Test getting products
curl -X GET http://localhost:8000/product/products/ \
  -H "Authorization: Bearer $TOKEN"
```

### 3. Test Without Token (Should Fail)

```bash
# This should return 401 Unauthorized
curl -X GET http://localhost:8000/product/products/
```

Expected response:
```json
{
  "detail": "Authentication credentials were not provided."
}
```

### 4. Test Token Refresh

```bash
# Replace YOUR_REFRESH_TOKEN with the refresh token from step 1
curl -X POST http://localhost:8000/api/token/refresh/ \
  -H "Content-Type: application/json" \
  -d '{"refresh":"YOUR_REFRESH_TOKEN_HERE"}' | python -m json.tool
```

---

## Common Issues & Solutions

### Issue 1: "Authentication credentials were not provided"

**Cause**: Missing or incorrect Authorization header

**Solution**: Ensure you're sending the token in the correct format:
```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

Not:
- `Authorization: YOUR_ACCESS_TOKEN`
- `Bearer YOUR_ACCESS_TOKEN`
- `Token YOUR_ACCESS_TOKEN`

### Issue 2: "Given token not valid for any token type"

**Cause**: Token expired or malformed

**Solution**: Get a new token using the refresh endpoint or login again

### Issue 3: CORS Error in Browser

**Cause**: Frontend origin not in CORS_ALLOWED_ORIGINS

**Solution**: Update backend `.env`:
```
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

### Issue 4: 401 on Scanner API

**Cause**: Zebra scanner not sending authentication token

**Solution**: You may need to configure the scanner to:
1. First call `/api/token/` to get a token
2. Store the token
3. Include token in all subsequent requests

Or temporarily allow unauthenticated scanner access:
```python
# product/views.py
@api_view(['POST'])
@permission_classes([AllowAny])  # Or create custom permission
def scanner_api(request):
    ...
```

---

## Security Best Practices

1. **Never log tokens** - Don't include tokens in console.log or server logs
2. **Use HTTPS in production** - Tokens sent over HTTP can be intercepted
3. **Store tokens securely** - Use httpOnly cookies or secure storage
4. **Rotate tokens** - Force users to re-login periodically
5. **Validate on server** - Never trust client-side token validation
6. **Short token lifetime** - Keep access tokens short-lived (8 hours default)
7. **Revoke on logout** - Clear tokens when user logs out

---

## Next Steps

1. Update frontend login to get JWT token
2. Store tokens in secure storage
3. Update all API calls to include Authorization header
4. Test all functionality works with authentication
5. Deploy to production with authentication enabled
