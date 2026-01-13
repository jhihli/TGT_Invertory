# Nginx Configuration Documentation for TGT Inventory System

## Overview
This document explains the Nginx setup on the production server (toyoshimainventory.com / 192.168.0.43) and serves as a reference for future maintenance.

## Architecture
The production server uses Nginx as a reverse proxy to route requests to the appropriate backend services:
- **Next.js Frontend** (Port 3000) - Handles UI and server-side rendering
- **Django Backend** (Port 8000) - Handles API requests and business logic
- **Static Media Files** - Served directly by Nginx from filesystem

## Nginx Configuration File
Location: `/etc/nginx/sites-available/toyoshimainventory`
Symlink: `/etc/nginx/sites-enabled/toyoshimainventory`

## Request Flow

### 1. Media Files (Photos/Images)
**Pattern**: `http://toyoshimainventory.com/media/*`
**Flow**: Browser → Nginx → Filesystem (`/workplace/Images/`)
**Purpose**: Serve uploaded product photos directly from disk
**Configuration**:
```nginx
location /media/ {
    alias /workplace/Images/;
    autoindex off;
    expires 30d;
    add_header Cache-Control "public, immutable";
}
```

### 2. Django API Requests
**Patterns**:
- `http://toyoshimainventory.com/product/*`
- `http://toyoshimainventory.com/account/*`
- `http://toyoshimainventory.com/api/token/*`
- `http://toyoshimainventory.com/admin/*`

**Flow**: Browser → Nginx → Django (localhost:8000) → Response
**Purpose**: Handle all backend API calls, authentication, and admin panel
**Configuration**:
```nginx
location ~ ^/(product|account|api/token)/ {
    proxy_pass http://127.0.0.1:8000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;

    # Important for file uploads
    proxy_request_buffering off;
    client_max_body_size 100M;
}
```

### 3. Frontend Requests (Default)
**Pattern**: `http://toyoshimainventory.com/*` (everything else)
**Flow**: Browser → Nginx → Next.js (localhost:3000) → Response
**Purpose**: Serve the React/Next.js web application
**Configuration**:
```nginx
location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;

    client_max_body_size 100M;
}
```

## Key Configuration Settings

### File Upload Size Limit
```nginx
client_max_body_size 100M;
```
- Set at both server level and location level
- Allows uploads up to 100MB (needed for photo uploads)
- Without this, Nginx returns "413 Request Entity Too Large"

### Proxy Request Buffering
```nginx
proxy_request_buffering off;
```
- Disables buffering of client request body
- Important for large file uploads to Django
- Prevents timeout issues with large files

### Static File Caching
```nginx
expires 30d;
add_header Cache-Control "public, immutable";
```
- Media files cached for 30 days in browser
- Improves performance for frequently accessed images
- "immutable" means files never change (good for unique filenames)

## File Permissions

### Media Directory Ownership
```bash
Owner: toyoshimagtech (Django user)
Group: www-data (Nginx user)
Permissions: 775 (rwxrwxr-x)
```

**Why this matters**:
- Django needs write permission to save uploaded photos
- Nginx needs read permission to serve photos via `/media/`
- Group write permission allows both users to access files

### Setting Permissions
```bash
sudo chown -R toyoshimagtech:www-data /workplace/Images/
sudo chmod -R 775 /workplace/Images/
```

## Environment Configuration

### Frontend (.env.local)
```bash
NEXT_PUBLIC_Django_API_URL=http://toyoshimainventory.com
```
- Frontend makes API calls to the public domain
- Nginx proxies these to Django on localhost:8000

### Backend (.env)
```bash
PUBLIC_DOMAIN=http://toyoshimainventory.com
MEDIA_ROOT=/workplace/Images
```
- Django uses PUBLIC_DOMAIN to generate photo URLs
- MEDIA_ROOT specifies where to save uploaded files

## Common Operations

### Restart Nginx
```bash
# Test configuration first
sudo nginx -t

# Reload configuration (no downtime)
sudo systemctl reload nginx

# Full restart (brief downtime)
sudo systemctl restart nginx
```

### View Nginx Logs
```bash
# Access log (all requests)
sudo tail -f /var/log/nginx/access.log

# Error log
sudo tail -f /var/log/nginx/error.log
```

### Edit Configuration
```bash
sudo nano /etc/nginx/sites-available/toyoshimainventory
sudo nginx -t && sudo systemctl reload nginx
```

## Troubleshooting

### Issue: 404 on Media Files
**Symptoms**: Images not loading, 404 errors for `/media/*`
**Causes**:
1. Incorrect alias path in Nginx config
2. Files don't exist in `/workplace/Images/`
3. Wrong file permissions

**Solution**:
```bash
# Check if files exist
ls -la /workplace/Images/

# Fix permissions
sudo chown -R toyoshimagtech:www-data /workplace/Images/
sudo chmod -R 775 /workplace/Images/
```

### Issue: 413 Request Entity Too Large
**Symptoms**: File uploads fail with 413 error
**Cause**: `client_max_body_size` too small or missing

**Solution**:
```bash
# Edit Nginx config, ensure this line exists in both server block and location blocks
client_max_body_size 100M;

# Reload Nginx
sudo nginx -t && sudo systemctl reload nginx
```

### Issue: 502 Bad Gateway
**Symptoms**: API requests return 502
**Causes**:
1. Django not running
2. Django not listening on 127.0.0.1:8000

**Solution**:
```bash
# Check if Django is running
ps aux | grep "manage.py runserver"

# Restart Django if needed
cd ~/TGT_Invertory/backend/server
pkill -f "python manage.py runserver"
nohup python manage.py runserver 127.0.0.1:8000 > /tmp/django.log 2>&1 &
```

### Issue: Authentication Fails (401)
**Symptoms**: Cannot login, 401 errors
**Cause**: Django API requests not being proxied correctly

**Solution**:
```bash
# Ensure Nginx config includes account endpoint proxy
location ~ ^/(product|account|api/token)/ {
    proxy_pass http://127.0.0.1:8000;
    ...
}
```

## Security Considerations

### Current Setup (Development-like)
- HTTP only (no HTTPS/SSL)
- CORS allows all origins
- Django DEBUG=True
- Running with runserver (not production-grade)

### Production Recommendations
1. **Enable HTTPS**: Use Let's Encrypt/Certbot for SSL
2. **Use WSGI Server**: Replace `runserver` with Gunicorn/uWSGI
3. **Restrict CORS**: Limit to specific domains
4. **Set DEBUG=False**: Disable Django debug mode
5. **Use PostgreSQL**: Already done ✓
6. **Regular Backups**: Implement database and media file backups

## Summary
- Nginx acts as a reverse proxy routing requests to Next.js, Django, or serving static files
- Three main routing patterns: `/media/` (filesystem), `/product|account|api` (Django), `/*` (Next.js)
- File permissions critical for photo uploads: toyoshimagtech:www-data with 775
- Upload size limit set to 100M for photo handling
- All configuration is server-only, not version controlled (except this documentation)
