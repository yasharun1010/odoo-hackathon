from flask import Blueprint, jsonify, request
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import check_password_hash, generate_password_hash

from ..extensions import db
from ..models import Company, User, ApprovalStep, ApprovalRule
from ..utils.currency import normalize_currency

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


@auth_bp.post("/register")
def register():
    data = request.get_json(silent=True) or {}
    company_name = (data.get("company_name") or "").strip()
    country = (data.get("country") or "").strip()
    currency = normalize_currency(data.get("currency") or "USD")
    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not all([company_name, name, email, password]):
        return jsonify({"error": "Missing required fields"}), 400
    if not currency:
        return jsonify({"error": "Invalid currency code"}), 400
    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Email already registered"}), 400

    company = Company(name=company_name, country=country, currency=currency)
    db.session.add(company)
    db.session.flush()

    admin = User(
        company_id=company.id,
        name=name,
        email=email,
        password_hash=generate_password_hash(password),
        role="admin",
    )
    db.session.add(admin)

    steps = [
        ApprovalStep(company_id=company.id, step_order=1, role="manager"),
        ApprovalStep(company_id=company.id, step_order=2, role="finance"),
        ApprovalStep(company_id=company.id, step_order=3, role="director"),
    ]
    db.session.add_all(steps)

    db.session.add(ApprovalRule(company_id=company.id, rule_type="none"))
    db.session.commit()

    token = create_access_token(identity=admin.id)
    return (
        jsonify(
            {
                "token": token,
                "user": {
                    "id": admin.id,
                    "name": admin.name,
                    "email": admin.email,
                    "role": admin.role,
                    "company_id": admin.company_id,
                },
            }
        ),
        201,
    )


@auth_bp.post("/login")
def login():
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    user = User.query.filter_by(email=email).first()
    if not user or not check_password_hash(user.password_hash, password):
        return jsonify({"error": "Invalid credentials"}), 401

    token = create_access_token(identity=user.id)
    return jsonify(
        {
            "token": token,
            "user": {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "role": user.role,
                "company_id": user.company_id,
            },
        }
    )


@auth_bp.get("/me")
@jwt_required()
def me():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
    return jsonify(
        {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "company_id": user.company_id,
            "manager_id": user.manager_id,
            "is_manager_approver": user.is_manager_approver,
        }
    )
