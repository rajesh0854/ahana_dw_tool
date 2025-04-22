from flask import Blueprint, jsonify, request
from modules.license.license_manager import LicenseManager
from modules.login.login import token_required
from modules.admin.admin import admin_required      


# Initialize license manager
license_manager = LicenseManager()

# Create blueprint
license_bp = Blueprint('license', __name__)

@license_bp.route('/license/status', methods=['GET'])
def get_license_status():
    """Get license status without requiring authentication"""
    try:
        status = license_manager.get_license_status()
        response = jsonify({
            'success': True,
            'data': status
        })
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response
    except Exception as e:
        print(f"Error getting license status: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to get license status',
            'message': str(e)
        }), 500

@license_bp.route('/admin/license/activate', methods=['POST'])
@token_required
@admin_required
def activate_license(current_user_id):
    try:
        data = request.get_json()
        if not data:
            return jsonify({
                'success': False,
                'error': 'Invalid request',
                'message': 'No JSON data provided'
            }), 400

        license_key = data.get('license_key')
        if not license_key:
            return jsonify({
                'success': False,
                'error': 'Missing license key',
                'message': 'License key is required'
            }), 400
            
        success, message = license_manager.activate_license(license_key)
        return jsonify({
            'success': success,
            'message': message
        })
    except Exception as e:
        print(f"Error activating license: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'License activation failed',
            'message': str(e)
        }), 500

@license_bp.route('/admin/license/deactivate', methods=['POST'])
@token_required
@admin_required
def deactivate_license(current_user_id):
    try:
        success, message = license_manager.deactivate_license()
        return jsonify({
            'success': success,
            'message': message
        })
    except Exception as e:
        print(f"Error deactivating license: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'License deactivation failed',
            'message': str(e)
        }), 500

# Add CORS preflight handler
@license_bp.route('/license/status', methods=['OPTIONS'])
def handle_license_status_preflight():
    try:
        response = jsonify({
            'success': True,
            'message': 'Preflight request successful'
        })
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', '*')
        response.headers.add('Access-Control-Allow-Methods', 'GET, OPTIONS')
        return response
    except Exception as e:
        print(f"Error handling preflight request: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Preflight request failed',
            'message': str(e)
        }), 500 