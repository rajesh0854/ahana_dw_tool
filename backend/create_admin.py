import sqlite3
import hashlib
import secrets
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import os

# Database setup
default_db_url = "sqlite:///./sqlite_app.db"  # Default SQLite database path
engine = create_engine(os.getenv('SQLITE_DATABASE_URL', default_db_url))
Session = sessionmaker(bind=engine)


def generate_salt() -> str:
    """Generate a cryptographically secure salt"""
    return secrets.token_hex(16)

def hash_password(password: str, salt: str) -> str:
    """Hash password using SHA-512 with salt"""
    return hashlib.sha512((password + salt).encode()).hexdigest()

def create_admin_user():
    """Create an admin user with proper password hashing"""
    session = Session()

    try:
        # Check if admin user already exists
        check_user = text("SELECT user_id FROM users WHERE username = :username OR email = :email")
        existing_user = session.execute(
            check_user, 
            {'username': 'admin2', 'email': 'admin2@ahanait.com'}
        ).scalar()
        
        if existing_user:
            print("Admin user already exists!")
            return

        # Generate salt and hash password
        password = "Test#1234"
        salt = generate_salt()
        password_hash = hash_password(password, salt)
        
        # Insert admin user using SQLAlchemy text()
        user_query = text("""
        INSERT INTO users (
            username, email, password_hash, salt, account_status, 
            is_active, created_at
        ) VALUES (
            :username, :email, :password_hash, :salt, 
            'ACTIVE', 1, CURRENT_TIMESTAMP
        ) RETURNING user_id
        """)
        
        result = session.execute(
            user_query, 
            {
                'username': 'admin2',
                'email': 'admin2@ahanait.com',
                'password_hash': password_hash,
                'salt': salt
            }
        )
        user_id = result.scalar()
        
        # Get admin role ID
        role_query = text("SELECT role_id FROM roles WHERE role_name = 'SUPER_ADMIN'")
        role_result = session.execute(role_query).scalar()
        
        if role_result:
            # Assign admin role to user
            role_assign_query = text("""
            INSERT INTO user_roles (
                user_id, role_id, assigned_by, assigned_at
            ) VALUES (
                :user_id, :role_id, :assigned_by, CURRENT_TIMESTAMP
            )
            """)
            session.execute(
                role_assign_query,
                {'user_id': user_id, 'role_id': role_result, 'assigned_by': user_id}
            )
            
            # Create user profile
            profile_query = text("""
            INSERT INTO user_profiles (
                user_id, first_name, last_name, phone_number, 
                department, position
            ) VALUES (
                :user_id, :first_name, :last_name, :phone, 
                :dept, :position
            )
            """)
            session.execute(
                profile_query,
                {
                    'user_id': user_id,
                    'first_name': 'Admin2',
                    'last_name': 'Admin2',
                    'phone': '1234567890',
                    'dept': 'IT',
                    'position': 'System Administrator'
                }
            )
            
            session.commit()
            print("Admin user created successfully!")
            print(f"Username: admin2")
            print(f"Password: Test#1234")
        else:
            print("Error: SUPER_ADMIN role not found!")
            session.rollback()
            
    except Exception as e:
        print(f"Error creating admin user: {str(e)}")
        session.rollback()
    finally:
        session.close()

if __name__ == "__main__":
    create_admin_user() 