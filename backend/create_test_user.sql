-- Insert a test admin user
INSERT INTO users (username, email, password_hash, salt, is_active, account_status, created_at)
VALUES ('admin', 'admin@example.com', 'hash_here', 'salt_here', 1, 'ACTIVE', CURRENT_TIMESTAMP);

-- Get the user_id of the admin user we just created
SELECT user_id FROM users WHERE username = 'admin';

-- Create admin profile
INSERT INTO user_profiles (user_id, first_name, last_name, department, position)
VALUES (1, 'Admin', 'User', 'IT', 'Administrator');

-- Assign admin role
INSERT INTO user_roles (user_id, role_id, assigned_by)
SELECT 1, role_id, 1
FROM roles 
WHERE role_name = 'ADMIN'; 