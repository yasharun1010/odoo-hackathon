from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required
from werkzeug.security import generate_password_hash

from ..extensions import db
from ..models import User
from ..utils.auth import role_required

users_bp = Blueprint("users", __name__, url_prefix="/api/users")


@users_bp.get("")
@role_required("admin")
def list_users():
    admin_id = get_jwt_identity()
    admin = User.query.get(admin_id)
    users = (
        User.query.filter_by(company_id=admin.company_id)
        .order_by(User.created_at.desc())
        .all()
    )
    return jsonify(
        [
            {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "role": user.role,
                "manager_id": user.manager_id,
                "is_manager_approver": user.is_manager_approver,
            }
            for user in users
        ]
    )


@users_bp.post("")
@role_required("admin")
def create_user():
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    role = (data.get("role") or "employee").strip().lower()
    manager_id = data.get("manager_id")
    is_manager_approver = bool(data.get("is_manager_approver", True))

    if not name or not email or not password:
        return jsonify({"error": "Missing required fields"}), 400
    if role not in {"admin", "manager", "employee", "finance", "director"}:
        return jsonify({"error": "Invalid role"}), 400
    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Email already registered"}), 400

    admin_id = get_jwt_identity()
    admin = User.query.get(admin_id)

    user = User(
        company_id=admin.company_id,
        name=name,
        email=email,
        password_hash=generate_password_hash(password),
        role=role,
        manager_id=manager_id,
        is_manager_approver=is_manager_approver,
    )
    db.session.add(user)
    db.session.commit()
    return (
        jsonify(
            {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "role": user.role,
                "manager_id": user.manager_id,
                "is_manager_approver": user.is_manager_approver,
            }
        ),
        201,
    )


@users_bp.patch("/<int:user_id>")
@role_required("admin")
def update_user(user_id: int):
    data = request.get_json(silent=True) or {}
    admin_id = get_jwt_identity()
    admin = User.query.get(admin_id)

    user = User.query.filter_by(id=user_id, company_id=admin.company_id).first()
    if not user:
        return jsonify({"error": "User not found"}), 404

    if "role" in data:
        role = (data.get("role") or "").strip().lower()
        if role not in {"admin", "manager", "employee", "finance", "director"}:
            return jsonify({"error": "Invalid role"}), 400
        user.role = role
    if "manager_id" in data:
        user.manager_id = data.get("manager_id")
    if "is_manager_approver" in data:
        user.is_manager_approver = bool(data.get("is_manager_approver"))

    db.session.commit()
    return jsonify(
        {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "manager_id": user.manager_id,
            "is_manager_approver": user.is_manager_approver,
        }
    )
