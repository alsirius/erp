-- Siriux Database Schema (Adapted from Smartify Ticket-Mix proven patterns)
-- SQLite database schema for roster management system

-- Users table (based on Smartify users_tbl)
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY, -- Changed from INTEGER AUTOINCREMENT to TEXT for UUID
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'user' CHECK(role IN ('admin', 'manager', 'user')) NOT NULL,
    department TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'active', 'disabled', 'rejected', 'reactivation_requested', 'soft_deleted')),
    deleted INTEGER DEFAULT 0,
    approval_code TEXT DEFAULT '',
    phone TEXT,
    bio TEXT,
    email_verified INTEGER DEFAULT 0,
    profile_image_url TEXT,
    requires_approval INTEGER DEFAULT 0,
    approved_by TEXT,
    approved_at DATETIME
);

-- Registration codes table (from Smartify)
CREATE TABLE IF NOT EXISTS registration_codes (
    id TEXT PRIMARY KEY, -- Changed from INTEGER to TEXT for UUID
    code TEXT UNIQUE NOT NULL,
    created_by TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    used_by TEXT DEFAULT NULL,
    used_at DATETIME,
    usable_by TEXT DEFAULT 'anyone',
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (used_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Email verification table (from Smartify)
CREATE TABLE IF NOT EXISTS email_verification (
    id TEXT PRIMARY KEY, -- Changed from INTEGER to TEXT for UUID
    email TEXT NOT NULL,
    verification_code TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL,
    verified INTEGER DEFAULT 0,
    registration_data TEXT
);

-- Password reset tokens (adapted from email_verification)
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    token TEXT UNIQUE NOT NULL,
    expires_at DATETIME NOT NULL,
    used_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_active INTEGER DEFAULT 1,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Rosters table (Siriux-specific)
CREATE TABLE IF NOT EXISTS rosters (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    created_by TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_active INTEGER DEFAULT 1,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Roster members table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS roster_members (
    id TEXT PRIMARY KEY,
    roster_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'member',
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (roster_id) REFERENCES rosters(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(roster_id, user_id)
);

-- Sessions table for token management
CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_active INTEGER DEFAULT 1,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Views for better compatibility
CREATE VIEW IF NOT EXISTS users_view AS SELECT * FROM users WHERE deleted = 0;

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(deleted);
CREATE INDEX IF NOT EXISTS idx_users_email_verification ON users(approval_code);
CREATE INDEX IF NOT EXISTS idx_registration_codes_code ON registration_codes(code);
CREATE INDEX IF NOT EXISTS idx_registration_codes_active ON registration_codes(used_by);
CREATE INDEX IF NOT EXISTS idx_email_verification_email ON email_verification(email);
CREATE INDEX IF NOT EXISTS idx_email_verification_code ON email_verification(verification_code);
CREATE INDEX IF NOT EXISTS idx_password_reset_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_user ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_rosters_created_by ON rosters(created_by);
CREATE INDEX IF NOT EXISTS idx_rosters_active ON rosters(is_active);
CREATE INDEX IF NOT EXISTS idx_roster_members_roster_id ON roster_members(roster_id);
CREATE INDEX IF NOT EXISTS idx_roster_members_user_id ON roster_members(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_refresh_token ON sessions(refresh_token);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

-- Triggers for automatic timestamp updates
CREATE TRIGGER IF NOT EXISTS update_users_timestamp 
    AFTER UPDATE ON users
    BEGIN
        UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS update_rosters_timestamp 
    AFTER UPDATE ON rosters
    BEGIN
        UPDATE rosters SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

-- Insert default admin user (password: admin123)
-- Note: In production, this should be done through a proper setup process
INSERT OR IGNORE INTO users (
    id, 
    first_name, 
    last_name, 
    email, 
    password_hash, 
    role, 
    status,
    email_verified
) VALUES (
    'admin-' || substr(lower(hex(randomblob(32))), 1, 8),
    'System',
    'Administrator',
    'admin@siriux.com',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6ukx.LFvO.', -- admin123
    'admin',
    'active',
    1 -- Email verified for admin
);
