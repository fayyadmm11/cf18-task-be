# SIAK Lite API - Backend

REST API backend untuk SIAK Lite, sebuah sistem informasi akademik modern yang memudahkan pengelolaan courses, grades, IRS, dan RHS untuk mahasiswa dan dosen.

## Tech Stack

- **Runtime**: Node.js
- **Framework**: NestJS 11.0.1 (TypeScript)
- **Database**: PostgreSQL 15 with Drizzle ORM
- **Authentication**: JWT (JSON Web Token) with Passport
- **API Documentation**: Swagger/OpenAPI 11.2.6
- **Validation**: class-validator & class-transformer
- **Testing**: Jest

## Fitur Utama

✅ **Authentication Module** - Login dengan JWT token  
✅ **Courses Management** - CRUD courses dengan jadwal dan kapasitas  
✅ **Grades System** - Input dan tracking nilai mahasiswa  
✅ **IRS (Isian Rencana Studi)** - Registrasi course per semester  
✅ **RHS (Rancangan Hasil Studi)** - Perencanaan learning outcomes  
✅ **Role-Based Access Control** - Berbeda fitur untuk DOSEN vs MAHASISWA  
✅ **API Documentation** - Interactive Swagger UI

## Prasyarat

- Node.js >= 18
- pnpm atau npm (disarankan pnpm)
- PostgreSQL 15+ (atau gunakan Docker)
- Git

## Setup & Installation

### 1. Clone Repository

```bash
git clone <repository-url>
cd cf18-task-be
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Setup Database

#### Option A: Menggunakan Docker (Recommended)

```bash
# Start PostgreSQL container
docker-compose up -d

# Database akan tersedia di:
# Host: localhost
# Port: 5432
# Username: postgres
# Password: password123
# Database: siakng_lite
```

#### Option B: PostgreSQL Lokal

Install PostgreSQL dan buat database:

```sql
CREATE DATABASE siakng_lite;
```

### 4. Environment Configuration

Buat file `.env` berdasarkan `.env.example`:

```bash
cp .env.example .env
```

Edit `.env` sesuai konfigurasi lokal:

```env
# Database
DATABASE_URL=postgresql://postgres:password123@localhost:5432/siakng_lite?schema=public

# JWT
JWT_SECRET=your_secret_key_here

# Server
PORT=3000
```

### 5. Run Database Migration

```bash
# Generate migration files (jika ada schema changes)
pnpm run drizzle:generate

# Run migration
pnpm run drizzle:migrate

# (Optional) Seed database dengan data dummy
pnpm run seed
```

## Running the Application

### Development Mode (dengan auto-reload)

```bash
pnpm run start:dev
```

Server akan berjalan di `http://localhost:3000`

### Production Mode

```bash
# Build
pnpm run build

# Start
pnpm run start:prod
```

### Debug Mode

```bash
pnpm run start:debug
```

## API Documentation

### Swagger UI

Dokumentasi API interactive tersedia di:

```
http://localhost:3000/api
```

**Fitur:**

- 📖 Interactive API documentation
- 🧪 Try It Out - Test endpoint langsung dari browser
- 🔐 Bearer Token authentication
- 📋 Request/Response schema examples
- ⚠️ Error handling documentation

### Menggunakan Swagger

1. **Buka di browser:** `http://localhost:3000/api`

2. **Login untuk protected endpoints:**
   - Klik endpoint `POST /auth/login`
   - Klik "Try it out"
   - Masukkan email dan password
   - Copy `access_token` dari response

3. **Set authorization:**
   - Klik tombol **"Authorize"** (ikon gembok) di atas halaman
   - Paste token: `Bearer <your_token_here>`
   - Klik "Authorize" kemudian "Close"

4. **Test protected endpoints:**
   - Sekarang bisa test semua endpoint yang memerlukan authentication

## Project Structure

```
src/
├── auth/                    # Authentication module
│   ├── dto/
│   │   └── login.dto.ts     # Login request schema
│   ├── guards/
│   │   ├── jwt-auth.guard.ts
│   │   └── roles.guard.ts
│   ├── strategies/
│   │   └── jwt.strategy.ts
│   ├── decorators/
│   │   └── roles.decorator.ts
│   └── auth.controller.ts
│
├── courses/                 # Courses management
│   ├── create-course.dto.ts
│   ├── update-course.dto.ts
│   └── courses.controller.ts
│
├── grades/                  # Grades system
│   ├── input-grades.dto.ts
│   ├── grading.dto.ts
│   └── grades.controller.ts
│
├── irs/                     # IRS module
│   ├── create-irs.dto.ts
│   └── irs.controller.ts
│
├── rhs/                     # RHS module
│   └── rhs.controller.ts
│
├── users/                   # User management
│   └── users.service.ts
│
├── database/                # Database setup
│   ├── schema.ts            # Drizzle ORM schema
│   ├── seed.ts              # Database seeding
│   └── database.module.ts
│
├── app.module.ts            # Main app module
├── main.ts                  # Application entry point
```

## Authentication

### Login Flow

```
1. POST /auth/login dengan email & password
   ↓
2. Server validasi credentials
   ↓
3. Generate JWT token (expires 24h)
   ↓
4. Return access_token & user info
   ↓
5. Client simpan token di localStorage
   ↓
6. Setiap request: Authorization: Bearer <token>
```

### User Roles

- **DOSEN**
  - Create/update/delete courses
  - Input dan publish nilai
  - Access RHS & IRS management

- **MAHASISWA**
  - View courses
  - Register IRS
  - View grades
  - Access learning outcomes

## API Endpoints Overview

### Authentication

```
POST   /auth/login              Login dan dapatkan JWT token
```

### Courses

```
GET    /courses                 Get all courses (with pagination)
GET    /courses/:id             Get course by ID
POST   /courses                 Create course (DOSEN only)
PATCH  /courses/:id             Update course (DOSEN only)
DELETE /courses/:id             Delete course (DOSEN only)
GET    /courses/:courseId/participants  Get course participants (DOSEN only)
```

### Grades

```
POST   /grades/input            Input batch grades
GET    /grades/:studentId       Get student grades
PATCH  /grades/:courseId/publish Publish grades (DOSEN only)
```

### IRS

```
GET    /irs                     Get user IRS
POST   /irs                     Register course to IRS
DELETE /irs/:id                 Remove course from IRS
```

### RHS

```
GET    /rhs                     Get RHS
POST   /rhs                     Create RHS
```

## Testing

### Unit Tests

```bash
pnpm run test
```

### Watch Mode (Run on file change)

```bash
pnpm run test:watch
```

### Coverage Report

```bash
pnpm run test:cov
```

### E2E Tests

```bash
pnpm run test:e2e
```

## Linting & Formatting

### Run ESLint (Auto-fix)

```bash
pnpm run lint
```

### Format Code

```bash
pnpm run format
```

## Database Operations

### Drizzle Studio (GUI Database Explorer)

```bash
pnpm run drizzle-kit studio
```

Membuka browser UI untuk explore dan manage database

### Generate Migration

```bash
pnpm run drizzle:generate
```

### Run Migration

```bash
pnpm run drizzle:migrate
```

### Seed Database

```bash
pnpm run seed
```

Populate database dengan data dummy menggunakan Faker

## Docker Deployment

### Using Docker Compose

```bash
# Start services (PostgreSQL + Backend)
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Konfigurasi docker-compose.yml

Saat ini hanya PostgreSQL yang aktif. Backend bisa di-uncomment untuk production deployment. 
**PENTING:** Konfigurasi ini membaca kredensial dari file `.env`.

```yaml
services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    ports:
      - '5432:5432'
```

## Security Notes

⚠️ **Important Security Reminders:**

1. **JWT_SECRET** - Gunakan secret yang kuat dan random
2. **Database Credentials** - Jangan commit `.env` ke repository
3. **CORS** - Konfigurasi CORS untuk production environment
4. **Rate Limiting** - Pertimbangkan implementasi rate limiting
5. **HTTPS** - Gunakan HTTPS di production

## Troubleshooting

### Error: `Cannot find module 'drizzle-orm'`

```bash
pnpm install
```

### Error: `Database connection failed`

Pastikan:

- PostgreSQL berjalan (`docker-compose up -d`)
- `DATABASE_URL` di `.env` benar
- Port 5432 tidak terblokir

### Error: `JWT token invalid or expired`

- Login ulang untuk mendapatkan token baru
- Periksa `JWT_EXPIRATION` di `.env`

### Swagger documentation tidak muncul

```bash
# Clear cache
rm -rf dist/
pnpm run build
pnpm run start:dev
```

**Last Updated:** March 2026
