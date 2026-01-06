# Quick Start - Testing Security Updates

## ⚡ Test Locally (5 minutes)

### 1. Start Backend
```bash
cd backend/server
./venv/Scripts/python.exe manage.py runserver
```

### 2. Test JWT Authentication

**Get Token**:
```bash
curl -X POST http://localhost:8000/api/token/ ^
  -H "Content-Type: application/json" ^
  -d "{\"username\":\"admin\",\"password\":\"your_password\"}"
```

Save the `access` token from response.

**Test Protected Endpoint** (should fail):
```bash
curl http://localhost:8000/product/products/
```

Expected: `{"detail":"Authentication credentials were not provided."}`

**Test With Token** (should work):
```bash
curl http://localhost:8000/product/products/ ^
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
```

---

## ⚠️ Frontend Update Required

Your frontend will NOT work until updated. Two options:

### Option A: Temporarily Disable Auth (Testing Only)

Edit `backend/server/server/settings.py`:

```python
# Find REST_FRAMEWORK section and change:
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.AllowAny',  # <-- Change from IsAuthenticated
    ],
}
```

**WARNING**: This disables security! Only for development testing.

### Option B: Update Frontend (Recommended)

See `JWT_AUTHENTICATION_GUIDE.md` for full frontend integration code.

---

## 🚀 Deploy to Dell R340

Follow `DEPLOYMENT_CHECKLIST.md` step-by-step.

**Before deploying**:
1. ✅ Generate new SECRET_KEY
2. ✅ Generate new NEXTAUTH_SECRET
3. ✅ Change DB_PASSWORD
4. ✅ Set DEBUG=False
5. ✅ Update ALLOWED_HOSTS
6. ✅ Update CORS_ALLOWED_ORIGINS
7. ✅ Test frontend works with JWT

---

## 📁 Files Created

| File | What It Does |
|------|--------------|
| `DEPLOYMENT_CHECKLIST.md` | Step-by-step deployment guide |
| `JWT_AUTHENTICATION_GUIDE.md` | How to use JWT tokens |
| `SECURITY_UPDATES_SUMMARY.md` | What changed |
| `setup-firewall.sh` | Firewall setup script |
| `.env.production.template` | Production config template |

---

## 🆘 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| API returns 401 | Missing/invalid JWT token - see JWT_AUTHENTICATION_GUIDE.md |
| CORS error | Add frontend URL to CORS_ALLOWED_ORIGINS in .env |
| Frontend broken | Update to use JWT tokens or temporarily disable auth |
| "Module not found" | Run `pip install -r requirements.txt` |

---

## Next Steps

1. ✅ Test JWT authentication locally
2. ✅ Update frontend to use JWT
3. ✅ Follow deployment checklist
4. ✅ Deploy to Dell R340
5. ✅ Run security verification

Good luck with your deployment! 🚀
