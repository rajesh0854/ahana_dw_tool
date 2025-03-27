from flask import Blueprint, request, jsonify
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv
from login import token_required, hash_password, generate_salt, is_valid_password
from datetime import datetime

load_dotenv()

# Database setup
engine = create_engine(os.getenv('SQLITE_DATABASE_URL'))
Session = sessionmaker(bind=engine)

# Blueprint setup
admin_bp = Blueprint('admin', __name__)

def check_admin_permission(user_id):
    session = Session()
    try:
        # Check if user has admin role
        result = session.execute(
            text("""
                SELECT r.role_name 
                FROM user_roles ur 
                JOIN roles r ON ur.role_id = r.role_id 
                WHERE ur.user_id = :user_id 
                AND r.role_name IN ('SUPER_ADMIN', 'ADMIN')
            """),
            {'user_id': user_id}
        ).fetchone()
        return bool(result)
    finally:
        session.close()

def admin_required(f):
    def decorated(current_user_id, *args, **kwargs):
        if not check_admin_permission(current_user_id):
            return jsonify({'error': 'Admin privileges required'}), 403
        return f(current_user_id, *args, **kwargs)
    decorated.__name__ = f.__name__
    return decorated

@admin_bp.route('/users', methods=['GET'])
@token_required
@admin_required
def get_users(current_user_id):
    try:
        session = Session()
        users = session.execute(
            text("""
                SELECT u.*, GROUP_CONCAT(r.role_name) as roles
                FROM users u
                LEFT JOIN user_roles ur ON u.user_id = ur.user_id
                LEFT JOIN roles r ON ur.role_id = r.role_id
                GROUP BY u.user_id
            """)
        ).fetchall()
        
        users_list = []
        for user in users:
            user_dict = dict(user)
            user_dict['roles'] = user_dict['roles'].split(',') if user_dict['roles'] else []
            users_list.append(user_dict)
            
        return jsonify(users_list)
    except Exception as e:
        print(f"Error getting users: {str(e)}")
        return jsonify({'error': 'Failed to retrieve users'}), 500
    finally:
        session.close()

@admin_bp.route('/users', methods=['POST'])
@token_required
@admin_required
def create_user(current_user_id):
    try:
        data = request.get_json()
        required_fields = ['username', 'email', 'password', 'first_name', 'last_name']
        
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
                
        if not is_valid_password(data['password']):
            return jsonify({
                'error': 'Password must be at least 8 characters long and contain uppercase, lowercase, numbers, and special characters'
            }), 400
            
        session = Session()
        
        # Check if username or email already exists
        existing_user = session.execute(
            text("SELECT user_id FROM users WHERE username = :username OR email = :email"),
            {'username': data['username'], 'email': data['email']}
        ).fetchone()
        
        if existing_user:
            return jsonify({'error': 'Username or email already exists'}), 400
            
        # Generate password hash and salt
        salt = generate_salt()
        password_hash = hash_password(data['password'], salt)
        
        # Create user
        result = session.execute(
            text("""
                INSERT INTO users (username, email, password_hash, salt, created_by, account_status)
                VALUES (:username, :email, :password_hash, :salt, :created_by, 'PENDING')
                RETURNING user_id
            """),
            {
                'username': data['username'],
                'email': data['email'],
                'password_hash': password_hash,
                'salt': salt,
                'created_by': current_user_id
            }
        )
        user_id = result.fetchone()[0]
        
        # Create user profile
        session.execute(
            text("""
                INSERT INTO user_profiles (user_id, first_name, last_name)
                VALUES (:user_id, :first_name, :last_name)
            """),
            {
                'user_id': user_id,
                'first_name': data['first_name'],
                'last_name': data['last_name']
            }
        )
        
        # Assign roles if provided
        if 'roles' in data and isinstance(data['roles'], list):
            for role_name in data['roles']:
                role = session.execute(
                    text("SELECT role_id FROM roles WHERE role_name = :role_name"),
                    {'role_name': role_name}
                ).fetchone()
                
                if role:
                    session.execute(
                        text("""
                            INSERT INTO user_roles (user_id, role_id, assigned_by)
                            VALUES (:user_id, :role_id, :assigned_by)
                        """),
                        {
                            'user_id': user_id,
                            'role_id': role.role_id,
                            'assigned_by': current_user_id
                        }
                    )
        
        session.commit()
        return jsonify({'message': 'User created successfully', 'user_id': user_id}), 201
        
    except Exception as e:
        print(f"Error creating user: {str(e)}")
        return jsonify({'error': 'Failed to create user'}), 500
    finally:
        session.close()

@admin_bp.route('/users/<int:user_id>/approve', methods=['POST'])
@token_required
@admin_required
def approve_user(current_user_id, user_id):
    try:
        session = Session()
        
        # Check if user exists and is pending
        user = session.execute(
            text("SELECT * FROM users WHERE user_id = :user_id AND account_status = 'PENDING'"),
            {'user_id': user_id}
        ).fetchone()
        
        if not user:
            return jsonify({'error': 'User not found or not in pending status'}), 404
            
        # Check if approver is different from creator
        if user.created_by == current_user_id:
            return jsonify({'error': 'Creator cannot approve their own user creation'}), 403
            
        # Approve user
        session.execute(
            text("""
                UPDATE users 
                SET account_status = 'ACTIVE',
                    is_active = 1,
                    approved_by = :approved_by
                WHERE user_id = :user_id
            """),
            {
                'user_id': user_id,
                'approved_by': current_user_id
            }
        )
        
        session.commit()
        return jsonify({'message': 'User approved successfully'})
        
    except Exception as e:
        print(f"Error approving user: {str(e)}")
        return jsonify({'error': 'Failed to approve user'}), 500
    finally:
        session.close()

@admin_bp.route('/users/<int:user_id>', methods=['PUT'])
@token_required
@admin_required
def update_user(current_user_id, user_id):
    try:
        data = request.get_json()
        session = Session()
        
        # Check if user exists
        user = session.execute(
            text("SELECT * FROM users WHERE user_id = :user_id"),
            {'user_id': user_id}
        ).fetchone()
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
            
        # Update user fields
        if 'email' in data:
            session.execute(
                text("UPDATE users SET email = :email WHERE user_id = :user_id"),
                {'email': data['email'], 'user_id': user_id}
            )
            
        # Update profile fields
        profile_fields = ['first_name', 'last_name']
        profile_updates = {k: v for k, v in data.items() if k in profile_fields}
        
        if profile_updates:
            update_query = "UPDATE user_profiles SET " + \
                         ", ".join(f"{k} = :{k}" for k in profile_updates.keys()) + \
                         " WHERE user_id = :user_id"
            profile_updates['user_id'] = user_id
            session.execute(text(update_query), profile_updates)
            
        # Update roles if provided
        if 'roles' in data and isinstance(data['roles'], list):
            # Remove existing roles
            session.execute(
                text("DELETE FROM user_roles WHERE user_id = :user_id"),
                {'user_id': user_id}
            )
            
            # Add new roles
            for role_name in data['roles']:
                role = session.execute(
                    text("SELECT role_id FROM roles WHERE role_name = :role_name"),
                    {'role_name': role_name}
                ).fetchone()
                
                if role:
                    session.execute(
                        text("""
                            INSERT INTO user_roles (user_id, role_id, assigned_by)
                            VALUES (:user_id, :role_id, :assigned_by)
                        """),
                        {
                            'user_id': user_id,
                            'role_id': role.role_id,
                            'assigned_by': current_user_id
                        }
                    )
        
        session.commit()
        return jsonify({'message': 'User updated successfully'})
        
    except Exception as e:
        print(f"Error updating user: {str(e)}")
        return jsonify({'error': 'Failed to update user'}), 500
    finally:
        session.close()

@admin_bp.route('/users/<int:user_id>/status', methods=['POST'])
@token_required
@admin_required
def change_user_status(current_user_id, user_id):
    try:
        data = request.get_json()
        is_active = data.get('is_active')
        
        if is_active is None:
            return jsonify({'error': 'is_active status is required'}), 400
            
        session = Session()
        
        # Check if user exists
        user = session.execute(
            text("SELECT * FROM users WHERE user_id = :user_id"),
            {'user_id': user_id}
        ).fetchone()
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
            
        # Update user status
        session.execute(
            text("UPDATE users SET is_active = :is_active WHERE user_id = :user_id"),
            {'is_active': 1 if is_active else 0, 'user_id': user_id}
        )
        
        session.commit()
        return jsonify({'message': f"User {'activated' if is_active else 'deactivated'} successfully"})
        
    except Exception as e:
        print(f"Error changing user status: {str(e)}")
        return jsonify({'error': 'Failed to change user status'}), 500
    finally:
        session.close()

@admin_bp.route('/roles', methods=['GET'])
@token_required
@admin_required
def get_roles(current_user_id):
    try:
        session = Session()
        roles = session.execute(text("SELECT * FROM roles")).fetchall()
        return jsonify([dict(role) for role in roles])
    except Exception as e:
        print(f"Error getting roles: {str(e)}")
        return jsonify({'error': 'Failed to retrieve roles'}), 500
    finally:
        session.close()

@admin_bp.route('/audit-logs', methods=['GET'])
@token_required
@admin_required
def get_audit_logs(current_user_id):
    try:
        session = Session()
        logs = session.execute(
            text("""
                SELECT l.*, u.username, u2.username as target_username
                FROM login_audit_log l
                JOIN users u ON l.user_id = u.user_id
                LEFT JOIN users u2 ON l.target_user_id = u2.user_id
                ORDER BY login_timestamp DESC
                LIMIT 1000
            """)
        ).fetchall()
        return jsonify([dict(log) for log in logs])
    except Exception as e:
        print(f"Error getting audit logs: {str(e)}")
        return jsonify({'error': 'Failed to retrieve audit logs'}), 500
    finally:
        session.close() 