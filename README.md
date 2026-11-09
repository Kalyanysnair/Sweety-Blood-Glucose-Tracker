# Sweety – Blood Glucose Tracker

A full-stack personal blood glucose tracking web application built with **React.js (Vite)**, **Node.js (Express)**, and **PostgreSQL**, developed as a technical assignment.

Sweety empowers individuals to monitor their blood glucose levels across four designated daily time slots, visualize daily fluctuations and historical trends, and gain actionable health insights through detailed daily, month-to-date, and previous-month reports.

---

## Technology Stack

### Frontend
- **Framework**: React.js with [Vite](https://vitejs.dev/)
- **Language**: JavaScript (ES Modules)
- **Routing**: [React Router](https://reactrouter.com/) (v7)
- **HTTP Client**: [Axios](https://axios-http.com/) with centralized interceptors
- **Data Visualization**: [Recharts](https://recharts.org/) for responsive charts
- **Icons**: [Lucide React](https://lucide.dev/)
- **Styling**: Modern, responsive CSS with a calm healthcare palette (accessible contrast, card-based metrics, readable typography, responsive layouts)

### Backend
- **Runtime & Framework**: Node.js & [Express.js](https://expressjs.com/)
- **Database**: PostgreSQL with the native [`pg`](https://node-postgres.com/) driver and connection pooling
- **Security**: 
  - `bcrypt` for one-way password hashing (10 salt rounds)
  - `jsonwebtoken` (JWT) for stateless bearer authentication
  - Parameterized SQL queries throughout to eliminate SQL injection
  - CORS middleware configured for restricted client origins
- **Validation**: `express-validator` with centralized request validation (strictly enforcing string types for credentials)
- **Configuration**: `dotenv` for environment configuration

### Testing
- **Test Framework**: [Jest](https://jestjs.io/)
- **Integration Testing**: [Supertest](https://github.com/ladjs/supertest)
- **Database**: Dedicated, isolated test database (`sweety_test_db`)

---

## Project Architecture

The project is structured into three clean, separated domains:

```text
Sweety/
├── client/                     # React Frontend (Vite)
│   ├── src/
│   │   ├── api/                # Axios instance & API client modules (auth, readings, reports)
│   │   ├── components/         # Reusable UI components (Navbar, ReadingModal, StatCard, GlucoseBadge, EmptyState, ProtectedRoute)
│   │   ├── context/            # AuthContext (authentication state, token management, session persistence)
│   │   ├── pages/              # Page components (Login, Register, Dashboard, Readings, DailyReport, MonthToDateReport, MonthlyReport)
│   │   ├── styles/             # Healthcare design system & responsive CSS
│   │   ├── App.jsx             # Router layout & route definitions
│   │   └── main.jsx            # Entry point
│   ├── index.html
│   ├── package.json
│   └── vite.config.js          # Vite config with optimized manual vendor chunking & proxy
│
├── server/                     # Express REST API
│   ├── src/
│   │   ├── config/             # Database connection pool (pg.Pool)
│   │   ├── controllers/        # Business logic (authController, readingsController, reportsController)
│   │   ├── middleware/         # Auth verification, validator handler, centralized error handler
│   │   ├── routes/             # Express routes (authRoutes, readingsRoutes, reportsRoutes, index)
│   │   ├── utils/              # Express-validator chains & calendar date calculation helpers
│   │   ├── app.js              # Express application assembly (exported for testing)
│   │   └── server.js           # Server bootstrap and port listener
│   ├── tests/                  # Automated integration tests (auth, readings, reports, setup)
│   ├── package.json
│   └── .env.example
│
├── database/                   # PostgreSQL DDL and Seeding
│   ├── schema.sql              # Database schema, table definitions, constraints, and indexes
│   └── seed.js                 # Database seeder with Mallu demo users and realistic historical readings
│
├── .env.example                # Root environment variable template
├── .gitignore                  # Git ignore rules
├── package.json                # Root workspace convenience scripts
└── README.md                   # Comprehensive project documentation
```

---

## Features

### 1. Authentication & Security
- **Strict String Authentication**: Validates that all passwords, names, and emails are strictly string types. Prevents type coercion attacks and rejects numbers or objects passed as credentials.
- **Secure Password Hashing**: Passwords (such as `KKrds3j9#K`) are encrypted using `bcrypt` (10 rounds) before persisting. Plaintext passwords are never stored or logged.
- **Login & JWT**: Stateless login returning a signed JWT token valid for 24 hours.
- **Protected Routes**: Custom authentication middleware (`authenticateToken`) validates bearer tokens on private API endpoints.
- **User Data Isolation**: Queries strictly enforce `user_id = req.user.id`. Users can only view, create, edit, or delete their own readings.
- **Credential Protection**: Password hashes are stripped from all API responses.

### 2. Glucose Reading Management
- **Reading Attributes**:
  - `reading_date` (Date, `YYYY-MM-DD`)
  - `time_slot` (One of the four allowed slots)
  - `glucose_value` (Whole integer in mg/dl)
- **Allowed Time Slots**:
  1. `Morning (fasting)`
  2. `After breakfast`
  3. `After lunch`
  4. `After dinner`
- **Validation Rules**:
  - `glucose_value` is required and must be a whole integer between **40 and 600** mg/dl (enforced at both application and PostgreSQL `CHECK` constraint levels).
  - Only one reading allowed per time slot per user per date.
  - Maximum four readings per day allowed.
  - Reading date cannot be in the future relative to the current calendar date.
- **Duplicate Prevention**: Enforced in PostgreSQL via `UNIQUE (user_id, reading_date, time_slot)` and caught by the centralized error handler returning a clear HTTP 409 message.
- **CRUD Operations**: Complete support to add, view, filter, edit, and delete readings.

### 3. Reports & Analytics
- **Daily Report** (`/reports/daily`):
  - Target date selection (defaults to today).
  - Highest reading, lowest reading, reading count.
  - Average glucose level rounded to **one decimal place**.
  - Interactive bar chart showing reading values across each time slot.
  - Table of individual readings with timestamps and clinical range classification badges.
  - Friendly empty state when no readings exist for the date.
- **Month-to-Date Report** (`/reports/month-to-date`):
  - Calculates cumulative statistics from the first day of the selected month (`YYYY-MM-01`) through the selected date.
  - Highest, lowest, average (rounded to 1 decimal place), and total count.
  - Visual trend line chart displaying daily average levels with clinical reference thresholds.
  - Day-by-day aggregated breakdown table.
- **Monthly Report** (`/reports/monthly`):
  - Analyzes the **entire previous calendar month** relative to the selected date.
  - Target month badge showing the exact date boundaries.
  - Highest, lowest, average, and count for that entire calendar month.
  - Day-by-day historical chart and table.
  - Friendly empty state when no historical readings exist.

---

## Database Design

The PostgreSQL database comprises two main tables created via `database/schema.sql`:

### `users` Table
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `SERIAL` | `PRIMARY KEY` | Unique user identifier |
| `name` | `VARCHAR(100)` | `NOT NULL` | User full name |
| `email` | `VARCHAR(255)` | `NOT NULL UNIQUE` | Unique email address (lowercased) |
| `password_hash` | `VARCHAR(255)` | `NOT NULL` | bcrypt-hashed password |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT CURRENT_TIMESTAMP` | Account creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | `DEFAULT CURRENT_TIMESTAMP` | Last updated timestamp |

### `readings` Table
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `SERIAL` | `PRIMARY KEY` | Unique reading identifier |
| `user_id` | `INTEGER` | `NOT NULL REFERENCES users(id) ON DELETE CASCADE` | Foreign key referencing owner |
| `reading_date` | `DATE` | `NOT NULL` | Reading date (`YYYY-MM-DD`) |
| `time_slot` | `VARCHAR(50)` | `NOT NULL CHECK (time_slot IN (...))` | One of four allowed slots |
| `glucose_value` | `INTEGER` | `NOT NULL CHECK (glucose_value >= 40 AND glucose_value <= 600)` | Value in mg/dl |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT CURRENT_TIMESTAMP` | Logged timestamp |
| `updated_at` | `TIMESTAMPTZ` | `DEFAULT CURRENT_TIMESTAMP` | Last update timestamp |

### Integrity Constraints & Indexes
- **Unique Constraint**: `CONSTRAINT uq_user_reading_slot UNIQUE (user_id, reading_date, time_slot)` guarantees that a user cannot insert duplicate readings for the same time slot on the same date.
- **Check Constraints**:
  - `chk_time_slot`: Ensures slot string is exactly one of the 4 allowed values.
  - `chk_glucose_value`: Ensures value is an integer between 40 and 600 inclusive.
- **Indexes**:
  - `idx_users_email` on `users(email)` for fast authentication lookups.
  - `idx_readings_user_date` on `readings(user_id, reading_date DESC)` for fast dashboard and report aggregation queries.
  - `idx_readings_user_date_slot` on `readings(user_id, reading_date, time_slot)` for instant duplicate checks.

---

## Demo Credentials (Mallu Profiles)

For testing and demonstration, use the pre-seeded accounts:

| User Name | Email | Password | Pre-seeded Records | Role |
| :--- | :--- | :--- | :--- | :--- |
| **Kalyani Nikunjam** | `kalyany.nikunjam@gmail.com` | `KKrds3j9#K` | 13 readings across Today, Earlier this Month, and Previous Month | **Primary Demo User** |
| **Kalyani Sanal** | `kalyanysanal@gmail.com` | `KKrds3j9#K` | 1 reading (used to test multi-tenant data privacy) | **Secondary User** |

*Tip: On the login page, you can click the **"Fill Demo"** button to automatically populate Kalyani Nikunjam's credentials (`kalyany.nikunjam@gmail.com` / `KKrds3j9#K`).*

---

## Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher (v20.x recommended)
- **npm**: v9.x or higher
- **PostgreSQL**: v14.x or higher

### Step 1: Database Setup
Both databases (`sweety_db` and `sweety_test_db`) are pre-configured. To reapply the schema or re-seed:
```bash
# Schema migration
psql -U postgres -d sweety_db -f database/schema.sql
psql -U postgres -d sweety_test_db -f database/schema.sql

# Seed Mallu demo accounts
node database/seed.js
```

### Step 2: Environment Configuration
Ensure `server/.env` is configured:
```ini
PORT=5000
NODE_ENV=development
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/sweety_db
TEST_DATABASE_URL=postgresql://postgres:your_password@localhost:5432/sweety_test_db
JWT_SECRET=sweety_blood_glucose_tracker_jwt_secret_key_2026!
JWT_EXPIRES_IN=24h
CLIENT_URL=http://localhost:5173
```

### Step 3: Run the Application

#### Terminal 1: Backend Server
```bash
cd server
npm run dev
# or: npm start
```
*API running on [http://localhost:5000](http://localhost:5000).*

#### Terminal 2: Frontend Client
```bash
cd client
npm run dev
```
*Vite React client running on [http://localhost:5173](http://localhost:5173).*

### Step 4: Run Automated Tests
```bash
cd server
npm test
```
*Runs all 32 tests across authentication, readings, and reports.*
