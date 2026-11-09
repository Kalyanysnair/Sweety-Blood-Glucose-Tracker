# Sweety – Blood Glucose Tracker

A full-stack blood glucose tracking web application built with **React.js (Vite)**, **Node.js (Express)**, and **PostgreSQL** as part of a technical assignment.

Sweety allows users to log blood glucose readings across four daily time slots, view trends on a dashboard, and generate daily, month-to-date, and previous-month reports.

---

## Technology Stack

### Frontend
- **Framework**: React.js with [Vite](https://vitejs.dev/)
- **Language**: JavaScript (ES Modules)
- **Routing**: [React Router](https://reactrouter.com/) (v7)
- **HTTP Client**: [Axios](https://axios-http.com/)
- **Data Visualization**: [Recharts](https://recharts.org/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Styling**: Responsive CSS with healthcare theme styling

### Backend
- **Runtime & Framework**: Node.js & [Express.js](https://expressjs.com/)
- **Database**: PostgreSQL with the native [`pg`](https://node-postgres.com/) driver and connection pooling
- **Authentication & Security**:
  - `bcrypt` for password hashing (10 salt rounds)
  - `jsonwebtoken` (JWT) for authentication tokens (24h validity)
  - Parameterized SQL queries to prevent SQL injection
  - CORS middleware configured for the client origin
- **Validation**: `express-validator` to validate request inputs (ensuring strings for passwords, names, and emails)
- **Configuration**: `dotenv` for environment variables

### Testing
- **Test Runner**: [Jest](https://jestjs.io/)
- **API Testing**: [Supertest](https://github.com/ladjs/supertest)
- **Database**: Dedicated test database (`sweety_test_db`)

---

## Project Structure

```text
Sweety/
├── client/                     # React frontend (Vite)
│   ├── src/
│   │   ├── api/                # API client calls (auth, readings, reports)
│   │   ├── components/         # Reusable UI components (Navbar, ReadingModal, StatCard, etc.)
│   │   ├── context/            # AuthContext (login state and token storage)
│   │   ├── pages/              # Page views (Login, Register, Dashboard, Readings, Reports)
│   │   ├── styles/             # CSS stylesheets
│   │   ├── App.jsx             # Router and route setup
│   │   └── main.jsx            # Frontend entry point
│   ├── index.html
│   ├── package.json
│   └── vite.config.js          # Vite configuration
│
├── server/                     # Express backend API
│   ├── src/
│   │   ├── config/             # Database connection pool
│   │   ├── controllers/        # Route controllers (auth, readings, reports)
│   │   ├── middleware/         # Auth, validation, and error handling middleware
│   │   ├── routes/             # API routes
│   │   ├── utils/              # Validators and date calculation helpers
│   │   ├── app.js              # Express app setup (exported for tests)
│   │   └── server.js           # Server listener
│   ├── tests/                  # Integration tests (auth, readings, reports)
│   ├── package.json
│   └── .env.example
│
├── database/                   # Database scripts
│   ├── schema.sql              # Table definitions, constraints, and indexes
│   └── seed.js                 # Seed script with demo users and sample readings
│
├── .env.example                # Root environment template
├── .gitignore                  # Git ignore rules
├── package.json                # Root convenience scripts
└── README.md                   # Project documentation
```

---

## Features

### 1. Authentication & Security
- **Registration and Login**: Users can register with name, email, and password, and log in to receive a JWT.
- **Password Hashing**: Passwords are securely hashed using `bcrypt` (10 salt rounds) before storing. Plaintext passwords are never stored in the database.
- **Input Validation**: Request bodies are validated using `express-validator`. Passwords, names, and emails must be non-empty strings.
- **Protected Routes**: An authentication middleware (`authenticateToken`) verifies the JWT bearer token on private endpoints.
- **User Data Isolation**: Database queries filter by `user_id = req.user.id` so users can only access their own readings.
- **Email Handling**: Emails are normalized to lowercase while preserving dots in Gmail addresses.

### 2. Reading Management
- **Reading Fields**:
  - `reading_date` (Date, `YYYY-MM-DD`)
  - `time_slot` (one of the 4 allowed slots)
  - `glucose_value` (whole number in mg/dl)
- **Allowed Time Slots**:
  1. `Morning (fasting)`
  2. `After breakfast`
  3. `After lunch`
  4. `After dinner`
- **Validation Rules**:
  - Glucose value must be an integer between 40 and 600 mg/dl (checked in validator and via database `CHECK` constraint).
  - Date cannot be in the future.
  - Only one reading allowed per time slot per user per date (enforced by a PostgreSQL unique constraint on `user_id, reading_date, time_slot`).
  - Maximum of 4 readings per day per user.
- **CRUD Operations**: Add, view, filter by date range, edit, delete, and export readings to CSV.

### 3. Reports
- **Daily Report** (`/reports/daily`):
  - Shows highest reading, lowest reading, total count, and average glucose value (rounded to 1 decimal place) for a selected date.
  - Bar chart showing readings across the daily time slots.
  - Table of readings with status badges.
  - Shows an empty message if no readings exist for that date.
- **Month-to-Date Report** (`/reports/month-to-date`):
  - Calculates highest, lowest, average (rounded to 1 decimal place), and count from the 1st of the month through the selected date.
  - Line chart showing daily average glucose trend.
  - Daily breakdown table.
- **Monthly Report** (`/reports/monthly`):
  - Calculates statistics for the entire previous calendar month relative to the selected date.
  - Shows highest, lowest, average (rounded to 1 decimal place), and total count for that month.
  - Daily trend chart and summary table.

---

## Database Design

The schema is defined in `database/schema.sql` with two tables:

### `users` Table
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `SERIAL` | `PRIMARY KEY` | User ID |
| `name` | `VARCHAR(100)` | `NOT NULL` | Full name |
| `email` | `VARCHAR(255)` | `NOT NULL UNIQUE` | Email address |
| `password_hash` | `VARCHAR(255)` | `NOT NULL` | bcrypt hash |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT CURRENT_TIMESTAMP` | Account creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | `DEFAULT CURRENT_TIMESTAMP` | Last updated timestamp |

### `readings` Table
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `SERIAL` | `PRIMARY KEY` | Reading ID |
| `user_id` | `INTEGER` | `NOT NULL REFERENCES users(id) ON DELETE CASCADE` | Owner user ID |
| `reading_date` | `DATE` | `NOT NULL` | Reading date (`YYYY-MM-DD`) |
| `time_slot` | `VARCHAR(50)` | `NOT NULL CHECK (time_slot IN (...))` | Time slot name |
| `glucose_value` | `INTEGER` | `NOT NULL CHECK (glucose_value >= 40 AND glucose_value <= 600)` | Value in mg/dl |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT CURRENT_TIMESTAMP` | Created timestamp |
| `updated_at` | `TIMESTAMPTZ` | `DEFAULT CURRENT_TIMESTAMP` | Updated timestamp |

### Constraints and Indexes
- **Unique Constraint**: `CONSTRAINT uq_user_reading_slot UNIQUE (user_id, reading_date, time_slot)` prevents duplicate entries for the same slot on the same day.
- **Check Constraints**:
  - `chk_time_slot`: Ensures slot matches one of the 4 allowed time slots.
  - `chk_glucose_value`: Ensures value is an integer between 40 and 600.
- **Indexes**:
  - `idx_users_email` on `users(email)` for login queries.
  - `idx_readings_user_date` on `readings(user_id, reading_date DESC)` for dashboard and reports.
  - `idx_readings_user_date_slot` on `readings(user_id, reading_date, time_slot)` for duplicate lookups.

---

## Demo Accounts

The database seed script sets up two demo accounts:

| Name | Email | Password | Notes |
| :--- | :--- | :--- | :--- |
| **Kalyany Nikunjam** | `kalyany.nikunjam@gmail.com` | `KKrds3j9#K` | Has 13 sample readings across current and previous months for testing reports. |
| **Kalyany Sanal** | `kalyanysanal@gmail.com` | `KKrds3j9#K` | Has 1 sample reading to test that users cannot see each other's data. |

*Note: The login page has a **"Fill Demo"** button to automatically fill Kalyany Nikunjam's login credentials.*

---

## Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.x or higher
- **PostgreSQL**: v14.x or higher

### Step 1: Database Setup
Make sure PostgreSQL is running, then create the development and test databases:
```bash
# Using createdb CLI
createdb -U postgres sweety_db
createdb -U postgres sweety_test_db
```
*(Or in `psql`: `CREATE DATABASE sweety_db; CREATE DATABASE sweety_test_db;`)*

Apply the schema and seed the initial data:
```bash
# Schema migration
psql -U postgres -d sweety_db -f database/schema.sql
psql -U postgres -d sweety_test_db -f database/schema.sql

# Seed demo users and readings
node database/seed.js
```

### Step 2: Environment Configuration
Copy `server/.env.example` to `server/.env`:
```bash
cp server/.env.example server/.env
# On Windows PowerShell:
Copy-Item server/.env.example server/.env
```

Update `server/.env` with your PostgreSQL password:
```ini
PORT=5000
NODE_ENV=development
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/sweety_db
TEST_DATABASE_URL=postgresql://postgres:your_password@localhost:5432/sweety_test_db
JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRES_IN=24h
CLIENT_URL=http://localhost:5173
```

### Step 3: Run the Application

#### Backend (Terminal 1)
```bash
cd server
npm run dev
# or: npm start
```
*API runs at http://localhost:5000.*

#### Frontend (Terminal 2)
```bash
cd client
npm run dev
```
*Frontend runs at http://localhost:5173.*

### Step 4: Run Automated Tests
```bash
cd server
npm test
```
*Runs all 36 tests across authentication, readings, and reports.*
