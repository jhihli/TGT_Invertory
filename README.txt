cd backend\server
py manage.py runserver

cd frontend
npm run dev


#run This tells PostgreSQL: Start using IDs after the current max.
SELECT setval('product_id_seq', (SELECT MAX(id) FROM product));

#update role vate to admin
UPDATE account_customuser SET role = 'admin' WHERE username = 'admin';

#Run in different latop
1. Install Dependencies and Run Django Backend
navigate to backend/server.
Create a virtual environment: python -m venv venv.
Activate it: venv\Scripts\activate (Windows) or source venv/bin/activate (macOS/Linux).
Install requirements: pip install -r requirements.txt.
Run migrations: python manage.py migrate.
Create a superuser: python manage.py createsuperuser.
Start the server: python manage.py runserver 0.0.0.0:8000.
Verify: Open http://localhost:8000/admin in a browser and log in with superuser credentials.

4. Install Dependencies and Run Next.js Frontend
navigate to /frontend.
Install Node.js dependencies: npm install.
Start the dev server: npm run dev

5create .env.local under frontend, paste below code
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secure-secret-here
NEXT_PUBLIC_Django_API_URL=http://localhost:8000

6 Generate NEXTAUTH_SECRET
a. 'choco install openssl' in PowerShell
b.  generate 'openssl rand -base64 32'
c. pass value into your-secure-secret-here
