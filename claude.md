# TGT Inventory System - Project Documentation

## Overview
TGT_Inventory is a full-stack inventory management web application designed for tracking products through barcode scanning. The system allows users to scan barcodes, store product information, and manage inventory with various export capabilities.

## Architecture

### Tech Stack
- **Backend**: Django 5.1.6 + Django REST Framework
- **Frontend**: Next.js (latest) with TypeScript, React 18
- **Database**: PostgreSQL
- **Authentication**: NextAuth.js with Credentials Provider
- **UI Framework**: TailwindCSS, Ant Design (antd)
- **Export Libraries**: xlsx, @react-pdf/renderer, file-saver

### Project Structure
```
TGT_Invertory/
├── backend/
│   └── server/
│       ├── account/          # User authentication and management
│       ├── product/          # Product and inventory management
│       ├── server/           # Django settings and configuration
│       ├── manage.py
│       └── requirements.txt
└── frontend/
    ├── app/
    │   ├── api/             # API routes
    │   ├── dashboard/       # Main inventory dashboard
    │   ├── lib/             # Utilities and export functions
    │   └── ui/              # React components
    ├── interface/           # TypeScript interfaces
    ├── types/               # Type definitions
    ├── utils/               # Helper utilities
    └── package.json
```

## Backend (Django)

### Database Configuration
- **Engine**: PostgreSQL
- **Database Name**: djapp
- **Default User**: postgres
- **Port**: 5432
- **Media Storage**: D:\workplace\Images (configurable in settings.py)

### Applications

#### 1. Account App
**Purpose**: User authentication and role-based access control

**Models**:
- `CustomUser` (extends AbstractUser)
  - Fields: username, password, role
  - Roles: admin, manager, vz_user, r2_user, n_user

**Key Endpoints**:
- `GET /account/users/` - List users (with optional role/username filter)
- `POST /account/users/` - Authenticate user (login)
- `POST /account/create/` - Create new user

#### 2. Product App
**Purpose**: Core inventory management

**Models**:
- `Product`
  - id (auto-generated)
  - number: CharField (optional)
  - barcode: CharField (required)
  - qty: IntegerField (default: 0)
  - date: DateField (required) - inbound date
  - vender: CharField (optional)
  - client: CharField (optional)
  - category: CharField (optional) - '1'=SSD-大, '2'=RAM, '3'=SSD-顆
  - so_number: CharField (required)
  - weight: IntegerField (default: 0)
  - noted: TextField (optional)
  - current_status: CharField - '0'=入庫(inbound), '1'=出貨(outbound)
  - ex_date: DateField (optional) - outbound/export date

- `Photo`
  - id (auto-generated)
  - product: ForeignKey to Product
  - path: ImageField (filename stored in DB, actual file in MEDIA_ROOT)

**Key Endpoints**:
- `GET /product/products/` - List products (with search, sorting, pagination)
  - Query params: search, id, sortField, sortOrder, page
  - Pagination: 100 items per page
- `POST /product/products/` - Create product(s) (bulk creation supported)
- `PUT /product/products/<id>/` - Update product
- `DELETE /product/products/<id>/` - Delete product
- `GET /product/export/` - Get all products for export (with search & category filters)
- `POST /product/batch_update_status/` - Batch update product status
- `POST /product/scanner/` - Zebra scanner API for inbound/outbound operations

**Scanner API** (`/product/scanner/`):
- `action=find_so_number` - Find SO number by barcode
- `action=inbound` - Create new product with photos (sets current_status='0')
- `action=outbound` - Update products by SO number, set ex_date and current_status='1', add photos

### Key Features
- **Pagination**: 100 items per page (StandardPagination)
- **Search**: Supports filtering by barcode, number, qty, date
- **Photo Management**: Multiple photos per product, stored in local filesystem
- **Bulk Operations**: Batch creation and status updates
- **CORS**: Enabled for all origins (CORS_ALLOW_ALL_ORIGINS = True)

## Frontend (Next.js)

### Environment Variables (.env.local)
```
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<generated-secret>
NEXT_PUBLIC_Django_API_URL=http://localhost:8000
```

### Authentication Flow
1. User submits login form → POST `/api/auth/callback/credentials`
2. NextAuth calls `authorize()` function in CredentialsProvider
3. Backend validates credentials via `POST ${API_URL}/account/users/`
4. JWT callback stores user role in token
5. Session callback makes role available to frontend
6. Session cookie stored as `next-auth.session`

**Middleware**: `middleware.ts` uses `withAuth` to check authentication before every request

### Main Pages

#### Dashboard (`/dashboard`)
- **Purpose**: Main inventory view with search, filtering, and export
- **Features**:
  - Product statistics (total, by category)
  - Paginated product table (100 items/page)
  - Real-time search
  - Category filtering (SSD-大, SSD-顆, RAM)
  - Multiple export formats

#### Create Page (`/dashboard/create`)
- **Purpose**: Add new products to inventory
- **Features**: Form for single/bulk product creation with photo upload

#### Edit Page (`/dashboard/[id]/edit`)
- **Purpose**: Edit existing product details
- **Features**: Update product fields, manage photos (add/delete)

### Export Capabilities
The system supports multiple specialized export formats:

1. **exportExcel.ts** - Standard Excel export with all product fields
2. **exportInbound.ts** - PDF format for inbound documentation
3. **exportOutbound.ts** - PDF format for outbound/shipping documentation
4. **exportDestruction.ts** - Destruction record format
5. **exportRam.ts** - RAM-specific export
6. **exportDiagnosticRam.ts** - RAM diagnostic report
7. **exportAppearance.ts** - Product appearance inspection
8. **exportCheck.ts** - General inspection checklist
9. **exportRepair.ts** - Repair documentation
10. **exportTicket.ts** - Ticket format export
11. **exportWipOS.ts** - WIP/OS specific format

### Key Components
- `Table` - Main product table with inline editing, sorting, filtering
- `ClientActionBar` - Search, filter, and export controls
- `Pagination` - Page navigation
- `create-form` - Product creation form with photo upload
- `edit-form` - Product editing form

### Data Flow
1. Frontend fetches data via `lib/data.ts` functions
2. `getProducts()` - Fetches paginated products
3. `getAllProductsForExport()` - Fetches all products for export
4. `fetchProductsTotalPage()` - Gets total page count
5. All functions call Django REST API endpoints

## Database Schema

### Product Table
```sql
CREATE TABLE product (
  id SERIAL PRIMARY KEY,
  number VARCHAR(50),
  barcode VARCHAR(50) NOT NULL,
  qty INTEGER DEFAULT 0,
  date DATE NOT NULL,
  vender VARCHAR(10),
  client VARCHAR(10),
  category VARCHAR(20),
  so_number VARCHAR(100) NOT NULL,
  weight INTEGER DEFAULT 0,
  noted TEXT,
  current_status VARCHAR(1) DEFAULT '0',
  ex_date DATE
);
```

### Photo Table
```sql
CREATE TABLE photo (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES product(id) ON DELETE CASCADE,
  path VARCHAR(255)  -- filename only, stored in MEDIA_ROOT
);
```

### Account Table
```sql
CREATE TABLE account_customuser (
  id SERIAL PRIMARY KEY,
  username VARCHAR(150) UNIQUE NOT NULL,
  password VARCHAR(128) NOT NULL,
  role VARCHAR(10) DEFAULT 'n_user',
  -- other AbstractUser fields...
);
```

## Setup Instructions

### Backend Setup
1. Navigate to `backend/server`
2. Create virtual environment: `python -m venv venv`
3. Activate: `venv\Scripts\activate` (Windows) or `source venv/bin/activate` (Mac/Linux)
4. Install dependencies: `pip install -r requirements.txt`
5. Configure PostgreSQL database in `server/settings.py`
6. Run migrations: `python manage.py migrate`
7. Fix sequence if needed: `SELECT setval('product_id_seq', (SELECT MAX(id) FROM product));`
8. Create superuser: `python manage.py createsuperuser`
9. Update user role: `UPDATE account_customuser SET role = 'admin' WHERE username = 'admin';`
10. Start server: `python manage.py runserver` (or `python manage.py runserver 0.0.0.0:8000`)

### Frontend Setup
1. Navigate to `frontend`
2. Install dependencies: `npm install`
3. Create `.env.local` with required variables (see Environment Variables section)
4. Generate NEXTAUTH_SECRET:
   - Install OpenSSL: `choco install openssl` (Windows PowerShell)
   - Generate: `openssl rand -base64 32`
   - Add to `.env.local`
5. Start dev server: `npm run dev`

### Running the Application
- Backend runs on: http://localhost:8000
- Frontend runs on: http://localhost:3000
- Admin panel: http://localhost:8000/admin

## Key Workflows

### Inbound Workflow (入庫)
1. Scan barcode with Zebra scanner
2. Scanner sends POST to `/product/scanner/` with `action=inbound`
3. Payload: date, barcode, so_number, weight, photos, noted
4. System creates new Product with `current_status='0'`
5. Photos saved to `D:\workplace\Images` with naming: `{so_number}_{idx}.{ext}`

### Outbound Workflow (出貨)
1. Scan barcode to get SO number
2. Scanner sends POST to `/product/scanner/` with `action=outbound`
3. Payload: so_number, photos
4. System updates all products with matching so_number:
   - Sets `ex_date` to today
   - Sets `current_status='1'`
5. Additional photos attached to latest product

### Export Workflow
1. User selects products/filters on dashboard
2. Clicks export button with desired format
3. Frontend calls appropriate export function
4. System fetches data via `/product/export/` endpoint
5. Generates file (Excel/PDF) and triggers download

## API Reference

### Product Endpoints
```
GET    /product/products/                    # List products (paginated)
POST   /product/products/                    # Create product(s)
GET    /product/products/<id>/               # Get product by ID
PUT    /product/products/<id>/               # Update product
DELETE /product/products/<id>/               # Delete product
GET    /product/export/                      # Export products
POST   /product/batch_update_status/         # Batch update
POST   /product/scanner/                     # Scanner API
```

### Account Endpoints
```
GET    /account/users/                       # List users
POST   /account/users/                       # Authenticate
POST   /account/create/                      # Create user
```

## Configuration Notes

### Important Settings
- **MEDIA_ROOT**: `D:\workplace\Images` - Update for your environment
- **ALLOWED_HOSTS**: `['*']` - Restrict in production
- **DEBUG**: `True` - Set to False in production
- **SECRET_KEY**: Change in production
- **CORS**: Currently allows all origins - restrict in production

### Security Considerations
- Implement proper authentication middleware
- Restrict CORS origins in production
- Use environment variables for sensitive data
- Implement rate limiting for API endpoints
- Validate file uploads (size, type)
- Use HTTPS in production

## Category Reference
- `'1'` - SSD-大 (Large SSD)
- `'2'` - RAM
- `'3'` - SSD-顆 (SSD Units/Chips)

## Status Reference
- `'0'` - 入庫 (Inbound/In Stock)
- `'1'` - 出貨 (Outbound/Shipped)

## Development Notes

### Backend
- Uses Django REST Framework serializers for validation
- Transaction support for bulk operations
- Photo files stored in filesystem, paths in database
- Support for multiple photos per product
- Soft delete not implemented (hard delete only)

### Frontend
- Server-side rendering with Next.js
- Type-safe with TypeScript
- Role-based access control
- Responsive design with TailwindCSS
- Real-time search and filtering
- Optimistic updates for better UX

## Common Operations

### Add New Export Format
1. Create new export function in `frontend/app/lib/exportXXX.ts`
2. Import and add to export menu in `ClientActionBar` component
3. Implement PDF/Excel generation logic
4. Test with sample data

### Add New Product Field
1. Add migration in Django: `python manage.py makemigrations`
2. Apply migration: `python manage.py migrate`
3. Update serializer in `backend/server/product/serializer.py`
4. Update TypeScript interface in `frontend/interface/IDatatable.ts`
5. Update UI components to display/edit new field

### Modify User Roles
1. Update `UserRole` choices in `backend/server/account/models.py`
2. Update role checking logic in middleware/components
3. Apply migrations if needed

## Troubleshooting

### PostgreSQL Sequence Issues
If IDs are not auto-incrementing correctly:
```sql
SELECT setval('product_id_seq', (SELECT MAX(id) FROM product));
```

### Photo Upload Issues
- Check MEDIA_ROOT directory exists and is writable
- Verify `DATA_UPLOAD_MAX_MEMORY_SIZE` setting (currently 50MB)
- Check file permissions on Windows/Linux

### Authentication Issues
- Verify NEXTAUTH_SECRET is set correctly
- Check Django backend is accessible from frontend
- Verify NEXT_PUBLIC_Django_API_URL is correct
- Check CORS settings on Django backend

## Future Enhancements
- Implement soft delete for products
- Add audit logging for inventory changes
- Implement advanced reporting and analytics
- Add barcode generation for new products
- Implement real-time notifications
- Add data backup and restore functionality
- Implement API rate limiting
- Add comprehensive unit and integration tests
