from functools import wraps
from flask import request, jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
from models import User

def _resolve_current_user():
    """Resolve user object from JWT identity."""
    user_id = get_jwt_identity()
    if user_id is None:
        return None

    try:
        user_id = int(user_id)
    except (TypeError, ValueError):
        return None

    return User.query.get(user_id)


def jwt_required():
    """Decorator to require JWT authentication"""
    def wrapper(fn):
        @wraps(fn)
        def decorator(*args, **kwargs):
            verify_jwt_in_request()
            if _resolve_current_user() is None:
                return jsonify({'error': 'Invalid token user'}), 401
            return fn(*args, **kwargs)
        return decorator
    return wrapper


def admin_required():
    """Decorator to require admin role"""
    def wrapper(fn):
        @wraps(fn)
        def decorator(*args, **kwargs):
            verify_jwt_in_request()
            current_user = _resolve_current_user()
            if current_user is None:
                return jsonify({'error': 'Invalid token user'}), 401
            if current_user.role != 'admin':
                return jsonify({'error': 'Admin access required'}), 403
            return fn(*args, **kwargs)
        return decorator
    return wrapper


def manager_required():
    """Decorator to require manager or admin role"""
    def wrapper(fn):
        @wraps(fn)
        def decorator(*args, **kwargs):
            verify_jwt_in_request()
            current_user = _resolve_current_user()
            if current_user is None:
                return jsonify({'error': 'Invalid token user'}), 401
            if current_user.role not in ['admin', 'manager']:
                return jsonify({'error': 'Manager access required'}), 403
            return fn(*args, **kwargs)
        return decorator
    return wrapper


def get_current_user_id():
    """Get current user ID from JWT token"""
    verify_jwt_in_request()
    current_user = _resolve_current_user()
    return current_user.id if current_user else None


def get_current_user_obj():
    """Get current user object from JWT token"""
    verify_jwt_in_request()
    return _resolve_current_user()
