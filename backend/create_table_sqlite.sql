-- Users Table
CREATE TABLE users (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    is_active INTEGER DEFAULT 0, -- BOOLEAN as INTEGER (0 = FALSE, 1 = TRUE)
    account_status TEXT DEFAULT 'PENDING',
    created_by INTEGER,
    approved_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    password_reset_token TEXT,
    password_reset_expires TIMESTAMP,
    ailed_login_attempts INTEGER DEFAULT 0,
    FOREIGN KEY (created_by) REFERENCES users(user_id),
    FOREIGN KEY (approved_by) REFERENCES users(user_id)
);

-- Roles Table
CREATE TABLE roles (
    role_id INTEGER PRIMARY KEY AUTOINCREMENT,
    role_name TEXT UNIQUE NOT NULL,
    description TEXT,
    is_system_role INTEGER DEFAULT 0 -- BOOLEAN as INTEGER
);

-- User Roles Junction Table
CREATE TABLE user_roles (
    user_role_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    role_id INTEGER NOT NULL,
    assigned_by INTEGER NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (role_id) REFERENCES roles(role_id),
    FOREIGN KEY (assigned_by) REFERENCES users(user_id),
    UNIQUE (user_id, role_id)
);

-- User Profiles Table
CREATE TABLE user_profiles (
    profile_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone_number TEXT,
    department TEXT,
    position TEXT,
    profile_image_path TEXT,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- Login Audit Log Table
CREATE TABLE login_audit_log (
    log_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    login_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address TEXT NOT NULL,
    login_status TEXT NOT NULL, -- Enforce ENUM in application logic
    login_type TEXT NOT NULL, -- Enforce ENUM in application logic
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- Permission Matrix Table
CREATE TABLE permission_matrix (
    permission_id INTEGER PRIMARY KEY AUTOINCREMENT,
    role_id INTEGER NOT NULL,
    module_name TEXT NOT NULL,
    can_view INTEGER DEFAULT 0,  -- BOOLEAN as INTEGER
    can_create INTEGER DEFAULT 0,
    can_edit INTEGER DEFAULT 0,
    can_delete INTEGER DEFAULT 0,
    FOREIGN KEY (role_id) REFERENCES roles(role_id),
    UNIQUE (role_id, module_name)
);

-- Indexes for Performance Optimization
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_login_audit_user ON login_audit_log(user_id);
CREATE INDEX idx_login_audit_timestamp ON login_audit_log(login_timestamp);

-- Initial Seed Data for Roles
INSERT INTO roles (role_name, description, is_system_role) VALUES 
('SUPER_ADMIN', 'System Administrator with full access', 1),
('ADMIN', 'Administrative user with limited access', 1),
('USER', 'Standard user with restricted access', 1);

-- Sample Permissions for Roles
INSERT INTO permission_matrix (role_id, module_name, can_view, can_create, can_edit, can_delete)
SELECT role_id, 'USER_MANAGEMENT', 
       CASE WHEN role_name = 'SUPER_ADMIN' THEN 1 WHEN role_name = 'ADMIN' THEN 1 ELSE 0 END,
       CASE WHEN role_name = 'SUPER_ADMIN' THEN 1 WHEN role_name = 'ADMIN' THEN 1 ELSE 0 END,
       CASE WHEN role_name = 'SUPER_ADMIN' THEN 1 WHEN role_name = 'ADMIN' THEN 1 ELSE 0 END,
       CASE WHEN role_name = 'SUPER_ADMIN' THEN 1 ELSE 0 END
FROM roles;

INSERT INTO permission_matrix (role_id, module_name, can_view, can_create, can_edit, can_delete)
SELECT role_id, 'PROFILE_MANAGEMENT', 
       CASE WHEN role_name = 'SUPER_ADMIN' THEN 1 WHEN role_name = 'ADMIN' THEN 1 ELSE 0 END,
       CASE WHEN role_name = 'SUPER_ADMIN' THEN 1 WHEN role_name = 'ADMIN' THEN 1 ELSE 0 END,
       CASE WHEN role_name = 'SUPER_ADMIN' THEN 1 WHEN role_name = 'ADMIN' THEN 1 ELSE 0 END,
       CASE WHEN role_name = 'SUPER_ADMIN' THEN 1 ELSE 0 END
FROM roles;

INSERT INTO permission_matrix (role_id, module_name, can_view, can_create, can_edit, can_delete)
SELECT role_id, 'ROLE_MANAGEMENT', 
       CASE WHEN role_name = 'SUPER_ADMIN' THEN 1 WHEN role_name = 'ADMIN' THEN 1 ELSE 0 END,
       CASE WHEN role_name = 'SUPER_ADMIN' THEN 1 WHEN role_name = 'ADMIN' THEN 1 ELSE 0 END,
       CASE WHEN role_name = 'SUPER_ADMIN' THEN 1 WHEN role_name = 'ADMIN' THEN 1 ELSE 0 END,
       CASE WHEN role_name = 'SUPER_ADMIN' THEN 1 ELSE 0 END
FROM roles;

INSERT INTO permission_matrix (role_id, module_name, can_view, can_create, can_edit, can_delete)
SELECT role_id, 'AUDIT_LOG', 
       CASE WHEN role_name = 'SUPER_ADMIN' THEN 1 WHEN role_name = 'ADMIN' THEN 1 ELSE 0 END,
       CASE WHEN role_name = 'SUPER_ADMIN' THEN 1 WHEN role_name = 'ADMIN' THEN 1 ELSE 0 END,
       CASE WHEN role_name = 'SUPER_ADMIN' THEN 1 WHEN role_name = 'ADMIN' THEN 1 ELSE 0 END,
       CASE WHEN role_name = 'SUPER_ADMIN' THEN 1 ELSE 0 END
FROM roles;
