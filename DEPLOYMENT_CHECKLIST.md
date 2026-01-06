# TGT Inventory - Production Deployment Checklist

## Pre-Deployment Security Updates

### ✅ 1. JWT Authentication Installed
- [x] `djangorestframework-simplejwt` added to requirements.txt
- [x] JWT configuration added to settings.py
- [x] Token endpoints added: `/api/token/` and `/api/token/refresh/`
- [x] All product endpoints require authentication
- [x] All account endpoints require authentication (except login)

### ✅ 2. CORS Configuration Updated
- [x] CORS restricted to specific origins
- [x] `CORS_ALLOW_ALL_ORIGINS=False` in .env
- [x] Specific origins listed in `CORS_ALLOWED_ORIGINS`

### ✅ 3. Environment Files Created
- [x] `.env.production.template` for backend
- [x] `.env.production.template` for frontend
- [x] Documentation added with clear instructions

### ✅ 4. Firewall Setup Script Created
- [x] `setup-firewall.sh` script created
- [x] SSH, HTTP, HTTPS allowed
- [x] Django, Next.js, PostgreSQL blocked from external access

---

## Deployment Steps for Dell R340

### Phase 1: Preparation (Local)

- [ ] 1. Generate new SECRET_KEY
  ```bash
  cd backend/server
  ./venv/Scripts/python.exe -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
  ```

- [ ] 2. Generate new NEXTAUTH_SECRET
  ```bash
  openssl rand -base64 32
  ```
  (On Windows, install OpenSSL first: `choco install openssl`)

- [ ] 3. Update `.env` files for production
  - [ ] Copy `.env.production.template` to `.env` in backend
  - [ ] Update SECRET_KEY
  - [ ] Update DB_PASSWORD
  - [ ] Update ALLOWED_HOSTS with server IP
  - [ ] Update CORS_ALLOWED_ORIGINS with server IP
  - [ ] Set DEBUG=False
  - [ ] Set MEDIA_ROOT=/var/www/tgt_inventory/media

- [ ] 4. Update frontend `.env.local`
  - [ ] Copy `.env.production.template` to `.env.local`
  - [ ] Update NEXTAUTH_URL with server IP
  - [ ] Update NEXTAUTH_SECRET
  - [ ] Update NEXT_PUBLIC_Django_API_URL

- [ ] 5. Test locally with authentication
  ```bash
  # Backend
  cd backend/server
  ./venv/Scripts/python.exe manage.py runserver

  # Frontend
  cd frontend
  npm run dev
  ```

- [ ] 6. Verify JWT authentication works
  - [ ] Login returns user data
  - [ ] Product endpoints return 401 without token
  - [ ] Product endpoints work with valid token

### Phase 2: Server Setup

- [ ] 7. Install system dependencies on Dell R340
  ```bash
  sudo apt update
  sudo apt install -y python3-venv python3-pip postgresql postgresql-contrib nginx nodejs npm
  ```

- [ ] 8. Secure PostgreSQL
  ```bash
  sudo -u postgres psql
  # In PostgreSQL:
  ALTER USER postgres WITH PASSWORD 'strong_password_here';
  CREATE USER tgt_inventory_user WITH PASSWORD 'another_strong_password';
  CREATE DATABASE djapp OWNER tgt_inventory_user;
  GRANT ALL PRIVILEGES ON DATABASE djapp TO tgt_inventory_user;
  \q
  ```

- [ ] 9. Create project directory
  ```bash
  sudo mkdir -p /var/www/tgt_inventory
  sudo chown -R $USER:$USER /var/www/tgt_inventory
  ```

- [ ] 10. Copy project files to server
  ```bash
  # From local machine
  scp -r TGT_Invertory user@server-ip:/var/www/tgt_inventory
  ```

### Phase 3: Backend Setup

- [ ] 11. Setup Python environment
  ```bash
  cd /var/www/tgt_inventory/backend/server
  python3 -m venv venv
  source venv/bin/activate
  pip install -r requirements.txt
  pip install gunicorn
  ```

- [ ] 12. Update environment variables
  - [ ] Ensure .env has production values
  - [ ] Verify DEBUG=False
  - [ ] Verify database credentials match PostgreSQL

- [ ] 13. Run migrations
  ```bash
  python manage.py migrate
  python manage.py collectstatic --noinput
  ```

- [ ] 14. Create superuser
  ```bash
  python manage.py createsuperuser
  # Update role in database:
  python manage.py shell
  from account.models import CustomUser
  user = CustomUser.objects.get(username='admin')
  user.role = 'admin'
  user.save()
  exit()
  ```

- [ ] 15. Create media directory
  ```bash
  sudo mkdir -p /var/www/tgt_inventory/media
  sudo chown -R www-data:www-data /var/www/tgt_inventory/media
  sudo chmod 755 /var/www/tgt_inventory/media
  ```

### Phase 4: Frontend Setup

- [ ] 16. Install frontend dependencies
  ```bash
  cd /var/www/tgt_inventory/frontend
  npm install
  ```

- [ ] 17. Build for production
  ```bash
  npm run build
  ```

- [ ] 18. Test production build
  ```bash
  npm start
  ```

### Phase 5: Nginx & Systemd

- [ ] 19. Setup systemd services
  - [ ] Create `/etc/systemd/system/tgt-django.service`
  - [ ] Create `/etc/systemd/system/tgt-nextjs.service`
  - [ ] Create log directory: `sudo mkdir -p /var/log/tgt_inventory`

- [ ] 20. Configure Nginx
  - [ ] Create `/etc/nginx/sites-available/tgt_inventory`
  - [ ] Enable site: `sudo ln -s /etc/nginx/sites-available/tgt_inventory /etc/nginx/sites-enabled/`
  - [ ] Test config: `sudo nginx -t`
  - [ ] Restart nginx: `sudo systemctl restart nginx`

- [ ] 21. Setup firewall
  ```bash
  sudo bash setup-firewall.sh
  ```

- [ ] 22. Start services
  ```bash
  sudo systemctl daemon-reload
  sudo systemctl enable tgt-django tgt-nextjs
  sudo systemctl start tgt-django tgt-nextjs
  sudo systemctl status tgt-django tgt-nextjs
  ```

### Phase 6: Testing

- [ ] 23. Test API authentication
  ```bash
  # Should return 401 Unauthorized
  curl http://localhost:8000/product/products/

  # Get JWT token
  curl -X POST http://localhost:8000/api/token/ \
    -H "Content-Type: application/json" \
    -d '{"username":"admin","password":"your_password"}'

  # Should work with token
  curl http://localhost:8000/product/products/ \
    -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
  ```

- [ ] 24. Test frontend access
  ```bash
  curl http://localhost:3000/
  ```

- [ ] 25. Test through nginx
  - [ ] Access http://server-ip in browser
  - [ ] Verify login page loads
  - [ ] Test login functionality
  - [ ] Verify dashboard loads after login
  - [ ] Test product creation/editing
  - [ ] Test file uploads

### Phase 7: Security Verification

- [ ] 26. Run security checklist
  ```bash
  # Check DEBUG is False
  grep "DEBUG=False" /var/www/tgt_inventory/backend/server/.env

  # Check SECRET_KEY is changed
  grep "SECRET_KEY" /var/www/tgt_inventory/backend/server/.env
  # Should NOT be: 3@$h6l2l6sq6_$jmt8b0#ctyr-%q9369qdc^uu@l+4w%#@a+h*

  # Check CORS is restricted
  grep "CORS_ALLOW_ALL_ORIGINS=False" /var/www/tgt_inventory/backend/server/.env

  # Check database password is changed
  grep "DB_PASSWORD" /var/www/tgt_inventory/backend/server/.env
  # Should NOT be: 1234

  # Check firewall is enabled
  sudo ufw status
  ```

- [ ] 27. Test unauthorized access is blocked
  - [ ] API returns 401 without token
  - [ ] Direct access to port 8000 blocked
  - [ ] Direct access to port 3000 blocked
  - [ ] PostgreSQL port 5432 blocked

### Phase 8: Monitoring & Backup

- [ ] 28. Setup log rotation
  ```bash
  sudo nano /etc/logrotate.d/tgt_inventory
  # Add configuration from deployment guide
  ```

- [ ] 29. Setup database backups
  ```bash
  sudo nano /usr/local/bin/backup-tgt-db.sh
  # Add backup script from deployment guide
  sudo chmod +x /usr/local/bin/backup-tgt-db.sh
  # Add to crontab
  ```

- [ ] 30. Setup health monitoring
  - [ ] Create health check script
  - [ ] Add to crontab (every 5 minutes)

---

## Post-Deployment

- [ ] 31. Document server credentials (in secure location)
  - [ ] Server IP address
  - [ ] Database password
  - [ ] Django SECRET_KEY
  - [ ] Admin username/password
  - [ ] iDRAC credentials

- [ ] 32. Setup SSL/HTTPS (Recommended)
  - [ ] Obtain SSL certificate (Let's Encrypt)
  - [ ] Update Nginx configuration for HTTPS
  - [ ] Force HTTPS redirect
  - [ ] Update CORS and ALLOWED_HOSTS for HTTPS

- [ ] 33. Test from client machines
  - [ ] Access from LAN
  - [ ] Test barcode scanner integration
  - [ ] Test file uploads
  - [ ] Test all export formats

---

## Rollback Plan

If deployment fails:

1. Check service logs:
   ```bash
   sudo journalctl -u tgt-django -f
   sudo journalctl -u tgt-nextjs -f
   sudo tail -f /var/log/nginx/error.log
   ```

2. Restart services:
   ```bash
   sudo systemctl restart tgt-django tgt-nextjs nginx
   ```

3. Check database connection:
   ```bash
   cd /var/www/tgt_inventory/backend/server
   source venv/bin/activate
   python manage.py dbshell
   ```

4. Verify file permissions:
   ```bash
   ls -la /var/www/tgt_inventory/media
   ```

---

## Success Criteria

- ✅ All API endpoints require JWT authentication
- ✅ CORS restricted to specific origins
- ✅ Firewall blocks direct access to Django/Next.js/PostgreSQL
- ✅ DEBUG=False in production
- ✅ All secrets rotated from defaults
- ✅ Services auto-start on boot
- ✅ Logs are being written
- ✅ Backups are configured
- ✅ Application accessible through nginx
- ✅ Login works correctly
- ✅ CRUD operations work
- ✅ File uploads work
