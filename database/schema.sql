-- Sweety: Blood Glucose Tracker Database Schema
-- PostgreSQL 14+

-- Drop existing tables if needed (cascade to drop foreign keys)
DROP TABLE IF EXISTS readings CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Readings table
CREATE TABLE readings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reading_date DATE NOT NULL,
    time_slot VARCHAR(50) NOT NULL,
    glucose_value INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    -- Business rule: Only 4 allowed time slots
    CONSTRAINT chk_time_slot CHECK (
        time_slot IN (
            'Morning (fasting)',
            'After breakfast',
            'After lunch',
            'After dinner'
        )
    ),
    
    -- Business rule: Glucose value between 40 and 600 mg/dl
    CONSTRAINT chk_glucose_value CHECK (
        glucose_value >= 40 AND glucose_value <= 600
    ),
    
    -- Business rule: Only one reading per time slot per user per date
    CONSTRAINT uq_user_reading_slot UNIQUE (user_id, reading_date, time_slot)
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_readings_user_date ON readings(user_id, reading_date DESC);
CREATE INDEX idx_readings_user_date_slot ON readings(user_id, reading_date, time_slot);

