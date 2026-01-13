# Nginx Configuration Documentation for TGT Inventory System
# TGT 庫存系統 Nginx 配置文檔

## Overview 概述
This document explains the Nginx setup on the production server (toyoshimainventory.com / 192.168.0.43) and serves as a reference for future maintenance.

本文檔說明生產服務器 (toyoshimainventory.com / 192.168.0.43) 上的 Nginx 設置，作為未來維護的參考。

## Architecture 架構
The production server uses Nginx as a reverse proxy to route requests to the appropriate backend services:
生產服務器使用 Nginx 作為反向代理，將請求路由到適當的後端服務：

- **Next.js Frontend** (Port 3000) - Handles UI and server-side rendering
  **Next.js 前端** (端口 3000) - 處理 UI 和服務器端渲染
- **Django Backend** (Port 8000) - Handles API requests and business logic
  **Django 後端** (端口 8000) - 處理 API 請求和業務邏輯
- **Static Media Files** - Served directly by Nginx from filesystem
  **靜態媒體文件** - Nginx 直接從文件系統提供

## Nginx Configuration File Nginx 配置文件
Location 位置: `/etc/nginx/sites-available/toyoshimainventory`
Symlink 符號連結: `/etc/nginx/sites-enabled/toyoshimainventory`

## Request Flow 請求流程

### 1. Media Files (Photos/Images) 媒體文件（照片/圖片）
**Pattern 模式**: `http://toyoshimainventory.com/media/*`
**Flow 流程**: Browser 瀏覽器 → Nginx → Filesystem 文件系統 (`/workplace/Images/`)
**Purpose 目的**: Serve uploaded product photos directly from disk
直接從磁盤提供上傳的產品照片

**Configuration 配置**:
```nginx
location /media/ {
    alias /workplace/Images/;        # 指向實際圖片存儲目錄
    autoindex off;                   # 禁止目錄列表
    expires 30d;                     # 瀏覽器緩存 30 天
    add_header Cache-Control "public, immutable";  # 設置緩存策略
}
```

### 2. Django API Requests Django API 請求
**Patterns 模式**:
- `http://toyoshimainventory.com/product/*`    - 產品相關 API
- `http://toyoshimainventory.com/account/*`    - 帳戶相關 API
- `http://toyoshimainventory.com/api/token/*`  - JWT 認證 API
- `http://toyoshimainventory.com/admin/*`      - Django 管理後台

**Flow 流程**: Browser 瀏覽器 → Nginx → Django (localhost:8000) → Response 響應
**Purpose 目的**: Handle all backend API calls, authentication, and admin panel
處理所有後端 API 調用、身份驗證和管理面板

**Configuration 配置**:
```nginx
location ~ ^/(product|account|api/token)/ {
    proxy_pass http://127.0.0.1:8000;           # 轉發到 Django 服務器
    proxy_http_version 1.1;
    proxy_set_header Host $host;                # 保持原始主機名
    proxy_set_header X-Real-IP $remote_addr;    # 記錄真實客戶端 IP
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;

    # Important for file uploads 對文件上傳很重要
    proxy_request_buffering off;                # 禁用請求緩衝，避免大文件超時
    client_max_body_size 100M;                  # 允許上傳 100MB 文件
}
```

### 3. Frontend Requests (Default) 前端請求（默認）
**Pattern 模式**: `http://toyoshimainventory.com/*` (everything else 所有其他請求)
**Flow 流程**: Browser 瀏覽器 → Nginx → Next.js (localhost:3000) → Response 響應
**Purpose 目的**: Serve the React/Next.js web application
提供 React/Next.js 網頁應用

**Configuration 配置**:
```nginx
location / {
    proxy_pass http://127.0.0.1:3000;           # 轉發到 Next.js 服務器
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;     # 支持 WebSocket
    proxy_set_header Connection 'upgrade';      # 支持 WebSocket
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;

    client_max_body_size 100M;                  # 允許上傳 100MB 文件
}
```

## Key Configuration Settings 關鍵配置設定

### File Upload Size Limit 文件上傳大小限制
```nginx
client_max_body_size 100M;
```
- Set at both server level and location level 在服務器級別和位置級別都要設置
- Allows uploads up to 100MB (needed for photo uploads) 允許上傳最多 100MB（照片上傳所需）
- Without this, Nginx returns "413 Request Entity Too Large" 沒有此設置，Nginx 會返回 "413 請求實體過大" 錯誤

### Proxy Request Buffering 代理請求緩衝
```nginx
proxy_request_buffering off;
```
- Disables buffering of client request body 禁用客戶端請求主體的緩衝
- Important for large file uploads to Django 對 Django 的大文件上傳很重要
- Prevents timeout issues with large files 防止大文件的超時問題

### Static File Caching 靜態文件緩存
```nginx
expires 30d;
add_header Cache-Control "public, immutable";
```
- Media files cached for 30 days in browser 媒體文件在瀏覽器中緩存 30 天
- Improves performance for frequently accessed images 提高頻繁訪問圖片的性能
- "immutable" means files never change (good for unique filenames)
  "immutable" 表示文件永不改變（適用於唯一文件名）

## File Permissions 文件權限

### Media Directory Ownership 媒體目錄所有權
```bash
Owner: toyoshimagtech (Django user / Django 用戶)
Group: www-data (Nginx user / Nginx 用戶)
Permissions: 775 (rwxrwxr-x)
```

**Why this matters 為什麼這很重要**:
- Django needs write permission to save uploaded photos
  Django 需要寫入權限來保存上傳的照片
- Nginx needs read permission to serve photos via `/media/`
  Nginx 需要讀取權限通過 `/media/` 提供照片
- Group write permission allows both users to access files
  組寫入權限允許兩個用戶訪問文件

### Setting Permissions 設置權限
```bash
# 將目錄所有者設為 toyoshimagtech，組設為 www-data
sudo chown -R toyoshimagtech:www-data /workplace/Images/

# 設置權限為 775（所有者和組都可讀寫執行，其他人只讀執行）
sudo chmod -R 775 /workplace/Images/
```

## Environment Configuration 環境配置

### Frontend (.env.local) 前端環境變量
```bash
NEXT_PUBLIC_Django_API_URL=http://toyoshimainventory.com
```
- Frontend makes API calls to the public domain 前端向公共域名發起 API 調用
- Nginx proxies these to Django on localhost:8000 Nginx 將這些請求代理到 localhost:8000 的 Django

### Backend (.env) 後端環境變量
```bash
PUBLIC_DOMAIN=http://toyoshimainventory.com
MEDIA_ROOT=/workplace/Images
```
- Django uses PUBLIC_DOMAIN to generate photo URLs Django 使用 PUBLIC_DOMAIN 生成照片 URL
- MEDIA_ROOT specifies where to save uploaded files MEDIA_ROOT 指定上傳文件的保存位置

## Common Operations 常用操作

### Restart Nginx 重啟 Nginx
```bash
# Test configuration first 先測試配置
sudo nginx -t

# Reload configuration (no downtime) 重新加載配置（無停機時間）
sudo systemctl reload nginx

# Full restart (brief downtime) 完全重啟（短暫停機）
sudo systemctl restart nginx
```

### View Nginx Logs 查看 Nginx 日誌
```bash
# Access log (all requests) 訪問日誌（所有請求）
sudo tail -f /var/log/nginx/access.log

# Error log 錯誤日誌
sudo tail -f /var/log/nginx/error.log
```

### Edit Configuration 編輯配置
```bash
sudo nano /etc/nginx/sites-available/toyoshimainventory
sudo nginx -t && sudo systemctl reload nginx
```

## Troubleshooting 故障排除

### Issue 問題: 404 on Media Files 媒體文件 404
**Symptoms 症狀**: Images not loading, 404 errors for `/media/*`
圖片無法加載，`/media/*` 返回 404 錯誤

**Causes 原因**:
1. Incorrect alias path in Nginx config Nginx 配置中的別名路徑不正確
2. Files don't exist in `/workplace/Images/` 文件不存在於 `/workplace/Images/`
3. Wrong file permissions 文件權限錯誤

**Solution 解決方案**:
```bash
# Check if files exist 檢查文件是否存在
ls -la /workplace/Images/

# Fix permissions 修復權限
sudo chown -R toyoshimagtech:www-data /workplace/Images/
sudo chmod -R 775 /workplace/Images/
```

### Issue 問題: 413 Request Entity Too Large 請求實體過大
**Symptoms 症狀**: File uploads fail with 413 error 文件上傳失敗，返回 413 錯誤
**Cause 原因**: `client_max_body_size` too small or missing
`client_max_body_size` 太小或缺失

**Solution 解決方案**:
```bash
# Edit Nginx config, ensure this line exists in both server block and location blocks
# 編輯 Nginx 配置，確保此行在 server 塊和 location 塊中都存在
client_max_body_size 100M;

# Reload Nginx 重新加載 Nginx
sudo nginx -t && sudo systemctl reload nginx
```

### Issue 問題: 502 Bad Gateway 錯誤網關
**Symptoms 症狀**: API requests return 502 API 請求返回 502
**Causes 原因**:
1. Django not running Django 未運行
2. Django not listening on 127.0.0.1:8000 Django 未監聽 127.0.0.1:8000

**Solution 解決方案**:
```bash
# Check if Django is running 檢查 Django 是否運行
ps aux | grep "manage.py runserver"

# Restart Django if needed 如需要，重啟 Django
cd ~/TGT_Invertory/backend/server
pkill -f "python manage.py runserver"
nohup python manage.py runserver 127.0.0.1:8000 > /tmp/django.log 2>&1 &
```

### Issue 問題: Authentication Fails (401) 身份驗證失敗 (401)
**Symptoms 症狀**: Cannot login, 401 errors 無法登錄，401 錯誤
**Cause 原因**: Django API requests not being proxied correctly
Django API 請求未正確代理

**Solution 解決方案**:
```bash
# Ensure Nginx config includes account endpoint proxy
# 確保 Nginx 配置包含 account 端點代理
location ~ ^/(product|account|api/token)/ {
    proxy_pass http://127.0.0.1:8000;
    ...
}
```

## Security Considerations 安全考慮

### Current Setup (Development-like) 當前設置（類似開發環境）
- HTTP only (no HTTPS/SSL) 僅 HTTP（無 HTTPS/SSL）
- CORS allows all origins CORS 允許所有來源
- Django DEBUG=True Django DEBUG=True
- Running with runserver (not production-grade) 使用 runserver 運行（非生產級別）

### Production Recommendations 生產環境建議
1. **Enable HTTPS 啟用 HTTPS**: Use Let's Encrypt/Certbot for SSL 使用 Let's Encrypt/Certbot 獲取 SSL 證書
2. **Use WSGI Server 使用 WSGI 服務器**: Replace `runserver` with Gunicorn/uWSGI
   用 Gunicorn/uWSGI 替換 `runserver`
3. **Restrict CORS 限制 CORS**: Limit to specific domains 限制為特定域名
4. **Set DEBUG=False 設置 DEBUG=False**: Disable Django debug mode 禁用 Django 調試模式
5. **Use PostgreSQL 使用 PostgreSQL**: Already done ✓ 已完成 ✓
6. **Regular Backups 定期備份**: Implement database and media file backups
   實施數據庫和媒體文件備份

## Summary 總結
- Nginx acts as a reverse proxy routing requests to Next.js, Django, or serving static files
  Nginx 作為反向代理，將請求路由到 Next.js、Django 或提供靜態文件
- Three main routing patterns 三種主要路由模式:
  - `/media/` (filesystem 文件系統)
  - `/product|account|api` (Django)
  - `/*` (Next.js)
- File permissions critical for photo uploads 文件權限對照片上傳至關重要:
  toyoshimagtech:www-data with 775
- Upload size limit set to 100M for photo handling 上傳大小限制設置為 100M 以處理照片
- All configuration is server-only, not version controlled (except this documentation)
  所有配置僅存在於服務器上，不受版本控制（本文檔除外）
