Develop a robust user management system for an existing Next.js and Python application, focusing on security, role-based access control, and comprehensive user lifecycle management.

Keep in mind that the existing backend code is created using plain flask. create multiple python files if required apart from app.py.

## 1. Authentication System Requirements

### 1.1 Login Functionality
- Implement a secure login mechanism using the following workflow:
  - Frontend: Create a login form with username/email and password fields
  - Backend: Implement authentication with the following security measures:
    - Use SHA-512 hashing with unique salt for password verification
    - Implement dynamic salt generation during user registration
    - Validate input on both frontend and backend
    - Enforce strong password policy
      - Minimum 8 characters
      - Require mix of uppercase, lowercase, numbers, and special characters
    - Implement login attempt tracking and account lockout mechanism
      - Lock account after 5 consecutive failed attempts
      - Implement 15-minute cooldown period for locked accounts

### 1.2 Password Management
- Develop comprehensive password management features:
  - Forgot Password Workflow
    - Generate time-limited (30-minute) cryptographically secure reset token
    - Send password reset link via email with token
    - Implement secure token validation mechanism
  - Password Reset Process
    - Validate new password against strength requirements
    - Prevent reuse of last 5 previous passwords
    - Mandatory password change every 90 days
  - Implement secure password storage
    - Use adaptive hashing (bcrypt or Argon2 recommended)
    - Store salt separately
    - Never store plain-text passwords

## 2. Admin User Management System

### 2.1 Maker-Checker Workflow
- Implement a comprehensive maker-checker (four-eyes principle) system:
  - User Creation Flow
    1. Initial admin creates user account (PENDING status)
    2. Second admin must approve the account
    3. Track and log all creation and approval actions
  - User Modification Process
    1. Changes proposed by one admin
    2. Require approval from another admin
    3. Maintain audit trail of all modifications

### 2.2 Admin Dashboard Features
- Develop an admin dashboard with the following capabilities:
  - User Management
    - Create new users
    - Modify user details
    - Activate/Deactivate user accounts
    - Reset user passwords
  - Role Management
    - Create and manage user roles
    - Assign/modify user roles
    - Define granular permissions for each role
  - Audit Logging
    - Comprehensive logging of all administrative actions
    - Ability to view and export audit logs

## 3. User Profile Management

### 3.1 Profile Creation and Management
- Implement user profile system:
  - Allow users to create and update profile information
  - Implement role-based access to profile editing
  - Add profile picture upload functionality
    - Implement file type and size restrictions
    - Generate and store thumbnails
    - Validate image content

## 4. Security Considerations

### 4.1 Frontend Security
- Implement client-side security measures:
  - Input validation and sanitization
  - Use of secure, httpOnly cookies
  - CSRF token implementation
  - Prevent XSS attacks
  - Implement rate limiting on authentication endpoints

### 4.2 Backend Security
- Implement comprehensive backend security:
  - Use environment-based configuration management
  - Implement JWT or session-based authentication
  - Secure API endpoints with role-based access control
  - Implement IP-based access restrictions
  

### 4.3 Encryption and Hashing
- Enhance existing SHA-512 and salting approach:
  - Use adaptive hashing algorithms (Argon2 or bcrypt)
  - Implement dynamic salt generation
  - Use secure random number generation for salts
  - Implement key stretching for password hashing

## 5. Additional Features

### 5.1 Notification System
- Develop a notification mechanism:
  - Email notifications for:
    - Account creation
    - Password changes
  - In-app notification system

### 5.2 Compliance and Logging
- Implement comprehensive logging:
  - Capture all authentication attempts
  - Log administrative actions
  - Implement log rotation and archiving
  - Ensure compliance with data protection regulations

## 6. Technical Implementation Details

### 6.1 Technology Stack
- Frontend: Next.js with next js
- Backend: Python plain flask
- Database: PostgreSQL
- Authentication Library: Depends on your current implementation

### 6.2 Recommended Libraries
- Frontend:
  - Axios for API calls
  - React Hook Form for form management
  - Zod for validation
  - material ui or antd components and animations
  - 
- Backend:
  - Passlib for password hashing
  - PyJWT for token management
  - SQLAlchemy for database related operations
- Security:
  - python-jose for token generation
  - cryptography library for advanced encryption

## Deliverables
1. Complete implementation of all specified features
2. design modern styling and layout for frontend pages
3. use javascript for front end code.

