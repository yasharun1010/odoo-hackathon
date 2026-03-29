from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash
from models import db, User
from decorators import jwt_required, admin_required, get_current_user_obj

user_bp = Blueprint('users', __name__)


@user_bp.route('/', methods=['GET'])
@admin_required()
def get_all_users():
    """Get all users in the company (Admin only)"""
    current_user = get_current_user_obj()
    
    # Filter by company
    users = User.query.filter_by(company_id=current_user.company_id).all()
    
    return jsonify({
        'users': [user.to_dict() for user in users]
    }), 200


@user_bp.route('/<int:user_id>', methods=['GET'])
@admin_required()
def get_user(user_id):
    """Get specific user details (Admin only)"""
    current_user = get_current_user_obj()
    
    user = User.query.filter_by(id=user_id, company_id=current_user.company_id).first()
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    return jsonify({
        'user': user.to_dict(include_details=True)
    }), 200


@user_bp.route('/', methods=['POST'])
@admin_required()
def create_user():
    """
    Create a new user (Admin only)
    
    Request body:
    {
        "name": "Jane Smith",
        "email": "jane@example.com",
        "password": "password123",
        "role": "employee",  // or "manager"
        "manager_id": 1  // Optional: ID of the manager
    }
    """
    current_user = get_current_user_obj()
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['name', 'email', 'password', 'role']
    for field in required_fields:
        if not data.get(field):
            return jsonify({'error': f'{field} is required'}), 400
    
    # Validate role
    if data['role'] not in ['admin', 'manager', 'employee']:
        return jsonify({'error': 'Invalid role'}), 400
    
    # Check if email already exists
    existing_user = User.query.filter_by(email=data['email']).first()
    if existing_user:
        return jsonify({'error': 'Email already registered'}), 400
    
    # Validate manager if provided
    manager = None
    if data.get('manager_id'):
        manager = User.query.filter_by(
            id=data['manager_id'],
            company_id=current_user.company_id
        ).first()
        if not manager:
            return jsonify({'error': 'Manager not found'}), 404
        
        # Ensure manager has appropriate role
        if manager.role not in ['admin', 'manager']:
            return jsonify({'error': 'Selected user is not a manager'}), 400
    
    try:
        user = User(
            name=data['name'],
            email=data['email'],
            password=generate_password_hash(data['password']),
            role=data['role'],
            company_id=current_user.company_id,
            manager_id=data.get('manager_id'),
            is_active=True
        )
        db.session.add(user)
        db.session.commit()
        
        return jsonify({
            'message': 'User created successfully',
            'user': user.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@user_bp.route('/<int:user_id>', methods=['PUT'])
@admin_required()
def update_user(user_id):
    """
    Update user details (Admin only)
    
    Request body:
    {
        "name": "Jane Smith",
        "email": "jane@example.com",
        "role": "manager",
        "manager_id": 1,
        "is_active": true
    }
    """
    current_user = get_current_user_obj()
    data = request.get_json()
    
    user = User.query.filter_by(id=user_id, company_id=current_user.company_id).first()
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    # Prevent modifying own role
    if user.id == current_user.id and data.get('role') and data['role'] != user.role:
        return jsonify({'error': 'Cannot change your own role'}), 403
    
    # Update fields
    if data.get('name'):
        user.name = data['name']
    
    if data.get('email'):
        # Check if email is taken by another user
        existing = User.query.filter_by(email=data['email']).first()
        if existing and existing.id != user_id:
            return jsonify({'error': 'Email already in use'}), 400
        user.email = data['email']
    
    if data.get('role') and data['role'] in ['admin', 'manager', 'employee']:
        user.role = data['role']
    
    if data.get('manager_id'):
        # Validate manager
        manager = User.query.filter_by(
            id=data['manager_id'],
            company_id=current_user.company_id
        ).first()
        if manager:
            user.manager_id = data['manager_id']
    
    if data.get('is_active') is not None:
        user.is_active = data['is_active']
    
    try:
        db.session.commit()
        return jsonify({
            'message': 'User updated successfully',
            'user': user.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@user_bp.route('/<int:user_id>/reset-password', methods=['POST'])
@admin_required()
def reset_password(user_id):
    """Reset user password (Admin only)"""
    current_user = get_current_user_obj()
    data = request.get_json()
    
    user = User.query.filter_by(id=user_id, company_id=current_user.company_id).first()
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    if not data.get('new_password'):
        return jsonify({'error': 'New password is required'}), 400
    
    user.password = generate_password_hash(data['new_password'])
    
    try:
        db.session.commit()
        return jsonify({
            'message': 'Password reset successfully'
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@user_bp.route('/managers', methods=['GET'])
@admin_required()
def get_managers():
    """Get all managers in the company (Admin only)"""
    current_user = get_current_user_obj()
    
    managers = User.query.filter_by(
        company_id=current_user.company_id,
        role='manager'
    ).all()
    
    return jsonify({
        'managers': [manager.to_dict() for manager in managers]
    }), 200


@user_bp.route('/subordinates', methods=['GET'])
@jwt_required()
def get_subordinates():
    """Get current user's subordinates (Managers only)"""
    current_user = get_current_user_obj()
    
    if current_user.role not in ['admin', 'manager']:
        return jsonify({'error': 'Only managers can view subordinates'}), 403
    
    subordinates = User.query.filter_by(manager_id=current_user.id).all()
    
    return jsonify({
        'subordinates': [s.to_dict() for s in subordinates]
    }), 200
