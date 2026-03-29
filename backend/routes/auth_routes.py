from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, create_refresh_token, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from models import db, User, Company
from services.currency_service import CurrencyService
import re

auth_bp = Blueprint('auth', __name__)

def _get_json_data():
    """Safely parse JSON request body and always return a dict."""
    data = request.get_json(silent=True)
    return data if isinstance(data, dict) else {}


@auth_bp.route('/signup', methods=['POST'])
def signup():
    """
    Create a new company and admin user
    
    Request body:
    {
        "name": "John Doe",
        "email": "john@example.com",
        "password": "password123",
        "company_name": "Acme Corp",
        "country": "United States"
    }
    """
    data = _get_json_data()
    payload = {
        'name': str(data.get('name', '')).strip(),
        'email': str(data.get('email', '')).strip().lower(),
        'password': str(data.get('password', '')).strip(),
        'company_name': str(data.get('company_name', '')).strip(),
        'country': str(data.get('country', '')).strip(),
    }
    
    # Validate required fields
    required_fields = ['name', 'email', 'password', 'company_name', 'country']
    for field in required_fields:
        if not payload.get(field):
            return jsonify({'error': f'{field} is required'}), 400
    
    # Validate email format
    if not re.match(r'^[\w\.-]+@[\w\.-]+\.\w+$', payload['email']):
        return jsonify({'error': 'Invalid email format'}), 400
    
    # Check if user already exists
    existing_user = User.query.filter_by(email=payload['email']).first()
    if existing_user:
        return jsonify({'error': 'Email already registered'}), 400
    
    # Get currency for country
    currency = CurrencyService.get_country_currency(payload['country'])
    if not currency:
        currency = 'USD'  # Default to USD if country not found
    
    try:
        # Create company
        company = Company(
            name=payload['company_name'],
            currency=currency,
            country=payload['country']
        )
        db.session.add(company)
        db.session.flush()  # Get company ID
        
        # Create admin user
        admin_user = User(
            name=payload['name'],
            email=payload['email'],
            password=generate_password_hash(payload['password']),
            role='admin',
            company_id=company.id
        )
        db.session.add(admin_user)
        db.session.commit()
        
        # Generate tokens
        access_token = create_access_token(identity=str(admin_user.id))
        refresh_token = create_refresh_token(identity=str(admin_user.id))
        
        return jsonify({
            'message': 'Company and admin created successfully',
            'access_token': access_token,
            'refresh_token': refresh_token,
            'user': admin_user.to_dict(),
            'company': company.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@auth_bp.route('/login', methods=['POST'])
def login():
    """
    Authenticate user and return JWT tokens
    
    Request body:
    {
        "email": "john@example.com",
        "password": "password123"
    }
    """
    data = _get_json_data()
    email = str(data.get('email', '')).strip().lower()
    password = str(data.get('password', ''))
    
    if not email or not password:
        return jsonify({'error': 'Email and password are required'}), 400
    
    # Find user by email
    user = User.query.filter_by(email=email).first()
    
    if not user or not check_password_hash(user.password, password):
        return jsonify({'error': 'Invalid email or password'}), 401
    
    if not user.is_active:
        return jsonify({'error': 'Account is deactivated'}), 403
    
    # Generate tokens
    access_token = create_access_token(identity=str(user.id))
    refresh_token = create_refresh_token(identity=str(user.id))
    
    return jsonify({
        'message': 'Login successful',
        'access_token': access_token,
        'refresh_token': refresh_token,
        'user': user.to_dict(),
        'company': user.company.to_dict() if user.company else None
    }), 200


@auth_bp.route('/refresh', methods=['POST'])
def refresh():
    """Refresh access token using refresh token"""
    from flask_jwt_extended import verify_jwt_in_request
    
    verify_jwt_in_request(refresh=True)
    current_user_id = get_jwt_identity()
    
    new_access_token = create_access_token(identity=str(current_user_id))
    
    return jsonify({
        'access_token': new_access_token
    }), 200


@auth_bp.route('/change-password', methods=['POST'])
def change_password():
    """Change user password"""
    from decorators import jwt_required, get_current_user_obj
    
    user = get_current_user_obj()
    data = _get_json_data()
    
    if not data.get('current_password') or not data.get('new_password'):
        return jsonify({'error': 'Current and new password are required'}), 400
    
    # Verify current password
    if not check_password_hash(user.password, data['current_password']):
        return jsonify({'error': 'Current password is incorrect'}), 401
    
    # Update password
    user.password = generate_password_hash(data['new_password'])
    db.session.commit()
    
    return jsonify({
        'message': 'Password changed successfully'
    }), 200


@auth_bp.route('/me', methods=['GET'])
def get_current_user_info():
    """Get current authenticated user information"""
    from decorators import jwt_required, get_current_user_obj
    
    user = get_current_user_obj()
    
    return jsonify({
        'user': user.to_dict(include_details=True),
        'company': user.company.to_dict() if user.company else None
    }), 200
