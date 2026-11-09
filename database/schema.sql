-- ============================================================
-- Evatho Matrix Security Limited
-- Database Schema (Foundation & Core Tables)
-- ============================================================

-- 1. System Metadata Table
CREATE TABLE IF NOT EXISTS app_metadata (
    id SERIAL PRIMARY KEY,
    key VARCHAR(50) UNIQUE NOT NULL,
    value TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO app_metadata (key, value)
VALUES 
    ('app_name', 'Evatho Matrix Security Limited'),
    ('version', '1.1.0'),
    ('environment', 'production')
ON CONFLICT (key) DO NOTHING;

-- 2. Contact & Security Consultation Inquiries Table
CREATE TABLE IF NOT EXISTS contact_inquiries (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(254) NOT NULL,
    phone VARCHAR(50),
    service VARCHAR(100),
    facility_type VARCHAR(100),
    message TEXT NOT NULL,
    status VARCHAR(30) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE contact_inquiries
    ALTER COLUMN email TYPE VARCHAR(254);

-- ============================================================
-- FUTURE SCHEMA EXPANSION:
-- 3. Services Management (pages/services.html)
--    CREATE TABLE services (
--        id SERIAL PRIMARY KEY,
--        title VARCHAR(150) NOT NULL,
--        slug VARCHAR(150) UNIQUE NOT NULL,
--        category VARCHAR(100) NOT NULL,
--        short_description TEXT NOT NULL,
--        full_description TEXT,
--        icon_name VARCHAR(50),
--        is_active BOOLEAN DEFAULT true,
--        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
--    );
--
-- 4. Careers & Vacancies (pages/careers.html)
--    CREATE TABLE careers (
--        id SERIAL PRIMARY KEY,
--        title VARCHAR(150) NOT NULL,
--        location VARCHAR(100) DEFAULT 'Tanzania',
--        job_type VARCHAR(50) DEFAULT 'Full-time',
--        requirements TEXT NOT NULL,
--        is_open BOOLEAN DEFAULT true,
--        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
--    );
-- ============================================================
